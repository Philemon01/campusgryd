import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, MapPin, Navigation, X, Volume2, Bookmark, BookmarkCheck, ArrowRight, Clock } from 'lucide-react';
import { Location, RouteOption, Maneuver } from '../../types';
import { cn } from '../../lib/utils';

interface InfoPanelProps {
  selectedLocation: Location | null;
  isPanelExpanded: boolean;
  isNavigating: boolean;
  savedLocationIds: string[];
  plannedRoutes: RouteOption[];
  selectedRouteId: 'fastest' | 'shortest';
  navigationPath: [number, number][] | null;
  setIsPanelExpanded: (e: boolean) => void;
  handleGetDirections: () => void;
  setSelectedLocation: (l: Location | null) => void;
  endSession: () => void;
  playVoiceDirections: (t: string) => void;
  toggleSaveLocation: (id: string) => void;
  setSelectedRouteId: (id: 'fastest' | 'shortest') => void;
  calculateWalkingTime: (c1: [number, number], c2: [number, number]) => number;
  maneuvers: Maneuver[];
  currentManeuverIndex: number;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  selectedLocation,
  isPanelExpanded,
  isNavigating,
  savedLocationIds,
  plannedRoutes,
  selectedRouteId,
  navigationPath,
  setIsPanelExpanded,
  handleGetDirections,
  setSelectedLocation,
  endSession,
  playVoiceDirections,
  toggleSaveLocation,
  setSelectedRouteId,
  calculateWalkingTime,
  maneuvers,
  currentManeuverIndex
}) => {
  if (!selectedLocation) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: isPanelExpanded ? 0 : '65%' }}
        exit={{ y: '100%' }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y < -50) setIsPanelExpanded(true);
          if (info.offset.y > 50) setIsPanelExpanded(false);
        }}
        className="absolute bottom-0 left-0 right-0 bg-rsu-card rounded-t-[32px] shadow-2xl z-20 border-t border-rsu-border md:max-w-md md:left-4 md:bottom-4 md:rounded-[32px] md:border overflow-hidden"
      >
        <div 
          className="w-full flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onClick={() => setIsPanelExpanded(!isPanelExpanded)}
        >
          <div className="w-12 h-1.5 bg-rsu-border rounded-full mb-2" />
          {!isPanelExpanded && (
            <div className="flex items-center gap-3 px-6 w-full">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-display font-black text-rsu-green truncate leading-tight">
                  {selectedLocation.officialName}
                </h3>
                <p className="text-[10px] font-bold text-rsu-muted uppercase tracking-widest truncate">
                  {selectedLocation.type} • Swipe up for info
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSaveLocation(selectedLocation.id);
                  }}
                  className={cn(
                    "p-2.5 rounded-xl transition-all border",
                    savedLocationIds.includes(selectedLocation.id)
                      ? "bg-rsu-green/10 border-rsu-green text-rsu-green"
                      : "bg-rsu-bg border-rsu-border text-rsu-muted hover:bg-rsu-border"
                  )}
                  title={savedLocationIds.includes(selectedLocation.id) ? "Remove from saved" : "Save location"}
                >
                  {savedLocationIds.includes(selectedLocation.id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                </button>

                {!isNavigating ? (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGetDirections();
                    }}
                    className="flex items-center gap-2 px-5 py-3 bg-rsu-navy text-white text-xs font-black uppercase tracking-tighter rounded-2xl shadow-xl shadow-rsu-navy/20 active:scale-95 transition-all hover:bg-rsu-navy/90"
                  >
                    <Navigation size={18} />
                    Go
                  </button>
                ) : (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentManeuverIndex >= 0) {
                        playVoiceDirections(maneuvers[currentManeuverIndex].instruction);
                      }
                    }}
                    className="p-3 bg-rsu-green text-white rounded-2xl shadow-lg active:scale-95"
                  >
                    <Volume2 size={18} />
                  </button>
                )}

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isNavigating) {
                      setSelectedLocation(null);
                    } else {
                      endSession();
                    }
                  }}
                  className="p-2.5 bg-rsu-bg rounded-xl text-rsu-muted hover:bg-rsu-border transition-colors border border-rsu-border"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={cn(
          "px-6 pb-6 pt-0 transition-all duration-300 overflow-hidden flex flex-col",
          !isPanelExpanded ? "h-0 opacity-0 pointer-events-none" : "h-auto max-h-[80vh] opacity-100"
        )}>
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2 py-0.5 bg-rsu-green/10 text-rsu-green text-[9px] font-bold uppercase tracking-widest rounded">
                  {selectedLocation.type}
                </span>
              </div>
              <h2 className="text-xl font-display font-black text-rsu-green leading-tight truncate">
                {selectedLocation.officialName}
              </h2>
            </div>
            <button 
              onClick={() => setIsPanelExpanded(false)}
              className="p-1.5 bg-rsu-bg rounded-lg text-rsu-muted hover:bg-rsu-border transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3 mb-5 overflow-y-auto no-scrollbar flex-1">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-rsu-navy/5 text-rsu-navy rounded-lg">
                <Info size={16} />
              </div>
              <p className="text-xs text-rsu-text leading-relaxed font-medium">
                {selectedLocation.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2.5 p-2.5 bg-rsu-bg rounded-xl border border-rsu-border/50">
                <div className="p-1.5 bg-rsu-navy/5 text-rsu-navy rounded-lg">
                  <MapPin size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-rsu-muted uppercase tracking-tighter">Address</p>
                  <p className="text-[11px] text-rsu-text font-bold truncate">
                    {selectedLocation.address || "Main Campus"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-rsu-bg rounded-xl border border-rsu-border/50">
                <div className="p-1.5 bg-rsu-navy/5 text-rsu-navy rounded-lg">
                  <Info size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-rsu-muted uppercase tracking-tighter">Landmark</p>
                  <p className="text-[11px] text-rsu-text font-bold truncate">
                    {selectedLocation.landmark}
                  </p>
                </div>
              </div>
            </div>

            {plannedRoutes.length > 0 && !isNavigating && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {plannedRoutes.map((route) => {
                    const isSelected = selectedRouteId === route.id;
                    return (
                      <button
                        key={route.id}
                        onClick={() => setSelectedRouteId(route.id)}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all text-left",
                          isSelected 
                            ? "border-rsu-navy bg-rsu-navy/5 shadow-sm" 
                            : "border-rsu-border bg-white hover:border-rsu-navy/40"
                        )}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                            isSelected ? "bg-rsu-navy text-white" : "bg-rsu-muted/10 text-rsu-muted"
                          )}>
                            {route.id}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-rsu-navy whitespace-nowrap">
                            {route.duration} min
                          </span>
                          <span className="text-[10px] font-bold text-rsu-muted">
                            {route.distance}m
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-auto border-t border-rsu-border/30 pt-4">
            <div className="flex gap-2">
              <button 
                onClick={() => toggleSaveLocation(selectedLocation.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2",
                  savedLocationIds.includes(selectedLocation.id)
                    ? "bg-rsu-green/10 border-rsu-green text-rsu-green"
                    : "bg-rsu-bg border-rsu-border text-rsu-muted hover:bg-rsu-border"
                )}
              >
                {savedLocationIds.includes(selectedLocation.id) ? (
                  <><BookmarkCheck size={18} /> Saved</>
                ) : (
                  <><Bookmark size={18} /> Save Place</>
                )}
              </button>

              {!isNavigating ? (
                <button 
                  onClick={handleGetDirections}
                  className="flex-[1.5] bg-rsu-navy text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rsu-navy/90 transition-all shadow-xl shadow-rsu-navy/20"
                >
                  <Navigation size={18} />
                  Start Journey
                </button>
              ) : (
                <button 
                  onClick={() => {
                    if (currentManeuverIndex >= 0) {
                      playVoiceDirections(maneuvers[currentManeuverIndex].instruction);
                    }
                  }}
                  className="flex-[1.5] bg-rsu-green text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rsu-green/90 transition-all shadow-xl shadow-rsu-green/20"
                >
                  <Volume2 size={18} />
                  Voice Assist
                </button>
              )}
            </div>
            
            {isNavigating && (
              <button 
                onClick={endSession}
                className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-bold text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100"
              >
                End Navigation Session
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
