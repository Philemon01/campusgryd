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
      const startName = startLocation?.officialName || (userLocation ? "Your Location" : "Campus Center");
      const endName = selectedLocation.officialName;
      
      const routes = generateRouteOptions(
        start, 
        end, 
        startName, 
        endName, 
        startLocation?.entryNodeIdx, 
        selectedLocation.entryNodeIdx
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
          endName, 
          loc.entryNodeIdx, 
          selectedLocation.entryNodeIdx
        );
        
        setAvailableRoutes(routes);
        setSelectedRouteId(routes[0].id);
        setNavigationPath(routes[0].path);
        setManeuvers(routes[0].maneuvers);
      }
    }
    setIsSearchFocused(false);
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

  // Defining Main Campus Road Network (Graph) based on actual campus layout
  const ROAD_NODES: [number, number][] = [
    [4.810512, 6.985543], // 0: Main Gate / Entrance
    [4.808512, 6.985543], // 1: Main Entrance Road (North)
    [4.806512, 6.985124], // 2: Main Entrance Road (Middle)
    [4.804123, 6.985124], // 3: Post Graduate / Admin Roundabout
    [4.801512, 6.985124], // 4: Senate Road Junction
    [4.798512, 6.985124], // 5: Library / Science Junction
    [4.796512, 6.986543], // 6: South-East Outer Link
    [4.794512, 6.987543], // 7: Engineering Axis Outer Road
    [4.804123, 6.983124], // 8: Secondary Roundabout (Medical/Staff Axis)
    [4.806512, 6.981124], // 9: Health Centre Junction
    [4.808512, 6.979124], // 10: North-West Perimeter Road
    [4.802123, 6.981124], // 11: Management Science Link
    [4.800123, 6.983124], // 12: Admin / Works Connection
    [4.798123, 6.981124], // 13: Library / Environmental Axis
    [4.804123, 6.987124], // 14: Convocation Area Road
    [4.805512, 6.985124], // 15: Primary Internal Link
    [4.800075, 6.980743], // 16: PG School Junction access
    [4.801512, 6.982124], // 17: Estate Gate Road access
    [4.805512, 6.980543], // 18: Chapel Access Junction
    [4.797512, 6.984124], // 19: Filing Station Junction
    [4.797212, 6.984124], // 20: Works Department Access
    [4.807512, 6.978124], // 21: Perimeter West
    [4.809512, 6.977124], // 22: Back Gate Road Junction
    [4.803123, 6.979124], // 23: Environmental Link
    [4.804123, 6.989124], // 24: Engineering Workshop Link
    [4.799512, 6.982124], // 25: Science Faculty Entry
    [4.800512, 6.979124], // 26: Library Branch Link
    [4.799512, 6.978124], // 27: Back Campus Access
    [4.802512, 6.984124], // 28: Management Faculty Entry
    [4.798512, 6.983543], // 29: ICT Centre Entry
    [4.797912, 6.982412], // 30: Health Centre Link
    [4.805123, 6.987124], // 31: Chapel Perimeter
    [4.807123, 6.987124], // 32: North Staff Quarters Road
    [4.806123, 6.982543], // 33: Medical Science Link
    [4.809123, 6.978543], // 34: Back Community Gate Link
    [4.792812, 6.982843], // 35: Faculty of Humanities Entry
    [4.803123, 6.982124], // 36: Old Convocation Access
    [4.802812, 6.985124], // 37: Chapel Front Road
    [4.796812, 6.982843], // 38: Lane A Entry
    [4.796512, 6.982412], // 39: Lane B Entry
    [4.796212, 6.981912], // 40: Lane C Entry
    [4.795912, 6.981412], // 41: Lane D Entry
    [4.795612, 6.980912], // 42: Lane E Entry
    [4.798512, 6.983124], // 43: Estate Gate / Power House Lane
    [4.797212, 6.980123], // 44: Road A Junction
    [4.796212, 6.977843], // 45: Road B / Agric Axis
    [4.794812, 6.976543], // 46: Road C / Hostel Backwards
    [4.793212, 6.978124], // 47: Road D / Engineering Link
    [4.800512, 6.983543], // 48: Road E / Old Senate Area
    [4.798123, 6.984123], // 49: Road F / Medical Sciences
    [4.793123, 6.981123], // 50: Road G / Student Affairs Link
    [4.796412, 6.984124], // 51: Faculty of Law Entry
    [4.796123, 6.980541], // 52: Faculty of Agriculture Entry
    [4.794212, 6.978543], // 53: Engineering Faculty Entry
    [4.793812, 6.982123], // 54: Student Affairs Entry
    [4.803512, 6.986123], // 55: Chapel of Redemption Entry
    [4.801512, 6.978124], // 56: Library Inner Entry
    [4.808123, 6.980123], // 57: Back Gate Inner Road
    [4.806123, 6.985543], // 58: Main Road Hub (Middle)
    [4.796512, 6.982543], // 59: South-West Arterial Road 1
    [4.803512, 6.980543], // 60: North-West Arterial Road 1
  ];

  const ROAD_EDGES: { [key: number]: number[] } = {
    0: [1],
    1: [0, 2, 14, 15, 58],
    2: [1, 3, 15, 30, 58],
    3: [2, 4, 14, 15, 16, 28, 30, 31, 37, 60],
    4: [3, 5, 25, 28, 29, 44, 48, 60],
    5: [4, 6, 29, 40, 41, 44, 45, 52],
    6: [5, 7, 14, 45, 46, 53, 59],
    7: [6, 46, 47],
    8: [11, 12, 16, 21, 28, 33, 43, 47, 54, 60],
    9: [18, 21, 33, 57],
    10: [18, 21, 22, 34, 50, 57],
    11: [8, 17, 21, 23, 26, 40, 50, 52],
    12: [8, 13, 29, 36, 48],
    13: [12, 17, 25, 49, 56],
    14: [1, 3, 6, 24, 31, 38, 51, 55],
    15: [1, 2, 3, 33, 43, 48, 58],
    16: [3, 8],
    17: [11, 13, 25, 39],
    18: [9, 10, 21, 35],
    19: [14, 20, 38, 49, 51, 59],
    20: [19, 38],
    21: [8, 9, 10, 11, 18],
    22: [10, 35],
    23: [11, 26, 27],
    24: [14],
    25: [4, 13, 17],
    26: [11, 23, 27],
    27: [23, 26],
    28: [3, 4, 8],
    29: [4, 5, 12, 43],
    30: [2, 3, 31, 32],
    31: [3, 14, 30, 32],
    32: [30, 31],
    33: [8, 9, 15, 47],
    34: [10],
    35: [18, 22],
    36: [12],
    37: [3, 55],
    38: [14, 19, 20, 39],
    39: [17, 38, 40],
    40: [5, 11, 39, 41],
    41: [4, 5, 40, 42],
    42: [3, 4, 41],
    43: [8, 15, 29],
    44: [4, 5],
    45: [5, 6],
    46: [6, 7, 47],
    47: [8, 33, 46],
    48: [4, 12, 15],
    49: [13, 19, 30, 59],
    50: [10, 11],
    51: [14, 19],
    52: [5, 11],
    53: [6],
    54: [8],
    55: [14, 37],
    56: [13],
    57: [9, 10],
    58: [1, 2, 15],
    59: [6, 19, 49],
    60: [3, 4, 8],
  };

  const ROUNDABOUT_INDICES = [1, 2, 3, 8];

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
    // Dijkstra for weighted shortest path (using physical distance)
    const distances: { [key: number]: number } = {};
    const previous: { [key: number]: number | null } = {};
    const queue = new Set<number>();

    ROAD_NODES.forEach((_, i) => {
      distances[i] = Infinity;
      previous[i] = null;
      queue.add(i);
    });

    distances[startIdx] = 0;

    while (queue.size > 0) {
      // Get node with minimum distance
      let currIdx = -1;
      let minDistance = Infinity;
      queue.forEach(idx => {
        if (distances[idx] < minDistance) {
          minDistance = distances[idx];
          currIdx = idx;
        }
      });

      if (currIdx === -1 || currIdx === endIdx) break;
      queue.delete(currIdx);

      const neighbors = ROAD_EDGES[currIdx] || [];
      for (const neighbor of neighbors) {
        if (!queue.has(neighbor)) continue;
        const dist = getDistanceInMeters(ROAD_NODES[currIdx], ROAD_NODES[neighbor]);
        const alt = distances[currIdx] + dist;
        if (alt < distances[neighbor]) {
          distances[neighbor] = alt;
          previous[neighbor] = currIdx;
        }
      }
    }

    const path: number[] = [];
    let curr: number | null = endIdx;
    if (previous[curr] !== null || curr === startIdx) {
      while (curr !== null) {
        path.unshift(curr);
        curr = previous[curr];
      }
    }
    return path.length > 0 ? path : [startIdx, endIdx];
  };

  const generateRouteOptions = (
    start: [number, number], 
    end: [number, number], 
    startName: string, 
    endName: string,
    startEntryIdx?: number,
    endEntryIdx?: number
  ): RouteOption[] => {
    const directDist = getDistanceInMeters(start, end);
    const startNodeIdx = startEntryIdx !== undefined && startEntryIdx >= 0 ? startEntryIdx : findNearestRoadNode(start);
    const endNodeIdx = endEntryIdx !== undefined && endEntryIdx >= 0 ? endEntryIdx : findNearestRoadNode(end);
    
    // Path through road network
    const pathIndices = findShortestRoadPath(startNodeIdx, endNodeIdx);
    const roadWaypoints = pathIndices.map(idx => ROAD_NODES[idx]);
    
    // Build the path: Start -> road network nodes -> End
    const realisticPath: [number, number][] = [start];
    
    roadWaypoints.forEach(wp => {
      const last = realisticPath[realisticPath.length - 1];
      // Only add if not effectively the same point
      if (getDistanceInMeters(last, wp) > 0.5) {
        realisticPath.push(wp);
      }
    });

    // Add final destination
    const lastPoint = realisticPath[realisticPath.length - 1];
    if (getDistanceInMeters(lastPoint, end) > 0.5) {
      realisticPath.push(end);
    }

    const roadDist = realisticPath.reduce((acc, curr, i) => {
      return i === 0 ? 0 : acc + getDistanceInMeters(realisticPath[i-1], curr);
    }, 0);

    // Grouping maneuvers to avoid "point-to-point" feel
    const rawManeuvers: Maneuver[] = [];
    for (let i = 0; i < realisticPath.length; i++) {
      const coord = realisticPath[i];
      if (i === realisticPath.length - 1) {
        rawManeuvers.push({ instruction: `Arriving at ${endName}.`, distance: 0, type: 'destination', coordinates: coord });
        continue;
      }
      
      const nextCoord = realisticPath[i+1];
      const distToNext = Math.floor(getDistanceInMeters(coord, nextCoord));
      let type: Maneuver['type'] = 'straight';
      let instruction = "";

      const nodeIndexAtCoord = ROAD_NODES.findIndex(n => n[0] === coord[0] && n[1] === coord[1]);
      const isRoundabout = nodeIndexAtCoord !== -1 && ROUNDABOUT_INDICES.includes(nodeIndexAtCoord);

      if (i === 0) {
        instruction = `Depart from ${startName} towards your destination property.`;
      } else {
        type = getManeuverType(realisticPath[i-1], coord, nextCoord);
        if (isRoundabout) {
          instruction = `At the roundabout, take the exit toward your destination.`;
        } else if (type === 'straight') {
          instruction = `Proceed straight for ${distToNext}m.`;
        } else {
          const dir = type.includes('left') ? 'left' : 'right';
          instruction = `Turn ${type.includes('slight') ? 'slight ' : ''}${dir} and continue for ${distToNext}m.`;
        }
      }
      
      rawManeuvers.push({ instruction, distance: distToNext, type, coordinates: coord });
    }

    // Secondary Grouping: Merge consecutive straight segments
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

    return [
      {
        id: 'fastest',
        name: 'Official Campus Road',
        duration: Math.ceil(roadDist / 90),
        distance: Math.floor(roadDist),
        path: realisticPath,
        maneuvers: groupedManeuvers
      },
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
      }
    ];
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
      endName, 
      startLocation?.entryNodeIdx, 
      selectedLocation.entryNodeIdx
    );
    
    setAvailableRoutes(routes);
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
        onMapMove={onMapMove}
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
