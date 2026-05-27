# JobFlow AI

> AI-powered job application management system — Next.js, Supabase, Claude AI.

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in your values:
- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project settings
- `ANTHROPIC_API_KEY` — from console.anthropic.com

### 3. Database Setup

In your Supabase SQL editor, paste and run the contents of `supabase/schema.sql`.

### 4. Seed Data (Optional)

Edit `supabase/seed.sql`, replace `YOUR_USER_ID_HERE` with your auth user ID, then run it.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Features

| Feature | Description |
|---------|-------------|
| Kanban Board | Drag-and-drop pipeline with 11 status stages |
| Table View | Sortable table with bulk actions |
| AI Match Score | Claude AI analyzes your CV vs job description |
| AI Cover Letters | Personalized cover letters generated in seconds |
| AI Interview Prep | Tailored interview questions per role |
| AI Job Summary | Condense job descriptions into bullet points |
| Timeline | Automatic activity log for every status change |
| Notes | Rich notes per application with pinning |
| File Uploads | Resume, cover letters, certificates via Supabase Storage |
| Reminders | Follow-up and interview reminders |
| Analytics | Response rates, funnel visualization, source breakdown |
| Dark Mode | System/light/dark theme toggle |
| Export | CSV export of all applications |
| Tags | Color-coded tags for organization |
| AI Extract | Paste a job posting to auto-fill all fields |

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + React + TypeScript
- **Styling**: Tailwind CSS v4 + Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Anthropic Claude API (claude-sonnet-4-6)
- **Charts**: Recharts
- **DnD**: @hello-pangea/dnd
- **State**: Zustand

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + K | Open global search |
| Ctrl/Cmd + N | Quick add new application |
| Escape | Close search / modals |

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── dashboard/        # Dashboard with stats & charts
│   ├── applications/     # List + [id] detail page
│   ├── analytics/        # Analytics charts
│   ├── reminders/        # Reminders
│   ├── bookmarks/        # Bookmarked jobs
│   ├── archive/          # Archived applications
│   ├── tags/             # Tag management
│   ├── settings/         # User settings
│   ├── auth/             # Login, signup, callback
│   └── api/ai/chat/      # Claude AI API route
├── components/
│   ├── ai/               # AI sidebar + application panel
│   ├── applications/     # Kanban, table, cards, detail, notes, files
│   ├── dashboard/        # Stats cards, charts, activity feed
│   ├── layout/           # Sidebar, header, app layout
│   └── ui/               # Button, input, dialog, select...
├── lib/
│   ├── ai/claude.ts      # AI service functions
│   ├── db/               # Supabase query functions
│   ├── supabase/         # Client / server / middleware
│   ├── types.ts          # TypeScript types
│   ├── constants.ts      # Status config, enums
│   └── utils.ts          # Helper utilities
└── store/
    └── useAppStore.ts    # Zustand global state
supabase/
├── schema.sql            # Full DB schema + RLS policies
└── seed.sql              # Example data
```
