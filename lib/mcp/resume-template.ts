/** Template pra IAs montarem/atualizarem o currículo estruturado via MCP. */
export const RESUME_TEMPLATE = `# Template do autocurrículo (tools: read_autocurriculo, set_perfil_curriculo, upsert_item_curriculo, delete_item_curriculo, mover_item_curriculo, set_projeto_no_curriculo, mover_projeto_no_curriculo, importar_categorias_tecnologias)

Sempre rode read_autocurriculo antes: reaproveite ids (empresas, tecnologias, categorias) e evite duplicar itens.
Regras gerais: PT obrigatório; campos *_en opcionais (vazio cai pro PT). Texto factual e verificável, sem marketing e sem inventar números. Itens novos entram no fim da lista; use mover_item_curriculo pra ordenar.

## Perfil — set_perfil_curriculo
{ "full_name": "Nome Sobrenome", "headline": "Software Engineer", "location": "Cidade – UF, País", "summary": "Resumo profissional em 3–4 frases: stack, áreas de atuação, foco." }
(Contato e links do cabeçalho vêm do conteúdo do site, não daqui.)

## Experiência — upsert_item_curriculo, entity "experiences"
{ "company_id": "<uuid de list_empresas>", "role": "Engenheiro de Software", "start_year": 2026, "start_month": 5, "end_year": null, "end_month": null,
  "topics": "Verbo no passado + o que foi feito + tecnologia/resultado;\\nUm tópico por linha, terminando com ponto e vírgula." }
- fim vazio (end_year null) = emprego atual. Só o ano é permitido (start_month/end_month opcionais).

## Formação — entity "education"
{ "degree": "Bacharelado em Ciência da Computação", "institution": "Universidade X (SIGLA)", "year": "2026 – Previsão de Formatura: 2029" }

## Idiomas — entity "spoken"
{ "language": "Inglês", "language_en": "English", "level": "Avançado", "level_en": "Advanced" }

## Certificações e treinamentos — entity "certifications"
{ "name": "Docker Completo", "start_year": 2025, "start_month": 1 }   // fim opcional; só o ano é permitido

## Habilidades
1. Categoria: entity "skill_categories" → { "name": "Linguagens e Scripting", "name_en": "Languages & Scripting" }  (ou importar_categorias_tecnologias pra copiar as das tecnologias)
2. Habilidade: entity "skills" → { "category_id": "<uuid>", "language_id": "<uuid de tecnologia>" } (vínculo por id; o nome PT/EN vem da tecnologia — edite com upsert_tecnologia name/name_en)  OU  { "category_id": "<uuid>", "label": "Metodologias Ágeis", "label_en": "Agile Methodologies" } (texto livre, pra o que não é tecnologia)

## Projetos no currículo
- set_projeto_no_curriculo { id, in_resume: true } inclui (vai pro fim); mover_projeto_no_curriculo reordena.
- O texto vem do próprio projeto (campos ocultos): upsert_projeto com resume_what ("O quê"), resume_with ("Com quê"), resume_solves ("Resolve"). Veja get_template_projeto.
`
