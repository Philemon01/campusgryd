import { GoogleGenAI, Type } from "@google/genai";

/**
 * SECURITY WARNING:
 * Running Gemini API processing directly in the user's browser (client-side)
 * exposes your API key to the client (inspectable in network logs and bundle source).
 * Make sure that process.env.NEXT_PUBLIC_GEMINI_API_KEY is restricted, or utilize
 * a backend proxy route for production environments to keep secrets safe.
 */

export const timetableSchema = {
  description: "Structure of the extracted university lecture schedule",
  type: Type.OBJECT,
  properties: {
    title: { 
      type: Type.STRING, 
      description: "A descriptive title based on the timetable headers, e.g., Department, Year, or Faculty if visible" 
    },
    schedule: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { 
            type: Type.STRING, 
            description: "Monday, Tuesday, Wednesday, Thursday, or Friday" 
          },
          time: { 
            type: Type.STRING, 
            description: "The time slot, formatted clearly as HH:MM - HH:MM" 
          },
          course: { 
            type: Type.STRING, 
            description: "The course code or course title, e.g., PHY 201" 
          },
          venue: { 
            type: Type.STRING, 
            description: "The lecture hall, classroom, or lab location where the class is held" 
          }
        },
        required: ["day", "time", "course", "venue"]
      }
    }
  },
  required: ["title", "schedule"]
};

/**
 * Robustly reads a browser File object as a Base64 string payload
 * alongside its MIME type.
 */
export function fileToBase64(file: File): Promise<{ base64Data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Result is in form "data:image/png;base64,....."
      // We extract only the base64 part
      const commaIndex = result.indexOf(",");
      if (commaIndex === -1) {
        reject(new Error("Failed to parse base64 data url from file"));
        return;
      }
      const base64Data = result.substring(commaIndex + 1);
      resolve({
        base64Data,
        mimeType: file.type
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Client-side parser function that instantiates the new modular SDK code
 * and invokes gemini-2.5-flash with a structured OCR/Extraction prompt.
 */
export async function parseTimetableOnClient(file: File): Promise<any> {
  // Pull dynamic key prioritizing NEXT_PUBLIC_GEMINI_API_KEY as per Next.js requirements.
  // Vite alternative check is also embedded for runtime safety in multi-target templates.
  const apiKey = (typeof process !== "undefined" && process?.env?.NEXT_PUBLIC_GEMINI_API_KEY) || 
                 (import.meta.env?.NEXT_PUBLIC_GEMINI_API_KEY) ||
                 (import.meta.env?.VITE_GEMINI_API_KEY);

  if (!apiKey) {
    throw new Error(
      "NEXT_PUBLIC_GEMINI_API_KEY environment variable is not defined. Please verify your client-side environment configuration."
    );
  }

  // Initialize the SDK with appropriate http options for telemetries
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  const prompt = `You are an expert OCR and data extraction assistant designed to extract university lecture schedules from uploaded images. 

Your task is to analyze the provided image of a timetable and extract the schedule into a highly organized, clean JSON array. 

Rules for extraction:
1. Ensure venues match local campus naming conventions found in the image.
2. If multiple courses are listed in one cell or time slot, create separate objects in the "schedule" array for each course.
3. If an entry is blurry or missing a venue, use "Unknown" for that specific field instead of skipping the entry entirely.
4. Do not include markdown code blocks or conversational text in your response. Return ONLY raw JSON data matching the requested schema.`;

  const { base64Data, mimeType } = await fileToBase64(file);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: prompt },
        {
          inlineData: {
            data: base64Data,
            mimeType
          }
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: timetableSchema
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Received an empty response from Gemini Parser.");
    }

    // Clean markdown wrapping if present
    let jsonStr = responseText.trim();
    const markdownMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch) {
      jsonStr = markdownMatch[1];
    } else {
      const braceStart = jsonStr.indexOf("{");
      const braceEnd = jsonStr.lastIndexOf("}");
      if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
        jsonStr = jsonStr.substring(braceStart, braceEnd + 1);
      }
    }

    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("Client Parse error:", error);
    throw new Error(`Client-side AI extraction failed: ${error.message || error}`);
  }
}
