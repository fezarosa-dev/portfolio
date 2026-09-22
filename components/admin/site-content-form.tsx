'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DriveImagePicker } from '@/components/drive-image-picker'
import { IconUpload } from '@/components/admin/icon-upload'
import { LanguageToggle } from '@/components/admin/language-toggle'
import { BilingualField } from '@/components/admin/bilingual-field'

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: '/', label: 'Home' },
  { href: '/sobre', label: 'Sobre mim' },
  { href: '/servicos', label: 'Serviços' },
  { href: '/projetos', label: 'Projetos' },
  { href: '/artigos', label: 'Artigos' },
  { href: '/contato', label: 'Contato' },
  { href: '/curriculo', label: 'Currículo' },
]

// mesma lista de páginas de lib/seo.ts (PAGE_SEO + home) — duplicada aqui de propósito
// pra não puxar lib/seo.ts (que importa getSiteContent, código server-only) num componente client
const SEO_PAGES: { key: string; label: string }[] = [
  { key: 'home', label: 'Home' },
  { key: 'sobre', label: 'Sobre' },
  { key: 'servicos', label: 'Serviços' },
  { key: 'projetos', label: 'Projetos' },
  { key: 'artigos', label: 'Artigos' },
  { key: 'contato', label: 'Contato' },
  { key: 'curriculo', label: 'Currículo' },
  { key: 'busca', label: 'Busca' },
  { key: 'status', label: 'Status' },
  { key: 'comoUsar', label: 'Como usar' },
  { key: 'privacidade', label: 'Privacidade' },
  { key: 'termos', label: 'Termos de uso' },
  { key: 'cookies', label: 'Cookies' },
]

const SEARCH_PARAMS: { key: string; label: string; hint: string; defaultValue: number }[] = [
  {
    key: 'search_rate_limit_max',
    label: 'Máximo de buscas por janela',
    hint: 'quantas buscas um mesmo IP pode fazer antes de levar 429',
    defaultValue: 20,
  },
  {
    key: 'search_rate_limit_window_minutes',
    label: 'Janela do limite (minutos)',
    hint: 'período em que o limite acima é contado',
    defaultValue: 1,
  },
  {
    key: 'search_max_query_length',
    label: 'Tamanho máximo da busca (caracteres)',
    hint: 'buscas maiores que isso são rejeitadas',
    defaultValue: 200,
  },
  {
    key: 'search_semantic_timeout_ms',
    label: 'Timeout da busca semântica (ms)',
    hint: 'se a busca por significado demorar mais que isso, cai pro full-text',
    defaultValue: 4000,
  },
  {
    key: 'search_results_limit',
    label: 'Máximo de resultados exibidos',
    hint: 'quantos resultados a busca devolve no máximo',
    defaultValue: 8,
  },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-hairline bg-card p-6">
      <h2 className="font-mono text-xs tracking-wide text-signal">{'// '}{title}</h2>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  )
}

