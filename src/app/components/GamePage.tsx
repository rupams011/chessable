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
  const [autoFlip, setAutoFlip] = useState(true);
  const [winner, setWinner] = useState<null | 'white' | 'black'>(null);

  // Handler to receive timer state from ChessBoard
  const handleTimerZero = (who: 'white' | 'black') => {
    setGameActive(false);
    setWinner(who === 'white' ? 'black' : 'white');
  };

  // Flip board after each move in Pass and Play mode if autoFlip is enabled
  const handleMove = () => {
    if (gameMode === 'pass' && autoFlip) setIsFlipped((f) => !f);
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
          onClick={() => {
            setGameActive((active) => {
              if (active) setWinner(null);
              return !active;
            });
          }}
          disabled={!!winner}
        >
          {gameActive ? 'Stop Game' : 'Start Game'}
        </button>
        <button
          className="main-action-btn"
          onClick={() => setIsFlipped((f) => !f)}
        >
          Flip Board
        </button>
        <label className="flip-toggle">
          <input
            type="checkbox"
            checked={autoFlip}
            onChange={() => setAutoFlip((v) => !v)}
          />
          <span className="flip-toggle-slider" />
          <span className="flip-toggle-label">
            {autoFlip ? 'Auto Flip' : 'Manual Flip'}
          </span>
        </label>
      </div>
      <div className="game-board-area" style={{ position: 'relative' }}>
        <ChessBoard
          isFlipped={isFlipped}
          boardEnabled={gameActive && !winner}
          gameStarted={gameActive}
          onMove={handleMove}
          gameMode={gameMode}
          onTimerZero={handleTimerZero}
        />
        {winner && (
          <div className="winner-label">
            {winner === 'white' ? 'White' : 'Black'} wins on time!
          </div>
        )}
      </div>
    </div>
  );
}