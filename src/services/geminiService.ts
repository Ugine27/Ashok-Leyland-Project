import { GoogleGenAI } from "@google/genai";
import { FailureReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function extractReportsFromText(text: string): Promise<FailureReport[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured. Please add GEMINI_API_KEY to your environment.");
  }

  const prompt = `
    Extract ALL failure analysis reports from the following text and return them as a JSON array of FailureReport objects.
    The text might contain multiple reports. Be thorough and capture every single one.
    
    The FailureReport object must follow this structure exactly:
    {
      "reportId": "string (SKU-ID from text)",
      "componentName": "string (MUST be one of: Bolt, Nut, Crankshaft, Piston, Sheet Metal, Engine Block, Connecting Rod)",
      "manufacturer": "string",
      "customer": "string",
      "date": "string (YYYY-MM-DD)",
      "metSpec": boolean,
      "failureCategory": "string (MUST be one of: Fatigue, Wear, Corrosion, Manufacturing Defect, None)",
      "failureAnalysis": "string",
      "observed": {
        "hardnessCore": "string",
        "hardnessCase": "string",
        "caseDepth": "string",
        "microstructure": "string",
        "composition": "string"
      },
      "spec": {
        "hardnessCore": "string",
        "hardnessCase": "string",
        "caseDepth": "string",
        "microstructure": "string",
        "composition": "string"
      }
    }

    Text content to extract from:
    """
    ${text}
    """

    Return ONLY the JSON array. If no reports are found, return an empty array [].
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("AI_NULL_RESPONSE: The AI service returned an empty response. The document might be too large or contain unreadable sections.");
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(jsonText);
    } catch (e) {
      throw new Error("JSON_PARSE_ERROR: The AI generated an invalid data format. Please try re-uploading the document.");
    }
    
    const reports = Array.isArray(parsedData) ? parsedData : (parsedData.reports || []);
    
    if (reports.length === 0) {
      throw new Error("EMPTY_RESULT: No failure reports found in the document text. Ensure the file contains recognizable data profiles.");
    }
    
    return reports;
  } catch (error: any) {
    console.error("Gemini Extraction Error:", error);
    
    if (error.message?.includes("API_KEY")) {
      throw new Error("AUTH_ERROR: Invalid or missing Gemini API Key. Check your workspace environment variables.");
    }
    
    if (error.message?.includes("fetch") || error.message?.includes("network")) {
      throw new Error("CONNECTION_ERROR: Failed to reach AI service. Please check your network connection and try again.");
    }

    if (error.message?.includes("limit") || error.message?.includes("quota")) {
      throw new Error("QUOTA_ERROR: AI service rate limit exceeded. Please wait a moment and try again.");
    }

    throw error;
  }
}
