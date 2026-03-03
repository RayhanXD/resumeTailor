# Resume Tailor

An agentic platform that tailors your LaTeX resume to any job description using LangGraph.js. Paste your resume source, add the job description, and get bullet points and technical skills optimized for the role.

## Features

- **LaTeX in, LaTeX out**: Preserves your exact resume format; only rewrites bullet content
- **Multi-agent pipeline**: Company research, job analysis, recruiter lens, tailor, and critic nodes
- **Smart tailoring**: XYZ format, no buzzwords, line-length optimization, skills reordering
- **Optional Workday URL**: Auto-fill company and job description from Workday job postings
- **Modular backend**: OpenAI by default; swap to other providers via env vars

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **LangGraph.js** - Multi-node agent orchestration
- **LangChain** - Model abstraction (OpenAI, extensible)
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key (for GPT-4o)
- Serper API key (optional, for company research)

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file:

   ```bash
   cp .env.local.example .env.local
   ```

4. Add your API keys to `.env.local`:

   ```
   OPENAI_API_KEY=your_openai_api_key_here
   SERPER_API_KEY=your_serper_api_key_here
   ```

   - Get an OpenAI API key [here](https://platform.openai.com/api-keys)
   - Get a Serper API key [here](https://serper.dev/) (for company research)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for resume tailoring |
| `LLM_PROVIDER` | No | `openai` (default). Future: `anthropic`, `google` |
| `OPENAI_MODEL` | No | Model name (default: `gpt-4o`) |
| `LLM_TEMPERATURE` | No | Temperature for generations (default: `0.2`) |
| `SERPER_API_KEY` | No | For company research. Omit to skip. |
| `DEBUG_TAILOR_RESPONSE` | No | Set to `true` to include debug fields in API response |

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## How to Use

1. **Paste LaTeX resume**: Paste your LaTeX source (or upload a `.tex` file)
2. **Add job info**: Paste a Workday URL to auto-fill, or enter company name and job description manually
3. **Tailor**: Click "Tailor Resume"
4. **Export**: Copy or download the tailored LaTeX as `resume-tailored.tex`

## Project Structure

```
app/
  page.tsx                     # Main UI (LaTeX input, job form, output)
  api/
    tailor-resume/route.ts     # POST: invokes LangGraph, returns tailored LaTeX
    parse-workday/route.ts     # POST: fetches job data from Workday URL

components/
  latex-resume-input.tsx       # LaTeX textarea + .tex/PDF upload
  workday-url-input.tsx        # Workday URL input
  output-panel.tsx             # Copy/download tailored LaTeX
  ui/                          # shadcn components

lib/
  models/index.ts              # Model getter (OpenAI, modular)
  graph/resume-tailor-graph.ts # LangGraph state, nodes, edges
  latex/parse.ts               # Parse LaTeX → bullets, skills
  latex/reconstruct.ts         # Reconstruct LaTeX from tailored content
  research-company.ts          # Serper-based company research
  workday-parser.ts            # Workday URL parsing
  pdf-parser.ts                # PDF text extraction (for import)
```

## How It Works

1. **Parse**: LaTeX is parsed into bullet points and a technical skills line
2. **Research**: Serper fetches company mission, culture, and values (if company name provided)
3. **Analyze job**: LLM extracts skills, responsibilities, and qualifications
4. **Recruiter lens**: LLM identifies what recruiters screen for
5. **Tailor**: LLM rewrites bullets and skills using XYZ format, no buzzwords, job alignment
6. **Critic**: LLM evaluates quality; loops back to tailor if improvements needed
7. **Reconstruct**: Tailored content is merged back into original LaTeX structure

## Model Recommendations

- **Primary**: GPT-4o – Best instruction-following and nuanced rewriting
- **Cost option**: Set `OPENAI_MODEL=gpt-4o-mini` for cheaper runs (lower quality)
- **Future**: Add Anthropic/Google providers in `lib/models/index.ts`

## License

MIT
