# Dream Interpretation Lenses

This document provides a conceptual overview of the four analytical "lenses" used in the Morpheus Dream App to interpret dreams. Each lens offers a unique perspective on the user's dream narrative.

---

## 1. Psychoanalytic Lens

### Core Principle
The Psychoanalytic Lens delves into the dreamer's subconscious to uncover hidden conflicts, desires, and motivations. It moves beyond a rigid framework by generating three dynamic, tailored **insights** based on the specific dream's content, followed by a deeper analysis from the perspectives of three major psychoanalytic schools.

The analysis always links the dream's narrative to the user's personal context, providing relevant and actionable understanding.

### Data Structure

The lens returns a single JSON object structured for clear visualization.

```json
"psychoanalytic": {
  "title": "Psychoanalysis",
  "insights": [
    {
      "name": "Insight Title 1",
      "description": "Explanation of the insight and how it relates to the dream's events...",
      "recommendation": "A practical, actionable therapeutic recommendation..."
    },
    {
      "name": "Insight Title 2",
      "description": "Explanation of the insight and how it relates to the dream's events...",
      "recommendation": "A practical, actionable therapeutic recommendation..."
    },
    {
      "name": "Insight Title 3",
      "description": "Explanation of the insight and how it relates to the dream's events...",
      "recommendation": "A practical, actionable therapeutic recommendation..."
    }
  ],
  "schools": {
    "freud": {
      "title": "Freudian Analysis",
      "content": "Analysis focusing on subconscious drives, defense mechanisms, the Ego, and early life experiences..."
    },
    "jung": {
      "title": "Jungian Analysis",
      "content": "Analysis focusing on archetypes, the Shadow, individuation, the collective unconscious, and mythical imagery..."
    },
    "adler": {
      "title": "Adlerian Analysis",
      "content": "Analysis focusing on social interest, the drive for recognition, power dynamics, and self-assertion in a social context..."
    }
  }
}
```

### Key Components

#### 1. Psychological Insights
Instead of fixed metrics, the AI analyzes the dream's plot, emotional tone, character actions, and conflicts to generate three unique insights. The front-end will display them under the heading "In your dream, the following is observed:".

Each insight includes a `description` that explains *why* the AI identified it, directly referencing events from the dream. Crucially, it must also provide a **`recommendation`**: a practical, therapeutic piece of advice aimed at calming anxiety and empowering the user.

**Example Insight:**
- **name:** "A Search for Inner Sanctuary"
- **description:** "The cave in your dream is more than a location; it's a symbol of safety and solitude. The way you explore it speaks to your subconscious desire to find a protected space for self-reflection, away from external pressures."
- **recommendation:** "Trust this inner need for sanctuary. Try dedicating a small part of your day to quiet reflection. You could journal your thoughts, meditate, or simply sit in silence. Structuring these moments can help you process your feelings and reduce anxiety."

**Examples of Potential Insights (`name` field):**
1.  Repressed Aggression
2.  Fear of Betrayal
3.  An Urge for Control
4.  Anxiety about the Future
5.  Unresolved Past Conflicts
6.  A Desire for Freedom
7.  A Feeling of Helplessness
8.  The Search for Identity
9.  A Fear of Failure
10. A Need for Recognition
11. Inner Child Wounds
12. A Struggle with Authority
13. Suppressed Creativity
14. Relationship Insecurities
15. A Fear of Loss
16. Feelings of Guilt and Shame
17. A Desire for Transformation
18. A Feeling of Being Judged
19. Avoidance of Responsibility
20. A Communication Breakdown

#### 2. Deep Analysis (The Schools)
To provide a multi-faceted psychoanalytic view, the dream is further analyzed by three foundational schools:

*   **Freud:** Focuses on subconscious drives (libido), defense mechanisms, the structure of the psyche (Id, Ego, Superego), and the influence of early childhood experiences.
*   **Jung:** Interprets the dream through archetypes (e.g., the Shadow, Anima/Animus, the Great Mother), the process of individuation, the collective unconscious, and mythological parallels.
*   **Adler:** Examines the dream in the context of the individual's "style of life," focusing on social interest, the struggle for superiority or recognition to compensate for feelings of inferiority, and power dynamics.

---

## 2. Tarot Lens

### Core Principle
The Tarot Lens provides a structured, narrative-driven interpretation of the dream using a five-card spread of the Major Arcana. This method helps to build a story around the dream, revealing its cause, central theme, challenges, and potential for growth.

The process is designed to feel interactive and insightful, turning a potentially confusing dream into a clear "roadmap" for self-reflection.

