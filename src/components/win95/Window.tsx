import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Minus, Square } from 'lucide-react';

interface WindowProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  width?: string | number;
  height?: string | number;
  minWidth?: number;
  minHeight?: number;
  className?: string;
  draggable?: boolean;
  resizable?: boolean;
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
  width = 400,
  height = 300,
  minWidth = 200,
  minHeight = 150,
  className = '',
  draggable = true,
  resizable = true,
  initialPosition = { x: 100, y: 100 },
  showMenuBar = false,
  menuItems = [],
  statusBar,
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState({ 
    width: typeof width === 'number' ? width : 400, 
    height: typeof height === 'number' ? height : 300 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [preMaxState, setPreMaxState] = useState({ position, size });
  
  const windowRef = useRef<HTMLDivElement>(null);
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isMaximized) {
        setPosition({
          x: Math.max(0, e.clientX - dragOffset.x),
          y: Math.max(0, e.clientY - dragOffset.y),
        });
      }
      
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.current.x;
        const deltaY = e.clientY - resizeStart.current.y;
        
        let newWidth = resizeStart.current.width;
        let newHeight = resizeStart.current.height;
        let newX = resizeStart.current.posX;
        let newY = resizeStart.current.posY;
        
        if (isResizing.includes('e')) {
          newWidth = Math.max(minWidth, resizeStart.current.width + deltaX);
        }
        if (isResizing.includes('w')) {
          const widthDelta = Math.min(deltaX, resizeStart.current.width - minWidth);
          newWidth = resizeStart.current.width - widthDelta;
          newX = resizeStart.current.posX + widthDelta;
        }
        if (isResizing.includes('s')) {
          newHeight = Math.max(minHeight, resizeStart.current.height + deltaY);
        }
        if (isResizing.includes('n')) {
          const heightDelta = Math.min(deltaY, resizeStart.current.height - minHeight);
          newHeight = resizeStart.current.height - heightDelta;
          newY = resizeStart.current.posY + heightDelta;
        }
        
        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, isMaximized, minWidth, minHeight]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (draggable && !isMaximized) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(direction);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      posX: position.x,
      posY: position.y,
    };
  }, [size, position]);

  const handleMaximize = () => {
    if (isMaximized) {
      setPosition(preMaxState.position);
      setSize(preMaxState.size);
    } else {
      setPreMaxState({ position, size });
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight - 40 });
    }
    setIsMaximized(!isMaximized);
    onMaximize?.();
  };

  const actualPos = isMaximized ? { x: 0, y: 0 } : position;
  const actualSize = isMaximized 
    ? { width: window.innerWidth, height: window.innerHeight - 40 } 
    : size;

  return (
    <div
      ref={windowRef}
      className={`win95-window absolute flex flex-col ${className}`}
      style={{ 
        top: actualPos.y, 
        left: actualPos.x, 
        width: actualSize.width, 
        height: actualSize.height,
        minWidth,
        minHeight,
      }}
    >
      {/* Title Bar */}
      <div
        className="win95-titlebar cursor-move select-none shrink-0"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleMaximize}
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
        <div className="win95-menubar shrink-0">
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
        <div className="win95-statusbar shrink-0">
          {statusBar}
        </div>
      )}

      {/* Resize Handles */}
      {resizable && !isMaximized && (
        <>
          <div
            className="absolute top-0 left-2 right-2 h-1 cursor-n-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
          />
          <div
            className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 's')}
          />
          <div
            className="absolute left-0 top-2 bottom-2 w-1 cursor-w-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
          />
          <div
            className="absolute right-0 top-2 bottom-2 w-1 cursor-e-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
          />
          <div
            className="absolute top-0 left-0 w-2 h-2 cursor-nw-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
          />
          <div
            className="absolute top-0 right-0 w-2 h-2 cursor-ne-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
          />
          <div
            className="absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
          />
          <div
            className="absolute bottom-0 right-0 w-2 h-2 cursor-se-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
          />
        </>
      )}
    </div>
  );
};
