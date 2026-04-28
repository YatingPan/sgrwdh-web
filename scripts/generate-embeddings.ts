/**
 * One-time script: generate embeddings for all authors and works.
 *
 * Usage:
 *   npx tsx scripts/generate-embeddings.ts
 *
 * Requires .env.local to be loaded. You can use:
 *   npx dotenv -e .env.local -- npx tsx scripts/generate-embeddings.ts
 * Or install dotenv and it will load automatically below.
 */

import { createClient } from '@supabase/supabase-js'

// Load .env.local manually
import { readFileSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(__dirname, '..', '.env.local')
try {
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex)
    const value = trimmed.slice(eqIndex + 1)
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
} catch {
  console.log('Could not read .env.local, using existing env vars')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const siliconflowKey = process.env.SILICONFLOW_API_KEY!

if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  console.error('Error: Set NEXT_PUBLIC_SUPABASE_URL in .env.local')
  process.exit(1)
}
if (!siliconflowKey || siliconflowKey.includes('placeholder')) {
  console.error('Error: Set SILICONFLOW_API_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch('https://api.siliconflow.cn/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${siliconflowKey}`,
    },
    body: JSON.stringify({
      model: 'BAAI/bge-m3',
      input: text.slice(0, 8000),
      encoding_format: 'float',
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`SiliconFlow API error (${res.status}): ${errText}`)
  }

  const data = await res.json()
  return data.data[0].embedding
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  console.log('=== SGRWDH Embedding Generation ===\n')

  // --- Authors ---
  const { data: authors, error: authErr } = await supabase
    .from('authors')
    .select('id, author_name, life')
    .is('embedding', null)

  if (authErr) {
    console.error('Failed to fetch authors:', authErr.message)
    process.exit(1)
  }

  console.log(`Found ${authors.length} authors without embeddings`)

  for (const author of authors) {
    const text = `Author: ${author.author_name}. ${author.life || ''}`
    try {
      console.log(`  Embedding author ${author.id}: ${author.author_name}...`)
      const embedding = await getEmbedding(text)

      const { error } = await supabase
        .from('authors')
        .update({ embedding: JSON.stringify(embedding) })
        .eq('id', author.id)

      if (error) {
        console.error(`    Error updating ${author.id}:`, error.message)
      } else {
        console.log(`    Done (${embedding.length} dims)`)
      }
    } catch (err) {
      console.error(`    Error embedding ${author.id}:`, err)
    }

    await sleep(500) // rate limit
  }

  // --- Works ---
  const { data: works, error: workErr } = await supabase
    .from('works')
    .select('id, work_title, synopsis')
    .is('embedding', null)

  if (workErr) {
    console.error('Failed to fetch works:', workErr.message)
    process.exit(1)
  }

  console.log(`\nFound ${works.length} works without embeddings`)

  for (const work of works) {
    const text = `Work: ${work.work_title}. ${work.synopsis || ''}`
    try {
      console.log(`  Embedding work ${work.id}: ${work.work_title}...`)
      const embedding = await getEmbedding(text)

      const { error } = await supabase
        .from('works')
        .update({ embedding: JSON.stringify(embedding) })
        .eq('id', work.id)

      if (error) {
        console.error(`    Error updating ${work.id}:`, error.message)
      } else {
        console.log(`    Done (${embedding.length} dims)`)
      }
    } catch (err) {
      console.error(`    Error embedding ${work.id}:`, err)
    }

    await sleep(500)
  }

  console.log('\n=== Embedding generation complete ===')
}

main().catch(console.error)
