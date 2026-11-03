import { toast } from 'sonner'
import { HOUSTON } from './houston'

/** Aviso de erro: a mensagem normal e, embaixo, a frase da Apollo 13. */
export function toastError(message: string) {
  return toast.error(message, { description: HOUSTON })
}
