# Multi-Tool Smart Assistant

An AI agent that answers natural-language questions by reasoning about which tool to call — live weather, math calculations, and timezone lookups — with conversation memory across multiple chat sessions.

Built end-to-end as a full-stack application: a LangChain / LangGraph agent wrapped in a FastAPI backend, a React chat interface, containerized with Docker, and deployed to the cloud.

--

## Live Demo

| Service | URL |
| --- | --- |
| Frontend (app) | https://multi-tool-smart-assistant.vercel.app |
| Backend (API docs) | https://multi-tool-smart-assistant-production.up.railway.app/docs |

> Note: The backend runs on a free hosting tier and may sleep when idle. The first request after inactivity can take a few seconds to wake up.

---

## Features

- Autonomous tool selection — the agent reads each message and decides on its own which tool to use. No hardcoded keyword routing.
- Three built-in tools:
  - Weather — live current conditions for any city via a weather API
  - Calculator — safe evaluation of math expressions
  - Timezone — current date and time for any IANA timezone (e.g. `Europe/Amsterdam`)
- Conversation memory — remembers context within a session using a `thread_id`
- Multiple chat sessions — create separate conversations, each with its own memory, switchable from the sidebar
- Modern chat UI — warm charcoal and amber theme, animated thinking indicator, auto-scroll
- Interactive API docs — FastAPI auto-generates a testable Swagger UI at `/docs`

---

## How the agent works

Every AI agent in this project follows one mental model:

```
Brain (LLM) + Tools + Memory + Orchestrator
```

It runs in a loop: perceive, reason, act, observe, repeat.

```
User: "What is the weather in Amsterdam?"
        |
   [Human message received]
        |
   [Brain reasons: "I need the weather tool"]
        |
   [Tool runs: get_weather("Amsterdam") -> "Amsterdam: 18C"]
        |
   [Brain reads the result and writes a natural answer]
        |
Agent: "The weather in Amsterdam is 18C."
```

---

## Architecture

```
+---------------------+         HTTPS          +--------------------------+
|  React Frontend     |  ------------------->  |  FastAPI Backend         |
|  (Vercel)           |     POST /chat         |  (Railway, Dockerized)   |
|                     |  <-------------------  |                          |
|  - chat UI          |   { response,          |  - /chat endpoint        |
|  - session state    |     session_id }       |  - CORS + Pydantic       |
|  - axios calls      |                        |  - run_agent()           |
+---------------------+                        +------------+-------------+
                                                            |
                                                            v
                                             +--------------------------+
                                             |  LangGraph Agent          |
                                             |  - ChatGroq (LLM brain)   |
                                             |  - tools: weather, calc,  |
                                             |    timezone               |
                                             |  - MemorySaver (memory)   |
                                             +--------------------------+
```

---

## Tech Stack

