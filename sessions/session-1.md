# AI Coding Session Log — O2C Graph System

**Tool used:** Claude (claude.ai)  
**Date:** March 2026  
**Task:** Build a graph-based data modeling and query system for SAP Order-to-Cash data

---

## Session Overview

Built a full-stack O2C graph query system using Claude as primary coding assistant. The session covered: dataset exploration, architecture decisions, database ingestion, FastAPI backend, Groq LLM integration, and React frontend with force-directed graph visualization.

---

## Prompts & Iterations

### Turn 1 — Understanding the assignment
**Prompt:** Uploaded assignment PDF + screenshots of reference UI. Asked Claude to explain how to approach it.

**Claude output:** Full architecture plan with tech stack table, step-by-step build order, and explanation of the O2C flow.

**Decision made:** Use SQLite (not Neo4j) because the dataset is ~21K rows and relational JOINs are sufficient. Avoids infra overhead.

---

### Turn 2 — Dataset exploration
**Prompt:** Uploaded zip of JSONL files. Asked Claude to inspect and understand the schema.

**Claude output:** Read all 19 JSONL tables, identified key fields and foreign key relationships. Produced the full O2C entity mapping:
- sales_order_headers.soldToParty → business_partners.businessPartner
- outbound_delivery_items.referenceSdDocument → sales_order_headers.salesOrder
- billing_document_items.referenceSdDocument → outbound_delivery_items.deliveryDocument
- journal_entry.referenceDocument → billing_document_headers.billingDocument
- payments.clearingAccountingDocument → journal_entry.accountingDocument

---

### Turn 3 — Ingestion script
**Prompt:** "Write a Python script to load all JSONL files into SQLite"

**Claude output:** `ingest.py` with flatten() helper for nested JSON (e.g., creationTime had {hours, minutes, seconds} structure), dynamic table creation from discovered columns, glob-based multi-file loading per folder.

**Result:** 21,393 rows across 19 tables in ~2 seconds.

---

### Turn 4 — FastAPI backend
**Prompt:** "Build the FastAPI backend with /api/graph and /api/query endpoints"

**Key design decisions Claude made:**
1. `/api/graph` — constructs nodes/edges at runtime via SQL queries, returns JSON for react-force-graph-2d
2. `/api/query` — two-stage LLM: Stage 1 generates SQL (JSON response), Stage 2 formats results as natural language
3. Schema embedded in system prompt — avoids RAG complexity at this data scale
4. Temperature=0 for SQL generation, 0.2 for answer formatting

---

### Turn 5 — Groq prompt engineering
**Prompt:** "Design the system prompt for the Groq LLM"

**Guardrail strategy:**
- Prompt-level: explicit instruction to return fixed string for off-topic queries
- Code-level: string check on response before executing any SQL
- SQL errors caught with try/except and returned as clean error messages

**Schema in prompt:** Full 19-table schema with column names and FK relationships embedded. This gives the model full context for JOIN generation.

---

### Turn 6 — React frontend
**Prompt:** "Build the React frontend with split panel: graph on left, chat on right"

**Claude output:** 
- `App.tsx` with ForceGraph2D integration, node click handler, message state
- Color-coded nodes by entity type
- Two-stage message display: natural language answer + optional SQL viewer + data table preview
- Example query chips for discoverability
- Conversation history passed to backend (last 6 messages) for context

---

### Turn 7 — Packaging
**Prompt:** "Package everything for submission"

**Claude output:** setup.bat, start.bat for Windows, README with architecture decisions, this session log.

---

## Architecture Decisions Summary

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Database | SQLite | Zero setup, 21K rows is fine relationally |
| Backend | FastAPI | Fast development, async, great for REST APIs |
| LLM | Groq llama-3.3-70b-versatile | Free tier, fast, excellent SQL generation |
| Graph viz | react-force-graph-2d | WebGL, handles 500+ nodes, D3 force layout |
| Graph construction | SQL-based at runtime | Avoids maintaining a separate graph DB |
| Guardrails | Prompt + code dual layer | Reliable rejection of off-topic queries |
| LLM calls | Two-stage (SQL then format) | Separates SQL generation from answer formatting |

---

## Debugging Notes

- JSONL files had nested objects (e.g., `creationTime: {hours, minutes, seconds}`) — handled with recursive flatten()
- billing_document_items links to deliveries via `referenceSdDocument`, not directly to sales orders — required careful JOIN chain
- react-force-graph-2d requires `links` not `edges` in graphData — caught during integration
- Groq returns JSON sometimes wrapped in ```json``` fences — added regex strip before JSON.parse()
