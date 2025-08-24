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

*This section can be expanded with other issues as they arise.*
