
-- Create game_shows table
CREATE TABLE public.game_shows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  games JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_shows ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth needed for this app)
CREATE POLICY "Anyone can view game shows" ON public.game_shows FOR SELECT USING (true);
CREATE POLICY "Anyone can create game shows" ON public.game_shows FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update game shows" ON public.game_shows FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete game shows" ON public.game_shows FOR DELETE USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_game_shows_updated_at
  BEFORE UPDATE ON public.game_shows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for media (images, audio)
INSERT INTO storage.buckets (id, name, public) VALUES ('game-media', 'game-media', true);

CREATE POLICY "Anyone can view game media" ON storage.objects FOR SELECT USING (bucket_id = 'game-media');
CREATE POLICY "Anyone can upload game media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'game-media');
CREATE POLICY "Anyone can update game media" ON storage.objects FOR UPDATE USING (bucket_id = 'game-media');
CREATE POLICY "Anyone can delete game media" ON storage.objects FOR DELETE USING (bucket_id = 'game-media');
