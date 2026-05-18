import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  X, 
  ChevronRight, 
  Upload, 
  Check, 
  AlertCircle, 
  FileText,
  Save,
  Trash2,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { db, auth, googleProvider } from '../../lib/firebase';
import { locations } from '../../data/locations';
import { cn } from '../../lib/utils';

interface Slot {
  id?: string;
  courseCode: string;
  courseTitle: string;
  lecturer: string;
  day: string;
  startTime: string;
  endTime: string;
  venue: string;
  locationId?: string;
}

interface Timetable {
  id: string;
  faculty: string;
  department: string;
  level: string;
  semester: string;
  status: 'published' | 'draft';
  creatorId: string;
}

interface TimetablePanelProps {
  onClose: () => void;
  onNavigateTo: (locationId: string) => void;
}

const RSU_FACULTIES = [
  "Agriculture", "Basic Medical Sciences", "Education", "Engineering", 
  "Environmental Sciences", "Humanities", "Law", "Management Sciences", 
  "Science", "Social Sciences", "Computing"
];

const RSU_DEPARTMENTS: Record<string, string[]> = {
  "Engineering": ["Mechanical", "Civil", "Electrical", "Chemical", "Petroleum", "Marine"],
  "Computing": ["Computer Science", "Information Technology", "Cyber Security", "Software Engineering"],
  "Science": ["Physics", "Geology", "Microbiology", "Biochemistry", "Mathematics"],
  "Management Sciences": ["Accountancy", "Banking & Finance", "Management", "Marketing"],
  "Law": ["Public Law", "Private Law", "Commercial Law"],
};

