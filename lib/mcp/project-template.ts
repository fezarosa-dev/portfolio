/** Template pra IAs cadastrarem projetos via MCP (upsert_projeto) — campos públicos + os ocultos do currículo. */
export const PROJECT_TEMPLATE = `# Template de projeto (use com upsert_projeto)

Antes de criar, rode list_projetos / list_tecnologias / list_empresas / list_autores pra reaproveitar ids existentes (não duplique tecnologia, empresa ou autor). Se faltar algo, crie primeiro (upsert_tecnologia etc.).

## Campos PÚBLICOS (aparecem no site)
- title / title_en: "Nome curto — descrição do que é" (ex.: "IXSonar — Análise de Visibilidade BGP entre Pontos de Troca de Tráfego"). O trecho antes do " — " vira a URL (slug) automaticamente.
- summary / summary_en: 1–2 frases pro card do projeto.
- content_md / content_md_en: página do projeto em Markdown (contexto, o que foi feito, resultado). Imagens só por nome de arquivo da pasta do Drive.
- repo_url, site_url: links (omita se não houver). click_mode: "detail" (padrão, abre a página do projeto) ou "link" (+ click_url).
- company_id (empresa/contexto), language_ids (tecnologias usadas), author_ids.
- visible: true pra publicar. show_on_home: true só se for destaque da home.

## Campos OCULTOS (só alimentam o currículo; nunca aparecem no site público)
- in_resume: true se o projeto deve entrar no currículo.
- resume_what / resume_what_en — "O quê": o que o projeto é, 1 frase direta, minúscula inicial, termina com ponto.
- resume_with / resume_with_en — "Com quê": stack e técnicas concretas (linguagens, bibliotecas, infra), separadas por vírgula. Se ficar vazio, o currículo lista automaticamente as tecnologias vinculadas ao projeto (language_ids, por id, com o nome PT/EN de cada uma).
- resume_solves / resume_solves_en — "Resolve": o problema real que resolve e o ganho mensurável, se houver (SLA, redução, escala).
Regras: texto factual e verificável, sem adjetivos de marketing, sem inventar números; PT obrigatório, EN opcional (vazio cai pro PT).

## Exemplo
{
  "title": "SOVA — Pipeline de Geolocalização de Tráfego em Larga Escala",
  "summary": "Geolocaliza IPs de dumps de tráfego pra detecção de DDoS.",
  "in_resume": true,
  "resume_what": "pipeline que geolocaliza IPs de origem e destino em dumps de tráfego de rede para alimentar sistema de detecção e mitigação de DDoS.",
  "resume_with": "arquitetura híbrida Python e Cython, base MaxMind GeoIP, processamento paralelo.",
  "resume_solves": "processar milhões de registros com lookup de geolocalização dentro de SLA de 5 minutos, impraticável em Python puro."
}
Depois de salvar, a ordem no currículo se ajusta com mover_projeto_no_curriculo.`
