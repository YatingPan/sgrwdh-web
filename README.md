# SGRWDH — Sources of the Greco-Roman World & Digital Humanities

A web interface for browsing, searching, and visualising a structured database of ancient Greek and Roman authors, their works, and the manuscript / fragmentary sources that transmit them.

Built as part of the **PKU SGRWDH** course and research project (Peking University Digital Humanities Center, with Dutch partners and the University of Missouri). The dataset is curated by hand by students and supplemented by an LLM agent that drafts new lemmata against the Trismegistos and CIRIS authority files.

> **Live (private preview):** [https://sgrwdh.org](https://sgrwdh.org) — Basic-Auth gated; ask the maintainer for credentials.

---

## What you can do here

- **Browse authors and works** with biographical summaries, genre/language filters, and links out to Trismegistos, CIRIS, and other standard reference systems.
- **Search** across the database in two modes: classical-philology abbreviation lookup (`Hdt. 1.32` → Herodotus, *Histories*, Book 1.32) and natural-language semantic search powered by pgvector embeddings.
- **Visualise** authors and works on an interactive D3 timeline, plus aggregate charts for language distribution and century coverage.
- **Cite** any record with a one-click Chicago-style citation and a stable URI.
- **Audit data quality** through the `/data-quality` dashboard, which surfaces missing fields, broken external links, and orphaned entries.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16** (App Router, RSC) on **React 19** |
| Styling | **Tailwind CSS v4** |
| Database | **Supabase** (Postgres + Row Level Security + `pgvector`) |
| Embeddings | **SiliconFlow** (BGE-M3) |
| Conversational search | **DeepSeek** chat completions |
| Charts | **D3** + **Recharts** |
| Auth gate | HTTP Basic via Next.js proxy middleware |
| Language | TypeScript 5 |

> **Heads up:** Next.js 16 renames `middleware.ts` → `proxy.ts` and ships breaking changes. See [`AGENTS.md`](AGENTS.md) — read `node_modules/next/dist/docs/` before touching app routing.

---

## Getting started

### Prerequisites

- **Node.js** ≥ 20
- **Docker Desktop** (for local Supabase)
- **Supabase CLI** — invoked via `npx supabase` (no global install needed)
- For the data-import script only: **PowerShell** + **Microsoft Access Database Engine** (Windows). Other platforms can skip this step and use the committed `src/data/dataset.json` as-is.

### 1. Install

```bash
git clone <repo-url>
cd sgrwdh-web
npm install
```

### 2. Configure environment

Create `.env.local` at the project root:

```bash
# Supabase — local dev values come from `npx supabase status`
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-supabase-status>

# Search & embeddings (optional in dev — keyword search still works without them)
SILICONFLOW_API_KEY=sk-...
DEEPSEEK_API_KEY=sk-...

# Site password gate (leave unset locally; set on Vercel for the private preview)
# SITE_USERNAME=sgrwdh
# SITE_PASSWORD=...
```

### 3. Boot the stack

```bash
# 1. Start Docker Desktop and wait for "Engine running".

# 2. Start local Supabase (Postgres + Studio in containers).
npx supabase start

# 3. Apply schema and seed data.
#    Connect to the Postgres URL printed by `supabase start`, then:
psql "$DATABASE_URL" -f scripts/pgvector.sql
psql "$DATABASE_URL" -f scripts/schema.sql
psql "$DATABASE_URL" -f scripts/seed.sql

# 4. (Optional) Generate vector embeddings for semantic search.
npx tsx scripts/generate-embeddings.ts

# 5. Run the dev server.
npm run dev
```

Now open:

| URL | What |
|---|---|
| <http://localhost:3000> | The app |
| <http://127.0.0.1:54323> | Supabase Studio (inspect tables, run SQL) |

To shut down the database containers between sessions:

```bash
npx supabase stop
```

### Build & start (production)

```bash
npm run build
npm run start
```

---

## Project layout

```
sgrwdh-web/
├── src/
│   ├── app/                  # Next.js App Router routes
│   │   ├── about/            # Project background and credits
│   │   ├── api/
│   │   │   ├── search/       # Hybrid keyword + semantic search endpoint
│   │   │   └── stats/        # Aggregate counts for the dashboard
│   │   ├── authors/          # Authors list + detail (`[id]`)
│   │   ├── works/            # Works list + detail (`[id]`)
│   │   ├── timeline/         # D3 interactive timeline
│   │   ├── search/           # Search UI
│   │   ├── data-quality/     # Curator-facing QA dashboard
│   │   └── layout.tsx        # Navbar + Footer chrome
│   ├── components/           # AuthorCard, WorkCard, Timeline, charts, citation tools…
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client (anon, public-read)
│   │   ├── embedding.ts      # SiliconFlow BGE-M3 wrapper
│   │   ├── classical-abbreviations.ts  # `Hdt.` → Herodotus etc.
│   │   ├── cached-queries.ts # React-cache-wrapped data accessors
│   │   ├── timeline-style.ts # Shared visual constants for D3 layers
│   │   ├── data-store.ts     # Static fallback loader for dataset.json
│   │   └── types.ts          # Author / Work / Period / Source interfaces
│   ├── data/
│   │   └── dataset.json      # Snapshot used as offline fallback
│   ├── styles/               # Tailwind layer files
│   └── proxy.ts              # Site-wide Basic-Auth gate (Next 16 middleware)
├── scripts/
│   ├── schema.sql            # Five-table relational schema + RLS + FTS
│   ├── pgvector.sql          # `CREATE EXTENSION vector` + embedding columns
│   ├── seed.sql              # Initial author/work seed
│   ├── extract-real-data.ps1 # Imports student `.accdb` / `.xlsx` → dataset.json
│   └── generate-embeddings.ts# Backfills BGE-M3 vectors for semantic search
├── supabase/
│   └── config.toml           # `supabase start` configuration
├── public/                   # Static assets
└── design-preview.html       # Standalone style/design reference
```

---

## Data model

Five tables mirror the canonical SGRWDH lemma schema (full DDL in [`scripts/schema.sql`](scripts/schema.sql)):

| Table | Row = | Key fields |
|---|---|---|
| `authors` | One ancient author | `author_name`, `life` (≤100 w bio), `language`, TM/CIRIS IDs |
| `works` | One work attributed to an author | `work_title`, `synopsis`, `genre`, `is_fragmentary`, `author_id` |
| `parts_of_works` | A book / fragment / papyrus inside a work | `work_title`, `synopsis`, `work_id` |
| `periods` | A dated span attached to an author or work | `start_year_earliest…end_year_latest` (BCE = negative), `period_type` |
| `sources` | A bibliographic citation | `source_type` ∈ {Bibliography, Edition, Commentary, Translation, Original+Translation}, `source_information` (Chicago-formatted) |

Row Level Security is on for all five tables, with a public read policy. Writes go through Supabase service-role keys — never expose the service role to the browser.

Generated tsvector columns power keyword search; pgvector columns (added by `pgvector.sql` and filled by `generate-embeddings.ts`) power semantic search.

---

## Refreshing the data

When students hand in new lemmata as `.accdb` or `.xlsx` files:

```powershell
# From sgrwdh-web/, on Windows:
powershell -ExecutionPolicy Bypass -File scripts/extract-real-data.ps1

# Custom paths:
powershell -ExecutionPolicy Bypass -File scripts/extract-real-data.ps1 `
    -InputDir "C:\path\to\submissions" `
    -OutputFile "src\data\other.json"
```

The script writes `src/data/dataset.json`. Re-seed Supabase from there (or extend `seed.sql`), then re-run `generate-embeddings.ts`.

---

## Deployment

Designed for **Vercel**:

1. Import the repo on Vercel.
2. Set every variable from your `.env.local`, plus a hosted `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` pointing at your production Supabase project.
3. Set `SITE_USERNAME` and `SITE_PASSWORD` to enable the Basic-Auth gate. The gate auto-disables when `SITE_PASSWORD` is unset, so local dev stays open.

For the production database, run `scripts/pgvector.sql` → `scripts/schema.sql` → seed → `generate-embeddings.ts` against the hosted Supabase instance once.

---

## Contributing

Pull requests welcome. Before opening one:

- Read [`AGENTS.md`](AGENTS.md) — Next.js 16 has surprises.
- Run `npm run build` locally; the build is the type-check.
- Keep RLS on. New tables need explicit `Public read` policies if you want them queryable from the client.

---

## License & attribution

Code is released under the MIT License (see `LICENSE` if present).

The underlying lemma data is curated by the SGRWDH 2025–2026 cohort at PKU and remains the academic work of its student authors and instructors. Cite individual records using the on-page **Cite** button.

External authority systems linked from this app — **Trismegistos**, **CIRIS**, **Perseus**, **VIAF** — retain their respective licenses; this project only stores identifiers and URIs, not their content.

---

## Contact

Maintainer: **Yating Pan** — `panyating0322@gmail.com`
Course: PKU SGRWDH 2025–2026 Spring (S2)
