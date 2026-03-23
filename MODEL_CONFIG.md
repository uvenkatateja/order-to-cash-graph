# LLM Model Configuration

## Current Model

**Model:** `llama-3.3-70b-versatile`  
**Provider:** Groq  
**Context Window:** 128K tokens  
**Speed:** Very fast inference (~500 tokens/sec)  
**Cost:** Free tier available

## Why This Model?

1. **SQL Generation Excellence** - Llama 3.3 70B is highly capable at generating accurate SQL queries from natural language
2. **Fast Inference** - Groq's LPU architecture provides near-instant responses
3. **Large Context** - 128K context window handles our full schema + conversation history
4. **Free Tier** - Generous free tier for development and testing

## Alternative Models

If you want to use a different model, edit `backend/main.py`:

### Option 1: Groq's Llama 3.1 70B
```python
model="llama-3.1-70b-versatile"
```

### Option 2: Groq's Mixtral
```python
model="mixtral-8x7b-32768"
```

### Option 3: Groq's Gemma 2
```python
model="gemma2-9b-it"
```

## Model Deprecation Notice

⚠️ **Important:** The previous model `llama3-70b-8192` has been decommissioned by Groq.

If you see this error:
```
Error code: 400 - {'error': {'message': 'The model `llama3-70b-8192` has been decommissioned...'}}
```

Make sure you're using `llama-3.3-70b-versatile` instead.

## Configuration Locations

The model is referenced in two places in `backend/main.py`:

1. **SQL Generation (Line ~283):**
```python
resp = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=messages,
    temperature=0,
    max_tokens=1000,
)
```

2. **Answer Formatting (Line ~334):**
```python
resp2 = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=follow_up,
    temperature=0.2,
    max_tokens=800,
)
```

## Temperature Settings

- **SQL Generation:** `temperature=0` - Deterministic, consistent SQL queries
- **Answer Formatting:** `temperature=0.2` - Slightly more natural language variation

## Getting Your API Key

1. Go to https://console.groq.com
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Add it to `backend/.env`:
   ```
   GROQ_API_KEY=gsk_your_key_here
   ```

## Rate Limits (Free Tier)

- **Requests per minute:** 30
- **Requests per day:** 14,400
- **Tokens per minute:** 6,000

For production use, consider upgrading to a paid plan.

## Troubleshooting

### Error: "Invalid API Key"
- Check your `.env` file has the correct key
- Verify the key is active in Groq console
- Make sure there are no extra spaces or quotes

### Error: "Rate limit exceeded"
- Wait 60 seconds and try again
- Consider implementing request queuing
- Upgrade to paid tier for higher limits

### Error: "Model not found"
- Verify you're using `llama-3.3-70b-versatile`
- Check Groq's model list: https://console.groq.com/docs/models
- Update to the latest model if deprecated

## Performance Tips

1. **Keep schema concise** - Only include necessary table information
2. **Limit result sets** - Use `LIMIT` in SQL queries
3. **Cache common queries** - Store frequently asked questions
4. **Batch requests** - Group multiple queries when possible

## Monitoring

Check your usage at: https://console.groq.com/usage

Monitor:
- Request count
- Token usage
- Error rates
- Response times
