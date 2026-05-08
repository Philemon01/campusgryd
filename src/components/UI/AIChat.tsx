import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Loader2, Sparkles, MapPin, Navigation } from 'lucide-react';
import { Location } from '../../types';
import { processAIChat } from '../../services/geminiService';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface AIChatProps {
  onLocationSelect: (loc: Location) => void;
  onRouteRequest: (dest: Location, start?: Location) => void;
}

export const AIChat: React.FC<AIChatProps> = ({ onLocationSelect, onRouteRequest }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', parts: [{ text: userMessage }] }]);
    setIsLoading(true);

    const responseText = await processAIChat(userMessage, messages, {
      onSearch: onLocationSelect,
      onRoute: onRouteRequest,
    });

    setMessages(prev => [...prev, { role: 'model', parts: [{ text: responseText }] }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-24 right-4 z-[1000]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-16 right-0 w-[90vw] sm:w-[350px] h-[500px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-rsu-primary text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">RSU Campus AI</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                id="close-chat-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-950"
            >
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-rsu-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-rsu-primary" />
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4">
                    Ask me anything about RSU campus. For example:<br/>
                    "Where is the Main Library?"<br/>
                    "Directions to Medicine building"
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-rsu-primary text-white rounded-tr-none' 
                      : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-100 dark:border-zinc-700 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.parts[0].text}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl rounded-tl-none border border-zinc-100 dark:border-zinc-700 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-rsu-primary" />
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">AI is thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask RSU AI..."
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-sm p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-rsu-primary border-none text-zinc-800 dark:text-white"
                id="ai-chat-input"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 bg-rsu-primary text-white rounded-xl disabled:opacity-50 hover:bg-rsu-primary/90 transition-colors"
                id="ai-send-btn"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-rsu-primary text-white rounded-full shadow-lg flex items-center justify-center relative group"
        id="toggle-ai-chat-btn"
      >
        <MessageSquare className="w-7 h-7" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900" />
        <span className="absolute right-16 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-white text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-zinc-200 dark:border-zinc-700">
          RSU AI Assistant
        </span>
      </motion.button>
    </div>
  );
};
