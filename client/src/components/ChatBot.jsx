import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";

export default function ChatBot({ token, API_BASE_URL, onTriageComplete }) {
  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'assistant', content: 'Hi there! I am the CampusCare Assistant. I can help triage your symptoms for the doctor or answer questions about campus health policies. What brings you here today?' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionError, setSessionError] = useState(null);
  
  // Persist session ID across component remounts/refreshes
  const [sessionId] = useState(() => {
    const existingId = sessionStorage.getItem("chatSessionId");
    if (existingId) return existingId;
    const newId = crypto.randomUUID();
    sessionStorage.setItem("chatSessionId", newId);
    return newId;
  });
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const currentStreamRef = useRef("");

  useEffect(() => {
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    // Initialize Socket
    const socket = io(API_BASE_URL, {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("chat-typing", () => {
      setIsTyping(true);
      setSessionError(null);
      currentStreamRef.current = ""; // Reset stream buffer
    });

    socket.on("chat-response", ({ token, done }) => {
      setIsTyping(false);
      currentStreamRef.current += token;
      
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.id === 'stream') {
          // Update existing streaming message
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { ...lastMsg, content: currentStreamRef.current };
          return newMessages;
        } else {
          // Add new streaming message
          return [...prev, { id: 'stream', role: 'assistant', content: currentStreamRef.current }];
        }
      });

      if (done) {
        // Finalize the message ID so the next one doesn't merge
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], id: crypto.randomUUID() };
          return newMessages;
        });
      }
    });

    socket.on("triage-complete", ({ sessionId: sid, summary, symptoms, riskScore }) => {
      // Small delay for natural feel before showing doctor selection
      setTimeout(() => {
        onTriageComplete(sid, summary, symptoms, riskScore);
      }, 1000);
    });

    socket.on("chat-error", ({ message, recoverable }) => {
      setIsTyping(false);
      if (recoverable) {
        setSessionError("Network or AI error. Please try again.");
      } else {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `[Error]: ${message}`, isError: true }]);
      }
    });

    return () => {
      socket.off("chat-typing");
      socket.off("chat-response");
      socket.off("triage-complete");
      socket.off("chat-error");
      socket.disconnect();
    };
  }, [API_BASE_URL, token, onTriageComplete]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: userText }]);
    setInputValue("");
    
    // Parse JWT to get userId
    let userId = "";
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.uid || payload.user_id;
    } catch(e) {
      console.warn("Could not parse userId from token");
    }

    socketRef.current.emit("chat-message", {
      sessionId,
      userId,
      text: userText
    });
  };

  return (
    <div className="flex flex-col h-[500px] w-full max-w-2xl mx-auto rounded-2xl overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-cyan-500/10">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600/90 to-cyan-500/90 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm shadow-inner">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white tracking-wide">AI Triage Assistant</h2>
            <p className="text-xs text-blue-100/80 font-medium">I help the doctor understand your symptoms faster.</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-xs text-white/90 font-medium">Online</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 group`}>
              
              {/* Avatar */}
              <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full shadow-sm mb-1 
                ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gradient-to-br from-cyan-400 to-blue-500'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </div>

              {/* Message Bubble */}
              <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm backdrop-blur-md transition-all duration-300
                ${msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none hover:shadow-blue-500/20' 
                  : msg.isError 
                    ? 'bg-red-50 text-red-600 border border-red-100 rounded-bl-none'
                    : 'bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/50 dark:border-slate-700/50 rounded-bl-none hover:shadow-md'
                }`}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex w-full justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex items-end gap-2">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full shadow-sm mb-1 bg-gradient-to-br from-cyan-400 to-blue-500">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="px-5 py-4 rounded-2xl rounded-bl-none bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 shadow-sm backdrop-blur-md">
                   <div className="flex space-x-1.5 items-center justify-center h-2">
                      <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"></div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {sessionError && (
          <div className="flex w-full justify-center my-2">
             <div className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex flex-col items-center gap-2">
               <span>{sessionError}</span>
               <button 
                  onClick={() => setSessionError(null)} 
                  className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
               >
                 Dismiss
               </button>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-700/50">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message here..."
            className="w-full pl-5 pr-14 py-3.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-sm shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="absolute right-2 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg disabled:shadow-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-400 mt-3 font-medium tracking-wider">
          I'm not diagnosing you, I'm helping the doctor triage faster.
        </p>
      </div>
    </div>
  );
}
