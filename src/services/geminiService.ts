import { GoogleGenAI } from "@google/genai";
import { Location } from "../types";

export interface ChatIntent {
  type: 'navigate' | 'query' | 'help' | 'lost' | 'unknown';
  destinationId?: string;
  originId?: string;
  query?: string;
  isVague?: boolean;
}

export class GeminiChatService {
  private ai: GoogleGenAI | null = null;
  private locations: Location[];

  constructor(locations: Location[]) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'undefined' && key !== '') {
      try {
        this.ai = new GoogleGenAI({ apiKey: key });
      } catch (error) {
        console.error("Gemini init error:", error);
      }
    }
    this.locations = locations;
  }

  private getAi(): GoogleGenAI | null {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'undefined' || key === '') {
      console.warn("GEMINI_API_KEY is missing");
      return null;
    }
    try {
      return new GoogleGenAI({ apiKey: key });
    } catch (error) {
      console.error("Gemini context creation failed:", error);
      return null;
    }
  }

  async parseIntent(message: string): Promise<ChatIntent> {
    const ai = this.getAi();
    if (!ai) return { type: 'unknown' };

    const locationContext = this.locations.map(loc => ({
      id: loc.id,
      name: loc.officialName,
      aliases: loc.aliases,
      landmark: loc.landmark
    }));

    const prompt = `
      You are the Rivers State University (RSU) Campus Navigator AI Assistant.
      Your task is to parse user messages into structured navigation intents using the provided coordinates reference.
      
      INTENT TYPES:
      1. 'navigate': User wants to go somewhere. Can be "take me to [dest]" or "how do I get from [origin] to [dest]".
      2. 'lost': User is lost, took a wrong turn, or needs recalculation.
      3. 'help': General help request about using the app.
      4. 'query': Information about a specific building or facility.
      5. 'unknown': Anything else.

      RSU CAMPUS LOCATIONS:
      ${JSON.stringify(locationContext)}

      OUTPUT FORMAT:
      Return ONLY a JSON object:
      {
        "type": "navigate" | "lost" | "help" | "query" | "unknown",
        "destinationId": "building_id_here",
        "originId": "optional_building_id_if_specified",
        "query": "original message or cleaned query",
        "isVague": true | false
      }

      STRICT RULES FOR PARSING:
      - Map building names or departments (e.g. "Pharmacy", "Law", "Senate") to the correct 'id' from the locations list.
      - If the user uses a vague location (e.g., just "Senate"), set "isVague": true and do not provide a "destinationId" unless you are 100% sure. 
      - Specifically for "Senate", it is ALWAYS vague because we have "Old Senate" and "New Senate".
      - Be precise with IDs.

      USER MESSAGE: "${message}"
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const text = response.text;
      if (!text) {
        console.warn("No text in Gemini response for intent parsing");
        return { type: 'unknown' };
      }
      
      const cleaned = text.replace(/```json|```/g, '').trim();
      try {
        return JSON.parse(cleaned) as ChatIntent;
      } catch (parseError) {
        console.error("JSON parse error on Gemini output:", cleaned);
        return { type: 'unknown' };
      }
    } catch (error: any) {
      console.error("Intent parsing error:", error);
      return { type: 'unknown' };
    }
  }

  async generateResponse(intent: ChatIntent, extraInfo?: string): Promise<string> {
    const ai = this.getAi();
    if (!ai) {
      console.warn("Gemini AI instance not available for generateResponse");
      return "I'm having trouble connecting right now. I'm a local guide for RSU. Where would you like to go?";
    }

    let prompt = "";
    if (intent.isVague) {
      prompt = `The user asked to go to/find a place but was vague (e.g., they said "Senate"). 
      As the RSU Campus Navigator, you MUST:
      1. CLARIFY AMBIGUITY: Ask if they mean "Old Senate" or "New Senate" (or any other similar pairs).
      2. Ask for their starting location so you can help them better.
      Keep it helpful and conversational.`;
    } else if (intent.type === 'navigate') {
      const dest = this.locations.find(l => l.id === intent.destinationId);
      const origin = this.locations.find(l => l.id === intent.originId);
      
      if (dest) {
        prompt = `The user wants to navigate to ${dest.officialName}${origin ? ` starting from ${origin.officialName}` : ''}.
        Destination Details: ${dest.description}.
        Nearby Landmarks: ${dest.landmark}.
        
        STRICT RULES FOR YOUR RESPONSE:
        1. MODE RECOMMENDATION: Suggest "Walking" if you think it's close (< 500m), otherwise suggest "Cab/Shuttle" if it's far or they seem in a hurry.
        2. VISUAL LANDMARKS: Use landmarks like "${dest.landmark}" or mention being "opposite/past" things. 
        3. TONE: Helpful, conversational, and highly familiar with RSU geography.
        
        The navigation has been updated on their map. Tell them you've mapped out the route.`;
      } else {
        prompt = `The user wants to go somewhere but I couldn't find the exact building. Ask for clarification or suggest they look at the Faculty list in the sidebar.`;
      }
    } else if (intent.type === 'lost') {
      prompt = `The user said they are lost. I am pinging their GPS and recalculating from their current position.
      Say something reassuring like: "Don't worry, even the seniors get turned around sometimes! I've updated your route from exactly where you are standing."`;
    } else if (intent.type === 'help') {
      prompt = `Explain that you are the RSU Campus Navigator. You can help them find any faculty, library, or landmark. Suggest they try "Take me to Law faculty" or "Where is the Catholic Church?".`;
    } else {
      prompt = `The user said: "${extraInfo}". Respond as a friendly RSU Campus guide. If they are asking for a place, provide a brief description if you know it, or tell them to check the navigation list.`;
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return (response.text || "I'm here to help you navigate RSU!").trim();
    } catch (error: any) {
      console.error("Response generation error:", error);
      return `I'm here to help you navigate RSU! (Error: ${error.message || 'Unknown'})`;
    }
  }
}
