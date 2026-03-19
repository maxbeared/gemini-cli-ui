import { Command } from "@tauri-apps/plugin-shell";

declare const __PROJECT_ROOT__: string;

export interface GeminiEvent {
  type: "init" | "message" | "tool_use" | "tool_result" | "error" | "result";
  timestamp?: string;
  role?: string;
  content?: string;
  delta?: boolean;
  tool_name?: string;
  tool_id?: string;
  parameters?: any;
  status?: "calling" | "success" | "error";
  output?: string;
  session_id?: string;
}

export class GeminiBridge {
  static async sendPrompt(prompt: string, sessionId: string | undefined, onEvent: (event: GeminiEvent) => void) {
    try {
      console.log("Calling gemini CLI with prompt:", prompt, "Session:", sessionId);
      
      const separator = __PROJECT_ROOT__.includes('\\') ? '\\' : '/';
      const bundlePath = `${__PROJECT_ROOT__}${separator}gemini-cli${separator}bundle${separator}gemini.js`;
      
      const args = [
        bundlePath,
        "-p", prompt,
        "-o", "stream-json",
        "--raw-output",
        "--accept-raw-output-risk"
      ];

      if (sessionId) {
        args.push("--resume", sessionId);
      }

      const command = Command.create("node", args);

      let buffer = "";

      command.stdout.on("data", (data) => {
        buffer += data;
        let boundary = buffer.indexOf("\n");
        while (boundary !== -1) {
          const line = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 1);
          if (line) {
            try {
              const event = JSON.parse(line) as GeminiEvent;
              onEvent(event);
            } catch (e) {
              console.error("Failed to parse Gemini event line:", line, e);
            }
          }
          boundary = buffer.indexOf("\n");
        }
      });

      command.stderr.on("data", (data) => {
        console.error("Gemini stderr:", data);
        onEvent({
          type: "error",
          content: data
        });
      });

      command.on("close", (data) => {
         onEvent({ type: "result", status: "success" });
      });

      const child = await command.spawn();
      console.log("Command spawned, PID:", child.pid);
    } catch (error) {
      console.error("Error calling gemini:", error);
      onEvent({
        type: "error",
        content: "Error: " + (error instanceof Error ? error.message : String(error)),
      });
    }
  }
}
