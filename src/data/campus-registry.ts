import { CampusEntry } from '../types';

export const CAMPUS_REGISTRY: Record<string, CampusEntry> = {
  "main_gate": {
    "name": "RSU Main Gate",
    "aliases": ["Main Entrance", "Main Gate"],
    "lat": 4.79419,
    "lng": 6.98107,
    "address": "UST Road, Port Harcourt",
    "type": "gate",
    "description": "The primary entrance to the university campus.",
    "landmark": "Abonnema Wharf Road axis"
  },
  "back_gate": {
    "name": "CCE Back Gate",
    "aliases": ["Back Gate", "CCE Entrance"],
    "lat": 4.79381,
    "lng": 6.98346,
    "address": "Eagle Island Axis",
    "type": "gate",
    "description": "Secondary entrance primarily serving the Centre for Continuous Education.",
    "landmark": "Eagle Island bridge area"
  },
  "faculty_science": {
    "name": "Faculty of Science",
    "aliases": ["Science Block", "Faculty of Science Building"],
    "lat": 4.79796,
    "lng": 6.97809,
    "address": "Road B, RSU Campus",
    "type": "faculty",
    "description": "Main building for science departments including Physics, Chemistry, and Biology.",
    "landmark": "Near Faculty of Engineering"
  },
  "faculty_law": {
    "name": "Faculty of Law",
    "aliases": ["Law Block", "Law Faculty"],
    "lat": 4.79928,
    "lng": 6.97798,
    "address": "RSU Campus",
    "type": "faculty",
    "description": "Academic building for legal studies.",
    "landmark": "Opposite Faculty of Management Sciences"
  },
  "faculty_management_sciences": {
    "name": "Faculty of Management Sciences",
    "aliases": ["Management Sciences", "Business Block"],
    "lat": 4.79918,
    "lng": 6.98088,
    "address": "Lane F, RSU Campus",
    "type": "faculty",
    "description": "Houses departments for Accounting, Banking, and Management.",
    "landmark": "Close to the Senate Building"
  },
  "faculty_environmental_sciences": {
    "name": "Faculty of Environmental Sciences",
    "aliases": ["Environmental Sciences", "Env. Sci Block"],
    "lat": 4.79962,
    "lng": 6.97915,
    "address": "RSU Campus",
    "type": "faculty",
    "description": "Houses Architecture, Estate Management, and Urban Planning.",
    "landmark": "Adjacent to the Faculty of Law"
  },
  "faculty_engineering": {
    "name": "Faculty of Engineering",
    "aliases": ["Engineering Block", "FE Building"],
    "lat": 4.79469,
    "lng": 6.97810,
    "address": "Eagle Island Road, RSU Campus",
    "type": "faculty",
    "description": "Primary block for all engineering disciplines.",
    "landmark": "Near the Faculty of Science"
  },
  "faculty_education": {
    "name": "Faculty of Education",
    "aliases": ["Education Block", "Edu Faculty"],
    "lat": 4.80052,
    "lng": 6.98252,
    "address": "RSU Campus",
    "type": "faculty",
    "description": "Academic center for educational management and science education.",
    "landmark": "North-eastern campus quadrant"
  },
  "college_medical_sciences": {
    "name": "College of Medical Sciences",
    "aliases": ["Medical College", "CMS Building"],
    "lat": 4.79622,
    "lng": 6.98116,
    "address": "Road F, RSU Campus",
    "type": "college",
    "description": "Central hub for medical and clinical science departments.",
    "landmark": "Near University Health Centre"
  },
  "university_library": {
    "name": "RSU University Library",
    "aliases": ["Main Library", "School Library"],
    "lat": 4.80167,
    "lng": 6.97833,
    "address": "RSU Campus",
    "type": "library",
    "description": "The central repository for academic books and research materials.",
    "landmark": "Behind Faculty of Environmental Sciences"
  },
  "convocation_arena": {
    "name": "Convocation Arena",
    "aliases": ["Arena", "UST Convocation Square"],
    "lat": 4.78906,
    "lng": 6.99921,
    "address": "RSU Campus Area",
    "type": "facility",
    "description": "Large event space for graduation and university ceremonies.",
    "landmark": "Stadium road axis"
  }
};
