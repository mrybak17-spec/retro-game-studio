import React, { useState, useRef, useEffect } from 'react';
import { X, Minus, Square } from 'lucide-react';

interface WindowProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  width?: string | number;
  height?: string | number;
  className?: string;
  draggable?: boolean;
  initialPosition?: { x: number; y: number };
  showMenuBar?: boolean;
  menuItems?: { label: string; onClick?: () => void }[];
  statusBar?: React.ReactNode;
}

export const Window: React.FC<WindowProps> = ({
  title,
  children,
  onClose,
  onMinimize,
  onMaximize,
  width = 'auto',
  height = 'auto',
  className = '',
  draggable = true,
  initialPosition = { x: 100, y: 100 },
  showMenuBar = false,
  menuItems = [],
  statusBar,
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMaximized, setIsMaximized] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isMaximized) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, isMaximized]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (draggable && !isMaximized) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
    onMaximize?.();
  };

  const windowStyle = isMaximized
    ? { top: 0, left: 0, width: '100%', height: '100%' }
    : { top: position.y, left: position.x, width, height };

  return (
    <div
      ref={windowRef}
      className={`win95-window absolute flex flex-col ${className}`}
      style={windowStyle}
    >
      {/* Title Bar */}
      <div
        className="win95-titlebar cursor-move"
        onMouseDown={handleMouseDown}
      >
        <span className="truncate text-xs">{title}</span>
        <div className="flex gap-0.5">
          {onMinimize && (
            <button
              className="win95-titlebar-btn"
              onClick={onMinimize}
              aria-label="Minimize"
            >
              <Minus className="w-2 h-2" />
            </button>
          )}
          {onMaximize && (
            <button
              className="win95-titlebar-btn"
              onClick={handleMaximize}
              aria-label="Maximize"
            >
              <Square className="w-2 h-2" />
            </button>
          )}
          {onClose && (
            <button
              className="win95-titlebar-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="w-2 h-2" />
            </button>
          )}
        </div>
      </div>

      {/* Menu Bar */}
      {showMenuBar && (
        <div className="win95-menubar">
          {menuItems.map((item, index) => (
            <span
              key={index}
              className="win95-menubar-item"
              onClick={item.onClick}
            >
              {item.label}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-1 win95-scrollbar">
        {children}
      </div>

      {/* Status Bar */}
      {statusBar && (
        <div className="win95-statusbar">
          {statusBar}
        </div>
      )}
    </div>
  );
};
