import type { FeatureExtractionPipeline } from '@huggingface/transformers'

const MODEL_ID = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2'

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null

// import dinâmico de propósito: várias server actions importam este módulo (via
// search-index.ts) só pra reindexar a busca ao salvar, mesmo em rotas que nunca
// chegam a chamar embedText. Se @huggingface/transformers falhar ao carregar em
// import estático, ele derruba o bundle inteiro da rota (até GETs que não usam
// busca). Import dinâmico adia a falha pro momento real de uso, onde
// embedTextSafe já trata o erro e degrada pra full-text.
async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = import('@huggingface/transformers').then(({ pipeline, env }) => {
      // serverless (Vercel/Lambda) só permite escrita em /tmp — node_modules é read-only em runtime
      env.cacheDir = '/tmp/transformers-cache'
      return pipeline('feature-extraction', MODEL_ID, { dtype: 'q8' })
    })
  }
  return extractorPromise
}

export async function warmUpModel(): Promise<void> {
  await getExtractor()
}

export async function embedText(text: string): Promise<number[]> {
  const extractor = await getExtractor()
  const output = await extractor(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data as Float32Array)
}

export async function embedTextSafe(text: string): Promise<number[] | null> {
  try {
    return await embedText(text)
  } catch {
    return null
  }
}
