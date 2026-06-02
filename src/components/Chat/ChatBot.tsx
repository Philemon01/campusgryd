import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, User, RotateCcw } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../../lib/utils';
import { Location, Maneuver } from '../../types';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  directions?: Maneuver[];
  destinationId?: string;
  quickActions?: { label: string; value: string; icon?: React.ReactNode }[];
}

interface ChatBotProps {
  onSendMessage: (text: string) => Promise<{ response: string; destinationId?: string; type: string; quickActions?: { label: string; value: string }[] }>;
  onLocationFocus?: (locationId: string) => void;
  isNavigating: boolean;
  activeManeuvers?: Maneuver[];
  onRecalculate?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showFloatingButton?: boolean;
}

export const ChatBot: React.FC<ChatBotProps> = ({ 
  onSendMessage, 
  onLocationFocus,
  isNavigating, 
  activeManeuvers,
  onRecalculate,
  isOpen: externalOpen,
  onOpenChange,
  showFloatingButton = true
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  
  const setIsOpen = (val: boolean) => {
    if (onOpenChange) {
      onOpenChange(val);
    } else {
      setInternalOpen(val);
    }
  };
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your RSU Campus Navigator. Where would you like to go today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeminiKeyMissing, setIsGeminiKeyMissing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const checkApiKey = async () => {
      const clientKey = (import.meta.env?.VITE_GEMINI_API_KEY) || (import.meta.env?.GEMINI_API_KEY);
      if (clientKey && clientKey !== 'undefined' && clientKey !== '') {
        setIsGeminiKeyMissing(false);
        return;
      }
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          if (!data.hasGeminiKey) {
            setIsGeminiKeyMissing(true);
          }
        }
      } catch (e) {
        console.error("API key validation failed:", e);
      }
    };
    checkApiKey();
  }, []);

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const result = await onSendMessage(userMsg.text);
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: result.response,
        sender: 'bot',
        timestamp: new Date(),
        destinationId: result.destinationId,
        quickActions: result.quickActions
      };

      if (result.type === 'navigate' && activeManeuvers) {
        botMsg.directions = activeManeuvers;
      }

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I couldn't process that. Can you try again?",
        sender: 'bot',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-[1000]">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[350px] sm:w-[400px] h-[500px] bg-white dark:bg-rsu-navy-light rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="p-4 bg-rsu-navy text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">RSU Navi-Bot</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-white/70">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {isGeminiKeyMissing && (
              <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-350 animate-in slide-in-from-top duration-200">
                <span className="flex-shrink-0 text-sm">⚠️</span>
                <span>
                  <strong>AI Support Offline:</strong> Gemini API Key is missing. Set your key in your environment to unlock full smart navigation!
                </span>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.sender === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-2xl text-sm shadow-sm",
                    msg.sender === 'user' 
                      ? "bg-rsu-green text-white rounded-tr-none" 
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700"
                  )}>
                    <div className="markdown-body">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                    
                    {msg.sender === 'bot' && msg.destinationId && (
                      <button 
                        onClick={() => onLocationFocus?.(msg.destinationId!)}
                        className="mt-2 flex items-center gap-1.5 text-xs font-black text-rsu-orange uppercase tracking-wider hover:opacity-70 transition-opacity"
                      >
                        <Bot size={14} className="animate-pulse" />
                        Focus on Map
                      </button>
                    )}

                    {msg.quickActions && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.quickActions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setInputText(action.value);
                              // Using setTimeout to ensure state update is processed or 
                              // just calling a separate function. 
                              // Let's refactor handleSend to take an optional override text.
                              handleSend(action.value);
                            }}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-rsu-navy hover:text-white dark:hover:bg-rsu-green text-rsu-navy dark:text-white rounded-full text-xs font-bold transition-all border border-gray-200 dark:border-gray-600"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {msg.directions && (
                      <div className="mt-3 pt-3 border-t border-black/10 space-y-2">
                        <p className="font-bold text-xs uppercase tracking-wider opacity-70">Turn-by-turn Directions:</p>
                        <ul className="space-y-1.5">
                          {msg.directions.map((step, i) => (
                            <li key={i} className="flex gap-2 text-xs leading-relaxed">
                              <span className="text-rsu-orange font-bold font-mono min-w-[15px]">{i + 1}.</span>
                              <span>{step.instruction}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Bot size={16} className="animate-bounce" />
                  <span className="text-xs italic">Navi-Bot is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {isNavigating && (
              <div className="px-4 py-2 flex gap-2 overflow-x-auto border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/20">
                <button 
                  onClick={onRecalculate}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-[10px] font-bold text-rsu-navy dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap transition-colors"
                >
                  <RotateCcw size={12} />
                  I'M LOST / RECALCULATE
                </button>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-rsu-navy-light">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask for directions or a place..."
                  className="w-full pl-4 pr-12 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rsu-navy dark:focus:ring-rsu-green text-gray-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="absolute right-2 p-2 bg-rsu-navy dark:bg-rsu-green text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        ) : showFloatingButton ? (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-rsu-navy text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:bg-rsu-green relative"
          >
            <MessageSquare size={28} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rsu-orange rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white">
              1
            </span>
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
