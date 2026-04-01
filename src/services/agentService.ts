import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { RagService } from "./ragService";
import { GeminiResponse, CombatState, GeminiCombatResponse, ChapterPlan } from "../types";
import { SYSTEM_INSTRUCTION_INTERACTOR, SYSTEM_INSTRUCTION_COMBAT } from "../scenarioData";

/**
 * Agent Harness: Provides a controlled execution environment for AI agents.
 * Includes validation, retry logic, and structured logging.
 */
export class AgentHarness {
    private logger: (msg: string, data?: any) => void;
    private apiKey: string;

    constructor(apiKey: string, logger?: (msg: string, data?: any) => void) {
        this.apiKey = apiKey;
        this.logger = logger || ((msg, data) => console.log(`[Harness] ${msg}`, data || ""));
    }

    private getAiInstance(): GoogleGenAI {
        // Always pull from process.env.API_KEY if available to get the latest selected key
        const currentKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || this.apiKey;
        return new GoogleGenAI({ apiKey: currentKey });
    }

    /**
     * Executes a model call with strict schema validation and retry logic.
     */
    async execute<T>(params: {
        model: string;
        systemInstruction: string;
        prompt: string;
        schema: any;
        thinkingLevel?: ThinkingLevel;
        retries?: number;
    }): Promise<T> {
        let attempt = 0;
        const maxRetries = params.retries || 3;
        const ai = this.getAiInstance();

        while (attempt < maxRetries) {
            try {
                this.logger(`Executing ${params.model} (Attempt ${attempt + 1})`);
                
                const response = await ai.models.generateContent({
                    model: params.model,
                    contents: [{ parts: [{ text: params.prompt }] }],
                    config: {
                        systemInstruction: params.systemInstruction,
                        responseMimeType: "application/json",
                        responseSchema: params.schema,
                        thinkingConfig: params.thinkingLevel ? { thinkingLevel: params.thinkingLevel } : undefined,
                    },
                });

                const result = JSON.parse(response.text || "{}") as T;
                this.logger(`Success: ${params.model}`);
                return result;
            } catch (error) {
                attempt++;
                this.logger(`Error on attempt ${attempt}:`, error);
                if (attempt >= maxRetries) throw error;
                // Exponential backoff
                await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500));
            }
        }
        throw new Error("Max retries exceeded");
    }
}

/**
 * Specialized Agents
 */
export class NarrativeAgent {
    constructor(private harness: AgentHarness) {}

    async generateScene(prompt: string, context: string, schema: any): Promise<GeminiResponse> {
        return this.harness.execute<GeminiResponse>({
            model: "gemini-3.1-pro-preview",
            systemInstruction: SYSTEM_INSTRUCTION_INTERACTOR,
            prompt: `Lore Context: ${context}\n\nUser Action: ${prompt}`,
            schema,
            thinkingLevel: ThinkingLevel.HIGH,
        });
    }
}

export class CombatAgent {
    constructor(private harness: AgentHarness) {}

    async resolveTurn(state: CombatState, action: string, schema: any, context?: string): Promise<GeminiCombatResponse> {
        return this.harness.execute<GeminiCombatResponse>({
            model: "gemini-3.1-pro-preview",
            systemInstruction: SYSTEM_INSTRUCTION_COMBAT,
            prompt: `${context ? `Context: ${context}\n\n` : ''}Combat State: ${JSON.stringify(state)}\n\nAction: ${action}`,
            schema,
            thinkingLevel: ThinkingLevel.HIGH,
        });
    }
}

export class LoreAgent {
    constructor(private harness: AgentHarness, private rag: RagService) {}

    async enrichContext(query: string): Promise<string> {
        const lore = await this.rag.search(query);
        return lore.length > 0 ? `Relevant Lore Found:\n${lore.join("\n")}` : "No specific lore found.";
    }
}

/**
 * Agent Orchestrator: Coordinates multiple agents to fulfill a request.
 */
export class AgentOrchestrator {
    public narrative: NarrativeAgent;
    public combat: CombatAgent;
    public lore: LoreAgent;
    private harness: AgentHarness;

    constructor(apiKey: string, rag: RagService) {
        this.harness = new AgentHarness(apiKey);
        this.narrative = new NarrativeAgent(this.harness);
        this.combat = new CombatAgent(this.harness);
        this.lore = new LoreAgent(this.harness, rag);
    }

    /**
     * High-level orchestration for a game turn.
     */
    async processTurn(params: {
        action: string;
        gameState: any;
        isCombat: boolean;
        sceneSchema: any;
        combatSchema: any;
        context?: string;
    }) {
        // 1. Lore Enrichment (RAG)
        const loreContext = await this.lore.enrichContext(params.action);
        
        // Combine provided context with lore context
        const fullContext = params.context ? `${params.context}\n\n${loreContext}` : loreContext;
        
        // 2. Specialized Agent Execution
        if (params.isCombat) {
            return this.combat.resolveTurn(params.gameState.combat, params.action, params.combatSchema, fullContext);
        } else {
            return this.narrative.generateScene(params.action, fullContext, params.sceneSchema);
        }
    }
}
