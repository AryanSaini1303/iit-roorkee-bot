import { createClient } from '@/utils/supabase/server';

export async function POST(request) {
  try {
    const { conversationId, origin } = await request.json();
    const supabase = await createClient(origin === 'CWC' ? 'CWC' : 'DSA');
    if (!conversationId) {
      return new Response(JSON.stringify({ error: 'Missing conversationId' }), {
        status: 400,
      });
    }
    const { data, error } = await supabase
      .from('conversations')
      .select('messages, pdfList, contextList')
      .eq('id', conversationId)
      .single();
    // console.log(data);
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
