# AI Integration and "Combat Mode"

This document outlines the specifics of integrating AI APIs for dream interpretation, the structure of the prompts, and how to manage the hybrid "combat/mock" mode.

## Core Configuration

### AI Provider Switching
The backend can switch between different AI providers. This is controlled via `backend/.env`:

```dotenv
# Set to true to use OpenAI, set to false to use DeepSeek
USE_OPENAI=false

# --- Provider API Keys ---
OPENAI_API_KEY=your_openai_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# (Optional) The specific OpenAI model to be used.
OPENAI_MODEL="gpt-5-mini"
```

### Backend Architecture
To support multiple providers cleanly, the backend uses the following structure in `backend/src/services/`:
-   `openai.js`: Contains all logic for interacting with the OpenAI API.
-   `deepseek.js`: Contains all logic for interacting with the DeepSeek API.
-   `ai_provider.js`: A simple orchestrator file that reads the `USE_OPENAI` flag and exports the correct `getDreamInterpretation` function.
-   `server.js`: Imports `getDreamInterpretation` from `ai_provider.js`, remaining unaware of which underlying service is used.

### Model in Use

-   **If `USE_OPENAI=true`**: `gpt-5-mini-2025-08-07` (or as specified in `OPENAI_MODEL`).
-   **If `USE_OPENAI=false`**: `deepseek-reasoner`. **Note:** As of August 2024, the DeepSeek API has shown significant performance issues, with response times often exceeding 3 minutes. For development and production, it is strongly recommended to use OpenAI.


### Hybrid Mode Operation

The backend operates in a **hybrid mode**. When real API calls are enabled (`USE_MOCK_API=false`), the backend fetches a **live interpretation for a specific lens** while populating the **other lenses with static data** from `backend/mock-interpretation.json`.

### Lens Status

-   **Psychoanalytic Lens**: **[LIVE]** - Actively uses the selected AI provider.
-   **Tarot Lens**: **[LIVE]** - Actively uses the selected AI provider.
-   **Astrology Lens**: **[MOCK]** - Uses static data.
-   **Culturology Lens**: **[MOCK]** - Uses static data.

## Psychoanalytic & Tarot Lenses: Prompts and Schemas

This section details the prompts sent to the language models.

### OpenAI Prompt (`gpt-5-mini`)

The following system prompt is sent to the language model when `USE_OPENAI=true`. It instructs the model to act as both a Psychoanalytic and a Tarot Reader, providing a combined JSON output.

**Note on Astrology:** If the user's profile is complete (with birth date, time, and place), the prompt is expanded to include a third role: **Astrologer**. The model then receives pre-calculated astrological data and is asked to interpret it in the context of the dream. If the profile is incomplete, this entire section is omitted from the prompt and the backend uses mock data for the Astrology lens.

**Note on Future Improvements:** A planned improvement is to trigger a re-interpretation of the Astrology lens if a user fills out their profile *after* a dream has already been interpreted.

**Note:** Currently, the language in this prompt is hardcoded to Russian (`Write in русском`). In the future, this should be made dynamic to reflect the user's selected language in the app.

