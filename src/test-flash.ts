import { GoogleGenAI } from "@google/genai";

async function test() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: 'hello',
        });
        console.log("gemini-3-flash-preview works!");
    } catch (e) {
        console.error("gemini-3-flash-preview failed:", e.message);
    }
}

test();
