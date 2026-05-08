import React, { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Modality } from "@google/genai";
import { 
  X, 
  Info
} from 'lucide-react';
import { AIChat } from './components/UI/AIChat';
import { locations } from './data/locations';
import mapFeaturesData from './data/rsu-map-features.json';
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
import { EventsPanel } from './components/UI/EventsPanel';
import { CustomCampusRouter, RoutingMode } from './services/router';
import { FeatureCollection } from 'geojson';

type Category = 'all' | 'faculty' | 'college' | 'admin' | 'hostel' | 'food' | 'gate' | 'sports' | 'library' | 'facility' | 'landmark';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchMode, setSearchMode] = useState<'destination' | 'start'>('destination');
  const [isFollowingUser, setIsFollowingUser] = useState(false);
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
  const [isEventsPanelOpen, setIsEventsPanelOpen] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isListening, setIsListening] = useState(false);
  const [maneuvers, setManeuvers] = useState<Maneuver[]>([]);
  const [currentManeuverIndex, setCurrentManeuverIndex] = useState(-1);
  const [isVoiceAssistEnabled, setIsVoiceAssistEnabled] = useState(true);
  const [availableRoutes, setAvailableRoutes] = useState<RouteOption[]>([]);
  const [plannedRoutes, setPlannedRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('shortest');
  const [recentLocationIds, setRecentLocationIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const recent = localStorage.getItem('recent_locations');
      return recent ? JSON.parse(recent) : [];
    }
    return [];
  });

  const campusRouter = useMemo(() => {
    return new CustomCampusRouter(mapFeaturesData as FeatureCollection);
  }, []);

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
      const startName = startLocation?.officialName || (userLocation ? "Your Location" : "Campus Center");
      const endName = selectedLocation.officialName;
      
      const routes = generateRouteOptions(
        start, 
        end, 
        startName, 
        endName
      );
      setPlannedRoutes(routes);
    } else {
      setPlannedRoutes([]);
    }
  }, [selectedLocation, startLocation, userLocation]);

  // Handle location watch
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newPos: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(newPos);
        
        // Only force map center if we are following user or in navigation from current location
        // IMPORTANT: We use a check for startLocation to avoid dragging user back when manual start is set
        if (isFollowingUser || (isNavigating && !startLocation)) {
          setMapView(prev => ({ ...prev, center: newPos, zoom: isNavigating ? 18 : prev.zoom }));
        }

        if (isNavigating && currentManeuverIndex >= 0 && maneuvers[currentManeuverIndex]) {
          const maneuverCoords = maneuvers[currentManeuverIndex].coordinates;
          const dist = getDistanceInMeters(newPos, maneuverCoords);
          if (dist < 15) {
            nextManeuver();
          }
        }
      },
      (error) => console.error("GPS Watch error:", error),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isFollowingUser, isNavigating, currentManeuverIndex, maneuvers, startLocation]);

  const handleLocateMe = () => {
    if (userLocation) {
      setMapView({ center: userLocation, zoom: 17 });
      setIsFollowingUser(true);
    }
  };

  // Turn off following when user manually moves map
  const onMapMove = (center: [number, number], zoom: number) => {
    setMapView({ center, zoom });
    if (isFollowingUser) setIsFollowingUser(false);
  };

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
      if (!loc) {
        setIsFollowingUser(true);
        if (userLocation) {
          setMapView({ center: userLocation, zoom: 17 });
        }
      } else {
        setIsFollowingUser(false);
        setMapView({ center: loc.coordinates, zoom: 17 });
      }
      setSearchQuery('');
      
      if (selectedLocation && loc) {
        const start = loc.coordinates;
        const end = selectedLocation.coordinates;
        const startName = loc.officialName;
        const endName = selectedLocation.officialName;
        
        const routes = generateRouteOptions(
          start, 
          end, 
          startName, 
          endName
        );
        
        setAvailableRoutes(routes);
        if (routes.length > 0) {
          setSelectedRouteId(routes[0].id);
          setNavigationPath(routes[0].path);
          setManeuvers(routes[0].maneuvers);
          setIsPanelExpanded(true);
          setMapView({ center: [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2], zoom: 16 });
        }
      }
    }
    setIsSearchFocused(false);
  };

  const handleEventNavigation = (locationId: string) => {
    const loc = locations.find(l => l.id === locationId);
    if (loc) {
      handleLocationSelect(loc);
      setIsEventsPanelOpen(false);
    }
  };

  const handleGetDirections = () => {
    startNavigation();
    setIsPanelExpanded(false);
  };

  const endSession = () => {
    setIsNavigating(false);
    setIsFollowingUser(false);
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

  const getBearing = (start: [number, number], end: [number, number]) => {
    const lat1 = start[0] * Math.PI / 180;
    const lat2 = end[0] * Math.PI / 180;
    const dLon = (end[1] - start[1]) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    let brng = Math.atan2(y, x) * 180 / Math.PI;
    return (brng + 360) % 360;
  };

  const getManeuverType = (prev: [number, number], curr: [number, number], next: [number, number]): 'straight' | 'left' | 'right' | 'slight-left' | 'slight-right' => {
    const b1 = getBearing(prev, curr);
    const b2 = getBearing(curr, next);
    let diff = b2 - b1;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    if (diff > 45) return 'right';
    if (diff > 10) return 'slight-right';
    if (diff < -45) return 'left';
    if (diff < -10) return 'slight-left';
    return 'straight';
  };

  const generatePathManeuvers = (path: [number, number][], startName: string, endName: string): Maneuver[] => {
    const rawManeuvers: Maneuver[] = [];
    for (let i = 0; i < path.length; i++) {
      const coord = path[i];
      if (i === path.length - 1) {
        rawManeuvers.push({ instruction: `Arriving at ${endName}.`, distance: 0, type: 'destination', coordinates: coord });
        continue;
      }
      
      const nextCoord = path[i+1];
      const distToNext = Math.floor(getDistanceInMeters(coord, nextCoord));
      let type: Maneuver['type'] = 'straight';
      let instruction = "";

      if (i === 0) {
        instruction = `Depart from ${startName} towards your destination.`;
      } else {
        type = getManeuverType(path[i-1], coord, nextCoord);
        if (type === 'straight') {
          instruction = `Proceed straight for ${distToNext}m.`;
        } else {
          const dir = type.includes('left') ? 'left' : 'right';
          instruction = `Turn ${type.includes('slight') ? 'slight ' : ''}${dir} and continue for ${distToNext}m.`;
        }
      }
      
      rawManeuvers.push({ instruction, distance: distToNext, type, coordinates: coord });
    }

    const groupedManeuvers: Maneuver[] = [];
    for (let i = 0; i < rawManeuvers.length; i++) {
      const m = rawManeuvers[i];
      if (groupedManeuvers.length > 0 && 
          groupedManeuvers[groupedManeuvers.length-1].type === 'straight' && 
          m.type === 'straight') {
        const last = groupedManeuvers[groupedManeuvers.length-1];
        last.distance += m.distance;
        last.instruction = `Continue straight for ${last.distance}m.`;
      } else {
        groupedManeuvers.push({ ...m });
      }
    }
    return groupedManeuvers;
  };

  const generateRouteOptions = (
    start: [number, number], 
    end: [number, number], 
    startName: string, 
    endName: string
  ): RouteOption[] => {
    const options: RouteOption[] = [];
    
    // 1. Shortcut Path (All paths allowed)
    const shortcutPath = campusRouter.findRoute(start, end, 'shortest');
    if (shortcutPath) {
      const dist = shortcutPath.reduce((acc, curr, i) => i === 0 ? 0 : acc + getDistanceInMeters(shortcutPath[i-1], curr), 0);
      options.push({
        id: 'shortest',
        name: 'Quick Shortcut',
        duration: Math.ceil(dist / 75), // slightly faster pace on paths
        distance: Math.floor(dist),
        path: shortcutPath,
        maneuvers: generatePathManeuvers(shortcutPath, startName, endName)
      });
    }

    // 2. Main Roads / Accessible (Prefers asphalt roads)
    const accessiblePath = campusRouter.findRoute(start, end, 'accessible');
    if (accessiblePath) {
      const dist = accessiblePath.reduce((acc, curr, i) => i === 0 ? 0 : acc + getDistanceInMeters(accessiblePath[i-1], curr), 0);
      options.push({
        id: 'accessible',
        name: 'Main Road (Accessible)',
        duration: Math.ceil(dist / 85), // easier walking on road
        distance: Math.floor(dist),
        path: accessiblePath,
        maneuvers: generatePathManeuvers(accessiblePath, startName, endName)
      });
    }

    // 3. Keep fallback if nothing found
    if (options.length === 0) {
      const directDist = getDistanceInMeters(start, end);
      options.push({
        id: 'offroad',
        name: 'Direct Path (Off-Road)',
        duration: Math.ceil(directDist / 70),
        distance: Math.floor(directDist),
        path: [start, end],
        maneuvers: [
          { instruction: `Head directly from ${startName} to ${endName}. Note: This path cuts across terrain.`, distance: Math.floor(directDist), type: 'straight', coordinates: start },
          { instruction: `Arriving at ${endName}.`, distance: 0, type: 'destination', coordinates: end }
        ]
      });
    }

    return options;
  };

  const startNavigation = () => {
    if (!selectedLocation) return;
    const start = startLocation?.coordinates || userLocation || RSU_CENTER;
    const end = selectedLocation.coordinates;
    const startName = startLocation?.officialName || (userLocation ? "Your Location" : "Campus Center");
    const endName = selectedLocation.officialName;
    
    const routes = generateRouteOptions(
      start, 
      end, 
      startName, 
      endName
    );
    
    setAvailableRoutes(routes);
    if (routes.length > 0) {
      const activeRoute = routes.find(r => r.id === selectedRouteId) || routes[0];
      setManeuvers(activeRoute.maneuvers);
      setCurrentManeuverIndex(0);
      setIsNavigating(true);
      setNavigationPath(activeRoute.path);
      
      // Auto-follow user only if starting from current location
      if (!startLocation) {
        setIsFollowingUser(true);
      } else {
        setIsFollowingUser(false);
      }
      
      if (isVoiceAssistEnabled) {
        playVoiceDirections(`Routing to ${endName}. Choosing ${activeRoute.name}.`);
      }
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
        mapFeatures={mapFeaturesData}
        onLocationSelect={(loc) => setSelectedLocation(loc)}
        createCustomIcon={createCustomIcon}
        onMapMove={onMapMove}
      />

      <AIChat 
        onLocationSelect={handleLocationSelect}
        onRouteRequest={(dest, start) => {
          setSelectedLocation(dest);
          if (start) setStartLocation(start);
          setTimeout(() => {
            startNavigation();
          }, 300);
        }}
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
        isFollowingUser={isFollowingUser}
        toggleEvents={() => setIsEventsPanelOpen(!isEventsPanelOpen)}
      />

      <AnimatePresence>
        {isEventsPanelOpen && (
          <EventsPanel 
            onClose={() => setIsEventsPanelOpen(false)}
            onNavigateTo={handleEventNavigation}
          />
        )}
      </AnimatePresence>

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
        toggleEvents={() => setIsEventsPanelOpen(!isEventsPanelOpen)}
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
