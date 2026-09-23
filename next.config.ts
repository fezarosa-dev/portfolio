import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@huggingface/transformers', 'onnxruntime-node'],
  // o file tracing da Vercel não pega o binário nativo do onnxruntime-node
  // sozinho (ele é carregado com um caminho montado em runtime, não um
  // require() estático) -- sem isso o deploy sobe sem o .node e a busca
  // semântica falha com "Cannot find module 'onnxruntime-node'"
  outputFileTracingIncludes: {
    '/**': ['./node_modules/onnxruntime-node/bin/napi-v6/linux/x64/**/*.node'],
  },
};

export default nextConfig;
