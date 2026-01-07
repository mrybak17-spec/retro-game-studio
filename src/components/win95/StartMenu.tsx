import React from 'react';

interface StartMenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

interface StartMenuProps {
  items: StartMenuItem[];
  onClose: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({ items, onClose }) => {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed bottom-7 left-0 win95-window z-50 w-56">
        {/* Windows 95 style sidebar */}
        <div className="flex">
          <div className="w-6 bg-titlebar flex items-end justify-center pb-2">
            <span
              className="text-titlebar-foreground font-bold text-xs"
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
              }}
            >
              Game Show Maker 95
            </span>
          </div>
          <div className="flex-1">
            {items.map((item) => (
              <button
                key={item.id}
                className="w-full flex items-center gap-2 px-2 py-1 hover:bg-titlebar hover:text-titlebar-foreground"
                onClick={() => {
                  item.onClick();
                  onClose();
                }}
              >
                <span className="w-8 h-8 flex items-center justify-center">
                  {item.icon}
                </span>
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
            <div className="border-t border-window-border-dark my-1" />
            <button
              className="w-full flex items-center gap-2 px-2 py-1 hover:bg-titlebar hover:text-titlebar-foreground"
              onClick={onClose}
            >
              <span className="w-8 h-8 flex items-center justify-center">🚪</span>
              <span className="text-sm">Exit</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
