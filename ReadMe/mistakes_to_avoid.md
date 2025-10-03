# Common Development Pitfalls (Mistakes to Avoid)

This document records common issues encountered during development and their solutions. It's a live document that should be updated as new challenges are overcome.

## 1. Port Conflict Error (`EACCES: permission denied`)

This is the most common and critical issue encountered during local development.

### Symptoms
-   **Backend Console:** The server fails to start with an error similar to `Error: listen EACCES: permission denied 0.0.0.0:8088`. The port number may vary.
-   **Frontend Console:** The Vite server shows an `http proxy error` with `AggregateError [ECONNREFUSED]`.
-   **Browser:** The application fails to load data from the backend, often resulting in a `500 Internal Server Error` when making API calls (e.g., during profile registration).

### Root Cause
The `EACCES` error means the port the backend is trying to use is **already occupied by another process**. The `ECONNREFUSED` error on the frontend is a direct consequence: the backend isn't running, so the frontend's request is refused.

This usually happens when:
1.  A previous `npm run dev` command was not properly terminated, leaving a "zombie" `node` process holding the port.
2.  Another application on your computer is using that specific port.

### Solution
1.  **Stop All Lingering Processes:** The most reliable solution is to forcefully stop all running Node.js instances. In a PowerShell terminal, run:
    ```powershell
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    ```
2.  **Change the Port:** If the port is consistently busy due to another application, change the port for the backend. This requires updating three places:
    -   `backend/.env`: Set `PORT=9000` (or another free port).
    -   `backend/src/server.js`: Change the default port in `const PORT = process.env.PORT || 9000;`.
    -   `frontend/vite.config.js`: Update the `target` in the proxy configuration to `target: env.API_URL || 'http://localhost:9000'`.
    
---

## 2. CSS Specificity Issues with Inline Styles and CSS Modules

### Symptoms
- **Problem**: A component's style does not update as expected, even when a CSS class (e.g., `.active`) is correctly applied in the React component.
- **Example**: An active tab should have a colored bottom border, but the style defined in the `.module.css` file does not apply correctly or is overridden. In our case, `border-color: currentColor` was not producing the desired prominent, colored underline on the active tab.

### Root Cause
The issue stems from CSS specificity conflicts, particularly when mixing CSS Module stylesheets with inline styles (`style={{...}}`) in React components.
1.  **High Specificity of Inline Styles**: Inline styles have a higher specificity than styles defined in external or module CSS files.
2.  **The Conflict**: In our `LensTabs` component, the accent color for the active tab's text was applied via an inline style: `style={{ color: activeAccentColor }}`. The corresponding CSS class `.tabBtn.active` in the stylesheet tried to use this color for the border via `currentColor`. While the text color updated correctly, the overall visual effect was not achieved because the existing CSS was not designed to create a prominent `border-bottom` and had other conflicting styles like `background-color` and a generic `1px` border.

### Solution
The solution was to refactor the CSS to work *with* the inline style, rather than fighting its specificity.
1.  **Establish a Baseline**: A transparent `border-bottom` of a specific width (e.g., `3px`) was added to all tabs. This prevents the layout from shifting when the active tab changes.
2.  **Leverage `currentColor` Correctly**: For the `.active` class, we removed conflicting styles (like `background-color` and the generic `border`). We then explicitly set `border-bottom-color: currentColor`. Since the inline style correctly sets the `color`, `currentColor` reliably resolves to the desired accent color, making the underline appear.
3.  **Refine the Container**: The parent container was styled to act as a proper frame. We removed internal `padding` and `gap`, and added `overflow: hidden`. This makes the inner buttons flush with the container's edges and ensures their corners are clipped to match the container's `border-radius`, creating a clean, segmented control look. We also added explicit borders between tabs to act as separators.

### Recommendation
When styling components where some properties (like color) are dynamic and passed as props:
-   Be mindful of CSS specificity. Avoid setting styles in a CSS file that might conflict with inline styles in the component.
-   Design your CSS to anticipate and leverage dynamic inline styles. Using `currentColor` for properties like `border-color` or an SVG `fill` is a powerful technique, but ensure the base styles are set up to support the desired outcome (e.g., having a transparent border of the correct width by default).

*This section can be expanded with other issues as they arise.*

