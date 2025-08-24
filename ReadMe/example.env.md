# Backend Environment Variables

`backend/.env`:
- `PORT`: The port on which the backend server will run. Default is `9000`.
  - Used in: `backend/src/server.js`
- `OPENAI_API_KEY`: Your API key for accessing the OpenAI service.
  - Used in: `backend/src/services/openai.js`
- `USE_MOCK_API`: Set to `true` to use the mock interpretation data from `mock-interpretation.json` instead of making a real call to the OpenAI API. Useful for frontend development and testing without incurring API costs.
  - Used in: `backend/src/server.js`
- `GOOGLE_GEOCODING_API_KEY`: Your API key for the Google Geocoding API. This is required to convert a user's birthplace (city name) into geographic coordinates (latitude and longitude), which are essential for calculating the natal chart.
  - Used in: `backend/src/server.js`

Example `backend/.env`:
```
PORT=9000
OPENAI_API_KEY=your_openai_api_key_here
USE_MOCK_API=true
GOOGLE_GEOCODING_API_KEY=your_google_api_key_here
```

# AI Provider Settings
# Set to true to use OpenAI, false to use DeepSeek
USE_OPENAI=true
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Frontend Environment Variables

`frontend/.env`:
- `API_URL`: The URL of the backend API. During local development, this should point to your local backend server (e.g., `http://localhost:9000`).
  - Used in: `frontend/src/services/api.js` (presumably, will verify in the next step)

Example `frontend/.env`:
```
API_URL="http://localhost:9000"
```