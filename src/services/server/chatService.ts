import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `
You are the Rivers State University (RSU) Campus Navigator AI Assistant.
Your goal is to help students and visitors navigate the campus, find lecture halls, and manage their schedules.

CONSTRAINTS:
- Use coordinates and locations correctly.
- If a location is vague (e.g., "Senate"), ask for clarification (Old vs New).
- IMPORTANT: When providing directions, only provide the text-based turn-by-turn instructions. Do not mention map technicalities.
- If you find a place the user is looking for, ensure you help them "pinpoint" it by describing its location relative to landmarks.
- Keep responses helpful, concise, and focused on RSU campus.
- Remember users can click "Focus on Map" to see the location you've found.
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

  const prompt = `
    ${SYSTEM_PROMPT}

    CONTEXT:
    Phase: ${context.phase}
    Current distance to next point: ${context.distance}m
    Current step instruction: ${context.currentStep || 'None'}
    Is last step: ${context.isLastStep}
    User locations list available: ${locations.length} items.

    User says: "${message}"
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
}

export async function parseCampusIntent(message: string, locations: any[]) {
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

  const prompt = `
    Identify the user's intent for the RSU Campus Map.
    
    INTENT TYPES:
    1. 'navigate': User wants to go somewhere or asks where a place is.
    2. 'query': User is asking for information about a specific location.
    3. 'choice': User is choosing a mode (walk/cab).
    4. 'confirm': User arrived or says next.
    5. 'lost': User needs help.
    6. 'help': General help.
    7. 'unknown': Anything else.

    RSU CAMPUS LOCATIONS:
    ${JSON.stringify(locationContext)}

    OUTPUT JSON:
    {
      "type": "navigate" | "query" | "choice" | "confirm" | "lost" | "help" | "unknown",
      "destinationId": "building_id",
      "originId": "optional_origin_id",
      "isVague": boolean,
      "value": "walk" | "cab" | null
    }

    USER MESSAGE: "${message}"
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  const text = response.text || "{}";
  return JSON.parse(text);
}
