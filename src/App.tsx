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
  MapPin
} from 'lucide-react';
import { locations } from './data/locations';
import { Location, Maneuver } from './types';
import { cn } from './lib/utils';

// --- Types ---
type Category = 'all' | 'faculty' | 'admin' | 'hostel' | 'food' | 'gate' | 'sports' | 'library';

// --- Constants ---
const RSU_CENTER: [number, number] = [4.8145, 6.9165];
const DEFAULT_ZOOM = 16;

// --- Icons ---
const getCategoryIcon = (type: string) => {
  switch (type) {
    case 'faculty': return <GraduationCap size={18} />;
    case 'admin': return <Building2 size={18} />;
    case 'hostel': return <Home size={18} />;
    case 'food': return <Utensils size={18} />;
    case 'gate': return <DoorOpen size={18} />;
    case 'sports': return <Trophy size={18} />;
    case 'library': return <Library size={18} />;
    default: return <MapPin size={18} />;
  }
};

const createCustomIcon = (type: string, isActive: boolean) => {
  return L.divIcon({
    className: cn('custom-marker', isActive && 'active'),
    html: `<div class="p-1.5">${isActive ? '<div class="w-2 h-2 bg-rsu-gold rounded-full animate-pulse"></div>' : ''}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
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

  // --- Persistence Effects ---
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

  const calculateWalkingTime = (coords1: [number, number], coords2: [number, number]) => {
    const R = 6371e3;
    const φ1 = coords1[0] * Math.PI/180;
    const φ2 = coords2[0] * Math.PI/180;
    const Δφ = (coords2[0]-coords1[0]) * Math.PI/180;
    const Δλ = (coords2[1]-coords1[1]) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;

    const speed = 80; // 80m/min
    return Math.ceil(d / speed);
  };

  const generateManeuvers = (start: [number, number], end: [number, number], startName: string, endName: string): Maneuver[] => {
    const steps: Maneuver[] = [];
    
    // Step 1: Start
    steps.push({
      instruction: `Starting from ${startName}. Head straight for 50 meters.`,
      distance: 50,
      type: 'straight',
      coordinates: start
    });

    // Step 2: Intermediate Turn (Simulated)
    // We create a midpoint that is slightly offset to simulate a turn
    const midLat = (start[0] + end[0]) / 2;
    const midLng = (start[1] + end[1]) / 2;
    const turnType = Math.random() > 0.5 ? 'left' : 'right';
    
    steps.push({
      instruction: `Turn ${turnType} at the next intersection.`,
      distance: 100,
      type: turnType,
      coordinates: [midLat, midLng]
    });

    // Step 3: Final Stretch
    steps.push({
      instruction: `Continue straight for 80 meters towards ${endName}.`,
      distance: 80,
      type: 'straight',
      coordinates: [(midLat + end[0]) / 2, (midLng + end[1]) / 2]
    });

    // Step 4: Destination
    steps.push({
      instruction: `You have arrived at ${endName}. Your destination is on the ${Math.random() > 0.5 ? 'left' : 'right'}.`,
      distance: 0,
      type: 'destination',
      coordinates: end
    });

    return steps;
  };

  const startNavigation = () => {
    if (!selectedLocation) return;
    
    const start = startLocation?.coordinates || userLocation || RSU_CENTER;
    const end = selectedLocation.coordinates;
    const startName = startLocation?.officialName || (userLocation ? "your current location" : "the main gate area");
    const endName = selectedLocation.officialName;

    const generatedManeuvers = generateManeuvers(start, end, startName, endName);
    setManeuvers(generatedManeuvers);
    setCurrentManeuverIndex(0);
    setIsNavigating(true);
    setNavigationPath([start, ...generatedManeuvers.map(m => m.coordinates), end]);

    if (isVoiceAssistEnabled) {
      playVoiceDirections(generatedManeuvers[0].instruction);
    }
  };

  const nextManeuver = () => {
    if (currentManeuverIndex < maneuvers.length - 1) {
      const nextIndex = currentManeuverIndex + 1;
      setCurrentManeuverIndex(nextIndex);
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
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController center={mapView.center} zoom={mapView.zoom} />
          
          {filteredLocations.map(loc => (
            <Marker 
              key={loc.id} 
              position={loc.coordinates}
              icon={createCustomIcon(loc.type, selectedLocation?.id === loc.id || startLocation?.id === loc.id)}
              eventHandlers={{
                click: () => {
                  if (isNavigating) {
                    setIsNavigating(false);
                    setNavigationPath(null);
                    setManeuvers([]);
                    setCurrentManeuverIndex(-1);
                  }
                  setSelectedLocation(loc);
                }
              }}
            />
          ))}

          {userLocation && (
            <Marker 
              position={userLocation}
              icon={L.divIcon({
                className: 'user-marker',
                html: '<div class="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg"></div>',
                iconSize: [16, 16]
              })}
            />
          )}

          {navigationPath && (
            <>
              <Polyline 
                positions={navigationPath} 
                color="#D4A017" 
                weight={6} 
                dashArray="10, 15"
                className="animate-pulse"
              />
              {/* Start Point Marker */}
              <Marker position={navigationPath[0]} icon={L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="w-8 h-8 bg-white rounded-full border-4 border-blue-500 flex items-center justify-center shadow-lg animate-pulse">
                        <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              })} />
              {/* Destination Point Marker */}
              <Marker position={navigationPath[navigationPath.length - 1]} icon={L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="w-10 h-10 bg-rsu-green rounded-full border-4 border-rsu-gold flex items-center justify-center shadow-xl">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4A017" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      </div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
              })} />
            </>
          )}

          <ZoomControl position="bottomright" />
        </MapContainer>
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
              notification.type === 'error' ? "bg-red-600 text-white" : "bg-rsu-green text-white"
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
      <header className="absolute top-0 left-0 right-0 z-20 bg-rsu-card/90 backdrop-blur-md border-b border-rsu-border px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 bg-rsu-bg rounded-xl text-rsu-green hover:bg-rsu-green/10 transition-all flex items-center justify-center"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rsu-green rounded-lg flex items-center justify-center shadow-sm">
              <GraduationCap className="text-rsu-gold" size={18} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xs font-display font-black text-rsu-green uppercase tracking-tighter leading-none">RSU Campus</h1>
              <p className="text-[8px] font-bold text-rsu-muted uppercase tracking-widest">Digital Guide</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden xs:block">
            <p className="text-[9px] font-mono font-black text-rsu-green uppercase tracking-widest leading-none">Philemon.Exorcist</p>
            <p className="text-[7px] font-bold text-rsu-muted uppercase tracking-widest">Lead Developer</p>
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
            className="p-2 bg-rsu-bg rounded-xl text-rsu-green hover:bg-rsu-green/10 transition-all flex items-center justify-center shadow-inner border border-rsu-green/10"
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
            className="absolute top-24 left-4 right-4 z-[30] bg-rsu-green text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              {maneuvers[currentManeuverIndex].type === 'left' && <Navigation2 className="-rotate-90" size={24} />}
              {maneuvers[currentManeuverIndex].type === 'right' && <Navigation2 className="rotate-90" size={24} />}
              {maneuvers[currentManeuverIndex].type === 'straight' && <Navigation2 size={24} />}
              {maneuvers[currentManeuverIndex].type === 'destination' && <MapPin size={24} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-0.5">
                {maneuvers[currentManeuverIndex].type === 'destination' ? 'Arrived' : `Step ${currentManeuverIndex + 1} of ${maneuvers.length}`}
              </p>
              <h4 className="text-sm font-bold leading-tight">
                {maneuvers[currentManeuverIndex].instruction}
              </h4>
            </div>
            <button 
              onClick={nextManeuver}
              className="p-3 bg-white text-rsu-green rounded-xl font-black text-xs uppercase tracking-tighter hover:bg-rsu-gold hover:text-white transition-all shadow-lg"
            >
              {currentManeuverIndex === maneuvers.length - 1 ? 'Done' : 'Next'}
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
                      isListening ? "text-red-500 animate-pulse bg-red-50" : "text-rsu-muted hover:text-rsu-green hover:bg-rsu-bg"
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
            {(['all', 'faculty', 'admin', 'hostel', 'food', 'library'] as Category[]).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-sm border",
                  activeCategory === cat 
                    ? "bg-rsu-green text-white border-rsu-green" 
                    : "bg-rsu-card text-rsu-muted border-rsu-border hover:border-rsu-green"
                )}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-3 z-10">
        <button 
          onClick={handleLocateMe}
          className="p-3 bg-rsu-card rounded-full shadow-lg text-rsu-green hover:bg-rsu-bg transition-colors border border-rsu-border"
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
                <div className="flex items-center gap-2 px-4 w-full">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-display font-black text-rsu-green truncate leading-tight">
                      {selectedLocation.officialName}
                    </h3>
                    <p className="text-[10px] font-bold text-rsu-muted uppercase tracking-widest truncate">
                      {selectedLocation.type} • Tap to view details
                    </p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isNavigating) {
                        setSelectedLocation(null);
                      } else {
                        endSession();
                      }
                    }}
                    className="p-2 bg-rsu-bg rounded-full text-rsu-muted hover:bg-rsu-border transition-colors"
                  >
                    <X size={16} />
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
                  <div className="p-2 bg-rsu-gold/10 text-rsu-gold rounded-lg">
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

                {navigationPath && (
                  <div className="flex items-center gap-3 p-4 bg-rsu-green/5 rounded-2xl border border-rsu-green/10">
                    <div className="p-2 bg-rsu-green text-white rounded-full">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-rsu-green uppercase tracking-wider">Estimated Walk</p>
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
                      className="flex-1 bg-rsu-green text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all shadow-lg shadow-rsu-green/20"
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
                          playVoiceDirections(`You are currently navigating to ${selectedLocation.officialName}. Follow the gold dashed line on the map.`);
                        }
                      }}
                      className="flex-1 bg-rsu-gold text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all shadow-lg shadow-rsu-gold/20"
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
                        ? "bg-rsu-gold/10 border-rsu-gold text-rsu-gold"
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
          <div className="w-10 h-10 bg-rsu-green rounded-xl flex items-center justify-center shadow-lg">
            <GraduationCap className="text-rsu-gold" size={24} />
          </div>
          <div className="bg-rsu-card/80 backdrop-blur-md px-3 py-1 rounded-lg border border-rsu-border shadow-sm">
            <h1 className="text-xs font-display font-black text-rsu-green uppercase tracking-tighter">RSU Campus Map</h1>
            <p className="text-[8px] font-bold text-rsu-muted uppercase tracking-widest">Digital Guide</p>
          </div>
        </div>
        <div className="bg-rsu-card/60 backdrop-blur-sm px-2 py-1 rounded-md border border-rsu-border/50 shadow-sm self-start">
          <p className="text-[9px] font-mono font-bold text-rsu-green/70 tracking-widest uppercase">
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
            className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-rsu-gold text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-bold text-xs"
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
              className="absolute top-0 left-0 bottom-0 w-full max-w-xs bg-rsu-card z-50 shadow-2xl flex flex-col border-r border-rsu-border"
            >
              <div className="p-6 border-b border-rsu-border flex justify-between items-center bg-rsu-green text-white">
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
                    <Bookmark className="text-rsu-gold" size={18} />
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
                            className="w-full flex items-center p-3 bg-rsu-bg rounded-xl hover:bg-rsu-green/5 transition-all text-left border border-transparent hover:border-rsu-green/20"
                          >
                            <div className="p-2 bg-rsu-card rounded-lg mr-3 text-rsu-green shadow-sm">
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
                    <History className="text-rsu-green" size={18} />
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
                          className="w-full flex items-center p-3 bg-rsu-bg rounded-xl hover:bg-rsu-green/5 transition-all text-left border border-transparent hover:border-rsu-green/20"
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
                  <div className="w-8 h-8 bg-rsu-green rounded-lg flex items-center justify-center">
                    <GraduationCap className="text-rsu-gold" size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-rsu-green uppercase tracking-tighter">RSU Digital Guide</p>
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
