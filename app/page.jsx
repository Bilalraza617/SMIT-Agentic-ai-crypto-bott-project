"use client";

import { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';

export default function Home() {
  const [messages, setMessages] = useState([{
    role: 'ai',
    content: "Hello! I'm CryptoAI, your personal cryptocurrency expert. How can I help you analyze the market today?"
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Configure marked to render newlines
  marked.setOptions({
    breaks: true,
    gfm: true
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    const historyToSent = [...messages];
    
    // Optimistically add user message to UI
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage, 
          history: historyToSent // Exclude the current msg from history
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessages(prev => [...prev, { role: 'ai', content: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: `Error: ${data.error}` }]);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I am having trouble connecting to the server. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="chat-header">
        <div className="logo-area">
          <div className="logo-icon"><i className="fa-brands fa-bitcoin"></i></div>
          <div className="logo-text">
            <h1>CryptoAI</h1>
            <span className="status"><span className="dot"></span> Online</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="icon-btn" title="Settings"><i className="fa-solid fa-gear"></i></button>
        </div>
      </header>

      <main className="chat-container">
        <div className="messages-area">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`}>
              <div className="avatar">
                <i className={`fa-solid ${msg.role === 'user' ? 'fa-user' : 'fa-robot'}`}></i>
              </div>
              <div className={`message-content ${msg.role === 'ai' ? 'glass-panel' : ''}`} suppressHydrationWarning>
                {msg.role === 'ai' ? (
                  <div dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }} />
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message ai-message">
              <div className="avatar"><i className="fa-solid fa-robot"></i></div>
              <div className="message-content glass-panel typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="input-area glass-panel">
        <form id="chat-form" onSubmit={handleSubmit}>
          <button type="button" className="icon-btn attachment-btn"><i className="fa-solid fa-paperclip"></i></button>
          <input 
            id="user-input"
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about any coin, price, or market trend..." 
            disabled={isLoading}
            autoComplete="off" 
            required 
          />
          <button type="submit" className="send-btn" disabled={isLoading || !input.trim()}>
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </form>
      </footer>
    </div>
  );
}
