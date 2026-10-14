import { ChangesList } from '@/components/admin/changes-list'

export default function MudancasPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Lista de mudanças</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Tudo o que você edita no admin entra aqui primeiro. O mais recente fica em cima; ao enviar, as mudanças são
        aplicadas da mais antiga pra mais nova.
      </p>
      <ChangesList />
    </div>
  )
}
