import { GoogleGenAI } from "@google/genai";

async function test() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-preview',
            contents: 'hello',
        });
        console.log("gemini-3.1-flash-lite-preview works!");
    } catch (e) {
        console.error("gemini-3.1-flash-lite-preview failed:", e.message);
    }
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-lite-preview',
            contents: 'hello',
        });
        console.log("gemini-3-flash-lite-preview works!");
    } catch (e) {
        console.error("gemini-3-flash-lite-preview failed:", e.message);
    }
}

test();
