import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";

async function test() {
    const envFile = fs.readFileSync('.env', 'utf-8');
    const apiKeyMatch = envFile.match(/VITE_GEMINI_API_KEY=(.*)/);
    const apiKey = apiKeyMatch ? apiKeyMatch[1] : process.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
        console.error("No API key found in .env");
        return;
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const chapterPlanSchema = {
        type: Type.OBJECT,
        properties: {
            chapterTitle: { type: Type.STRING },
            overallGoal: { type: Type.STRING },
            plotPoints: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        objective: { type: Type.STRING },
                        details: { type: Type.STRING }
                    },
                    required: ["objective", "details"]
                }
            },
            locations: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        exits: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    direction: { type: Type.STRING },
                                    locationId: { type: Type.STRING }
                                },
                                required: ["direction", "locationId"]
                            }
                        }
                    },
                    required: ["id", "name", "description", "exits"]
                }
            }
        },
        required: ["chapterTitle", "overallGoal", "plotPoints", "locations"]
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: 'Create a chapter plan for a fantasy game.',
            config: {
                responseMimeType: "application/json",
                responseSchema: chapterPlanSchema,
            }
        });
        console.log("gemini-3.1-pro-preview works!", response.text);
    } catch (e) {
        console.error("gemini-3.1-pro-preview failed:", e.message);
    }
}

test();
