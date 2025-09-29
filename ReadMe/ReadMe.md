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

# Tech Stack and Build Dependencies

This document outlines the core technologies and build tools required for the project, particularly for the backend which has native C++ dependencies.

## The Role of Python in this Node.js Project

A common point of confusion is why **Python** is required to install dependencies for a Node.js project. Here's the dependency chain:

1.  The `swisseph` package, used for astrological calculations, is not written in pure JavaScript. It contains high-performance C++ code.
2.  This C++ code must be compiled into a binary file (`.node`) that Node.js can understand during the `npm install` process.
3.  The tool responsible for this compilation is **`node-gyp`**.
4.  `node-gyp` itself is a **Python script**. It acts as an orchestrator or a "project manager" that finds the installed C++ compiler (like Microsoft Visual Studio Build Tools) and tells it how to build the C++ parts of the package.

Therefore, Python is not used to run the application itself, but it is a critical **build-time dependency** required by `node-gyp`.

## Detected Versions

The following versions were detected on the development machine.

| Technology      | Version                 | Notes                                                      |
| :-------------- | :---------------------- | :--------------------------------------------------------- |
| Node.js         | `v20.10.0`              | The JavaScript runtime environment.                        |
| npm             | `10.9.2`                | The package manager for Node.js.                           |
| Python          | `3.12.2`                | Required by `node-gyp` for compiling native modules.       |
| node-gyp        | *Not detected globally* | The project uses a local version (v8.4.1 from logs).       |
| Visual Studio   | *Detection failed*      | Required for the C++ compiler (MSVC) and Windows SDK.      |