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
    const key = (typeof process !== "undefined" && process?.env?.GEMINI_API_KEY) ||
                (import.meta.env?.VITE_GEMINI_API_KEY) ||
                (import.meta.env?.GEMINI_API_KEY);
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

  async parseIntent(message: string, timetable?: any[], events?: any[]): Promise<ChatIntent> {
    try {
      const response = await fetch('/api/chat/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, locations: this.locations, timetable, events }),
      });
      
      const contentType = response.headers.get("content-type");
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!contentType || !contentType.includes("application/json")) {
        console.error("Non-JSON response from /api/chat/intent:", responseText.substring(0, 50));
        return { type: 'unknown' };
      }

      return JSON.parse(responseText);
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
      phase: 'clarification' | 'selection' | 'guidance' | 'completion' | 'idle',
      timetable?: any[],
      events?: any[]
    }
  ): Promise<string> {
    try {
      const response = await fetch('/api/chat/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: context.extraInfo || intent.query || "", 
          context, 
          locations: this.locations 
        }),
      });
      
      const contentType = response.headers.get("content-type");
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!contentType || !contentType.includes("application/json")) {
        console.error("Non-JSON response from /api/chat/response:", responseText.substring(0, 50));
        return "I'm here to help you navigate RSU!";
      }

      const data = JSON.parse(responseText);
      return data.text || "I'm here to help you navigate RSU!";
    } catch (error: any) {
      console.error("Chat error:", error);
      return "I'm a local guide for RSU. How can I help you find your way?";
    }
  }
}
