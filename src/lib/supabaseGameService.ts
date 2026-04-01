import { supabase } from '@/integrations/supabase/client';
import { Game, GameShow } from '@/types/game';

// Upload a base64 data URL to storage and return the public URL
export const uploadMediaToStorage = async (
  dataUrl: string,
  folder: string,
  fileName: string
): Promise<string> => {
  // If it's already a storage URL, return as-is
  if (dataUrl.startsWith('http')) return dataUrl;
  
  // Convert data URL to blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  
  const ext = blob.type.includes('audio') ? 'mp3' : blob.type.includes('png') ? 'png' : 'jpg';
  const path = `${folder}/${fileName}-${Date.now()}.${ext}`;
  
  const { error } = await supabase.storage
    .from('game-media')
    .upload(path, blob, { contentType: blob.type, upsert: true });
  
  if (error) {
    console.error('Upload error:', error);
    return dataUrl; // fallback to data URL
  }
  
  const { data: urlData } = supabase.storage
    .from('game-media')
    .getPublicUrl(path);
  
  return urlData.publicUrl;
};

// Process all media in games before saving
const processGameMedia = async (game: Game, showId: string): Promise<Game> => {
  const processed = { ...game };
  
  if (game.type === 'grid') {
    const gridGame = { ...game } as any;
    const newCells = await Promise.all(
      gridGame.cells.map((row: any[], rowIdx: number) =>
        Promise.all(
          row.map(async (cell: any, colIdx: number) => {
            const newCell = { ...cell };
            if (cell.imageUrl && cell.imageUrl.startsWith('data:')) {
              newCell.imageUrl = await uploadMediaToStorage(
                cell.imageUrl, showId, `grid-${rowIdx}-${colIdx}-img`
              );
            }
            if (cell.audioUrl && cell.audioUrl.startsWith('data:')) {
              newCell.audioUrl = await uploadMediaToStorage(
                cell.audioUrl, showId, `grid-${rowIdx}-${colIdx}-audio`
              );
            }
            return newCell;
          })
        )
      )
    );
    (processed as any).cells = newCells;
  }
  
  if (game.type === 'slides') {
    const slidesGame = { ...game } as any;
    slidesGame.slides = await Promise.all(
      slidesGame.slides.map(async (slide: any, idx: number) => {
        const newSlide = { ...slide };
        if (slide.imageUrl && slide.imageUrl.startsWith('data:')) {
          newSlide.imageUrl = await uploadMediaToStorage(
            slide.imageUrl, showId, `slide-${idx}-img`
          );
        }
        if (slide.audioUrl && slide.audioUrl.startsWith('data:')) {
          newSlide.audioUrl = await uploadMediaToStorage(
            slide.audioUrl, showId, `slide-${idx}-audio`
          );
        }
        return newSlide;
      })
    );
    Object.assign(processed, slidesGame);
  }
  
  return processed;
};

// Save a game show to Supabase
export const saveGameShowToDb = async (show: GameShow): Promise<GameShow> => {
  // Process media uploads
  const processedGames = await Promise.all(
    show.games.map(game => processGameMedia(game, show.id))
  );
  
  const { data, error } = await supabase
    .from('game_shows')
    .upsert({
      id: show.id,
      name: show.name,
      description: show.description,
      games: processedGames as any,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    ...show,
    id: data.id,
    games: processedGames,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
};

// Load all game shows from Supabase
export const loadGameShowsFromDb = async (): Promise<GameShow[]> => {
  const { data, error } = await supabase
    .from('game_shows')
    .select('*')
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  
  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    games: (row.games as any) || [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
};

// Delete a game show from Supabase
export const deleteGameShowFromDb = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('game_shows')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
