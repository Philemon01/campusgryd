export type LocationType = 'faculty' | 'admin' | 'hostel' | 'food' | 'gate' | 'sports' | 'library' | 'landmark';

export interface Location {
  id: string;
  officialName: string;
  aliases: string[];
  coordinates: [number, number]; // [lat, lng]
  type: LocationType;
  description: string;
  landmark: string;
  address?: string;
  image?: string;
}

export interface CampusEntry {
  name: string;
  aliases: string[];
  lat: number;
  lng: number;
  address: string;
  type: LocationType;
  description: string;
  landmark: string;
}

export interface Maneuver {
  instruction: string;
  distance: number;
  type: 'straight' | 'left' | 'right' | 'destination';
  coordinates: [number, number];
}
