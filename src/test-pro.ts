import { GoogleGenAI } from "@google/genai";

async function test() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: 'hello',
        });
        console.log("gemini-3.1-pro-preview works!");
    } catch (e) {
        console.error("gemini-3.1-pro-preview failed:", e.message);
    }
}

test();
