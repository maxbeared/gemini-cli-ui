import { Command } from "@tauri-apps/plugin-shell";

export interface GeminiEvent {
  type: "init" | "message" | "tool_use" | "tool_result" | "error" | "result";
  timestamp?: string;
  role?: string;
  content?: string;
  delta?: boolean;
  tool_name?: string;
  tool_id?: string;
  parameters?: any;
  status?: string;
  output?: string;
}

export class GeminiBridge {
  static async sendPrompt(prompt: string, onEvent: (event: GeminiEvent) => void) {
    try {
      console.log("Calling gemini CLI with prompt:", prompt);
      const command = Command.create("gemini", [prompt]);

      command.stdout.on("data", (data) => {
        console.log("Gemini stdout:", data);
        onEvent({
          type: "message",
          role: "assistant",
          content: data,
          delta: true,
        });
      });

      command.stderr.on("data", (data) => {
        console.error("Gemini stderr:", data);
      });

      const child = await command.spawn();
      console.log("Command spawned, PID:", child.pid);
    } catch (error) {
      console.error("Error calling gemini:", error);
      onEvent({
        type: "message",
        role: "assistant",
        content: "Error: " + (error instanceof Error ? error.message : String(error)),
      });
    }
  }
}
