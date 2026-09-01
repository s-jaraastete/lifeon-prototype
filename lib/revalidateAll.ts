'use server'

import { revalidatePath } from 'next/cache'

export default async function revalidateAll() {
  revalidatePath('/', 'layout')
}
