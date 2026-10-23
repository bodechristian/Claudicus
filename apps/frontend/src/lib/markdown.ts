import hljs from "highlight.js";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  highlight(code: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
});

export function renderMarkdown(text: string): string {
  return md.render(text);
}
