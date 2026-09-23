-- pré-popula os campos de SEO editáveis pelo admin com o texto que já está em uso no
-- código (lib/seo.ts PAGE_SEO / app/(site)/layout.tsx SEO_BY_LOCALE), pra o painel
-- mostrar o valor real em vez de vazio. on conflict do nothing preserva qualquer
-- edição que já tenha sido feita manualmente.
insert into public.site_content (key, value) values
  ('seo_home_title', 'Felipe Zanoni da Rosa — Desenvolvedor de Software Full Stack'),
  ('seo_home_title_en', 'Felipe Zanoni da Rosa — Full Stack Software Developer'),
  ('seo_home_description', 'Portfólio de Felipe Zanoni da Rosa, desenvolvedor de software full stack — projetos, artigos técnicos, currículo e contato.'),
  ('seo_home_description_en', 'Portfolio of Felipe Zanoni da Rosa, full stack software developer — projects, technical articles, resume and contact.'),
  ('seo_home_keywords', 'Felipe Zanoni da Rosa,desenvolvedor de software,engenheiro de software,portfólio de desenvolvedor,desenvolvedor full stack,projetos de software,programador Brasil'),
  ('seo_home_keywords_en', 'Felipe Zanoni da Rosa,software developer,software engineer,developer portfolio,full stack developer,software projects'),

  ('seo_sobre_title', 'Sobre mim'),
  ('seo_sobre_title_en', 'About'),
  ('seo_sobre_description', 'Conheça a trajetória de Felipe Zanoni da Rosa, desenvolvedor de software full stack — experiência, formação e o que me move como profissional.'),
  ('seo_sobre_description_en', 'Learn about Felipe Zanoni da Rosa''s background as a full stack software developer — experience, education and what drives me as a professional.'),

  ('seo_servicos_title', 'Serviços'),
  ('seo_servicos_title_en', 'Services'),
  ('seo_servicos_description', 'Serviços de desenvolvimento de software sob medida: aplicações web, automações e soluções full stack, com Felipe Zanoni da Rosa.'),
  ('seo_servicos_description_en', 'Custom software development services: web applications, automation and full stack solutions, by Felipe Zanoni da Rosa.'),

  ('seo_projetos_title', 'Projetos'),
  ('seo_projetos_title_en', 'Projects'),
  ('seo_projetos_description', 'Projetos de software desenvolvidos por Felipe Zanoni da Rosa — código, tecnologias usadas e detalhes técnicos de cada um.'),
  ('seo_projetos_description_en', 'Software projects built by Felipe Zanoni da Rosa — code, technologies used and technical details for each one.'),

  ('seo_artigos_title', 'Artigos'),
  ('seo_artigos_title_en', 'Articles'),
  ('seo_artigos_description', 'Artigos técnicos escritos por Felipe Zanoni da Rosa sobre desenvolvimento de software, boas práticas e tecnologia.'),
  ('seo_artigos_description_en', 'Technical articles written by Felipe Zanoni da Rosa about software development, best practices and technology.'),

  ('seo_contato_title', 'Contato'),
  ('seo_contato_title_en', 'Contact'),
  ('seo_contato_description', 'Fale com Felipe Zanoni da Rosa — e-mail, redes sociais e formulário de contato pra oportunidades e colaborações.'),
  ('seo_contato_description_en', 'Get in touch with Felipe Zanoni da Rosa — email, social links and contact form for opportunities and collaborations.'),

  ('seo_curriculo_title', 'Currículo'),
  ('seo_curriculo_title_en', 'Resume'),
  ('seo_curriculo_description', 'Currículo de Felipe Zanoni da Rosa: experiência profissional, formação acadêmica, habilidades técnicas e certificações.'),
  ('seo_curriculo_description_en', 'Felipe Zanoni da Rosa''s resume: professional experience, academic background, technical skills and certifications.'),

  ('seo_busca_title', 'Busca'),
  ('seo_busca_title_en', 'Search'),
  ('seo_busca_description', 'Busque em linguagem natural pelos projetos, artigos e tecnologias de Felipe Zanoni da Rosa.'),
  ('seo_busca_description_en', 'Search in natural language across Felipe Zanoni da Rosa''s projects, articles and technologies.'),

  ('seo_status_title', 'Bastidores técnicos'),
  ('seo_status_title_en', 'Technical internals'),
  ('seo_status_description', 'Métricas reais e ao vivo deste site — deploy atual, latência do banco e volume de conteúdo, sem dado simulado.'),
  ('seo_status_description_en', 'Real, live metrics from this site — current deploy, database latency and content volume, nothing simulated.'),

  ('seo_comoUsar_title', 'Como usar este site'),
  ('seo_comoUsar_title_en', 'How to use this site'),
  ('seo_comoUsar_description', 'Um guia completo pelo site de Felipe Zanoni da Rosa — páginas, recursos e até os easter eggs escondidos.'),
  ('seo_comoUsar_description_en', 'A complete guide to Felipe Zanoni da Rosa''s site — pages, features and even the hidden easter eggs.'),

  ('seo_privacidade_title', 'Política de Privacidade'),
  ('seo_privacidade_title_en', 'Privacy Policy'),
  ('seo_privacidade_description', 'Como Felipe Zanoni da Rosa coleta, usa e protege dados pessoais neste site.'),
  ('seo_privacidade_description_en', 'How Felipe Zanoni da Rosa''s site collects, uses and protects personal data.'),

  ('seo_termos_title', 'Termos de Uso'),
  ('seo_termos_title_en', 'Terms of Use'),
  ('seo_termos_description', 'Condições de uso do site de Felipe Zanoni da Rosa.'),
  ('seo_termos_description_en', 'Terms of use for Felipe Zanoni da Rosa''s site.'),

  ('seo_cookies_title', 'Política de Cookies'),
  ('seo_cookies_title_en', 'Cookie Policy'),
  ('seo_cookies_description', 'Quais cookies o site de Felipe Zanoni da Rosa usa e como gerenciá-los.'),
  ('seo_cookies_description_en', 'Which cookies Felipe Zanoni da Rosa''s site uses and how to manage them.')
on conflict (key) do nothing;
