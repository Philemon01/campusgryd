export interface Location {
  id: string;
  officialName: string;
  aliases: string[];
  coordinates: [number, number]; // [lat, lng]
  type: 'faculty' | 'admin' | 'hostel' | 'food' | 'gate' | 'sports' | 'library' | 'landmark';
  description: string;
  landmark: string;
  image?: string;
}

export const locations: Location[] = [
  {
    id: 'senate_building',
    officialName: 'Senate Building',
    aliases: ['Admin Block', 'VC Office', 'Senate'],
    coordinates: [4.8145, 6.9170],
    type: 'admin',
    description: 'The administrative heart of the university housing the Vice Chancellor\'s office.',
    landmark: 'Central area, visible from the main entrance road.'
  },
  {
    id: 'fac_science',
    officialName: 'Faculty of Natural and Applied Sciences',
    aliases: ['Science Faculty', 'FNAS', 'Sci Fac', 'the science block'],
    coordinates: [4.8142, 6.9174],
    type: 'faculty',
    description: 'Houses Departments of Physics, Chemistry, Biology, Mathematics and Computer Science.',
    landmark: 'Next to the Senate Building'
  },
  {
    id: 'fac_eng',
    officialName: 'Faculty of Engineering',
    aliases: ['Engineering', 'COE', 'Engineering Block'],
    coordinates: [4.8155, 6.9185],
    type: 'faculty',
    description: 'Home to Civil, Mechanical, Electrical, and Petroleum Engineering departments.',
    landmark: 'Near the Faculty of Science'
  },
  {
    id: 'fac_mgt',
    officialName: 'Faculty of Management Sciences',
    aliases: ['Masso', 'Management', 'FMS'],
    coordinates: [4.8130, 6.9160],
    type: 'faculty',
    description: 'Houses Accounting, Banking & Finance, Management, and Marketing departments.',
    landmark: 'Close to the Convocation Arena'
  },
  {
    id: 'main_library',
    officialName: 'University Library',
    aliases: ['The Library', 'Main Lib'],
    coordinates: [4.8140, 6.9150],
    type: 'library',
    description: 'Central repository of academic resources and study spaces.',
    landmark: 'Opposite the Senate Building'
  },
  {
    id: 'main_gate',
    officialName: 'Main Gate',
    aliases: ['Front Gate', 'Main Entrance'],
    coordinates: [4.8100, 6.9180],
    type: 'gate',
    description: 'Primary entrance to the university campus.',
    landmark: 'Along Ikwerre Road'
  },
  {
    id: 'back_gate',
    officialName: 'Back Gate',
    aliases: ['Old Site Gate', 'Second Gate'],
    coordinates: [4.8180, 6.9120],
    type: 'gate',
    description: 'Secondary entrance often used by students living in Diobu area.',
    landmark: 'Old Site axis'
  },
  {
    id: 'convocation_arena',
    officialName: 'Convocation Arena',
    aliases: ['The Arena', 'Convocation Square'],
    coordinates: [4.8125, 6.9155],
    type: 'sports',
    description: 'Venue for major university events, matriculations, and convocations.',
    landmark: 'Near the Faculty of Management Sciences'
  },
  {
    id: 'medical_center',
    officialName: 'University Medical Center',
    aliases: ['Health Center', 'Sick Bay'],
    coordinates: [4.8160, 6.9140],
    type: 'admin',
    description: 'Primary healthcare facility for students and staff.',
    landmark: 'Behind the Faculty of Science'
  },
  {
    id: 'nddc_hostel',
    officialName: 'NDDC Female Hostel',
    aliases: ['NDDC', 'New Hostel'],
    coordinates: [4.8175, 6.9150],
    type: 'hostel',
    description: 'Modern female student accommodation provided by NDDC.',
    landmark: 'Near the back gate axis'
  },
  {
    id: 'male_hostel_a',
    officialName: 'Hostel Block A',
    aliases: ['Block A', 'Male Hostel'],
    coordinates: [4.8185, 6.9145],
    type: 'hostel',
    description: 'Male student residential block.',
    landmark: 'Old site area'
  },
  {
    id: 'shopping_complex',
    officialName: 'University Shopping Complex',
    aliases: ['The Complex', 'Market', 'Food Court'],
    coordinates: [4.8135, 6.9175],
    type: 'food',
    description: 'Hub for food, stationery, and other student services.',
    landmark: 'Close to the Faculty of Science'
  },
  {
    id: 'post_graduate_school',
    officialName: 'School of Post Graduate Studies',
    aliases: ['SPGS', 'PG School'],
    coordinates: [4.8150, 6.9130],
    type: 'faculty',
    description: 'Administrative and academic hub for postgraduate research.',
    landmark: 'Near the Medical Center'
  }
];
