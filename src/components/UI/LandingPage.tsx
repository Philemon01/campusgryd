import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Map, 
  Calendar, 
  Search, 
  Navigation, 
  Compass, 
  Sparkles, 
  Clock, 
  ChevronRight, 
  Moon, 
  Sun, 
  MapPin, 
  BookOpen, 
  MessageSquare, 
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  TrendingUp,
  Bookmark,
  X,
  Footprints,
  HelpCircle,
  Layers,
  Briefcase,
  ExternalLink
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { createCustomIcon } from '../../lib/icons';
import { locations } from '../../data/locations';
import { Location, LocationType } from '../../types';
import { cn } from '../../lib/utils';

interface LandingPageProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  onNavigateToMap: (initialLocation?: Location | null, openTimetable?: boolean, openEvents?: boolean) => void;
}

// Interactive simulated waypoint steps
interface SimStep {
  name: string;
  duration: string;
  distance: string;
  instruction: string;
  markerId: string;
}

const SIM_COORDS: Record<string, [number, number]> = {
  gate: [4.804043, 6.986824],
  chapel: [4.799828, 6.984681],
  center: [4.801372, 6.982447],
  senate: [4.799501, 6.982339]
};

const walkerIcon = typeof window !== 'undefined' ? L.divIcon({
  className: 'walker-marker-highlight',
  html: `
    <div class="relative flex items-center justify-center w-8 h-8">
      <div class="absolute w-12 h-12 bg-blue-500/20 rounded-full animate-ping" style="animation-duration: 2s;"></div>
      <div class="absolute w-8 h-8 bg-blue-500 rounded-full border border-white flex items-center justify-center shadow-md">
        <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-white animate-pulse" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 21.5c-.1.5.3 1 1 1h.5c.4 0 .8-.3.9-.7l2.1-7.3 2.1 3.5c.3.5.8.8 1.4.8h1.5l-3.3-5.5.9-4.3c1.2 1.4 3 2.2 4.9 2.2V10c-1.5 0-2.9-.8-3.7-2.1L13 6.3c-.4-.6-1.1-1-1.8-1-.3 0-.5.1-.8.2L6 7.2V11h2V8.9l1.8-.7"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
}) : null;

const SIM_ROUTE: SimStep[] = [
  {
    name: "Main Gateway Entry",
    duration: "Start",
    distance: "0m",
    instruction: "Pass through the modern RSU Main Gate and proceed southwest.",
    markerId: "gate"
  },
  {
    name: "Chapel of Redemption Corner",
    duration: "1.8 mins",
    distance: "210m",
    instruction: "Continue straight on the main paved boulevard, passing the Chapel on your left.",
    markerId: "chapel"
  },
  {
    name: "Entrepreneurship Center",
    duration: "3.2 mins",
    distance: "390m",
    instruction: "Turn right at the Risi Water Center crossing and follow the direct pedestrian path.",
    markerId: "center"
  },
  {
    name: "New Senate Building Gatehouse",
    duration: "4.1 mins",
    distance: "530m",
    instruction: "Arrive safely at the administrative new plaza entrance.",
    markerId: "senate"
  }
];

export function LandingPage({ isDarkMode, setIsDarkMode, onNavigateToMap }: LandingPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  
  // Custom states for interactive features
  const [activeTab, setActiveTab] = useState<'all' | 'faculty' | 'admin' | 'facility' | 'gate'>('all');
  const [simStepIdx, setSimStepIdx] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [panelMode, setPanelMode] = useState<'map' | 'schedule'>('map');
  const [manualOverride, setManualOverride] = useState(false);

  // FAQ accordion active state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Auto alternation between walking map trace and class timetable view
  useEffect(() => {
    if (manualOverride) return;
    const rotateInterval = setInterval(() => {
      setPanelMode((prev) => (prev === 'map' ? 'schedule' : 'map'));
    }, 7500); // alternating every 7.5 seconds
    return () => clearInterval(rotateInterval);
  }, [manualOverride]);

  // Simulated live route progression
  useEffect(() => {
    let intervalId: any;
    if (isSimulating) {
      intervalId = setInterval(() => {
        setSimProgress((prev) => {
          if (prev >= 100) {
            // Loop or stop
            setSimStepIdx((curIdx) => (curIdx + 1) % SIM_ROUTE.length);
            return 0;
          }
          return prev + 6; // progress speed
        });
      }, 150);
    } else {
      setSimProgress(0);
    }
    return () => clearInterval(intervalId);
  }, [isSimulating]);

  // Handle live search
  const filteredSearch = searchQuery.trim()
    ? locations.filter(loc => 
        loc.officialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.aliases.some(alias => alias.toLowerCase().includes(searchQuery.toLowerCase())) ||
        loc.type.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSearchResultClick = (loc: Location) => {
    onNavigateToMap(loc);
  };

  // Trending locations specifically in RSU coordinates
  const trendingLocations = locations
    .filter(loc => ['admin', 'facility', 'gate', 'library'].includes(loc.type))
    .slice(0, 4);

  // Grouped location categories for the landing page registry explorer
  const categoryFilteredLocations = (() => {
    // Exclude catholic_church and prioritize deeper_life
    const filtered = locations.filter(loc => loc.id !== 'catholic_church');
    const deeperLifeLoc = filtered.find(loc => loc.id === 'deeper_life');
    const others = filtered.filter(loc => loc.id !== 'deeper_life');
    
    // Put deeper_life at the very beginning of the catalog list
    const reshuffled = deeperLifeLoc ? [deeperLifeLoc, ...others] : others;

    return reshuffled.filter(loc => {
      if (activeTab === 'all') return true;
      return loc.type === activeTab;
    }).slice(0, 6);
  })();

  const currentCoords = SIM_COORDS[SIM_ROUTE[simStepIdx].markerId] || SIM_COORDS.gate;
  const nextCoords = SIM_COORDS[SIM_ROUTE[(simStepIdx + 1) % SIM_ROUTE.length].markerId] || SIM_COORDS.chapel;
  const fillFrac = simProgress / 100;
  
  const walkerCoords: [number, number] = [
    currentCoords[0] + (nextCoords[0] - currentCoords[0]) * fillFrac,
    currentCoords[1] + (nextCoords[1] - currentCoords[1]) * fillFrac
  ];

  // FAQ contents
  const faqs = [
    {
      q: "How does the CampusGryd Routing Engine work?",
      a: "CampusGryd leverages the Open Source Routing Machine (OSRM) paired with a high-fidelity geospatial network mapped directly on top of the Rivers State University (RSU) landscape. It generates pedestrian-adapted pathways around university roads, chaplaincies, classroom portals, and gates."
    },
    {
      q: "Can I use it on my mobile phone while searching for classes?",
      a: "Absolutely! CampusGryd is optimized as a mobile-first Web App with interactive touch gestures, fluid drawers, responsive high-contrast text directions, and real-time compass rotation controls to direct you as you walk."
    },
    {
      q: "What benefits does the Academic Timetable integration offer?",
      a: "By adding course schedules inside the app, the location of each lecture theater is mapped dynamically. When your lecture time approaches, you can trigger a walking route directly from your timetable box in one click!"
    },
    {
      q: "Are the GPS coordinates project-verified?",
      a: "Yes. CampusGryd utilizes verified spatial coordinates collected during the RSU geodesy initiative. All administrative corridors (New Senate, Convocation Arena, faculties) match modern coordinates precisely."
    }
  ];

  // Helper colors for location types tag
  const getTypeBadge = (type: LocationType) => {
    switch(type) {
      case 'faculty':
        return { label: 'Academy', style: 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20' };
      case 'admin':
        return { label: 'Senate Office', style: 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20' };
      case 'gate':
        return { label: 'Portal', style: 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20' };
      case 'library':
        return { label: 'Resource', style: 'bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20' };
      default:
        return { label: 'Facility', style: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20' };
    }
  };

  return (
    <div className={cn(
      "min-h-screen w-full flex flex-col font-sans transition-colors duration-550 overflow-x-hidden selection:bg-blue-500/30",
      isDarkMode ? "bg-slate-950 text-slate-150" : "bg-slate-50 text-slate-850"
    )}>
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[600px] overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] dark:bg-blue-500/5" />
        <div className="absolute top-20 right-[-20%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[130px] dark:bg-blue-500/5 animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-[400px] left-1/3 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[90px]" />
      </div>

      {/* Navigation Header */}
      <nav className={cn(
        "sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 px-4 md:px-8 py-3.5 flex items-center justify-between",
        isDarkMode ? "bg-slate-950/80 border-slate-900" : "bg-white/80 border-slate-200/50"
      )}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigateToMap()}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/25 relative overflow-hidden group">
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Navigation className={cn(isDarkMode ? "text-white" : "text-blue-100", "transform rotate-45 select-none transition-transform group-hover:scale-110")} size={20} />
          </div>
          <div>
            <h1 className="text-xl font-display font-black tracking-tight leading-none uppercase b">
              Campus<span className="bg-gradient-to-r from-blue-500 to-sky-500 bg-clip-text text-transparent">Gryd</span>
            </h1>
            <p className="text-[9px] font-mono font-bold text-blue-500 dark:text-sky-400 uppercase tracking-widest leading-none mt-1">
              RIVERS STATE UNIVERSITY NAVIGATOR
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigateToMap()}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer"
          >
            <Map size={15} />
            Explore Map
          </button>

          {/* Theme Switcher Button */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={cn(
              "p-2.5 rounded-xl border transition-all active:scale-90 cursor-pointer shadow-sm relative group overflow-hidden",
              isDarkMode 
                ? "bg-slate-900 border-slate-800 text-blue-400 hover:bg-slate-850" 
                : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
            )}
            aria-label="Toggle Theme"
          >
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-sky-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
            {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Primary Action CTA */}
          <button
            onClick={() => onNavigateToMap()}
            className={cn("px-5 py-2.5 bg-slate-900 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 cursor-pointer relative overflow-hidden", isDarkMode ? "text-white" : "text-blue-300")}
          >
            Launch Live Navigation
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 md:px-8 pt-10 pb-20 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-12 z-10">
        
        {/* Left Side Content */}
        <div className="flex-1 space-y-7 text-center lg:text-left">
          
          {/* Announcement Pill */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
            <Sparkles size={11} className="text-blue-500 shrink-0" />
            COORDINATES PROJECT VERIFIED V5.13
          </motion.div>
 
          {/* Dynamic Headings */}
          <div className="space-y-4">
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-4.25xl lg:text-5.5xl font-display font-black tracking-tight uppercase leading-[1.05] b"
            >
              The Smarter Way <br />
              To Navigate <br />
              <span className="bg-gradient-to-r from-blue-500 via-blue-400 to-sky-500 bg-clip-text text-transparent">RSU Campus.</span>
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className={cn(
                "text-xs sm:text-sm md:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium transition-colors",
                isDarkMode ? "text-slate-400" : "text-slate-600"
              )}
            >
              Seamlessly explore Rivers State University. Locate classrooms, administrative halls, and chaplaincies with coordinates-accurate OSRM walking pathways, custom user timetables, and intelligent Gemini AI dialogue.
            </motion.p>
          </div>

          {/* Redesigned Search HUD Component */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative max-w-lg mx-auto lg:mx-0"
          >
            <div className={cn(
              "flex items-center p-2 border-2 rounded-2xl transition-all shadow-md group relative",
              isDarkMode 
                ? "bg-slate-900/40 border-slate-800/80 focus-within:border-blue-500/80 focus-within:bg-slate-900" 
                : "bg-white border-slate-200/80 focus-within:border-slate-800 focus-within:shadow-lg"
            )}>
              <Search className="text-slate-400 ml-3 shrink-0" size={19} />
              <input 
                type="text"
                placeholder="Search New Senate, classrooms, libraries..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                className="w-full bg-transparent px-3 py-2 text-sm text-slate-850 dark:text-slate-150 focus:outline-none placeholder-slate-400 font-semibold"
              />
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-[10px] font-mono text-slate-400 font-bold mr-1.5 uppercase select-none">
                ⌘K Discover
              </span>
              {searchQuery && (
                <button 
                  onClick={() => { setSearchQuery(''); setShowResults(false); }}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors mr-1"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Smart Search Dynamic Suggestions Area */}
            <AnimatePresence>
              {showResults && searchQuery && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className={cn(
                    "absolute top-full left-0 right-0 mt-2 p-3.5 border rounded-2xl shadow-2xl z-55 text-left max-h-72 overflow-y-auto backdrop-blur-md",
                    isDarkMode 
                      ? "bg-slate-950/95 border-slate-850" 
                      : "bg-white/95 border-slate-200"
                  )}
                >
                  {filteredSearch.length > 0 ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between mb-2 px-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">REGISTRY SEARCH MATCHES</p>
                        <span className="text-[9px] font-mono text-emerald-500 font-bold uppercase">Dynamic GPS Ready</span>
                      </div>
                      {filteredSearch.map(loc => {
                        const badgeObj = getTypeBadge(loc.type);
                        return (
                          <button
                            key={loc.id}
                            onClick={() => handleSearchResultClick(loc)}
                            className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-left transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-850/70 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 duration-200">
                                <MapPin size={16} />
                              </div>
                              <div>
                                <p className="font-bold text-xs group-hover:text-emerald-500 transition-colors text-ellipsis overflow-hidden line-clamp-1 b">{loc.officialName}</p>
                                <p className="text-[10px] text-slate-400 capitalize mt-0.5">{loc.landmark} • Coordinates: [{loc.coordinates.map(c => c.toFixed(4)).join(', ')}]</p>
                              </div>
                            </div>
                            <span className={cn("px-2 py-0.5 text-[9px] rounded-lg font-bold border shrink-0", badgeObj.style)}>
                              {badgeObj.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-5 text-center space-y-2">
                      <HelpCircle className="text-slate-550 mx-auto" size={24} />
                      <p className="text-xs text-slate-400 font-semibold">No direct RSU coordinates found matching yours.</p>
                      <button 
                        onClick={() => onNavigateToMap()}
                        className="text-[10px] font-black uppercase text-emerald-500 tracking-wider hover:underline"
                      >
                        Browse universal campus registry instead &rarr;
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Key Call to Action buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1"
          >
            {/* Find Path Primary */}
            <button
              onClick={() => onNavigateToMap()}
              className={cn("px-7 py-3.5 bg-slate-900 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2.5 shadow-xl shadow-blue-500/10 active:scale-95 transition-all cursor-pointer group", isDarkMode ? "text-white" : "text-blue-300")}
            >
              <Navigation className={cn("transform rotate-45 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-200", isDarkMode ? "text-white" : "text-blue-300")} size={15} />
              Open Live Route Finder
            </button>

            {/* Calendar Timetable Secondary */}
            <button
              onClick={() => onNavigateToMap(null, true)}
              className={cn(
                "px-7 py-3.5 border-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2.5 active:scale-95 transition-all cursor-pointer",
                isDarkMode 
                  ? "bg-slate-900/30 border-slate-800 hover:bg-slate-850 text-slate-100" 
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-900 hover:border-slate-350"
              )}
            >
              <Calendar size={15} className="text-blue-500" />
              Academic Schedules
            </button>
          </motion.div>

          {/* Quick Landmark Tags Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-xs"
          >
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest mr-2 flex items-center gap-1">
              <TrendingUp size={11} className="text-blue-500" />
              HOT PLACES:
            </span>
            {trendingLocations.map(loc => (
              <button
                key={loc.id}
                onClick={() => onNavigateToMap(loc)}
                className={cn(
                  "px-3 py-1.5 rounded-xl border text-[11px] font-bold tracking-tight transition-all hover:border-blue-500 hover:text-blue-500 cursor-pointer active:scale-95 duration-200",
                  isDarkMode 
                    ? "bg-slate-900/30 border-slate-850 text-slate-400" 
                    : "bg-white border-slate-200 text-slate-600"
                )}
              >
                {loc.officialName.split(' - ')[0]}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Right Side Visual Panel - Live Interactively Simulated Walk Navigation */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="flex-1 w-full max-w-lg lg:max-w-none relative rounded-3xl overflow-hidden border shadow-2xl bg-slate-900 dark:bg-slate-950 border-slate-850 group flex flex-col justify-between"
        >
          {/* Simulation Header Overlays */}
          <div className="p-4 bg-gradient-to-b from-slate-950/90 to-slate-950/30 z-20 flex items-center justify-between border-b border-slate-800/40">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">
                {panelMode === 'map' ? "LIVE RSU PATH PREVIEW (OSRM COORDS)" : "CAMPUS SCHEDULE INTEGRATION"}
              </span>
            </div>
            
            {/* Play/Mode toggles */}
            <div className="flex items-center gap-2">
              {panelMode === 'map' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSimulating(!isSimulating);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[8px] font-mono font-black uppercase tracking-wider transition-all active:scale-95",
                    isSimulating 
                      ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" 
                      : "bg-blue-600 text-white hover:bg-blue-500"
                  )}
                >
                  {isSimulating ? "PAUSE" : "WALK"}
                </button>
              )}

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPanelMode('map');
                    setManualOverride(true);
                  }}
                  className={cn(
                    "p-1 px-2 rounded text-[7.5px] font-mono font-black uppercase transition-all tracking-wider",
                    panelMode === 'map' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                  )}
                >
                  Map
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPanelMode('schedule');
                    setManualOverride(true);
                  }}
                  className={cn(
                    "p-1 px-2 rounded text-[7.5px] font-mono font-black uppercase transition-all tracking-wider",
                    panelMode === 'schedule' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                  )}
                >
                  Timetable
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Route Presentation Area */}
          <div className="w-full h-96 min-h-[384px] bg-slate-950 relative select-none overflow-hidden">
            <AnimatePresence mode="wait">
              {panelMode === 'map' ? (
                <motion.div
                  key="map-simulation"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 p-5 flex flex-col justify-between"
                >
                  {/* Real Leaflet Map Simulation */}
                  {typeof window !== 'undefined' && (
                    <MapContainer
                      center={[4.8015, 6.9840]}
                      zoom={15}
                      zoomControl={false}
                      className="absolute inset-0 w-full h-full z-0 opacity-85"
                      dragging={false}
                      scrollWheelZoom={false}
                      doubleClickZoom={false}
                      touchZoom={false}
                    >
                      <TileLayer
                        url={isDarkMode 
                          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                          : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        }
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      />
                      
                      {/* Simulated Path Line */}
                      <Polyline 
                        positions={Object.values(SIM_COORDS)}
                        color="#3b82f6" 
                        weight={4}
                        dashArray="5, 8"
                        opacity={0.8}
                      />

                      {/* Display Waypoint Markers */}
                      {Object.entries(SIM_COORDS).map(([id, coords]) => {
                        const step = SIM_ROUTE.find(s => s.markerId === id);
                        return (
                          <Marker 
                            key={id} 
                            position={coords} 
                            icon={createCustomIcon(id === 'gate' ? 'gate' : id === 'senate' ? 'admin' : 'facility', simStepIdx === SIM_ROUTE.findIndex(s => s.markerId === id))}
                          >
                            <Popup className="rsu-popup">
                              <div className="p-2">
                                <h4 className="font-bold uppercase text-xs text-rsu-navy">{step?.name}</h4>
                                <p className="text-[10px] text-slate-500 mt-1">{step?.instruction}</p>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}

                      {/* Animated Simulated Walker */}
                      {walkerIcon && <Marker position={walkerCoords} icon={walkerIcon} />}
                    </MapContainer>
                  )}

                  {/* Live Navigation Guidance Box Overlay */}
                  <div className="absolute bottom-4 inset-x-4 mx-auto w-[90%] max-w-sm space-y-2.5 p-3 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl z-20 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="p-0.5 px-2 bg-blue-500/10 text-blue-400 rounded text-[8px] font-black uppercase tracking-wider border border-blue-500/20">
                          OSRM HUD PREVIEW
                        </span>
                        <span className="text-[8px] font-mono text-slate-400 font-bold uppercase">LIVE SIM</span>
                      </div>
                      <div className="text-[8px] font-mono text-blue-400 font-bold bg-white/5 px-2 py-0.5 rounded border border-slate-800">
                        WALK ON RSU
                      </div>
                    </div>

                    <div className="min-h-[42px] transition-all duration-300">
                      <p className="text-[8px] font-mono text-blue-500 font-bold uppercase tracking-wider">
                        STEP {simStepIdx + 1} OF {SIM_ROUTE.length}: {SIM_ROUTE[simStepIdx].name}
                      </p>
                      <h4 className="text-xs font-display font-medium text-white uppercase tracking-tight mt-0.5 leading-tight">
                        {SIM_ROUTE[simStepIdx].instruction}
                      </h4>
                    </div>

                    {/* Numeric Stats Row */}
                    <div className="grid grid-cols-3 gap-2 border-t border-slate-850 pt-2 text-center">
                      <div>
                        <p className="text-[7.5px] font-mono text-slate-450 uppercase font-black tracking-wide">PROGRESS</p>
                        <p className="text-[10px] font-bold text-white mt-0.5">{isSimulating ? Math.round(simProgress) : 100}%</p>
                      </div>
                      <div>
                        <p className="text-[7.5px] font-mono text-slate-450 uppercase font-black tracking-wide">ACCUM. TIME</p>
                        <p className="text-[10px] font-bold text-blue-400 mt-0.5">{SIM_ROUTE[simStepIdx].duration}</p>
                      </div>
                      <div>
                        <p className="text-[7.5px] font-mono text-slate-450 uppercase font-black tracking-wide">DISTANCE</p>
                        <p className="text-[10px] font-bold text-white mt-0.5">{SIM_ROUTE[simStepIdx].distance}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="timetable-simulation"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 p-5 flex flex-col justify-between"
                >
                  <div className="space-y-3 z-10 w-full mt-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-blue-400" />
                        <span className="text-[10px] font-mono font-black text-white uppercase tracking-wider">
                          STUDENT CLASS CALENDAR
                        </span>
                      </div>
                      <span className="text-[8px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded uppercase font-bold">
                        DAILY SYNC
                      </span>
                    </div>

                    {/* Display modern schedule tasks */}
                    <div className="space-y-2">
                      
                      {/* Class Item 1 - Completed */}
                      <div className="p-2.5 bg-slate-900/30 border border-slate-900 rounded-xl flex items-center justify-between opacity-50 relative overflow-hidden">
                        <div>
                          <p className="text-[7.5px] font-mono text-slate-400 uppercase font-bold">09:00 AM - GST 111</p>
                          <h5 className="text-[11px] font-black text-slate-300 uppercase leading-none mt-0.5">PEACE & CONFLICT STUDIES</h5>
                          <p className="text-[9px] text-slate-450 mt-1">Venue: Convocation Arena</p>
                        </div>
                        <span className="text-emerald-500 font-bold text-xs bg-emerald-500/10 p-1 px-2 rounded">✓</span>
                      </div>

                      {/* Class Item 2 - LIVE NEXT/NAVIGATING */}
                      <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-xl relative ring-1 ring-blue-500/20">
                        <span className="absolute right-2 top-2 w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                        <div>
                          <p className="text-[7.5px] font-mono text-blue-400 font-bold uppercase tracking-wide">11:30 AM - COE 510 • ACTIVE CLASS NOW</p>
                          <h5 className="text-xs font-display font-black text-white uppercase leading-tight mt-0.5">COMPUTER ARCHITECTURE & INGRESS</h5>
                          <p className="text-[9px] text-slate-300 mt-1 flex items-center gap-1">
                            <MapPin size={9} className="text-blue-500" />
                            Faculty of Engineering • Lecture Hall B
                          </p>
                        </div>

                        <div className="mt-2 text-[9px] text-slate-400 font-mono flex items-center justify-between border-t border-blue-900/20 pt-2">
                          <span>Route Map: 5 mins fast walk</span>
                          <button
                            onClick={() => {
                              onNavigateToMap(null, true);
                            }}
                            className="px-2 py-0.5 bg-blue-550 hover:bg-blue-500 text-white font-mono text-[8px] font-black rounded uppercase tracking-wider flex items-center gap-1 transition-all"
                          >
                            Trace OSRM Path 🚶
                          </button>
                        </div>
                      </div>

                      {/* Class Item 3 - Upcoming */}
                      <div className="p-2.5 bg-slate-900/30 border border-slate-900 rounded-xl flex items-center justify-between opacity-75">
                        <div>
                          <p className="text-[7.5px] font-mono text-slate-450 uppercase font-bold">02:30 PM - MTH 211</p>
                          <h5 className="text-[11px] font-black text-slate-400 uppercase leading-none mt-0.5">MATHEMATICAL ANALYSIS II</h5>
                          <p className="text-[9px] text-slate-500 mt-1">Venue: Faculty of Sciences Lab</p>
                        </div>
                        <span className="text-[8px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded">UPCOMING</span>
                      </div>

                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Floating Info bar */}
          <div className="p-3 bg-slate-900/40 border-t border-slate-800/60 flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Compass size={14} className="animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <p className="text-[9px] font-black text-white uppercase">Rivers State University Map</p>
                <p className="text-[8px] text-slate-400 leading-none mt-0.5">Pedestrian walking routes & class timetable sync</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigateToMap()}
              className="p-1 px-3 bg-blue-600 hover:bg-blue-500 text-white font-mono text-[9px] font-black rounded-lg transition-all active:scale-95"
            >
              ENTER MAP
            </button>
          </div>
        </motion.div>
      </section>

      {/* RSU Campus Landmark Finder Registry Grid Selector section */}
      <section className={cn(
        "py-16 px-4 md:px-8 border-t transition-colors",
        isDarkMode ? "bg-slate-900/30 border-slate-900" : "bg-slate-100/50 border-slate-200"
      )}>
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-xl text-left">
              <span className="text-[9px] font-mono font-black tracking-widest text-blue-500 dark:text-blue-400 uppercase bg-blue-500/10 dark:bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/10">
                CAMPUS LANDMARKS DATABASE
              </span>
              <h3 className="text-2xl md:text-3.5xl font-display font-black uppercase tracking-tight b">
                Inspect coordinates directly.
              </h3>
              <p className={cn(
                "text-xs md:text-sm font-medium leading-relaxed",
                isDarkMode ? "text-slate-400" : "text-slate-500"
              )}>
                Browse coordinates collected by the geodetic mapping project. Click any landmark to immediately calculate optimal walking routes.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-start md:self-end">
              {(['all', 'faculty', 'admin', 'facility', 'gate'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all active:scale-95",
                    activeTab === tab
                      ? cn("bg-slate-900 dark:bg-blue-600 font-black shadow-md shadow-blue-500/5", isDarkMode ? "text-white" : "text-blue-300")
                      : isDarkMode
                        ? "bg-slate-900/40 border border-slate-850 hover:bg-slate-850 hover:text-white text-slate-400"
                        : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-600"
                  )}
                >
                  {tab === 'all' ? 'All Registry' : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Grid output */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categoryFilteredLocations.map(loc => {
              const badge = getTypeBadge(loc.type);
              return (
                <motion.div
                  layout
                  key={loc.id}
                  className={cn(
                    "p-5 rounded-2xl border transition-all flex flex-col justify-between group h-full space-y-4 hover:-translate-y-1 hover:shadow-lg",
                    isDarkMode 
                      ? "bg-slate-950/60 border-slate-900/60 hover:bg-slate-950/80 hover:border-slate-800" 
                      : "bg-white border-slate-200 hover:bg-slate-50/50 hover:border-slate-300"
                  )}
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className={cn("px-2.5 py-0.5 text-[9px] rounded-lg font-bold border", badge.style)}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 font-bold">
                        Idx: #{loc.id.substring(0, 5)}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-display font-black uppercase leading-snug group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors b">
                        {loc.officialName}
                      </h4>
                      <p className={cn(
                        "text-[11px] leading-relaxed mt-1.5 line-clamp-2",
                        isDarkMode ? "text-slate-450" : "text-slate-500"
                      )}>
                        {loc.description || "Official RSU facility mapped natively to the walking navigation grid parameters."}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/60 dark:border-slate-850/60 pt-3.5 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin size={12} className="text-blue-500 shrink-0" />
                      <span className="font-semibold text-ellipsis overflow-hidden line-clamp-1">{loc.landmark}</span>
                    </div>
                    <button
                      onClick={() => onNavigateToMap(loc)}
                      className="text-[10px] font-black uppercase text-blue-500 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0"
                    >
                      GO &rarr;
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Quick Registry Total Label */}
          <div className="text-center pt-2">
            <p className="text-xs font-mono text-slate-450">
              Showing <strong className="text-emerald-500">{categoryFilteredLocations.length}</strong> of <strong className="text-slate-900 dark:text-slate-200">{locations.length}</strong> geocoded campus nodes. 
              <button 
                onClick={() => onNavigateToMap()} 
                className="ml-2 underline hover:text-emerald-400 transition-colors font-bold uppercase text-[9px] tracking-wider"
              >
                Inspect All on Map Registry
              </button>
            </p>
          </div>

        </div>
      </section>

      {/* RSU Unified Capabilities bento showcase */}
      <section className={cn(
        "py-20 px-4 md:px-8 border-t",
        isDarkMode ? "bg-slate-950 border-slate-900" : "bg-white border-slate-200/80"
      )}>
        <div className="max-w-7xl mx-auto space-y-16">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-[10px] font-black tracking-widest text-blue-500 dark:text-blue-400 bg-blue-500/15 dark:bg-blue-500/10 px-3.5 py-1.5 rounded-full border border-blue-500/10">
              CORE CAPABILITIES
            </span>
            <h3 className="text-2xl md:text-3.5xl font-display font-black uppercase tracking-tight b">
              A smarter way to navigate campus resources.
            </h3>
            <p className={cn(
              "text-xs md:text-sm font-semibold transition-colors",
              isDarkMode ? "text-slate-400" : "text-slate-500"
            )}>
              Never get lost looking for continuous assessment centers, event halls, or chaplaincies. Built with precision for students, directives, guests, and administrative officials.
            </p>
          </div>

          {/* Features Bento layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Box 1 - OSRM Navigation */}
            <div className={cn(
              "p-6.5 rounded-3xl border shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-all",
              isDarkMode ? "bg-slate-900/30 border-slate-900" : "bg-slate-50 border-slate-200/50"
            )}>
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-sm shrink-0">
                  <Compass size={20} className="animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-base font-display font-black tracking-tight uppercase leading-none b">
                    Optimal Pedestrian Paths
                  </h4>
                  <p className={cn(
                    "text-xs leading-relaxed",
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  )}>
                    Direct walking trajectories generated on-demand around RSU lanes. Bypass motorized paths completely for safer walks.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => onNavigateToMap()}
                className="text-[10px] font-black uppercase text-orange-500 tracking-widest flex items-center gap-1 hover:gap-2 transition-all self-start"
              >
                Open Route Tool <ChevronRight size={12} />
              </button>
            </div>

            {/* Box 2 - Timetable schedules */}
            <div className={cn(
              "p-6.5 rounded-3xl border shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-all",
              isDarkMode ? "bg-slate-900/30 border-slate-900" : "bg-slate-50 border-slate-200/50"
            )}>
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-sm shrink-0">
                  <BookOpen size={20} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-base font-display font-black tracking-tight uppercase leading-none b">
                    Schedules Syncing
                  </h4>
                  <p className={cn(
                    "text-xs leading-relaxed",
                    isDarkMode ? "text-slate-450" : "text-slate-500"
                  )}>
                    Set your specific lecture rooms and exam venues natively. Instantly trigger optimal pathfinding directly from your schedule items.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => onNavigateToMap(null, true)}
                className="text-[10px] font-black uppercase text-blue-500 tracking-widest flex items-center gap-1 hover:gap-2 transition-all self-start"
              >
                Access Timetable <ChevronRight size={12} />
              </button>
            </div>

            {/* Box 3 - Seminar / Events */}
            <div className={cn(
              "p-6.5 rounded-3xl border shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-all",
              isDarkMode ? "bg-slate-900/30 border-slate-900" : "bg-slate-50 border-slate-200/50"
            )}>
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-sm shrink-0">
                  <Calendar size={20} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-base font-display font-black tracking-tight uppercase leading-none b">
                    Events
                  </h4>
                  <p className={cn(
                    "text-xs font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400 animate-pulse mt-1"
                  )}>
                    Coming Soon
                  </p>
                </div>
              </div>
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase select-none">
                Development in progress
              </div>
            </div>

            {/* Box 4 - Chat pilot */}
            <div className={cn(
              "p-6.5 rounded-3xl border shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-all md:col-span-1 lg:col-span-1",
              isDarkMode ? "bg-slate-900/30 border-slate-900" : "bg-slate-50 border-slate-200/50"
            )}>
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-sm shrink-0">
                  <Sparkles size={20} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-base font-display font-black tracking-tight uppercase leading-none b">
                    Gemini AI Compass
                  </h4>
                  <p className={cn(
                    "text-xs leading-relaxed",
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  )}>
                    Query direct distance guidelines, find coordinates, or clarify administrative schedules natively with our integrated intelligence model.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => onNavigateToMap()}
                className="text-[10px] font-black uppercase text-purple-500 tracking-widest flex items-center gap-1 hover:gap-2 transition-all self-start"
              >
                Chat with Assistant <ChevronRight size={12} />
              </button>
            </div>

            {/* Box 5 - Bookmarks / Saved Registry (Widescreen Bento) */}
            <div className={cn(
              "p-6.5 rounded-3xl border shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-all lg:col-span-2",
              isDarkMode ? "bg-slate-900/30 border-slate-900" : "bg-slate-50 border-slate-200/50"
            )}>
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-sm shrink-0">
                  <Bookmark size={20} />
                </div>
                <div className="space-y-3">
                  <h4 className="text-base font-display font-black tracking-tight uppercase leading-none b">
                    Bookmarks, Saved Places & Cloud Sync Backup
                  </h4>
                  <p className={cn(
                    "text-xs leading-relaxed",
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  )}>
                    Bookmark academic lecture venues, chaplaincies, search queries, and custom routes for extremely rapid access. Registered RSU users enjoy permanent cloud-synchronized configurations, assuring your data stays fully up-to-date across multiple platforms.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => onNavigateToMap()}
                className="text-[10px] font-black uppercase text-rose-500 tracking-widest flex items-center gap-1 hover:gap-2 transition-all self-start"
              >
                Open Bookmarks Console <ChevronRight size={12} />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* RSU Statistics Banner */}
      <section className="px-4 md:px-8 py-10 max-w-7xl mx-auto w-full z-10">
        <div className={cn(
          "rounded-3xl p-8 md:p-11 border relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10",
          isDarkMode 
            ? "bg-slate-900/40 border-slate-850" 
            : "bg-gradient-to-tr from-slate-200/20 to-transparent border-slate-250/60"
        )}>
          {/* Subtle decoration vector */}
          <div className="absolute right-0 top-0 w-44 h-44 bg-blue-500/5 rounded-full blur-3xl" />

          <div className="space-y-2.5 max-w-lg text-center md:text-left">
            <h4 className="text-2xl font-display font-black uppercase tracking-tight leading-none b">
              Verified mapping ready.
            </h4>
            <p className={cn(
              "text-xs leading-relaxed font-semibold transition-colors",
              isDarkMode ? "text-slate-450" : "text-slate-500"
            )}>
              CampusGryd integrates real coordinate pairs extracted directly from the Rivers State University (RSU) spatial project, letting you walk along chapel paths and senate walkways without guess-work.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:gap-14 shrink-0 text-center">
            <div className="space-y-1">
              <h5 className="text-3xl md:text-4.5xl font-display font-black uppercase b">55+</h5>
              <p className="text-[10px] font-mono text-blue-500 font-bold uppercase tracking-wider">GEODIC LANDMARKS</p>
            </div>
            <div className="space-y-1">
              <h5 className="text-3xl md:text-4.5xl font-display font-black uppercase b">100%</h5>
              <p className="text-[10px] font-mono text-blue-500 font-bold uppercase tracking-wider">PEDESTRIAN ROADS</p>
            </div>
          </div>
        </div>
      </section>

      {/* Accordion FAQ Area */}
      <section className="px-4 md:px-8 py-12 max-w-4xl mx-auto w-full">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h4 className="text-2xl font-display font-black uppercase tracking-tight b">
              FREQUENTLY ASKED INQUIRIES
            </h4>
            <p className={cn(
              "text-xs font-semibold",
              isDarkMode ? "text-slate-450" : "text-slate-555"
            )}>
              All details to get the absolute outer benefit from RSU CampusGryd.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className={cn(
                    "border rounded-2xl overflow-hidden transition-all",
                    isDarkMode 
                      ? "border-slate-900/80 bg-slate-950/40" 
                      : "border-slate-200 bg-white"
                  )}
                >
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                    className="w-full flex items-center justify-between p-4.5 font-bold uppercase tracking-tight text-xs lg:text-sm text-left select-none hover:text-blue-500 transition-colors cursor-pointer b"
                  >
                    <span>{faq.q}</span>
                    <span className={cn(
                      "w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-xs transition-transform duration-200 shrink-0 ml-4",
                      isExpanded ? "rotate-90 text-blue-500" : "text-slate-450"
                    )}>
                      {isExpanded ? "−" : "+"}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className={cn(
                          "px-4.5 pb-4.5 text-xs sm:text-sm leading-relaxed border-t transition-colors font-medium",
                          isDarkMode ? "text-slate-400 border-slate-900/60" : "text-slate-600 border-slate-100"
                        )}>
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Treads */}
      <section className="px-4 md:px-8 py-10 max-w-7xl mx-auto w-full text-center space-y-10">
        <div className="space-y-1.5">
          <p className="text-[10px] font-mono text-blue-500 font-bold uppercase tracking-widest">
            RSU STUDENT VOICES
          </p>
          <h4 className="text-xl md:text-2.5xl font-display font-black uppercase tracking-tight b">
            Loved by Rivers State University Students.
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className={cn(
            "p-6 rounded-2xl border text-left space-y-4",
            isDarkMode ? "bg-slate-900/20 border-slate-900" : "bg-white border-slate-200"
          )}>
            <div className="flex items-center gap-1 text-amber-500">
              {"★★★★★".split("").map((s, i) => <span key={i}>{s}</span>)}
            </div>
            <p className={cn(
              "text-xs leading-relaxed font-semibold italic",
              isDarkMode ? "text-slate-350" : "text-slate-600"
            )}>
              &ldquo;Finding the science block and New Senate on my first matriculation day was absolutely stress-free with CampusGryd's step guidance. Avoided the typical campus orientation stress.&rdquo;
            </p>
            <div>
              <p className="text-xs font-black uppercase b">Philemon Progress</p>
              <p className="text-[10px] text-slate-400">Mechanical Engineering Student • Year 3</p>
            </div>
          </div>

          <div className={cn(
            "p-6 rounded-2xl border text-left space-y-4",
            isDarkMode ? "bg-slate-900/20 border-slate-900" : "bg-white border-slate-200"
          )}>
            <div className="flex items-center gap-1 text-amber-500">
              {"★★★★★".split("").map((s, i) => <span key={i}>{s}</span>)}
            </div>
            <p className={cn(
              "text-xs leading-relaxed font-semibold italic",
              isDarkMode ? "text-slate-350" : "text-slate-600"
            )}>
              &ldquo;The lecture schedule integration is a total CA-saver. Direct notifications linking to the mapped directions ensures I always make it to continuous assessments on time.&rdquo;
            </p>
            <div>
              <p className="text-xs font-black uppercase b">Amadi Precious</p>
              <p className="text-[10px] text-slate-400">Faculty of Sciences • Year 2</p>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Foot Note Footer */}
      <footer className={cn(
        "mt-auto border-t py-12 px-4 md:px-8 transition-colors duration-300",
        isDarkMode ? "bg-slate-950 border-slate-905 text-slate-400" : "bg-white border-slate-200 text-slate-600"
      )}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-xs font-semibold">
          
          <div className="flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center font-black text-[11px] shadow-sm select-none", isDarkMode ? "text-white" : "text-blue-100")}>
              CG
            </div>
            <div>
              <p className="font-bold uppercase tracking-tight text-xs b">
                CAMPUSGRYD NAVIGATION SUITE
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">© 2026 Rivers State University Initiative</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-450">
            <span className="hover:text-blue-500 cursor-pointer flex items-center gap-1" onClick={() => onNavigateToMap()}>
               RSU Map Center <ExternalLink size={10} />
            </span>
            <span className="text-slate-400 dark:text-slate-800">•</span>
            <span className="hover:text-blue-500 cursor-pointer" onClick={() => onNavigateToMap(null, true)}>
              Academic Calendars
            </span>
            <span className="text-slate-400 dark:text-slate-800">•</span>
            <span className="hover:text-blue-500 cursor-pointer" onClick={() => onNavigateToMap(null, false, true)}>
              Events
            </span>
          </div>

          <div className="text-center md:text-right">
            <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
              Coordinates Registry Verified v5.32 • RSU Campus Navigator
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
