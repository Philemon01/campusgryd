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

export const TimetablePanel: React.FC<TimetablePanelProps> = ({ onClose, onNavigateTo }) => {
  const [view, setView] = useState<'browse' | 'create' | 'review'>('browse');
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<Timetable | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [userRole, setUserRole] = useState<'admin' | 'student'>('student');

  useEffect(() => {
    fetchTimetables();
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    if (!auth.currentUser) return;
    const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', auth.currentUser.email)));
    if (!userDoc.empty) {
      setUserRole(userDoc.docs[0].data().role);
    }
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

      setSlots(data.slots);
      setView('review');
    } catch (error) {
      console.error("Parsing error:", error);
      alert("Failed to parse timetable. Please try a clearer image.");
    } finally {
      setIsUploading(false);
    }
  };

  const saveTimetable = async (metadata: any) => {
    if (!auth.currentUser) return;
    
    setIsLoading(true);
    try {
      // Create timetable doc
      const tRef = await addDoc(collection(db, 'timetables'), {
        ...metadata,
        creatorId: auth.currentUser.uid,
        status: 'published',
        createdAt: new Date().toISOString()
      });

      // Add slots
      for (const slot of slots) {
        await addDoc(collection(db, 'timetables', tRef.id, 'slots'), slot);
      }

      alert("Timetable published successfully!");
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

      if (!accessToken) {
        throw new Error('Failed to get access token');
      }
      
      const res = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          slots
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setSyncStatus('success');
        
        // Log the sync record
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
      if (error.code !== 'auth/popup-closed-by-user') {
        alert("Failed to sync: " + error.message);
      }
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
      <div className="p-6 border-b border-rsu-border/20 flex items-center justify-between bg-rsu-navy text-white md:rounded-t-3xl">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-rsu-orange" />
          <div>
            <h2 className="text-xl font-black italic tracking-tighter uppercase">Timetables</h2>
            <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest leading-none">Smart Academic Sync</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {view === 'browse' && (
          <div className="p-4 space-y-4">
            {/* Create Button (Admin only toggle) */}
            <button 
              onClick={() => setView('create')}
              className="w-full bg-white border-2 border-dashed border-rsu-orange/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-rsu-orange transition-all group"
            >
              <Upload className="w-8 h-8 text-rsu-orange group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <p className="text-sm font-black text-rsu-navy uppercase tracking-tighter">Upload New Timetable</p>
                <p className="text-[9px] text-rsu-muted font-bold">Image or PDF supported</p>
              </div>
            </button>

            <div className="pt-2">
              <h3 className="text-[10px] font-black text-rsu-navy/40 uppercase tracking-widest mb-3 px-1">Available Timetables</h3>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-rsu-orange border-t-transparent rounded-full animate-spin" />
                </div>
              ) : timetables.length > 0 ? (
                timetables.map(t => (
                  <button 
                    key={t.id}
                    onClick={() => {
                      setSelectedTimetable(t);
                      fetchSlots(t.id);
                      setView('review');
                    }}
                    className="w-full text-left bg-white rounded-2xl p-4 mb-3 border border-rsu-border/10 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="font-black text-rsu-navy text-sm">{t.faculty}</h4>
                      <p className="text-[10px] text-rsu-muted font-bold truncate max-w-[200px]">
                        {t.department} • {t.level} • {t.semester}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-rsu-orange group-hover:translate-x-1 transition-transform" />
                  </button>
                ))
              ) : (
                <div className="text-center py-10 opacity-40">
                  <FileText className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">No timetables yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'create' && (
          <div className="p-6 flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="w-20 h-20 bg-rsu-orange/10 rounded-full flex items-center justify-center animate-pulse">
              <Upload className="w-10 h-10 text-rsu-orange" />
            </div>
            <div>
              <h3 className="text-lg font-black text-rsu-navy uppercase tracking-tighter">Prepare Upload</h3>
              <p className="text-xs text-rsu-muted px-4 leading-relaxed mt-2">
                Snap a clear photo of your physical timetable or upload the department's official PDF. Our AI will extract all details!
              </p>
            </div>
            
            <label className="w-full bg-rsu-orange hover:bg-rsu-navy text-white transition-all py-4 rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-rsu-orange/20">
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Select File
                </>
              )}
              <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} disabled={isUploading} />
            </label>
            
            <button 
              onClick={() => setView('browse')}
              className="text-[10px] font-black text-rsu-muted uppercase tracking-widest hover:text-rsu-navy transition-colors"
            >
              Back to Browse
            </button>
          </div>
        )}

        {view === 'review' && (
          <div className="flex flex-col h-full">
            <div className="p-4 bg-rsu-border/5 border-b border-rsu-border/10">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setView('browse')} className="text-[10px] font-black uppercase tracking-widest text-rsu-muted">← Back</button>
                <div className="flex gap-2">
                  <button 
                    onClick={handleSyncToCalendar}
                    disabled={syncStatus !== 'idle'}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                      syncStatus === 'success' ? "bg-green-500 text-white" : "bg-rsu-navy text-white hover:bg-black"
                    )}
                  >
                    {syncStatus === 'syncing' ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
                    {syncStatus === 'success' ? 'Synced!' : 'Sync to Calendar'}
                  </button>
                </div>
              </div>
              
              {!selectedTimetable && (
                <div className="space-y-2 bg-white p-4 rounded-xl shadow-sm border border-rsu-border/20">
                   <input className="w-full text-xs font-bold p-2 bg-rsu-bg rounded-lg" placeholder="Faculty (e.g. Engineering)" id="t-faculty" />
                   <input className="w-full text-xs font-bold p-2 bg-rsu-bg rounded-lg" placeholder="Department (e.g. Mech Eng)" id="t-dept" />
                   <div className="flex gap-2">
                    <input className="w-1/2 text-xs font-bold p-2 bg-rsu-bg rounded-lg" placeholder="Level (e.g. 100L)" id="t-level" />
                    <input className="w-1/2 text-xs font-bold p-2 bg-rsu-bg rounded-lg" placeholder="Semester (e.g. 1st)" id="t-semester" />
                   </div>
                </div>
              )}
            </div>

            <div className="flex-1 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-rsu-navy/40 uppercase tracking-widest px-1">Class Schedule</h3>
                <span className="text-[10px] font-bold text-rsu-muted">{slots.length} Classes</span>
              </div>
              
              {slots.map((slot, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-4 border border-rsu-border/10 shadow-sm relative group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="bg-rsu-orange/10 text-rsu-orange px-2 py-0.5 rounded text-[8px] font-black uppercase">
                      {slot.day}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-rsu-navy">
                      <Clock className="w-3 h-3 text-rsu-orange" />
                      {slot.startTime} - {slot.endTime}
                    </div>
                  </div>
                  <h4 className="font-black text-rsu-navy text-sm leading-tight">{slot.courseCode}</h4>
                  <p className="text-[10px] font-bold text-rsu-muted mb-3">{slot.courseTitle}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-rsu-navy/60">
                      <MapPin className="w-3 h-3 text-rsu-orange" />
                      {slot.venue}
                    </div>
                    {slot.locationId && (
                      <button 
                        onClick={() => onNavigateTo(slot.locationId!)}
                        className="text-[8px] font-black uppercase text-rsu-orange flex items-center gap-1 hover:underline"
                      >
                        Navigate <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!selectedTimetable && (
              <div className="p-4 border-t border-rsu-border/10 bg-white">
                <button 
                  onClick={() => {
                    const faculty = (document.getElementById('t-faculty') as HTMLInputElement).value;
                    const department = (document.getElementById('t-dept') as HTMLInputElement).value;
                    const level = (document.getElementById('t-level') as HTMLInputElement).value;
                    const semester = (document.getElementById('t-semester') as HTMLInputElement).value;
                    saveTimetable({ faculty, department, level, semester });
                  }}
                  className="w-full bg-rsu-green text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Publish Timetable
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
