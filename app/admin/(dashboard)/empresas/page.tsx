import { getCompanies } from '@/lib/supabase/queries'
import { CompaniesAdmin } from '@/components/admin/companies-admin'

export default async function EmpresasPage() {
  const companies = await getCompanies()

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Empresas</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Empresas onde você já trabalhou — depois é só selecionar qual delas fez cada projeto na
        aba Projetos. &quot;Freelancer&quot; e &quot;Projeto pessoal&quot; já vêm cadastrados.
        Preencha nome em PT, em EN, ou os dois: se preencher só um lado, esse nome aparece no site
        independente do idioma da página; se preencher os dois, cada idioma mostra o seu.
      </p>

      <CompaniesAdmin companies={companies} />
    </div>
  )
}