export function SiteContentForm({
  content,
  action,
}: {
  content: Record<string, string>
  action: (formData: FormData) => Promise<void>
}) {
  const [sobreFoto, setSobreFoto] = useState(content.sobre_foto ?? '')
  const [siteIcon, setSiteIcon] = useState(content.site_icon ?? '')
  const [language, setLanguage] = useState<'pt' | 'en'>('pt')
  const lookup = (key: string): string | null => (key in content ? content[key] : null)
  const hiddenNavLinks = new Set(
    (content.nav_hidden_links ?? '')
      .split(',')
      .map((href) => href.trim())
      .filter(Boolean)
  )

  async function handleSubmit(formData: FormData) {
    try {
      await action(formData)
      toast.success('Personalização salva')
    } catch {
      toast.error('Não deu pra salvar. Tenta de novo.')
    }
  }

  return (
    <form action={handleSubmit} className="flex max-w-2xl flex-col gap-6">
      <LanguageToggle language={language} onChange={setLanguage} />

      <Tabs defaultValue="conteudo">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="conteudo">conteúdo</TabsTrigger>
          <TabsTrigger value="contato">contato & redes</TabsTrigger>
          <TabsTrigger value="navegacao">navegação</TabsTrigger>
          <TabsTrigger value="seo">seo</TabsTrigger>
          <TabsTrigger value="busca">busca</TabsTrigger>
          <TabsTrigger value="avancado">avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="conteudo" keepMounted className="mt-4 flex flex-col gap-4">
          <Section title="ícone do site">
            <div>
              <Label>Ícone (favicon)</Label>
              <p className="mb-2 font-mono text-xs text-steel">
                o desenho que aparece na aba do navegador ao lado do nome do site — escolha uma
                imagem (png, jpg...) e ajuste o zoom pra selecionar a parte que vai aparecer
              </p>
              <input type="hidden" name="site_icon" value={siteIcon} />
              <IconUpload value={siteIcon} onChange={setSiteIcon} />
            </div>
          </Section>

          <Section title="hero">
            <BilingualField
              name="hero_title"
              label="Título"
              language={language}
              defaultValuePt={lookup('hero_title')}
              defaultValueEn={lookup('hero_title_en')}
            />
            <BilingualField
              name="hero_subtitle"
              label="Subtítulo"
              language={language}
              defaultValuePt={lookup('hero_subtitle')}
              defaultValueEn={lookup('hero_subtitle_en')}
            />
          </Section>

          <Section title="sobre-mim">
            <BilingualField
              name="sobre_texto"
              label="Texto"
              language={language}
              defaultValuePt={lookup('sobre_texto')}
              defaultValueEn={lookup('sobre_texto_en')}
              multiline
              rows={6}
            />
            <div>
              <Label>Foto</Label>
              <input type="hidden" name="sobre_foto" value={sobreFoto} />
              <DriveImagePicker value={sobreFoto} onChange={setSobreFoto} />
            </div>
          </Section>

          <Section title="serviços">
            <BilingualField
              name="servicos_texto"
              label="Texto"
              language={language}
              defaultValuePt={lookup('servicos_texto')}
              defaultValueEn={lookup('servicos_texto_en')}
              multiline
              rows={6}
            />
          </Section>

          <Section title="guia do site">
            <BilingualField
              name="como_usar_texto"
              label="Como usar este site (markdown)"
              language={language}
              defaultValuePt={lookup('como_usar_texto')}
              defaultValueEn={lookup('como_usar_texto_en')}
              multiline
              rows={16}
            />
          </Section>

          <Section title="páginas legais">
            <BilingualField
              name="privacidade_texto"
              label="Política de Privacidade (markdown)"
              language={language}
              defaultValuePt={lookup('privacidade_texto')}
              defaultValueEn={lookup('privacidade_texto_en')}
              multiline
              rows={12}
            />
            <BilingualField
              name="termos_texto"
              label="Termos de Uso (markdown)"
              language={language}
              defaultValuePt={lookup('termos_texto')}
              defaultValueEn={lookup('termos_texto_en')}
              multiline
              rows={12}
            />
            <BilingualField
              name="cookies_texto"
              label="Política de Cookies (markdown)"
              language={language}
              defaultValuePt={lookup('cookies_texto')}
              defaultValueEn={lookup('cookies_texto_en')}
              multiline
              rows={12}
            />
          </Section>
        </TabsContent>

        <TabsContent value="contato" keepMounted className="mt-4 flex flex-col gap-4">
          <Section title="contato">
            <div>
              <Label htmlFor="contato_email">E-mail</Label>
              <Input id="contato_email" name="contato_email" defaultValue={content.contato_email} />
            </div>
            <div>
              <Label htmlFor="contato_telefone">Telefone</Label>
              <Input
                id="contato_telefone"
                name="contato_telefone"
                defaultValue={content.contato_telefone}
              />
            </div>
          </Section>

          <Section title="redes">
            <div>
              <Label htmlFor="link_github">GitHub</Label>
              <Input id="link_github" name="link_github" defaultValue={content.link_github} />
            </div>
            <div>
              <Label htmlFor="link_linkedin">LinkedIn</Label>
              <Input id="link_linkedin" name="link_linkedin" defaultValue={content.link_linkedin} />
            </div>
          </Section>

          <Section title="status (faixa no topo do site)">
            <BilingualField
              name="status_text"
              label="Texto"
              language={language}
              defaultValuePt={lookup('status_text')}
              defaultValueEn={lookup('status_text_en')}
            />
            <div>
              <Label htmlFor="status_color">Cor da bolinha</Label>
              <select
                id="status_color"
                name="status_color"
                defaultValue={content.status_color || 'green'}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="green">Verde — disponível</option>
                <option value="amber">Âmbar — ocupado</option>
                <option value="red">Vermelho — indisponível</option>
                <option value="gray">Cinza — neutro</option>
              </select>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="navegacao" keepMounted className="mt-4 flex flex-col gap-4">
          <Section title="itens do menu">
            <p className="font-mono text-xs text-steel">
              desmarque um item pra escondê-lo do menu (topo e menu mobile) sem apagar a página
            </p>
            <div className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => (
                <label key={item.href} className="flex items-center gap-2 font-mono text-sm">
                  <input
                    type="checkbox"
                    name="nav_hidden_links"
                    value={item.href}
                    defaultChecked={hiddenNavLinks.has(item.href)}
                  />
                  esconder {item.label}
                </label>
              ))}
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="seo" keepMounted className="mt-4 flex flex-col gap-4">
          <Section title="seo por página">
            <p className="font-mono text-xs text-steel">
              deixe em branco pra usar o padrão do código. o título aparece como &quot;seu texto — Zanoni&quot; na
              aba do navegador.
            </p>
            {SEO_PAGES.map((page, index) => (
              <div key={page.key} className={index > 0 ? 'flex flex-col gap-4 border-t border-hairline pt-4' : 'flex flex-col gap-4'}>
                <p className="font-mono text-xs font-medium text-foreground">{page.label}</p>
                <BilingualField
                  name={`seo_${page.key}_title`}
                  label="Título"
                  language={language}
                  defaultValuePt={lookup(`seo_${page.key}_title`)}
                  defaultValueEn={lookup(`seo_${page.key}_title_en`)}
                />
                <BilingualField
                  name={`seo_${page.key}_description`}
                  label="Descrição"
                  language={language}
                  defaultValuePt={lookup(`seo_${page.key}_description`)}
                  defaultValueEn={lookup(`seo_${page.key}_description_en`)}
                  multiline
                  rows={2}
                />
                {page.key === 'home' && (
                  <BilingualField
                    name="seo_home_keywords"
                    label="Palavras-chave (separadas por vírgula)"
                    language={language}
                    defaultValuePt={lookup('seo_home_keywords')}
                    defaultValueEn={lookup('seo_home_keywords_en')}
                  />
                )}
              </div>
            ))}
          </Section>
        </TabsContent>

        <TabsContent value="busca" keepMounted className="mt-4 flex flex-col gap-4">
          <Section title="parâmetros da busca">
            {SEARCH_PARAMS.map((param) => (
              <div key={param.key}>
                <Label htmlFor={param.key}>{param.label}</Label>
                <Input
                  id={param.key}
                  name={param.key}
                  type="number"
                  min={1}
                  placeholder={String(param.defaultValue)}
                  defaultValue={content[param.key] ?? ''}
                />
                <p className="mt-1 font-mono text-xs text-steel">
                  {param.hint} — padrão: {param.defaultValue}
                </p>
              </div>
            ))}
          </Section>
        </TabsContent>

        <TabsContent value="avancado" keepMounted className="mt-4 flex flex-col gap-4">
          <Section title="avançado">
            <div>
              <Label htmlFor="drive_folder_url">Drive URL (pasta de imagens do site)</Label>
              <Input
                id="drive_folder_url"
                name="drive_folder_url"
                defaultValue={content.drive_folder_url}
              />
            </div>
          </Section>
        </TabsContent>
      </Tabs>

      <Button type="submit" className="w-fit">
        Salvar
      </Button>
    </form>
  )
}