---

## 4. Route Parameter Name Mismatch Causing "Not Found" Errors

### Symptoms
- **Problem**: A page that should display data returns "ID not found" or similar errors, even though the route is correctly defined and the data exists in the database.
- **Example**: Clicking on a dream from the history page navigates to `/interpretation/123abc`, but the component shows "Dream ID not found" error.

### Root Cause
The `useParams()` hook destructures parameters by name, and this name **must exactly match** the parameter name defined in the route:

```javascript
// ❌ WRONG: Parameter name mismatch
const InterpretationPage = () => {
    const { id: routeDreamId } = useParams(); // Reading 'id'
    // routeDreamId will be undefined!
};

// Route definition in App.jsx:
<Route path="/interpretation/:dreamId" element={<InterpretationPage />} />
//                            ^^^^^^^^ Route expects 'dreamId'
```

In this case, `useParams()` tries to read `id`, but the route parameter is named `dreamId`. The result is that `routeDreamId` is always `undefined`, causing the component to fail to fetch data.

### Solution
**Always ensure the destructured name in `useParams()` matches the route parameter name exactly:**

```javascript
// ✅ CORRECT: Names match
const InterpretationPage = () => {
    const { dreamId: routeDreamId } = useParams(); // Reading 'dreamId'
    // Now routeDreamId correctly receives the value from the URL
};

// Route definition:
<Route path="/interpretation/:dreamId" element={<InterpretationPage />} />
//                            ^^^^^^^^ Matches!
```

### Recommendation
- **Consistency**: Use consistent naming conventions across routes and components. If you change a route parameter name, immediately search the codebase for `useParams()` calls that reference it.
- **Type Safety**: Consider using TypeScript with typed route parameters to catch these mismatches at compile time.
- **Diagnostic Logging**: Add logging to show what `useParams()` returns:
  ```javascript
  const params = useParams();
  console.log('[Component] Route params:', params);
  ```

---

## 5. Infinite useEffect Loops from location.state Dependencies

### Symptoms
- **Problem**: An infinite loop of API requests or re-renders occurs when navigating to a page.
- **Console**: The browser console shows the same log messages repeating hundreds of times per second.
- **Server**: The backend logs show identical requests flooding the server, potentially causing a DoS.

### Root Cause
This happens when a `useEffect` hook both:
1. Depends on `location.state` in its dependency array
2. Calls `navigate()` which updates `location.state`

```javascript
// ❌ WRONG: Creates infinite loop
useEffect(() => {
    const fetchData = async () => {
        // ... fetch data from API
        navigate(location.pathname, { 
            replace: true, 
            state: { userId: data.userId, isNew: false } 
        }); // This updates location.state!
    };
    fetchData();
}, [routeId, location.state, profile]); // location.state is a dependency!
```

**The sequence:**
1. `useEffect` runs → calls `fetchData()`
2. `fetchData()` calls `navigate()` which updates `location.state`
3. Change to `location.state` triggers `useEffect` again
4. Loop repeats infinitely ∞

### Solution
**Option 1: Remove `navigate()` call (Preferred)**
```javascript
// ✅ CORRECT: Don't update location.state
useEffect(() => {
    const fetchData = async () => {
        const data = await api.get('/data');
        setData({ ...data, userId: data.userId });
        // No navigate() call - store data in component state
    };
    fetchData();
}, [routeId, profile]); // location.state removed from dependencies
```

**Option 2: Remove `location.state` from dependencies**
```javascript
// ✅ ALTERNATIVE: Remove location.state dependency
useEffect(() => {
    const fetchData = async () => {
        const data = await api.get('/data');
        navigate(location.pathname, { 
            replace: true, 
            state: { userId: data.userId } 
        });
    };
    fetchData();
}, [routeId, profile]); // location.state NOT in dependencies
```

**Option 3: Use a ref to track if navigation already happened**
```javascript
// ✅ ADVANCED: Use ref to prevent re-navigation
const hasNavigated = useRef(false);

useEffect(() => {
    const fetchData = async () => {
        const data = await api.get('/data');
        if (!hasNavigated.current) {
            navigate(location.pathname, { 
                replace: true, 
                state: { userId: data.userId } 
            });
            hasNavigated.current = true;
        }
    };
    fetchData();
}, [routeId, location.state, profile]);
```

