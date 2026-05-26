import { CampusEntry } from '../types';

export const CAMPUS_REGISTRY: Record<string, CampusEntry> = {
  "main_gate": {
    "name": "Main Gate",
    "aliases": ["Entrance"],
    "lat": 4.804043397564349,
    "lng": 6.986824572086334,
    "address": "RSU Main Entrance",
    "type": "gate",
    "description": "Primary entry point to the university.",
    "landmark": "Main Road"
  },
  "main_gate_park": {
    "name": "Rsu Main gate Park",
    "aliases": ["Main Park", "Gate Park"],
    "lat": 4.803467411876692,
    "lng": 6.986166760325432,
    "address": "Near Main Gate",
    "type": "facility",
    "description": "Parking and green area near the main entrance.",
    "landmark": "Main Gate"
  },
  "catholic_church": {
    "name": "Our lady seat of wisdom catholic church",
    "aliases": ["Catholic Church", "Seat of Wisdom"],
    "lat": 4.8021941610458905,
    "lng": 6.984476633369923,
    "address": "Campus Road",
    "type": "facility",
    "description": "University Catholic Chaplaincy.",
    "landmark": "Church Area"
  },
  "chapel_redemption": {
    "name": "chapel of redemption",
    "aliases": ["Chapel", "Redemption Chapel"],
    "lat": 4.799828400567161,
    "lng": 6.984681487083435,
    "address": "Campus Road",
    "type": "facility",
    "description": "University Protestant Chaplaincy.",
    "landmark": "Church Area"
  },
  "entrepreneur_centre": {
    "name": "Risi water/Entrepreneur centre",
    "aliases": ["Entrepreneurship", "Risi Water"],
    "lat": 4.801372944738374,
    "lng": 6.9824472069740295,
    "address": "Business Axis",
    "type": "facility",
    "description": "Centre for Entrepreneurship and utility station.",
    "landmark": "Business Zone"
  },
  "new_senate_building": {
    "name": "New Senate Building - Nyesom Wike building",
    "aliases": ["Senate Building", "Wike Building", "New Admin"],
    "lat": 4.799756903088448,
    "lng": 6.982434801757336,
    "address": "Administrative Axis",
    "type": "admin",
    "description": "Modern administrative headquarters of the university.",
    "landmark": "University Center"
  },
  "old_senate_building": {
    "name": "Old Senate Building",
    "aliases": ["Old Admin"],
    "lat": 4.799469242596039,
    "lng": 6.9836122915148735,
    "address": "Administrative Axis",
    "type": "admin",
    "description": "The former main administrative block.",
    "landmark": "Near New Senate"
  },
  "pg_school": {
    "name": "Post Graduate School",
    "aliases": ["PG School", "Postgraduate"],
    "lat": 4.800075634781602,
    "lng": 6.980743333697319,
    "address": "Academic Axis",
    "type": "college",
    "description": "Administrative center for postgraduate studies.",
    "landmark": "Central Area"
  },
  "convocation_arena": {
    "name": "Convocation Arena",
    "aliases": ["Arena"],
    "lat": 4.801156114067462,
    "lng": 6.980824135243893,
    "address": "Main Arena",
    "type": "facility",
    "description": "Venue for university ceremonies and events.",
    "landmark": "Near PG School"
  },
  "university_library": {
    "name": "Rivers State University Library",
    "aliases": ["Main Library", "School Library"],
    "lat": 4.801379626730222,
    "lng": 6.978179141879082,
    "address": "Library Axis",
    "type": "library",
    "description": "Master resource center for research and learning.",
    "landmark": "Science Cluster"
  },
  "lane_f": {
    "name": "Lane F",
    "aliases": ["Road F"],
    "lat": 4.799017204434427,
    "lng": 6.98038324713707,
    "address": "Campus Roadway",
    "type": "facility",
    "description": "Key navigational lane connecting various faculties.",
    "landmark": "Management Sciences Area"
  },
  "faculty_environment": {
    "name": "Faculty of Environment",
    "aliases": ["Environmental Sciences", "FES"],
    "lat": 4.799665693677162,
    "lng": 6.979225873947144,
    "address": "Environmental Axis",
    "type": "faculty",
    "description": "Academic block for environmental studies.",
    "landmark": "Near Library"
  },
  "estate_management_ict": {
    "name": "Estate Management Department ICT",
    "aliases": ["Estate ICT"],
    "lat": 4.799177572774372,
    "lng": 6.9792503491044044,
    "address": "Environmental Axis",
    "type": "faculty",
    "description": "ICT lab for the Department of Estate Management.",
    "landmark": "Faculty of Environment"
  },
  "faculty_management": {
    "name": "Faculty of Management",
    "aliases": ["Management Sciences", "FMS"],
    "lat": 4.799233033483164,
    "lng": 6.981003172695637,
    "address": "Management Axis",
    "type": "faculty",
    "description": "Academic center for business and management studies.",
    "landmark": "Near Senate Building"
  },
  "opolo_hub": {
    "name": "Opolo Hub ground fall",
    "aliases": ["Opolo Hub"],
    "lat": 4.799104070623238,
    "lng": 6.981071904301643,
    "address": "Innovation Axis",
    "type": "facility",
    "description": "Innovation and tech hub workspace.",
    "landmark": "Faculty of Management"
  },
  "comm_media_studies": {
    "name": "Communication and Media Studies",
    "aliases": ["Mass Comm", "Media Studies"],
    "lat": 4.799105072925353,
    "lng": 6.979966163635254,
    "address": "Communication Axis",
    "type": "faculty",
    "description": "Dedicated faculty for journalism and media.",
    "landmark": "Environmental Sciences Area"
  },
  "maritime": {
    "name": "Maritime",
    "aliases": ["Maritime Building", "Marine"],
    "lat": 4.798379405809462,
    "lng": 6.980094909667969,
    "address": "Science Cluster",
    "type": "faculty",
    "description": "Academic unit for maritime studies.",
    "landmark": "Near Physics Dept"
  },
  "dept_physics": {
    "name": "Department of Physics",
    "aliases": ["Physics Dept", "Physics"],
    "lat": 4.798317263009538,
    "lng": 6.97954136878252,
    "address": "Science Cluster, behind maritime science",
    "type": "faculty",
    "description": "Academic home for Physics programs.",
    "landmark": "Faculty of Science Cluster"
  },
  "physics_lab": {
    "name": "Physics Lab - PL1",
    "aliases": ["Physics Lab"],
    "lat": 4.798328622446508,
    "lng": 6.979178264737129,
    "address": "Science Cluster",
    "type": "facility",
    "description": "Primary laboratory for physics experiments.",
    "landmark": "Physics Dept"
  },
  "dept_chemistry": {
    "name": "Department of Chemistry",
    "aliases": ["Chemistry Dept", "Chemistry"],
    "lat": 4.7979527586229,
    "lng": 6.9795360043644905,
    "address": "Science Cluster",
    "type": "faculty",
    "description": "Academic home for Chemistry programs.",
    "landmark": "Faculty of Science Cluster"
  },
  "chemistry_lab": {
    "name": "chemistry lab",
    "aliases": ["Chemistry Laboratory"],
    "lat": 4.798005212520052,
    "lng": 6.979183293879032,
    "address": "Science Cluster",
    "type": "facility",
    "description": "Chemistry experimental facility.",
    "landmark": "Chemistry Dept"
  },
  "microbiology": {
    "name": "microbiology",
    "aliases": ["Microbiology Dept"],
    "lat": 4.797237113330616,
    "lng": 6.979546397924423,
    "address": "Science Cluster",
    "type": "faculty",
    "description": "Biological sciences department.",
    "landmark": "Near Chemistry"
  },
  "microbiology_lab": {
    "name": "micro biology lab",
    "aliases": ["Micro lab"],
    "lat": 4.79721673313156,
    "lng": 6.979214139282703,
    "address": "Science Cluster",
    "type": "facility",
    "description": "Laboratory for microbiological research.",
    "landmark": "Microbiology Dept"
  },
  "food_science": {
    "name": "food science and technology",
    "aliases": ["Food Sci", "FST"],
    "lat": 4.796560557217385,
    "lng": 6.979412287473679,
    "address": "Agric Axis",
    "type": "faculty",
    "description": "Academic center for food processing and technology.",
    "landmark": "Agric Cluster"
  },
  "plant_science": {
    "name": "Plant Science and Biotechnology - PSB",
    "aliases": ["PSB", "Plant Science"],
    "lat": 4.796736628922248,
    "lng": 6.9799768924713135,
    "address": "Agric Axis",
    "type": "faculty",
    "description": "Botanical and biotechnology research center.",
    "landmark": "Agric Cluster"
  },
  "faculty_social_sciences": {
    "name": "Faculty of Social Sciences",
    "aliases": ["Social Sciences", "FSS"],
    "lat": 4.797754970643287,
    "lng": 6.98076244443655,
    "address": "Campus Center",
    "type": "faculty",
    "description": "Houses sociology, political science, and related fields.",
    "landmark": "Near Management Sciences"
  },
  "microbiology_dept_pt2": {
    "name": "micro biology dept pt2",
    "aliases": ["Microbiology Annex"],
    "lat": 4.797628680315511,
    "lng": 6.980692371726036,
    "address": "Science Extension",
    "type": "faculty",
    "description": "Extension of the Microbiology department.",
    "landmark": "Social Sciences Area"
  },
  "chempet_eng": {
    "name": "chemical petroleum engineering - CHEMPET",
    "aliases": ["CHEMPET", "Chemical Engineering"],
    "lat": 4.795635094189225,
    "lng": 6.9796449691057205,
    "address": "Engineering Cluster",
    "type": "faculty",
    "description": "Building for Chemical and Petroleum engineering studies.",
    "landmark": "Engineering Cluster Area"
  },
  "petroleum_eng": {
    "name": "Department of Petroleum engineering",
    "aliases": ["Petroleum Dept"],
    "lat": 4.79587230685388,
    "lng": 6.980007737874985,
    "address": "Engineering Cluster",
    "type": "faculty",
    "description": "Strategic unit for petroleum engineering education.",
    "landmark": "Near CHEMPET"
  },
  "medical_sciences": {
    "name": "College of medical sciences rsu",
    "aliases": ["Med College", "Medical School"],
    "lat": 4.796219439041408,
    "lng": 6.981086656451225,
    "address": "Medical Axis",
    "type": "college",
    "description": "Premier medical training facility.",
    "landmark": "Near Hostel Area"
  },
  "road_f": {
    "name": "Road F",
    "aliases": ["F-Road"],
    "lat": 4.79682950923403,
    "lng": 6.9808875024318695,
    "address": "Campus Roadway",
    "type": "facility",
    "description": "Major through-road in the campus center.",
    "landmark": "Medical School Area"
  },
  "deeper_life": {
    "name": "Deeper Life Campus Fellowship RSU Main",
    "aliases": ["DLCF"],
    "lat": 4.795673515964436,
    "lng": 6.9807664677500725,
    "address": "Fellowship Area",
    "type": "facility",
    "description": "Campus Christian fellowship center.",
    "landmark": "Near Engineering"
  },
  "shell_centre": {
    "name": "shell centre for excellence in marine",
    "aliases": ["Shell Marine", "Shell Centre"],
    "lat": 4.794411610094972,
    "lng": 6.980064399540424,
    "address": "Engineering Axis",
    "type": "facility",
    "description": "Shell-funded research center for Marine engineering.",
    "landmark": "Mechanical Workshop Area"
  },
  "mech_workshop": {
    "name": "Mechanical Engineering workshop RSU",
    "aliases": ["Engineering Workshop"],
    "lat": 4.79387904970365,
    "lng": 6.979555785655975,
    "address": "Engineering Axis",
    "type": "facility",
    "description": "Central workshop for mechanical projects.",
    "landmark": "Engineering Zone"
  },
  "mechatronics_workshop": {
    "name": "Mechatronics Workshop",
    "aliases": ["Mechatronics"],
    "lat": 4.793893416143743,
    "lng": 6.980026178061962,
    "address": "Engineering Axis",
    "type": "facility",
    "description": "Workshop for robotics and automation.",
    "landmark": "Near Mechanical Workshop"
  },
  "new_marine_building": {
    "name": "New marine building - Titanic Rsu",
    "aliases": ["Titanic", "Marine Building"],
    "lat": 4.793466097947583,
    "lng": 6.979876980185509,
    "address": "Engineering Axis",
    "type": "faculty",
    "description": "Newly completed building for marine studies.",
    "landmark": "Engineering Cluster Edge"
  },
  "faculty_engineering": {
    "name": "Faculty of engineering",
    "aliases": ["Engineering Block", "FENG"],
    "lat": 4.7946608508883095,
    "lng": 6.978156007826328,
    "address": "Engineering Axis",
    "type": "faculty",
    "description": "Main administrative block for Engineering.",
    "landmark": "Near ICT"
  },
  "nddc_hostel": {
    "name": "NDDC hostel",
    "aliases": ["NDDC"],
    "lat": 4.793837286794675,
    "lng": 6.981212720274925,
    "address": "Residential Area",
    "type": "hostel",
    "description": "Hostel sponsored by NDDC.",
    "landmark": "Hostel Zone"
  },
  "maracana_field": {
    "name": "Maracana field",
    "aliases": ["Football Field", "Sports Field"],
    "lat": 4.793268642772128,
    "lng": 6.981702893972397,
    "address": "Sports Complex",
    "type": "sports",
    "description": "Primary football field for matches.",
    "landmark": "Hostel Area"
  },
  "f_g_hostel": {
    "name": "F and G hostel",
    "aliases": ["Hostel F", "Hostel G"],
    "lat": 4.793668564616451,
    "lng": 6.982167921960354,
    "address": "Residential Area",
    "type": "hostel",
    "description": "Student residential blocks F and G.",
    "landmark": "Near Shopping Complex"
  },
  "f_extension": {
    "name": "F-extension hostel",
    "aliases": ["F-Ext"],
    "lat": 4.795444321690671,
    "lng": 6.982199437916279,
    "address": "Residential Area",
    "type": "hostel",
    "description": "Extension of Hostel F.",
    "landmark": "Medical College Area"
  },
  "hostel_h": {
    "name": "Hostel h",
    "aliases": ["Hostel H"],
    "lat": 4.796095487144847,
    "lng": 6.982501856982708,
    "address": "Residential Area",
    "type": "hostel",
    "description": "Student residential block H.",
    "landmark": "Near PG Hostel"
  },
  "pg_hostel": {
    "name": "PG hostel",
    "aliases": ["PG Residence"],
    "lat": 4.796278575113504,
    "lng": 6.982810311019421,
    "address": "Residential Area",
    "type": "hostel",
    "description": "Residency for postgraduate students.",
    "landmark": "Hostel Axis"
  },
  "estate_works": {
    "name": "Estate, works and transport DEPARTMENT",
    "aliases": ["Works Dept", "Transport"],
    "lat": 4.797334670996316,
    "lng": 6.98343425989151,
    "address": "Utilities Axis",
    "type": "admin",
    "description": "Administrative unit for campus maintenance and transport.",
    "landmark": "Near Filling Station"
  },
  "filing_station": {
    "name": "RSU filing station",
    "aliases": ["Fuel Station", "Gas Station"],
    "lat": 4.79745728626187,
    "lng": 6.98395662009716,
    "address": "Utility Road",
    "type": "facility",
    "description": "University-operated fuel station.",
    "landmark": "Near Works Dept"
  },
  "road_b_science": {
    "name": "Road b",
    "aliases": ["B-Road"],
    "lat": 4.7978037494408765,
    "lng": 6.984148398041725,
    "address": "Campus Roadway",
    "type": "facility",
    "description": "A connecting road through the science axis.",
    "landmark": "Near Filling Station"
  },
  "cce": {
    "name": "centre for continuous education - CCE",
    "aliases": ["CCE"],
    "lat": 4.793665223582799,
    "lng": 6.983525454998016,
    "address": "CCE Axis",
    "type": "facility",
    "description": "Academic center for part-time and diploma programs.",
    "landmark": "Back Gate Area"
  },
  "back_gate": {
    "name": "Rsu back gate",
    "aliases": ["Back Entrance"],
    "lat": 4.793564658462199,
    "lng": 6.9841618090868,
    "address": "Eagle Island Entrance",
    "type": "gate",
    "description": "The secondary gate of the university.",
    "landmark": "Near CCE"
  },
  "back_gate_park": {
    "name": "Rsu back gate park",
    "aliases": ["Back Park"],
    "lat": 4.792723051440776,
    "lng": 6.982695981860161,
    "address": "Near Back Gate",
    "type": "facility",
    "description": "Parking area for the back gate.",
    "landmark": "Back Gate"
  },
  "aluta_house": {
    "name": "Nyesom wike Aluta house(SUG)",
    "aliases": ["SUG Building", "Aluta House"],
    "lat": 4.7925907463125705,
    "lng": 6.982399933040142,
    "address": "Student Center",
    "type": "facility",
    "description": "Headquarters of the Student Union Government.",
    "landmark": "Near Shopping Complex"
  },
  "road_b_south": {
    "name": "Road b",
    "aliases": ["B-Road South"],
    "lat": 4.792898121823593,
    "lng": 6.980645097792149,
    "address": "Campus Roadway",
    "type": "facility",
    "description": "Southbound segment of Road B.",
    "landmark": "Near Engineering"
  },
  "love_garden": {
    "name": "love Garden",
    "aliases": ["Park", "Garden"],
    "lat": 4.792824953100349,
    "lng": 6.9820475578308105,
    "address": "Central Axis",
    "type": "facility",
    "description": "Relaxation and hangout spot for students.",
    "landmark": "Near SUG"
  },
  "bookshop": {
    "name": "RSU bookshop",
    "aliases": ["University Bookshop"],
    "lat": 4.792515238828923,
    "lng": 6.9820090010762215,
    "address": "Commercial Hub",
    "type": "facility",
    "description": "Retailer for textbooks and stationery.",
    "landmark": "Near Shopping Complex"
  },
  "shopping_complex": {
    "name": "RSU shopping complex",
    "aliases": ["Main Complex", "Retail Shops"],
    "lat": 4.791305447433437,
    "lng": 6.9818852841854095,
    "address": "Commercial Hub",
    "type": "facility",
    "description": "The major retail hub on campus.",
    "landmark": "Main Commercial Zone"
  },
  "road_d": {
    "name": "Road D",
    "aliases": ["D-Road"],
    "lat": 4.792571702390473,
    "lng": 6.979995667934418,
    "address": "Campus Roadway",
    "type": "facility",
    "description": "Navigational road connecting core engineering zones.",
    "landmark": "Engineering Axis"
  },
  "azikiwe_street": {
    "name": "azikiwe street",
    "aliases": ["Azikiwe"],
    "lat": 4.7926428665176415,
    "lng": 6.9821105897426605,
    "address": "Residential Access",
    "type": "facility",
    "description": "Access road to various student centers.",
    "landmark": "Near Shopping Complex"
  },
  "faculty_law": {
    "name": "Faculty of Law",
    "aliases": ["Law Building", "RSU Law"],
    "lat": 4.799547756215179,
    "lng": 6.977882087230682,
    "address": "Law Axis",
    "type": "faculty",
    "description": "Academic center for legal studies.",
    "landmark": "Near Filing Station"
  },
  "basketball_court": {
    "name": "basketball court",
    "aliases": ["Basketball"],
    "lat": 4.793273988429068,
    "lng": 6.977929025888443,
    "address": "Sports Area",
    "type": "sports",
    "description": "Campus basketball facilities.",
    "landmark": "Sports Complex"
  },
  "road_c": {
    "name": "road c",
    "aliases": ["Road C"],
    "lat": 4.792307426153853,
    "lng": 6.978841982781887,
    "address": "South Axis",
    "type": "facility",
    "description": "Connecting road in the southern campus sector.",
    "landmark": "Near Engineering"
  },
  "amphitheatre": {
    "name": "amphitheatre",
    "aliases": ["Amphi"],
    "lat": 4.793326108582028,
    "lng": 6.97838768362999,
    "address": "Events Area",
    "type": "facility",
    "description": "Open-air theatre for performances.",
    "landmark": "Near Engineering"
  },
  "health_centre": {
    "name": "health centre",
    "aliases": ["Clinic", "Medical Centre"],
    "lat": 4.796806122106352,
    "lng": 6.976924203336239,
    "address": "Medical Axis",
    "type": "facility",
    "description": "University medical services provider.",
    "landmark": "Science Cluster Area"
  },
  "fatse": {
    "name": "faculty of technical and science education",
    "aliases": ["FATSE"],
    "lat": 4.797232770009543,
    "lng": 6.977566592395306,
    "address": "Education Axis",
    "type": "faculty",
    "description": "Academic home for technical and science educators.",
    "landmark": "Near Science Cluster"
  },
  "needs_assessment": {
    "name": "Needs assessment building",
    "aliases": ["Needs Building"],
    "lat": 4.798678760293311,
    "lng": 6.976926214993,
    "address": "Admin Extension",
    "type": "admin",
    "description": "Building for university needs assessment and planning.",
    "landmark": "Near Science Cluster"
  },
  "geology_dept": {
    "name": "Geology Department",
    "aliases": ["Geology"],
    "lat": 4.799666027777587,
    "lng": 6.97687391191721,
    "address": "Science Axis",
    "type": "faculty",
    "description": "Academic center for geological studies.",
    "landmark": "Western Campus"
  },
  "electronics_lab": {
    "name": "Electronics Lab",
    "aliases": ["Physics Electronics Lab"],
    "lat": 4.798339981883289,
    "lng": 6.979401893913746,
    "address": "Physics Dept First floor",
    "type": "facility",
    "description": "Specialized laboratory for electronics.",
    "landmark": "Physics Dept"
  },
  "ict_centre": {
    "name": "ICT CENTRE",
    "aliases": ["Main ICT"],
    "lat": 4.796343725017528,
    "lng": 6.977858617901802,
    "address": "Technology Axis",
    "type": "facility",
    "description": "Central Information and Communication Technology center.",
    "landmark": "Near Engineering"
  },
  "law_car_park": {
    "name": "Law Car park",
    "aliases": ["Law Park"],
    "lat": 4.79849934807937,
    "lng": 6.977738253772259,
    "address": "Law Axis",
    "type": "facility",
    "description": "Parking area for the Faculty of Law.",
    "landmark": "Faculty of Law"
  },
  "science_faculty_building": {
    "name": "Science Faculty building",
    "aliases": ["Main Science Building"],
    "lat": 4.797965454470986,
    "lng": 6.978180147707462,
    "address": "Science Cluster",
    "type": "faculty",
    "description": "Principal laboratory and lecture block for Sciences.",
    "landmark": "Science Axis"
  },
  "quantity_surveying": {
    "name": "Quantity Surveying",
    "aliases": ["QS"],
    "lat": 4.798952722987123,
    "lng": 6.979128308594227,
    "address": "Faculty of Environmental Sciences, QXXH+MM8 University Nkpolu, Mgbuosimiri, Port Harcourt 500101, Rivers, Nigeria",
    "type": "faculty",
    "description": "Department of Quantity Surveying.",
    "landmark": "Faculty of Environmental Sciences"
  },
  "ecobank": {
    "name": "ecobank",
    "aliases": ["Ecobank ATM"],
    "lat": 4.7952461988818404,
    "lng": 6.978672668337822,
    "address": "Rivers State University, QXWH+4F7, Eagle Island, Port Harcourt 500101, Rivers, Nigeria",
    "type": "facility",
    "description": "Electronic banking and ATM services.",
    "landmark": "Near Engineering"
  },
  "microfinance": {
    "name": "microfinance",
    "aliases": ["Microfinance Bank"],
    "lat": 4.795138283735813,
    "lng": 6.978609301149845,
    "address": "QXWH+3C9, Road B, Diobu, Port Harcourt 500101, Rivers, Nigeria",
    "type": "facility",
    "description": "RSU Microfinance Bank services.",
    "landmark": "Road b Area"
  },
  "engineering_block_2": {
    "name": "Engineering Block",
    "aliases": ["Engineering"],
    "lat": 4.793856330681481,
    "lng": 6.978192552924156,
    "address": "Rivers State University, QXVH+G6X, Eagle Island, Port Harcourt 500101, Rivers, Nigeria",
    "type": "faculty",
    "description": "Another block within the engineering cluster.",
    "landmark": "Engineering Cluster"
  },
  "road_b_west": {
    "name": "Road b",
    "aliases": ["B-Road West"],
    "lat": 4.7949468428930295,
    "lng": 6.977218575775623,
    "address": "QXVG+WQX, Road B, Diobu, Port Harcourt 500101, Rivers, Nigeria",
    "type": "facility",
    "description": "Western segment of Road B.",
    "landmark": "Near Engineering"
  },
  "new_libraryfe_building": {
    "name": "New Library/F.E Building",
    "aliases": ["New Library/F.E Building"],
    "lat": 4.800078736340636,
    "lng": 6.9806307554244995,
    "address": "Rivers State University Campus",
    "type": "library",
    "description": "Academic resource center: New Library/F.E Building.",
    "landmark": "Near campus pathway"
  },
  "vc_guest_house": {
    "name": "V.C GUEST HOUSE",
    "aliases": ["V.C GUEST HOUSE"],
    "lat": 4.800000760451421,
    "lng": 6.97960764169693,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "University facility: V.C GUEST HOUSE.",
    "landmark": "Near campus pathway"
  },
  "staff_club": {
    "name": "STAFF CLUB",
    "aliases": ["STAFF CLUB"],
    "lat": 4.799052063051493,
    "lng": 6.979069113731384,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "University facility: STAFF CLUB.",
    "landmark": "Near campus pathway"
  },
  "sug_secretariate": {
    "name": "SUG SECRETARIATE",
    "aliases": ["SUG SECRETARIATE"],
    "lat": 4.797864319888806,
    "lng": 6.980410039424896,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "University facility: SUG SECRETARIATE.",
    "landmark": "Near campus pathway"
  },
  "estate_dept": {
    "name": "ESTATE DEPT",
    "aliases": ["ESTATE DEPT"],
    "lat": 4.797171453265888,
    "lng": 6.980848610401154,
    "address": "Rivers State University Campus",
    "type": "faculty",
    "description": "Academic block housing the ESTATE DEPT.",
    "landmark": "Near campus pathway"
  },
  "bus_park": {
    "name": "BUS PARK",
    "aliases": ["BUS PARK"],
    "lat": 4.797587635951801,
    "lng": 6.981881260871887,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Transit park and vehicle terminal: BUS PARK.",
    "landmark": "Near campus pathway"
  },
  "tetfund_officepost_graduate_dept": {
    "name": "TETFUND OFFICE/POST GRADUATE DEPT",
    "aliases": ["TETFUND OFFICE/POST GRADUATE DEPT"],
    "lat": 4.797305987343277,
    "lng": 6.982639133930206,
    "address": "Rivers State University Campus",
    "type": "faculty",
    "description": "Academic block housing the TETFUND OFFICE/POST GRADUATE DEPT.",
    "landmark": "Near campus pathway"
  },
  "tetfund_building": {
    "name": "TETFUND BUILDING",
    "aliases": ["TETFUND BUILDING"],
    "lat": 4.796791136932479,
    "lng": 6.98144268989563,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "University facility: TETFUND BUILDING.",
    "landmark": "Near campus pathway"
  },
  "admin_block": {
    "name": "ADMIN BLOCK",
    "aliases": ["ADMIN BLOCK"],
    "lat": 4.795325852923769,
    "lng": 6.98150172829628,
    "address": "Rivers State University Campus",
    "type": "admin",
    "description": "Administrative office for ADMIN BLOCK.",
    "landmark": "Near campus pathway"
  },
  "stadium": {
    "name": "STADIUM",
    "aliases": ["STADIUM"],
    "lat": 4.79468988675661,
    "lng": 6.980436861515045,
    "address": "Rivers State University Campus",
    "type": "sports",
    "description": "Sports training ground and leisure area: STADIUM.",
    "landmark": "Near campus pathway"
  },
  "post_office": {
    "name": "POST OFFICE",
    "aliases": ["POST OFFICE"],
    "lat": 4.794632857410427,
    "lng": 6.981657266616821,
    "address": "Rivers State University Campus",
    "type": "admin",
    "description": "Administrative office for POST OFFICE.",
    "landmark": "Near campus pathway"
  },
  "faculty_of_humanities": {
    "name": "FACULTY OF HUMANITIES",
    "aliases": ["FACULTY OF HUMANITIES"],
    "lat": 4.79339396265731,
    "lng": 6.98236155509901,
    "address": "Rivers State University Campus",
    "type": "faculty",
    "description": "Academic block housing the FACULTY OF HUMANITIES.",
    "landmark": "Near campus pathway"
  },
  "faculty_of_comm_and_social_sci": {
    "name": "FACULTY OF COMM. AND SOCIAL SCI",
    "aliases": ["FACULTY OF COMM. AND SOCIAL SCI"],
    "lat": 4.79234850978939,
    "lng": 6.982468843460083,
    "address": "Rivers State University Campus",
    "type": "faculty",
    "description": "Academic block housing the FACULTY OF COMM. AND SOCIAL SCI.",
    "landmark": "Near campus pathway"
  },
  "faculty_of_education": {
    "name": "FACULTY OF EDUCATION",
    "aliases": ["FACULTY OF EDUCATION"],
    "lat": 4.792556515828859,
    "lng": 6.983573883771896,
    "address": "Rivers State University Campus",
    "type": "faculty",
    "description": "Academic block housing the FACULTY OF EDUCATION.",
    "landmark": "Near campus pathway"
  },
  "faculty_of_environmental_sci": {
    "name": "FACULTY OF ENVIRONMENTAL SCI",
    "aliases": ["FACULTY OF ENVIRONMENTAL SCI"],
    "lat": 4.792576103328249,
    "lng": 6.984711050987244,
    "address": "Rivers State University Campus",
    "type": "faculty",
    "description": "Academic block housing the FACULTY OF ENVIRONMENTAL SCI.",
    "landmark": "Near campus pathway"
  },
  "coe_hostel": {
    "name": "COE HOSTEL",
    "aliases": ["COE HOSTEL"],
    "lat": 4.791850125585994,
    "lng": 6.985062420368195,
    "address": "Rivers State University Campus",
    "type": "hostel",
    "description": "COE HOSTEL residence accommodating university students.",
    "landmark": "Near campus pathway"
  },
  "amazing_grace_hostel": {
    "name": "AMAZING GRACE HOSTEL",
    "aliases": ["AMAZING GRACE HOSTEL"],
    "lat": 4.790589887163013,
    "lng": 6.985652536153793,
    "address": "Rivers State University Campus",
    "type": "hostel",
    "description": "AMAZING GRACE HOSTEL residence accommodating university students.",
    "landmark": "Near campus pathway"
  },
  "a_block_hostel": {
    "name": "A BLOCK HOSTEL",
    "aliases": ["A BLOCK HOSTEL"],
    "lat": 4.793822188204639,
    "lng": 6.986161395907402,
    "address": "Rivers State University Campus",
    "type": "hostel",
    "description": "A BLOCK HOSTEL residence accommodating university students.",
    "landmark": "Near campus pathway"
  },
  "f_block_hostel": {
    "name": "F BLOCK HOSTEL",
    "aliases": ["F BLOCK HOSTEL"],
    "lat": 4.795098951012891,
    "lng": 6.986349135637283,
    "address": "Rivers State University Campus",
    "type": "hostel",
    "description": "F BLOCK HOSTEL residence accommodating university students.",
    "landmark": "Near campus pathway"
  },
  "b_block_hostel": {
    "name": "B BLOCK HOSTEL",
    "aliases": ["B BLOCK HOSTEL"],
    "lat": 4.794469738092288,
    "lng": 6.9869687259197235,
    "address": "Rivers State University Campus",
    "type": "hostel",
    "description": "B BLOCK HOSTEL residence accommodating university students.",
    "landmark": "Near campus pathway"
  },
  "d_block_hostel": {
    "name": "D BLOCK HOSTEL",
    "aliases": ["D BLOCK HOSTEL"],
    "lat": 4.79654160408544,
    "lng": 6.985957533121109,
    "address": "Rivers State University Campus",
    "type": "hostel",
    "description": "D BLOCK HOSTEL residence accommodating university students.",
    "landmark": "Near campus pathway"
  },
  "nelson_mandela_hostel": {
    "name": "NELSON MANDELA HOSTEL",
    "aliases": ["NELSON MANDELA HOSTEL"],
    "lat": 4.798150410427303,
    "lng": 6.985011488199234,
    "address": "Rivers State University Campus",
    "type": "hostel",
    "description": "NELSON MANDELA HOSTEL residence accommodating university students.",
    "landmark": "Near campus pathway"
  },
  "faculty_of_sci_block_a": {
    "name": "FACULTY OF SCI BLOCK A",
    "aliases": ["FACULTY OF SCI BLOCK A"],
    "lat": 4.797282869584735,
    "lng": 6.983997583388899,
    "address": "Rivers State University Campus",
    "type": "faculty",
    "description": "Academic block housing the FACULTY OF SCI BLOCK A.",
    "landmark": "Near campus pathway"
  },
  "faculty_of_sci_block_b": {
    "name": "FACULTY OF SCI BLOCK B",
    "aliases": ["FACULTY OF SCI BLOCK B"],
    "lat": 4.797931326442656,
    "lng": 6.984021723270416,
    "address": "Rivers State University Campus",
    "type": "faculty",
    "description": "Academic block housing the FACULTY OF SCI BLOCK B.",
    "landmark": "Near campus pathway"
  },
  "faculty_of_sci_block_c": {
    "name": "FACULTY OF SCI BLOCK C",
    "aliases": ["FACULTY OF SCI BLOCK C"],
    "lat": 4.798227653770381,
    "lng": 6.983533561229706,
    "address": "Rivers State University Campus",
    "type": "faculty",
    "description": "Academic block housing the FACULTY OF SCI BLOCK C.",
    "landmark": "Near campus pathway"
  },
  "faculty_of_agriculture": {
    "name": "FACULTY OF AGRICULTURE",
    "aliases": ["FACULTY OF AGRICULTURE"],
    "lat": 4.799752399217646,
    "lng": 6.9829917550086975,
    "address": "Rivers State University Campus",
    "type": "faculty",
    "description": "Academic block housing the FACULTY OF AGRICULTURE.",
    "landmark": "Near campus pathway"
  },
  "animal_sci_dept": {
    "name": "ANIMAL SCI DEPT",
    "aliases": ["ANIMAL SCI DEPT"],
    "lat": 4.801692257321287,
    "lng": 6.984570503234863,
    "address": "Rivers State University Campus",
    "type": "faculty",
    "description": "Academic block housing the ANIMAL SCI DEPT.",
    "landmark": "Near campus pathway"
  },
  "commercial_back_gate": {
    "name": "COMMERCIAL BACK GATE",
    "aliases": ["COMMERCIAL BACK GATE"],
    "lat": 4.802377395277169,
    "lng": 6.987747251987457,
    "address": "Rivers State University Campus",
    "type": "gate",
    "description": "Access control gates: COMMERCIAL BACK GATE.",
    "landmark": "Near campus pathway"
  },
  "new_law_faculty": {
    "name": "NEW LAW FACULTY",
    "aliases": ["NEW LAW FACULTY"],
    "lat": 4.799981881474261,
    "lng": 6.9874307513237,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "University facility: NEW LAW FACULTY.",
    "landmark": "Near campus pathway"
  },
  "back_gateport_harcourt_poly": {
    "name": "BACK GATE/PORT HARCOURT POLY",
    "aliases": ["BACK GATE/PORT HARCOURT POLY"],
    "lat": 4.795657805125345,
    "lng": 6.987752616405487,
    "address": "Rivers State University Campus",
    "type": "gate",
    "description": "Access control gates: BACK GATE/PORT HARCOURT POLY.",
    "landmark": "Near campus pathway"
  },
  "agro_shop": {
    "name": "AGRO SHOP",
    "aliases": ["AGRO SHOP"],
    "lat": 4.801683404543781,
    "lng": 6.981894671916962,
    "address": "Rivers State University Campus",
    "type": "food",
    "description": "Commercial point for feeding and retail resources: AGRO SHOP.",
    "landmark": "Near campus pathway"
  },
  "rsu_farm": {
    "name": "RSU FARM",
    "aliases": ["RSU FARM"],
    "lat": 4.804253303350171,
    "lng": 6.982361376285553,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "University facility: RSU FARM.",
    "landmark": "Near campus pathway"
  },
  "water_works": {
    "name": "WATER WORKS",
    "aliases": ["WATER WORKS"],
    "lat": 4.804866632427845,
    "lng": 6.980644762516022,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "University facility: WATER WORKS.",
    "landmark": "Near campus pathway"
  },
  "mechanical_workshop_engineering_rsu": {
    "name": "Mechanical Workshop engineering rsu",
    "aliases": ["Mechanical Workshop engineering rsu"],
    "lat": 4.793739773410506,
    "lng": 6.979611532439566,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: Mechanical Workshop engineering rsu.",
    "landmark": "Near campus pathway"
  },
  "engineering_drawing_office_second_floor": {
    "name": "Engineering Drawing Office second floor",
    "aliases": ["Engineering Drawing Office second floor","Engineering"],
    "lat": 4.793610996843477,
    "lng": 6.979502844514589,
    "address": "Rivers State University Campus",
    "type": "admin",
    "description": "Administrative office for Engineering Drawing Office second floor.",
    "landmark": "Near campus pathway"
  },
  "engineering_drawing_hall_a_second_floor": {
    "name": "Engineering Drawing Hall A Second Floor",
    "aliases": ["Engineering Drawing Hall A Second Floor","Engineering"],
    "lat": 4.793608240417242,
    "lng": 6.979402266444825,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: Engineering Drawing Hall A Second Floor.",
    "landmark": "Near campus pathway"
  },
  "hod_mechatronics_engineering_first_floor": {
    "name": "HOD Mechatronics Engineering First Floor",
    "aliases": ["HOD Mechatronics Engineering First Floor","Engineering"],
    "lat": 4.793604113271787,
    "lng": 6.979144774378732,
    "address": "Rivers State University Campus",
    "type": "admin",
    "description": "Administrative office for HOD Mechatronics Engineering First Floor.",
    "landmark": "Near campus pathway"
  },
  "hod_petroleum_engineering_first_floor": {
    "name": "HOD Petroleum Engineering First Floor",
    "aliases": ["HOD Petroleum Engineering First Floor","Engineering"],
    "lat": 4.793836750953147,
    "lng": 6.97914343327429,
    "address": "Rivers State University Campus",
    "type": "admin",
    "description": "Administrative office for HOD Petroleum Engineering First Floor.",
    "landmark": "Near campus pathway"
  },
  "hod_computer_engineering_office_first_floor": {
    "name": "HOD Computer Engineering Office First Floor",
    "aliases": ["HOD Computer Engineering Office First Floor","Engineering"],
    "lat": 4.79384499879958,
    "lng": 6.979402266444825,
    "address": "Rivers State University Campus",
    "type": "admin",
    "description": "Administrative office for HOD Computer Engineering Office First Floor.",
    "landmark": "Near campus pathway"
  },
  "hod_mechanical_engineering_office_first_floor": {
    "name": "HOD Mechanical Engineering Office First Floor",
    "aliases": ["HOD Mechanical Engineering Office First Floor","Engineering"],
    "lat": 4.794022370001844,
    "lng": 6.979403607549369,
    "address": "Rivers State University Campus",
    "type": "admin",
    "description": "Administrative office for HOD Mechanical Engineering Office First Floor.",
    "landmark": "Near campus pathway"
  },
  "hod_electrical_engineering_office_first_floor": {
    "name": "HOD Electrical Engineering Office First Floor",
    "aliases": ["HOD Electrical Engineering Office First Floor","Engineering"],
    "lat": 4.794121404149202,
    "lng": 6.979410312952403,
    "address": "Rivers State University Campus",
    "type": "admin",
    "description": "Administrative office for HOD Electrical Engineering Office First Floor.",
    "landmark": "Near campus pathway"
  },
  "hod_civil_engineering_office_first_floor": {
    "name": "HOD Civil Engineering Office First Floor",
    "aliases": ["HOD Civil Engineering Office First Floor","Engineering"],
    "lat": 4.794271343750806,
    "lng": 6.979403607549369,
    "address": "Rivers State University Campus",
    "type": "admin",
    "description": "Administrative office for HOD Civil Engineering Office First Floor.",
    "landmark": "Near campus pathway"
  },
  "thermodynamics_lab_first_floor": {
    "name": "Thermodynamics Lab first floor",
    "aliases": ["Thermodynamics Lab first floor"],
    "lat": 4.793979707297833,
    "lng": 6.97893963456382,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: Thermodynamics Lab first floor.",
    "landmark": "Near campus pathway"
  },
  "hod_chemical_engineering_second_floor": {
    "name": "HOD Chemical Engineering second floor",
    "aliases": ["HOD Chemical Engineering second floor","Engineering"],
    "lat": 4.794140654067347,
    "lng": 6.979148797692135,
    "address": "Rivers State University Campus",
    "type": "admin",
    "description": "Administrative office for HOD Chemical Engineering second floor.",
    "landmark": "Near campus pathway"
  },
  "petroleum_production_lab_engineering": {
    "name": "Petroleum production lab engineering",
    "aliases": ["Petroleum production lab engineering"],
    "lat": 4.794271342939989,
    "lng": 6.979146115483011,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: Petroleum production lab engineering.",
    "landmark": "Near campus pathway"
  },
  "computer_engineering_lab_1_first_floor": {
    "name": "Computer engineering lab 1 first floor",
    "aliases": ["Computer engineering lab 1 first floor"],
    "lat": 4.794140654160416,
    "lng": 6.9788055419921875,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: Computer engineering lab 1 first floor.",
    "landmark": "Near campus pathway"
  },
  "soil_mechanics_lab_civil_engineering": {
    "name": "Soil mechanics lab civil engineering",
    "aliases": ["Soil mechanics lab civil engineering"],
    "lat": 4.794212148110515,
    "lng": 6.978801518678665,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: Soil mechanics lab civil engineering.",
    "landmark": "Near campus pathway"
  },
  "civil_and_environmental_engineering_lab_second_floor": {
    "name": "Civil and environmental engineering lab second floor",
    "aliases": ["Civil and environmental engineering lab second floor"],
    "lat": 4.794285098236755,
    "lng": 6.978800177574158,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: Civil and environmental engineering lab second floor.",
    "landmark": "Near campus pathway"
  },
  "fluid_mechanics_and_structural_lab_first_floor": {
    "name": "Fluid mechanics and structural lab first floor",
    "aliases": ["Fluid mechanics and structural lab first floor"],
    "lat": 4.794406086782414,
    "lng": 6.978802859783173,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: Fluid mechanics and structural lab first floor.",
    "landmark": "Near campus pathway"
  },
  "computer_engineering_lab_2_second_floor": {
    "name": "Computer engineering lab 2 second floor",
    "aliases": ["Computer engineering lab 2 second floor"],
    "lat": 4.794503715610817,
    "lng": 6.978802859783173,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: Computer engineering lab 2 second floor.",
    "landmark": "Near campus pathway"
  },
  "electronics_and_electrical_lab_first_floor": {
    "name": "Electronics and electrical lab first floor",
    "aliases": ["Electronics and electrical lab first floor"],
    "lat": 4.794627464977467,
    "lng": 6.978800177574158,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: Electronics and electrical lab first floor.",
    "landmark": "Near campus pathway"
  },
  "engineering_materials_and_testing_lab_second_floor": {
    "name": "Engineering materials and testing lab second floor",
    "aliases": ["Engineering materials and testing lab second floor","Engineering"],
    "lat": 4.794711311090001,
    "lng": 6.978801518678665,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: Engineering materials and testing lab second floor.",
    "landmark": "Near campus pathway"
  },
  "petroleum_drilling_lab_second_floor": {
    "name": "Petroleum drilling lab second floor",
    "aliases": ["Petroleum drilling lab second floor"],
    "lat": 4.794781440076722,
    "lng": 6.978802859783173,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: Petroleum drilling lab second floor.",
    "landmark": "Near campus pathway"
  },
  "civil_and_environmental_engineeing_lab_second_floor": {
    "name": "Civil and environmental engineeing lab second floor",
    "aliases": ["Civil and environmental engineeing lab second floor"],
    "lat": 4.79486256247738,
    "lng": 6.978800177574158,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: Civil and environmental engineeing lab second floor.",
    "landmark": "Near campus pathway"
  },
  "mechatronics_lab_second_floor": {
    "name": "Mechatronics lab second floor",
    "aliases": ["Mechatronics lab second floor"],
    "lat": 4.794781440076722,
    "lng": 6.97860170006752,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: Mechatronics lab second floor.",
    "landmark": "Near campus pathway"
  },
  "chemical_engineering_lab_first_floor": {
    "name": "Chemical engineering lab first floor",
    "aliases": ["Chemical engineering lab first floor"],
    "lat": 4.794689311082531,
    "lng": 6.97859633564949,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: Chemical engineering lab first floor.",
    "landmark": "Near campus pathway"
  },
  "metrology_and_metallography_lab_second_floor": {
    "name": "Metrology and metallography lab second floor",
    "aliases": ["Metrology and metallography lab second floor"],
    "lat": 4.794586214154964,
    "lng": 6.978593653440475,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: Metrology and metallography lab second floor.",
    "landmark": "Near campus pathway"
  },
  "renewable_energy_lab_engineering": {
    "name": "Renewable energy lab engineering",
    "aliases": ["Renewable energy lab engineering"],
    "lat": 4.794476214690413,
    "lng": 6.978593653440475,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: Renewable energy lab engineering.",
    "landmark": "Near campus pathway"
  },
  "chemical_engineering_lab_first_floor_alt": {
    "name": "Chemical Engineering Lab first floor",
    "aliases": ["Chemical Engineering Lab first floor","Engineering"],
    "lat": 4.79437858624136,
    "lng": 6.97859633564949,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: Chemical Engineering Lab first floor.",
    "landmark": "Near campus pathway"
  },
  "mdr_marine_engineering_room_first_floor": {
    "name": "MDR marine engineering room first floor",
    "aliases": ["MDR marine engineering room first floor"],
    "lat": 4.794316056629967,
    "lng": 6.978600583970547,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "University facility: MDR marine engineering room first floor.",
    "landmark": "Near campus pathway"
  },
  "edr_engineering_drawing_room_ground_floor": {
    "name": "EDR - Engineering Drawing Room ground floor",
    "aliases": ["EDR - Engineering Drawing Room ground floor", "Engineering Drawing Room ground floor", "EDR", "Engineering"],
    "lat": 4.794342116667212,
    "lng": 6.978453733026981,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: EDR - Engineering Drawing Room ground floor.",
    "landmark": "Near campus pathway"
  },
  "edh_engineering_drawing_hall_b_first_floor": {
    "name": "EDH - Engineering Drawing Hall b first floor",
    "aliases": ["EDH - Engineering Drawing Hall b first floor", "Engineering Drawing Hall b first floor", "EDH Hall b", "Engineering"],
    "lat": 4.794320734072634,
    "lng": 6.97870284318924,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: EDH - Engineering Drawing Hall b first floor.",
    "landmark": "Near campus pathway"
  },
  "edh_engineering_drawing_hall_a_first_floor": {
    "name": "EDH - Engineering Drawing Hall A first floor",
    "aliases": ["EDH - Engineering Drawing Hall A first floor", "Engineering Drawing Hall A first floor", "EDH Hall A", "Engineering"],
    "lat": 4.7943224045878505,
    "lng": 6.978397741913796,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: EDH - Engineering Drawing Hall A first floor.",
    "landmark": "Near campus pathway"
  },
  "mdr_mechanical_second_floor": {
    "name": "MDR mechanical second floor",
    "aliases": ["MDR mechanical second floor"],
    "lat": 4.794220055743477,
    "lng": 6.978704184293747,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "University facility: MDR mechanical second floor.",
    "landmark": "Near campus pathway"
  },
  "civil_engineering_drawing_room_second_floor": {
    "name": "Civil engineering drawing room second floor",
    "aliases": ["Civil engineering drawing room second floor"],
    "lat": 4.794136873523788,
    "lng": 6.978701502084732,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "University facility: Civil engineering drawing room second floor.",
    "landmark": "Near campus pathway"
  },
  "engineering_drawing_hall_c_second_floor": {
    "name": "Engineering Drawing hall C second floor",
    "aliases": ["Engineering Drawing hall C second floor","Engineering"],
    "lat": 4.794017213876022,
    "lng": 6.978705525398254,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: Engineering Drawing hall C second floor.",
    "landmark": "Near campus pathway"
  },
  "general_drawing_office_second_floor": {
    "name": "General drawing office second floor",
    "aliases": ["General drawing office second floor"],
    "lat": 4.7939113271787,
    "lng": 6.9787028431892395,
    "address": "Rivers State University Campus",
    "type": "admin",
    "description": "Administrative office for General drawing office second floor.",
    "landmark": "Near campus pathway"
  },
  "technical_drawing_hall_second_floor": {
    "name": "Technical drawing hall second floor",
    "aliases": ["Technical drawing hall second floor"],
    "lat": 4.793798565985044,
    "lng": 6.978700161044459,
    "address": "Rivers State University Campus",
    "type": "facility",
    "description": "Specialized practical training laboratory: Technical drawing hall second floor.",
    "landmark": "Near campus pathway"
  },
  "dean_engineering_office_first_floor": {
    "name": "Dean engineering office first floor",
    "aliases": ["Dean engineering office first floor"],
    "lat": 4.794342120002166,
    "lng": 6.97960359454155,
    "address": "Rivers State University Campus",
    "type": "admin",
    "description": "Administrative office for Dean engineering office first floor.",
    "landmark": "Near campus pathway"
  },
  "engineering_dean_board_room_first_floor": {
    "name": "Engineering dean board room first floor",
    "aliases": ["Engineering dean board room first floor","Engineering"],
    "lat": 4.794342120002166,
    "lng": 6.979504185914993,
    "address": "Rivers State University Campus",
    "type": "admin",
    "description": "Administrative office for Engineering dean board room first floor.",
    "landmark": "Near campus pathway"
  },
  "associate_dean_engineering_first_floor": {
    "name": "Associate dean engineering first floor",
    "aliases": ["Associate dean engineering first floor"],
    "lat": 4.794342120002166,
    "lng": 6.979404777288437,
    "address": "Rivers State University Campus",
    "type": "admin",
    "description": "Administrative office for Associate dean engineering first floor.",
    "landmark": "Near campus pathway"
  },
  "library_and_information_center_second_floor": {
    "name": "Library and information center second floor",
    "aliases": ["Library and information center second floor"],
    "lat": 4.794342120002166,
    "lng": 6.979304033517837,
    "address": "Rivers State University Campus",
    "type": "library",
    "description": "Academic resource center: Library and information center second floor.",
    "landmark": "Near campus pathway"
  },
  "faculty_of_engineering_admin_office_first_floor": {
    "name": "Faculty of Engineering Admin office first floor",
    "aliases": ["Faculty of Engineering Admin office first floor","Engineering"],
    "lat": 4.794342120002166,
    "lng": 6.979203289747238,
    "address": "Rivers State University Campus",
    "type": "faculty",
    "description": "Academic block housing the Faculty of Engineering Admin office first floor.",
    "landmark": "Near campus pathway"
  }
};
