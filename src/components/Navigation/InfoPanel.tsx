import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, MapPin, Navigation, X, Volume2, Bookmark, BookmarkCheck, ArrowRight, Clock, Share2 } from 'lucide-react';
import { Location, RouteOption, Maneuver } from '../../types';
import { cn } from '../../lib/utils';

interface InfoPanelProps {
  selectedLocation: Location | null;
  isPanelExpanded: boolean;
  isNavigating: boolean;
  savedLocationIds: string[];
  plannedRoutes: RouteOption[];
  selectedRouteId: string;
  navigationPath: [number, number][] | null;
  setIsPanelExpanded: (e: boolean) => void;
  handleGetDirections: () => void;
  setSelectedLocation: (l: Location | null) => void;
  setStartLocation?: (l: Location | null) => void;
  endSession: () => void;
  playVoiceDirections: (t: string) => void;
  toggleSaveLocation: (id: string) => void;
  setSelectedRouteId: (id: string) => void;
  calculateWalkingTime: (c1: [number, number], c2: [number, number]) => number;
  maneuvers: Maneuver[];
  currentManeuverIndex: number;
  onShareRoute: () => void;
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
  setStartLocation,
  endSession,
  playVoiceDirections,
  toggleSaveLocation,
  setSelectedRouteId,
  calculateWalkingTime,
  maneuvers,
  currentManeuverIndex,
  onShareRoute
}) => {
  if (!selectedLocation) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: isPanelExpanded ? 0 : '50%' }}
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
          className="w-full flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
          onClick={() => setIsPanelExpanded(!isPanelExpanded)}
        >
          <div className="w-12 h-1 bg-rsu-border rounded-full mb-1" />
          {!isPanelExpanded && (
            <div className="flex items-center gap-2 px-6 w-full">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-display font-black text-rsu-green truncate leading-tight">
                  {selectedLocation.officialName}
                </h3>
                <p className="text-[9px] font-bold text-rsu-muted uppercase tracking-widest truncate">
                  {selectedLocation.type} • Swipe for info
                </p>
              </div>
              
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSaveLocation(selectedLocation.id);
                  }}
                  className={cn(
                    "p-2 rounded-lg transition-all border",
                    savedLocationIds.includes(selectedLocation.id)
                      ? "bg-rsu-green/10 border-rsu-green text-rsu-green"
                      : "bg-rsu-bg border-rsu-border text-rsu-muted hover:bg-rsu-border"
                  )}
                >
                  {savedLocationIds.includes(selectedLocation.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                </button>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onShareRoute();
                  }}
                  title="Share Route"
                  className="p-2 rounded-lg bg-rsu-bg border border-rsu-border text-rsu-muted hover:text-rsu-navy hover:bg-rsu-border transition-all"
                >
                  <Share2 size={16} />
                </button>

                {!isNavigating ? (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGetDirections();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-rsu-navy text-white text-[10px] font-black uppercase tracking-tighter rounded-xl shadow-lg active:scale-95 transition-all"
                  >
                    <Navigation size={14} />
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
                    className="p-2.5 bg-rsu-green text-white rounded-xl shadow-lg active:scale-95"
                  >
                    <Volume2 size={16} />
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
                  className="p-2 bg-rsu-bg rounded-lg text-rsu-muted hover:bg-rsu-border transition-colors border border-rsu-border"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={cn(
          "px-5 pb-5 pt-0 transition-all duration-300 overflow-hidden flex flex-col font-sans",
          !isPanelExpanded ? "h-0 opacity-0 pointer-events-none" : "h-auto max-h-[75vh] opacity-100"
        )}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-1.5 py-0.5 bg-rsu-green/10 text-rsu-green text-[8px] font-bold uppercase tracking-widest rounded">
                  {selectedLocation.type}
                </span>
              </div>
              <h2 className="text-lg font-display font-black text-rsu-green leading-tight truncate">
                {selectedLocation.officialName}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button 
                onClick={onShareRoute}
                title="Share Route"
                className="p-1 px-2.5 bg-rsu-navy/5 text-rsu-navy hover:bg-rsu-navy/10 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
              >
                <Share2 size={12} />
                <span>Share</span>
              </button>
              <button 
                onClick={() => setIsPanelExpanded(false)}
                className="p-1 bgColor-rsu-bg rounded-lg text-rsu-muted hover:bg-rsu-border transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-2 mb-3 overflow-y-auto no-scrollbar flex-1">
            <div className="flex items-start gap-2 p-2 bg-rsu-bg rounded-xl border border-rsu-border/20">
              <div className="p-1 bg-rsu-navy/5 text-rsu-navy rounded">
                <Info size={14} />
              </div>
              <p className="text-[11px] text-rsu-text leading-snug font-medium line-clamp-2">
                {selectedLocation.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-start gap-2 p-2 bg-rsu-bg rounded-xl border border-rsu-border/30">
                <div className="p-1 bg-rsu-navy/5 text-rsu-navy rounded">
                  <MapPin size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black text-rsu-muted uppercase truncate">Address</p>
                  <p className="text-[10px] text-rsu-text font-bold truncate">
                    {selectedLocation.address || "Main Campus"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 bg-rsu-bg rounded-xl border border-rsu-border/30">
                <div className="p-1 bg-rsu-navy/5 text-rsu-navy rounded">
                  <Info size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black text-rsu-muted uppercase truncate">Landmark</p>
                  <p className="text-[10px] text-rsu-text font-bold truncate">
                    {selectedLocation.landmark}
                  </p>
                </div>
              </div>
            </div>

            {plannedRoutes.length > 0 && !isNavigating && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[9px] font-black uppercase text-rsu-muted tracking-widest">Route Options</h4>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onShareRoute();
                    }}
                    className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-rsu-navy hover:text-rsu-green transition-colors"
                  >
                    <Share2 size={12} />
                    <span>Share Route</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {plannedRoutes.map((route) => {
                    const isSelected = selectedRouteId === route.id;
                    return (
                      <button
                        key={route.id}
                        onClick={() => setSelectedRouteId(route.id)}
                        className={cn(
                          "p-2 rounded-xl border transition-all text-left",
                          isSelected 
                            ? "border-rsu-navy bg-rsu-navy/5" 
                            : "border-rsu-border bg-white"
                        )}
                      >
                        <span className={cn(
                          "text-[7px] font-black uppercase tracking-wider block mb-0.5",
                          isSelected ? "text-rsu-navy" : "text-rsu-muted"
                        )}>
                          {route.name}
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-rsu-navy">{route.duration} min</span>
                          <span className="text-[9px] font-bold text-rsu-muted">{route.distance}m</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Maneuvers Preview */}
                <div className="bg-rsu-bg rounded-xl p-3 border border-rsu-border/30">
                  <h4 className="text-[9px] font-black uppercase text-rsu-muted mb-2 tracking-widest">Route Steps</h4>
                  <div className="space-y-3">
                    {(() => {
                      const currentRoute = plannedRoutes.find(r => r.id === selectedRouteId);
                      if (!currentRoute) return null;
                      
                      return (
                        <>
                          {currentRoute.maneuvers.slice(0, 3).map((m, i) => (
                            <div key={i} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-rsu-border" />
                                {i < currentRoute.maneuvers.slice(0, 3).length - 1 && <div className="w-px flex-1 bg-rsu-border my-1" />}
                              </div>
                              <p className="text-[10px] text-rsu-text leading-tight">{m.instruction}</p>
                            </div>
                          ))}
                          {currentRoute.maneuvers.length > 3 && (
                            <p className="text-[9px] text-rsu-navy font-bold text-center">Tap Start for full directions</p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-rsu-border/30">
            {!isNavigating && (
              <button 
                onClick={() => {
                  setStartLocation?.(selectedLocation);
                  setIsPanelExpanded(false);
                }}
                className="w-full py-2.5 bg-rsu-bg border border-rsu-border text-rsu-navy rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-rsu-border/20 transition-all shadow-sm"
              >
                <MapPin size={14} className="text-blue-500" />
                Set as Starting Point
              </button>
            )}
            <div className="flex gap-2">
              <button 
                onClick={() => toggleSaveLocation(selectedLocation.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border",
                  savedLocationIds.includes(selectedLocation.id)
                    ? "bg-rsu-green/10 border-rsu-green text-rsu-green"
                    : "bg-rsu-bg border-rsu-border text-rsu-muted"
                )}
              >
                {savedLocationIds.includes(selectedLocation.id) ? "Saved" : "Save Place"}
              </button>

              {!isNavigating ? (
                <button 
                  onClick={handleGetDirections}
                  className="flex-[1.8] bg-rsu-navy text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg shadow-rsu-navy/20"
                >
                  <Navigation size={14} />
                  Start Journey
                </button>
              ) : (
                <button 
                  onClick={() => {
                    if (currentManeuverIndex >= 0) {
                      playVoiceDirections(maneuvers[currentManeuverIndex].instruction);
                    }
                  }}
                  className="flex-[1.8] bg-rsu-green text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg shadow-rsu-green/20"
                >
                  <Volume2 size={14} />
                  Voice Assist
                </button>
              )}
            </div>
            
            {isNavigating && (
              <button 
                onClick={endSession}
                className="w-full py-2 rounded-lg bg-red-50 text-red-600 font-bold text-[9px] uppercase tracking-widest border border-red-100"
              >
                End Session
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
