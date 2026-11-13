import { createClient } from '@supabase/supabase-js';

// WhatsApp traffic is written by the backend into the DSA Supabase project,
// so both the DSA and CWC admin panels read it from here.
export function whatsappAdminClient() {
  return createClient(
    process.env.SUPABASE_SERVER_URL_DSA,
    process.env.SUPABASE_SERVICE_ROLE_KEY_DSA,
  );
}
