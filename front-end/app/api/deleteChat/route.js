import { createClient } from '@/utils/supabase/server';

export async function DELETE(req) {
  try {
    const { conversationId, origin } = await req.json();
    const supabase = await createClient(origin === 'CWC' ? 'CWC' : 'DSA');

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'Conversation ID is required' }),
        {
          status: 400,
        },
      );
    }

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(
      JSON.stringify({ message: 'Chat deleted successfully' }),
      {
        status: 200,
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
