import React from 'react';
import { Layers, LocateFixed, Calendar, BookOpen, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FloatingActionsProps {
  isSatelliteView: boolean;
  setIsSatelliteView: (s: boolean) => void;
  setNotification: (n: { message: string, type: 'info' | 'error' | 'success' }) => void;
  handleLocateMe: () => void;
  isFollowingUser: boolean;
  toggleEvents: () => void;
  toggleTimetable: () => void;
  isSignedIn: boolean;
  onAddLocationClick: () => void;
  isLocating: boolean;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({
  isSatelliteView,
  setIsSatelliteView,
  setNotification,
  handleLocateMe,
  isFollowingUser,
  toggleEvents,
  toggleTimetable,
  isSignedIn,
  onAddLocationClick,
  isLocating
}) => {
  return (
    <div className="absolute right-4 bottom-24 flex flex-col gap-3 z-30">
      <button
        onClick={toggleTimetable}
        className="p-3 bg-rsu-orange text-white border-2 border-white rounded-full shadow-lg hover:bg-rsu-navy transition-all flex items-center justify-center scale-110"
        title="Smart Timetable Sync"
      >
        <BookOpen size={28} />
      </button>

      {isSignedIn && (
        <button
          onClick={onAddLocationClick}
          disabled={isLocating}
          className={cn(
            "p-3 rounded-full shadow-lg border transition-all duration-300 flex items-center justify-center scale-110",
            isLocating 
              ? "bg-slate-300 text-slate-500 animate-pulse border-slate-300"
              : "bg-[#0ea5e9] text-white border-[#0ea5e9] hover:bg-rsu-orange hover:border-rsu-orange",
            "dark:bg-emerald-600 dark:text-white dark:border-emerald-600 dark:hover:bg-rsu-orange dark:hover:border-rsu-orange"
          )}
          title="Add Custom Location (Checks GPS)"
          id="add-custom-location-btn"
        >
          <MapPin size={24} className={cn(isLocating && "animate-spin")} />
        </button>
      )}

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
            : "bg-white text-rsu-navy border-rsu-border hover:bg-rsu-navy/10",
          "dark:bg-white dark:text-rsu-green dark:border-white dark:hover:bg-rsu-orange dark:hover:text-white dark:hover:border-rsu-orange"
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
