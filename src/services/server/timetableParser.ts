import { GoogleGenAI, Type } from "@google/genai";

const timetableSchema = {
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

  const prompt = `You are an expert OCR and data extraction assistant designed to extract university lecture schedules from uploaded images. 

Your task is to analyze the provided image of a timetable and extract the schedule into a highly organized, clean JSON array. 

Rules for extraction:
1. Ensure venues match local campus naming conventions found in the image.
2. If multiple courses are listed in one cell or time slot, create separate objects in the "schedule" array for each course.
3. If an entry is blurry or missing a venue, use "Unknown" for that specific field instead of skipping the entry entirely.
4. Do not include markdown code blocks or conversational text in your response. Return ONLY raw JSON data matching the requested schema.`;

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
    console.log("Parsed Schedule Count:", parsed.schedule?.length);
    return parsed;
  } catch (e) {
    console.error("Failed to parse JSON from model. Raw text:", responseText);
    throw new Error("The AI returned a response that couldn't be correctly parsed as a timetable. Please try again with a clearer image or manually enter the data.");
  }
}
