import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@huggingface/transformers', 'onnxruntime-node'],
  // o file tracing da Vercel não pega o onnxruntime-node sozinho: o binário
  // nativo (e a .so que ele carrega em runtime) são resolvidos com um
  // caminho montado em runtime (`require(\`../bin/.../${process.platform}/...\`)`),
  // não um require() estático que o tracer consegue seguir -- sem isso o
  // deploy sobe sem esses arquivos e a busca semântica falha com
  // "Cannot find module 'onnxruntime-node'"
  outputFileTracingIncludes: {
    '/**': [
      './node_modules/onnxruntime-node/package.json',
      './node_modules/onnxruntime-node/dist/**',
      './node_modules/onnxruntime-node/bin/napi-v6/linux/x64/**',
    ],
  },
};

export default nextConfig;
