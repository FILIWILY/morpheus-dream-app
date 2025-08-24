# Frontend API and Data Structures

This document outlines the key data structures the frontend expects to receive from the backend for rendering the main pages and components.

## Main Interpretation Object

This is the primary object used to render the `InterpretationPage`. It's fetched from the `/api/interpretation/:id` endpoint.

**File Location**: `frontend/src/pages/InterpretationPage.jsx`

```javascript
// Example structure of the 'interpretation' object
const interpretation = {
  id: "dream_1699882594165",
  date: "2023-11-13T13:36:34.165Z",
  dream: "Текст сна...",
  title: "Сгенерированный ИИ заголовок",
  keyImages: ["образ1", "образ2"],
  snapshotSummary: "Краткое резюме от ИИ",
  lenses: {
    psychoanalytic: { /* ... */ },
    tarot: { /* ... */ },
    culturology: { /* ... */ },
    astrology: {
      title: "Астрология",
      // Rendered in the "Dream Atmosphere" / "Celestial Map" block
      celestialMap: {
        moonPhase: {
          name: "Полнолуние",
          text: "AI-generated text explaining the moon phase's influence on the dream."
        },
        moonSign: {
          name: "Скорпион",
          // Note: The frontend uses the same synthesized text for both phase and sign
          text: "The same AI-generated text that synthesizes both phase and sign."
        }
      },
      // Rendered in the "Top Transits" slider
      topTransits: {
        explanation: "Static text explaining what transits are...",
        insights: [
          {
            p1: "pluto",         // Planet 1 symbol
            p2: "moon",          // Planet 2 symbol
            aspect: "square",    // Aspect symbol
            power: 8,            // Score 1-10 for the visualizer
            tagline: "Плутон в квадрате к Луне", // Short text for the card face
            title: "Влияние: Плутон и Луна",   // Title for the expanded view
            interpretation: "AI-generated interpretation of the transit, linked to the dream.",
            lesson: "AI-generated lesson for the transit, linked to the dream."
          },
          // ... more transits
        ]
      },
      // Rendered in the "Cosmic Passport" block
      cosmicPassport: {
        sun: {
          title: "Солнце в знаке Дева",
          tagline: "AI-generated text linking the user's sun sign to the dream's plot."
        },
        moon: {
          title: "Луна в знаке Дева",
          // Note: The frontend uses the same synthesized text for both sun and moon
          tagline: "The same AI-generated text synthesizing the influence of both Sun and Moon."
        }
      },
      // Rendered as the final summary paragraph
      summary: "Overall AI-generated summary for all astrological factors."
    }
  }
};
```