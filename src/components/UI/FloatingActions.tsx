import React from 'react';
import { Layers, LocateFixed, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FloatingActionsProps {
  isSatelliteView: boolean;
  setIsSatelliteView: (s: boolean) => void;
  setNotification: (n: { message: string, type: 'info' | 'error' | 'success' }) => void;
  handleLocateMe: () => void;
  isFollowingUser: boolean;
  toggleEvents: () => void;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({
  isSatelliteView,
  setIsSatelliteView,
  setNotification,
  handleLocateMe,
  isFollowingUser,
  toggleEvents
}) => {
  return (
    <div className="absolute right-4 bottom-24 flex flex-col gap-3 z-30">
      <button
        onClick={toggleEvents}
        className="p-3 bg-white text-rsu-navy border border-rsu-border rounded-full shadow-lg hover:bg-rsu-navy/10 transition-all flex items-center justify-center"
        title="Campus Schedule"
      >
        <Calendar size={24} />
      </button>

      <button
        onClick={() => {
          setIsSatelliteView(!isSatelliteView);
          setNotification({ 
            message: `Switched to ${!isSatelliteView ? 'Satellite' : 'Map'} View`, 
            type: 'info' 
          });
        }}
        className={cn(
          "p-3 rounded-full shadow-lg border transition-all duration-300 flex items-center justify-center",
          isSatelliteView 
            ? "bg-[#4285F4] text-white border-[#4285F4]" 
            : "bg-white text-rsu-navy border-rsu-border hover:bg-rsu-navy/10"
        )}
        title={isSatelliteView ? "Switch to Map View" : "Switch to Satellite View"}
      >
        <Layers size={24} className={cn(isSatelliteView && "animate-pulse")} />
      </button>

      <button 
        onClick={handleLocateMe}
        className={cn(
          "p-3 rounded-full shadow-lg transition-all border",
          isFollowingUser 
            ? "bg-rsu-navy text-white border-rsu-navy ring-4 ring-rsu-navy/10" 
            : "bg-rsu-card text-rsu-green border-rsu-border hover:bg-rsu-bg"
        )}
        title="Locate Me"
      >
        <LocateFixed size={24} className={cn(isFollowingUser && "animate-pulse")} />
      </button>
    </div>
  );
};
