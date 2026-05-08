import { createFileRoute } from '@tanstack/react-router'
import { Research } from '@/app/pages/Research'

export const Route = createFileRoute('/research')({
  component: Research,
})
