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