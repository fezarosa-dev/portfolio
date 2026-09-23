import type { NextConfig } from "next";

// o file tracing da Vercel não pega o onnxruntime-node sozinho: o binário
// nativo (e a .so que ele carrega em runtime) são resolvidos com um caminho
// montado em runtime (`require(\`../bin/.../${process.platform}/...\`)`), não
// um require() estático que o tracer consegue seguir -- sem isso o deploy
// sobe sem esses arquivos e a busca semântica falha com "Cannot find module
// 'onnxruntime-node'". Só os providers CPU/shared -- os de CUDA/TensorRT
// (GPU, não usamos) têm 260MB+ e explodiam o tamanho do deploy quando
// incluídos.
const ONNXRUNTIME_NODE_FILES = [
  './node_modules/onnxruntime-node/package.json',
  './node_modules/onnxruntime-node/dist/**',
  './node_modules/onnxruntime-node/bin/napi-v6/linux/x64/onnxruntime_binding.node',
  './node_modules/onnxruntime-node/bin/napi-v6/linux/x64/libonnxruntime.so.1',
  './node_modules/onnxruntime-node/bin/napi-v6/linux/x64/libonnxruntime_providers_shared.so',
  // onnxruntime-node exige isso em runtime via require CJS -- o tracing
  // automático só pegava o build ESM sozinho, faltando o cjs/index.js
  './node_modules/onnxruntime-common/**',
]

const nextConfig: NextConfig = {
  serverExternalPackages: ['@huggingface/transformers', 'onnxruntime-node'],
  // só nas rotas que de fato importam a cadeia de busca (não o site inteiro)
  outputFileTracingIncludes: {
    '/admin/**': ONNXRUNTIME_NODE_FILES,
    '/api/search/**': ONNXRUNTIME_NODE_FILES,
    // escritas via MCP reindexam o mesmo jeito que o admin (embedding incluso)
    '/api/mcp/**': ONNXRUNTIME_NODE_FILES,
  },
};

export default nextConfig;
