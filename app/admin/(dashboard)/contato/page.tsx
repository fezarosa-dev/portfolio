import { getContactLinks } from '@/lib/supabase/queries'
import { ContactLinksAdmin } from '@/components/admin/contact-links-admin'

export default async function AdminContatoPage() {
  const links = await getContactLinks()

  return (
    <div>
      <h1 className="text-2xl font-semibold">Contato</h1>
      <p className="mt-2 font-mono text-xs text-steel">
        cada item vira um jeito de te encontrar na página de Contato — texto e o link (e-mail use{' '}
        <code className="text-signal">mailto:</code>, telefone use{' '}
        <code className="text-signal">tel:</code>) — arraste pelos pontinhos pra reordenar
      </p>

      <ContactLinksAdmin links={links} />
    </div>
  )
}
