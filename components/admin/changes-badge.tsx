'use client'

import { useChanges } from '@/components/admin/changes-provider'

export function ChangesBadge() {
  const { changes } = useChanges()
  if (changes.length === 0) return null
  return (
    <span className="ml-auto rounded-full bg-orange-500 px-1.5 font-mono text-[10px] leading-4 text-white">
      {changes.length}
    </span>
  )
}
