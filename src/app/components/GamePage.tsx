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
  const [gameActive, setGameActive] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  // Flip board after each move in Pass and Play mode
  const handleMove = () => {
    if (gameMode === 'pass') setIsFlipped((f) => !f);
  };

  return (
    <div className="game-page">
      <div className="game-header-fixed">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <span className="game-title">Chess Game</span>
        <div />
      </div>
      <div className="button-row">
        <button
          className="main-action-btn"
          onClick={() => setGameActive((active) => !active)}
        >
          {gameActive ? 'Stop Game' : 'Start Game'}
        </button>
        <button
          className="main-action-btn"
          onClick={() => setIsFlipped((f) => !f)}
        >
          Flip Board
        </button>
      </div>
      <div className="game-board-area">
        <ChessBoard
          isFlipped={isFlipped}
          boardEnabled={gameActive}
          gameStarted={gameActive}
          onMove={handleMove}
          gameMode={gameMode}
        />
      </div>
    </div>
  );
}