### User Experience (UX) Flow
1.  **Initiation (Backend):** When a dream is processed via `POST /processDreamText`, the backend automatically generates a 5-card Major Arcana spread. The cards and their positions are determined randomly and stored with the dream interpretation data. This process is hidden from the user.
2.  **Presentation (Frontend):** When the user opens the Tarot lens, they see a screen that says "Your destiny cards are ready" and a button "Reveal Cards".
3.  **The Reveal (Animation):** Upon clicking the button, the cards are revealed one by one with a short delay (~0.3-0.5s). As each card appears, its positional title is displayed (e.g., "Cause of the Dream").
4.  **Interpretation:** Simultaneously or immediately after a card is revealed, its personalized interpretation (retrieved from the backend) fades in.
5.  **Summary:** Below the spread, a concluding summary and a final piece of advice, synthesized from all five cards, is displayed in an emphasized block.

### The 5-Card Dream Spread
Each position in the spread answers a specific question about the dream:

1.  **Cause of the Dream:** Why did this dream occur now? What past or current event triggered it?
2.  **Theme of the Dream:** What is the central message or problem the dream revolves around?
3.  **Obstacle/Block:** What internal conflict, fear, or external situation is preventing understanding or resolution?
4.  **Message/Advice:** What is the Tarot's wise counsel? What action should be taken?
5.  **Lesson/Potential:** What long-term lesson does this dream offer? What personal quality can be developed?

### Data Structure

**API Request (`POST /processDreamText`):**
The frontend sends only the dream text, language and date. The Tarot spread is generated on the backend.

```json
{
  "dreamText": "I dreamt I was flying over a city...",
  "lang": "en",
  "date": "2023-10-27"
}
```

**API Response (within `lenses`):**
The AI returns a detailed interpretation for each card and a final summary. The `spread` array now contains both the card data and its interpretation, ready to be displayed.

```json
"tarot": {
  "title": "Tarot",
  "spread": [
    {
      "position": "Cause of the Dream",
      "cardName": "The Emperor",
      "interpretation": "The appearance of The Emperor suggests the dream was triggered by a recent need for order and control in your life..."
    },
    {
      "position": "Theme of the Dream",
      "cardName": "The Moon",
      "interpretation": "The central theme is navigating the unknown. Like the Moon, your dream illuminates anxieties and intuitive feelings that are usually hidden..."
    },
    {
        "position": "Obstacle/Block",
        "cardName": "The Chariot",
        "interpretation": "The Chariot points to a struggle with willpower. You may feel your drive to move forward is blocked by conflicting desires or a lack of direction..."
    },
    {
        "position": "Message/Advice",
        "cardName": "Strength",
        "interpretation": "The advice is to approach your challenges with courage and compassion. Tame your inner 'beast' not with force, but with gentle determination..."
    },
    {
        "position": "Lesson/Potential",
        "cardName": "The Lovers",
        "interpretation": "The ultimate lesson is about making a choice that aligns with your deepest values. This dream offers the potential to harmonize conflicting parts of yourself..."
    }
  ],
  "summary": "Overall, this spread reveals a journey from a need for control (The Emperor) through a landscape of uncertainty (The Moon). The path forward requires inner strength (Strength) to overcome internal conflicts (The Chariot) and make a harmonious choice (The Lovers). Trust your intuition, but lead with a compassionate heart.",
  "state": {
      "isRevealed": false
  }
}
```

---

## 3. Astrology Lens

The Astrology Lens is composed of three distinct blocks, designed to give the user a multi-layered understanding of their dream.
1.  **Dream Atmosphere:** Sets the general "astrological weather" of the night.
2.  **Key Planetary Influences:** Provides a deep, personalized analysis of the major long-term influences.
3.  **Cosmic Passport:** Connects the dream's events to the user's core personality traits (Sun and Moon signs).

### Block 1: Dream Atmosphere

#### User Value
This block provides immediate, easy-to-understand context about the universal energies at play on the night of the dream. It answers the question: "What was the general mood of the cosmos when I had this dream?"

#### Data & Logic
-   **Source**: Calculated by `getDreamAtmosphere` function in `backend/src/services/astrology.js`.
-   **Process**:
    1.  Takes the `dreamDate` (at 00:00 UTC).
    2.  Uses `swisseph` to calculate the precise longitude of the Sun and the Moon.
    3.  Determines the Moon's phase based on the angular distance between the Sun and Moon.
    4.  Determines the Moon's zodiac sign based on its longitude.
    5.  The backend returns a `celestialMap` object containing the names and static descriptions for the phase and sign, which are then displayed on the frontend.

### Block 2: Key Planetary Influences

#### User Value
This is the core of the astrological interpretation. It moves beyond the general "weather" to answer the much deeper question: **"Why did I have *this specific* dream *right now*?"** It connects the dream's themes to the most significant, long-term psychological patterns currently active in the user's life, as indicated by planetary transits to their natal chart.

