# AI Resume & Cover Letter Agent

A simple Next.js application that helps you tailor your resume and generate cover letters for any job description using Google's Gemini AI.

## Features

- **Resume Upload**: Upload your resume PDF once and store it in browser localStorage
- **AI-Powered Tailoring**: Automatically tailor your resume to match job descriptions
- **Cover Letter Generation**: Create personalized cover letters based on your resume and job requirements
- **Dark Theme**: Clean, modern UI with dark theme
- **Download & Copy**: Easy export options for generated documents

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

4. Add your Google AI API key to `.env.local`:
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
   ```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## How to Use

1. **Upload Resume**: Click to upload your resume PDF (one time)
2. **Paste Job Description**: Copy and paste any job description into the textarea
3. **Generate**: Click the "Generate" button
4. **Get Results**: View your tailored resume and cover letter side by side
5. **Export**: Copy to clipboard or download as text files

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
3. **AI Agent**: Gemini model with two tools:
   - `tailorResume`: Matches resume to job description keywords and requirements
   - `writeCoverLetter`: Generates personalized cover letter
4. **API Route**: Next.js API route handles AI calls server-side
5. **UI**: Clean interface with real-time updates and export options

## Workshop Notes

This project is designed as a 1-2 hour workshop demonstrating:
- File handling in Next.js
- AI agent architecture with tools
- localStorage for session persistence
- shadcn/ui component usage
- Vercel AI SDK integration

## License

MIT
