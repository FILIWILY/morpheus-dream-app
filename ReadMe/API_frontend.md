# Frontend API and Data Structures

This document outlines the key data structures the frontend expects to receive from the backend for rendering the main pages and components.

## Main Interpretation Object

This is the primary object used to render the `InterpretationPage`. It's fetched from the `/api/interpretation/:id` endpoint.

**File Location**: `frontend/src/pages/InterpretationPage.jsx`

```javascript
// Example structure of the 'interpretation' object
const interpretation = {
  id: "dream_1699882594165",
  date: "2025-10-01T10:00:00.000Z",
  originalText: "Текст сна...",
  processedText: "Обработанный и 'причесанный' LLM текст сна...",
  title: "Сгенерированный ИИ заголовок",
  activeLens: "dreambook",
  lenses: {
    dreambook: {
      title: "Сонник",
      content: "Текст толкования по соннику... с ключевыми словами...",
      highlightWords: ["ключевыми", "словами"]
    },
    psychoanalytic: { /* ... */ },
    astrology: { /* ... */ },
    tarot: { /* ... */ },
  }
};
```
## Component Changes

- **`HistoryPage.jsx`**: Redesigned to show dream cards with "Interpretation" and "Dream" buttons. It now manages and displays the `TranscriptModal`.
- **`InterpretationPage.jsx`**: `snapshotSummary` has been removed. The page now uses a `LensSkeleton` for loading existing dreams and a "waiting for AI" message only for new dreams.
- **`TranscriptModal.jsx`**: Redesigned with a glassy, centered style and now displays the dream title.
- **`DreamBookLens.jsx`**: A new component to display the "Dreambook" interpretation with highlighted keywords.