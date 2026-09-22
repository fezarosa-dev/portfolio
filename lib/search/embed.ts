import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers'

const MODEL_ID = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2'

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null

function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', MODEL_ID, { dtype: 'q8' })
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