AI / Agent
- [LangChain](https://www.langchain.com/) — agent building blocks and the `@tool` abstraction
- [LangGraph](https://langchain-ai.github.io/langgraph/) — `create_react_agent` orchestrator and `MemorySaver`
- [Groq](https://groq.com/) — fast, free LLM inference (`llama-3.3-70b-versatile`)

Backend
- [FastAPI](https://fastapi.tiangolo.com/) — web framework
- [Pydantic](https://docs.pydantic.dev/) — request/response validation
- [Uvicorn](https://www.uvicorn.org/) — ASGI server

Frontend
- [React](https://react.dev/) and [Vite](https://vitejs.dev/) — UI and build tooling
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Axios](https://axios-http.com/) — HTTP client

DevOps
- [Docker](https://www.docker.com/) — containerized backend
- [Railway](https://railway.app/) — backend hosting
- [Vercel](https://vercel.com/) — frontend hosting
- GitHub — version control and auto-redeploy on push

---

## Project Structure

```
Multi-Tool-Smart-Assistant/
├── backend/
│   ├── agent.py            # LLM + tools + memory + run_agent()
│   ├── main.py             # FastAPI app, CORS, /chat endpoint
│   ├── tools.py            # the three @tool functions
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile          # container definition
│   ├── .dockerignore
│   └── .env                # API keys (NOT committed)
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # full chat UI + state + API calls
│   │   └── index.css       # Tailwind import
│   ├── vite.config.js
│   └── package.json
├── .github/workflows/      # CI/CD
├── .env.example            # placeholder keys for other developers
├── .gitignore
└── README.md
```

---

## Getting Started (run locally)

### Prerequisites

- Python 3.12+
- Node.js 18+ and npm
- A free [Groq API key](https://console.groq.com/)
- A free [WeatherAPI key](https://www.weatherapi.com/)
- (Optional) Docker Desktop, to run the backend in a container

### 1. Clone the repository

```bash
git clone https://github.com/RobbenLe/Multi-Tool-Smart-Assistant.git
cd Multi-Tool-Smart-Assistant
```

### 2. Backend setup

```bash
cd backend

# create and activate a virtual environment
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # macOS / Linux

# install dependencies
pip install -r requirements.txt

# create your .env file (see Environment Variables below)
# then run the server
uvicorn main:app --reload
```

The API is now live at http://localhost:8000 — open http://localhost:8000/docs to test it.

### 3. Frontend setup

Open a second terminal:

```bash
cd frontend

npm install
npm run dev
```

The app is now live at http://localhost:5173.

> Make sure `API_URL` in `frontend/src/App.jsx` points to `http://localhost:8000` while developing locally.

---

## Environment Variables

Create a file `backend/.env` with the following keys:

```env
GROQ_API_KEY=your_groq_api_key_here
WEATHER_API_KEY=your_weather_api_key_here
```

> The `.env` file is git-ignored and must never be committed. A `.env.example` with placeholder values is included to show which keys are required.

---

## Running the backend with Docker

```bash
cd backend

# build the image
docker build -t smart-assistant-backend .

# run the container
docker run -p 8000:8000 --env-file .env smart-assistant-backend
```

The `Dockerfile` starts from `python:3.12-slim`, installs dependencies, and launches Uvicorn on `0.0.0.0:8000` so traffic can reach it from outside the container.

---

## API Reference

### GET /

Health check.

Response
```json
{ "message": "Hello World" }
```

### POST /chat

Send a message to the agent.

Request body
```json
{
  "message": "What is the weather in Amsterdam?",
  "session_id": ""
}
```

| Field | Type | Description |
| --- | --- | --- |
| `message` | string | The user's message (required) |
| `session_id` | string | Conversation ID. Leave empty for a new conversation — the server generates one and returns it. |

Response
```json
{
  "response": "The current temperature in Amsterdam is 18.0 degrees.",
  "session_id": "a1b2c3d4-..."
}
```

> Reuse the returned `session_id` on the next request to keep the conversation's memory.

---

## Deployment

| Layer | Platform | Notes |
| --- | --- | --- |
| Backend | Railway | Root Directory = `backend`, builds from the `Dockerfile`, API keys set as Variables, domain exposed on port `8000` |
| Frontend | Vercel | Root Directory = `frontend`, framework auto-detected as Vite |

Both services auto-redeploy on every push to `main`, forming a simple CI/CD pipeline. After deploying the frontend, the backend's CORS `allow_origins` is restricted to the live Vercel URL.

---

## What I learned building this

- Designing an agent as Brain + Tools + Memory + Orchestrator, and why you let the LLM route to tools instead of writing manual if/elif logic
- Writing safe, well-described tools (input validation, error handling, clear tool descriptions that guide tool selection)
- Building a REST API with FastAPI — endpoints, Pydantic models, CORS, and session handling with UUIDs
- React fundamentals — useState / useEffect / useRef, immutable state updates, and calling an API with axios
- Git hygiene and security — Personal Access Tokens, .gitignore plus git rm --cached, recovering from a leaked secret, and rotating keys
- Containerizing a service with Docker (image vs. container, layer caching, 0.0.0.0 binding)
- Full deployment across Railway and Vercel with environment variables and CORS

---

## Roadmap

- [ ] Persist chat history (currently resets on refresh)
- [ ] Add a RAG document-Q&A tool (ChromaDB)
- [ ] Streaming responses (token-by-token)
- [ ] User authentication

---

## Author

Robben Le — International IT student focused on Machine Learning and AI Agent development.

- GitHub: [@RobbenLe](https://github.com/RobbenLe)

---

## License

This project is open source and available under the [MIT License](LICENSE).
