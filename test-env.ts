import { GoogleGenAI } from "@google/genai";
import fs from "fs";

async function test() {
    // Read .env file manually
    const envFile = fs.readFileSync('.env', 'utf-8');
    const apiKeyMatch = envFile.match(/VITE_GEMINI_API_KEY=(.*)/);
    const apiKey = apiKeyMatch ? apiKeyMatch[1] : process.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
        console.error("No API key found in .env");
        return;
    }

    const ai = new GoogleGenAI({ apiKey });
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: 'hello',
        });
        console.log("gemini-3.1-pro-preview works!");
    } catch (e) {
        console.error("gemini-3.1-pro-preview failed:", e.message);
    }
    
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
