# O2C Graph - Architecture Documentation

## System Overview

The O2C Graph system is a full-stack application that transforms fragmented SAP Order-to-Cash data into an interactive graph visualization with natural language query capabilities.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface (Browser)                 │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │  Graph Visualization │  │      Chat Interface          │ │
│  │  (react-force-graph) │  │   (Natural Language Input)   │ │
│  │                      │  │                              │ │
│  │  - Node interaction  │  │  - Query history             │ │
│  │  - Edge highlighting │  │  - Sample queries            │ │
│  │  - Legend & details  │  │  - Loading states            │ │
│  └──────────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend (Python)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  GET /api/graph                                      │   │
│  │  - Queries SQLite database                          │   │
│  │  - Constructs nodes and edges                       │   │
│  │  - Returns graph JSON                               │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  POST /api/query                                     │   │
│  │  1. Receives natural language question              │   │
│  │  2. Sends to Groq LLM with schema                   │   │
│  │  3. LLM generates SQL query                         │   │
│  │  4. Executes SQL on SQLite                          │   │
│  │  5. Sends results back to LLM                       │   │
│  │  6. LLM formats natural language answer             │   │
│  │  7. Returns answer + SQL + data                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL Queries
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   SQLite Database (o2c.db)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  19 Tables (flattened from JSONL):                  │   │
│  │  - sales_order_headers                              │   │
│  │  - sales_order_items                                │   │
│  │  - outbound_delivery_headers                        │   │
│  │  - outbound_delivery_items                          │   │
│  │  - billing_document_headers                         │   │
│  │  - billing_document_items                           │   │
│  │  - journal_entry_items_accounts_receivable          │   │
│  │  - payments_accounts_receivable                     │   │
│  │  - business_partners                                │   │
│  │  - products                                         │   │
│  │  - ... and 9 more                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ Ingestion
                            │
┌─────────────────────────────────────────────────────────────┐
│              Data Ingestion (ingest.py)                      │
│  - Reads 19 JSONL file directories                          │
│  - Flattens nested JSON structures                          │
│  - Creates SQLite tables dynamically                         │
│  - Inserts ~21,000 rows                                     │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────────┐
│              SAP O2C Dataset (JSONL files)                   │
│  - 19 directories of JSONL files                            │
│  - Represents complete O2C business process                  │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **React 18** - Component-based UI framework
- **TypeScript** - Type safety and better developer experience
- **Vite** - Fast build tool and dev server
- **react-force-graph-2d** - WebGL-powered graph visualization
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Axios** - HTTP client for API calls
- **Lucide React** - Icon library

### Backend
- **FastAPI** - Modern Python web framework
- **SQLite** - Embedded relational database
- **Groq** - Fast LLM inference (Llama 3.3 70B Versatile)
- **Python 3.8+** - Programming language
- **Pydantic** - Data validation

## Key Design Decisions

### 1. Database Choice: SQLite

**Why SQLite over Neo4j/PostgreSQL?**

- **Zero infrastructure**: Single file database, no server setup required
- **Perfect for dataset size**: 21,000 rows across 19 tables is well within SQLite's capabilities
- **Fast JOINs**: SQLite handles relational queries efficiently at this scale
- **Portability**: Easy to share and deploy
- **Evaluator-friendly**: No database server installation needed

**When would we use Neo4j?**
- 10M+ nodes
- Complex graph algorithms (PageRank, community detection)
- Deep recursive queries (6+ levels)
- Real-time graph mutations

### 2. Graph Construction Strategy

**Runtime Graph Construction vs. Pre-built Graph**

We construct the graph at query time from relational data:

```python
# Pseudo-code
nodes = []
edges = []

# Query relational tables
orders = query("SELECT * FROM sales_order_headers")
deliveries = query("SELECT * FROM outbound_delivery_headers")

# Build nodes
for order in orders:
    nodes.append({"id": f"SO_{order.id}", "type": "SalesOrder"})

# Build edges from foreign keys
for delivery in deliveries:
    edges.append({
        "source": f"SO_{delivery.sales_order_id}",
        "target": f"DEL_{delivery.id}"
    })
```

