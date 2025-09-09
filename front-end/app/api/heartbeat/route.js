import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  const { sessionId } = await req.json();

  const { error } = await supabase
    .from("heartbeats")
    .upsert(
      {
        session_id: sessionId,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "session_id" } // 👈 tells Postgres how to merge
    );

  if (error) {
    console.error("Heartbeat error:", error);
    return Response.json({ success: false, error });
  }

  return Response.json({ success: true });
}
