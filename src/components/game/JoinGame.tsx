import React, { useState } from 'react';
import { Window, Button, GroupBox } from '@/components/win95';
import { Gamepad2, LogIn } from 'lucide-react';

interface JoinGameProps {
  onJoined: (sessionId: string, playerId: string) => void;
  onClose: () => void;
}

export const JoinGame: React.FC<JoinGameProps> = ({ onJoined, onClose }) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) { setError('Enter a game code'); return; }
    if (!name.trim()) { setError('Enter your name'); return; }
    
    setLoading(true);
    setError('');
    
    try {
      const { joinSession } = await import('@/lib/multiplayerService');
      const { session, playerId } = await joinSession(code.trim(), name.trim());
      onJoined(session.id, playerId);
    } catch (err: any) {
      setError(err.message || 'Failed to join');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Window title="Join Game" onClose={onClose} width={400} height={340} initialPosition={{ x: 468, y: 273 }}>
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
          <Gamepad2 className="w-6 h-6 text-primary" />
          <span className="text-sm font-bold">Enter the game code from your host</span>
        </div>

        <GroupBox label="Game Code">
          <input
            className="win95-input w-full text-center text-lg font-bold font-pixel tracking-[0.3em] uppercase"
            placeholder="ABC123"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
            maxLength={6}
          />
        </GroupBox>

        <GroupBox label="Your Name">
          <input
            className="win95-input w-full text-sm"
            placeholder="Enter your name..."
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            maxLength={20}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
        </GroupBox>

        {error && (
          <div className="text-xs text-red-600 win95-inset p-2">{error}</div>
        )}

        <div className="flex gap-2 justify-end">
          <Button onClick={handleJoin} disabled={loading}>
            <LogIn className="w-3 h-3 mr-1" />
            {loading ? 'Joining...' : 'Join Game'}
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Window>
  );
};
