import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation2, MapPin, ArrowRight, Clock, ChevronRight } from 'lucide-react';
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
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner relative overflow-hidden">
            {maneuvers[currentManeuverIndex].type === 'left' && <Navigation2 className="-rotate-90 text-white fill-white" size={28} />}
            {maneuvers[currentManeuverIndex].type === 'slight-left' && <Navigation2 className="-rotate-45 text-white fill-white" size={28} />}
            {maneuvers[currentManeuverIndex].type === 'right' && <Navigation2 className="rotate-90 text-white fill-white" size={28} />}
            {maneuvers[currentManeuverIndex].type === 'slight-right' && <Navigation2 className="rotate-45 text-white fill-white" size={28} />}
            {maneuvers[currentManeuverIndex].type === 'straight' && <Navigation2 className="text-white fill-white" size={28} />}
            {maneuvers[currentManeuverIndex].type === 'destination' && <MapPin className="text-white fill-white" size={28} />}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1.5">
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-white/10 rounded-full border border-white/10">
                <p className="text-[9px] font-black text-white/90 uppercase tracking-widest ">
                  {maneuvers[currentManeuverIndex].type === 'destination' ? 'Arrived' : `Instruction`}
                </p>
              </span>
              {maneuvers[currentManeuverIndex].distance > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full">
                  <span className="text-[10px] font-black uppercase tracking-tighter text-white">
                    In {maneuvers[currentManeuverIndex].distance}m
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1 px-2 py-0.5 bg-black/20 rounded-full border border-white/5">
                <Clock size={10} className="text-white/80" />
                <span className="text-[10px] font-black uppercase tracking-tighter text-white/90">
                  {Math.ceil(totalRemainingDistance / 80)} min
                </span>
              </div>
            </div>
            <h4 className="text-sm md:text-xl font-bold leading-tight tracking-tight">
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
