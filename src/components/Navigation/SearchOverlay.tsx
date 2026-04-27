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
      <div className="w-full max-w-2xl flex flex-col gap-2">
        <div className="flex-1 flex flex-col gap-2">
          {/* Destination Search */}
          <div className="bg-rsu-card rounded-2xl shadow-xl border border-rsu-border overflow-hidden transition-all duration-300">
            <div className="flex items-center px-4 py-3">
              <Search className="text-rsu-muted mr-3" size={20} />
              <input 
                type="text"
                placeholder={isNavigating ? "Your Destination" : "Where to? (e.g. Masso, Library...)"}
                className="flex-1 outline-none bg-transparent text-rsu-text font-medium placeholder:text-rsu-muted"
                value={isNavigating ? (selectedLocation?.officialName || "") : searchQuery}
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
                    "p-2 rounded-full transition-all mr-1",
                    isListening ? "text-red-500 animate-pulse bg-red-50" : "text-rsu-muted hover:text-rsu-navy hover:bg-rsu-bg"
                  )}
                  title="Voice Search"
                >
                  <Mic size={20} />
                </button>
              )}
              {(searchQuery || isNavigating) && (
                <button 
                  onClick={() => {
                    if (isNavigating) {
                      // This part was slightly different in original code but logical equivalent
                      endSession();
                    } else {
                      setSearchQuery('');
                    }
                  }}
                >
                  <X size={18} className="text-rsu-muted" />
                </button>
              )}
            </div>
          </div>

          {/* Start Point */}
          {(isNavigating || (isSearchFocused && searchMode === 'start')) && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rsu-card rounded-2xl shadow-xl border border-rsu-border overflow-hidden"
            >
              <div className="flex items-center px-4 py-3">
                <Navigation2 className="text-blue-500 mr-3" size={20} />
                <input 
                  type="text"
                  placeholder="Starting point (Current Location)"
                  className="flex-1 outline-none bg-transparent text-rsu-text font-medium placeholder:text-rsu-muted"
                  value={startLocation?.officialName || (userLocation ? "Current Location" : "")}
                  onFocus={() => {
                    setIsSearchFocused(true);
                    setSearchMode('start');
                  }}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchMode('start');
                  }}
                />
              </div>
            </motion.div>
          )}
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