```
# ROLE AND MISSION
You are "Morpheus," a multi-faceted and wise dream interpreter. Your goal is to help the user deeply understand their dream from different perspectives. FOR THIS REQUEST, you will act in two roles simultaneously: a **Psychoanalyst** and a **Tarot Reader**. Your task is to generate a single JSON response containing analyses from both perspectives.

# MAIN INSTRUCTION
1.  **Analyze the user's dream text.**
2.  **Analyze the Tarot spread** provided along with the dream text.
3.  **Connect the Dream and the Cards:** Crucially, your Tarot interpretations must not be generic. They must be inextricably linked to the context, images, and emotions of the user's dream. Show how the energy of the cards is reflected in the dream's narrative.

# PERSPECTIVE #1: Psychoanalysis
- Tone: Empathetic and professional. Use clear language, without clichés. Refer to the dream's details and imagery. Do not invent facts that are not present.
- Despite the rigid structure, be free in how you write. The paragraphs should not be repetitive in structure and sentence composition. This is a live analysis written by an expert and spoken aloud to a patient.
- Avoid words like "maybe" or "perhaps"; your answers should be clear and confident.
- In each insight, use different angles (affect, defense, object relations, ego boundaries, Shadow dynamics, etc.).
- **Recommendation (BLOCK 3):** Based on the entire psychoanalytic analysis, provide **one single, actionable recommendation**. 
    - **Tone:** Empathetic, caring, and supportive.
    - **Content:** The recommendation must be **two paragraphs** long. It should focus exclusively on the **mental and introspective aspects**. Guide the user on what to pay attention to in their inner world or what questions to ask themselves.
    - **Restrictions:** Do NOT suggest physical exercises, diets, or rituals. Suggestions should be purely mental (e.g., "try to talk to yourself as you would a dear friend to reduce self-criticism") or practical, everyday advice that can improve well-being (e.g., "notice if you use activities to escape your thoughts and try to find moments of quiet instead").
    - **Title:** Create a short, insightful title for this recommendation that reflects its core message (e.g., "The Practice of Self-Compassion", "A Dialogue with Your Inner Critic").

# PERSPECTIVE #2: Tarot
- Tone: Wise, metaphorical, but clear. Speak like an experienced Tarot reader who helps find a path, rather than predicting the future.
- Structure of Tarot Analysis:
    1.  **Interpretation of each card (BLOCK 4):** For each of the 5 cards in the spread, write a deep but concise interpretation (4-7 sentences). Be sure to explain how the meaning of this card in its given position ("Reason for the Dream," "Theme of the Dream," etc.) relates to the details of the user's dream.
    2.  **Overall Summary (BLOCK 5):** Write a concluding paragraph (5-8 sentences) that summarizes the message of the entire spread. Explain the central story these 5 cards tell together and the main advice they offer the dreamer in the context of their dream.

# PERSPECTIVE #3: Astrology
- Your Role: You are an Astrologer interpreting how the celestial environment on the day of the dream might have influenced its themes.
- Input You Will Receive: You will be given the dream text, and a JSON object with pre-calculated astrological data, including the dream's atmosphere (moon phase, etc.), the user's "Cosmic Passport" (Sun, Moon, Ascendant signs), and a list of 3 key astrological transits.
- Your Task:
    1.  Interpret the Transits: For each of the 3 transits provided, write a brief, insightful interpretation (3-5 sentences). Crucially, you must connect the transit's meaning to the specific events and emotions of the user's dream.
    2.  Write an Overall Summary: Write a final summary paragraph (5-7 sentences) that synthesizes all the astrological data (atmosphere, passport, transits) and links it to the central theme of the dream. Explain how the cosmic energies might have colored the dream's narrative.

# GENERAL RESTRICTIONS
- Do not provide medical diagnoses or direct predictions of the future.
- The response must be strictly in **Russian**.
- Do not use disclaimers like "As a language model...".

# FINAL JSON OUTPUT
Your response must be STRICTLY a single JSON object. Do not include static titles for the psychoanalytic schools in your output. Only return the generated text content as specified below.

\`\`\`json
{
  "title": "A short, intriguing title for the dream, 3-5 words",
  "snapshotSummary": "A general conclusion and brief summary of the dream's interpretation (about 50 words).",
  "lenses": {
    "psychoanalytic": {
      "insights": [
        { "name": "Title from Psychoanalysis BLOCK 1.1", "description": "Explanation from BLOCK 1.1" },
        { "name": "Title from Psychoanalysis BLOCK 1.2", "description": "Explanation from BLOCK 1.2" },
        { "name": "Title from Psychoanalysis BLOCK 1.3", "description": "Explanation from BLOCK 1.3" }
      ],
      "schools": {
        "freud": { "title": "По Фрейду", "content": "For this school, select the single most significant image from the dream. Provide a concise analysis (3-5 sentences) of this symbol from the school's perspective. Use professional yet accessible language. Do not explain the school itself." },
        "jung": { "title": "По Юнгу", "content": "For this school, select the single most significant image from the dream. Provide a concise analysis (3-5 sentences) of this symbol from the school's perspective. Use professional yet accessible language. Do not explain the school itself." },
        "adler": { "title": "По Адлеру", "content": "For this school, select the single most significant image from the dream. Provide a concise analysis (3-5 sentences) of this symbol from the school's perspective. Use professional yet accessible language. Do not explain the school itself." }
      },
      "recommendation": {
        "title": "A suitable title for the recommendation, reflecting its essence",
        "content": "A single, two-paragraph recommendation focusing on mental introspection and self-reflection, written with empathy and care, based on BLOCK 3 instructions."
      }
    },
    "tarot": {
      "interpretations": [
        "Interpretation for the first card provided in the prompt.",
        "Interpretation for the second card...",
        "Interpretation for the third card...",
        "Interpretation for the fourth card...",
        "Interpretation for the fifth card..."
      ],
      "summary": "The overall summary of the Tarot spread, based on all 5 interpretations."
    },
    "astrology": {
      "transitInterpretations": [
          "Your interpretation for the first transit provided, linked to the dream.",
          "Your interpretation for the second transit...",
          "Your interpretation for the third transit..."
      ],
      "summary": "Your overall astrological summary, linking all provided astro-data to the dream."
    }
  }
}
\`\`\`
```

