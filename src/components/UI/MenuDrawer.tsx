import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bookmark, Trash2, History, GraduationCap, Calendar, BookOpen } from 'lucide-react';
import { Location } from '../../types';

interface MenuDrawerProps {
  isMenuOpen: boolean;
  savedLocations: Location[];
  recentLocations: Location[];
  setIsMenuOpen: (o: boolean) => void;
  handleLocationSelect: (loc: Location) => void;
  toggleSaveLocation: (id: string) => void;
  getCategoryIcon: (type: string) => React.ReactNode;
  toggleEvents: () => void;
  toggleTimetable: () => void;
  user: any;
  onSignIn: () => void;
  onSignInRedirect?: () => void;
  onSignOut: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isMenuOpen,
  savedLocations,
  recentLocations,
  setIsMenuOpen,
  handleLocationSelect,
  toggleSaveLocation,
  getCategoryIcon,
  toggleEvents,
  toggleTimetable,
  user,
  onSignIn,
  onSignInRedirect,
  onSignOut,
  onOpenTerms,
  onOpenPrivacy
}) => {
  return (
    <AnimatePresence>
      {isMenuOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 left-0 bottom-0 w-full max-w-xs bg-rsu-card z-[1001] shadow-2xl flex flex-col border-r border-rsu-border"
          >
            <div className="p-6 border-b border-rsu-border flex justify-between items-center bg-rsu-navy text-white">
              <div>
                <h2 className="text-xl font-display font-black uppercase tracking-tight">Campus Menu</h2>
                <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Rivers State University</p>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {/* User Section */}
              <div className="p-4 bg-rsu-bg rounded-2xl border border-rsu-border/20 shadow-inner">
                {user ? (
                  <div className="flex items-center gap-3">
                    <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-rsu-orange" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-rsu-navy truncate">{user.displayName}</p>
                      <button onClick={onSignOut} className="text-[9px] font-bold text-red-500 uppercase tracking-widest hover:underline cursor-pointer">Sign Out</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {typeof window !== 'undefined' && window.self !== window.top ? (
                      <div className="text-center p-3 bg-rsu-orange/10 border border-rsu-orange/20 rounded-xl space-y-2">
                        <p className="text-[10px] font-black text-rsu-orange uppercase tracking-wider">🔒 Frame Restriction</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-normal">
                          Google Sign-In is blocked inside interactive preview frames. Click below to open in a new tab and sync successfully!
                        </p>
                        <a 
                          href={window.location.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-rsu-orange hover:bg-rsu-orange/90 text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer text-center"
                        >
                          Open in New Tab ↗
                        </a>
                      </div>
                    ) : (
                      <>
                        <button 
                          onClick={onSignIn}
                          className="w-full py-2.5 bg-white border-2 border-rsu-border/20 rounded-xl font-black text-[10px] text-rsu-navy uppercase tracking-widest hover:bg-rsu-navy hover:text-white transition-all shadow-sm cursor-pointer"
                        >
                          Sync with Popup
                        </button>
                        {onSignInRedirect && (
                          <button 
                            onClick={onSignInRedirect}
                            className="w-full py-2.5 bg-rsu-navy text-white border-2 border-rsu-navy rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rsu-orange hover:border-rsu-orange transition-all shadow-md cursor-pointer text-center"
                          >
                            Sync with Redirect
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Timetable Sync Quick Access */}
              <button
                onClick={() => {
                  toggleTimetable();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center p-5 bg-rsu-orange text-white rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 group overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <BookOpen size={80} strokeWidth={3} />
                </div>
                <div className="p-4 bg-white/20 rounded-2xl mr-4 shadow-inner">
                  <BookOpen size={30} />
                </div>
                <div className="text-left relative z-10">
                  <div className="font-black italic text-lg tracking-tight uppercase leading-tight">SMART SYNC</div>
                  <div className="text-[10px] font-bold opacity-80 uppercase tracking-widest leading-none mt-1">AI Timetable & Calendar</div>
                </div>
              </button>

              <div className="pt-4 pb-2">
                <div className="text-[10px] font-black text-rsu-navy/30 uppercase tracking-[0.2em] mb-4 px-2">Campus Tools</div>
              </div>

              {/* Saved Locations Section */}
              <div>
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Bookmark className="text-rsu-navy" size={18} />
                  <h3 className="text-xs font-black text-rsu-muted uppercase tracking-widest">Saved Locations</h3>
                </div>
                
                {savedLocations.length > 0 ? (
                  <div className="space-y-2">
                    {savedLocations.map(loc => (
                      <div key={loc.id} className="group relative">
                        <button
                          onClick={() => {
                            handleLocationSelect(loc);
                            setIsMenuOpen(false);
                          }}
                          className="w-full flex items-center p-3 bg-rsu-bg rounded-xl hover:bg-rsu-navy/5 transition-all text-left border border-transparent hover:border-rsu-navy/20"
                        >
                          <div className="p-2 bg-rsu-card rounded-lg mr-3 text-rsu-navy shadow-sm">
                            {getCategoryIcon(loc.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-rsu-text truncate">{loc.officialName}</div>
                            <div className="text-[10px] text-rsu-muted uppercase font-bold">{loc.type}</div>
                          </div>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveLocation(loc.id);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-rsu-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 px-4 bg-rsu-bg rounded-2xl border border-dashed border-rsu-border">
                    <Bookmark className="mx-auto text-rsu-muted mb-2 opacity-20" size={32} />
                    <p className="text-xs font-bold text-rsu-muted uppercase tracking-wider">No saved locations yet</p>
                    <p className="text-[10px] text-rsu-muted/60 mt-1">Tap the bookmark icon on a location to save it here.</p>
                  </div>
                )}
              </div>

              {/* Quick History / Recent Visits */}
              <div>
                <div className="flex items-center gap-2 mb-4 px-2">
                  <History className="text-rsu-navy" size={18} />
                  <h3 className="text-xs font-black text-rsu-muted uppercase tracking-widest">Recent Visits</h3>
                </div>
                
                {recentLocations.length > 0 ? (
                  <div className="space-y-2">
                    {recentLocations.map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => {
                          handleLocationSelect(loc);
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center p-3 bg-rsu-bg rounded-xl hover:bg-rsu-navy/5 transition-all text-left border border-transparent hover:border-rsu-navy/20"
                      >
                        <div className="p-2 bg-rsu-card rounded-lg mr-3 text-rsu-muted shadow-sm">
                          {getCategoryIcon(loc.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-rsu-text truncate">{loc.officialName}</div>
                          <div className="text-[10px] text-rsu-muted uppercase font-bold">{loc.type}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-[10px] font-bold text-rsu-muted/40 uppercase tracking-widest italic">No recent visits yet</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-rsu-border bg-rsu-bg/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-rsu-navy rounded-lg flex items-center justify-center">
                  <GraduationCap className="text-white" size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-rsu-navy uppercase tracking-tighter">CampusGryd</p>
                  <p className="text-[8px] font-bold text-rsu-muted uppercase tracking-widest">v1.2.0 Stable</p>
                </div>
              </div>
              <p className="text-[9px] font-mono font-bold text-rsu-muted uppercase tracking-widest text-center">
                By Philemon Progress
              </p>
              
              <div className="mt-4 flex justify-center gap-2.5 border-t border-rsu-border/10 pt-3">
                <button 
                  onClick={() => {
                    onOpenTerms?.();
                    setIsMenuOpen(false);
                  }}
                  className="text-[9px] font-bold text-rsu-navy/60 hover:text-rsu-orange dark:text-neutral-400 dark:hover:text-rsu-green uppercase tracking-wider underline cursor-pointer transition-colors"
                >
                  Terms
                </button>
                <span className="text-rsu-border/40 text-[9px] font-bold select-none">•</span>
                <button 
                  onClick={() => {
                    onOpenPrivacy?.();
                    setIsMenuOpen(false);
                  }}
                  className="text-[9px] font-bold text-rsu-navy/60 hover:text-rsu-orange dark:text-neutral-400 dark:hover:text-rsu-green uppercase tracking-wider underline cursor-pointer transition-colors"
                >
                  Privacy Policy
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
