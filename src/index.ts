import type { Plugin } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin/tool";

const z = tool.schema;

export const plugin: Plugin = async ({ client }) => {
  return {
    tool: {
      scan_project: tool({
        description:
          "扫描当前项目的文件结构。返回文件列表和目录结构，用于构建苏格拉底式提问的项目上下文。",
        args: {
          path: z
            .string()
            .optional()
            .describe("要扫描的目录路径，默认为项目根目录"),
        },
        async execute(args, ctx) {
          const targetDir = args.path || ctx.directory;

          try {
            const result = await client.file.list({
              query: { path: targetDir },
            });

            if (!result.data) {
              return "无法获取文件列表。请直接用 glob/read 工具查看项目结构。";
            }

            const entries = result.data as Array<{ path: string; type: string }>;
            if (entries.length === 0) {
              return "项目目录为空，还没有代码文件。";
            }

            const files = entries
              .map((f) => {
                const icon = f.type === "directory" ? "📁" : "📄";
                return `${icon} ${f.path}`;
              })
              .join("\n");

            return `## 项目文件结构\n\nRoot: ${targetDir}\n\n${files}`;
          } catch {
            return `无法扫描目录: ${targetDir}。请直接用 glob/read 工具查看项目结构。`;
          }
        },
      }),

      analyze_session: tool({
        description:
          "分析当前会话的对话历史，提取关键操作（创建/修改/删除文件）和讨论摘要。用于构建苏格拉底式提问的会话上下文。",
        args: {
          session_id: z
            .string()
            .optional()
            .describe("会话 ID，默认为当前会话"),
        },
        async execute(args, ctx) {
          const sid = args.session_id || ctx.sessionID;

          try {
            const sessionInfo = await client.session.get({
              path: { id: sid },
            });

            const messagesResult = await client.session.messages({
              path: { id: sid },
            });

            let summary = `## 会话摘要\n\nSession: ${sid}\n`;

            if (sessionInfo.data) {
              const info = sessionInfo.data as Record<string, unknown>;
              summary += `Title: ${info.title || "Untitled"}\n`;
            }

            if (!messagesResult.data || !Array.isArray(messagesResult.data)) {
              summary += "\n没有可用的对话历史。\n";
              return summary;
            }

            const messages = messagesResult.data;
            summary += `消息总数: ${messages.length}\n\n`;

            const actions: string[] = [];
            for (const msg of messages) {
              const m = msg as Record<string, unknown>;
              if (m.role === "assistant" && m.parts) {
                for (const part of m.parts as Array<Record<string, unknown>>) {
                  if (part.type === "text" && typeof part.text === "string") {
                    const text = part.text as string;
                    const keywords = [
                      "Created", "Modified", "Deleted",
                      "创建", "修改", "删除",
                      "wrote", "updated",
                    ];
                    if (keywords.some((kw) => text.includes(kw))) {
                      const snippet = text.substring(0, 200);
                      if (!actions.includes(snippet)) {
                        actions.push(snippet);
                      }
                    }
                  }
                }
              }
            }

            if (actions.length > 0) {
              summary += "### 检测到的关键操作\n";
              actions.slice(0, 8).forEach((action, i) => {
                summary += `${i + 1}. ${action}...\n`;
              });
            } else {
              summary += "未检测到明确的文件操作。会话以讨论和探索为主。\n";
            }

            return summary;
          } catch (error) {
            return `无法分析会话历史: ${error instanceof Error ? error.message : String(error)}`;
          }
        },
      }),
    },
  };
};

export default plugin;
