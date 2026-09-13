# 8EH Radio ITB

[Live site](https://8ehradioitb.com)

8EH Radio ITB is a deployed web platform for a campus radio organization. It combines live audio, podcasts, articles, programs, announcer profiles, event forms, media-partner services, and an authenticated editorial dashboard.

The project also includes AI-assisted workflows for public questions and newsroom content production.

## What this project demonstrates

- Full-stack product development with the Next.js App Router.
- Streaming AI responses for a public radio chatbot.
- Dynamic context assembly from recent articles and podcasts.
- Role-protected content tools for drafting, editing, translation, summaries, and tags.
- Prisma data modeling with MongoDB.
- Authentication, media workflows, event forms, exports, short links, and analytics.

## AI and content pipeline

The platform includes an AI chatbot for public questions and role-protected editorial tools for newsroom content production.

- Vercel AI SDK integration with Groq and Google models;
- streaming public Q&A with radio-specific knowledge and recent database content;
- inference endpoints for article drafts, outlines, title ideas, editing, translation, summarization, and tags; and
- rate limiting for public AI endpoints and role checks for editorial tools.

## AI pipeline

```text
Visitor question
       |
       v
Next.js API route
       |
       +-- rate limit by client IP
       +-- load recent articles and podcasts
       +-- add 8EH Radio knowledge context
       v
Groq streaming response
       |
       v
Chat widget in the public website
```

Editorial AI tools use authenticated role checks and Google Gemini for actions such as:

- article title generation;
- article outlines and first drafts;
- editing and translation;
- SEO-style summaries; and
- tag suggestions.

## Main routes

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/ai/chat` | Public streaming Q&A with dynamic content context |
| POST | `/api/ai/tldr` | Public article TL;DR generation |
| POST | `/api/ai/blog` | Authenticated title, outline, draft, edit, and translation tools |
| POST | `/api/ai/summarize` | Authenticated article description generation |
| POST | `/api/ai/tags` | Authenticated article tag suggestions |
| GET, POST | `/api/blog` | Read and create blog content with role checks |
| GET, POST | `/api/events` | Manage events and form workflows |

## Architecture

```text
Next.js 15 and React 19
  public radio site, dashboard, chat widget, forms, media pages
          |
          +-- Vercel AI SDK
          |     +-- Groq
          |     +-- Google Gemini
          |
          +-- NextAuth Google OAuth
          |
          +-- Prisma ORM
                |
                +-- MongoDB
```

## Technology

- **Frontend:** Next.js 15, React 19, JavaScript, TypeScript, Tailwind CSS, SWR
- **AI:** Vercel AI SDK, Groq, Google Gemini, streamed responses
- **Backend:** Next.js route handlers, NextAuth, Prisma
- **Data and storage:** MongoDB, Cloudflare R2 support, audio and image assets
- **Deployment:** Vercel-compatible build with `bun run build`

## Run locally

Requirements:

- Bun 1.3 or newer
- MongoDB
- Google OAuth credentials for authenticated dashboard features

Install dependencies and start the development server:

```bash
bun install
bun dev
```

Open `http://localhost:3000`.

Create local environment variables for the features you use:

```env
MONGODB_URL=mongodb://localhost:27017/8eh-radio
NEXTAUTH_SECRET=replace-with-a-local-secret
GOOGLE_CLIENT_ID=replace-with-google-client-id
GOOGLE_CLIENT_SECRET=replace-with-google-client-secret
GROQ_API_KEY=replace-with-groq-key
GOOGLE_GENERATIVE_AI_API_KEY=replace-with-google-ai-key
```

Media uploads, radio streaming, and production deployment require additional storage and stream configuration. Never commit secrets to the repository.

## Useful commands

```bash
bun dev
bun run build
bun run lint
bun run format
```

## Current limitations

- Public AI rate limits are stored in memory, so production deployments should use a shared limiter such as Redis.
- AI-generated content should be reviewed by an editor before publication.
- Media uploads and stream configuration require deployment-specific credentials.
- Authentication, storage, and content data should be configured with production privacy and retention policies.

## License

This project is released under the [MIT License](./LICENSE).