export const TimetablePanel: React.FC<TimetablePanelProps> = ({ onClose, onNavigateTo }) => {
  const [view, setView] = useState<'browse' | 'setup' | 'entry_mode' | 'create' | 'manual' | 'review'>('browse');
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<Timetable | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [userRole, setUserRole] = useState<'admin' | 'student'>('student');

  const [metadata, setMetadata] = useState({
    faculty: "",
    department: "",
    level: "",
    semester: "1st"
  });

  const [manualSlot, setManualSlot] = useState<Slot>({
    courseCode: "",
    courseTitle: "",
    lecturer: "",
    day: "Monday",
    startTime: "08:00",
    endTime: "10:00",
    venue: ""
  });

  useEffect(() => {
    fetchTimetables();
  }, []);

  const handleStartCreation = async () => {
    if (!auth.currentUser) {
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (error) {
        return;
      }
    }
    setView('setup');
  };

  const fetchTimetables = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'timetables'), where('status', '==', 'published'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Timetable));
      setTimetables(list);
    } catch (error) {
      console.error("Error fetching timetables:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSlots = async (timetableId: string) => {
    setIsLoading(true);
    try {
      const q = collection(db, 'timetables', timetableId, 'slots');
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Slot));
      setSlots(list);
    } catch (error) {
      console.error("Error fetching slots:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/timetable/parse', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Merge AI slots with metadata from setup
      const parsedSlots = data.slots.map((s: any) => ({
        ...s,
        // Match venue 
      }));
      setSlots(parsedSlots);
      setView('review');
    } catch (error) {
      console.error("Parsing error:", error);
      alert("Failed to parse. Please try the manual entry instead.");
      setView('setup');
    } finally {
      setIsUploading(false);
    }
  };

  const saveTimetable = async () => {
    if (!auth.currentUser) return;
    
    setIsLoading(true);
    try {
      const tRef = await addDoc(collection(db, 'timetables'), {
        ...metadata,
        creatorId: auth.currentUser.uid,
        creatorEmail: auth.currentUser.email,
        status: 'published',
        createdAt: new Date().toISOString()
      });

      for (const slot of slots) {
        await addDoc(collection(db, 'timetables', tRef.id, 'slots'), slot);
      }

      alert("Timetable published!");
      setView('browse');
      fetchTimetables();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncToCalendar = async () => {
    setSyncStatus('syncing');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (!accessToken) throw new Error('Failed to get access token');
      
      const res = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, slots })
      });
      
      const data = await res.json();
      if (data.success) {
        setSyncStatus('success');
        if (selectedTimetable && auth.currentUser) {
          await addDoc(collection(db, 'user_syncs'), {
            userId: auth.currentUser.uid,
            timetableId: selectedTimetable.id,
            lastSyncedAt: new Date().toISOString()
          });
        }
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error("Sync error:", error);
      if (error.code !== 'auth/popup-closed-by-user') alert("Failed: " + error.message);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className="fixed inset-0 z-[100] bg-rsu-bg md:inset-auto md:right-4 md:bottom-4 md:w-96 md:h-[700px] md:rounded-3xl shadow-2xl flex flex-col border border-rsu-border/20"
    >
      {/* Header */}
      <div className="p-6 border-b border-rsu-border/20 flex items-center justify-between bg-rsu-navy text-white md:rounded-t-3xl shadow-lg">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-rsu-orange" />
          <div>
            <h2 className="text-xl font-black italic tracking-tighter uppercase">Timetables</h2>
            <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest leading-none">Smart Academic Sync</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {view === 'browse' && (
          <div className="p-4 space-y-4">
            <button 
              onClick={handleStartCreation}
              className="w-full bg-rsu-orange text-white rounded-2xl p-6 flex items-center justify-between shadow-lg shadow-rsu-orange/20 active:scale-95 transition-all group overflow-hidden relative"
            >
              <div className="relative z-10 text-left">
                <p className="text-lg font-black italic uppercase tracking-tighter">Add New Entry</p>
                <p className="text-[10px] font-bold opacity-80 decoration-white/20 uppercase tracking-widest">Select Department • Create Level</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl relative z-10"><Upload className="w-6 h-6" /></div>
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><BookOpen size={64} /></div>
            </button>

            <div className="pt-2">
              <h3 className="text-[10px] font-black text-rsu-navy/40 uppercase tracking-widest mb-3 px-1">Recent Schedules</h3>
              {isLoading ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-rsu-orange border-t-transparent rounded-full animate-spin" /></div>
              ) : timetables.length > 0 ? (
                timetables.map(t => (
                  <button 
                    key={t.id}
                    onClick={() => { setSelectedTimetable(t); fetchSlots(t.id); setView('review'); }}
                    className="w-full text-left bg-white rounded-2xl p-4 mb-3 border border-rsu-border/5 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="font-black text-rsu-navy text-sm uppercase">{t.faculty}</h4>
                      <p className="text-[11px] text-rsu-muted font-bold">
                        {t.department} • {t.level}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-rsu-orange group-hover:translate-x-1 transition-transform" />
                  </button>
                ))
              ) : (
                <div className="text-center py-10 opacity-30">
                  <FileText className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No timetables found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'setup' && (
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-rsu-orange text-[10px] font-black uppercase tracking-[0.2em] mb-2 px-1">
                <Check className="w-3 h-3" /> Step 1: Info
              </div>
              <h3 className="text-2xl font-black italic text-rsu-navy uppercase tracking-tighter leading-none mb-6">Create Entry</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-rsu-navy/40 uppercase tracking-widest ml-1 mb-1 block">Faculty</label>
                  <select 
                    className="w-full bg-white border border-rsu-border/20 rounded-xl p-4 font-bold text-sm shadow-sm ring-rsu-orange/20 focus:ring-4 transition-all"
                    value={metadata.faculty}
                    onChange={(e) => setMetadata({...metadata, faculty: e.target.value, department: ""})}
                  >
                    <option value="">Select Faculty...</option>
                    {RSU_FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                {metadata.faculty && (
                  <div>
                    <label className="text-[10px] font-black text-rsu-navy/40 uppercase tracking-widest ml-1 mb-1 block">Department</label>
                    <select 
                      className="w-full bg-white border border-rsu-border/20 rounded-xl p-4 font-bold text-sm shadow-sm ring-rsu-orange/20 focus:ring-4 transition-all mb-3"
                      value={metadata.department && !RSU_DEPARTMENTS[metadata.faculty]?.includes(metadata.department) ? "Other" : metadata.department}
                      onChange={(e) => {
                        if (e.target.value === "Other") {
                          setMetadata({...metadata, department: ""});
                        } else {
                          setMetadata({...metadata, department: e.target.value});
                        }
                      }}
                    >
                      <option value="">Select Department...</option>
                      {(RSU_DEPARTMENTS[metadata.faculty] || []).map(d => <option key={d} value={d}>{d}</option>)}
                      <option value="Other">Other (Manual Entry)</option>
                    </select>
                    
                    {(!RSU_DEPARTMENTS[metadata.faculty]?.includes(metadata.department) && metadata.department !== "") || 
                     (metadata.faculty && !RSU_DEPARTMENTS[metadata.faculty]?.includes(metadata.department)) ? (
                      <input 
                        className="w-full bg-white border border-rsu-orange/30 rounded-xl p-4 font-bold text-sm shadow-inner focus:ring-4 ring-rsu-orange/20 transition-all"
                        placeholder="Type Department Name..."
                        value={metadata.department}
                        onChange={(e) => setMetadata({...metadata, department: e.target.value})}
                      />
                    ) : null}
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black text-rsu-navy/40 uppercase tracking-widest ml-1 mb-1 block">Level</label>
                  <input 
                    className="w-full bg-white border border-rsu-border/20 rounded-xl p-4 font-bold text-sm shadow-sm ring-rsu-orange/20 focus:ring-4 transition-all uppercase"
                    placeholder="e.g. 100L"
                    value={metadata.level}
                    onChange={(e) => setMetadata({...metadata, level: e.target.value.toUpperCase()})}
                  />
                </div>
              </div>
            </div>

            <button 
              disabled={!metadata.faculty || !metadata.department || !metadata.level}
              onClick={() => setView('entry_mode')}
              className="w-full bg-rsu-navy text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl disabled:opacity-30 transition-all hover:bg-black active:scale-95 flex items-center justify-center gap-2"
            >
              Next Step <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {view === 'entry_mode' && (
          <div className="p-6 space-y-6 h-full flex flex-col justify-center">
            <div className="text-center space-y-2 mb-4">
              <h3 className="text-2xl font-black italic text-rsu-navy uppercase tracking-tighter leading-none">Entry Type</h3>
              <p className="text-[11px] font-bold text-rsu-muted uppercase tracking-widest">How would you like to add the schedule?</p>
            </div>

            <button 
              onClick={() => setView('create')}
              className="w-full bg-white border-2 border-rsu-orange/20 p-6 rounded-3xl flex items-center gap-6 group hover:border-rsu-orange hover:bg-rsu-orange/5 transition-all shadow-sm"
            >
              <div className="p-4 bg-rsu-orange text-white rounded-2xl group-hover:scale-110 transition-transform"><BookOpen size={30} /></div>
              <div className="text-left">
                <p className="text-lg font-black text-rsu-navy uppercase tracking-tighter italic">AI Vision</p>
                <p className="text-[10px] font-bold text-rsu-muted uppercase tracking-widest">Scan image or PDF</p>
              </div>
            </button>

            <button 
              onClick={() => { setSlots([]); setView('manual'); }}
              className="w-full bg-white border-2 border-rsu-navy/10 p-6 rounded-3xl flex items-center gap-6 group hover:border-rsu-navy hover:bg-rsu-navy/5 transition-all shadow-sm"
            >
              <div className="p-4 bg-rsu-navy text-white rounded-2xl group-hover:scale-110 transition-transform"><FileText size={30} /></div>
              <div className="text-left">
                <p className="text-lg font-black text-rsu-navy uppercase tracking-tighter italic">Manual entry</p>
                <p className="text-[10px] font-bold text-rsu-muted uppercase tracking-widest">Type classes one by one</p>
              </div>
            </button>

            <button onClick={() => setView('setup')} className="text-[10px] font-black text-rsu-muted uppercase tracking-widest hover:text-rsu-navy transition-colors mt-4">Change Metadata</button>
          </div>
        )}

        {view === 'review' && (
          <div className="flex flex-col h-full bg-rsu-bg">
            <div className="p-6 bg-white border-b border-rsu-border/10 shadow-sm relative z-20">
              <div className="flex justify-between items-center mb-4">
                <button onClick={() => setView('browse')} className="text-xs font-black text-rsu-orange flex items-center gap-1 uppercase tracking-widest">← Back</button>
                <div className="bg-rsu-navy/5 px-2 py-1 rounded text-[9px] font-bold text-rsu-navy uppercase tracking-widest">Sync Dashboard</div>
              </div>
              <h3 className="text-xl font-black italic text-rsu-navy uppercase tracking-tighter leading-none">{metadata.department || selectedTimetable?.department}</h3>
              <p className="text-[10px] font-bold text-rsu-muted uppercase tracking-widest mt-1">{metadata.level || selectedTimetable?.level} • {metadata.semester || selectedTimetable?.semester} Semester</p>
              
              <button 
                onClick={handleSyncToCalendar}
                disabled={syncStatus !== 'idle'}
                className={cn(
                  "w-full mt-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-lg",
                  syncStatus === 'success' ? "bg-green-500 text-white" : "bg-rsu-navy text-white hover:bg-black shadow-rsu-navy/20"
                )}
              >
                {syncStatus === 'syncing' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Calendar className="w-4 h-4" />}
                {syncStatus === 'success' ? 'Classes Linked!' : 'Sync to Google Calendar'}
              </button>
            </div>

            <div className="flex-1 p-4 space-y-4 relative z-10">
              <div className="text-[10px] font-black text-rsu-navy/30 uppercase tracking-[0.2em] mb-2 px-1">Curated Schedule ({slots.length} Classes)</div>
              {slots.map((slot, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={idx} 
                  className="bg-white rounded-3xl p-5 border border-rsu-border/20 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-rsu-orange/5 rounded-full -mr-8 -mt-8" />
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="bg-rsu-orange text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                      {slot.day}
                    </div>
                    <div className="text-[11px] font-black text-rsu-navy flex items-center gap-1.5 underline decoration-rsu-orange/30">
                      <Clock className="w-3.5 h-3.5 text-rsu-orange" />
                      {slot.startTime} — {slot.endTime}
                    </div>
                  </div>
                  <h4 className="font-black text-rsu-navy text-base leading-tight tracking-tight uppercase mb-1">{slot.courseCode}</h4>
                  <p className="text-[11px] font-bold text-rsu-muted uppercase tracking-tight mb-4 leading-tight">{slot.courseTitle}</p>
                  
                  <div className="flex items-center justify-between border-t border-rsu-border/5 pt-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-rsu-navy/40 uppercase">
                      <MapPin className="w-3.5 h-3.5 text-rsu-orange" />
                      {slot.venue}
                    </div>
                    <button 
                      onClick={() => {
                        const loc = locations.find(l => 
                          l.officialName.toLowerCase().includes(slot.venue.toLowerCase()) ||
                          l.aliases.some(a => a.toLowerCase().includes(slot.venue.toLowerCase()))
                        );
                        if (loc) onNavigateTo(loc.id);
                        else alert("Location not pinned. Use search to find " + slot.venue);
                      }}
                      className="p-2 bg-rsu-bg rounded-xl hover:bg-rsu-orange/10 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-rsu-orange" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {!selectedTimetable && (
              <div className="p-6 bg-white border-t border-rsu-border/10">
                <button 
                  onClick={saveTimetable}
                  className="w-full bg-rsu-orange text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all hover:bg-rsu-navy active:scale-95"
                >
                  <Save className="w-6 h-6" />
                  Finalize & Publish
                </button>
              </div>
            )}
          </div>
        )}
        {view === 'create' && (
          <div className="p-8 flex flex-col items-center justify-center h-full text-center space-y-8">
            <div className="w-24 h-24 bg-rsu-orange/10 rounded-full flex items-center justify-center relative">
              <Upload className="w-10 h-10 text-rsu-orange animate-bounce" />
              <div className="absolute inset-0 border-2 border-dashed border-rsu-orange/30 rounded-full animate-spin-slow" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black italic text-rsu-navy uppercase tracking-tighter">AI Vision Sync</h3>
              <p className="text-[11px] font-bold text-rsu-muted uppercase tracking-widest leading-relaxed px-4">
                Upload a clear photo of your paper timetable. Our AI will automatically map out the courses and locations.
              </p>
            </div>
            
            <label className="w-full bg-rsu-orange hover:bg-rsu-navy text-white transition-all py-5 rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest cursor-pointer shadow-xl shadow-rsu-orange/20 active:scale-95">
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Ready to Scan
                </>
              )}
              <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} disabled={isUploading} />
            </label>
            
            <button 
              onClick={() => setView('entry_mode')}
              className="text-[10px] font-black text-rsu-muted uppercase tracking-widest hover:text-rsu-navy transition-colors"
            >
              Back to Methods
            </button>
          </div>
        )}

        {view === 'manual' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black italic text-rsu-navy uppercase tracking-tighter underline decoration-rsu-orange/30">Add New Slot</h3>
              <div className="bg-rsu-orange/10 text-rsu-orange text-[9px] font-black px-2 py-1 rounded uppercase">{slots.length} Ready</div>
            </div>

            <div className="space-y-4 bg-white p-6 rounded-3xl border border-rsu-border/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><FileText size={80} /></div>
              
              <div className="space-y-3 relative z-10">
                <input 
                  className="w-full bg-rsu-bg border-none rounded-xl p-4 font-bold text-sm"
                  placeholder="Course Code (e.g. CSC411)"
                  value={manualSlot.courseCode}
                  onChange={(e) => setManualSlot({...manualSlot, courseCode: e.target.value.toUpperCase()})}
                />
                <input 
                  className="w-full bg-rsu-bg border-none rounded-xl p-4 font-bold text-sm"
                  placeholder="Course Title"
                  value={manualSlot.courseTitle}
                  onChange={(e) => setManualSlot({...manualSlot, courseTitle: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-3">
                  <select 
                    className="bg-rsu-bg border-none rounded-xl p-4 font-bold text-sm"
                    value={manualSlot.day}
                    onChange={(e) => setManualSlot({...manualSlot, day: e.target.value})}
                  >
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <input 
                    className="bg-rsu-bg border-none rounded-xl p-4 font-bold text-sm"
                    placeholder="Venue (e.g. LT1)"
                    value={manualSlot.venue}
                    onChange={(e) => setManualSlot({...manualSlot, venue: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="time"
                    className="bg-rsu-bg border-none rounded-xl p-4 font-bold text-sm"
                    value={manualSlot.startTime}
                    onChange={(e) => setManualSlot({...manualSlot, startTime: e.target.value})}
                  />
                  <input 
                    type="time"
                    className="bg-rsu-bg border-none rounded-xl p-4 font-bold text-sm"
                    value={manualSlot.endTime}
                    onChange={(e) => setManualSlot({...manualSlot, endTime: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  if(!manualSlot.courseCode || !manualSlot.venue) return;
                  setSlots([...slots, manualSlot]);
                  setManualSlot({
                    ...manualSlot,
                    courseCode: "",
                    courseTitle: "",
                    venue: ""
                  });
                }}
                className="flex-1 bg-rsu-navy text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all shadow-lg shadow-rsu-navy/20"
              >
                Add Class
              </button>
              
              <button 
                disabled={slots.length === 0}
                onClick={() => setView('review')}
                className="flex-1 bg-rsu-orange text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all disabled:opacity-30 shadow-lg shadow-rsu-orange/20"
              >
                Review Map
              </button>
            </div>

            <button onClick={() => setView('entry_mode')} className="w-full text-[10px] font-black text-rsu-muted uppercase tracking-widest text-center py-2">Change entry method</button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

