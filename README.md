# AI Search Optimizer

A local MVP web app that demonstrates **AI Search Optimization** for LLMs. Given a user question, the system searches the web, selects relevant pages, extracts evidence, and produces:

1. **A cited answer** - grounded in the sources with numbered citations
2. **AI Search Optimization tips** - actionable recommendations for how websites can improve their visibility in LLM-powered search

![Screenshot](https://via.placeholder.com/800x400?text=AI+Search+Optimizer+Screenshot)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed ([download](https://nodejs.org/))
- npm (comes with Node.js)

### One-Command Setup

```bash
# Clone or download the project, then:
cd ai-search-optimizer
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser.

That's it! The app works immediately with **no API keys required**.

## 📋 Features

### Core Functionality

- **Web Search** - Uses DuckDuckGo (free, no API key) with optional SerpAPI/Tavily support
- **Content Extraction** - Fetches pages, extracts main content using Readability algorithm
- **Evidence Ranking** - BM25 algorithm ranks most relevant snippets for the query
- **Answer Synthesis** - Generates cited answers (template-based or AI-powered with OpenAI)
- **Optimization Analysis** - Analyzes page quality signals and generates actionable tips

### Quality Features

- **Caching** - In-memory cache prevents redundant fetches (5-minute TTL)
- **Rate Limiting** - Basic protection against abuse (10 requests/minute)
- **Error Handling** - Graceful degradation with informative error messages
- **Loading States** - Clear feedback during processing

## 🔧 Configuration

### Optional API Keys

The app works without any API keys, but you can enhance it:

Create a `.env.local` file (copy from `.env.example`):

```env
# Better search quality (choose one):
SERPAPI_KEY=your_serpapi_key     # 100 free searches/month
TAVILY_API_KEY=your_tavily_key   # 1000 free searches/month

# AI-powered answer synthesis:
OPENAI_API_KEY=your_openai_key   # For GPT-based answers
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CACHE_TTL` | 300 | Cache time-to-live in seconds |
| `MAX_CONCURRENT_FETCHES` | 3 | Max parallel page fetches |
| `FETCH_TIMEOUT` | 10000 | Request timeout in milliseconds |

## 📖 How It Works

### Pipeline

```
User Question
     ↓
┌─────────────────┐
│  Web Search     │  DuckDuckGo / SerpAPI / Tavily
└────────┬────────┘
         ↓
┌─────────────────┐
│  Fetch Pages    │  Parallel with rate limiting
└────────┬────────┘
         ↓
┌─────────────────┐
│  Extract Text   │  Readability algorithm
└────────┬────────┘
         ↓
┌─────────────────┐
│  Rank Evidence  │  BM25 scoring
└────────┬────────┘
         ↓
┌─────────────────┐
│  Synthesize     │  Template or GPT
└────────┬────────┘
         ↓
┌─────────────────┐
│  Analyze & Tips │  Quality signals
└────────┬────────┘
         ↓
    Response
```

### BM25 Ranking

The app uses [BM25](https://en.wikipedia.org/wiki/Okapi_BM25), a proven information retrieval algorithm that:
- Considers term frequency with saturation (repeated words have diminishing returns)
- Normalizes for document length
- Uses IDF (inverse document frequency) to weight rare terms higher

### Quality Signals Analyzed

| Signal | What We Check |
|--------|---------------|
| Structured Data | Schema.org/JSON-LD presence |
| Metadata | Title and description quality |
| Content Structure | Heading hierarchy |
| Content Depth | Word count |
| Performance | Page load time |
| Citation Worthiness | Clear, factual statements |

## 📁 Project Structure

```
ai-search-optimizer/
├── app/
│   ├── api/answer/route.ts   # Main API endpoint
│   ├── page.tsx              # React UI
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Tailwind styles
├── lib/
│   ├── search.ts             # Web search (DDG/SerpAPI/Tavily)
│   ├── fetch.ts              # Page fetching & extraction
│   ├── extract.ts            # Evidence ranking (BM25)
│   ├── synthesize.ts         # Answer generation
│   ├── optimize.ts           # Optimization tips
│   ├── cache.ts              # In-memory caching
│   └── types.ts              # TypeScript types
├── __tests__/
│   └── rank.test.ts          # Unit tests
├── .env.example              # Environment template
└── README.md
```

## 🧪 Testing

```bash
npm test
```

Runs Jest tests for the ranking and tokenization logic.

## 📝 Example Usage

### Input
```
Question: What are the benefits of meditation?
Depth: 5 sources
```

### Output

**Answer:**
> Based on multiple sources:
> 
> • Meditation can help reduce stress and anxiety levels [1]
> 
> • Regular practice has been shown to improve focus and concentration [2]
> 
> • Studies indicate meditation may help with sleep quality [3]

**Sources:**
1. Healthline - Benefits of Meditation (Score: 4.2)
2. Mayo Clinic - Meditation Overview (Score: 3.8)
3. Harvard Health - How Meditation Helps (Score: 3.5)

**Optimization Tips:**
- HIGH: Add Schema.org structured data for FAQPage
- MEDIUM: Include more specific statistics and citations
- LOW: Improve page load time (currently 3.2s)

## 🗺️ Roadmap

What to add for a real product:

### Phase 1: Core Improvements
- [ ] User authentication (Clerk/NextAuth)
- [ ] Save reports to database (PostgreSQL/Prisma)
- [ ] Better search deduplication
- [ ] PDF report export

### Phase 2: Domain Analysis
- [ ] Domain audit mode (analyze your own site)
- [ ] Competitor comparison
- [ ] Historical tracking over time
- [ ] Scheduled monitoring alerts

### Phase 3: Advanced Features
- [ ] Custom AI prompts for synthesis
- [ ] Multi-language support
- [ ] API access for integrations
- [ ] Chrome extension for real-time analysis

### Phase 4: Scale
- [ ] Redis caching
- [ ] Queue-based processing (BullMQ)
- [ ] CDN for static assets
- [ ] Multi-region deployment

## 🛠️ Development

### Key Files to Modify

| Need | File |
|------|------|
| Change search logic | `lib/search.ts` |
| Modify content extraction | `lib/fetch.ts` |
| Adjust ranking algorithm | `lib/extract.ts` |
| Customize answer format | `lib/synthesize.ts` |
| Add new optimization tips | `lib/optimize.ts` |
| Change UI | `app/page.tsx` |

### Adding a New Search Backend

1. Add your function to `lib/search.ts`:
```typescript
async function searchWithNewAPI(query: string, depth: number): Promise<SearchResult[]> {
  // Your implementation
}
```

2. Update the `webSearch` function to check for your API key:
```typescript
if (process.env.NEW_API_KEY) {
  return searchWithNewAPI(query, options.depth);
}
```

## 📜 License

MIT License - feel free to use this for any purpose.

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## ⚠️ Disclaimer

This is an educational MVP demonstrating AI search optimization concepts. It:
- Respects robots.txt where possible
- Uses modest rate limiting
- Does not guarantee search result accuracy
- Should not be used for commercial scraping at scale

---

Built with ❤️ to help understand how AI systems discover and cite web content.