#### Data & Logic
-   **Source**: Calculated by `calculateTopTransits` function in `backend/src/services/astrology.js`.
-   **Process**: This is a sophisticated emulation of a professional astrologer's analytical process.
    1.  **Input**: The function requires the user's full `natalChart` from their profile and the `dreamDate`.
    2.  **Transit Calculation**: It calculates the positions of the five "heavy" outer planets (Jupiter, Saturn, Uranus, Neptune, Pluto).
    3.  **Aspect Search & Scoring**: It finds major aspects between transit and natal planets and scores them based on planet, aspect type, and orb.
    4.  **Selection**: The function returns only the **Top 3** highest-scoring aspects to avoid cognitive overload.
-   **Output**: The `topTransits` array includes `interpretation`, `lesson`, and `recommendation` fields, currently filled with mock data.

### Block 3: Your Cosmic Passport

#### User Value
This block connects the dream's plot and the user's emotional reactions within it to the core of their personality — their Sun and Moon signs from their natal chart. It answers the question: **"Why do I react to the events of my dreams in this particular way?"**

#### Data & Logic
-   **Source**: Calculated by `getCosmicPassport` function in `backend/src/services/astrology.js`.
-   **Process**:
    1.  **Input**: Requires the user's `natalChart` from their profile.
    2.  **Sign Calculation**: It takes the saved longitudes of the Sun and Moon from the natal chart.
    3.  A helper function determines the zodiac sign for each longitude (e.g., 0-30° is Aries, 30-60° is Taurus, etc.).
    4.  **Content Selection**: The determined sign is used as a key to retrieve a pre-written, static `tagline` from a list within the backend code.
-   **Output for LLM**: The final object contains two sub-objects, `sun` and `moon`. Each includes the calculated sign, the static tagline, and fields for a personalized `interpretation` and `recommendation` to be generated by the LLM. The goal is for the LLM to use the tagline as a starting point to explain how the user's innate character (Sun) and emotional needs (Moon) colored their experience of the dream.


---

## 4. Culturology Lens ("Cultural Code")

### Core Principle
The Culturology Lens analyzes the dream as a cultural phenomenon. A virtual culturologist expert explains how the subconscious of a modern European person uses common symbols, scientific patterns, and archetypes to process personal experiences, and provides practical recommendations based on this analysis. The tone is authoritative, analytical, yet understandable and supportive.

### Data Structure
The lens returns a single JSON object with a three-part structure.

```json
"culturology": {
  "title": "Культурный Код",
  "preface": {
    "title": "Макро-анализ Сновидения",
    "content": "Markdown text for the preface..."
  },
  "analysis": [
    {
      "title": "Архетип: Дорогостоящая Ошибка",
      "content": "Markdown text analyzing the first archetype..."
    },
    {
      "title": "Архетип: Неожиданный Мудрец",
      "content": "Markdown text analyzing the second archetype..."
    }
  ],
  "insight": {
    "title": "Ключевой Инсайт и Практический Совет",
    "content": "Markdown text for the key insight...",
    "recommendation": "Markdown text for the practical advice..."
  }
}
```

### LLM Prompt Recommendations
**LLM Task:**
You are a culturologist and somnologist with expertise in psychoanalysis, specializing in dreams within the European cultural context. Your tone is authoritative, analytical, but clear and supportive. You address the user formally ("Вы"). Your task is to provide a three-part analysis of the dream.

*   **For the Preface:**
    > "Проанализируй весь сон: `[текст сна]`. Напиши короткое экспертное предисловие. Определи главную тему (например, профессиональная тревога). Объясни, как подсознание использует культурные архетипы для обработки этой темы. Заверши главным выводом о цели сна."

*   **For the Deep Analysis:**
    > "Выдели 2-3 ключевых архетипических образа из сна. Для каждого образа напиши глубокий анализ. В тексте:
    > 1.  Синтезируй интерпретации из 2-3 релевантных источников (например, **Сонник Миллера, Фрейд, Юнг, мифология**). Названия сонников и имена выделяй **жирным**.
    > 2.  Если уместно, включи научный факт или наблюдение из сомнологии, связанное с этим образом. Начинай его со слов 'Научные исследования показывают, что...'.
    > 3.  Напрямую свяжи смысл символа с сюжетом сна пользователя."

*   **For the Key Insight:**
    > "На основе всего анализа, напиши финальный 'Ключевой Инсайт'. Сформулируй центральное послание сна. Заверши его **конкретным, практическим и прикладным советом**, который пользователь может применить в своей реальной жизни для решения проблемы, поднятой во сне. Совет должен быть креативным и напрямую вытекать из символики сновидения."

### Frontend Rendering
- The frontend will render three main sections: "Preface," "Deep Analysis," and "Key Insight."
- The `analysis` array will be mapped to display each archetype in its own card or block.
- `react-markdown` will be used to correctly render Markdown content, including bold text for emphasis.
