import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, Polyline } from 'react-leaflet';
import L from 'leaflet';
import Fuse from 'fuse.js';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Modality } from "@google/genai";
import { 
  Search, 
  Navigation, 
  Info, 
  X, 
  ChevronUp, 
  Building2, 
  GraduationCap, 
  Home, 
  Utensils, 
  DoorOpen, 
  Trophy,
  Library,
  LocateFixed,
  Clock,
  ArrowRight,
  Sun,
  Moon,
  Volume2,
  Mic,
  Map as MapIcon,
  Navigation2,
  Loader2,
  Menu,
  Bookmark,
  BookmarkCheck,
  History,
  Trash2,
  Circle,
  MapPin,
  Layers
} from 'lucide-react';
import { locations } from './data/locations';
import { Location, Maneuver, RouteOption } from './types';
import { cn } from './lib/utils';

// --- Types ---
type Category = 'all' | 'faculty' | 'college' | 'admin' | 'hostel' | 'food' | 'gate' | 'sports' | 'library' | 'facility' | 'landmark';

// --- Constants ---
const RSU_CENTER: [number, number] = [4.7970, 6.9800];
const DEFAULT_ZOOM = 16;

// --- Icons ---
const getCategoryIcon = (type: string) => {
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

const createCustomIcon = (type: string, isActive: boolean) => {
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

// --- Components ---

/**
 * Component to handle map view changes
 */
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1 });
  }, [center, zoom, map]);
  return null;
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchMode, setSearchMode] = useState<'destination' | 'start'>('destination');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [navigationPath, setNavigationPath] = useState<[number, number][] | null>(null);
  const [mapView, setMapView] = useState({ center: RSU_CENTER, zoom: DEFAULT_ZOOM });
  const [isNavigating, setIsNavigating] = useState(false);
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'info' | 'success' } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [savedLocationIds, setSavedLocationIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('saved_locations');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isListening, setIsListening] = useState(false);
  const [maneuvers, setManeuvers] = useState<Maneuver[]>([]);
  const [currentManeuverIndex, setCurrentManeuverIndex] = useState(-1);
  const [isVoiceAssistEnabled, setIsVoiceAssistEnabled] = useState(true);
  const [availableRoutes, setAvailableRoutes] = useState<RouteOption[]>([]);
  const [plannedRoutes, setPlannedRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<'fastest' | 'shortest'>('fastest');
  const [recentLocationIds, setRecentLocationIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const recent = localStorage.getItem('recent_locations');
      return recent ? JSON.parse(recent) : [];
    }
    return [];
  });

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (selectedLocation) {
      const start = startLocation?.coordinates || userLocation || RSU_CENTER;
      const end = selectedLocation.coordinates;
      const startName = startLocation?.officialName || (userLocation ? "Current Location" : "Main Gate");
      const endName = selectedLocation.officialName;
      const routes = generateRouteOptions(start, end, startName, endName);
      setPlannedRoutes(routes);
    } else {
      setPlannedRoutes([]);
    }
  }, [selectedLocation, startLocation, userLocation]);

  useEffect(() => {
    let watchId: number | null = null;
    
    if (isNavigating && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newPos: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(newPos);
          
          // Auto-center map on user during navigation
          setMapView(prev => ({ ...prev, center: newPos, zoom: 18 }));

          if (currentManeuverIndex >= 0 && maneuvers[currentManeuverIndex]) {
            const maneuverCoords = maneuvers[currentManeuverIndex].coordinates;
            const dist = getDistanceInMeters(newPos, maneuverCoords);
            
            // If user is within threshold (15m) of the maneuver, advance automatically
            if (dist < 15) {
              nextManeuver();
            }
          }
        },
        (error) => {
          console.error("GPS Watch error:", error);
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      );
    }
    
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [isNavigating, currentManeuverIndex, maneuvers]);

  // --- persistence effects ---
  useEffect(() => {
    localStorage.setItem('saved_locations', JSON.stringify(savedLocationIds));
  }, [savedLocationIds]);

  useEffect(() => {
    localStorage.setItem('recent_locations', JSON.stringify(recentLocationIds));
  }, [recentLocationIds]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- Voice Search ---
  const startListening = () => {
    if (isListening) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setNotification({ message: "Voice search is not supported in this browser.", type: 'error' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsSearchFocused(true);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (event.error === 'not-allowed') {
        setNotification({ message: "Microphone access is required for voice search. Please check your browser permissions.", type: 'error' });
      } else if (event.error === 'no-speech' || event.error === 'aborted') {
        // Just stop listening, no alert needed
      } else {
        setNotification({ message: `Voice search error: ${event.error}`, type: 'error' });
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // --- Gemini TTS Setup ---
  const ai = useMemo(() => {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'undefined') {
      console.warn("GEMINI_API_KEY is not defined. AI voice features will be disabled.");
      return null;
    }
    try {
      return new GoogleGenAI({ apiKey: key });
    } catch (error) {
      console.error("Failed to initialize Gemini AI:", error);
      return null;
    }
  }, []);

  const playVoiceDirections = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);

    // Offline Fallback or No AI: Use browser's built-in SpeechSynthesis
    if (isOffline || !ai) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say clearly and helpfully: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        // Gemini TTS returns raw PCM (16-bit, mono, 24kHz)
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Int16Array(len / 2);
        for (let i = 0; i < len; i += 2) {
          bytes[i / 2] = (binaryString.charCodeAt(i) & 0xFF) | ((binaryString.charCodeAt(i + 1) & 0xFF) << 8);
        }
        
        const float32Data = new Float32Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
          float32Data[i] = bytes[i] / 32768.0;
        }

        const buffer = audioContext.createBuffer(1, float32Data.length, 24000);
        buffer.getChannelData(0).set(float32Data);

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.onended = () => {
          setIsSpeaking(false);
          audioContext.close();
        };
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsSpeaking(false);
    }
  };

  // --- Dark Mode Effect ---
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // --- Search Logic ---
  const fuse = useMemo(() => {
    return new Fuse(locations, {
      keys: ['officialName', 'aliases', 'type', 'description'],
      threshold: 0.4,
      includeMatches: true
    });
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    return fuse.search(searchQuery).map(result => result.item);
  }, [searchQuery, fuse]);

  const filteredLocations = useMemo(() => {
    if (activeCategory === 'all') return locations;
    return locations.filter(loc => loc.type === activeCategory);
  }, [activeCategory]);

  // --- Handlers ---
  const handleLocationSelect = (loc: Location) => {
    console.log("Selecting location:", loc.officialName, "Mode:", searchMode);
    
    // Add to Recent History
    setRecentLocationIds(prev => {
      const filtered = prev.filter(id => id !== loc.id);
      return [loc.id, ...filtered].slice(0, 5); // Keep last 5
    });

    if (searchMode === 'destination') {
      setSelectedLocation(loc);
      setIsPanelExpanded(false); // Start collapsed
      setMapView({ center: loc.coordinates, zoom: 18 });
      setSearchQuery('');
    } else {
      setStartLocation(loc);
      setSearchQuery('');
      if (selectedLocation) {
        // If we already have a destination, trigger navigation
        const start = loc.coordinates;
        const end = selectedLocation.coordinates;
        setNavigationPath([start, end]);
        setIsNavigating(true);
        setMapView({ 
          center: [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2], 
          zoom: 17 
        });
        
        const directionsText = `Navigating from ${loc.officialName} to ${selectedLocation.officialName}. The estimated walking time is ${calculateWalkingTime(start, end)} minutes.`;
        playVoiceDirections(directionsText);
      }
    }
    setIsSearchFocused(false);
  };

  const handleGetDirections = () => {
    startNavigation();
    setIsPanelExpanded(false);
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(pos);
          setMapView({ center: pos, zoom: 18 });
        },
        (error) => {
          console.error("Error getting location", error);
          setNotification({ message: "Could not get your location. Please check permissions.", type: 'error' });
        }
      );
    }
  };

  const endSession = () => {
    setIsNavigating(false);
    setNavigationPath(null);
    setManeuvers([]);
    setAvailableRoutes([]);
    setPlannedRoutes([]);
    setCurrentManeuverIndex(-1);
    setSelectedLocation(null);
    setStartLocation(null);
    setIsPanelExpanded(false);
    setSearchQuery('');
    setNotification({ message: "Navigation session ended.", type: 'info' });
  };

  const toggleSaveLocation = (id: string) => {
    setSavedLocationIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const savedLocations = useMemo(() => 
    locations.filter(loc => savedLocationIds.includes(loc.id)),
    [savedLocationIds]
  );

  const recentLocations = useMemo(() => 
    recentLocationIds.map(id => locations.find(loc => loc.id === id)).filter(Boolean) as Location[],
    [recentLocationIds]
  );

  const totalRemainingDistance = useMemo(() => {
    if (!maneuvers || currentManeuverIndex < 0) return 0;
    return maneuvers.slice(currentManeuverIndex).reduce((acc, m) => acc + m.distance, 0);
  }, [maneuvers, currentManeuverIndex]);

  const getDistanceInMeters = (coords1: [number, number], coords2: [number, number]) => {
    const R = 6371e3;
    const φ1 = coords1[0] * Math.PI/180;
    const φ2 = coords2[0] * Math.PI/180;
    const Δφ = (coords2[0]-coords1[0]) * Math.PI/180;
    const Δλ = (coords2[1]-coords1[1]) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateWalkingTime = (coords1: [number, number], coords2: [number, number]) => {
    const d = getDistanceInMeters(coords1, coords2);
    const speed = 80; // 80m/min
    return Math.ceil(d / speed);
  };

  const generateManeuvers = (start: [number, number], end: [number, number], startName: string, endName: string): Maneuver[] => {
    const steps: Maneuver[] = [];
    
    const mid1: [number, number] = [start[0], end[1]];
    const mid2: [number, number] = [end[0], start[1]];
    const mid = mid1; 

    steps.push({
      instruction: `Starting from ${startName}. Walk straight.`,
      distance: Math.floor(getDistanceInMeters(start, mid)),
      type: 'straight',
      coordinates: start
    });

    steps.push({
      instruction: `Turn at the junction.`,
      distance: Math.floor(getDistanceInMeters(mid, end)),
      type: 'right',
      coordinates: mid
    });

    steps.push({
      instruction: `Arriving at ${endName}. Your destination is ahead.`,
      distance: 0,
      type: 'destination',
      coordinates: end
    });

    return steps;
  };

  const generateRouteOptions = (start: [number, number], end: [number, number], startName: string, endName: string): RouteOption[] => {
    const directDist = getDistanceInMeters(start, end);
    const mid: [number, number] = [start[0], end[1]];
    const staircaseDist = getDistanceInMeters(start, mid) + getDistanceInMeters(mid, end);

    return [
      {
        id: 'shortest',
        name: 'Shortest Path',
        duration: Math.ceil(directDist / 70), // 70m/min
        distance: Math.floor(directDist),
        path: [start, end],
        maneuvers: [
          { instruction: `Head directly from ${startName} to ${endName}.`, distance: Math.floor(directDist), type: 'straight', coordinates: start },
          { instruction: `Arriving at ${endName}.`, distance: 0, type: 'destination', coordinates: end }
        ]
      },
      {
        id: 'fastest',
        name: 'Standard Route',
        duration: Math.ceil(staircaseDist / 90), // faster speed on main route
        distance: Math.floor(staircaseDist),
        path: [start, mid, end],
        maneuvers: generateManeuvers(start, end, startName, endName)
      }
    ];
  };

  const startNavigation = () => {
    if (!selectedLocation) return;
    
    const start = startLocation?.coordinates || userLocation || RSU_CENTER;
    const end = selectedLocation.coordinates;
    const startName = startLocation?.officialName || (userLocation ? "your current location" : "the main gate area");
    const endName = selectedLocation.officialName;

    const routes = generateRouteOptions(start, end, startName, endName);
    setAvailableRoutes(routes);
    
    // Choose the selected route (default to first one if not set)
    const activeRoute = routes.find(r => r.id === selectedRouteId) || routes[0];
    
    setManeuvers(activeRoute.maneuvers);
    setCurrentManeuverIndex(0);
    setIsNavigating(true);
    setNavigationPath(activeRoute.path);

    if (isVoiceAssistEnabled) {
      playVoiceDirections(`Routing to ${endName}. Choosing ${activeRoute.name}. estimated time ${activeRoute.duration} minutes.`);
    }
  };

  const nextManeuver = () => {
    if (currentManeuverIndex < maneuvers.length - 1) {
      const nextIndex = currentManeuverIndex + 1;
      setCurrentManeuverIndex(nextIndex);
      
      // Focus map on the next maneuver point
      setMapView(prev => ({ 
        ...prev, 
        center: maneuvers[nextIndex].coordinates, 
        zoom: 19 
      }));

      if (isVoiceAssistEnabled) {
        playVoiceDirections(maneuvers[nextIndex].instruction);
      }
    } else {
      setIsNavigating(false);
      setManeuvers([]);
      setCurrentManeuverIndex(-1);
      setNotification({ message: "You have reached your destination!", type: 'success' });
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-rsu-bg">
      {/* --- Map Layer --- */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={RSU_CENTER} 
          zoom={DEFAULT_ZOOM} 
          zoomControl={false}
          className={cn("w-full h-full", isSatelliteView && "satellite-active")}
        >
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
          
          <MapController center={mapView.center} zoom={mapView.zoom} />
          
          {filteredLocations.map(loc => (
            <Marker 
              key={loc.id} 
              position={loc.coordinates}
              icon={createCustomIcon(loc.type, selectedLocation?.id === loc.id || startLocation?.id === loc.id)}
              eventHandlers={{
                click: () => {
                  setSelectedLocation(loc);
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

          {navigationPath && (
            <>
              {/* Outer stroke for the route to make it pop */}
              <Polyline 
                positions={navigationPath} 
                color="#FFFFFF" 
                weight={10} 
                opacity={1}
              />
              {/* Main prominent blue route line */}
              <Polyline 
                positions={navigationPath} 
                color="#4285F4" 
                weight={7} 
                opacity={1}
                lineCap="round"
                lineJoin="round"
              />
              
              {/* Departure Marker - Google Maps style blue circle with white ring */}
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

              {/* Arrival Marker - Classic Red Map Pin */}
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
        
        {/* Map Type Toggle Button moved to Floating Action Buttons */}
      </div>

      {/* --- UI Overlay --- */}
      
      {/* Search Overlay (to close search when clicking outside) */}
      {isSearchFocused && (
        <div 
          className="absolute inset-0 z-[5] bg-black/5" 
          onClick={() => setIsSearchFocused(false)} 
        />
      )}

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={cn(
              "fixed bottom-24 left-1/2 z-[1000] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 min-w-[300px]",
              notification.type === 'error' ? "bg-red-600 text-white" : "bg-rsu-navy text-white"
            )}
          >
            {notification.type === 'error' ? <X size={20} /> : <Info size={20} />}
            <span className="font-medium">{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-auto p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Top AppBar --- */}
      <header className="absolute top-0 left-0 right-0 z-20 bg-rsu-card/95 backdrop-blur-xl border-b border-rsu-border/20 px-4 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2.5 bg-rsu-navy text-white rounded-xl hover:bg-rsu-navy/90 transition-all flex items-center justify-center shadow-lg border border-white/10 active:scale-95"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rsu-navy to-[#0a2e5c] rounded-xl flex items-center justify-center shadow-md border border-white/20">
              <GraduationCap className="text-white drop-shadow-sm" size={24} />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-sm md:text-base font-display font-black text-rsu-navy dark:text-white uppercase tracking-tight leading-none">
                Rivers State University
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-bold text-white bg-rsu-green px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Campus Map
                </span>
                <p className="text-[10px] font-bold text-rsu-muted uppercase tracking-widest hidden xs:block">
                  Digital Guide
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:flex flex-col items-end">
            <p className="text-[10px] font-mono font-black text-rsu-navy dark:text-rsu-green uppercase tracking-widest leading-none">
              Philemon.Exorcist
            </p>
            <p className="text-[8px] font-bold text-rsu-muted uppercase mt-0.5">System Architect</p>
          </div>
          
          <button
            onClick={() => setIsVoiceAssistEnabled(!isVoiceAssistEnabled)}
            className={cn(
              "p-2 rounded-xl transition-all flex items-center justify-center shadow-inner border",
              isVoiceAssistEnabled ? "bg-rsu-green/10 text-rsu-green border-rsu-green/20" : "bg-rsu-bg text-rsu-muted border-rsu-border"
            )}
            aria-label="Toggle voice assist"
            title={isVoiceAssistEnabled ? "Voice Assist On" : "Voice Assist Off"}
          >
            {isVoiceAssistEnabled ? <Volume2 size={20} /> : <Volume2 size={20} className="opacity-30" />}
          </button>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 bg-rsu-bg rounded-xl text-rsu-navy hover:bg-rsu-navy/10 transition-all flex items-center justify-center shadow-inner border border-rsu-navy/10"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Navigation Maneuver Overlay */}
      <AnimatePresence>
        {isNavigating && currentManeuverIndex >= 0 && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-24 left-4 right-4 z-[30] bg-[#4285F4] text-white p-5 rounded-2xl shadow-2xl flex items-center gap-5 border border-white/20"
          >
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
              {maneuvers[currentManeuverIndex].type === 'left' && <Navigation2 className="-rotate-90 text-white fill-white" size={28} />}
              {maneuvers[currentManeuverIndex].type === 'right' && <Navigation2 className="rotate-90 text-white fill-white" size={28} />}
              {maneuvers[currentManeuverIndex].type === 'straight' && <Navigation2 className="text-white fill-white" size={28} />}
              {maneuvers[currentManeuverIndex].type === 'destination' && <MapPin className="text-white fill-white" size={28} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2 mb-1">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-full">
                  {maneuvers[currentManeuverIndex].type === 'destination' ? 'Arrived' : `Step ${currentManeuverIndex + 1} of ${maneuvers.length}`}
                </p>
                {maneuvers[currentManeuverIndex].distance > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full">
                    <ArrowRight size={10} className="text-white" />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-white">
                      {maneuvers[currentManeuverIndex].distance}m
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1 px-2 py-0.5 bg-black/20 rounded-full">
                  <Clock size={10} className="text-white/80" />
                  <span className="text-[10px] font-black uppercase tracking-tighter text-white/90">
                    {totalRemainingDistance}m total
                  </span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/30 rounded-full border border-green-500/20">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[8px] font-black uppercase tracking-tighter text-white/80">Live</span>
                </div>
              </div>
              <h4 className="text-sm md:text-base font-bold leading-tight">
                {maneuvers[currentManeuverIndex].instruction}
              </h4>
            </div>
            <button 
              onClick={nextManeuver}
              className="p-3 bg-white text-rsu-navy rounded-xl font-black text-xs uppercase tracking-tighter hover:bg-rsu-green hover:text-white transition-all shadow-lg hidden md:block"
              title="Manual skip to next step"
            >
              {currentManeuverIndex === maneuvers.length - 1 ? 'Done' : 'Skip'}
            </button>
            <button 
              onClick={endSession}
              className="p-3 bg-red-500 text-white rounded-xl font-black text-xs uppercase tracking-tighter hover:bg-red-600 transition-all shadow-lg"
              title="End Session"
            >
              Stop
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar & Navigation Controls */}
      <div className="absolute top-20 left-0 right-0 px-4 z-10 flex flex-col items-center">
        <div className="w-full max-w-2xl flex flex-col gap-2">
          <div className="flex-1 flex flex-col gap-2">
            {/* Destination Search */}
            <div className="bg-rsu-card rounded-2xl shadow-xl border border-rsu-border overflow-hidden transition-all duration-300">
              <div className="flex items-center px-4 py-3">
                <Search className="text-rsu-muted mr-3" size={20} />
                <input 
                  type="text"
                  placeholder={isNavigating ? "Your Destination" : "Where to? (e.g. Masso, Library...)"}
                  className="flex-1 outline-none bg-transparent text-rsu-text font-medium placeholder:text-rsu-muted"
                  value={isNavigating ? selectedLocation?.officialName : searchQuery}
                  aria-label="Search for a location"
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchMode('destination');
                  }}
                  onFocus={() => {
                    setIsSearchFocused(true);
                    setSearchMode('destination');
                  }}
                  readOnly={isNavigating}
                />
                {!isNavigating && (
                  <button 
                    onClick={startListening}
                    className={cn(
                      "p-2 rounded-full transition-all mr-1",
                      isListening ? "text-red-500 animate-pulse bg-red-50" : "text-rsu-muted hover:text-rsu-navy hover:bg-rsu-bg"
                    )}
                    aria-label={isListening ? "Listening..." : "Search by voice"}
                    title="Voice Search"
                  >
                    <Mic size={20} />
                  </button>
                )}
                {(searchQuery || isNavigating) && (
                  <button 
                    onClick={() => {
                      if (isNavigating) {
                        // If navigating, X just clears the search view/panel but keeps journey
                        setSearchQuery('');
                        setSelectedLocation(null);
                      } else {
                        endSession();
                      }
                    }}
                    aria-label="Clear search"
                  >
                    <X size={18} className="text-rsu-muted" />
                  </button>
                )}
              </div>
            </div>

            {/* Start Point (Visible when navigating or focused) */}
            {(isNavigating || (isSearchFocused && searchMode === 'start')) && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rsu-card rounded-2xl shadow-xl border border-rsu-border overflow-hidden"
              >
                <div className="flex items-center px-4 py-3">
                  <Navigation2 className="text-blue-500 mr-3" size={20} />
                  <input 
                    type="text"
                    placeholder="Starting point (Current Location)"
                    className="flex-1 outline-none bg-transparent text-rsu-text font-medium placeholder:text-rsu-muted"
                    value={startLocation?.officialName || (userLocation ? "Current Location" : "")}
                    onFocus={() => {
                      setIsSearchFocused(true);
                      setSearchMode('start');
                    }}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchMode('start');
                    }}
                  />
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex gap-2">
            {isNavigating && (
              <button
                onClick={() => handleGetDirections()}
                className={cn(
                  "p-3 bg-rsu-green rounded-2xl shadow-xl text-white hover:bg-opacity-90 transition-all flex items-center justify-center h-[52px] w-[52px]",
                  isSpeaking && "animate-pulse"
                )}
                aria-label="Play voice directions"
              >
                {isSpeaking ? <Loader2 className="animate-spin" size={20} /> : <Volume2 size={20} />}
              </button>
            )}
          </div>
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {isSearchFocused && searchResults.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full max-w-2xl mt-2 bg-rsu-card rounded-2xl shadow-2xl border border-rsu-border overflow-hidden max-h-64 overflow-y-auto no-scrollbar"
            >
              {searchResults.map(loc => (
                <button
                  key={loc.id}
                  className="w-full flex items-center px-4 py-3 hover:bg-rsu-bg text-left transition-colors border-b border-rsu-border last:border-0"
                  onClick={() => handleLocationSelect(loc)}
                >
                  <div className="p-2 bg-rsu-bg rounded-lg mr-3 text-rsu-green">
                    {getCategoryIcon(loc.type)}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-rsu-text leading-tight">{loc.officialName}</div>
                    <div className="text-xs text-rsu-muted mt-0.5">
                      {loc.aliases.join(', ')}
                    </div>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Filters (Hidden when navigating) */}
        {!isNavigating && (
          <div className="w-full max-w-md mt-3 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {(['all', 'faculty', 'college', 'admin', 'library', 'gate', 'facility'] as Category[]).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-sm border",
                  activeCategory === cat 
                    ? "bg-rsu-navy text-white border-rsu-navy" 
                    : "bg-rsu-card text-rsu-muted border-rsu-border hover:border-rsu-navy"
                )}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
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

      {/* Info Panel (Slide-up / Draggable) */}
      <AnimatePresence>
        {selectedLocation && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: isPanelExpanded ? 0 : '65%' }}
            exit={{ y: '100%' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y < -50) setIsPanelExpanded(true);
              if (info.offset.y > 50) setIsPanelExpanded(false);
            }}
            className="absolute bottom-0 left-0 right-0 bg-rsu-card rounded-t-[32px] shadow-2xl z-20 border-t border-rsu-border md:max-w-md md:left-4 md:bottom-4 md:rounded-[32px] md:border overflow-hidden"
          >
            {/* Handle / Drag Area */}
            <div 
              className="w-full flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              onClick={() => setIsPanelExpanded(!isPanelExpanded)}
            >
              <div className="w-12 h-1.5 bg-rsu-border rounded-full mb-2" />
              {!isPanelExpanded && (
                <div className="flex items-center gap-3 px-6 w-full">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-display font-black text-rsu-green truncate leading-tight">
                      {selectedLocation.officialName}
                    </h3>
                    <p className="text-[10px] font-bold text-rsu-muted uppercase tracking-widest truncate">
                      {selectedLocation.type} • Tap for more
                    </p>
                  </div>
                  
                  {!isNavigating && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGetDirections();
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-rsu-navy text-white text-sm font-black uppercase tracking-tighter rounded-2xl shadow-xl shadow-rsu-navy/20 active:scale-95 transition-all hover:bg-rsu-navy/90 hover:shadow-rsu-navy/30"
                    >
                      <Navigation size={18} />
                      Start Navigation
                    </button>
                  )}

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isNavigating) {
                        setSelectedLocation(null);
                      } else {
                        endSession();
                      }
                    }}
                    className="p-2.5 bg-rsu-bg rounded-xl text-rsu-muted hover:bg-rsu-border transition-colors border border-rsu-border"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className={cn(
              "p-6 pt-0 transition-all duration-300 overflow-y-auto no-scrollbar max-h-[70vh]",
              !isPanelExpanded && "opacity-0 pointer-events-none h-0"
            )}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-rsu-green/10 text-rsu-green text-[10px] font-bold uppercase tracking-widest rounded">
                      {selectedLocation.type}
                    </span>
                  </div>
                  <h2 className="text-2xl font-display font-extrabold text-rsu-green leading-tight">
                    {selectedLocation.officialName}
                  </h2>
                  <p className="text-sm text-rsu-muted font-medium">
                    {selectedLocation.aliases.join(' • ')}
                  </p>
                </div>
                <button 
                  onClick={() => setIsPanelExpanded(false)}
                  className="p-2 bg-rsu-bg rounded-full text-rsu-muted hover:bg-rsu-border transition-colors"
                  title="Minimize"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rsu-green/10 text-rsu-green rounded-lg">
                    <Info size={18} />
                  </div>
                  <p className="text-sm text-rsu-text leading-relaxed">
                    {selectedLocation.description}
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rsu-green/10 text-rsu-green rounded-lg">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-rsu-muted uppercase tracking-wider">Address</p>
                    <p className="text-sm text-rsu-text font-medium">
                      {selectedLocation.address || "Main Campus, Nkpolu-Oroworukwo"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rsu-green/10 text-rsu-green rounded-lg">
                    <Info size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-rsu-muted uppercase tracking-wider">Landmark</p>
                    <p className="text-sm text-rsu-text font-medium">
                      {selectedLocation.landmark}
                    </p>
                  </div>
                </div>

                {/* Route Options Selection (only when planning) */}
                {!isNavigating && plannedRoutes.length > 0 && (
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-rsu-muted">Select Route</h4>
                      <div className="h-px flex-1 bg-rsu-border/30 mx-3" />
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {plannedRoutes.map((route) => {
                        const isSelected = selectedRouteId === route.id;
                        return (
                          <button
                            key={route.id}
                            onClick={() => setSelectedRouteId(route.id)}
                            className={cn(
                              "relative p-4 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden group active:scale-[0.98]",
                              isSelected 
                                ? "border-rsu-navy bg-rsu-navy/5 shadow-lg" 
                                : "border-rsu-border bg-white dark:bg-rsu-card/50 hover:border-rsu-navy/40"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
                                  isSelected ? "bg-rsu-navy text-white" : "bg-rsu-muted/10 text-rsu-muted"
                                )}>
                                  {route.name}
                                </span>
                                {route.id === 'shortest' && (
                                  <span className="text-[8px] font-bold text-rsu-green bg-rsu-green/10 px-1.5 py-0.5 rounded uppercase">Recommended</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={12} className={isSelected ? "text-rsu-navy" : "text-rsu-muted"} />
                                <span className={cn("text-sm font-black", isSelected ? "text-rsu-navy" : "text-rsu-navy dark:text-white")}>
                                  {route.duration} min
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1.5">
                                <div className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-rsu-navy animate-pulse" : "bg-rsu-muted/40")} />
                                <span className="text-[11px] font-bold text-rsu-muted uppercase tracking-tight">
                                  {route.distance} meters
                                </span>
                              </div>
                              <ArrowRight size={14} className={cn("transition-transform group-hover:translate-x-1", isSelected ? "text-rsu-navy" : "text-rsu-muted/30")} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {navigationPath && (
                  <div className="flex items-center gap-3 p-4 bg-rsu-navy/5 rounded-2xl border border-rsu-navy/10">
                    <div className="p-2 bg-rsu-navy text-white rounded-full">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-rsu-navy uppercase tracking-wider">Estimated Walk</p>
                      <p className="text-lg font-bold text-rsu-text">
                        ~{calculateWalkingTime(navigationPath[0], navigationPath[1])} mins
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <div className="flex-1 flex gap-2">
                  {!isNavigating ? (
                    <button 
                      onClick={handleGetDirections}
                      className="flex-1 bg-rsu-navy text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all shadow-lg shadow-rsu-navy/20"
                    >
                      <Navigation size={20} />
                      Go
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        if (currentManeuverIndex >= 0) {
                          playVoiceDirections(maneuvers[currentManeuverIndex].instruction);
                        } else {
                          playVoiceDirections(`You are currently navigating to ${selectedLocation.officialName}. Follow the navigation line on the map.`);
                        }
                      }}
                      className="flex-1 bg-rsu-green text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all shadow-lg shadow-rsu-green/20"
                    >
                      <Volume2 size={20} />
                      Voice
                    </button>
                  )}
                  
                  <button 
                    onClick={() => toggleSaveLocation(selectedLocation.id)}
                    className={cn(
                      "p-4 rounded-2xl transition-all border",
                      savedLocationIds.includes(selectedLocation.id)
                        ? "bg-rsu-green/10 border-rsu-green text-rsu-green"
                        : "bg-rsu-bg border-rsu-border text-rsu-muted hover:bg-rsu-border"
                    )}
                    title={savedLocationIds.includes(selectedLocation.id) ? "Remove from saved" : "Save location"}
                  >
                    {savedLocationIds.includes(selectedLocation.id) ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                  </button>
                  
                  {isNavigating && (
                    <button 
                      onClick={endSession}
                      className="p-4 rounded-2xl transition-all bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white font-bold"
                      title="End Session"
                    >
                      End Session
                    </button>
                  )}
                </div>
                
                <button className="p-4 bg-rsu-bg text-rsu-muted rounded-2xl hover:bg-rsu-border transition-colors">
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Branding Overlay (Bottom Left) */}
      <div className="absolute bottom-6 left-6 z-10 pointer-events-none flex flex-col gap-2">
        <div className="hidden md:flex items-center gap-2">
          <div className="w-10 h-10 bg-rsu-navy rounded-xl flex items-center justify-center shadow-lg">
            <GraduationCap className="text-white" size={24} />
          </div>
          <div className="bg-rsu-card/80 backdrop-blur-md px-3 py-1 rounded-lg border border-rsu-border shadow-sm">
            <h1 className="text-xs font-display font-black text-rsu-navy uppercase tracking-tighter">RSU Campus Map</h1>
            <p className="text-[8px] font-bold text-rsu-muted uppercase tracking-widest">Digital Guide</p>
          </div>
        </div>
        <div className="bg-rsu-card/60 backdrop-blur-sm px-2 py-1 rounded-md border border-rsu-border/50 shadow-sm self-start">
          <p className="text-[9px] font-mono font-bold text-rsu-navy/70 tracking-widest uppercase">
            Dev: Philemon.Exorcist
          </p>
        </div>
      </div>

      {/* Offline Indicator */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-rsu-green text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-bold text-xs"
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Offline Mode: Using cached map data
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Menu Sidebar --- */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 left-0 bottom-0 w-full max-w-xs bg-rsu-card z-[1001] shadow-2xl flex flex-col border-r border-rsu-border"
            >
              <div className="p-6 border-b border-rsu-border flex justify-between items-center bg-rsu-navy text-white">
                <div>
                  <h2 className="text-xl font-display font-black uppercase tracking-tight">Campus Menu</h2>
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Rivers State University</p>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                {/* Saved Locations Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4 px-2">
                    <Bookmark className="text-rsu-navy" size={18} />
                    <h3 className="text-xs font-black text-rsu-muted uppercase tracking-widest">Saved Locations</h3>
                  </div>
                  
                  {savedLocations.length > 0 ? (
                    <div className="space-y-2">
                      {savedLocations.map(loc => (
                        <div key={loc.id} className="group relative">
                          <button
                            onClick={() => {
                              handleLocationSelect(loc);
                              setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center p-3 bg-rsu-bg rounded-xl hover:bg-rsu-navy/5 transition-all text-left border border-transparent hover:border-rsu-navy/20"
                          >
                            <div className="p-2 bg-rsu-card rounded-lg mr-3 text-rsu-navy shadow-sm">
                              {getCategoryIcon(loc.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-rsu-text truncate">{loc.officialName}</div>
                              <div className="text-[10px] text-rsu-muted uppercase font-bold">{loc.type}</div>
                            </div>
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSaveLocation(loc.id);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-rsu-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4 bg-rsu-bg rounded-2xl border border-dashed border-rsu-border">
                      <Bookmark className="mx-auto text-rsu-muted mb-2 opacity-20" size={32} />
                      <p className="text-xs font-bold text-rsu-muted uppercase tracking-wider">No saved locations yet</p>
                      <p className="text-[10px] text-rsu-muted/60 mt-1">Tap the bookmark icon on a location to save it here.</p>
                    </div>
                  )}
                </div>

                {/* Quick History / Recent Visits */}
                <div>
                  <div className="flex items-center gap-2 mb-4 px-2">
                    <History className="text-rsu-navy" size={18} />
                    <h3 className="text-xs font-black text-rsu-muted uppercase tracking-widest">Recent Visits</h3>
                  </div>
                  
                  {recentLocations.length > 0 ? (
                    <div className="space-y-2">
                      {recentLocations.map(loc => (
                        <button
                          key={loc.id}
                          onClick={() => {
                            handleLocationSelect(loc);
                            setIsMenuOpen(false);
                          }}
                          className="w-full flex items-center p-3 bg-rsu-bg rounded-xl hover:bg-rsu-navy/5 transition-all text-left border border-transparent hover:border-rsu-navy/20"
                        >
                          <div className="p-2 bg-rsu-card rounded-lg mr-3 text-rsu-muted shadow-sm">
                            {getCategoryIcon(loc.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-rsu-text truncate">{loc.officialName}</div>
                            <div className="text-[10px] text-rsu-muted uppercase font-bold">{loc.type}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-[10px] font-bold text-rsu-muted/40 uppercase tracking-widest italic">No recent visits yet</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-rsu-border bg-rsu-bg/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-rsu-navy rounded-lg flex items-center justify-center">
                    <GraduationCap className="text-white" size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-rsu-navy uppercase tracking-tighter">RSU Digital Guide</p>
                    <p className="text-[8px] font-bold text-rsu-muted uppercase tracking-widest">v1.2.0 Stable</p>
                  </div>
                </div>
                <p className="text-[9px] font-mono font-bold text-rsu-muted uppercase tracking-widest text-center">
                  By Philemon.Exorcist
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
