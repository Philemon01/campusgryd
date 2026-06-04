import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, Clock, Filter, X, ChevronRight, Search } from 'lucide-react';
import { campusEvents, CampusEvent } from '../../data/events';
import { locations } from '../../data/locations';

interface EventsPanelProps {
  onClose: () => void;
  onNavigateTo: (locationId: string) => void;
}

export const EventsPanel: React.FC<EventsPanelProps> = ({ onClose, onNavigateTo }) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = campusEvents.filter(event => {
    const matchesCategory = filterCategory === 'all' || event.category === filterCategory;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          event.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'academic': return 'bg-blue-100 text-blue-700';
      case 'social': return 'bg-purple-100 text-purple-700';
      case 'sports': return 'bg-green-100 text-green-700';
      case 'conference': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      className="fixed inset-0 z-[100] bg-rsu-bg md:inset-auto md:right-4 md:bottom-4 md:w-96 md:h-[600px] md:max-h-[calc(100vh-32px)] md:rounded-3xl shadow-2xl flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-rsu-border/20 flex items-center justify-between bg-rsu-navy text-white md:rounded-t-3xl">
        <div>
          <h2 className="text-xl font-black italic tracking-tighter">RSU EVENTS</h2>
          <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest leading-none">Campus Schedule</p>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 space-y-4 border-b border-rsu-border/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rsu-muted" />
          <input 
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-rsu-border/10 border-0 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-rsu-navy/20 outline-none transition-shadow"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['all', 'academic', 'sports', 'social', 'conference'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap
                ${filterCategory === cat 
                  ? 'bg-rsu-navy text-white shadow-lg' 
                  : 'bg-rsu-border/10 text-rsu-muted hover:bg-rsu-border/20'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Event List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        <AnimatePresence mode="popLayout">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => {
              const location = locations.find(l => l.id === event.locationId);
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={event.id}
                  className="bg-white dark:bg-rsu-card rounded-2xl p-4 border border-rsu-border/20 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${getCategoryColor(event.category)}`}>
                      {event.category}
                    </span>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-rsu-muted">
                      <Calendar className="w-3 h-3" />
                      {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>

                  <h3 className="font-black text-rsu-navy text-sm mb-1 leading-tight">{event.title}</h3>
                  <p className="text-[10px] text-rsu-muted line-clamp-2 mb-3 leading-relaxed">
                    {event.description}
                  </p>

                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-rsu-navy/70">
                      <Clock className="w-3.5 h-3.5 text-rsu-orange" />
                      {event.startTime} - {event.endTime}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-rsu-navy/70">
                      <MapPin className="w-3.5 h-3.5 text-rsu-orange" />
                      {location?.officialName || 'Unknown Location'}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateTo(event.locationId)}
                    className="w-full bg-rsu-orange hover:bg-rsu-navy text-white transition-all py-2.5 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest group"
                  >
                    Get Directions
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Calendar className="w-12 h-12 text-rsu-border mb-4 opacity-20" />
              <p className="text-sm font-black text-rsu-muted uppercase tracking-widest">No events found</p>
              <p className="text-[10px] text-rsu-muted/60 mt-1 italic">Try a different category or search term</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
