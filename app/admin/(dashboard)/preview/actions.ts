'use server'

import { draftMode } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function enablePreview() {
  ;(await draftMode()).enable()
  revalidatePath('/admin/preview')
}

export async function disablePreview() {
  ;(await draftMode()).disable()
  revalidatePath('/admin/preview')
}
