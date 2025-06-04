'use client';

import React, { useState } from 'react';
import ChessBoard from './ChessBoard';
import './GamePage.css';

export default function GamePage({
  gameMode,
  onBack,
}: {
  gameMode: 'friend' | 'pass';
  onBack: () => void;
}) {
  const [gameStarted, setGameStarted] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  // Flip board after each move in Pass and Play mode
  const handleMove = () => {
    if (gameMode === 'pass') setIsFlipped((f) => !f);
  };

  return (
    <div className="game-page">
      <div className="game-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <span className="game-title">Chess Game</span>
        <div />
      </div>
      {!gameStarted && (
        <button
          className="start-game-btn"
          onClick={() => setGameStarted(true)}
        >
          Start Game
        </button>
      )}
      <ChessBoard
        isFlipped={isFlipped}
        gameStarted={gameStarted}
        onMove={handleMove}
        gameMode={gameMode}
      />
    </div>
  );
}