import React from 'react';
import { Menu, GraduationCap, Volume2, Sun, Moon, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HeaderProps {
  isVoiceAssistEnabled: boolean;
  isDarkMode: boolean;
  setIsMenuOpen: (o: boolean) => void;
  setIsVoiceAssistEnabled: (e: boolean) => void;
  setIsDarkMode: (d: boolean) => void;
  onNavigateHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isVoiceAssistEnabled,
  isDarkMode,
  setIsMenuOpen,
  setIsVoiceAssistEnabled,
  setIsDarkMode,
  onNavigateHome
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
        
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-3 text-left hover:opacity-90 active:scale-95 transition-all group cursor-pointer"
          title="Back to Landing Page"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-rsu-navy to-[#0a2e5c] rounded-xl flex items-center justify-center shadow-md border border-white/20 group-hover:from-emerald-600 group-hover:to-emerald-500 duration-200">
            <GraduationCap className="text-white drop-shadow-sm group-hover:scale-105 transition-transform" size={24} />
          </div>
          <div className="flex flex-col justify-center">
            <h1 
              style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}
              className="text-xs md:text-sm font-display font-black uppercase tracking-tight leading-none group-hover:text-emerald-500 transition-colors"
            >
              Rivers State University
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-bold text-white bg-rsu-orange px-1.5 py-0.5 rounded uppercase tracking-wider">
                CampusGryd
              </span>
              <span className="text-[9px] font-bold text-slate-400 group-hover:text-emerald-500 transition-colors font-mono uppercase tracking-tight">
                • Back to Home
              </span>
            </div>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {/* Dedicated prominent Go to Homepage Button */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-rsu-navy to-[#0a2e5c] hover:from-emerald-600 hover:to-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer border border-white/10 group"
          title="Go to Homepage"
        >
          <Home size={15} className="text-emerald-400 group-hover:text-white transition-colors" />
          <span className="hidden xs:inline">Home</span>
        </button>

        <div className="text-right hidden md:flex flex-col items-end">
          <p className="text-[10px] font-mono font-black text-rsu-navy dark:text-rsu-green uppercase tracking-widest leading-none">
            Philemon Progress
          </p>
          <p className="text-[8px] font-bold text-rsu-muted uppercase mt-0.5">System Architect</p>
        </div>
        
        <button
          onClick={() => setIsVoiceAssistEnabled(!isVoiceAssistEnabled)}
          className={cn(
            "p-2.5 rounded-xl transition-all flex items-center justify-center shadow-inner border cursor-pointer",
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
            "p-2.5 bg-rsu-bg rounded-xl transition-all flex items-center justify-center shadow-inner border cursor-pointer",
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