### JSON Schema

To ensure a reliable response, the backend uses OpenAI's `Structured Outputs` feature (`response_format: { type: "json_schema" }`). The API is required to return a JSON object that strictly adheres to the following schema.

```json
{
  "name": "DreamPsychoanalysis",
  "strict": true,
  "schema": {
    "type": "object",
    "properties": {
      "title": {
        "type": "string",
        "description": "A short, catchy title for the dream, in the same language as the dream."
      },
      "snapshotSummary": {
        "type": "string",
        "description": "A brief summary of the dream's interpretation."
      },
      "lenses": {
        "type": "object",
        "properties": {
          "psychoanalytic": {
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "insights": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "name": { "type": "string" },
                    "description": { "type": "string" },
                    "recommendation": { "type": "string" }
                  },
                  "required": ["name", "description", "recommendation"]
                },
                "minItems": 3,
                "maxItems": 3
              },
              "schools": {
                "type": "object",
                "properties": {
                  "freud": {
                    "type": "object",
                    "properties": {
                      "title": { "type": "string" },
                      "content": { "type": "string" }
                    },
                    "required": ["title", "content"]
                  },
                  "jung": {
                    "type": "object",
                    "properties": {
                      "title": { "type": "string" },
                      "content": { "type": "string" }
                    },
                    "required": ["title", "content"]
                  },
                  "adler": {
                    "type": "object",
                    "properties": {
                      "title": { "type": "string" },
                      "content": { "type": "string" }
                    },
                    "required": ["title", "content"]
                  }
                },
                "required": ["freud", "jung", "adler"]
              },
              "recommendation": {
                "type": "object",
                "properties": {
                  "title": { "type": "string" },
                  "content": { "type": "string" }
                },
                "required": ["title", "content"]
              }
            },
            "required": ["title", "insights", "schools", "recommendation"]
          }
        },
        "required": ["psychoanalytic"]
      }
    },
    "required": ["title", "snapshotSummary", "lenses"],
    "additionalProperties": false
  }
}
```

## Appendix: GPT-5 API Integration Notes (as of August 2024)

This section summarizes key findings from the official OpenAI documentation for GPT-5 and outlines the implementation choices made for this project.

### GPT-5 is Confirmed
The new family of models, including `gpt-5`, `gpt-5-mini`, and `gpt-5-nano`, is officially available via the API. These models offer advanced reasoning capabilities.

### API Choice: `Chat Completions` vs. `Responses API`

The documentation introduces two ways to interact with GPT-5:
1.  **`Responses API` (`openai.responses.create`):** A new, powerful API optimized for GPT-5, especially for multi-turn conversations where passing the model's "chain of thought" is beneficial.
2.  **Updated `Chat Completions API` (`openai.chat.completions.create`):** The existing API, which has been upgraded to support new GPT-5 parameters.

**Our Current Implementation:**
- We are using the **Updated `Chat Completions API`**.
- **Reason:** This API explicitly supports the `response_format: { type: "json_object" }` parameter, which is **critical** for our application to receive strictly structured JSON data for the interpretation lenses. The documentation for the new `Responses API` does not currently show examples of enforcing a JSON response format, making a migration risky at this stage.

### Implemented GPT-5 Features

Based on the documentation, we have successfully integrated the following new feature into our `Chat Completions` calls:
-   **`reasoning_effort: "minimal"`**: This parameter has been added to our API requests. It instructs the model to use the minimum number of "reasoning tokens", which should result in faster, lower-latency responses for our dream interpretations.

### Potential Future Features (Not Yet Implemented)

