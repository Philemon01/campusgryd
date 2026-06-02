import React from 'react';
import { Menu, GraduationCap, Volume2, Sun, Moon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HeaderProps {
  isVoiceAssistEnabled: boolean;
  isDarkMode: boolean;
  setIsMenuOpen: (o: boolean) => void;
  setIsVoiceAssistEnabled: (e: boolean) => void;
  setIsDarkMode: (d: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isVoiceAssistEnabled,
  isDarkMode,
  setIsMenuOpen,
  setIsVoiceAssistEnabled,
  setIsDarkMode
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 bg-rsu-card/95 backdrop-blur-xl border-b border-rsu-border/20 px-4 py-4 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-2.5 bg-rsu-navy text-white rounded-xl hover:bg-rsu-navy/90 transition-all flex items-center justify-center shadow-lg border border-white/10 active:scale-95"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-rsu-navy to-[#0a2e5c] rounded-xl flex items-center justify-center shadow-md border border-white/20">
            <GraduationCap className="text-white drop-shadow-sm" size={24} />
          </div>
          <div className="flex flex-col justify-center">
            <h1 
              style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
              className="text-sm md:text-base font-display font-black uppercase tracking-tight leading-none"
            >
              Rivers State University
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-bold text-white bg-rsu-green px-1.5 py-0.5 rounded uppercase tracking-wider">
                Campusgryd
              </span>
              <p className="text-[10px] font-bold text-rsu-muted uppercase tracking-widest hidden xs:block">
                Digital Guide
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:flex flex-col items-end">
          <p className="text-[10px] font-mono font-black text-rsu-navy dark:text-rsu-green uppercase tracking-widest leading-none">
            Philemon Progress
          </p>
          <p className="text-[8px] font-bold text-rsu-muted uppercase mt-0.5">System Architect</p>
        </div>
        
        <button
          onClick={() => setIsVoiceAssistEnabled(!isVoiceAssistEnabled)}
          className={cn(
            "p-2 rounded-xl transition-all flex items-center justify-center shadow-inner border",
            isVoiceAssistEnabled ? "bg-rsu-green/10 text-rsu-green border-rsu-green/20" : "bg-rsu-bg text-rsu-muted border-rsu-border"
          )}
          aria-label="Toggle voice assist"
          title={isVoiceAssistEnabled ? "Voice Assist On" : "Voice Assist Off"}
        >
          {isVoiceAssistEnabled ? <Volume2 size={20} /> : <Volume2 size={20} className="opacity-30" />}
        </button>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={cn(
            "p-2 bg-rsu-bg rounded-xl transition-all flex items-center justify-center shadow-inner border",
            isDarkMode 
              ? "text-white border-white/20 hover:bg-white/10" 
              : "text-rsu-navy border-rsu-navy/10 hover:bg-rsu-navy/10"
          )}
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
};
