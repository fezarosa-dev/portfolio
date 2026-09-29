import { listMessages } from '@/lib/supabase/admin-queries'
import { ToastForm } from '@/components/admin/toast-form'
import { toggleRead, removeMessage } from './actions'

const CATEGORY_LABELS: Record<string, string> = {
  vaga: 'Vaga / oportunidade',
  projeto: 'Projeto / freela',
  duvida: 'Dúvida',
  outro: 'Outro',
}

export default async function MensagensPage() {
  const messages = await listMessages()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Mensagens</h1>
      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
      ) : (
        <ul className="flex max-w-2xl flex-col gap-3">
          {messages.map((msg) => (
            <li
              key={msg.id}
              className={`rounded-lg border p-4 ${msg.read ? 'border-hairline' : 'border-signal'}`}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium">
                  {msg.name} <span className="text-steel">— {msg.email}</span>
                </p>
                <p className="shrink-0 font-mono text-xs text-steel">
                  {new Date(msg.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              {(msg.category || msg.subject) && (
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-medium">
                  {msg.category && (
                    <span className="rounded-full bg-signal/10 px-2 py-0.5 font-mono text-xs text-signal">
                      {CATEGORY_LABELS[msg.category] ?? msg.category}
                    </span>
                  )}
                  {msg.subject}
                </p>
              )}
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{msg.message}</p>
              <div className="mt-3 flex gap-4 font-mono text-xs">
                <a
                  href={`mailto:${msg.email}?subject=${encodeURIComponent(`Re: ${msg.subject || 'sua mensagem em zanoni.dev.br'}`)}&body=${encodeURIComponent(`Oi ${msg.name},\n\n\n\n---\nVocê escreveu:\n${msg.message}`)}`}
                  className="text-signal hover:underline"
                >
                  responder
                </a>
                <form action={toggleRead.bind(null, msg.id, !msg.read)}>
                  <button type="submit" className="text-signal hover:underline">
                    marcar como {msg.read ? 'não lida' : 'lida'}
                  </button>
                </form>
                <ToastForm action={removeMessage.bind(null, msg.id)} successMessage="Mensagem excluída">
                  <button type="submit" className="text-destructive hover:underline">
                    excluir
                  </button>
                </ToastForm>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
