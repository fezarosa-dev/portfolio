const NTFY_TOPIC = 'site-contato-d53de582'

export async function notifyNewMessage(
  name: string,
  email: string,
  subject: string,
  category: string,
  message: string
): Promise<void> {
  const preview = message.length > 300 ? `${message.slice(0, 300)}…` : message

  try {
    await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: 'POST',
      headers: { Title: 'Nova mensagem no site', Tags: 'envelope' },
      body: `[${category}] ${subject}\n${name} (${email}): ${preview}`,
    })
  } catch {
    // notificação é best-effort — não deve derrubar o envio da mensagem
  }
}
