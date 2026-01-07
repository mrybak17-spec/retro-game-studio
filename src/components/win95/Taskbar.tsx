import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-7 bg-window win95-raised flex items-center px-0.5 z-50">
      {/* Start Button */}
      <button
        className={cn(
          'win95-button h-5 px-1 flex items-center gap-1 mr-1',
          startMenuOpen && 'win95-button-pressed'
        )}
        onClick={onStartClick}
      >
        <span className="text-base">🪟</span>
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
      <div className="win95-inset h-5 px-2 flex items-center ml-1">
        <span className="text-xs">{formatTime(time)}</span>
      </div>
    </div>
  );
};
