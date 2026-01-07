import React from 'react';
import { Window } from './Window';
import { Button } from './Button';
import { AlertTriangle, Info, HelpCircle, XCircle } from 'lucide-react';

interface DialogProps {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'question';
  buttons?: { label: string; onClick: () => void; primary?: boolean }[];
  onClose: () => void;
}

export const Dialog: React.FC<DialogProps> = ({
  title,
  message,
  type = 'info',
  buttons = [{ label: 'OK', onClick: () => {}, primary: true }],
  onClose,
}) => {
  const icons = {
    info: <Info className="w-8 h-8 text-blue-600" />,
    warning: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
    error: <XCircle className="w-8 h-8 text-red-600" />,
    question: <HelpCircle className="w-8 h-8 text-blue-600" />,
  };

  return (
    <div className="win95-overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <Window
          title={title}
          onClose={onClose}
          width={350}
          draggable={false}
          initialPosition={{ x: 0, y: 0 }}
          className="relative"
        >
          <div className="p-4">
            <div className="flex gap-4 items-start mb-4">
              {icons[type]}
              <p className="text-sm flex-1">{message}</p>
            </div>
            <div className="flex justify-center gap-2">
              {buttons.map((button, index) => (
                <Button
                  key={index}
                  onClick={() => {
                    button.onClick();
                    onClose();
                  }}
                  className={button.primary ? 'font-bold' : ''}
                >
                  {button.label}
                </Button>
              ))}
            </div>
          </div>
        </Window>
      </div>
    </div>
  );
};
