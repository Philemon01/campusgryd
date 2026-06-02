import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `
You are the Rivers State University (RSU) CampusGryd AI Assistant (called "Navi-Bot"), located in Port Harcourt, Nigeria.
Your goal is to help students, staff, and visitors navigate the university terrain, find lecture halls/faculties, check their classes, and find campus events.

PERSONALITY & TONE:
- Professional, welcoming, intelligent, and deeply familiar with Rivers State University.
- Always use precise campus landmarks and local insights to make directions clear.
- Be proactive! If the student mentions a course on their schedule or asks about events, help them find where it meets and describe the route.

CONSTRAINTS & RESPONDING GUIDELINES:
1. LOCATION MATCHING: If the user is asking about a specific place or facility (e.g., Old Senate, New Senate/Wike building, RISI Water, Our Lady Seat of Wisdom Catholic Church, PG School, Library, Convocation Arena), explain where it is relative to landmarks. Mention that they can click the "Focus on Map" button to highlight it on the map.
2. TEXT-BASED DIRECTIONS ONLY: When providing directions, output the text-based turn-by-turn instructions in a clean markdown format. Do not reference raw OSRM nodes or geographic coordinates in the final markdown.
3. IN-DEPTH NAVIGATION STAGES:
   - If the phase is "idle" and the user is searching for a location, suggest navigating there or focusing on the map.
   - If the phase is "clarification", gently request confirmation on which building they mean (e.g., "Old Senate" vs. "New Senate Building").
   - If the phase is "selection", recommend they choose between "Walk" (🚶) or "Cab" (🚖) using the quick-action pills.
   - If the phase is "guidance", encourage them as they proceed through steps, and outline their next maneuver clearly.
4. CALENDAR & SCHEDULE SAVVY: 
   - When answering questions about their classes (user's synced timetable) or active campus events, refer strictly to the lists provided in the context below. 
   - Proactively map course codes to locations (e.g., Engineering lecture halls, PG School, old/new senate, etc.) and suggest navigating thither.
5. KEEP IT CLEAN: Format all outputs using beautiful, modern, scannable Markdown (bold titles, clean list bullets). Never output raw JSON in your text responses.
`;

export async function handleCampusChat(message: string, context: any, locations: any[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

  const ai = new GoogleGenAI({ 
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Simplify locations list for prompt optimization
  const locationsContext = locations.map(l => ({
    id: l.id,
    name: l.officialName,
    landmark: l.landmark,
    description: l.description,
    type: l.type
  }));

  const prompt = `
    ${SYSTEM_PROMPT}

    CONTEXT:
    Current Navigation Phase: ${context.phase}
    Current distance to destination: ${context.distance ? context.distance + ' meters' : 'N/A'}
    Current step instruction: ${context.currentStep || 'None'}
    Is on last step of directions: ${context.isLastStep || false}
    
    USER SYNCED TIMETABLE SLOTS:
    ${JSON.stringify(context.timetable || [])}

    ACTIVE CAMPUS EVENTS:
    ${JSON.stringify(context.events || [])}

    RSU CAMPUS LOCATIONS REFERENCE:
    ${JSON.stringify(locationsContext)}

    User says: "${message}"
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
  });

  return response.text;
}

export async function parseCampusIntent(
  message: string, 
  locations: any[], 
  timetable?: any[], 
  events?: any[]
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

  const ai = new GoogleGenAI({ 
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const locationContext = locations.map(loc => ({
    id: loc.id,
    name: loc.officialName,
    aliases: loc.aliases,
    landmark: loc.landmark
  }));

  const timetableContext = (timetable || []).map(slot => ({
    courseCode: slot.courseCode,
    courseTitle: slot.courseTitle,
    venue: slot.venue,
    locationId: slot.locationId
  }));

  const eventsContext = (events || []).map(evt => ({
    id: evt.id,
    title: evt.title,
    locationId: evt.locationId
  }));

  const prompt = `
    Identify the user's intent, destination, and choice for the RSU Campus Navigator.
    
    INTENT TYPES:
    1. 'navigate': User explicitly wants walking/cab directions, navigation paths, or to go to a location/course/event.
    2. 'query': User simply asks where a place is, queries class timings, asks what classes or events they have, or seeks general campus information.
    3. 'choice': User is choosing walk vs. cab/shuttle.
    4. 'confirm': User says next, confirms they have arrived, says ok, etc.
    5. 'lost': User says they are lost or need to recalculate.
    6. 'help': User asks what Navi-Bot is or requests assistance list.
    7. 'unknown': General greeting, unrelated chit-chat, or fallback.

    RSU CAMPUS LOCATIONS:
    ${JSON.stringify(locationContext)}

    USER TIMETABLE CONTEXT:
    ${JSON.stringify(timetableContext)}

    ACTIVE CAMPUS EVENTS:
    ${JSON.stringify(eventsContext)}

    DECISION RULES:
    - If the user specifies a course code or course name (e.g. "CHM 101", "Chemistry class"), find the matching venue's locationId from the timetable context and set destinationId to that locationId.
    - If the user specifies or implies a campus event (e.g. "Football finals", "Matriculation"), find the matching locationId from the events context and set destinationId to that locationId.
    - If the user names a landmark or abbreviation (e.g. "Wike building", "Risi water", "Catholic Church", "Chapel"), resolve it to its correct location ID.
    - If the destination is ambiguous (e.g., "Senate" could be Old Senate or New Senate), set isVague to true and destinationId to one of them.

    Output must follow strictly this JSON structure:
    {
      "type": "navigate" | "query" | "choice" | "confirm" | "lost" | "help" | "unknown",
      "destinationId": "building_id" | null,
      "originId": "optional_origin_id" | null,
      "isVague": boolean,
      "value": "walk" | "cab" | null
    }

    USER MESSAGE: "${message}"
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  const text = response.text || "{}";
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse intent JSON response:", text);
    return { type: "unknown", destinationId: null, originId: null, isVague: false, value: null };
  }
}
