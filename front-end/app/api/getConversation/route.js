import { createClient } from '@/utils/supabase/server';

export async function POST(request) {
  const supabase = await createClient();
  try {
    const { conversationId } = await request.json();
    if (!conversationId) {
      return new Response(JSON.stringify({ error: 'Missing conversationId' }), {
        status: 400,
      });
    }
    const { data, error } = await supabase
      .from('conversations')
      .select('messages')
      .eq('id', conversationId)
      .single();
    if (error) throw error;
    return new Response(JSON.stringify({ success: true, conversation: data }), {
      status: 200,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 500,
      },
    );
  }
}
