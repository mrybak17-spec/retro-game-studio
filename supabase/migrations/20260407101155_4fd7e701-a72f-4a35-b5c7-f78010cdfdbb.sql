
-- Game sessions table
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  host_id TEXT NOT NULL,
  game_show_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_game_index INTEGER NOT NULL DEFAULT 0,
  game_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'lobby',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Session players table
CREATE TABLE public.session_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  name TEXT NOT NULL,
  drawing TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  is_host BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_players ENABLE ROW LEVEL SECURITY;

-- Policies for game_sessions
CREATE POLICY "Anyone can view game sessions" ON public.game_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can create game sessions" ON public.game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update game sessions" ON public.game_sessions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete game sessions" ON public.game_sessions FOR DELETE USING (true);

-- Policies for session_players
CREATE POLICY "Anyone can view session players" ON public.session_players FOR SELECT USING (true);
CREATE POLICY "Anyone can join sessions" ON public.session_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update session players" ON public.session_players FOR UPDATE USING (true);
CREATE POLICY "Anyone can leave sessions" ON public.session_players FOR DELETE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_players;

-- Trigger for updated_at
CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
