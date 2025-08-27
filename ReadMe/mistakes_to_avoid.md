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
