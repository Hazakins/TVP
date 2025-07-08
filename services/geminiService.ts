

import { GoogleGenAI } from "@google/genai";
import { Player, Schedule } from "../types.ts";

let ai: GoogleGenAI | null = null;
const model = "gemini-2.5-flash";

/**
 * Initializes and returns the GoogleGenAI client instance.
 * It assumes the API key is available in the `process.env.API_KEY` environment variable.
 */
const getAiClient = (): GoogleGenAI => {
  if (!ai) {
    // The GoogleGenAI constructor will throw an error if the API key is missing.
    // This is handled by the calling functions.
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

const generateText = async (prompt: string): Promise<string> => {
  try {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (e) {
    console.error("Error in generateText:", e);
    // Re-throw the error to be handled by the calling component
    throw e;
  }
};

const generateJson = async (prompt: string): Promise<any> => {
  try {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    let jsonStr = response.text.trim();
    // A more robust regex to handle potential markdown and leading/trailing whitespace
    const fenceRegex = /^```(?:json)?\s*(.*)\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match) {
      jsonStr = match[1].trim();
    }

    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse JSON response:", jsonStr, "Original text:", response.text);
      throw new Error("The AI returned an invalid JSON response. Please try again.");
    }
  } catch(e) {
      console.error("Error in generateJson:", e);
      // Re-throw the error to be handled by the calling component
      throw e;
  }
};

export const generateRoundOneMatches = async (players: Player[], rules: string, eventType: 'individual' | 'pairs'): Promise<any> => {
  const pairInstructions = eventType === 'pairs'
    ? `
    **Event Type:** Pre-defined Pairs.
    **IMPORTANT:** The 'teamId' on each player indicates their partner. You MUST keep these pairs together for all matches. Your task is to create matchups BETWEEN these teams.`
    : `
    **Event Type:** Individual Players.
    **Your Task:** First, form two-player teams based on the rules (e.g., using seeding, random pairing).`;

  const prompt = `
    You are a pickleball event director. Your task is to generate the matches for Round 1 based on a list of players and a set of rules.

    ${pairInstructions}

    **Rules:**
    ${rules}

    **Players:**
    (Note: The 'skillLevel' property represents the player's seed. A skillLevel of 999 indicates the player is unseeded and should be placed after all seeded players.)
    ${JSON.stringify(players, null, 2)}

    **Your Task Details:**
    1.  **Create Pods:** Group the teams (either pre-defined or newly formed) into "pods" and assign each pod to a unique court number. The structure of the pods is critical.
        - Analyze the rules to determine the intended format on each court (e.g., a rule like "3 games per round" implies a 3-team round-robin pod on each court, which results in exactly 3 matches).
        - Divide the total number of teams as evenly as possible among the courts to create pods of similar size. Your goal is balanced competition. For example, with 7 teams, creating pods of sizes [3, 2, 2] is more balanced than [4, 3]. Try to keep the number of teams per pod as consistent as possible.
    2.  **Generate Matches for Pods:** For each pod on each court, generate all the necessary match objects.
        - For a round-robin pod, this means every team in the pod plays every other team in the pod exactly once.
        - All matches for a single pod must share the same \`court\` number.
    3.  **Assign IDs:** Each match object must have a unique ID (e.g., "m1", "m2", ...).

    **Output Format:**
    Respond ONLY with a valid JSON array of match objects. Do not include any other text, explanation, or markdown.
    Each object in the array should have the following structure:
    {
      "id": "string",
      "court": "number",
      "teamA": ["player_id_1", "player_id_2"],
      "teamB": ["player_id_3", "player_id_4"]
    }
  `;
  return generateJson(prompt);
};

export const generateNextRoundMatches = async (previousRoundResults: any, rules: string, players: Player[], nextRoundNumber: number, eventType: 'individual' | 'pairs'): Promise<any> => {
  const pairInstructions = eventType === 'pairs'
    ? `
    **Event Type:** Pre-defined Pairs.
    **IMPORTANT:** The 'teamId' on each player indicates their partner. You MUST keep these pairs together. When moving teams between courts, move the pair as a single unit. Do not create new partnerships.`
    : `
    **Event Type:** Individual Players.
    **Partnerships:** After moving players to their new courts, analyze the rules for creating new partnerships for this round (e.g., swap partners, keep partners, random partners).`;

  const prompt = `
    You are a pickleball event director. Your task is to generate the matches for the next round (${nextRoundNumber}) based on the results of the previous round and the event rules.

    ${pairInstructions}

    **Event Rules:**
    ${rules}

    **All Players in Event:**
    (Note: The 'skillLevel' property represents the player's seed.)
    ${JSON.stringify(players, null, 2)}

    **Previous Round Results:**
    ${JSON.stringify(previousRoundResults, null, 2)}

    **Your Task:**
    1.  **Analyze Previous Round Pods:** The provided results are a list of matches. First, group these matches by their 'court' number to understand the "pods" of teams that played together. Then, determine the final standings (winners, losers, etc.) within each pod according to the rules (e.g., based on wins, point differential).
    2.  **Apply Movement Rules:** Apply the event rules to move teams/players between courts for the new round. For example, "winners move up, losers move down." This will form the new pods for Round ${nextRoundNumber}.
    3.  **Re-form Pods & Handle Partnerships:** The teams/players on each court now form the new pods for this round.
        - Ensure the new pods are as balanced in size as possible to maintain competitive consistency.
    4.  **Generate New Matches:** For each new pod, generate all the required match objects for Round ${nextRoundNumber}.
        - The format on each court (e.g., round-robin) should be consistent with previous rounds.
        - All matches for a single pod must share the same \`court\` number.
    5.  **Assign IDs:** Each new match must have a unique ID that has not been used before (e.g., if the last match was "m15", start with "m16").

    **Output Format:**
    Respond ONLY with a valid JSON array of new match objects for Round ${nextRoundNumber}. Do not include any other text, explanation, or markdown.
    Each object in the array should have the following structure:
    {
      "id": "string",
      "court": "number",
      "teamA": ["player_id_1", "player_id_2"],
      "teamB": ["player_id_3", "player_id_4"]
    }
  `;
  return generateJson(prompt);
};

export const generateEventSummary = async (schedule: Schedule, players: Player[], rules: string): Promise<any> => {
    const prompt = `
    You are a sports data analyst. Your task is to analyze the complete results of a pickleball event and generate a final summary.

    **Event Rules:**
    ${rules}

    **All Players (with original seeds/skillLevel):**
    ${JSON.stringify(players, null, 2)}

    **Complete Match Results (all rounds):**
    ${JSON.stringify(schedule.matches, null, 2)}

    **Your Task:**
    Analyze all the data and generate a JSON object with two keys: "playerStats" and "specialAwards".

    1.  **Calculate "playerStats":**
        - Create an array of objects, one for each player.
        - **playerId**: The player's ID.
        - **finalRank**: The player's final rank. Determine this based on their final court position and performance, following the event rules. The highest court (lowest court number) is best. On the same court, use point differential, then wins as tie-breakers as per the rules.
        - **newSeed**: Propose a new seed for the player for the next event. This should be their finalRank.
        - **wins**: Total number of matches won.
        - **losses**: Total number of matches lost.
        - **pointsFor**: Total points scored by the player's teams across all games.
        - **pointsAgainst**: Total points scored against the player's teams across all games.
        - **pointDifferential**: The value of (pointsFor - pointsAgainst).

    2.  **Generate "specialAwards":**
        - Create an array of 3-5 interesting, award-style objects.
        - **title**: A catchy title for the award (e.g., "King of the Court", "The Marathoner", "Biggest Mover").
        - **playerName**: The name of the player who won the award.
        - **description**: A brief explanation of why they won (e.g., "Finished with the highest point differential of +25.", "Climbed 5 ranks from their initial seed.").
        - Brainstorm creative awards based on the data. Examples: Highest point differential, most wins, biggest rank improvement (initial seed vs. final rank), most wins on the top court.

    **Output Format:**
    Respond ONLY with a valid JSON object matching this structure. Do not include any other text, explanation, or markdown.
    {
      "playerStats": [{ "playerId": "string", "finalRank": number, "newSeed": number, "wins": number, "losses": number, "pointsFor": number, "pointsAgainst": number, "pointDifferential": number }],
      "specialAwards": [{ "title": "string", "playerName": "string", "description": "string" }]
    }
  `;
  return generateJson(prompt);
};

export const modifyRulesWithAI = async (currentRules: string, modificationRequest: string): Promise<string> => {
    const prompt = `
        You are an event assistant. Your task is to modify a set of event rules based on a user's request.
        The user will provide the current rules and a plain-English modification. You must return only the new, complete rules text.

        **Current Rules:**
        ---
        ${currentRules}
        ---

        **Modification Request:**
        "${modificationRequest}"

        **Your Task:**
        Read the current rules and the modification request. Rewrite the entire rules text to incorporate the change.
        Ensure the new rules are coherent and complete. Do not add any commentary, just output the final text.
    `;
    return generateText(prompt);
};

export const summarizeRulesForPlayer = async (rules: string): Promise<string> => {
    const prompt = `
        You are a helpful event assistant. A player has asked for a summary of the event rules.
        Your task is to read the full rules provided below and create a concise "cliff notes" version that is easy for a player to understand quickly.

        **Full Event Rules:**
        ---
        ${rules}
        ---

        **Your Task:**
        Generate a summary that focuses ONLY on what a player needs to know.
        - How are games scored (e.g., games to 11, win by 1)?
        - How many games are in a round?
        - How do players move up or down courts?
        - How are partners decided in each round?
        
        Use bullet points for clarity. Omit any details that are only relevant to the event director (like seeding methods for round 1, tie-breaker logic details, etc.) unless they directly impact player actions.
        Keep the tone friendly and direct. Start with a sentence like "Here's what you need to know for today's event:".
    `;
    return generateText(prompt);
};