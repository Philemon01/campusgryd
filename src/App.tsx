import React, { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Modality } from "@google/genai";
import { 
  X, 
  Info
} from 'lucide-react';
import { locations } from './data/locations';
import { campusEvents } from './data/events';
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
import { TimetablePanel } from './components/UI/TimetablePanel';
import { LegalPage } from './components/UI/LegalPage';
import { CompassControl } from './components/UI/CompassControl';
import { CustomCampusRouter, RoutingMode } from './services/router';
import { fetchOSRMRoute, OSRMRoute, OSRMStep } from './services/osrm';
import { GeminiChatService } from './services/geminiService';
import { ChatBot } from './components/Chat/ChatBot';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth, googleProvider, setCachedAccessToken, getCachedAccessToken } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, User, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { FeatureCollection } from 'geojson';

type Category = 'all' | 'faculty' | 'college' | 'admin' | 'hostel' | 'food' | 'gate' | 'sports' | 'library' | 'facility' | 'landmark' | 'department';

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
  const [osrmRoute, setOsrmRoute] = useState<OSRMRoute | null>(null);
  const [mapView, setMapView] = useState({ center: RSU_CENTER, zoom: DEFAULT_ZOOM });
  const [isNavigating, setIsNavigating] = useState(false);
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
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
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mapRotation, setMapRotation] = useState(0);
  const [currentPath, setCurrentPath] = useState(() => {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
  };
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userSlots, setUserSlots] = useState<any[]>([]);
  const [navSession, setNavSession] = useState<{
    phase: 'idle' | 'clarification' | 'selection' | 'guidance' | 'completion';
    destinationId: string | null;
    originId: string | null;
    mode: 'walk' | 'cab' | null;
    currentStepIndex: number;
  }>({
    phase: 'idle',
    destinationId: null,
    originId: null,
    mode: null,
    currentStepIndex: -1
  });
  const [isListening, setIsListening] = useState(false);
  const [maneuvers, setManeuvers] = useState<Maneuver[]>([]);
  const [currentManeuverIndex, setCurrentManeuverIndex] = useState(-1);
  const [isVoiceAssistEnabled, setIsVoiceAssistEnabled] = useState(true);
  const [plannedRoutes, setPlannedRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('osrm');
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

  const chatService = useMemo(() => {
    return new GeminiChatService(locations);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setCachedAccessToken(null);
      }
    });

    // Capture the result of a signInWithRedirect redirect flow on mount
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
            setCachedAccessToken(credential.accessToken);
          }
          setNotification({ message: `Successfully synced with Google: ${result.user.displayName}`, type: 'success' });
        }
      })
      .catch((error) => {
        console.error("Redirect login result failed:", error);
        if (error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized-domain') || error.code?.includes('unauthorized')) {
          const domain = typeof window !== 'undefined' ? window.location.hostname : 'your-vercel-domain.vercel.app';
          setUnauthorizedDomain(domain);
        } else if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
          setNotification({ message: `Sign-in redirect failed: ${error.message || error}`, type: 'error' });
        }
      });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setUserSlots([]);
      return;
    }

    const qSync = query(
      collection(db, 'user_syncs'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(qSync, async (snapshot) => {
      try {
        const slotsList: any[] = [];
        const promises = snapshot.docs.map(async (docSnap) => {
          const syncData = docSnap.data();
          if (syncData.timetableId) {
            const qSlots = collection(db, 'timetables', syncData.timetableId, 'slots');
            const slotsSnap = await getDocs(qSlots);
            slotsSnap.forEach((slotDoc) => {
              slotsList.push({
                id: slotDoc.id,
                ...slotDoc.data(),
                timetableId: syncData.timetableId
              });
            });
          }
        });
        await Promise.all(promises);
        setUserSlots(slotsList);
      } catch (err) {
        console.error("Error fetching slots for chatbot context:", err);
      }
    }, (error) => {
      console.error("onSnapshot error for user_syncs:", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async (useRedirect: boolean = false) => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    
    // Auto-detect iframe context which strictly blocks popup sign-ins
    const isIframe = typeof window !== 'undefined' && window.self !== window.top;

    if (useRedirect || isIframe) {
      try {
        setNotification({ message: "Redirecting to Google Sign-In...", type: 'info' });
        await signInWithRedirect(auth, googleProvider);
      } catch (error: any) {
        console.error("Firebase Redirect failed:", error);
        setNotification({ message: "Could not initialize redirect: " + error.message, type: 'error' });
        setIsSigningIn(false);
      }
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
      }
      setNotification({ message: "Signed in successfully!", type: 'success' });
    } catch (error: any) {
      console.error("Auth error:", error.code, error.message);
      if (error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized-domain') || error.code?.includes('unauthorized')) {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'your-vercel-domain.vercel.app';
        setUnauthorizedDomain(domain);
      } else if (error.code === 'auth/popup-blocked') {
        setNotification({ message: "Sign-in popup blocked. Please allow popups or use the Redirect option instead.", type: 'error' });
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Silently ignore or show minor info
      } else if (error.code !== 'auth/popup-closed-by-user') {
        setNotification({ message: "Sign in failed: " + error.message, type: 'error' });
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCachedAccessToken(null);
      setNotification({ message: "Signed out safely.", type: 'info' });
    } catch (error: any) {
      setNotification({ message: "Sign out failed.", type: 'error' });
    }
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          // Only show if it's new (within last 5 mins to avoid old ones on login)
          const isRecent = data.createdAt && (Date.now() - data.createdAt.toMillis() < 300000);
          if (isRecent) {
            setNotification({ message: data.message, type: 'info' });
          }
        }
      });
    });

    return () => unsubscribe();
  }, []);

  const [lastRouteCoords, setLastRouteCoords] = useState<{start: [number, number], end: [number, number]} | null>(null);

  useEffect(() => {
    const updateRoutes = async () => {
      if (selectedLocation) {
        const start = startLocation?.coordinates || userLocation || RSU_CENTER;
        const end = selectedLocation.coordinates;

        // Check if we already have a route for these approximate coordinates (within 5m)
        if (lastRouteCoords) {
          const dStart = getDistanceInMeters(lastRouteCoords.start, start);
          const dEnd = getDistanceInMeters(lastRouteCoords.end, end);
          if (dStart < 5 && dEnd < 1) return;
        }
        
        const startName = startLocation?.officialName || (userLocation ? "Your Location" : "Campus Center");
        const endName = selectedLocation.officialName;
        
        const routes = await generateRouteOptions(
          start, 
          end, 
          startName, 
          endName
        );
        setPlannedRoutes(routes);
        setLastRouteCoords({ start, end });
      } else {
        setPlannedRoutes([]);
        setLastRouteCoords(null);
      }
    };
    updateRoutes();
  }, [selectedLocation, startLocation, userLocation]);

  useEffect(() => {
    if (plannedRoutes.length > 0) {
      const activeRoute = plannedRoutes.find(r => r.id === selectedRouteId) || plannedRoutes[0];
      setNavigationPath(activeRoute.path);
      setManeuvers(activeRoute.maneuvers);
    } else if (!isNavigating) {
      setNavigationPath(null);
      setManeuvers([]);
    }
  }, [selectedRouteId, plannedRoutes, isNavigating]);

  // Handle position watch
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation(prev => {
          if (prev && prev[0] === latitude && prev[1] === longitude) return prev;
          return [latitude, longitude];
        });
      },
      (error) => console.error("GPS Watch error:", error),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Handle navigation logic and camera follow
  useEffect(() => {
    if (!userLocation) return;
    
    // Only force map center if we are following user or in navigation from current location
    if (isFollowingUser || (isNavigating && !startLocation)) {
      setMapView(prev => {
        const dist = getDistanceInMeters(prev.center, userLocation);
        if (dist < 1 && (isNavigating ? prev.zoom === 18 : true)) return prev;
        return { ...prev, center: userLocation, zoom: isNavigating ? 18 : prev.zoom };
      });
    }

    if (isNavigating && currentManeuverIndex >= 0 && maneuvers[currentManeuverIndex]) {
      const maneuverCoords = maneuvers[currentManeuverIndex].coordinates;
      const dist = getDistanceInMeters(userLocation, maneuverCoords);
      if (dist < 15) {
        nextManeuver();
      }
    }
  }, [userLocation, isFollowingUser, isNavigating, currentManeuverIndex, maneuvers, startLocation]);

  const handleLocateMe = () => {
    if (userLocation) {
      setMapView({ center: userLocation, zoom: 17 });
      setIsFollowingUser(true);
    }
  };

  // Turn off following when user manually moves map
  const onMapMove = React.useCallback((center: [number, number], zoom: number) => {
    setMapView(prev => {
      // Only update if significantly changed to avoid jitter
      const dist = getDistanceInMeters(prev.center, center);
      if (dist < 0.1 && Math.abs(prev.zoom - zoom) < 0.01) return prev;
      return { center, zoom };
    });
    if (isFollowingUser) setIsFollowingUser(false);
  }, [isFollowingUser]);

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

  const getAiInstance = React.useCallback(() => {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'undefined' || key === '') return null;
    try {
      return new GoogleGenAI({ apiKey: key });
    } catch (error) {
      console.error("Failed to create GoogleGenAI instance in App:", error);
      return null;
    }
  }, []);

  const playVoiceDirections = React.useCallback(async (text: string) => {
    if (isSpeaking) return;
    
    const ai = getAiInstance();
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
        model: "gemini-3.1-flash-tts-preview",
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
  }, [isSpeaking, isOffline, getAiInstance]);

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
    if (activeCategory === 'department' as any) {
      return locations.filter(loc => 
        loc.officialName.toLowerCase().includes('dept') || 
        loc.officialName.toLowerCase().includes('department') ||
        loc.aliases.some(a => a.toLowerCase().includes('dept') || a.toLowerCase().includes('department'))
      );
    }
    return locations.filter(loc => loc.type === activeCategory);
  }, [activeCategory]);

  const handleLocationSelect = React.useCallback(async (loc: Location | null) => {
    if (loc) {
      setRecentLocationIds(prev => {
        const filtered = prev.filter(id => id !== loc.id);
        return [loc.id, ...filtered].slice(0, 5);
      });
    }

    if (searchMode === 'destination') {
      setSelectedLocation(loc);
      setIsPanelExpanded(false);
      if (loc) {
        setMapView({ center: loc.coordinates, zoom: 18 });
      }
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
    }
    setIsSearchFocused(false);
  }, [searchMode, userLocation]);

  const handleEventNavigation = (locationId: string) => {
    const loc = locations.find(l => l.id === locationId);
    if (loc) {
      handleLocationSelect(loc);
      setIsEventsPanelOpen(false);
      setIsTimetableOpen(false);
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

  const generateRouteOptions = async (
    start: [number, number], 
    end: [number, number], 
    startName: string, 
    endName: string
  ): Promise<RouteOption[]> => {
    const options: RouteOption[] = [];
    
    // 1. OSRM Walking Route (Live API)
    const osrmData = await fetchOSRMRoute(start, end);
    if (osrmData) {
      const path = osrmData.geometry.coordinates.map(c => [c[1], c[0]] as [number, number]);
      const steps = osrmData.legs[0].steps.map(s => ({
        instruction: s.maneuver.instruction,
        distance: s.distance,
        type: convertOSRMType(s.maneuver.type, s.maneuver.modifier),
        coordinates: [s.maneuver.location[1], s.maneuver.location[0]] as [number, number]
      }));

      options.push({
        id: 'osrm',
        name: 'Walking Directions (OSRM)',
        duration: Math.ceil(osrmData.duration / 60),
        distance: Math.floor(osrmData.distance),
        path,
        maneuvers: steps
      });
    }
    
    // 2. Shortcut Path (Local Campus Router)
    const shortcutPath = campusRouter.findRoute(start, end, 'shortest');
    if (shortcutPath) {
      const dist = shortcutPath.reduce((acc, curr, i) => i === 0 ? 0 : acc + getDistanceInMeters(shortcutPath[i-1], curr), 0);
      options.push({
        id: 'shortest',
        name: 'Campus Shortcut',
        duration: Math.ceil(dist / 75), 
        distance: Math.floor(dist),
        path: shortcutPath,
        maneuvers: generatePathManeuvers(shortcutPath, startName, endName)
      });
    }

    // 3. Accessible (Local Campus Router)
    const accessiblePath = campusRouter.findRoute(start, end, 'accessible');
    if (accessiblePath) {
      const dist = accessiblePath.reduce((acc, curr, i) => i === 0 ? 0 : acc + getDistanceInMeters(accessiblePath[i-1], curr), 0);
      options.push({
        id: 'accessible',
        name: 'Main Roads',
        duration: Math.ceil(dist / 85),
        distance: Math.floor(dist),
        path: accessiblePath,
        maneuvers: generatePathManeuvers(accessiblePath, startName, endName)
      });
    }

    return options;
  };

  const convertOSRMType = (type: string, modifier?: string): Maneuver['type'] => {
    if (type === 'depart') return 'straight';
    if (type === 'arrive') return 'destination';
    if (modifier?.includes('slight left')) return 'slight-left';
    if (modifier?.includes('slight right')) return 'slight-right';
    if (modifier?.includes('left')) return 'left';
    if (modifier?.includes('right')) return 'right';
    return 'straight';
  };

  const startNavigation = async (overrideDest?: Location) => {
    const dest = overrideDest || selectedLocation;
    if (!dest) return;
    const start = startLocation?.coordinates || userLocation || RSU_CENTER;
    const end = dest.coordinates;
    const startName = startLocation?.officialName || (userLocation ? "Your Location" : "Campus Center");
    const endName = dest.officialName;
    
    const routes = await generateRouteOptions(
      start, 
      end, 
      startName, 
      endName
    );
    
    setPlannedRoutes(routes);
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
      return activeRoute.maneuvers;
    }
    return [];
  };

  const handleChatMessage = async (text: string) => {
    const intent = await chatService.parseIntent(text, userSlots, campusEvents);
    let calculatedDistance: number | undefined = undefined;
    let nextPhase = navSession.phase;
    let updatedSession = { ...navSession };

    // Handle session transitions
    if (navSession.phase === 'idle' || navSession.phase === 'completion') {
      if (intent.isVague) {
        nextPhase = 'clarification';
        updatedSession = { 
          phase: 'clarification', 
          destinationId: intent.destinationId || null, 
          originId: intent.originId || null, 
          mode: null, 
          currentStepIndex: -1 
        };
      } else if ((intent.type === 'navigate' || intent.type === 'query') && intent.destinationId) {
        const dest = locations.find(l => l.id === intent.destinationId);
        if (dest) {
          const origin = intent.originId ? locations.find(l => l.id === intent.originId) : null;
          const start = origin?.coordinates || userLocation || RSU_CENTER;
          calculatedDistance = Math.floor(getDistanceInMeters(start, dest.coordinates));
          
          if (intent.type === 'navigate') {
            nextPhase = 'selection';
            updatedSession = { 
              phase: 'selection', 
              destinationId: intent.destinationId, 
              originId: intent.originId || null, 
              mode: null, 
              currentStepIndex: -1 
            };
          }

          // Update map to show destinations
          setSelectedLocation(dest);
          if (origin) setStartLocation(origin);
          setMapView({ center: dest.coordinates, zoom: 17 });
        }
      }
    } else if (navSession.phase === 'clarification') {
      if (intent.type === 'navigate' && intent.destinationId && !intent.isVague) {
        const dest = locations.find(l => l.id === intent.destinationId);
        if (dest) {
          const origin = intent.originId ? locations.find(l => l.id === intent.originId) : (updatedSession.originId ? locations.find(l => l.id === updatedSession.originId) : null);
          const start = origin?.coordinates || userLocation || RSU_CENTER;
          calculatedDistance = Math.floor(getDistanceInMeters(start, dest.coordinates));
          nextPhase = 'selection';
          updatedSession = { 
            ...updatedSession, 
            phase: 'selection', 
            destinationId: intent.destinationId, 
            originId: intent.originId || updatedSession.originId 
          };
          setSelectedLocation(dest);
        }
      }
    } else if (navSession.phase === 'selection') {
      if (intent.type === 'choice' && intent.value) {
        nextPhase = 'guidance';
        const dest = locations.find(l => l.id === updatedSession.destinationId);
        if (dest) {
          const origin = updatedSession.originId ? locations.find(l => l.id === updatedSession.originId) : null;
          if (origin) setStartLocation(origin);
          
          const steps = await startNavigation(dest);
          updatedSession = { 
            ...updatedSession, 
            phase: 'guidance', 
            mode: intent.value as 'walk' | 'cab', 
            currentStepIndex: 0 
          };
          setCurrentManeuverIndex(0);
        }
      }
    } else if (navSession.phase === 'guidance') {
      if (intent.type === 'confirm') {
        const nextIndex = updatedSession.currentStepIndex + 1;
        if (nextIndex >= maneuvers.length) {
          nextPhase = 'completion';
          updatedSession = { ...updatedSession, phase: 'completion' };
          setIsNavigating(false);
          setCurrentManeuverIndex(-1);
        } else {
          updatedSession = { ...updatedSession, currentStepIndex: nextIndex };
          setCurrentManeuverIndex(nextIndex);
          setMapView(prev => ({ ...prev, center: maneuvers[nextIndex].coordinates, zoom: 19 }));
        }
      }
    }

    setNavSession(updatedSession);

    // Get the current progress text for Gemini to narrate
    const currentStepInstruction = updatedSession.currentStepIndex >= 0 && maneuvers[updatedSession.currentStepIndex] 
      ? maneuvers[updatedSession.currentStepIndex].instruction 
      : undefined;

    const response = await chatService.generateResponse(intent, {
      extraInfo: text,
      distance: calculatedDistance,
      currentStep: currentStepInstruction,
      isLastStep: updatedSession.currentStepIndex === maneuvers.length - 1 && maneuvers.length > 0,
      phase: updatedSession.phase,
      timetable: userSlots,
      events: campusEvents,
    });

    if (isVoiceAssistEnabled && response) {
      playVoiceDirections(response);
    }

    return { 
      response, 
      destinationId: updatedSession.destinationId || undefined, 
      type: intent.type,
      quickActions: updatedSession.phase === 'selection' 
        ? [{ label: '🚶 Walk', value: 'Walk' }, { label: '🚖 Cab/Shuttle', value: 'Cab' }]
        : updatedSession.phase === 'guidance'
        ? [{ label: 'I have arrived', value: 'Next' }]
        : undefined
    };
  };

  const handleRecalculate = async () => {
    if (!selectedLocation) return;
    setNotification({ message: "Recalculating route...", type: 'info' });
    
    // Force start from current user location
    setStartLocation(null); 
    await startNavigation();
    setNotification({ message: "Route updated!", type: 'success' });
  };

  const nextManeuver = React.useCallback(() => {
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
  }, [currentManeuverIndex, maneuvers, isVoiceAssistEnabled, playVoiceDirections]);

  const isPrivacyPage = currentPath === '/privacy-policy' || currentPath === '/privacy';
  const isTermsPage = currentPath === '/terms-of-service' || currentPath === '/terms';

  if (isPrivacyPage || isTermsPage) {
    window.location.href = isTermsPage ? '/terms.html' : '/privacy.html';
    return null;
  }

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
        onLocationSelect={(loc) => {
          setSelectedLocation(loc);
          setMapView({ center: loc.coordinates, zoom: 18 });
          setIsFollowingUser(false);
        }}
        setStartLocation={setStartLocation}
        createCustomIcon={createCustomIcon}
        onMapMove={onMapMove}
        mapRotation={mapRotation}
        setMapRotation={setMapRotation}
      />

      <CompassControl 
        rotation={mapRotation}
        onRotationChange={setMapRotation}
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
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
      />

      <FloatingActions 
        isSatelliteView={isSatelliteView} 
        setIsSatelliteView={setIsSatelliteView}
        setNotification={setNotification}
        handleLocateMe={handleLocateMe}
        isFollowingUser={isFollowingUser}
        toggleEvents={() => setIsEventsPanelOpen(!isEventsPanelOpen)}
        toggleTimetable={() => setIsTimetableOpen(!isTimetableOpen)}
      />

      <AnimatePresence>
        {isEventsPanelOpen && (
          <EventsPanel 
            onClose={() => setIsEventsPanelOpen(false)}
            onNavigateTo={handleEventNavigation}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTimetableOpen && (
          <TimetablePanel 
            onClose={() => setIsTimetableOpen(false)}
            onNavigateTo={handleEventNavigation}
            currentUser={currentUser}
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
        setStartLocation={setStartLocation}
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
        toggleTimetable={() => setIsTimetableOpen(!isTimetableOpen)}
        user={currentUser}
        onSignIn={() => handleSignIn(false)}
        onSignInRedirect={() => handleSignIn(true)}
        onSignOut={handleSignOut}
        onOpenTerms={() => { window.location.href = '/terms.html'; }}
        onOpenPrivacy={() => { window.location.href = '/privacy.html'; }}
      />

      <ChatBot 
        onSendMessage={handleChatMessage}
        onLocationFocus={(id) => {
          const loc = locations.find(l => l.id === id);
          if (loc) handleLocationSelect(loc);
        }}
        isNavigating={isNavigating}
        activeManeuvers={maneuvers}
        onRecalculate={handleRecalculate}
        isOpen={isChatOpen}
        onOpenChange={setIsChatOpen}
        showFloatingButton={false}
      />

      {/* Floating Bottom Left Profile/Auth Widget */}
      <AnimatePresence>
        {!selectedLocation && !isNavigating && currentUser && (
          <motion.div
            initial={{ opacity: 0, x: -15, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -15, y: 15 }}
            className="absolute left-4 bottom-6 z-30 p-2.5 pl-3.5 bg-rsu-card/90 backdrop-blur-md rounded-2xl border border-rsu-border/20 shadow-xl flex items-center gap-3 max-w-[260px] md:max-w-xs transition-colors"
          >
            <div className="relative flex-shrink-0">
              <img
                src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'User')}&background=0D8ABC&color=fff`}
                alt={`${currentUser.displayName || 'User'}'s Profile`}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full border-2 border-rsu-green shadow-sm object-cover"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-rsu-green border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
            </div>
            
            <div className="flex flex-col min-w-[100px] max-w-[140px]">
              <span className="text-xs font-black text-rsu-navy dark:text-white truncate leading-none mb-1.5">
                {currentUser.displayName || 'Campus User'}
              </span>
              <button
                onClick={handleSignOut}
                className="text-[9px] font-bold text-red-500 uppercase tracking-widest hover:text-red-600 hover:underline cursor-pointer text-left leading-none transition-colors"
              >
                Log Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      <AnimatePresence>
        {unauthorizedDomain && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative"
            >
              <button
                onClick={() => setUnauthorizedDomain(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                id="close-unauth-modal"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-rsu-orange/10 text-rsu-orange rounded-full flex items-center justify-center font-bold text-xl">
                  ⚠️
                </div>
                <h3 className="font-display font-black text-xl text-rsu-navy dark:text-white uppercase tracking-tight">
                  {unauthorizedDomain?.includes('run.app') || unauthorizedDomain?.includes('webcontainer.io') || unauthorizedDomain?.includes('localhost')
                    ? "Preview Domain Authorization Needed" 
                    : "Domain Authorization Needed"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {unauthorizedDomain?.includes('run.app') || unauthorizedDomain?.includes('webcontainer.io') || unauthorizedDomain?.includes('localhost')
                    ? "To test Google Sign-In in your live AI Studio sandbox development environment, this preview domain must be whitelisted in your Firebase configuration Settings." 
                    : "To allow Google Sign-In popups on your hosted project, this domain must be whitelisted in your Firebase configuration Settings."}
                </p>
              </div>

              <div className="mt-6 space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {unauthorizedDomain?.includes('run.app') || unauthorizedDomain?.includes('webcontainer.io') || unauthorizedDomain?.includes('localhost')
                      ? "AI Studio Preview Domain" 
                      : "Your Domain Address"}
                  </label>
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="font-mono font-bold select-all overflow-x-auto whitespace-nowrap no-scrollbar flex-1 text-rsu-navy dark:text-slate-100">
                      {unauthorizedDomain}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(unauthorizedDomain);
                        setNotification({ message: "Domain URL copied to clipboard!", type: 'success' });
                      }}
                      className="text-[10px] font-bold text-rsu-orange uppercase bg-rsu-orange/10 hover:bg-rsu-orange/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-rsu-green text-white flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                    <p className="text-slate-600 dark:text-slate-300">
                      Go to your <strong>Firebase Console</strong> &rarr; <strong>Authentication</strong> &rarr; <strong>Settings</strong> &rarr; <strong>Authorized Domains</strong>.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-rsu-green text-white flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                    <p className="text-slate-600 dark:text-slate-300">
                      Click <strong>Add domain</strong> and paste <code>{unauthorizedDomain}</code>.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-rsu-green text-white flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                      Open <strong>Google Cloud Console &rarr; API Credentials &rarr; OAuth 2.0 Web Client</strong>, and add <code>https://{unauthorizedDomain}</code> to <strong>Authorized JavaScript origins</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setUnauthorizedDomain(null)}
                  className="flex-1 bg-rsu-navy hover:bg-rsu-navy/90 text-white font-black text-xs uppercase py-3.5 rounded-xl transition-colors tracking-widest cursor-pointer"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