**Benefits:**
- Flexible: Easy to change graph structure
- Efficient: Only load what's needed
- Maintainable: Single source of truth (SQLite)

### 3. LLM Prompting Strategy

**Two-Stage Approach**

**Stage 1: SQL Generation**
```
System Prompt: [Full schema + relationships + rules]
User: "Show me top 5 customers by order value"
LLM Response: {
  "sql": "SELECT c.businessPartnerName, SUM(o.totalNetAmount) as total...",
  "explanation": "Querying customers with highest order totals",
  "needs_data": true
}
```

**Stage 2: Answer Formatting**
```
System Prompt: [Same schema]
User: [Original question + SQL + Results (first 20 rows)]
LLM Response: "The top 5 customers by order value are:
1. Acme Corp - ₹2.5M
2. TechCo - ₹1.8M
..."
```

**Why two stages?**
- **Separation of concerns**: SQL generation vs. natural language formatting
- **Error handling**: Can catch SQL errors before formatting
- **Transparency**: Users see the SQL query
- **Debugging**: Easier to identify where issues occur

**Temperature settings:**
- Stage 1 (SQL): `temperature=0` for deterministic queries
- Stage 2 (Answer): `temperature=0.2` for natural but consistent responses

### 4. Guardrails Implementation

**Two-Layer Defense**

**Layer 1: Prompt-level**
```python
SYSTEM_PROMPT = """
RULES:
1. ONLY answer questions about this O2C dataset.
2. If the user asks anything unrelated, respond EXACTLY with:
   "This system is designed to answer questions related to the 
    provided Order-to-Cash dataset only."
"""
```

**Layer 2: Code-level**
```python
if "designed to answer questions related to the provided" in response:
    return {"answer": "This system is designed...", "sql": "", "data": []}
```

**Why both layers?**
- Prompt-level: Primary defense, works most of the time
- Code-level: Fallback for edge cases, ensures consistency

**Tested against:**
- General knowledge: "What is the weather?"
- Creative writing: "Write me a poem"
- Coding help: "How do I write a Python function?"
- Off-topic: "Tell me about politics"

### 5. Graph Modeling

**Node Types (7 total)**

| Type | Source | Key Field | Color | Size |
|------|--------|-----------|-------|------|
| Customer | business_partners | businessPartner | Red | 8 |
| SalesOrder | sales_order_headers | salesOrder | Blue | 6 |
| Product | products | product | Cyan | 5 |
| Delivery | outbound_delivery_headers | deliveryDocument | Green | 6 |
| Billing | billing_document_headers | billingDocument | Orange | 6 |
| JournalEntry | journal_entry_items_ar | accountingDocument | Pink | 5 |
| Payment | payments_accounts_receivable | accountingDocument | Purple | 7 |

**Edge Types (O2C Flow)**

```
Customer --[placed]--> SalesOrder
SalesOrder --[orders]--> Product
SalesOrder --[fulfilled by]--> Delivery
Delivery --[billed as]--> Billing
Billing --[posted to]--> JournalEntry
JournalEntry --[cleared by]--> Payment
```

**Relationship Mapping**

```sql
-- Sales Order → Delivery
outbound_delivery_items.referenceSdDocument = sales_order_headers.salesOrder

-- Delivery → Billing
billing_document_items.referenceSdDocument = outbound_delivery_items.deliveryDocument

-- Billing → Journal Entry
journal_entry_items_ar.referenceDocument = billing_document_headers.billingDocument

-- Journal Entry → Payment
payments_ar.clearingAccountingDocument = journal_entry_items_ar.accountingDocument
```

## Data Flow

### 1. Graph Visualization Flow

```
User opens app
    ↓
Frontend calls GET /api/graph
    ↓
Backend queries SQLite (19 tables)
    ↓
Backend constructs nodes and edges
    ↓
Backend returns JSON: {nodes: [...], edges: [...]}
    ↓
Frontend transforms to react-force-graph format
    ↓
Graph renders with force-directed layout
    ↓
User interacts (click, hover, zoom)
```

### 2. Query Flow

