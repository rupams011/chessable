'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ChessBoard from './ChessBoard';
import './GamePage.css';

export default function GamePage({
  gameMode,
  onBack,
}: {
  gameMode: 'friend' | 'pass';
  onBack?: () => void;
}) {
  const [gameStarted, setGameStarted] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const router = useRouter();

  // Flip board after each move in Pass and Play mode
  const handleMove = () => {
    if (gameMode === 'pass') setIsFlipped((f) => !f);
  };

  // Use router.push for navigation, fallback to onBack if provided
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="game-page">
      <div className="game-header-fixed">
        <button className="back-btn" onClick={handleBack}>← Back</button>
        <span className="game-title">Chess Game</span>
        <div />
      </div>
      {!gameStarted && (
        <div className="start-game-btn-row">
          <button
            className="start-game-btn"
            onClick={() => setGameStarted(true)}
          >
            Start Game
          </button>
        </div>
      )}
      <div className="game-board-area">
        <ChessBoard
          isFlipped={isFlipped}
          gameStarted={gameStarted}
          onMove={handleMove}
          gameMode={gameMode}
        />
      </div>
    </div>
  );
}