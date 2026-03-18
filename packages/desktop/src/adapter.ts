import { createStore, produce } from "solid-js/store";
import { GeminiBridge, GeminiEvent } from "./gemini-bridge";

export interface Part {
  type: string;
  text?: string;
  tool?: {
    name: string;
    id: string;
    parameters: any;
    status: 'calling' | 'success' | 'error';
    output?: string;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  parts: Part[];
}

export const [messages, setMessages] = createStore<Message[]>([]);

export async function submitPrompt(prompt: string) {
  // 1. Add User Message
  const userMsg: Message = { 
    id: Date.now().toString(), 
    role: 'user', 
    parts: [{ type: 'text', text: prompt }] 
  };
  setMessages(m => [...m, userMsg]);

  // 2. Prepare Assistant Message
  const assistantId = (Date.now() + 1).toString();
  setMessages(m => [...m, { id: assistantId, role: 'assistant', parts: [] }]);

  await GeminiBridge.sendPrompt(prompt, (event: GeminiEvent) => {
    setMessages(
      m => m.id === assistantId,
      produce((msg) => {
        if (event.type === "message" && event.role === "assistant") {
          let textPart = msg.parts.find(p => p.type === 'text');
          if (!textPart) {
            msg.parts.push({ type: 'text', text: event.content });
          } else {
            if (event.delta) textPart.text += event.content;
            else textPart.text = event.content;
          }
        } else if (event.type === "tool_use") {
          msg.parts.push({
            type: 'tool',
            tool: {
              name: event.tool_name,
              id: event.tool_id,
              parameters: event.parameters,
              status: 'calling'
            }
          });
        } else if (event.type === "tool_result") {
          const toolPart = msg.parts.find(p => p.tool?.id === event.tool_id);
          if (toolPart && toolPart.tool) {
            toolPart.tool.status = event.status;
            toolPart.tool.output = event.output;
          }
        }
      })
    );
  });
}