### Recommendation
- **Minimize `location.state` usage**: Only use `location.state` for temporary navigation data (like `isNew` flag for new items). Don't use it as a state management solution.
- **Never call `navigate()` in a `useEffect` that depends on `location`**: This almost always creates circular dependencies.
- **Use component state or Context**: For data that needs to persist across re-renders, use `useState`, `useContext`, or a state management library like Redux/Zustand.
- **Diagnostic logging**: Add logging to detect loops early:
  ```javascript
  useEffect(() => {
      console.log('[Component] useEffect triggered:', { routeId, locationState: location.state });
      // ... rest of logic
  }, [routeId, location.state]);
  ```

---

## 6. WebSocket Premature Closure from useEffect Re-execution

### Symptoms
- **Problem**: A WebSocket connection closes before all data is received, resulting in incomplete data.
- **Example**: Only the title and summary of a dream interpretation load, but the detailed lens data (psychoanalytic, tarot, astrology) never arrives.
- **Console**: WebSocket shows `Connection closed` immediately after the first data chunk arrives.

### Root Cause
When data fields that are updated by WebSocket messages are included in the `useEffect` dependency array, receiving any data triggers a re-execution of the effect. The cleanup function then closes the WebSocket before all data is received:

```javascript
// ❌ WRONG: WebSocket closes on first data update
useEffect(() => {
    const ws = connectWebSocket();
    
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'part') {
            setData(prev => ({ ...prev, ...message.payload })); // Updates data!
        }
    };

    return () => {
        ws.close(); // Cleanup closes WebSocket
    };
}, [data.id, data.title, data.summary]); // ❌ data.title and data.summary update!
```

**The sequence:**
1. WebSocket connects
2. First message arrives with `title` and `summary`
3. `setData()` updates state
4. `useEffect` sees `data.title` or `data.summary` changed
5. Cleanup runs → `ws.close()` is called
6. Subsequent messages never arrive

### Solution
**Remove data fields from the dependency array. Only depend on the connection trigger (like an ID or a flag):**

```javascript
// ✅ CORRECT: Minimal dependencies
useEffect(() => {
    const connectionId = data.id;
    if (!connectionId) return;
    
    // Only connect for new items
    const isNew = location.state?.isNew === true;
    if (!isNew) return;
    
    const ws = connectWebSocket();
    
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'part') {
            setData(prev => ({ ...prev, ...message.payload }));
        } else if (message.type === 'done') {
            ws.close(); // Close only when server says 'done'
        }
    };

    return () => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    };
}, [data.id, location.state?.isNew]); // Only ID and isNew flag
```

### Key Principles
1. **Minimal Dependencies**: Only include values that should trigger a new WebSocket connection (like an item ID changing), not values that are updated by the WebSocket itself.
2. **Server-Controlled Closure**: Let the server send a `'done'` or `'complete'` message to signal when to close the connection, rather than relying on React's cleanup.
3. **Guard Cleanup**: In the cleanup function, check if the WebSocket is still open before closing it.

### Recommendation
- **Use refs for connection tracking**: Store the WebSocket in a `useRef` and use another ref to track if a connection is already active for a given ID:
  ```javascript
  const wsRef = useRef(null);
  const activeConnectionId = useRef(null);
  
  useEffect(() => {
      if (activeConnectionId.current === data.id) return; // Already connected
      activeConnectionId.current = data.id;
      
      const ws = connectWebSocket();
      wsRef.current = ws;
      // ... setup
  }, [data.id]);
  ```
- **Separate connection logic from data updates**: Don't let data state changes influence WebSocket lifecycle.
- **Test with slow connections**: Use browser DevTools to throttle network speed and ensure the WebSocket stays open long enough to receive all data.

---

## 3. Build Failure Due to Missing Exports and Incorrect Dependencies

### Symptoms
- **Problem**: The `docker compose up --build` command fails during the `npm run build` step for the frontend service.
- **Error Log**: The build log shows an error like `"X" is not exported by "src/services/api.js"`, or similar messages indicating a failure to resolve an import.

