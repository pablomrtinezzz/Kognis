<div align="center">
  <img src="./docs/assets/logo.png" alt="Kognis Logo" width="250" />
  <p><strong>Offline-First PWA for Holistic Personal Optimization</strong></p>
  <img src="https://img.shields.io/badge/Next.js-0B0F17?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-10B981?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PostgreSQL-3B82F6?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</div>

<br />

## 🚀 Overview

**Kognis** is a comprehensive, full-stack Progressive Web Application (PWA) designed to quantify and optimize daily habits. Operating heavily on an offline-first architecture, it unifies physical training metrics, cognitive development, and dynamic nutritional planning.

The system leverages local processing and strategic API calls to maintain a zero-cost cloud infrastructure while delivering real-time, data-driven insights.

## 🧠 Core Modules

- **Physical Engine:** Advanced workout tracking with local 1RM prediction models, volume mapping (radar charts), and GPS running tracking.
- **Cognitive System:** PDF study material ingestion via PyMuPDF, chunked summaries via Gemini API, and a localized Leitner spaced-repetition algorithm. Includes a Dual N-Back working memory module.
- **Nutritional Planner:** Dynamic meal planning utilizing a local Knapsack algorithm to optimize pantry ingredients nearing expiration dates.
- **Unified Goals:** Gamified streak tracking and daily objective syncing across all modules.

## 🏗️ Architecture & Stack

The project follows a Monorepo structure, strictly separating the asynchronous Python backend from the React-based frontend.

- **Frontend:** Next.js (React), Tailwind CSS, Dexie.js (IndexedDB for offline capabilities).
- **Backend:** Python 3, FastAPI, Uvicorn, PyMuPDF.
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, JWT Auth).
- **Tooling:** Ruff (Python linting/formatting), Prettier, Pre-commit hooks.

## 📁 Repository Structure

```text
kognis/
├── backend/            # FastAPI application
│   ├── src/            # API routing, business logic, models
│   └── requirements.txt
├── frontend/           # Next.js PWA
│   ├── src/            # UI components, views, store
│   └── public/         # Static assets and icons
├── docs/               # Architecture diagrams and README assets
├── scripts/            # ETL pipelines and local automation
└── .github/            # CI/CD workflows
``````
