"use client";

import { useState, useEffect } from "react";

const MAX_LOGS = 20;

export function TouchDebugPanel() {
  const [logs, setLogs] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Override console.log to capture ScoreBox logs
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      if (msg.includes('[ScoreBox]') || msg.includes('[Scoreboard]')) {
        setLogs(prev => {
          const newLogs = [...prev, `${new Date().toLocaleTimeString()} ${msg}`];
          return newLogs.slice(-MAX_LOGS);
        });
      }
      originalLog.apply(console, args);
    };

    return () => {
      console.log = originalLog;
    };
  }, []);

  if (!visible && logs.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-2 right-2 z-50">
      <button
        onClick={() => setVisible(!visible)}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-black/80 text-white text-xs rounded-full z-50"
      >
        {visible ? 'Ocultar Debug' : `Debug (${logs.length})`}
      </button>

      {visible && (
        <div className="bg-black/90 text-green-300 text-[10px] font-mono p-3 rounded-t-lg max-h-60 overflow-auto border border-green-500/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-green-500">Touch Debug Logs</span>
            <button
              onClick={() => setLogs([])}
              className="text-red-400 hover:text-red-300"
            >
              Limpiar
            </button>
          </div>
          {logs.map((log, i) => (
            <div key={i} className="border-b border-green-500/10 py-0.5">
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}