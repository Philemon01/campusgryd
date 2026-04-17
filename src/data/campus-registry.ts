import { CampusEntry } from '../types';

export const CAMPUS_REGISTRY: Record<string, CampusEntry> = {
  "senate_building": {
    name: "Senate Building",
    aliases: ["Admin Block", "VC Office", "Senate"],
    lat: 4.8145,
    lng: 6.9170,
    address: "Main Campus, Nkpolu-Oroworukwo",
    type: "admin",
    description: "The administrative heart of the university housing the Vice Chancellor's office.",
    landmark: "Central area, visible from the main entrance road."
  },
  "fac_science": {
    name: "Faculty of Natural and Applied Sciences",
    aliases: ["Science Faculty", "FNAS", "Sci Fac", "the science block"],
    lat: 4.8142,
    lng: 6.9174,
    address: "Science Block, Main Campus",
    type: "faculty",
    description: "Houses Departments of Physics, Chemistry, Biology, Mathematics and Computer Science.",
    landmark: "Next to the Senate Building"
  },
  "fac_eng": {
    name: "Faculty of Engineering",
    aliases: ["Engineering", "COE", "Engineering Block"],
    lat: 4.8155,
    lng: 6.9185,
    address: "Engineering Complex, Main Campus",
    type: "faculty",
    description: "Home to Civil, Mechanical, Electrical, and Petroleum Engineering departments.",
    landmark: "Near the Faculty of Science"
  },
  "fac_mgt": {
    name: "Faculty of Management Sciences",
    aliases: ["Masso", "Management", "FMS"],
    lat: 4.8130,
    lng: 6.9160,
    address: "Management Block, Main Campus",
    type: "faculty",
    description: "Houses Accounting, Banking & Finance, Management, and Marketing departments.",
    landmark: "Close to the Convocation Arena"
  },
  "main_library": {
    name: "University Library",
    aliases: ["The Library", "Main Lib"],
    lat: 4.8140,
    lng: 6.9150,
    address: "Library Road, Main Campus",
    type: "library",
    description: "Central repository of academic resources and study spaces.",
    landmark: "Opposite the Senate Building"
  },
  "main_gate": {
    name: "Main Gate",
    aliases: ["Front Gate", "Main Entrance"],
    lat: 4.8100,
    lng: 6.9180,
    address: "Ikwerre Road Entrance",
    type: "gate",
    description: "Primary entrance to the university campus.",
    landmark: "Along Ikwerre Road"
  },
  "back_gate": {
    name: "Back Gate",
    aliases: ["Old Site Gate", "Second Gate"],
    lat: 4.8180,
    lng: 6.9120,
    address: "Old Site Entrance",
    type: "gate",
    description: "Secondary entrance often used by students living in Diobu area.",
    landmark: "Old Site axis"
  },
  "convocation_arena": {
    name: "Convocation Arena",
    aliases: ["The Arena", "Convocation Square"],
    lat: 4.8125,
    lng: 6.9155,
    address: "Event Square, Main Campus",
    type: "sports",
    description: "Venue for major university events, matriculations, and convocations.",
    landmark: "Near the Faculty of Management Sciences"
  },
  "medical_center": {
    name: "University Medical Center",
    aliases: ["Health Center", "Sick Bay"],
    lat: 4.8160,
    lng: 6.9140,
    address: "Medical Road, Main Campus",
    type: "admin",
    description: "Primary healthcare facility for students and staff.",
    landmark: "Behind the Faculty of Science"
  },
  "nddc_hostel": {
    name: "NDDC Female Hostel",
    aliases: ["NDDC", "New Hostel"],
    lat: 4.8175,
    lng: 6.9150,
    address: "Female Residential Area",
    type: "hostel",
    description: "Modern female student accommodation provided by NDDC.",
    landmark: "Near the back gate axis"
  },
  "male_hostel_a": {
    name: "Hostel Block A",
    aliases: ["Block A", "Male Hostel"],
    lat: 4.8185,
    lng: 6.9145,
    address: "Male Residential Area, Old Site",
    type: "hostel",
    description: "Male student residential block.",
    landmark: "Old site area"
  },
  "shopping_complex": {
    name: "University Shopping Complex",
    aliases: ["The Complex", "Market", "Food Court"],
    lat: 4.8135,
    lng: 6.9175,
    address: "Student Hub, Main Campus",
    type: "food",
    description: "Hub for food, stationery, and other student services.",
    landmark: "Close to the Faculty of Science"
  },
  "post_graduate_school": {
    name: "School of Post Graduate Studies",
    aliases: ["SPGS", "PG School"],
    lat: 4.8150,
    lng: 6.9130,
    address: "PG Block, Main Campus",
    type: "faculty",
    description: "Administrative and academic hub for postgraduate research.",
    landmark: "Near the Medical Center"
  }
};
