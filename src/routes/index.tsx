import { createFileRoute } from '@tanstack/react-router'
import { Home } from '@/app/pages/Home'

export const Route = createFileRoute('/')({
  component: Home,
})
