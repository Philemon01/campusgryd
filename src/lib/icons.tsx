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
  MapPin 
} from 'lucide-react';
import { cn } from './utils';

export const getCategoryIcon = (type: string) => {
  switch (type) {
    case 'faculty': return <GraduationCap size={18} />;
    case 'college': return <GraduationCap size={18} />;
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
  const bgColor = isActive ? 'bg-rsu-navy dark:bg-[#4285F4]' : 'bg-white dark:bg-rsu-card';
  const dotColor = isActive ? 'bg-white' : 'bg-rsu-muted dark:bg-rsu-green';
  
  return L.divIcon({
    className: cn('custom-marker', isActive && 'active'),
    html: `
      <div class="relative flex items-center justify-center w-10 h-10">
        ${isActive ? `
          <div class="absolute w-14 h-14 bg-[#4285F4]/20 rounded-full animate-ping opacity-75"></div>
          <div class="absolute w-10 h-10 bg-[#4285F4]/30 rounded-full animate-pulse"></div>
        ` : ''}
        <div class="z-10 ${bgColor} w-7 h-7 rounded-full shadow-xl border-2 border-white dark:border-rsu-border flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-125 ring-4 ring-[#4285F4]/20' : 'scale-100 hover:scale-110'}">
          <div class="w-2.5 h-2.5 rounded-full ${dotColor}"></div>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};
