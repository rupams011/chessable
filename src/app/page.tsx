'use client';

import React, { useState } from 'react';
import StartPage from './components/StartPage';
import GamePage from './components/GamePage';

export default function Home() {
  const [screen, setScreen] = useState<'start' | 'game'>('start');
  const [gameMode, setGameMode] = useState<'friend' | 'pass'>('friend');

  return (
    <div className="app-root">
      {screen === 'start' && (
        <StartPage
          onSelectMode={(mode) => {
            setGameMode(mode);
            setScreen('game');
          }}
        />
      )}
      {screen === 'game' && (
        <GamePage
          gameMode={gameMode}
          onBack={() => setScreen('start')}
        />
      )}
    </div>
  );
}
