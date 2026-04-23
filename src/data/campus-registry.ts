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
    "name": "Faculty of Science (Main)",
    "aliases": ["Science Block", "Biochemistry", "Chemistry", "Geology", "Mathematics", "Medical Laboratory Science", "Microbiology", "Physics", "Science Lab", "Biological Sciences"],
    "lat": 4.7980,
    "lng": 6.9781,
    "address": "Road B, RSU Campus",
    "type": "faculty",
    "description": "Houses departments of Biochemistry, Chemistry, Geology, Mathematics, Medical Laboratory Science, Microbiology, and Physics.",
    "landmark": "Near Faculty of Engineering"
  },
  "dept_computer_science": {
    "name": "Department of Computer Science",
    "aliases": ["Computer Science Building", "CS Dept", "Software Lab"],
    "lat": 4.7985,
    "lng": 6.9775,
    "address": "Science Axis, RSU Campus",
    "type": "faculty",
    "description": "Dedicated building for Computer Science studies and research labs.",
    "landmark": "Close to the Main Library"
  },
  "dept_architecture": {
    "name": "Department of Architecture",
    "aliases": ["Architecture Building", "Studio", "Arch Lab"],
    "lat": 4.7998,
    "lng": 6.9795,
    "address": "Environmental Axis, RSU Campus",
    "type": "faculty",
    "description": "Dedicated studio and academic building for Architecture students.",
    "landmark": "Near Faculty of Environmental Sciences"
  },
  "dept_marine_engineering": {
    "name": "Department of Marine Engineering",
    "aliases": ["Marine Engineering Building", "Naval Architecture"],
    "lat": 4.7942,
    "lng": 6.9770,
    "address": "Engineering Axis, RSU Campus",
    "type": "faculty",
    "description": "Specific building for Marine and Naval Engineering studies.",
    "landmark": "Near the Mechanical Workshop"
  },
  "dept_civil_engineering": {
    "name": "Department of Civil Engineering",
    "aliases": ["Civil Engineering Block", "Civil Dept"],
    "lat": 4.7949,
    "lng": 6.9772,
    "address": "Engineering Axis, RSU Campus",
    "type": "faculty",
    "description": "Houses the Civil and Structural Engineering department offices and classrooms.",
    "landmark": "Near the Faculty of Engineering Main Block"
  },
  "dept_agric_engineering": {
    "name": "Dept of Agricultural/Environmental Engineering",
    "aliases": ["Agric Engineering", "Environmental Engineering Building"],
    "lat": 4.7935,
    "lng": 6.9775,
    "address": "Engineering Axis, RSU Campus",
    "type": "faculty",
    "description": "Dedicated building for Agricultural and Environmental engineering studies.",
    "landmark": "Near the Faculty of Agriculture"
  },
  "dept_mass_comm": {
    "name": "Department of Mass Communication",
    "aliases": ["Mass Comm Building", "Radio UST", "TV Studio"],
    "lat": 4.7988,
    "lng": 6.9820,
    "address": "Communication Axis, RSU Campus",
    "type": "faculty",
    "description": "Houses the Mass Communication studios and academic offices.",
    "landmark": "Near Faculty of Management Sciences"
  },
  "dept_accountancy": {
    "name": "Department of Accountancy",
    "aliases": ["Accountancy Building", "Accounting Dept"],
    "lat": 4.7990,
    "lng": 6.9818,
    "address": "Management Axis, RSU Campus",
    "type": "faculty",
    "description": "Dedicated building for Accountancy and related management studies.",
    "landmark": "Near the Senate Building"
  },
  "pg_school": {
    "name": "Post Graduate School",
    "aliases": ["PG School", "Postgraduate Studies"],
    "lat": 4.7994,
    "lng": 6.9815,
    "address": "Central Axis, RSU Campus",
    "type": "admin",
    "description": "Administrative and academic center for postgraduate research and studies.",
    "landmark": "Opposite the Senate Building"
  },
  "ips_research": {
    "name": "Institute of Pollution Studies (IPS)",
    "aliases": ["IPS Building", "Pollution Research"],
    "lat": 4.8010,
    "lng": 6.9790,
    "address": "Research Axis, RSU Campus",
    "type": "facility",
    "description": "Specialized research institute focusing on environmental and pollution studies.",
    "landmark": "Near the University Library"
  },
  "faculty_law": {
    "name": "Faculty of Law",
    "aliases": ["Law Block", "Law Faculty", "Business Law", "International Law", "Jurisprudence", "Private Law", "Public Law"],
    "lat": 4.7993,
    "lng": 6.9780,
    "address": "RSU Campus",
    "type": "faculty",
    "description": "Academic building for legal studies (Business Law, International Law, Private & Property Law, Public Law).",
    "landmark": "Opposite Faculty of Management Sciences"
  },
  "amphi_theater": {
    "name": "University Amphi Theater",
    "aliases": ["Amphi Theater", "Open Air Theater", "Drama Theater", "Social Center"],
    "lat": 4.7995,
    "lng": 6.9800,
    "address": "Center Axis, RSU Campus",
    "type": "facility",
    "description": "An open-air performance and event venue used for social gatherings, dramas, and student events.",
    "landmark": "Close to Faculty of Law and Arts"
  },
  "faculty_management_sciences": {
    "name": "Faculty of Management Sciences",
    "aliases": ["Management Sciences", "FMS", "Accountancy", "Banking and Finance", "Marketing", "Business Administration", "Office Management"],
    "lat": 4.7992,
    "lng": 6.9809,
    "address": "Lane F, RSU Campus",
    "type": "faculty",
    "description": "Houses Accountancy, Banking and Finance, Management, Marketing, and Office and Information Management.",
    "landmark": "Close to the Senate Building"
  },
  "university_health_centre": {
    "name": "University Health Centre",
    "aliases": ["School Clinic", "Medical Centre", "Campus Clinic", "Health Center"],
    "lat": 4.7955,
    "lng": 6.9820,
    "address": "RSU Campus",
    "type": "facility",
    "description": "Primary healthcare facility for students and staff of the university.",
    "landmark": "Near Faculty of Science and Medical College"
  },
  "faculty_environmental_sciences": {
    "name": "Faculty of Environmental Sciences",
    "aliases": ["Environmental Sciences", "Env Sci", "Architecture", "Estate Management", "Quantity Surveying"],
    "lat": 4.7996,
    "lng": 6.9792,
    "address": "RSU Campus",
    "type": "faculty",
    "description": "Houses Architecture, Estate Management, Quantity Surveying, Surveying and Geomatics, and Urban and Regional Planning.",
    "landmark": "Adjacent to the Faculty of Law"
  },
  "faculty_engineering": {
    "name": "Faculty of Engineering",
    "aliases": ["Engineering Block", "Civil Engineering", "Mechanical Engineering", "Electrical Engineering", "Marine Engineering", "Computer Engineering", "Backgate Axis", "Agricultural Engineering", "Chemical Engineering", "Petrochemical Engineering", "Mechanical Laboratory"],
    "lat": 4.7947,
    "lng": 6.9781,
    "address": "Eagle Island Road, RSU Campus",
    "type": "faculty",
    "description": "Primary block for departments including Agricultural, Chemical, Civil, Computer, Electrical, Marine, and Mechanical Engineering.",
    "landmark": "Near Faculty of Science and Mechanical Workshop"
  },
  "mechanical_workshop": {
    "name": "Mechanical Engineering Workshop",
    "aliases": ["Mechanical Workshop", "Engineering Workshop", "Mech Workshop", "Fabrication Lab"],
    "lat": 4.7940,
    "lng": 6.9775,
    "address": "Off Eagle Island Road, RSU Campus",
    "type": "facility",
    "description": "The central workshop for mechanical engineering students, housing machinery and fabrication tools.",
    "landmark": "Behind Faculty of Engineering"
  },
  "faculty_education": {
    "name": "Faculty of Education",
    "aliases": ["Education Block", "Adult Education", "Business Education", "Educational Foundations", "Technical Education"],
    "lat": 4.8005,
    "lng": 6.9825,
    "address": "RSU Campus",
    "type": "faculty",
    "description": "Academic center for Adult and Community Education, Business Education, Educational Foundations, and Science and Technical Education.",
    "landmark": "North-eastern campus quadrant"
  },
  "faculty_agriculture": {
    "name": "Faculty of Agriculture",
    "aliases": ["Agriculture Block", "Agric", "Agricultural Economics", "Animal Science", "Crop and Soil Science", "Fisheries", "Food Science"],
    "lat": 4.7938,
    "lng": 6.9800,
    "address": "RSU Campus",
    "type": "faculty",
    "description": "Houses departments of Agricultural Economics, Animal Science, Crop and Soil Science, Fisheries, and Food Science and Technology.",
    "landmark": "Near the Faculty of Engineering and Main Gate"
  },
  "faculty_humanities": {
    "name": "Faculty of Humanities",
    "aliases": ["Humanities Block", "English", "History", "Philosophy", "Religious Studies", "French"],
    "lat": 4.7985,
    "lng": 6.9805,
    "address": "RSU Campus",
    "type": "faculty",
    "description": "Houses departments of English, History and International Studies, Philosophy, Religious Studies, and Theatre Arts.",
    "landmark": "Near the Senate Building"
  },
  "faculty_communication": {
    "name": "Faculty of Communication and Media Studies",
    "aliases": ["Communication Studies", "Mass Comm", "Journalism", "Public Relations", "Advertising"],
    "lat": 4.7988,
    "lng": 6.9815,
    "address": "RSU Campus",
    "type": "faculty",
    "description": "Academic block for Mass Communication, Journalism, Public Relations, and Advertising studies.",
    "landmark": "Near Faculty of Management Sciences"
  },
  "college_medical_sciences": {
    "name": "College of Medical Sciences",
    "aliases": ["Medical College", "CMS", "Medicine and Surgery", "Nursing Science", "Anatomy", "Physiology"],
    "lat": 4.7962,
    "lng": 6.9812,
    "address": "Road F, RSU Campus",
    "type": "college",
    "description": "Central hub for Medicine and Surgery, Nursing Science, Anatomy, and Physiology segments.",
    "landmark": "Near University Health Centre"
  },
  "senate_building": {
    "name": "Senate Building",
    "aliases": ["Admin Block", "Vice Chancellor's Office", "University Administration"],
    "lat": 4.7990,
    "lng": 6.9810,
    "address": "Central Axis, RSU Campus",
    "type": "admin",
    "description": "The administrative heart of the university, housing the Vice Chancellor's office and core administrative departments.",
    "landmark": "Near the Faculty of Law and Management Sciences"
  },
  "ict_centre": {
    "name": "RSU ICT Centre",
    "aliases": ["Computer Centre", "IT Hub", "Digital Research Centre"],
    "lat": 4.7945,
    "lng": 6.9815,
    "address": "Near Main Gate, RSU Campus",
    "type": "facility",
    "description": "Central information and communication technology hub for students and staff.",
    "landmark": "Close to the Main Gate"
  },
  "main_stadium": {
    "name": "RSU Main Stadium",
    "aliases": ["Stadium", "Football Pitch", "Football Field", "Track and Field"],
    "lat": 4.7920,
    "lng": 6.9760,
    "address": "Sports Complex, RSU Campus",
    "type": "sports",
    "description": "The main university stadium for football matches and athletic track events.",
    "landmark": "Campus Sports Zone"
  },
  "basketball_court": {
    "name": "RSU Basketball Court",
    "aliases": ["Basketball Court", "Hoops", "Sports Complex Court"],
    "lat": 4.7925,
    "lng": 6.9770,
    "address": "Sports Complex, RSU Campus",
    "type": "sports",
    "description": "Dedicated outdoor basketball court within the university sports complex.",
    "landmark": "Within the Sports Complex area"
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
  },
  "shopping_complex_main": {
    "name": "RSU Main Shopping Complex",
    "aliases": ["Main Complex", "Retail Shops", "Food Vendors", "Business Centers", "Microfinance Bank"],
    "lat": 4.7913,
    "lng": 6.9820,
    "address": "Commercial Area, RSU Campus",
    "type": "facility",
    "description": "Commercial hub containing retail shops, food vendors, business centers, and Nkpolu-UST Microfinance Bank Annex.",
    "landmark": "Central campus commercial zone"
  },
  "cce_main": {
    "name": "Centre for Continuing Education (CCE)",
    "aliases": ["CCE", "Part-time Degrees", "Professional Diplomas", "Adult Education", "Backgate Building"],
    "lat": 4.8074,
    "lng": 6.9879,
    "address": "CCE Complex, RSU",
    "type": "facility",
    "description": "Focuses on Part-time Degree Programs, Professional Diplomas, and Adult Education.",
    "landmark": "CCE Building"
  }
};
