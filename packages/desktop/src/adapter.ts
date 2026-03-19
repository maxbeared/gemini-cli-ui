import { createSignal } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { GeminiBridge, GeminiEvent } from "./gemini-bridge";
import { Store } from "@tauri-apps/plugin-store";

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
export const [isGenerating, setIsGenerating] = createSignal(false);
let currentSessionId: string | undefined = undefined;

// 初始化 Store
let store: Store | null = null;
const STORE_FILENAME = "chat_history.dat";

async function initStore() {
  try {
    store = await Store.load(STORE_FILENAME);
    const savedMessages = await store.get<Message[]>("messages");
    const savedSessionId = await store.get<string>("sessionId");
    
    if (savedMessages && Array.isArray(savedMessages)) {
      setMessages(savedMessages);
    }
    if (savedSessionId) {
      currentSessionId = savedSessionId;
    }
  } catch (e) {
    console.error("Failed to load store:", e);
  }
}

// 启动时加载
initStore();

async function saveState() {
  if (!store) return;
  try {
    // SolidJS 的 store 在底层是 Proxy，保存前最好转为普通对象
    await store.set("messages", JSON.parse(JSON.stringify(messages)));
    if (currentSessionId) {
      await store.set("sessionId", currentSessionId);
    }
    await store.save();
  } catch (e) {
    console.error("Failed to save state:", e);
  }
}

export async function clearHistory() {
  setMessages([]);
  currentSessionId = undefined;
  if (store) {
    await store.set("messages", []);
    await store.set("sessionId", null);
    await store.save();
  }
}

export async function submitPrompt(prompt: string) {
  // 1. Add User Message
  const userMsg: Message = { 
    id: Date.now().toString(), 
    role: 'user', 
    parts: [{ type: 'text', text: prompt }] 
  };
  setMessages(m => [...m, userMsg]);
  saveState(); // 保存用户消息

  // 2. Prepare Assistant Message
  const assistantId = (Date.now() + 1).toString();
  setMessages(m => [...m, { id: assistantId, role: 'assistant', parts: [] }]);
  
  setIsGenerating(true);

  try {
    await GeminiBridge.sendPrompt(prompt, currentSessionId, (event: GeminiEvent) => {
      if (event.type === "init" && event.session_id) {
        currentSessionId = event.session_id;
        saveState(); // 保存新的 SessionID
      }

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
              toolPart.tool.status = event.status as any;
              toolPart.tool.output = event.output;
            }
          } else if (event.type === "error") {
            msg.parts.push({
              type: 'error',
              text: event.content || "Unknown error occurred"
            });
          } else if (event.type === "result") {
            setIsGenerating(false);
            saveState(); // 对话结束，保存完整消息
          }
        })
      );
    });
  } finally {
    // 确保最终状态被保存，即使发生异常
    saveState();
  }
}
