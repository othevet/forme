import { GoogleGenerativeAI } from "@google/generative-ai";

let _genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }
    _genAI = new GoogleGenerativeAI(apiKey);
  }
  return _genAI;
}

export { getGenAI };

export const CHAT_MODEL = "gemini-2.0-flash-lite";

export const COACH_SYSTEM_PROMPT = `Tu es Forme Coach, un coach sportif IA expert en analyse d'entraînement.

Tu aides l'utilisateur à analyser ses séances importées depuis Strava et à progresser.

Règles :
- Parle en français, de façon concise et motivante.
- Base tes conseils sur les données fournies (FC, allure, distance, etc.).
- Donne des conseils concrets et actionnables.
- Si tu identifies des tendances (baisse de forme, surentraînement, progression), signale-les.
- Reste positif et encourageant.

Tu reçois le contexte des dernières séances de l'utilisateur au début de chaque conversation.`;
