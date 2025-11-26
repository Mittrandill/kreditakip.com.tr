-- Add metadata column to pending_subscriptions table
-- This column stores security context and additional payment metadata

ALTER TABLE public.pending_subscriptions
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.pending_subscriptions.metadata IS 'Stores security context, browser info, and additional payment metadata';