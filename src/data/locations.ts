import { CAMPUS_REGISTRY } from './campus-registry';
import { Location } from '../types';

export const locations: Location[] = Object.entries(CAMPUS_REGISTRY).map(([id, data]) => ({
  id,
  officialName: data.name,
  aliases: data.aliases,
  coordinates: [data.lat, data.lng],
  type: data.type,
  description: data.description,
  landmark: data.landmark,
  address: data.address
}));
