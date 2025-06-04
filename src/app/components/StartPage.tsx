import React from 'react';
import './StartPage.css';

export default function StartPage({ onSelectMode }: { onSelectMode: (mode: 'friend' | 'pass') => void }) {
  return (
    <div className="start-page">
      <h1 className="start-title">Welcome to Modern Chess</h1>
      <div className="start-buttons">
        <button className="start-btn friend" onClick={() => onSelectMode('friend')}>
          Play a Friend Online
        </button>
        <button className="start-btn pass" onClick={() => onSelectMode('pass')}>
          Pass and Play
        </button>
      </div>
    </div>
  );
}