### Root Cause
This class of error typically stems from a series of chaotic or incomplete edits, leading to a desynchronization between different parts of the codebase.
1.  **Accidental Deletion**: A function or variable (e.g., `getProfile`) was accidentally deleted from a file (`api.js`) but the corresponding `import` statement in another file (`App.jsx`) was not removed.
2.  **Useless Dependencies**: `package.json` files for the frontend and backend contained a circular dependency on the root project (`"morpheus-dream-app": "file:.."`). While this might not immediately break a local `npm install`, it is incorrect and can cause unpredictable issues, especially within the isolated environment of a Docker build.
3.  **Platform-Specific Scripts**: Scripts in `package.json` used commands specific to one operating system (e.g., `copy` for Windows). These scripts fail when executed in a different environment, such as the Linux-based Docker containers used for production builds.

### Solution
A systematic diagnosis and correction is required:
1.  **Fix the Code**: Restore the missing function/export (`getProfile`) in the correct file (`frontend/src/services/api.js`) so that the `import` in other files can be resolved. The backend API documentation (`API_backend.md`) was used to confirm the correct endpoint and restore the function's logic.
2.  **Clean Dependencies**: Remove all useless `file:..` dependencies from all `package.json` files. Sub-projects (like `frontend` and `backend`) should be self-contained.
3.  **Ensure Cross-Platform Compatibility**: Replace any OS-specific commands in `package.json` scripts with their cross-platform equivalents. For example, `copy` (Windows) should be replaced with `cp`, and `&&` for command chaining should be replaced with a single `;` if PowerShell compatibility is a concern. [[memory:5483270]]

### Recommendation
-   **Atomic Commits**: Make small, logical commits. A commit that adds a new feature should not also contain random dependency changes or unrelated refactoring. This makes it easier to trace where a bug was introduced.
-   **Code Review**: Before committing, review the changes to ensure that all parts of the code are consistent. For example, if you remove a function, search the codebase for its usages and remove them as well.
-   **Always Use Cross-Platform Scripts**: Never assume a project will only be run on one operating system. Use packages like `cpx` for copying files or stick to basic shell commands that work on both Linux (Docker, macOS) and Windows (Git Bash).

---

### 3. `useEffect` Dependencies
- **Symptom:** Infinite loops, premature WebSocket closures.
- **Root Cause:** Including frequently changing values like `location.state` or `interpretationData` object slices in `useEffect` dependency arrays.
- **Solution:** Keep dependency arrays minimal. Use flags like `isNew` instead of deriving state from data presence.
- **Recommendation:**
  ```javascript
  // ❌ BAD: Re-runs every time any part of lenses data arrives
  useEffect(() => { ... }, [interpretationData.lenses]);

  // ✅ GOOD: Runs only when the dream ID changes or it's a new dream
  useEffect(() => { ... }, [interpretationData?.id, location.state?.isNew]);
  ```

### 4. Handling `birthPlace` from Google Places API
- **Symptom:** Geocoding fails, coordinates are not saved, natal chart is not calculated.
- **Root Cause:** The frontend sends `birthPlace` as an object: `{ description: "City", placeId: "..." }`. The backend must be able to handle cases where `placeId` is `null` (manual input) and correctly extract the `description`. Simply trying to save the object as a string will fail.
- **Solution:** The backend logic must be robust enough to handle the object structure. It should first try to geocode by `placeId`, and if that fails or is absent, it must fall back to geocoding by `description`.
- **Recommendation:**
  ```javascript
  // Backend (server.js)
  // New, robust logic for handling birthPlace
  if (birthPlace && birthPlace.placeId) {
    // Geocode by placeId
  } else if (birthPlace && birthPlace.description) {
    // Fallback: Geocode by description text
  } else {
    // Handle plain string or invalid data
  }
  ```

---

## Best Practices

- **Minimal `useEffect` Dependencies:** Always question every item in a dependency array.
- **Consistent Data Structures:** Ensure property names (`dreamId` vs `id`, `cardName` vs `name`) are consistent across the entire stack.
- **Defensive Coding:** Always check for the existence of nested object properties before accessing them (e.g., `userProfile?.natalChart?.planets?.sun`).
- **Clear WebSocket Lifecycle:** A WebSocket for fetching initial data should connect once, stream all data, and disconnect. It should not be tied to UI state updates.