-- ============================================================================
-- SECURITY: make the invoices storage bucket private
-- Date: 2026-06-06
--
-- Invoice PDFs are sensitive financial documents. The bucket was public, so any
-- object was downloadable by direct URL without authentication. Application code
-- now serves invoices through GET /api/invoices/[id]/download, which authenticates
-- the user, verifies owner-or-admin, and redirects to a short-lived signed URL.
-- With that endpoint deployed, the bucket can be made private.
-- ============================================================================

UPDATE storage.buckets SET public = false WHERE id = 'invoices';
