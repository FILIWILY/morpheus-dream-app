## Database Implementation Details

This document describes the current database persistence mechanism used in the backend of the Morpheus Dream App. It is a file-based JSON storage solution, primarily managed through direct file I/O operations.

### Location
- The database file, `db.json`, is located in the `backend/` directory of the project.

### Core Logic (backend/src/server.js)

The persistence logic is encapsulated within two main helper functions in `backend/src/server.js`:

1.  **`DB_PATH` Constant**
    ```javascript
    const DB_PATH = path.join(process.cwd(), 'db.json');
    ```
    - **Purpose**: Defines the absolute path to the `db.json` file. `process.cwd()` refers to the current working directory of the Node.js process (which is `backend/` when `npm run dev --prefix backend` is executed).

2.  **`readDB()` Function**
    ```javascript
    const readDB = () => {
      if (!fs.existsSync(DB_PATH)) {
        writeDB({ users: {} });
        return { users: {} };
      }
      try {
        const dbRaw = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(dbRaw);
      } catch (e) {
        console.error("Error reading or parsing db.json:", e);
        return { users: {} };
      }
    };
    ```
    - **Purpose**: Reads the entire content of the `db.json` file into memory.
    - **Behavior**:
        - **Initialization**: If `db.json` does not exist, it is created with a default empty structure `{"users": {}}`. This ensures the application starts without errors even if the file is missing.
        - **File Reading**: Uses Node.js's `fs.readFileSync(DB_PATH, 'utf-8')` to synchronously read the file content as a UTF-8 string.
        - **JSON Parsing**: The raw string content is then parsed into a JavaScript object using `JSON.parse()`.
        - **Error Handling**: Includes a `try-catch` block to gracefully handle potential errors during file reading or JSON parsing, returning an empty `users` object in case of an error.

3.  **`writeDB(data)` Function**
    ```javascript
    const writeDB = (data) => {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    };
    ```
    - **Purpose**: Writes the current in-memory JavaScript object representing the database state back to the `db.json` file.
    - **Behavior**:
        - **JSON Stringification**: The JavaScript `data` object is converted into a formatted JSON string using `JSON.stringify(data, null, 2)`. The `null, 2` arguments ensure the JSON is pretty-printed with 2-space indentation, making it readable.
        - **File Writing**: Uses Node.js's `fs.writeFileSync()` to synchronously write (and overwrite) the entire JSON string content to the `db.json` file.

### Data Structure (db.json)

The `db.json` file stores a single root JSON object. All user data is nested under a `users` key.

```json
{
  "users": {
    "[X-Telegram-User-ID]": {
      "dreams": [
        // Array of dream interpretation objects
        {
          "id": "<UUID>",
          "date": "YYYY-MM-DD",
          "originalText": "<User's dream description>",
          "title": "<AI-generated dream title>",
          "keyImages": ["<image1>", "<image2>"], // Key images from the dream
          "snapshotSummary": "<Brief summary of interpretation>",
          "lenses": {
            "psychoanalytic": { /* ... interpretation details ... */ },
            "esoteric": { /* ... interpretation details ... */ },
            "astrology": { /* ... interpretation details ... */ },
            "folkloric": { /* ... interpretation details ... */ }
          }
        }
      ],
      "profile": {
        "birthDate": "YYYY-MM-DD",
        "birthTime": "HH:MM",
        "birthPlace": "<City, Country>"
      }
    },
    // ... other users ...
  }
}
```

### Operational Flow

1.  **Server Startup**: When the backend server initializes, `readDB()` is called to load the existing data or create `db.json` if it doesn't exist.
2.  **API Requests**: For any API endpoint that requires user data (e.g., `/profile`, `/dreams`, `/processDreamText`):
    - The `ensureUser` middleware retrieves the `X-Telegram-User-ID` from the request headers.
    - `readDB()` is called to load the latest state of `db.json` into memory.
    - The relevant user's data (dreams, profile) is accessed and modified in the in-memory JavaScript object.
    - After any modification, `writeDB()` is immediately called to persist the *entire* updated object back to `db.json`.

### Characteristics

-   **Type**: Flat-file JSON database.
-   **Concurrency**: Simple, synchronous file operations. Not designed for high-concurrency environments as the entire file is read and written for each modification.
-   **Scalability**: Limited; performance degrades with increasing file size and number of users.
-   **Persistence**: Data is persistent across server restarts as long as the `db.json` file is not deleted.
-   **Querying**: No advanced querying capabilities; data must be loaded into memory and filtered programmatically.

This implementation is suitable for development and very small-scale applications but would necessitate a migration to a more robust database solution (e.g., MongoDB, PostgreSQL) for production environments to handle scalability, concurrency, and data integrity more effectively.