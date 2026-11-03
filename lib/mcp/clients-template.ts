/** Guia pra IAs configurarem empresas e grupos de clientes via MCP, para o número "empresas atendidas" ficar certo. */
export const CLIENTS_TEMPLATE = `# Empresas e grupos de clientes (contagem de "empresas atendidas" do site)

## Como o site conta
- Conta só projetos VISÍVEIS (visible: true). Projeto oculto ou sem empresa não entra.
- Projeto num grupo de cliente conta pelo grupo: cada grupo = 1 cliente, não importa quantos projetos tenha.
- Projeto sem grupo conta pela empresa: todos os projetos sem grupo da mesma empresa somam 1 só.
  Ex.: todos os "Projeto pessoal" juntos = 1; todos os "Freelancer" sem grupo = 1.
- Grupo sem projeto visível não conta.
- O nome do grupo é interno (painel e MCP); no site só aparece o número.

## Quando criar grupos
Use grupos quando UMA empresa do cadastro reúne clientes DIFERENTES. O caso típico é "Freelancer":
cada cliente de freela vira um grupo dentro de "Freelancer". Empresa onde você trabalhou (um empregador só)
não precisa de grupo: os projetos dela já contam como 1.

## Passo a passo
1. read_contagem_clientes: veja o número atual, quem conta, por causa de quais projetos, e os avisos.
2. list_empresas: pegue o id da empresa (ex.: Freelancer). list_projetos: pegue os ids dos projetos.
3. upsert_grupo_cliente { company_id, name: "Cliente X", project_ids: [ids dos projetos desse cliente] }
   cria o grupo e já põe os projetos nele (os projetos precisam ser da mesma empresa do grupo).
   Para um grupo que já existe: upsert_grupo_cliente { id, name, project_ids } (project_ids troca a lista
   inteira de projetos do grupo; omita para só renomear).
4. read_contagem_clientes de novo: confira o total e se sobrou aviso ("projetos sem grupo contam juntos como
   mais 1 cliente" quase sempre quer dizer que faltou pôr um projeto num grupo).

## Outros
- Um projeto só: upsert_projeto { id, client_id } (null tira do grupo). Trocar company_id sem mandar client_id
  tira o projeto do grupo antigo.
- delete_grupo_cliente { id }: apaga o grupo; os projetos continuam na empresa, só saem do grupo.
- Não invente clientes: um grupo por cliente real, com os projetos que foram de fato para ele.
`
