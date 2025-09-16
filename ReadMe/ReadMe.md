# Morpheus Dream App

## Project Overview
This application is a **Telegram Mini App** for dream interpretation that utilizes AI language models to analyze dreams through multiple "lenses": Psychoanalytic, Tarot, and Astrology. Built as a modern web application that runs inside Telegram, providing secure authentication and seamless user experience.

## Getting Started

A comprehensive guide for local development, production deployment, and environment setup can be found in the **[Development & Production Guide](ReadMe/Deployment.md)**.

### Quick Start (Local Development)
1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Configure Environment**: Copy `.env.example` to `.env` and fill in the required variables.
3.  **Run**: For the recommended hybrid development mode with hot-reloading, see the detailed guide. A quick start with a mock database is:
    ```bash
    npm run dev
    ```

## Architecture

The application is built with a React frontend and a Node.js/Express backend, containerized with Docker for production.

-   **Frontend**: React with Vite, Material-UI, and React Router.
-   **Backend**: Node.js with Express, connecting to a PostgreSQL database.
-   **Authentication**: Secure, cryptographically-verified authentication via the Telegram Web App protocol.

For more detailed information on the architecture, API endpoints, and specific implementations, please refer to the documentation in the `ReadMe/` directory:
-   **[API Backend Documentation](ReadMe/API_backend.md)**
-   **[API Frontend Documentation](ReadMe/API_frontend.md)**
-   **[Telegram Mini App Implementation Details](ReadMe/Telegram.md)**
-   **[Deployment and Nginx Architecture](ReadMe/nginx.md)**
