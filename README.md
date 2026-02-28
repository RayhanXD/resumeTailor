# AI Cover Letter Agent

A simple Next.js application that helps you generate cover letters for any job description using Google's Gemini AI.

## Features

- **Resume Upload**: Upload your resume PDF once and store it in browser localStorage
- **Cover Letter Generation**: Create personalized cover letters based on your resume and job requirements
- **Dark Theme**: Clean, modern UI with dark theme
- **Download & Copy**: Easy export options for generated cover letters

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Gemini AI** - AI agent with tool-based architecture
- **pdfjs-dist** - PDF text extraction
- **Vercel AI SDK** - AI integration

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Google AI API key ([Get one here](https://makersuite.google.com/app/apikey))

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
   GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
   SERPER_API_KEY=your_serper_api_key_here
   ```

   - Get a Google AI API key [here](https://makersuite.google.com/app/apikey)
   - Get a Serper API key [here](https://serper.dev/) (used for company research)

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## How to Use

1. **Upload Resume**: Click to upload your resume PDF (one time)
2. **Paste Job Description**: Copy and paste any job description into the textarea
3. **Generate**: Click the "Generate" button
4. **Get Results**: View your generated cover letter
5. **Export**: Copy to clipboard or download as a text file

## Project Structure

```
app/
  page.tsx                  # Main UI
  api/generate/route.ts     # API endpoint for AI generation

components/
  upload-zone.tsx           # Resume upload component
  output-panel.tsx          # Output display with copy/download
  ui/                       # shadcn components

lib/
  utils.ts                  # shadcn utilities
  pdf-parser.ts             # PDF text extraction
  ai-agent.ts               # Gemini AI agent with tools
```

## How It Works

1. **PDF Parsing**: Uses `pdfjs-dist` to extract text from uploaded resume
2. **Storage**: Resume text is stored in browser localStorage for persistence
3. **AI Agent**: Gemini model with one generation tool:
   - `writeCoverLetter`: Generates personalized cover letter using resume context and company research
4. **API Route**: Next.js API route handles AI calls server-side
5. **UI**: Clean interface with real-time updates and export options

## Workshop Notes

What this project covers:

- File handling in Next.js
- AI agent architecture with tools
- localStorage for session persistence
- shadcn/ui component usage
- Vercel AI SDK integration

### Where to Look

To complete the workshop assignment, focus on these key files:

1. **`app/page.tsx`** - The main UI component. Understand how the frontend interacts with the API and handles user input.

2. **`app/api/generate/route.ts`** - The API endpoint that receives requests and calls the AI agent. See how the backend processes requests.

3. **`lib/ai-agent.ts`** - **This is where most of your work will be.** This file contains the AI agent logic, tools, and prompts. You'll modify this file to customize the agent's behavior and capabilities.

4. **`.env.local`** - Make sure to add your `SERPER_API_KEY` here to enable the company research tool.

### Helpful Resources

These documentation links will help you complete the assignment:

- [Generating Text with AI SDK](https://ai-sdk.dev/docs/ai-sdk-core/generating-text) - Learn how to use the `generateText` function
- [Tools and Tool Calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling) - Learn how to define and use tools with AI agents

## License

MIT
