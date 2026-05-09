import { supabase } from '@/integrations/supabase/client';

// Send a remote command to the host via game_state
export const sendRemoteCommand = async (sessionId: string, command: any) => {
  // Fetch current state, merge remoteCommand
  const { data } = await supabase
    .from('game_sessions')
    .select('game_state')
    .eq('id', sessionId)
    .single();
  const state = (data?.game_state as any) || {};
  state.remoteCommand = { ...command, id: crypto.randomUUID(), ts: Date.now() };
  await supabase.from('game_sessions').update({ game_state: state }).eq('id', sessionId);
};

export const fetchSessionByCodeAny = async (code: string) => {
  // Prefer active sessions (not ended). Among those, take the newest.
  const { data: sessions } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('code', code.toUpperCase())
    .in('status', ['lobby', 'drawing', 'playing'])
    .order('created_at', { ascending: false })
    .limit(1);
  let session = sessions && sessions[0];
  if (!session) {
    // Fallback: maybe the host hasn't transitioned status yet — try any session, newest first
    const { data: any } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('code', code.toUpperCase())
      .order('created_at', { ascending: false })
      .limit(1);
    session = any && any[0];
  }
  if (!session) return null;
  const { data: players } = await supabase
    .from('session_players')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at');
  return { session, players: players || [] };
};

// Update player points directly from console
export const setPlayerPointsAbsolute = async (sessionId: string, playerId: string, points: number) => {
  await supabase
    .from('session_players')
    .update({ points })
    .eq('session_id', sessionId)
    .eq('player_id', playerId);
};