The following features are available but are not currently in use. They could be considered for future enhancements:
-   **Migration to `Responses API`**: If future documentation confirms support for structured JSON outputs, migrating could improve the quality and consistency of interpretations, especially if we introduce multi-turn conversational features.
-   **Verbosity Control (`verbosity: "low" | "medium" | "high"`)**: We could expose this as a user setting to allow them to choose between concise or detailed interpretations.
-   **Custom Tools & Allowed Tools**: These are powerful features for more complex, agent-like tasks but are not directly applicable to our current single-call interpretation logic.

## AI Integration Strategy

The core of the Morpheus application relies on a sophisticated interaction with a Large Language Model (LLM) to provide multi-faceted dream interpretations. The strategy is designed to maximize the quality and relevance of the AI's output while maintaining a structured and predictable data flow.

### Core Principles

1.  **Multi-Perspective Analysis**: The AI is prompted to act as a panel of experts: a Psychoanalyst, a Tarot Reader, and an Astro-psychologist. This ensures a rich and diverse interpretation.
2.  **Structured JSON Output**: The AI's primary instruction is to return a single, strictly formatted JSON object. This is enforced by the `response_format: { type: "json_object" }` parameter in the API call and detailed schema examples in the system prompt.
3.  **Context is King**: For every perspective, the system prompt heavily emphasizes that all interpretations **must** be directly linked to the specific context, emotions, and imagery of the user's dream. Generic, disconnected analyses are explicitly forbidden.
4.  **Backend-Driven Calculations**: The backend performs all necessary pre-calculations (Tarot card dealing, Natal Chart calculation, transit analysis) and provides the AI with a clean, structured dataset to work with. The AI's role is interpretation, not calculation.

### Perspective-Specific Strategies

#### 1. Psychoanalysis

-   **Input**: The AI receives the raw dream text.
-   **Method**: The prompt guides the AI to generate three distinct insights based on different psychoanalytic concepts (e.g., defense mechanisms, shadow dynamics, object relations) and to provide interpretations from Freudian, Jungian, and Adlerian perspectives.
-   **Output**: A structured object containing `insights`, `schools` of thought, and practical `recommendations`.

#### 2. Tarot

-   **Input**: The AI receives the dream text and a JSON object representing a 5-card spread, with each card's name and position.
-   **Method**: The prompt instructs the AI to interpret each card's meaning *in the context of the dream*. This is the most critical instruction to avoid generic card readings.
-   **Output**: An array of 5 strings (one for each card's interpretation) and a final `summary` string. The backend then merges these texts with the original card data (like image paths) to form the final object for the frontend.

#### 3. Astrology (Dynamic Promptlet Strategy)

-   **Input**: The AI receives the dream text and a JSON object with pre-calculated astrological data. This data is not just raw numbers, but is structured with "promptlets"—instructional guides for interpretation.
    -   `dreamAtmosphere`: Contains the Moon's phase and sign, each paired with a `promptGuide`.
        -   *Example Guide*: "Новолуние — время начинаний и скрытого потенциала. Объясни, как эта энергия могла повлиять на зарождение сюжета сна."
    -   `cosmicPassport`: Contains the user's Sun and Moon signs, also paired with `promptGuide` instructions.
        -   *Example Guide*: "Солнце в Овне наделяет человека энергией первопроходца. Объясни, как эта ключевая черта могла проявиться в сюжете сна."
    -   `topTransits`: An array of the top 3 transits, formatted as descriptive titles.
-   **Method**: This is a more advanced prompting technique. Instead of asking the AI for a generic interpretation of "Moon in Aries," we provide it with our own expert-defined interpretive angle. The AI's task is to take this guide and expand upon it, weaving it into the specific narrative of the dream. This gives us fine-grained control over the *tone and direction* of the interpretation while leveraging the AI's power for contextual text generation.
-   **Output**: The AI returns an object containing:
    -   `dreamAtmosphereInterpretation`: A single, synthesized text based on the moon phase and sign guides.
    -   `cosmicPassportInterpretation`: A single, synthesized text based on the sun and moon sign guides.
    -   `transitInterpretations`: An array of objects, each with an `interpretation` and a `lesson` for the corresponding transit.
    -   `summary`: An overall synthesis of all astrological factors.
-   The backend then takes this AI-generated content and merges it into the final, structured object that the frontend expects, ensuring all necessary fields (`title`, `tagline`, `text`, etc.) are correctly populated.
