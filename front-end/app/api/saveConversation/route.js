import { createClient } from '@/utils/supabase/server';

export async function POST(req) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const { conversationId, newMessages } = await req.json();
    if (
      !newMessages ||
      !Array.isArray(newMessages) ||
      newMessages.length === 0
    ) {
      return Response.json({ error: 'No messages provided' }, { status: 400 });
    }

    // Case 1: Existing conversationId provided
    if (conversationId) {
      const { data, error } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .single();
      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }
      if (data) {
        const updatedConversation = [...(data.messages || []), ...newMessages];
        const { error: updateError } = await supabase
          .from('conversations')
          .update({
            messages: updatedConversation,
            updated_at: new Date().toISOString(),
          })
          .eq('id', conversationId);
        if (updateError) {
          return Response.json({ error: updateError.message }, { status: 500 });
        }
        return Response.json(
          { success: true, id: conversationId },
          { status: 200 },
        );
      }
    }

    // Case 2: No conversationId provided OR no such conversation found — create a new one
    const { data: newConv, error: insertError } = await supabase
      .from('conversations')
      .insert({
        messages: newMessages,
        name:
          newMessages[0].content.split(' ').length > 5
            ? newMessages[0].content.split(' ').slice(0, 5).join(' ')
            : newMessages[0].content.split(' ').join(' '),
        updated_at: new Date().toISOString(),
        email: user?.email,
        user_id: user?.id,
      })
      .select('id')
      .single();
    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }
    return Response.json({ success: true, id: newConv.id }, { status: 200 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
