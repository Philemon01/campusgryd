
export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO format
  category: 'academic' | 'social' | 'sports' | 'conference' | 'other';
  locationId: string;
  startTime: string;
  endTime: string;
  organizer: string;
}

export const campusEvents: CampusEvent[] = [
  {
    id: 'e1',
    title: 'Inter-Faculty Football Finals',
    description: 'The highly anticipated final match between Faculty of Engineering and Faculty of Law.',
    date: '2026-05-15',
    category: 'sports',
    locationId: 'sports_complex',
    startTime: '14:00',
    endTime: '17:00',
    organizer: 'RSU Sports Directorate'
  },
  {
    id: 'e2',
    title: 'Technology & Innovation Symposium',
    description: 'A gathering of tech enthusiasts and experts to discuss the future of AI in Africa.',
    date: '2026-05-18',
    category: 'conference',
    locationId: 'pg_school',
    startTime: '09:00',
    endTime: '16:00',
    organizer: 'Faculty of Engineering'
  },
  {
    id: 'e3',
    title: 'Matriculation Ceremony',
    description: 'Official welcoming of the fresh students into the RSU community.',
    date: '2026-05-20',
    category: 'academic',
    locationId: 'convocation_arena',
    startTime: '10:00',
    endTime: '13:00',
    organizer: 'RSU Registry'
  },
  {
    id: 'e4',
    title: 'Campus Musical Night',
    description: 'An evening of music, dance, and cultural performances.',
    date: '2026-05-22',
    category: 'social',
    locationId: 'amphitheatre',
    startTime: '18:00',
    endTime: '22:00',
    organizer: 'Student Union Government'
  },
  {
    id: 'e5',
    title: 'Guest Lecture: Sustainable Cities',
    description: 'Prof. Adeyinka discusses urban planning in the context of climate change.',
    date: '2026-05-25',
    category: 'academic',
    locationId: 'old_senate',
    startTime: '11:00',
    endTime: '13:00',
    organizer: 'Environmental Sciences'
  }
];
