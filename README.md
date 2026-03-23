# Order-to-Cash Graph System

A graph-based data modeling and query system that visualizes SAP Order-to-Cash business processes and enables natural language querying using an LLM.

![O2C Graph UI](frontend/public/screenshot.png)

## Architecture

```
o2c-graph/
├── backend/                    # Python FastAPI backend
│   ├── app/                   # Modular application package
│   │   ├── __init__.py        # App factory
│   │   ├── config.py          # Environment & constants
│   │   ├── db.py              # Database helpers
│   │   ├── utils.py           # Reusable utils
│   │   ├── schema.py          # SQLite schema for LLM
│   │   ├── prompts.py         # LLM prompt templates
│   │   ├── graph.py           # Graph construction (Entity builders)
│   │   ├── llm.py             # NLP Query processing pipeline
│   │   └── routes.py          # API Endpoints
│   ├── main.py                # Server Entry Point
│   ├── Procfile               # Render Deployment instructions
│   ├── o2c.db                 # SQLite database (Embedded dataset)
│   ├── requirements.txt       # Dependencies
│   └── .env.example           # API keys template
│
├── frontend/                   # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   │   ├── Header.tsx     # Breadcrumb navigation
│   │   │   ├── GraphVisualization.tsx # Force-directed graph
│   │   │   ├── GraphControls.tsx # Minimize/overlay buttons
│   │   │   ├── NodeTooltip.tsx   # Node detail popup
│   │   │   ├── ChatPanel.tsx     # Chat interface
│   │   │   └── ui/            # Shadcn UI primitives
│   │   ├── hooks/             # Custom React hooks
│   │   ├── types/             # TypeScript type definitions
│   │   ├── lib/               # Utilities & API client
│   │   ├── App.tsx            # Main layout composition
│   │   ├── main.tsx           # App entry point
│   │   └── index.css          # Global styles & design tokens
│   ├── package.json
│   └── vite.config.ts
│
├── render.yaml                 # IaC Infrastructure for Render
├── sessions/                   # AI Coding session logs
└── README.md
```

## Setup & Run Locally

### Prerequisites
- Python 3.9+
- Node.js 18+
- A Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
# Add your GROQ_API_KEY to a `.env` file
echo "GROQ_API_KEY=your_key_here" > .env
python main.py
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Example Queries

- *"Which products are associated with the highest number of billing documents?"*
- *"Trace the full flow of billing document 91150187"*
- *"Identify sales orders that have been delivered but not billed"*
- *"Show me top 5 customers by total order value"*
- *"Find sales orders with broken or incomplete flows"*

## Implementation Details

### Stack & Tools
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, `react-force-graph-2d`
- **Backend**: Python 3, FastAPI, SQLite
- **LLM Engine**: Groq (Llama 3.3 70B Versatile) for ultra-fast NLP to SQL processing

### System Guardrails
- Implements strict prompt engineering blocking general knowledge/off-topic requests.
- Validates the parsed request explicitly restricts data access to the embedded `.db`. 

### Graph Logic
- Dynamic force-directed rendering mapping physical relational items directly to graph entities. 
- Fully supports tracking a node through the `placed -> fulfilled by -> billed as -> posted to -> cleared by` lifecycle.
