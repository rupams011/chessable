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

  // Editable player names and time (before game starts)
  const [editPlayerName, setEditPlayerName] = useState('White');
  const [editOpponentName, setEditOpponentName] = useState('Black');
  const [editMinutes, setEditMinutes] = useState(10);

  // Once the game is started, these are fixed
  const [playerName, setPlayerName] = useState('White');
  const [opponentName, setOpponentName] = useState('Black');
  const [initialMinutes, setInitialMinutes] = useState(10);
  const [namesLocked, setNamesLocked] = useState(false);

  // Handler to receive timer state from ChessBoard
  const handleTimerZero = (who: 'white' | 'black') => {
    setGameActive(false);
    setWinner(who === 'white' ? 'black' : 'white');
  };

  // Flip board after each move in Pass and Play mode if autoFlip is enabled
  const handleMove = () => {
    if (gameMode === 'pass' && autoFlip) setIsFlipped((f) => !f);
  };

  // When starting the game, set names and time (only once)
  const handleStartGame = () => {
    if (!namesLocked) {
      setPlayerName(editPlayerName.trim() || 'White');
      setOpponentName(editOpponentName.trim() || 'Black');
      setInitialMinutes(editMinutes);
      setNamesLocked(true);
    }
    setGameActive(true);
    setWinner(null);
  };

  return (
    <div className="game-page">
      <div className="game-header-fixed">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <span className="game-title">Chess Game</span>
        <div />
      </div>
      <div className="button-row">
        {!namesLocked && (
          <div className="edit-fields">
            <input
              className="edit-input"
              value={editPlayerName}
              onChange={e => setEditPlayerName(e.target.value)}
              placeholder="White player name"
              maxLength={16}
            />
            <input
              className="edit-input"
              value={editOpponentName}
              onChange={e => setEditOpponentName(e.target.value)}
              placeholder="Black player name"
              maxLength={16}
            />
            <input
              className="edit-input"
              type="number"
              min={1}
              max={60}
              value={editMinutes}
              onChange={e => setEditMinutes(Number(e.target.value))}
              style={{ width: 70 }}
              aria-label="Minutes per player"
            />
            <span className="edit-label">min</span>
          </div>
        )}
        <button
          className="main-action-btn"
          onClick={() => {
            if (!gameActive) handleStartGame();
            else setGameActive(false);
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
          playerName={playerName}
          opponentName={opponentName}
          initialMinutes={initialMinutes}
        />
        {winner && (
          <div className="winner-label">
            {winner === 'white' ? playerName : opponentName} wins on time!
          </div>
        )}
      </div>
    </div>
  );
}