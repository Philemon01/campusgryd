import React from 'react';
import L from 'leaflet';
import { 
  GraduationCap, 
  Building2, 
  Home, 
  Utensils, 
  DoorOpen, 
  Trophy, 
  Library, 
  MapPin,
  BookOpen
} from 'lucide-react';
import { cn } from './utils';

export const getCategoryIcon = (type: string) => {
  switch (type) {
    case 'faculty': return <GraduationCap size={18} />;
    case 'college': return <GraduationCap size={18} />;
    case 'department': return <BookOpen size={18} />;
    case 'admin': return <Building2 size={18} />;
    case 'hostel': return <Home size={18} />;
    case 'food': return <Utensils size={18} />;
    case 'gate': return <DoorOpen size={18} />;
    case 'sports': return <Trophy size={18} />;
    case 'library': return <Library size={18} />;
    case 'facility': return <Building2 size={18} />;
    default: return <MapPin size={18} />;
  }
};

export const createCustomIcon = (type: string, isActive: boolean) => {
  if (isActive) {
    return L.divIcon({
      className: 'custom-marker active-highlight',
      html: `
        <div class="relative flex items-center justify-center w-14 h-14">
          <!-- Multi-tier pulsating radar waves -->
          <div class="absolute w-16 h-16 bg-rsu-orange/20 rounded-full animate-ping opacity-90" style="animation-duration: 2s;"></div>
          <div class="absolute w-12 h-12 bg-rsu-orange/30 rounded-full animate-pulse opacity-95" style="animation-duration: 1.5s;"></div>
          
          <!-- Elegant bouncing pin -->
          <div class="absolute w-10 h-10 bg-white rounded-full shadow-2xl border-2 border-rsu-orange flex items-center justify-center animate-bounce scale-125 z-10" style="animation-duration: 1s;">
            <!-- Inner color containing custom icon path -->
            <div class="w-8 h-8 rounded-full bg-rsu-orange text-white flex items-center justify-center shadow-inner">
              <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          </div>
          <!-- Subtle shadow under the bouncing pin -->
          <div class="absolute bottom-0 w-6 h-1.5 bg-black/25 rounded-full blur-[1px] opacity-60"></div>
        </div>
      `,
      iconSize: [56, 56],
      iconAnchor: [28, 48],
    });
  }

  const bgColor = 'bg-white dark:bg-rsu-card';
  const dotColor = 'bg-rsu-navy dark:bg-rsu-green';
  
  return L.divIcon({
    className: cn('custom-marker pointer-events-auto cursor-pointer'),
    html: `
      <div class="relative flex items-center justify-center w-10 h-10">
        <div class="z-10 ${bgColor} w-6 h-6 rounded-full shadow-md border-2 border-white dark:border-rsu-border/40 flex items-center justify-center transition-all duration-300 scale-100 hover:scale-125">
          <div class="w-2 h-2 rounded-full ${dotColor}"></div>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};
