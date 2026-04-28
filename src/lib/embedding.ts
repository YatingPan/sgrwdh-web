/**
 * Generate embeddings using SiliconFlow's BGE-M3 model.
 * BGE-M3 produces 1024-dimensional vectors and supports
 * multilingual text (English, Chinese, Greek, Latin mixed content).
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.SILICONFLOW_API_KEY
  if (!apiKey || apiKey === 'sk-placeholder-siliconflow') {
    throw new Error('SILICONFLOW_API_KEY is not configured')
  }

  // Truncate to ~8000 chars to stay within token limits
  const truncated = text.slice(0, 8000)

  const res = await fetch('https://api.siliconflow.cn/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'BAAI/bge-m3',
      input: truncated,
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

/**
 * Batch generate embeddings for multiple texts.
 * Adds delay between requests to avoid rate limiting.
 */
export async function getEmbeddings(
  texts: string[],
  delayMs = 500
): Promise<number[][]> {
  const results: number[][] = []
  for (let i = 0; i < texts.length; i++) {
    results.push(await getEmbedding(texts[i]))
    if (i < texts.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  return results
}
