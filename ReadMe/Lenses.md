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
1.  **Initiation:** The user is presented with a screen that says "Ready to draw your cards?" and a button "Draw 5 Cards".
2.  **Card Selection (Backend/Frontend Logic):** Before the user even clicks, the application randomly and without repetition selects 5 cards from the 22 Major Arcana. Each card is assigned to a specific position in the spread. This process is hidden from the user.
3.  **The Reveal (Animation):** Upon clicking the button, the cards are revealed one by one with a short delay (~0.3-0.5s). As each card appears, its positional title is displayed (e.g., "Cause of the Dream").
4.  **Interpretation:** Simultaneously or immediately after a card is revealed, its personalized interpretation (generated by the AI) fades in.
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
The frontend sends the dream text along with the pre-selected Tarot spread.

```json
{
  "dreamText": "I dreamt I was flying over a city...",
  "lang": "en",
  "date": "2023-10-27",
  "tarotSpread": [
    {"position": "Cause", "cardName": "The Emperor"},
    {"position": "Theme", "cardName": "The Moon"},
    {"position": "Obstacle", "cardName": "The Chariot"},
    {"position": "Advice", "cardName": "Strength"},
    {"position": "Lesson", "cardName": "The Lovers"}
  ]
}
```

**API Response (within `lenses`):**
The AI returns a detailed interpretation for each card and a final summary.

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
  "summary": "Overall, this spread reveals a journey from a need for control (The Emperor) through a landscape of uncertainty (The Moon). The path forward requires inner strength (Strength) to overcome internal conflicts (The Chariot) and make a harmonious choice (The Lovers). Trust your intuition, but lead with a compassionate heart."
}
```

---

## 3. Astrology Lens
*(Description to be added)*

---

## 4. Folkloric Lens
*(Description to be added)*
