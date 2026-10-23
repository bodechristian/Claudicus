import type { McpServerRuntimeView } from "@claudicus/domain";
import { defineStore } from "pinia";
import { ref } from "vue";
import { getServers, patchServer } from "../lib/api.js";

export const useServersStore = defineStore("servers", () => {
  const servers = ref<McpServerRuntimeView[]>([]);

  function applyUpdate(updated: McpServerRuntimeView): void {
    const index = servers.value.findIndex((server) => server.id === updated.id);
    if (index !== -1) {
      servers.value[index] = updated;
    }
  }

  async function load(): Promise<void> {
    servers.value = await getServers();
  }

  async function setSelected(id: string, selected: boolean): Promise<void> {
    applyUpdate(await patchServer(id, { selected }));
  }

  async function setHeaders(id: string, headers: Record<string, string>): Promise<void> {
    applyUpdate(await patchServer(id, { headers }));
  }

  return { servers, load, setSelected, setHeaders };
});
