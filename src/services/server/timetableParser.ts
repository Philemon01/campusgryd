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

  const prompt = `Extract all lecture information from this school timetable image or PDF.
  
  CONTEXT: This is for Rivers State University (RSU).
  
  DATA TO EXTRACT:
  1. Course Code (e.g., GNS101, MTH101)
  2. Course Title (Full name if available)
  3. Lecturer Name
  4. Day of the week
  5. Start Time (HH:mm, 24-hour format)
  6. End Time (HH:mm, 24-hour format)
  7. Venue/Location (e.g., LT1, Engineering Block, New Science Building)
  
  ENUMS:
  Day must be exactly one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.
  
  OUTPUT: A JSON object matching the provided schema. 
  If a field is missing, provide an empty string or null as per schema.
  Be precise and thorough. Include EVERY class found.`;

  let result;
  try {
    console.log(`Phase: AI Vision parsing started for ${mimeType}`);
    result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: fileBuffer.toString("base64"),
              mimeType
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: timetableSchema
      }
    });
  } catch (err: any) {
    console.error("Gemini API direct error:", err);
    throw new Error(`AI Service Error: ${err.message || 'The AI model could not process this request. This might be due to model availability or file issues.'}`);
  }

  const responseText = result.text;
  console.log("Gemini Response Text Length:", responseText?.length);
  console.log("Gemini Response Text Sample:", responseText?.substring(0, 100));
  
  if (!responseText) {
    console.error("Gemini returned an empty response. Full result:", JSON.stringify(result));
    throw new Error("The AI returned an empty response. Please ensure the image is bright and the text is legible.");
  }

  try {
    // Robustly extract JSON from potential conversational wrapping
    let jsonStr = responseText.trim();
    
    // If it's wrapped in markdown code blocks, extract the content
    const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      jsonStr = match[1];
    } else {
      // Fallback: search for first { and last }
      const start = jsonStr.indexOf('{');
      const end = jsonStr.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        jsonStr = jsonStr.substring(start, end + 1);
      }
    }

    const parsed = JSON.parse(jsonStr);
    console.log("Parsed Slots Count:", parsed.slots?.length);
    return parsed;
  } catch (e) {
    console.error("Failed to parse JSON from model. Raw text:", responseText);
    throw new Error("The AI returned a response that couldn't be correctly parsed as a timetable. Please try again with a clearer image or manually enter the data.");
  }
}
