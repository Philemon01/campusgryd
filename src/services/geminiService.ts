import { GoogleGenAI } from "@google/genai";
import { Location } from "../types";

export interface ChatIntent {
  type: 'navigate' | 'query' | 'help' | 'lost' | 'choice' | 'confirm' | 'unknown';
  destinationId?: string;
  originId?: string;
  query?: string;
  isVague?: boolean;
  value?: string; // For selection values like 'walk' or 'cab'
}

export class GeminiChatService {
  private locations: Location[];

  constructor(locations: Location[]) {
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
      Your task is to parse user messages into structured navigation intents.

      INTENT TYPES:
      1. 'navigate': User wants to go somewhere (e.g., "take me to [dest]").
      2. 'choice': User is choosing a mode (e.g., "I'll walk", "Walking", "Cab", "Option 2").
      3. 'confirm': User arrived at a checkpoint or says next (e.g., "Next", "I'm here", "Arrived").
      4. 'lost': User is lost or needs recalculation.
      5. 'help': General help request.
      6. 'unknown': Anything else.

      RSU CAMPUS LOCATIONS:
      ${JSON.stringify(locationContext)}

      OUTPUT FORMAT:
      Return ONLY a JSON object:
      {
        "type": "navigate" | "choice" | "confirm" | "lost" | "help" | "unknown",
        "destinationId": "building_id_here",
        "originId": "optional_building_id_if_specified",
        "query": "cleaned query string",
        "isVague": true | false,
        "value": "walk" | "cab" | null
      }

      STRICT RULES:
      - For "Senate", it is ALWAYS vague (Old vs New).
      - Recognise "Next", "Continue", "I have arrived" as 'confirm'.
      - Recognise mode choices as 'choice' and set 'value' to "walk" or "cab".

      USER MESSAGE: "${message}"
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const text = response.text;
      if (!text) return { type: 'unknown' };
      
      const cleaned = text.replace(/```json|```/g, '').trim();
      try {
        return JSON.parse(cleaned) as ChatIntent;
      } catch (parseError) {
        console.error("JSON parse error:", cleaned);
        return { type: 'unknown' };
      }
    } catch (error: any) {
      console.error("Intent parsing error:", error);
      return { type: 'unknown' };
    }
  }

  async generateResponse(
    intent: ChatIntent, 
    context: { 
      extraInfo?: string, 
      distance?: number, 
      currentStep?: string, 
      isLastStep?: boolean,
      phase: 'clarification' | 'selection' | 'guidance' | 'completion' | 'idle'
    }
  ): Promise<string> {
    const ai = this.getAi();
    if (!ai) return "I'm a local guide for RSU. How can I help you find your way?";

    let prompt = "";
    const { phase, distance, currentStep, isLastStep } = context;

    if (phase === 'clarification') {
      prompt = `The user's destination or start is vague. 
      Politely ask for clarification (e.g., "Do you mean Old Senate or New Senate?") and ask where they are starting from. 
      Tone: Helpful campus expert.`;
    } else if (phase === 'selection') {
      prompt = `Locations are clear. Distance: ${distance}m. 
      Present EXACTLY these two options as buttons in your text:
      [🚶♂️ Walk] or [🚖 Cab/Shuttle]
      Briefly explain which is better (e.g., "It's just a short stroll" or "It's quite a distance, maybe take a shuttle").`;
    } else if (phase === 'guidance') {
      prompt = `Phase: Guidance. 
      The current step instruction: "${currentStep}".
      
      STRICT RULES:
      - Use **bolding** for landmarks and paths.
      - Add a visual cue (e.g., "Look for the giant clock", "Opposite the bank").
      - End with: "Reply with 'Next' or 'I have arrived' when you get there."
      Keep it short. Do not give the next step yet.`;
    } else if (phase === 'completion') {
      prompt = `The user has arrived at their destination. 
      Congratulate them and wish them a productive stay at RSU!
      Keep it brief and friendly.`;
    } else {
      prompt = `The user said: "${context.extraInfo}". 
      Respond as the RSU Campus Navigator. If they are asking for a place, provide a brief description.
      Always encourage them to use the navigation if they are looking for a building.`;
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return (response.text || "I'm here to help you navigate RSU!").trim();
    } catch (error: any) {
      return `I'm here to help you navigate RSU!`;
    }
  }
}
