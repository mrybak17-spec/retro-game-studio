import { supabase } from '@/integrations/supabase/client';
import { GameShow } from '@/types/game';

const generatePlayerId = () => crypto.randomUUID();

// Get or create a persistent player ID for this browser
export const getLocalPlayerId = (): string => {
  let id = localStorage.getItem('gsm95_player_id');
  if (!id) {
    id = generatePlayerId();
    localStorage.setItem('gsm95_player_id', id);
  }
  return id;
};

// Generate a 6-char game code
const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

// ─── Host: Create a session ───
export const createMultiplayerSession = async (gameShow: GameShow, hostName: string) => {
  const hostId = getLocalPlayerId();
  const code = generateCode();

  const { data: session, error } = await supabase
    .from('game_sessions')
    .insert({
      code,
      host_id: hostId,
      game_show_data: gameShow as any,
      status: 'lobby',
      current_game_index: 0,
      game_state: {},
    })
    .select()
    .single();

  if (error) throw error;

  // Add host as a player
  const { error: playerError } = await supabase
    .from('session_players')
    .insert({
      session_id: session.id,
      player_id: hostId,
      name: hostName,
      is_host: true,
      points: 0,
    });

  if (playerError) throw playerError;

  return { session, hostId };
};

// ─── Player: Join a session by code ───
export const joinSession = async (code: string, playerName: string) => {
  const playerId = getLocalPlayerId();

  // Find session - get the most recent one with this code that's in lobby status
  const { data: sessions, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('code', code.toUpperCase())
    .in('status', ['lobby', 'drawing'])
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !sessions || sessions.length === 0) throw new Error('Game not found. Check your code.');
  const session = sessions[0];

  // Check player count
  const { count } = await supabase
    .from('session_players')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', session.id);

  if ((count || 0) >= 5) throw new Error('This game is full (max 5 players).');

  // Check if already joined
  const { data: existing } = await supabase
    .from('session_players')
    .select('id')
    .eq('session_id', session.id)
    .eq('player_id', playerId)
    .maybeSingle();

  if (existing) {
    // Update name
    await supabase
      .from('session_players')
      .update({ name: playerName })
      .eq('id', existing.id);
  } else {
    const { error: joinError } = await supabase
      .from('session_players')
      .insert({
        session_id: session.id,
        player_id: playerId,
        name: playerName,
        is_host: false,
        points: 0,
      });
    if (joinError) throw joinError;
  }

  return { session, playerId };
};

// ─── Update session status ───
export const updateSessionStatus = async (sessionId: string, status: string) => {
  await supabase
    .from('game_sessions')
    .update({ status })
    .eq('id', sessionId);
};

// ─── Update game state (current game index, revealed cells, etc.) ───
export const updateGameState = async (sessionId: string, gameState: any, currentGameIndex?: number) => {
  const update: any = { game_state: gameState };
  if (currentGameIndex !== undefined) update.current_game_index = currentGameIndex;
  await supabase
    .from('game_sessions')
    .update(update)
    .eq('id', sessionId);
};

// ─── Update player drawing ───
export const updatePlayerDrawing = async (sessionId: string, playerId: string, drawing: string) => {
  await supabase
    .from('session_players')
    .update({ drawing })
    .eq('session_id', sessionId)
    .eq('player_id', playerId);
};

// ─── Update player points ───
export const updatePlayerPointsDb = async (sessionId: string, playerId: string, points: number) => {
  await supabase
    .from('session_players')
    .update({ points })
    .eq('session_id', sessionId)
    .eq('player_id', playerId);
};

// ─── Subscribe to session changes ───
export const subscribeToSession = (
  sessionId: string,
  onSessionChange: (payload: any) => void,
  onPlayersChange: (payload: any) => void
) => {
  const channel = supabase
    .channel(`session-${sessionId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'game_sessions', filter: `id=eq.${sessionId}` },
      onSessionChange
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'session_players', filter: `session_id=eq.${sessionId}` },
      onPlayersChange
    )
    .subscribe();

  return channel;
};

// ─── Fetch session and players ───
export const fetchSessionWithPlayers = async (sessionId: string) => {
  const { data: session } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  const { data: players } = await supabase
    .from('session_players')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at');

  return { session, players: players || [] };
};

// ─── Fetch session by code ───
export const fetchSessionByCode = async (code: string) => {
  const { data: session } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (!session) return null;

  const { data: players } = await supabase
    .from('session_players')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at');

  return { session, players: players || [] };
};

// ─── Remove player ───
export const removePlayer = async (sessionId: string, playerId: string) => {
  await supabase
    .from('session_players')
    .delete()
    .eq('session_id', sessionId)
    .eq('player_id', playerId);
};

// ─── Delete session ───
export const deleteSession = async (sessionId: string) => {
  await supabase.from('game_sessions').delete().eq('id', sessionId);
};
