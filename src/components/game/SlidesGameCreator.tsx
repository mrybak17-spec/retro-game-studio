import React, { useState } from 'react';
import { Window, Button, GroupBox, Input } from '@/components/win95';
import { SlidesGame, Slide } from '@/types/game';
import { Plus, Trash2, ChevronLeft, ChevronRight, Image, Music } from 'lucide-react';

interface SlidesGameCreatorProps {
  game?: SlidesGame;
  onSave: (game: SlidesGame) => void;
  onClose: () => void;
  saveLabel?: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const createEmptySlide = (): Slide => ({
  id: generateId(),
  text: '',
  question: '',
  answer: '',
});

export const SlidesGameCreator: React.FC<SlidesGameCreatorProps> = ({
  game,
  onSave,
  onClose,
  saveLabel = 'Save',
}) => {
  const [name, setName] = useState(game?.name || 'My Slides Game');
  const [slides, setSlides] = useState<Slide[]>(
    game?.slides || [createEmptySlide()]
  );
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState(
    game?.backgroundColor || '#1e3a8a'
  );
  const [textColor, setTextColor] = useState(game?.textColor || '#ffffff');

  const currentSlide = slides[currentSlideIndex];

  const handleAddSlide = () => {
    setSlides([...slides, createEmptySlide()]);
    setCurrentSlideIndex(slides.length);
  };

  const handleDeleteSlide = () => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== currentSlideIndex);
    setSlides(newSlides);
    setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
  };

  const handleSlideUpdate = (updates: Partial<Slide>) => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex] = { ...currentSlide, ...updates };
    setSlides(newSlides);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleSlideUpdate({ imageUrl: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleSlideUpdate({ audioUrl: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const slidesGame: SlidesGame = {
      id: game?.id || generateId(),
      type: 'slides',
      name,
      slides,
      backgroundColor,
      textColor,
    };
    onSave(slidesGame);
  };

  return (
    <Window
      title="Slides Game Creator"
      onClose={onClose}
      width={750}
      height={550}
      initialPosition={{ x: 80, y: 50 }}
      statusBar={
        <span className="win95-statusbar-section flex-1">
          Slide {currentSlideIndex + 1} of {slides.length}
        </span>
      }
    >
      <div className="flex h-full gap-2 p-2">
        {/* Left Panel */}
        <div className="w-44 flex flex-col gap-2">
          <GroupBox label="Game Settings">
            <div className="flex flex-col gap-2">
              <Input
                label="Game Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <span className="text-xs">Background:</span>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-8 h-6"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">Text Color:</span>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-8 h-6"
                />
              </div>
            </div>
          </GroupBox>

          <GroupBox label="Slides">
            <div className="flex flex-col gap-1">
              <div className="flex gap-1">
                <Button variant="icon" onClick={handleAddSlide} title="Add Slide">
                  <Plus className="w-3 h-3" />
                </Button>
                <Button
                  variant="icon"
                  onClick={handleDeleteSlide}
                  disabled={slides.length <= 1}
                  title="Delete Slide"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <div className="win95-inset h-32 overflow-y-auto">
                {slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={`px-2 py-1 cursor-pointer text-xs ${
                      index === currentSlideIndex
                        ? 'bg-titlebar text-titlebar-foreground'
                        : 'hover:bg-secondary'
                    }`}
                    onClick={() => setCurrentSlideIndex(index)}
                  >
                    Slide {index + 1}
                    {slide.text && ` - ${slide.text.slice(0, 15)}...`}
                  </div>
                ))}
              </div>
            </div>
          </GroupBox>

          <div className="flex-1" />
          
          <div className="flex gap-1">
            <Button onClick={handleSave}>{saveLabel}</Button>
            <Button onClick={onClose}>Cancel</Button>
          </div>
        </div>

        {/* Center - Preview */}
        <div className="flex-1 flex flex-col">
          <GroupBox label="Slide Preview" className="flex-1">
            <div
              className="h-full flex flex-col items-center justify-center p-4 relative"
              style={{ backgroundColor, color: textColor }}
            >
              {currentSlide.imageUrl && (
                <img
                  src={currentSlide.imageUrl}
                  alt="Slide"
                  className="max-w-full max-h-32 object-contain mb-2"
                />
              )}
              <p className="text-center font-pixel text-lg">
                {currentSlide.text || 'Enter slide text...'}
              </p>
              {currentSlide.audioUrl && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs">
                  <Music className="w-3 h-3" />
                  Audio attached
                </div>
              )}
            </div>
          </GroupBox>
          
          {/* Navigation */}
          <div className="flex justify-center gap-2 mt-2">
            <Button
              variant="icon"
              onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
              disabled={currentSlideIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-4 py-1 text-xs">
              {currentSlideIndex + 1} / {slides.length}
            </span>
            <Button
              variant="icon"
              onClick={() =>
                setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))
              }
              disabled={currentSlideIndex === slides.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Right Panel - Editor */}
        <div className="w-52">
          <GroupBox label="Slide Content">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-0.5">
                <label className="text-xs">Slide Text</label>
                <textarea
                  className="win95-input h-16 resize-none"
                  value={currentSlide.text}
                  onChange={(e) => handleSlideUpdate({ text: e.target.value })}
                  placeholder="Enter text..."
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs">Image</label>
                <div className="flex gap-1">
                  <label className="win95-button px-2 py-0.5 cursor-pointer flex items-center gap-1">
                    <Image className="w-3 h-3" />
                    <span className="text-xs">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                  {currentSlide.imageUrl && (
                    <Button
                      variant="icon"
                      onClick={() => handleSlideUpdate({ imageUrl: undefined })}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs">Audio</label>
                <div className="flex gap-1">
                  <label className="win95-button px-2 py-0.5 cursor-pointer flex items-center gap-1">
                    <Music className="w-3 h-3" />
                    <span className="text-xs">Upload</span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={handleAudioUpload}
                    />
                  </label>
                  {currentSlide.audioUrl && (
                    <Button
                      variant="icon"
                      onClick={() => handleSlideUpdate({ audioUrl: undefined })}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="border-t border-window-border-dark my-2" />
              
              <div className="flex flex-col gap-0.5">
                <label className="text-xs">Question (optional)</label>
                <textarea
                  className="win95-input h-12 resize-none"
                  value={currentSlide.question || ''}
                  onChange={(e) => handleSlideUpdate({ question: e.target.value })}
                  placeholder="Optional question..."
                />
              </div>
              
              <Input
                label="Answer"
                value={currentSlide.answer || ''}
                onChange={(e) => handleSlideUpdate({ answer: e.target.value })}
                placeholder="Optional answer..."
              />
            </div>
          </GroupBox>
        </div>
      </div>
    </Window>
  );
};