```
User types question: "How many sales orders?"
    ↓
Frontend sends POST /api/query {question, history}
    ↓
Backend sends to Groq LLM with schema
    ↓
LLM generates SQL: "SELECT COUNT(*) FROM sales_order_headers"
    ↓
Backend executes SQL on SQLite
    ↓
Backend gets results: [{count: 150}]
    ↓
Backend sends results back to LLM
    ↓
LLM formats answer: "There are 150 sales orders in the system."
    ↓
Backend returns {answer, sql, data}
    ↓
Frontend displays in chat interface
```

## Performance Considerations

### Frontend
- **Graph rendering**: Limited to 60 nodes per entity type (configurable)
- **WebGL acceleration**: react-force-graph-2d uses WebGL for smooth rendering
- **Lazy loading**: Chat history only renders visible messages
- **Debouncing**: Input changes don't trigger immediate API calls

### Backend
- **Query limits**: All queries limited to 50-60 rows to prevent overload
- **Connection pooling**: SQLite connections properly managed
- **Caching**: Could add Redis for frequently accessed graph data (future)
- **Async**: FastAPI runs async for better concurrency

### Database
- **Indexes**: Could add indexes on foreign keys for faster JOINs (future)
- **Query optimization**: SQLite query planner handles most optimizations
- **File size**: ~50MB database is easily manageable

## Security Considerations

### Current Implementation
- **CORS**: Allows all origins (development mode)
- **No authentication**: As per requirements
- **Input validation**: Pydantic models validate request data
- **SQL injection**: Parameterized queries prevent injection
- **LLM guardrails**: Prevents misuse of query interface

### Production Recommendations
- Restrict CORS to specific domains
- Add rate limiting
- Add authentication/authorization
- Add request logging
- Add monitoring and alerting
- Use environment-specific configs

## Scalability Path

### Current Scale
- 21,000 rows
- 19 tables
- 200-300 nodes in graph
- Single-user deployment

### Scale to 100K rows
- Add database indexes
- Implement pagination
- Add caching layer (Redis)
- Optimize graph queries

### Scale to 1M+ rows
- Consider PostgreSQL
- Add read replicas
- Implement graph database (Neo4j)
- Add message queue for async processing
- Implement graph clustering/sampling

## Testing Strategy

### Unit Tests (Recommended)
- Backend: Test each endpoint
- Frontend: Test components in isolation
- Database: Test query functions

### Integration Tests (Recommended)
- Test full query flow
- Test graph construction
- Test error handling

### E2E Tests (Recommended)
- Test user workflows
- Test guardrails
- Test edge cases

### Manual Testing (Current)
- See TEST_CHECKLIST.md
- Covers all functional requirements
- Includes guardrail testing

## Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend)
- Frontend: Deploy to Vercel (free tier)
- Backend: Deploy to Railway (free tier)
- Database: Include o2c.db in backend deployment

### Option 2: Single Server (DigitalOcean/AWS)
- Deploy both frontend and backend on single VPS
- Use nginx as reverse proxy
- Serve frontend as static files

### Option 3: Docker Compose
- Containerize both services
- Deploy to any cloud provider
- Easy to scale horizontally

## Future Enhancements

### High Priority
1. **Node highlighting in chat**: Highlight referenced nodes when mentioned in answers
2. **Conversation memory**: Maintain context across multiple queries
3. **Export functionality**: Export graph as image or data
4. **Advanced filters**: Filter graph by date range, status, etc.

### Medium Priority
1. **Streaming responses**: Stream LLM responses for better UX
2. **Query history**: Save and recall previous queries
3. **Graph clustering**: Group related nodes visually
4. **Custom views**: Save and load different graph configurations

### Low Priority
1. **Dark mode**: Add theme toggle
2. **Mobile responsive**: Optimize for mobile devices
3. **Keyboard shortcuts**: Add power user features
4. **Accessibility**: WCAG compliance

## Conclusion

This architecture balances simplicity, functionality, and scalability. The choice of SQLite and runtime graph construction makes the system easy to deploy and evaluate while maintaining the flexibility to scale to more complex solutions as needed.

The two-stage LLM prompting strategy ensures accurate SQL generation and natural language responses, while the guardrails prevent misuse. The React-based frontend provides a clean, interactive interface for exploring the O2C process.
