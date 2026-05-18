import { GoogleGenAI, Type } from "@google/genai";

const timetableSchema = {
  description: "Structure of the extracted school timetable",
  type: Type.OBJECT,
  properties: {
    faculty: { type: Type.STRING },
    department: { type: Type.STRING },
    level: { type: Type.STRING },
    semester: { type: Type.STRING },
    slots: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          courseCode: { type: Type.STRING },
          courseTitle: { type: Type.STRING },
          lecturer: { type: Type.STRING },
          day: { 
            type: Type.STRING, 
            enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] 
          },
          startTime: { type: Type.STRING, description: "e.g. 08:00" },
          endTime: { type: Type.STRING, description: "e.g. 10:00" },
          venue: { type: Type.STRING }
        },
        required: ["courseCode", "day", "startTime", "endTime"]
      }
    }
  },
  required: ["slots"]
};

export async function parseTimetable(fileBuffer: Buffer, mimeType: string) {
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

  const prompt = `Extract all lecture information from this school timetable. 
  Map abbreviations to full names if possible. 
  Ensure day is one of the enum values. 
  Format times as HH:mm.`;

  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        inlineData: {
          data: fileBuffer.toString("base64"),
          mimeType
        }
      },
      prompt
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: timetableSchema
    }
  });

  return JSON.parse(result.text || "{}");
}
