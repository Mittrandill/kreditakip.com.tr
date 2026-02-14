import { z } from 'zod'

/**
 * Zod schema for admin subscription actions
 * Uses discriminated union for type-safe validation per action type
 */
export const AdminSubscriptionActionSchema = z.discriminatedUnion('action', [
  // CREATE action
  z.object({
    action: z.literal('create'),
    userId: z.string().uuid('Invalid user ID format'),
    planId: z.string().min(1, 'Plan ID is required'),
    expiresAt: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),

  // UPDATE action
  z.object({
    action: z.literal('update'),
    userId: z.string().uuid('Invalid user ID format'),
    subscriptionId: z.string().uuid('Invalid subscription ID format'),
    planId: z.string().min(1, 'Plan ID is required'),
    notes: z.string().optional(),
  }),

  // EXTEND action
  z.object({
    action: z.literal('extend'),
    userId: z.string().uuid('Invalid user ID format'),
    subscriptionId: z.string().uuid('Invalid subscription ID format'),
    expiresAt: z.string().datetime('Invalid date format'),
    notes: z.string().optional(),
  }),

  // CANCEL action
  z.object({
    action: z.literal('cancel'),
    userId: z.string().uuid('Invalid user ID format'),
    subscriptionId: z.string().uuid('Invalid subscription ID format'),
    notes: z.string().optional(),
  }),
])

export type AdminSubscriptionAction = z.infer<typeof AdminSubscriptionActionSchema>
