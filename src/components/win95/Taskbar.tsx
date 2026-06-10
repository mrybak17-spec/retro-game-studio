import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Volume2, Wifi } from 'lucide-react';

interface TaskbarItem {
  id: string;
  title: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

interface TaskbarProps {
  items?: TaskbarItem[];
  onStartClick?: () => void;
  startMenuOpen?: boolean;
}

const WinFlag: React.FC = () => (
  <div className="flex flex-wrap w-[14px] gap-[1px]">
    <div className="w-[6px] h-[6px] bg-[#f65314]" />
    <div className="w-[6px] h-[6px] bg-[#7cbb00]" />
    <div className="w-[6px] h-[6px] bg-[#00a1f1]" />
    <div className="w-[6px] h-[6px] bg-[#ffbb00]" />
  </div>
);

export const Taskbar: React.FC<TaskbarProps> = ({
  items = [],
  onStartClick,
  startMenuOpen = false,
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-7 flex items-center px-0.5 z-50"
      style={{
        background: 'linear-gradient(to bottom, #d8d8d8 0%, #c0c0c0 50%, #b4b4b4 100%)',
        borderTop: '1px solid #ffffff',
        boxShadow: '0 -2px 6px rgba(0,0,0,0.25)',
      }}
    >
      {/* Start Button */}
      <button
        className={cn(
          'win95-button h-5 px-1.5 flex items-center gap-1.5 mr-1',
          startMenuOpen && 'win95-button-pressed'
        )}
        onClick={onStartClick}
      >
        <WinFlag />
        <span className="font-bold text-xs">Start</span>
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-window-border-dark mx-1" />

      {/* Task Items */}
      <div className="flex-1 flex items-center gap-0.5 overflow-hidden">
        {items.map((item) => (
          <button
            key={item.id}
            className={cn(
              'win95-button h-5 px-2 flex items-center gap-1 max-w-[150px] truncate',
              item.active && 'win95-button-pressed'
            )}
            onClick={item.onClick}
          >
            {item.icon}
            <span className="text-xs truncate">{item.title}</span>
          </button>
        ))}
      </div>

      {/* System Tray */}
      <div className="win95-inset h-5 px-2 flex items-center gap-2 ml-1">
        <Volume2 className="w-3 h-3 text-gray-700" />
        <Wifi className="w-3 h-3 text-gray-700" />
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.8)]" />
        <span className="text-xs tabular-nums">{formatTime(time)}</span>
      </div>
    </div>
  );
};
