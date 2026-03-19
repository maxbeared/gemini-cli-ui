import { For, createSignal, Show, createEffect, onMount } from "solid-js";
import { messages, submitPrompt, isGenerating, clearHistory } from "./adapter";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { createHighlighter } from "shiki";

// 全局异步加载 Shiki 高亮器，但不阻塞渲染
let highlighterInstance: any = null;

createHighlighter({
  themes: ['github-dark'],
  langs: ['javascript', 'typescript', 'bash', 'json', 'rust', 'python', 'html', 'css', 'markdown']
}).then(highlighter => {
  highlighterInstance = highlighter;
  console.log("Shiki loaded");
}).catch(console.error);

marked.use({
  renderer: {
    // 兼容 marked 的多种参数签名
    code(token: any, infostring?: string) {
      const code = typeof token === 'string' ? token : token.text;
      const lang = typeof token === 'string' ? infostring : token.lang;
      
      let highlighted = `<pre><code>${DOMPurify.sanitize(code)}</code></pre>`;
      
      if (highlighterInstance && lang) {
        try {
          highlighted = highlighterInstance.codeToHtml(code, { 
            lang: lang || 'text', 
            theme: 'github-dark' 
          });
        } catch (e) {
          console.warn("Shiki syntax error", e);
        }
      }

      // 将代码进行一次 base64 编码或实体转义以安全地存放在 data 属性中
      const encodedCode = encodeURIComponent(code);

      // 包装成带有复制按钮的容器
      return `
        <div class="code-block-wrapper" style="position: relative; margin-bottom: 1rem;">
          <div style="position: absolute; top: 0; right: 0; background: #30363d; border-bottom-left-radius: 0.5rem; border-top-right-radius: 0.5rem; padding: 0.2rem 0.5rem;">
             <span style="color: #8b949e; font-size: 0.7rem; margin-right: 0.5rem;">${lang || 'text'}</span>
             <button class="copy-code-btn" data-code="${encodedCode}" style="background: transparent; border: none; color: #c9d1d9; cursor: pointer; font-size: 0.75rem; padding: 0.2rem;">复制</button>
          </div>
          ${highlighted}
        </div>
      `;
    }
  }
});

const ToolCall = (props: { tool: any }) => {
  const [expanded, setExpanded] = createSignal(false);
  return (
    <div style={{
      border: '1px solid rgba(59, 130, 246, 0.3)',
      background: 'rgba(59, 130, 246, 0.05)',
      padding: '0.5rem 0.75rem',
      'border-radius': '0.25rem',
      'margin-top': '0.5rem'
    }}>
      <div 
        onClick={() => setExpanded(!expanded())} 
        style={{ cursor: 'pointer', display: 'flex', 'align-items': 'center', 'user-select': 'none' }}
      >
        <span style={{ color: '#60a5fa', 'font-weight': 'bold', 'margin-right': '0.5rem', width: '1rem', display: 'inline-block' }}>
           {expanded() ? '▼' : '▶'}
        </span>
        <span style={{ color: '#60a5fa', 'font-weight': 'bold' }}>工具调用: {props.tool?.name}</span>
        <Show when={props.tool?.status === 'calling'}>
           <span style={{ 'margin-left': '0.5rem', opacity: 0.7 }} class="animate-pulse">执行中...</span>
        </Show>
        <Show when={props.tool?.status === 'success'}>
           <span style={{ 'margin-left': '0.5rem', opacity: 0.8, color: '#4ade80', 'font-size': '0.8rem' }}>✓ 完成</span>
        </Show>
        <Show when={props.tool?.status === 'error'}>
           <span style={{ 'margin-left': '0.5rem', opacity: 0.8, color: '#f87171', 'font-size': '0.8rem' }}>✗ 失败</span>
        </Show>
      </div>
      <Show when={expanded() && props.tool?.output}>
        <div style={{ 
          'font-size': '0.8rem', 
          opacity: 0.9, 
          'margin-top': '0.5rem', 
          border: '1px solid rgba(255,255,255,0.1)', 
          background: '#0d1117',
          padding: '0.5rem',
          'max-height': '300px',
          'overflow-y': 'auto',
          'white-space': 'pre-wrap',
          'font-family': 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
          'border-radius': '0.25rem'
        }}>
          {props.tool?.output}
        </div>
      </Show>
    </div>
  );
};

