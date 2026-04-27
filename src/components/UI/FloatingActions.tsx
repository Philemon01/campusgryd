import React from 'react';
import { Layers, LocateFixed } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FloatingActionsProps {
  isSatelliteView: boolean;
  setIsSatelliteView: (s: boolean) => void;
  setNotification: (n: { message: string, type: 'info' | 'error' | 'success' }) => void;
  handleLocateMe: () => void;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({
  isSatelliteView,
  setIsSatelliteView,
  setNotification,
  handleLocateMe
}) => {
  return (
    <div className="absolute right-4 bottom-24 flex flex-col gap-3 z-30">
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
        className="p-3 bg-rsu-card rounded-full shadow-lg text-rsu-green hover:bg-rsu-bg transition-colors border border-rsu-border"
        title="Locate Me"
      >
        <LocateFixed size={24} />
      </button>
    </div>
  );
};
