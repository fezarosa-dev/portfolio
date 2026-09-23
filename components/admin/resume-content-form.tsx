'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ToastForm } from '@/components/admin/toast-form'
import { LanguageToggle } from '@/components/admin/language-toggle'
import { BilingualField } from '@/components/admin/bilingual-field'

export function ResumeContentForm({
  contentMd,
  contentMdEn,
  action,
}: {
  contentMd: string | null
  contentMdEn: string | null
  action: (formData: FormData) => Promise<void>
}) {
  const [language, setLanguage] = useState<'pt' | 'en'>('pt')

  return (
    <ToastForm
      action={action}
      successMessage="Currículo salvo"
      className="mt-4 flex max-w-2xl flex-col gap-4"
      confirmReindex
    >
      <LanguageToggle language={language} onChange={setLanguage} />
      <BilingualField
        name="content_md"
        label="Conteúdo (Markdown)"
        language={language}
        defaultValuePt={contentMd}
        defaultValueEn={contentMdEn}
        multiline
        rows={20}
        fieldClassName="font-mono text-sm"
      />
      <Button type="submit" className="w-fit">
        Salvar
      </Button>
    </ToastForm>
  )
}
