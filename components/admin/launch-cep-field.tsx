'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatCep, isCep, lookupCep, type CepPlace } from '@/lib/cep'

/**
 * Ponto de onde o foguete sai no globo do contato: digita o CEP, "Buscar" confere na BrasilAPI (reserva: ViaCEP) e
 * mostra a cidade. Só um CEP conferido entra no formulário (campos escondidos com CEP e coordenadas), então o que é
 * salvo nunca é um CEP errado. A cidade aparece só aqui; no site é só o ponto.
 */
export function LaunchCepField({ content }: { content: Record<string, string> }) {
  const [typed, setTyped] = useState(content.launch_cep ? formatCep(content.launch_cep) : '')
  const [place, setPlace] = useState<CepPlace | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const saved = content.launch_place

  async function search() {
    if (!isCep(typed)) {
      setStatus('error')
      setMessage('CEP inválido: use os 8 dígitos (ex.: 37500-903).')
      return
    }
    setStatus('loading')
    try {
      const found = await lookupCep(typed)
      setPlace(found)
      setTyped(formatCep(found.cep))
      setStatus('idle')
      setMessage('')
    } catch (e) {
      setPlace(null)
      setStatus('error')
      setMessage(e instanceof Error ? e.message : 'Não deu pra consultar o CEP.')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="launch_cep_input">CEP</Label>
      <div className="flex max-w-sm gap-2">
        <Input
          id="launch_cep_input"
          inputMode="numeric"
          placeholder="00000-000"
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value)
            setPlace(null)
          }}
          onKeyDown={(e) => {
            // Enter busca o CEP em vez de enviar o formulário inteiro
            if (e.key === 'Enter') {
              e.preventDefault()
              void search()
            }
          }}
          aria-invalid={status === 'error'}
          aria-describedby="launch_cep_status"
        />
        <Button type="button" variant="outline" onClick={() => void search()} disabled={status === 'loading'}>
          {status === 'loading' ? 'Buscando…' : 'Buscar'}
        </Button>
      </div>
      <p id="launch_cep_status" role="status" className={`text-xs ${status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
        {status === 'error'
          ? message
          : place
            ? `Encontrado: ${place.city} – ${place.state}. Salve para o foguete sair daqui.`
            : saved
              ? `Atual: ${saved}. Para mudar, digite outro CEP e clique em Buscar.`
              : 'Sem CEP salvo: o foguete sai do meio do Brasil.'}
      </p>
      {place && (
        <>
          <input type="hidden" name="launch_cep" value={place.cep} />
          <input type="hidden" name="launch_lat" value={String(place.lat)} />
          <input type="hidden" name="launch_lon" value={String(place.lon)} />
          <input type="hidden" name="launch_place" value={`${place.city} – ${place.state}`} />
        </>
      )}
    </div>
  )
}
