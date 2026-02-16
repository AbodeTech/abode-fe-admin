'use server'

import { revalidateTag } from 'next/cache'

export default async function revalidate(tag: string) {
  // @ts-ignore - revalidateTag signature mismatch in next/server types vs usage
  revalidateTag(tag)
}
