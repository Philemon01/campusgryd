import React, { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Modality } from "@google/genai";
import { 
  X, 
  Info
} from 'lucide-react';
import { locations } from './data/locations';
import { Location, Maneuver, RouteOption } from './types';
import { cn } from './lib/utils';
import { RSU_CENTER, DEFAULT_ZOOM } from './constants';
import { getCategoryIcon, createCustomIcon } from './lib/icons';

// Components
import { CampusMap } from './components/Map/CampusMap';
import { NavigationHUD } from './components/Navigation/NavigationHUD';
import { SearchOverlay } from './components/Navigation/SearchOverlay';
import { InfoPanel } from './components/Navigation/InfoPanel';
import { Header } from './components/UI/Header';
import { MenuDrawer } from './components/UI/MenuDrawer';
import { FloatingActions } from './components/UI/FloatingActions';

type Category = 'all' | 'faculty' | 'college' | 'admin' | 'hostel' | 'food' | 'gate' | 'sports' | 'library' | 'facility' | 'landmark';

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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(newPos);
          if (!selectedLocation && !isNavigating) {
            setMapView(prev => ({ ...prev, center: newPos, zoom: 16 }));
          }
        },
        (error) => {
          console.error("Initial GPS error:", error);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [selectedLocation, isNavigating]);

  useEffect(() => {
    if (selectedLocation) {
      const start = startLocation?.coordinates || userLocation || RSU_CENTER;
      const end = selectedLocation.coordinates;
      const startName = startLocation?.officialName || (userLocation ? "Your Location" : "Campus Center");
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
          setMapView(prev => ({ ...prev, center: newPos, zoom: 18 }));
          if (currentManeuverIndex >= 0 && maneuvers[currentManeuverIndex]) {
            const maneuverCoords = maneuvers[currentManeuverIndex].coordinates;
            const dist = getDistanceInMeters(newPos, maneuverCoords);
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

  const startListening = () => {
    if (isListening) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setNotification({ message: "Voice search is not supported in this browser.", type: 'error' });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsSearchFocused(true);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const ai = useMemo(() => {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'undefined') return null;
    try {
      return new GoogleGenAI({ apiKey: key });
    } catch (error) {
      return null;
    }
  }, []);

  const playVoiceDirections = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
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
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
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
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const fuse = useMemo(() => {
    return new Fuse(locations, {
      keys: ['officialName', 'aliases', 'type', 'description'],
      threshold: 0.4,
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

  const handleLocationSelect = (loc: Location) => {
    setRecentLocationIds(prev => {
      const filtered = prev.filter(id => id !== loc.id);
      return [loc.id, ...filtered].slice(0, 5);
    });
    if (searchMode === 'destination') {
      setSelectedLocation(loc);
      setIsPanelExpanded(false);
      setMapView({ center: loc.coordinates, zoom: 18 });
      setSearchQuery('');
    } else {
      setStartLocation(loc);
      setSearchQuery('');
      if (selectedLocation) {
        const start = loc.coordinates;
        const end = selectedLocation.coordinates;
        setNavigationPath([start, end]);
        setIsNavigating(true);
        setMapView({ center: [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2], zoom: 17 });
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
          setNotification({ message: "Could not get your location.", type: 'error' });
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
  };

  const toggleSaveLocation = (id: string) => {
    setSavedLocationIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const savedLocations = useMemo(() => locations.filter(loc => savedLocationIds.includes(loc.id)), [savedLocationIds]);
  const recentLocations = useMemo(() => recentLocationIds.map(id => locations.find(loc => loc.id === id)).filter(Boolean) as Location[], [recentLocationIds]);

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
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateWalkingTime = (coords1: [number, number], coords2: [number, number]) => {
    const d = getDistanceInMeters(coords1, coords2);
    return Math.ceil(d / 80);
  };

  // Defining Main Campus Road Network (Graph)
  const ROAD_NODES: [number, number][] = [
    [4.7958, 6.9835], // 0: Main Gate
    [4.7962, 6.9826], // 1: Entrance Road
    [4.7966, 6.9817], // 2: Convocation Junction
    [4.7972, 6.9811], // 3: Toward Admin
    [4.7976, 6.9804], // 4: Admin Junction (Center)
    [4.7986, 6.9799], // 5: Library Junction
    [4.7997, 6.9791], // 6: Science/Physics Junction
    [4.8011, 6.9784], // 7: North Campus / Hostels
    [4.7964, 6.9797], // 8: Law/Agric Branch start
    [4.7953, 6.9793], // 9: Deep Law Area
    [4.7946, 6.9806], // 10: South Road
    [4.7939, 6.9812], // 11: Back Gate
  ];

  const ROAD_EDGES: { [key: number]: number[] } = {
    0: [1],
    1: [0, 2],
    2: [1, 3, 10],
    3: [2, 4],
    4: [3, 5, 8],
    5: [4, 6],
    6: [5, 7],
    7: [6],
    8: [4, 9, 10],
    9: [8],
    10: [2, 8, 11],
    11: [10]
  };

  const findNearestRoadNode = (point: [number, number]): number => {
    let nearestIdx = 0;
    let minDist = getDistanceInMeters(point, ROAD_NODES[0]);
    ROAD_NODES.forEach((node, idx) => {
      const d = getDistanceInMeters(point, node);
      if (d < minDist) {
        minDist = d;
        nearestIdx = idx;
      }
    });
    return nearestIdx;
  };

  const findShortestRoadPath = (startIdx: number, endIdx: number): number[] => {
    const queue: [number, number[]][] = [[startIdx, [startIdx]]];
    const visited = new Set<number>();
    
    while (queue.length > 0) {
      const [curr, path] = queue.shift()!;
      if (curr === endIdx) return path;
      if (visited.has(curr)) continue;
      visited.add(curr);
      
      const neighbors = ROAD_EDGES[curr] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push([neighbor, [...path, neighbor]]);
        }
      }
    }
    return [startIdx, endIdx]; // Fallback
  };

  const generateRouteOptions = (start: [number, number], end: [number, number], startName: string, endName: string): RouteOption[] => {
    const directDist = getDistanceInMeters(start, end);
    const startNodeIdx = findNearestRoadNode(start);
    const endNodeIdx = findNearestRoadNode(end);
    
    // Road Path: Start -> Nearest Node -> ...Road Network... -> Nearest Node to End -> End
    const pathIndices = findShortestRoadPath(startNodeIdx, endNodeIdx);
    const roadWaypoints = pathIndices.map(idx => ROAD_NODES[idx]);
    
    const realisticPath: [number, number][] = [start];
    // Only add nearest road node if we aren't already there
    if (getDistanceInMeters(start, roadWaypoints[0]) > 5) {
      realisticPath.push(roadWaypoints[0]);
    }
    // Add road network waypoints
    roadWaypoints.slice(1, -1).forEach(wp => realisticPath.push(wp));
    // Add end node if not already there
    if (getDistanceInMeters(realisticPath[realisticPath.length-1], roadWaypoints[roadWaypoints.length-1]) > 5) {
      realisticPath.push(roadWaypoints[roadWaypoints.length-1]);
    }
    realisticPath.push(end);

    const roadDist = realisticPath.reduce((acc, curr, i) => {
      return i === 0 ? 0 : acc + getDistanceInMeters(realisticPath[i-1], curr);
    }, 0);

    const realisticManeuvers: Maneuver[] = realisticPath.map((coord, i) => {
      if (i === realisticPath.length - 1) {
        return { instruction: `Arriving at ${endName}.`, distance: 0, type: 'destination', coordinates: coord };
      }
      const distToNext = Math.floor(getDistanceInMeters(coord, realisticPath[i+1]));
      let instruction = "";
      if (i === 0) instruction = `Depart from ${startName} and head to the campus road.`;
      else if (i === realisticPath.length - 2) instruction = `Turn towards your destination property.`;
      else instruction = `Proceed along the road for ${distToNext}m.`;
      
      return { 
        instruction, 
        distance: distToNext, 
        type: i === 0 ? 'straight' : (i % 3 === 0 ? 'left' : 'right'), 
        coordinates: coord 
      };
    });

    return [
      {
        id: 'shortest',
        name: 'Direct Path (Off-Road)',
        duration: Math.ceil(directDist / 70),
        distance: Math.floor(directDist),
        path: [start, end],
        maneuvers: [
          { instruction: `Head directly from ${startName} to ${endName}. Note: This path cuts across terrain.`, distance: Math.floor(directDist), type: 'straight', coordinates: start },
          { instruction: `Arriving at ${endName}.`, distance: 0, type: 'destination', coordinates: end }
        ]
      },
      {
        id: 'fastest',
        name: 'Official Campus Road',
        duration: Math.ceil(roadDist / 90),
        distance: Math.floor(roadDist),
        path: realisticPath,
        maneuvers: realisticManeuvers
      }
    ];
  };

  const startNavigation = () => {
    if (!selectedLocation) return;
    const start = startLocation?.coordinates || userLocation || RSU_CENTER;
    const end = selectedLocation.coordinates;
    const startName = startLocation?.officialName || (userLocation ? "Your Location" : "Campus Center");
    const endName = selectedLocation.officialName;
    const routes = generateRouteOptions(start, end, startName, endName);
    setAvailableRoutes(routes);
    const activeRoute = routes.find(r => r.id === selectedRouteId) || routes[0];
    setManeuvers(activeRoute.maneuvers);
    setCurrentManeuverIndex(0);
    setIsNavigating(true);
    setNavigationPath(activeRoute.path);
    if (isVoiceAssistEnabled) {
      playVoiceDirections(`Routing to ${endName}. Choosing ${activeRoute.name}.`);
    }
  };

  const nextManeuver = () => {
    if (currentManeuverIndex < maneuvers.length - 1) {
      const nextIndex = currentManeuverIndex + 1;
      setCurrentManeuverIndex(nextIndex);
      setMapView(prev => ({ ...prev, center: maneuvers[nextIndex].coordinates, zoom: 19 }));
      if (isVoiceAssistEnabled) playVoiceDirections(maneuvers[nextIndex].instruction);
    } else {
      setIsNavigating(false);
      setManeuvers([]);
      setCurrentManeuverIndex(-1);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-rsu-bg">
      <CampusMap 
        mapView={mapView}
        isSatelliteView={isSatelliteView}
        filteredLocations={filteredLocations}
        selectedLocation={selectedLocation}
        startLocation={startLocation}
        userLocation={userLocation}
        navigationPath={navigationPath}
        onLocationSelect={(loc) => setSelectedLocation(loc)}
        createCustomIcon={createCustomIcon}
        onMapMove={(center, zoom) => setMapView({ center, zoom })}
      />

      <Header 
        isVoiceAssistEnabled={isVoiceAssistEnabled}
        isDarkMode={isDarkMode}
        setIsMenuOpen={setIsMenuOpen}
        setIsVoiceAssistEnabled={setIsVoiceAssistEnabled}
        setIsDarkMode={setIsDarkMode}
      />

      <NavigationHUD 
        isNavigating={isNavigating}
        currentManeuverIndex={currentManeuverIndex}
        maneuvers={maneuvers}
        totalRemainingDistance={totalRemainingDistance}
        onNextManeuver={nextManeuver}
        onEndSession={endSession}
      />

      <SearchOverlay 
        isNavigating={isNavigating}
        searchQuery={searchQuery}
        selectedLocation={selectedLocation}
        startLocation={startLocation}
        userLocation={userLocation}
        isListening={isListening}
        isSearchFocused={isSearchFocused}
        searchMode={searchMode}
        searchResults={searchResults}
        activeCategory={activeCategory}
        isSpeaking={isSpeaking}
        setSearchQuery={setSearchQuery}
        setSearchMode={setSearchMode}
        setIsSearchFocused={setIsSearchFocused}
        startListening={startListening}
        endSession={endSession}
        handleLocationSelect={handleLocationSelect}
        handleGetDirections={handleGetDirections}
        setActiveCategory={(cat) => setActiveCategory(cat)}
        getCategoryIcon={getCategoryIcon}
      />

      <FloatingActions 
        isSatelliteView={isSatelliteView}
        setIsSatelliteView={setIsSatelliteView}
        setNotification={setNotification}
        handleLocateMe={handleLocateMe}
      />

      <InfoPanel 
        selectedLocation={selectedLocation}
        isPanelExpanded={isPanelExpanded}
        isNavigating={isNavigating}
        savedLocationIds={savedLocationIds}
        plannedRoutes={plannedRoutes}
        selectedRouteId={selectedRouteId}
        navigationPath={navigationPath}
        setIsPanelExpanded={setIsPanelExpanded}
        handleGetDirections={handleGetDirections}
        setSelectedLocation={setSelectedLocation}
        endSession={endSession}
        playVoiceDirections={playVoiceDirections}
        toggleSaveLocation={toggleSaveLocation}
        setSelectedRouteId={setSelectedRouteId}
        calculateWalkingTime={calculateWalkingTime}
        maneuvers={maneuvers}
        currentManeuverIndex={currentManeuverIndex}
      />

      <MenuDrawer 
        isMenuOpen={isMenuOpen}
        savedLocations={savedLocations}
        recentLocations={recentLocations}
        setIsMenuOpen={setIsMenuOpen}
        handleLocationSelect={handleLocationSelect}
        toggleSaveLocation={toggleSaveLocation}
        getCategoryIcon={getCategoryIcon}
      />

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
            <button onClick={() => setNotification(null)} className="ml-auto p-1 hover:bg-white/20 rounded-full">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
    </div>
  );
}
