
export interface OSRMStep {
  maneuver: {
    instruction: string;
    location: [number, number];
    type: string;
    modifier?: string;
  };
  distance: number;
  duration: number;
  name: string;
}

export interface OSRMRoute {
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
  legs: {
    steps: OSRMStep[];
    distance: number;
    duration: number;
    summary: string;
  }[];
  distance: number;
  duration: number;
}

export async function fetchOSRMRoute(start: [number, number], end: [number, number]): Promise<OSRMRoute | null> {
  const url = `https://router.project-osrm.org/route/v1/walking/${start[1]},${start[0]};${end[1]},${end[0]}?steps=true&geometries=geojson&overview=full`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      return data.routes[0];
    }
    return null;
  } catch (error) {
    console.error('OSRM Fetch Error:', error);
    return null;
  }
}
