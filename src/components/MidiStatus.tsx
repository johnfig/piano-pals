'use client';

import { useState, useEffect } from 'react';
import InputManager from '@/engine/InputManager';

interface MidiStatusProps {
  inputManager: InputManager;
}

export default function MidiStatus({ inputManager }: MidiStatusProps) {
  const [midiAvailable] = useState(() => inputManager.isMidiAvailable());
  const [midiEnabled, setMidiEnabled] = useState(false);
  const [devices, setDevices] = useState<string[]>([]);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    setMidiEnabled(inputManager.isMidiEnabled());
    setDevices(inputManager.getConnectedMidiDevices());

    const onDevicesChanged = (newDevices: string[]) => {
      setDevices(newDevices);
      setMidiEnabled(inputManager.isMidiEnabled());
    };
    inputManager.addOnMidiDevicesChanged(onDevicesChanged);

    return () => {
      inputManager.removeOnMidiDevicesChanged(onDevicesChanged);
    };
  }, [inputManager]);

  const handleConnect = async () => {
    setConnecting(true);
    const ok = await inputManager.enableMidi();
    setMidiEnabled(ok);
    setDevices(inputManager.getConnectedMidiDevices());
    setConnecting(false);
  };

  const handleReconnect = async () => {
    setConnecting(true);
    const ok = await inputManager.reconnectMidi();
    setMidiEnabled(ok);
    setDevices(inputManager.getConnectedMidiDevices());
    setConnecting(false);
  };

  if (!midiAvailable) return null;

  const connected = midiEnabled && devices.length > 0;
  const enabledNoDevices = midiEnabled && devices.length === 0;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 mt-4">
      <div className="rounded-xl bg-[#1A1530] border border-white/[0.08] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎹</span>
            <span className="text-gray-400 text-sm font-medium">MIDI Keyboard</span>
          </div>

          {!midiEnabled ? (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
            >
              {connecting ? 'Connecting...' : 'Connect'}
            </button>
          ) : connected ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-medium">Connected</span>
            </div>
          ) : (
            <button
              onClick={handleReconnect}
              disabled={connecting}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
            >
              {connecting ? 'Scanning...' : 'Reconnect'}
            </button>
          )}
        </div>

        {connected && (
          <div className="mt-2 space-y-1">
            {devices.map((device, i) => (
              <div key={i} className="text-gray-500 text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {device}
              </div>
            ))}
          </div>
        )}

        {enabledNoDevices && (
          <p className="mt-2 text-yellow-500/70 text-xs">
            No devices detected. Plug in your keyboard and tap Reconnect.
          </p>
        )}
      </div>
    </div>
  );
}
