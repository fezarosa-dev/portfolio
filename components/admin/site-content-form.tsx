'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { DriveImagePicker } from '@/components/drive-image-picker'
import { IconUpload } from '@/components/admin/icon-upload'
import { LanguageToggle } from '@/components/admin/language-toggle'
import { BilingualField } from '@/components/admin/bilingual-field'

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

      <Button type="submit" className="w-fit">
        Salvar
      </Button>
    </form>
  )
}
