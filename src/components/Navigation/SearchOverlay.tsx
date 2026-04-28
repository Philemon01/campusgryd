import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Mic, X, Navigation2, Loader2, Volume2 } from 'lucide-react';
import { Location } from '../../types';
import { cn } from '../../lib/utils';

interface SearchOverlayProps {
  isNavigating: boolean;
  searchQuery: string;
  selectedLocation: Location | null;
  startLocation: Location | null;
  userLocation: [number, number] | null;
  isListening: boolean;
  isSearchFocused: boolean;
  searchMode: 'destination' | 'start';
  searchResults: Location[];
  activeCategory: string;
  isSpeaking: boolean;
  setSearchQuery: (q: string) => void;
  setSearchMode: (m: 'destination' | 'start') => void;
  setIsSearchFocused: (f: boolean) => void;
  startListening: () => void;
  endSession: () => void;
  handleLocationSelect: (loc: Location) => void;
  handleGetDirections: () => void;
  setActiveCategory: (cat: any) => void;
  getCategoryIcon: (type: string) => React.ReactNode;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isNavigating,
  searchQuery,
  selectedLocation,
  startLocation,
  userLocation,
  isListening,
  isSearchFocused,
  searchMode,
  searchResults,
  activeCategory,
  isSpeaking,
  setSearchQuery,
  setSearchMode,
  setIsSearchFocused,
  startListening,
  endSession,
  handleLocationSelect,
  handleGetDirections,
  setActiveCategory,
  getCategoryIcon
}) => {
  return (
    <div className="absolute top-20 left-0 right-0 px-4 z-10 flex flex-col items-center">
      <div className="w-full max-w-2xl flex flex-col gap-1.5">
        <div className="flex-1 flex flex-col gap-1.5">
          {/* Start Point Search */}
          <div className={cn(
            "bg-rsu-card rounded-xl shadow-md border transition-all duration-300",
            searchMode === 'start' ? "border-blue-400 ring-2 ring-blue-400/10" : "border-rsu-border"
          )}>
            <div className="flex items-center px-4 py-2.5">
              <div className="mr-3 flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full border-2 border-blue-500 bg-white" />
              </div>
              <input 
                type="text"
                placeholder="From: Your Location"
                className="flex-1 outline-none bg-transparent text-[11px] font-bold text-rsu-text placeholder:text-rsu-muted uppercase tracking-tighter"
                value={searchMode === 'start' ? searchQuery : (startLocation?.officialName || (userLocation ? "My GPS Location" : ""))}
                onFocus={() => {
                  setIsSearchFocused(true);
                  setSearchMode('start');
                  setSearchQuery('');
                }}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchMode('start');
                }}
              />
              {startLocation && (
                <button onClick={() => handleLocationSelect(null as any)}>
                  <X size={14} className="text-rsu-muted" />
                </button>
              )}
            </div>
          </div>

          {/* Destination Search */}
          <div className={cn(
            "bg-rsu-card rounded-xl shadow-md border transition-all duration-300",
            searchMode === 'destination' ? "border-rsu-green ring-2 ring-rsu-green/10" : "border-rsu-border"
          )}>
            <div className="flex items-center px-4 py-2.5">
              <div className="mr-3 flex flex-col items-center">
                <div className="w-2.5 h-2.5 bg-rsu-green" />
              </div>
              <input 
                type="text"
                placeholder="To: Search destination..."
                className="flex-1 outline-none bg-transparent text-[11px] font-bold text-rsu-text placeholder:text-rsu-muted uppercase tracking-tighter"
                value={searchMode === 'destination' ? searchQuery : (selectedLocation?.officialName || "")}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchMode('destination');
                }}
                onFocus={() => {
                  setIsSearchFocused(true);
                  setSearchMode('destination');
                }}
                readOnly={isNavigating}
              />
              {!isNavigating && (
                <button 
                  onClick={startListening}
                  className={cn(
                    "p-1.5 rounded-full transition-all mr-1",
                    isListening ? "text-red-500 animate-pulse bg-red-50" : "text-rsu-muted hover:text-rsu-navy"
                  )}
                >
                  <Mic size={18} />
                </button>
              )}
              {(searchQuery || isNavigating || selectedLocation) && !isListening && (
                <button 
                  onClick={() => {
                    if (isNavigating) {
                      endSession();
                    } else if (searchMode === 'destination') {
                      setSearchQuery('');
                      handleLocationSelect(null as any);
                    } else {
                      setSearchQuery('');
                    }
                  }}
                >
                  <X size={16} className="text-rsu-muted" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {isNavigating && (
            <button
              onClick={() => handleGetDirections()}
              className={cn(
                "p-3 bg-rsu-green rounded-2xl shadow-xl text-white hover:bg-opacity-90 transition-all flex items-center justify-center h-[52px] w-[52px]",
                isSpeaking && "animate-pulse"
              )}
              aria-label="Play voice directions"
            >
              {isSpeaking ? <Loader2 className="animate-spin" size={20} /> : <Volume2 size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {isSearchFocused && searchResults.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full max-w-2xl mt-2 bg-rsu-card rounded-2xl shadow-2xl border border-rsu-border overflow-hidden max-h-64 overflow-y-auto no-scrollbar"
          >
            {searchResults.map(loc => (
              <button
                key={loc.id}
                className="w-full flex items-center px-4 py-3 hover:bg-rsu-bg text-left transition-colors border-b border-rsu-border last:border-0"
                onClick={() => handleLocationSelect(loc)}
              >
                <div className="p-2 bg-rsu-bg rounded-lg mr-3 text-rsu-green">
                  {getCategoryIcon(loc.type)}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-rsu-text leading-tight">{loc.officialName}</div>
                  <div className="text-xs text-rsu-muted mt-0.5">
                    {loc.aliases.join(', ')}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Filters */}
      {!isNavigating && (
        <div className="w-full max-w-md mt-3 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {(['all', 'faculty', 'college', 'admin', 'library', 'gate', 'facility'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-sm border",
                activeCategory === cat 
                  ? "bg-rsu-navy text-white border-rsu-navy" 
                  : "bg-rsu-card text-rsu-muted border-rsu-border hover:border-rsu-navy"
              )}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
