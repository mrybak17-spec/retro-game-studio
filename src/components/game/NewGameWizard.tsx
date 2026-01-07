import React, { useState } from 'react';
import { Window, Button } from '@/components/win95';
import { Grid3X3, Presentation, CircleDot } from 'lucide-react';

interface NewGameWizardProps {
  onSelectType: (type: 'grid' | 'slides' | 'wheel') => void;
  onClose: () => void;
}

export const NewGameWizard: React.FC<NewGameWizardProps> = ({
  onSelectType,
  onClose,
}) => {
  const [selected, setSelected] = useState<'grid' | 'slides' | 'wheel' | null>(null);

  const gameTypes = [
    {
      id: 'grid' as const,
      icon: <Grid3X3 className="w-10 h-10" />,
      title: 'Grid Game',
      description: 'Jeopardy-style grid with categories and point values. Perfect for trivia!',
    },
    {
      id: 'slides' as const,
      icon: <Presentation className="w-10 h-10" />,
      title: 'Slides Game',
      description: 'Presentation-style slides with text, images, and audio for storytelling.',
    },
    {
      id: 'wheel' as const,
      icon: <CircleDot className="w-10 h-10" />,
      title: 'Wheel Game',
      description: 'Spin the wheel to reveal prizes and questions. Great for excitement!',
    },
  ];

  return (
    <Window
      title="New Game Wizard"
      onClose={onClose}
      width={450}
      height={350}
      initialPosition={{ x: 200, y: 120 }}
    >
      <div className="p-4 flex flex-col h-full">
        <div className="mb-4">
          <h2 className="text-sm font-bold mb-1">Choose a Game Type</h2>
          <p className="text-xs text-muted-foreground">
            Select the type of game show you want to create.
          </p>
        </div>

        <div className="flex-1 flex flex-col gap-2">
          {gameTypes.map((type) => (
            <button
              key={type.id}
              className={`win95-raised p-3 flex items-start gap-3 text-left ${
                selected === type.id ? 'ring-2 ring-titlebar' : ''
              }`}
              onClick={() => setSelected(type.id)}
              onDoubleClick={() => onSelectType(type.id)}
            >
              <div className="text-titlebar">{type.icon}</div>
              <div>
                <div className="font-bold text-sm">{type.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {type.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-window-border-dark">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => selected && onSelectType(selected)}
            disabled={!selected}
          >
            Next &gt;
          </Button>
        </div>
      </div>
    </Window>
  );
};
