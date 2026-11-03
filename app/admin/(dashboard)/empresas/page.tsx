import { getCompanies, getCompanyClients } from '@/lib/supabase/queries'
import { CompaniesAdmin } from '@/components/admin/companies-admin'

export default async function EmpresasPage() {
  const [companies, clients] = await Promise.all([getCompanies(), getCompanyClients()])

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Empresas</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Empresas onde você já trabalhou — depois é só selecionar qual delas fez cada projeto na
        aba Projetos. &quot;Freelancer&quot; e &quot;Projeto pessoal&quot; já vêm cadastrados.
        Preencha nome em PT, em EN, ou os dois: se preencher só um lado, esse nome aparece no site
        independente do idioma da página; se preencher os dois, cada idioma mostra o seu.
      </p>
      <p className="mb-6 text-sm text-muted-foreground">
        <strong>Grupos de clientes</strong> (dentro de cada empresa): use quando a mesma empresa reúne clientes
        diferentes, como em &quot;Freelancer&quot;. Cada grupo conta como um cliente no número de empresas do site; o
        nome do grupo é interno e não aparece para o público. Projeto sem grupo conta pela empresa.
      </p>

      <CompaniesAdmin companies={companies} clients={clients} />
    </div>
  )
}
