'use server'

import { draftMode } from 'next/headers'

export async function enablePreview() {
  ;(await draftMode()).enable()
}

export async function disablePreview() {
  ;(await draftMode()).disable()
}