export default function App() {
  const [input, setInput] = createSignal("");
  let messageListRef: HTMLDivElement | undefined;

  const send = () => {
    if (!input() || isGenerating()) return;
    submitPrompt(input());
    setInput("");
  };

  // 简单的自动滚动
  createEffect(() => {
    if (messages.length || isGenerating()) {
      if (messageListRef) {
        messageListRef.scrollTop = messageListRef.scrollHeight;
      }
    }
  });

  const renderMarkdown = (text: string) => {
    const rawHtml = marked.parse(text) as string;
    return DOMPurify.sanitize(rawHtml);
  };

  // 处理事件委托，例如复制代码
  onMount(() => {
    if (messageListRef) {
      messageListRef.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('copy-code-btn')) {
          const code = target.getAttribute('data-code');
          if (code) {
            try {
              const decodedCode = decodeURIComponent(code);
              await navigator.clipboard.writeText(decodedCode);
              
              const originalText = target.innerText;
              target.innerText = "已复制!";
              target.style.color = "#4ade80";
              
              setTimeout(() => {
                target.innerText = originalText;
                target.style.color = "#c9d1d9";
              }, 2000);
            } catch (err) {
              console.error("Failed to copy text: ", err);
              target.innerText = "失败";
            }
          }
        }
      });
    }
  });

  return (
    <div class="app-container" style={{
      display: 'flex',
      'flex-direction': 'column',
      height: '100vh',
      background: '#1e1e1e',
      color: 'white',
      padding: '1rem',
      'font-family': 'system-ui, -apple-system, sans-serif'
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .markdown-content pre {
          background: #0d1117;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          border: 1px solid #30363d;
        }
        .markdown-content code {
          background: rgba(110, 118, 129, 0.4);
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace;
          font-size: 85%;
        }
        .markdown-content pre code {
          background: transparent;
          padding: 0;
        }
        .markdown-content p { margin-bottom: 1rem; line-height: 1.6; }
        .markdown-content ul, .markdown-content ol { margin-bottom: 1rem; padding-left: 1.5rem; }
        .markdown-content h1, .markdown-content h2, .markdown-content h3 { margin: 1.5rem 0 1rem 0; }
        .markdown-content blockquote { border-left: 4px solid #30363d; padding-left: 1rem; color: #8b949e; }
      `}</style>

      <div style={{ 
        padding: '0.5rem', 
        background: '#333', 
        'font-size': '0.8rem', 
        'margin-bottom': '0.5rem', 
        'border-radius': '0.25rem',
        display: 'flex',
        'justify-content': 'space-between',
        'align-items': 'center'
      }}>
        <span>Debug: UI Loaded. Gemini Bridge Ready.</span>
        <button 
          onClick={clearHistory}
          disabled={isGenerating()}
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            padding: '0.2rem 0.5rem',
            'border-radius': '0.25rem',
            cursor: isGenerating() ? 'default' : 'pointer',
            'font-size': '0.75rem'
          }}
        >
          清空对话
        </button>
      </div>
      
      <div 
        ref={messageListRef}
        class="message-list" 
        style={{
          flex: 1,
          'overflow-y': 'auto',
          display: 'flex',
          'flex-direction': 'column',
          gap: '1rem',
          'padding-bottom': '1rem'
        }}
      >
        <For each={messages}>{(msg) => (
          <div class={`message ${msg.role}`} style={{
            padding: '1rem',
            'border-radius': '0.5rem',
            background: msg.role === 'user' ? '#2d2d2d' : '#161b22',
            'margin-left': msg.role === 'user' ? '3rem' : '0',
            'margin-right': msg.role === 'assistant' ? '3rem' : '0',
            border: msg.role === 'assistant' ? '1px solid #30363d' : 'none'
          }}>
            <div style={{ 'font-size': '0.75rem', opacity: 0.5, 'margin-bottom': '0.5rem', 'font-weight': 'bold' }}>
              {msg.role.toUpperCase()}
            </div>
            <For each={msg.parts}>{(part) => (
              <div>
                {part.type === 'text' && (
                  <div 
                    class="markdown-content"
                    innerHTML={renderMarkdown(part.text || "")} 
                  />
                )}
                {part.type === 'error' && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    padding: '0.75rem',
                    'border-radius': '0.25rem',
                    'margin-top': '0.5rem',
                    'font-family': 'monospace',
                    'white-space': 'pre-wrap'
                  }}>
                    {part.text}
                  </div>
                )}
                {part.type === 'tool' && (
                  <div style={{
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: '0.5rem',
                    'border-radius': '0.25rem',
                    'margin-top': '0.5rem'
                  }}>
                    <span style={{ color: '#60a5fa', 'font-weight': 'bold' }}>工具调用: {part.tool?.name}</span>
                    <Show when={part.tool?.status === 'calling'}>
                       <span style={{ 'margin-left': '0.5rem', opacity: 0.7 }}>执行中...</span>
                    </Show>
                    <Show when={part.tool?.status === 'success'}>
                      <div style={{ 'font-size': '0.8rem', opacity: 0.8, 'margin-top': '0.25rem', border: '1px dashed #444', padding: '0.25rem' }}>
                        结果: {part.tool?.output}
                      </div>
                    </Show>
                  </div>
                )}
              </div>
            )}</For>
          </div>
        )}</For>
        
        <Show when={isGenerating()}>
          <div class="assistant" style={{
            padding: '1rem',
            'border-radius': '0.5rem',
            background: '#161b22',
            'margin-right': '3rem',
            border: '1px solid #30363d',
            opacity: 0.8
          }}>
            <div style={{ 'font-size': '0.75rem', opacity: 0.5, 'margin-bottom': '0.5rem' }}>ASSISTANT</div>
            <div class="animate-pulse" style={{ color: '#60a5fa' }}>Gemini 正在思考并生成响应...</div>
          </div>
        </Show>
      </div>
      
      <div class="input-area" style={{ 'margin-top': '1rem', display: 'flex', 'flex-direction': 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', 'align-items': 'flex-end' }}>
          <textarea 
            style={{
              flex: 1,
              background: '#2d2d2d',
              border: '1px solid #30363d',
              color: 'white',
              padding: '0.75rem',
              'border-radius': '0.25rem',
              outline: 'none',
              resize: 'none',
              height: '60px',
              'min-height': '60px',
              'max-height': '200px',
              'font-family': 'inherit',
              'line-height': '1.5'
            }}
            disabled={isGenerating()}
            value={input()} 
            onInput={(e) => {
              setInput(e.currentTarget.value);
              // 自动调整高度
              e.currentTarget.style.height = '60px';
              e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 200) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // 阻止默认的换行行为
                send();
              }
            }}
            placeholder={isGenerating() ? "Gemini 正在响应..." : "Ask Gemini..."}
          />
          <button 
            type="button"
            disabled={isGenerating() || !input().trim()}
            style={{
              background: (isGenerating() || !input().trim()) ? '#444' : '#238636',
              color: (isGenerating() || !input().trim()) ? '#888' : 'white',
              border: 'none',
              padding: '0.5rem 1.5rem',
              'border-radius': '0.25rem',
              cursor: (isGenerating() || !input().trim()) ? 'default' : 'pointer',
              transition: 'all 0.2s',
              'font-weight': 'bold',
              height: '42px',
              'margin-bottom': '9px' // 对齐 textarea 的内边距
            }}
            onClick={send}
          >
            {isGenerating() ? "生成中" : "发送"}
          </button>
        </div>
        <div style={{ 'font-size': '0.75rem', color: '#8b949e', 'text-align': 'left', 'padding-left': '0.2rem' }}>
          按 <kbd style={{ background: '#30363d', padding: '0.1rem 0.3rem', 'border-radius': '3px', 'font-family': 'inherit' }}>Enter</kbd> 发送，
          <kbd style={{ background: '#30363d', padding: '0.1rem 0.3rem', 'border-radius': '3px', 'font-family': 'inherit' }}>Shift</kbd> + <kbd style={{ background: '#30363d', padding: '0.1rem 0.3rem', 'border-radius': '3px', 'font-family': 'inherit' }}>Enter</kbd> 换行
        </div>
      </div>
    </div>
  );
}
