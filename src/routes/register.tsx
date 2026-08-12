import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Register } from '@/features/register'

const searchSchema = z.object({
  lineUserId: z.string().optional(),
  referrerId: z.string().optional(),
  token: z.string().optional(),
})

export const Route = createFileRoute('/register')({
  component: Register,
  validateSearch: searchSchema,
})
