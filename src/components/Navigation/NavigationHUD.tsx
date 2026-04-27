import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation2, MapPin, ArrowRight, Clock } from 'lucide-react';
import { Maneuver } from '../../types';

interface NavigationHUDProps {
  isNavigating: boolean;
  currentManeuverIndex: number;
  maneuvers: Maneuver[];
  totalRemainingDistance: number;
  onNextManeuver: () => void;
  onEndSession: () => void;
}

export const NavigationHUD: React.FC<NavigationHUDProps> = ({
  isNavigating,
  currentManeuverIndex,
  maneuvers,
  totalRemainingDistance,
  onNextManeuver,
  onEndSession
}) => {
  return (
    <AnimatePresence>
      {isNavigating && currentManeuverIndex >= 0 && maneuvers[currentManeuverIndex] && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="absolute top-24 left-4 right-4 z-[30] bg-[#4285F4] text-white p-5 rounded-2xl shadow-2xl flex items-center gap-5 border border-white/20"
        >
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
            {maneuvers[currentManeuverIndex].type === 'left' && <Navigation2 className="-rotate-90 text-white fill-white" size={28} />}
            {maneuvers[currentManeuverIndex].type === 'right' && <Navigation2 className="rotate-90 text-white fill-white" size={28} />}
            {maneuvers[currentManeuverIndex].type === 'straight' && <Navigation2 className="text-white fill-white" size={28} />}
            {maneuvers[currentManeuverIndex].type === 'destination' && <MapPin className="text-white fill-white" size={28} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-full">
                {maneuvers[currentManeuverIndex].type === 'destination' ? 'Arrived' : `Step ${currentManeuverIndex + 1} of ${maneuvers.length}`}
              </p>
              {maneuvers[currentManeuverIndex].distance > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full">
                  <ArrowRight size={10} className="text-white" />
                  <span className="text-[10px] font-black uppercase tracking-tighter text-white">
                    {maneuvers[currentManeuverIndex].distance}m
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1 px-2 py-0.5 bg-black/20 rounded-full">
                <Clock size={10} className="text-white/80" />
                <span className="text-[10px] font-black uppercase tracking-tighter text-white/90">
                  {totalRemainingDistance}m total
                </span>
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/30 rounded-full border border-green-500/20">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-tighter text-white/80">Live</span>
              </div>
            </div>
            <h4 className="text-sm md:text-base font-bold leading-tight">
              {maneuvers[currentManeuverIndex].instruction}
            </h4>
          </div>
          <button 
            onClick={onNextManeuver}
            className="p-3 bg-white text-rsu-navy rounded-xl font-black text-xs uppercase tracking-tighter hover:bg-rsu-green hover:text-white transition-all shadow-lg hidden md:block"
            title="Manual skip to next step"
          >
            {currentManeuverIndex === maneuvers.length - 1 ? 'Done' : 'Skip'}
          </button>
          <button 
            onClick={onEndSession}
            className="p-3 bg-red-500 text-white rounded-xl font-black text-xs uppercase tracking-tighter hover:bg-red-600 transition-all shadow-lg"
            title="End Session"
          >
            Stop
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
