import { randomUUID } from "node:crypto";
import type Anthropic from "@anthropic-ai/sdk";
import type { Message, ToolCallInfo } from "@claudicus/domain";
import { anthropic } from "../claude/anthropic-client.js";
import { getActiveSystemPrompt } from "../claude/system-prompt-registry.js";
import { config } from "../config.js";
import { appendMessage /*, getMessageHistory */ } from "../db/repositories/chat-message-repository.js";
import { callTool } from "../mcp/mcp-client-manager.js";
import { broadcast } from "../ws/connection-registry.js";
import { computeMergedTools, findByNamespacedName, toClaudeTools } from "./tool-aggregator.js";

export async function handleUserMessage(content: string): Promise<void> {
  // History currently not appended. Should in future.
  // const history: Anthropic.MessageParam[] = getMessageHistory()
  //   .filter((message) => message.content.length > 0)
  //   .map((message) => ({ role: message.role, content: message.content }));

  const userMessage: Message = {
    id: randomUUID(),
    role: "user",
    content,
    createdAt: new Date().toISOString(),
  };
  appendMessage(userMessage);
  broadcast({ type: "chat:message", payload: { message: userMessage } });

  const conversation: Anthropic.MessageParam[] = [/* ...history, */ { role: "user", content }];
  const toolCalls: ToolCallInfo[] = [];
  const assistantMessageId = randomUUID();
  let finalText = "";

  broadcast({ type: "chat:messageStart", payload: { messageId: assistantMessageId, role: "assistant" } });

  for (;;) {
    const descriptors = await computeMergedTools();

    const stream = anthropic.messages.stream({
      model: config.anthropicModel,
      max_tokens: 4096,
      system: getActiveSystemPrompt(),
      messages: conversation,
      tools: toClaudeTools(descriptors) as Anthropic.Tool[],
    });

    stream.on("text", (delta) => {
      finalText += delta;
      broadcast({ type: "chat:token", payload: { messageId: assistantMessageId, token: delta } });
    });

    const response = await stream.finalMessage();
    conversation.push({ role: "assistant", content: response.content });

    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    if (toolUseBlocks.length === 0) {
      break;
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of toolUseBlocks) {
      const descriptor = findByNamespacedName(descriptors, block.name);
      if (!descriptor) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: `Unknown tool: ${block.name}`,
          is_error: true,
        });
        continue;
      }

      const toolCallInfo: ToolCallInfo = {
        id: block.id,
        serverId: descriptor.serverId,
        toolName: descriptor.originalName,
        input: block.input,
        status: "running",
      };
      toolCalls.push(toolCallInfo);
      broadcast({
        type: "tool:call",
        payload: {
          toolCallId: block.id,
          messageId: assistantMessageId,
          serverId: descriptor.serverId,
          toolName: descriptor.originalName,
          input: block.input,
        },
      });

      try {
        const result = await callTool(descriptor.serverId, block.id, descriptor.originalName, block.input);
        toolCallInfo.status = "success";
        toolCallInfo.result = result;
        broadcast({ type: "tool:status", payload: { toolCallId: block.id, status: "success", result } });
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result) });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toolCallInfo.status = "error";
        toolCallInfo.error = errorMessage;
        broadcast({ type: "tool:status", payload: { toolCallId: block.id, status: "error", error: errorMessage } });
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: errorMessage, is_error: true });
      }
    }

    conversation.push({ role: "user", content: toolResults });
  }

  const assistantMessage: Message = {
    id: assistantMessageId,
    role: "assistant",
    content: finalText,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    createdAt: new Date().toISOString(),
  };
  appendMessage(assistantMessage);
  broadcast({ type: "chat:messageEnd", payload: { messageId: assistantMessageId } });
}
