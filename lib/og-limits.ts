// Limites do card de compartilhamento (Open Graph, 1200×630). Arquivo puro, sem next/og,
// porque o painel admin (client) também importa pra mostrar o contador de caracteres.
//
// Medido renderizando o card com o ImageResponse do next/og (fonte Geist) e 25 textos reais
// por tamanho: é o maior tamanho em que nenhum título passou de 3 linhas (descrição: 2 linhas
// sem foto, 3 com foto). Texto acima disso é cortado na última palavra com "…", e o lineClamp
// do card segura casos raros mais largos (tudo em maiúsculas, por exemplo).
// Mudou fonte, tamanho de letra ou margens do card em lib/og-image.tsx? Meça de novo.
export const OG_TITLE_MAX = { plain: 80, withImage: 55 } as const
export const OG_SUBTITLE_MAX = { plain: 120, withImage: 110 } as const
