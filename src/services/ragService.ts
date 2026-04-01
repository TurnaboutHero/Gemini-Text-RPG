import { GoogleGenAI } from "@google/genai";

/**
 * RAG (Retrieval-Augmented Generation) Service
 * Provides semantic search capabilities for game lore and data.
 */
export class RagService {
    private apiKey: string;
    private loreIndex: { text: string; embedding: number[] }[] = [];
    private isInitialized: boolean = false;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private getAiInstance(): GoogleGenAI {
        const currentKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || this.apiKey;
        return new GoogleGenAI({ apiKey: currentKey });
    }

    /**
     * Initialize the lore index by embedding provided data.
     */
    async initialize(data: string[]) {
        if (this.isInitialized) return;
        const ai = this.getAiInstance();

        try {
            const model = "gemini-embedding-2-preview"; // Use latest embedding model
            
            // Batch embed the lore data
            const result = await ai.models.embedContent({
                model,
                contents: data.map(text => ({ parts: [{ text }] })),
            });

            this.loreIndex = data.map((text, i) => ({
                text,
                embedding: result.embeddings[i].values,
            }));

            this.isInitialized = true;
            console.log(`[RagService] Initialized with ${this.loreIndex.length} entries.`);
        } catch (error) {
            console.error("[RagService] Initialization failed:", error);
        }
    }

    /**
     * Search for the most relevant lore entries based on a query.
     */
    async search(query: string, topK: number = 3): Promise<string[]> {
        if (!this.isInitialized || this.loreIndex.length === 0) return [];
        const ai = this.getAiInstance();

        try {
            const model = "gemini-embedding-2-preview";
            const queryResult = await ai.models.embedContent({
                model,
                contents: [{ parts: [{ text: query }] }],
            });

            const queryEmbedding = queryResult.embeddings[0].values;

            // Calculate cosine similarity
            const results = this.loreIndex
                .map(entry => ({
                    text: entry.text,
                    similarity: this.cosineSimilarity(queryEmbedding, entry.embedding),
                }))
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, topK);

            return results.map(r => r.text);
        } catch (error) {
            console.error("[RagService] Search failed:", error);
            return [];
        }
    }

    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
