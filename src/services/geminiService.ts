import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { locations } from "../data/locations";
import { Location } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const searchCampusLocation: FunctionDeclaration = {
  name: "search_campus_location",
  description: "Search for a specific location, building, or faculty on the Rivers State University (RSU) campus.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "The name or type of location to search for (e.g., 'Law faculty', 'hostel', 'senate').",
      },
    },
    required: ["query"],
  },
};

export const getRouteInfo: FunctionDeclaration = {
  name: "get_route_info",
  description: "Get directions or routing information to a specific campus location.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      destination_name: {
        type: Type.STRING,
        description: "The name of the destination location.",
      },
      start_location_name: {
        type: Type.STRING,
        description: "Optional: The starting location name. If omitted, uses current location.",
      },
    },
    required: ["destination_name"],
  },
};

export const getCampusInfo: FunctionDeclaration = {
  name: "get_campus_info",
  description: "Get general information about RSU campus facilities, faculties, or services.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.STRING,
        description: "The category of interest (e.g., 'faculties', 'hostels', 'libraries', 'food').",
      },
    },
  },
};

export async function processAIChat(
  message: string, 
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  callbacks: {
    onSearch: (loc: Location) => void;
    onRoute: (dest: Location, start?: Location) => void;
  }
) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: `You are the RSU Campus Navigator AI. You help students and visitors find their way around Rivers State University. 
        You can search for locations, provide directions, and give information about campus facilities.
        When asked for directions, identify the destination.
        Be helpful, polite, and use campus-specific knowledge. 
        If the user asks for something not related to the campus, politely steer them back.
        Campus data summary: ${locations.length} locations identified across categories like faculty, hostel, admin, etc.`,
        tools: [{ functionDeclarations: [searchCampusLocation, getRouteInfo, getCampusInfo] }],
      },
    });

    const calls = response.functionCalls;
    if (calls && calls.length > 0) {
      for (const call of calls) {
        if (call.name === "search_campus_location") {
          const { query } = call.args as { query: string };
          const found = locations.find(l => 
            l.officialName.toLowerCase().includes(query.toLowerCase()) || 
            l.aliases.some(a => a.toLowerCase().includes(query.toLowerCase()))
          );
          if (found) {
            callbacks.onSearch(found);
            return `I've found ${found.officialName} on the map for you. It's located in the ${found.address}. Would you like directions there?`;
          } else {
            return `I couldn't find a specific location matching "${query}". Could you be more specific?`;
          }
        }

        if (call.name === "get_route_info") {
          const { destination_name, start_location_name } = call.args as { destination_name: string; start_location_name?: string };
          const dest = locations.find(l => l.officialName.toLowerCase().includes(destination_name.toLowerCase()));
          const start = start_location_name ? locations.find(l => l.officialName.toLowerCase().includes(start_location_name.toLowerCase())) : undefined;
          
          if (dest) {
            callbacks.onRoute(dest, start);
            return `Sure! I'm setting up a route to ${dest.officialName}${start ? ` starting from ${start.officialName}` : ''}. You can see the turn-by-turn directions on your screen now.`;
          } else {
            return `I couldn't find the destination "${destination_name}" to give you directions.`;
          }
        }

        if (call.name === "get_campus_info") {
          const { category } = call.args as { category?: string };
          const filtered = category ? locations.filter(l => l.type === category.toLowerCase()) : [];
          if (filtered.length > 0) {
            return `RSU has several ${category}: ${filtered.slice(0, 5).map(l => l.officialName).join(', ')}${filtered.length > 5 ? ' and more' : ''}. Which one are you looking for?`;
          }
        }
      }
    }

    return response.text || "I'm here to help you navigate RSU campus. What can I help you find today?";
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "I'm sorry, I encountered an error while processing your request. Please try again or use the search bar.";
  }
}
