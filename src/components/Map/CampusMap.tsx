import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Location } from '../../types';
import { cn } from '../../lib/utils';
import { RSU_CENTER, DEFAULT_ZOOM } from '../../constants';

interface CampusMapProps {
  mapView: { center: [number, number], zoom: number };
  isSatelliteView: boolean;
  filteredLocations: Location[];
  selectedLocation: Location | null;
  startLocation: Location | null;
  userLocation: [number, number] | null;
  navigationPath: [number, number][] | null;
  mapFeatures?: any;
  onLocationSelect: (loc: Location) => void;
  createCustomIcon: (type: string, isActive: boolean) => L.DivIcon;
}

function MapController({ center, zoom, onMapMove }: { center: [number, number], zoom: number, onMapMove: (center: [number, number], zoom: number) => void }) {
  const map = useMap();
  
  // Update parents when map is moved manually
  React.useEffect(() => {
    const onMove = () => {
      const newCenter = map.getCenter();
      const newZoom = map.getZoom();
      onMapMove([newCenter.lat, newCenter.lng], newZoom);
    };

    map.on('moveend', onMove);
    return () => {
      map.off('moveend', onMove);
    };
  }, [map, onMapMove]);

  // Handle external view changes (selecting a location, etc)
  React.useEffect(() => {
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    
    // Only set view if it's significantly different to avoid fighting the user
    const dist = L.latLng(center).distanceTo(currentCenter);
    if (dist > 5 || Math.abs(zoom - currentZoom) > 0.1) {
      map.setView(center, zoom, { animate: true, duration: 1 });
    }
  }, [center, zoom, map]);
  
  return null;
}

export const CampusMap: React.FC<CampusMapProps & { onMapMove: (center: [number, number], zoom: number) => void }> = ({
  mapView,
  isSatelliteView,
  filteredLocations,
  selectedLocation,
  startLocation,
  userLocation,
  navigationPath,
  mapFeatures,
  onLocationSelect,
  createCustomIcon,
  onMapMove
}) => {
  return (
    <MapContainer 
      center={RSU_CENTER} 
      zoom={DEFAULT_ZOOM} 
      zoomControl={false}
      className={cn("w-full h-full", isSatelliteView && "satellite-active")}
    >
      <MapController 
        center={mapView.center} 
        zoom={mapView.zoom} 
        onMapMove={onMapMove}
      />
      {isSatelliteView ? (
        <TileLayer
          key="google-satellite"
          attribution="&copy; Google Earth Imagery"
          url="https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          maxZoom={20}
          zIndex={1}
        />
      ) : (
        <TileLayer
          key="osm-standard"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          zIndex={1}
        />
      )}
      
      {filteredLocations.map(loc => (
        <Marker 
          key={loc.id} 
          position={loc.coordinates}
          icon={createCustomIcon(loc.type, selectedLocation?.id === loc.id || startLocation?.id === loc.id)}
          eventHandlers={{
            click: () => {
              onLocationSelect(loc);
            }
          }}
        />
      ))}

      {userLocation && (
        <Marker 
          position={userLocation}
          icon={L.divIcon({
            className: 'user-marker-google',
            html: `<div class="relative w-12 h-12 flex items-center justify-center">
                    <div class="absolute w-10 h-10 bg-blue-500/20 rounded-full animate-ping opacity-70"></div>
                    
                    <div class="relative w-8 h-8 flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="absolute transform -rotate-[15deg]">
                        <path d="M16 2L24 28L16 22L8 28L16 2Z" fill="#4285F4" fill-opacity="0.3" stroke="#4285F4" stroke-width="0.5" />
                      </svg>
                      
                      <div class="z-10 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md">
                        <div class="w-2.5 h-2.5 bg-[#4285F4] rounded-full"></div>
                      </div>
                    </div>
                  </div>`,
            iconSize: [48, 48],
            iconAnchor: [24, 24]
          })}
        />
      )}

      {mapFeatures?.features?.map((feature: any, idx: number) => {
        if (feature.geometry.type === 'LineString') {
          const positions = feature.geometry.coordinates.map((coord: any) => [coord[1], coord[0]]);
          return (
            <Polyline 
              key={`feature-${idx}`}
              positions={positions}
              color={feature.properties.stroke || '#000000'}
              weight={2}
              opacity={0.6}
            />
          );
        }
        return null;
      })}

      {navigationPath && navigationPath.length > 0 && (
        <>
          <Polyline 
            positions={navigationPath} 
            color="#FFFFFF" 
            weight={10} 
            opacity={1}
          />
          <Polyline 
            positions={navigationPath} 
            color="#4285F4" 
            weight={7} 
            opacity={1}
            lineCap="round"
            lineJoin="round"
          />
          
          <Marker position={navigationPath[0]} icon={L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="w-10 h-10 flex items-center justify-center">
                    <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                      <div class="w-4 h-4 bg-[#4285F4] rounded-full"></div>
                    </div>
                  </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          })} />

          <Marker position={navigationPath[navigationPath.length - 1]} icon={L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="relative w-10 h-10 flex items-center justify-center drop-shadow-xl">
                    <svg viewBox="0 0 24 24" class="w-12 h-12" fill="#EA4335" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" stroke="white" stroke-width="0.5"/>
                    </svg>
                  </div>`,
            iconSize: [48, 48],
            iconAnchor: [24, 48]
          })} />
        </>
      )}

      <ZoomControl position="bottomright" />
    </MapContainer>
  );
};
