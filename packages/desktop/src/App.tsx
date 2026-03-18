import { For, createSignal } from "solid-js";
import { messages, submitPrompt } from "./adapter";

export default function App() {
  const [input, setInput] = createSignal("");

  const send = () => {
    if (!input()) return;
    submitPrompt(input());
    setInput("");
  };

  return (
    <div class="app-container" style={{
      display: 'flex',
      'flex-direction': 'column',
      height: '100vh',
      background: '#1e1e1e',
      color: 'white',
      padding: '1rem'
    }}>
      <div class="message-list" style={{
        flex: 1,
        'overflow-y': 'auto',
        display: 'flex',
        'flex-direction': 'column',
        gap: '1rem'
      }}>
        <For each={messages}>{(msg) => (
          <div class={`message ${msg.role}`} style={{
            padding: '0.75rem',
            'border-radius': '0.5rem',
            background: msg.role === 'user' ? '#2d2d2d' : '#252525',
            'margin-left': msg.role === 'user' ? '3rem' : '0',
            'margin-right': msg.role === 'assistant' ? '3rem' : '0'
          }}>
            <div style={{ 'font-size': '0.75rem', opacity: 0.5, 'margin-bottom': '0.25rem' }}>
              {msg.role.toUpperCase()}
            </div>
            <For each={msg.parts}>{(part) => (
              <div>
                {part.type === 'text' && (
                  <pre style={{ 'white-space': 'pre-wrap', margin: 0, 'font-family': 'inherit' }}>
                    {part.text}
                  </pre>
                )}
                {part.type === 'tool' && (
                  <div style={{
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: '0.5rem',
                    'border-radius': '0.25rem',
                    'margin-top': '0.5rem'
                  }}>
                    <span style={{ color: '#60a5fa' }}>Tool Call: {part.tool?.name}</span>
                    {part.tool?.status === 'calling' && <span class="animate-pulse">...</span>}
                    {part.tool?.status === 'success' && <div style={{ 'font-size': '0.8rem', opacity: 0.8 }}>Result: {part.tool?.output}</div>}
                  </div>
                )}
              </div>
            )}</For>
          </div>
        )}</For>
      </div>
      
      <div class="input-area" style={{ 'margin-top': '1rem', display: 'flex', gap: '0.5rem' }}>
        <input 
          style={{
            flex: 1,
            background: '#2d2d2d',
            border: 'none',
            color: 'white',
            padding: '0.5rem 0.75rem',
            'border-radius': '0.25rem'
          }}
          value={input()} 
          onInput={(e) => setInput(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask Gemini..."
        />
        <button 
          type="button"
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            'border-radius': '0.25rem',
            cursor: 'pointer'
          }}
          onClick={send}
        >
          Send
        </button>
      </div>
    </div>
  );
}
