import React, { useEffect, useState } from 'react';
import { Info } from 'lucide-react';

interface DesktopWidgetProps {
  hostName?: string;
  sessionCount?: number;
}

export const DesktopWidget: React.FC<DesktopWidgetProps> = ({
  hostName = 'Host',
  sessionCount = 0,
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div
      className="absolute top-6 right-6 w-64 select-none"
      style={{
        backgroundColor: 'hsl(var(--window))',
        border: '1px solid #000',
        padding: '2px',
        boxShadow:
          'inset 1px 1px 0 #fff, inset -1px -1px 0 #808080, 3px 3px 12px rgba(0,0,0,0.35)',
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-2 py-1"
        style={{
          background:
            'linear-gradient(90deg, hsl(var(--titlebar)) 0%, hsl(210 80% 45%) 100%)',
        }}
      >
        <span className="text-xs text-white font-bold flex items-center gap-1.5">
          <Info className="w-3 h-3" />
          Status Report
        </span>
        <div className="flex gap-0.5">
          <div className="w-4 h-4 bg-window border border-black flex items-center justify-center text-[10px] shadow-[inset_1px_1px_0_#fff]">
            ?
          </div>
          <div className="w-4 h-4 bg-window border border-black flex items-center justify-center text-[10px] shadow-[inset_1px_1px_0_#fff]">
            ×
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="text-[11px] font-bold text-gray-900 mb-1">
          Welcome back, {hostName}
        </div>
        <div className="text-[10px] text-gray-700 leading-tight mb-3">
          {sessionCount > 0
            ? `Everything is green. ${sessionCount} session${
                sessionCount === 1 ? '' : 's'
              } ready. Ready for showtime.`
            : 'System ready. Create a show to begin the broadcast.'}
        </div>
        <div className="bg-white border-2 border-gray-400 p-2 text-center text-xl font-bold tracking-widest tabular-nums text-gray-800 shadow-[inset_1px_1px_0_#808080]">
          {timeStr}
        </div>
      </div>
    </div>
  );
};
