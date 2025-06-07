import React, { useRef } from 'react';
import './StartPage.css';

export default function StartPage({ onSelectMode }: { onSelectMode: (mode: 'friend' | 'pass') => void }) {
  const rootRef = useRef<HTMLDivElement>(null);

  function handleClick(mode: 'friend' | 'pass') {
    if (rootRef.current) {
      rootRef.current.classList.add('fade-out');
      setTimeout(() => onSelectMode(mode), 300); // 300ms fade
    } else {
      onSelectMode(mode);
    }
  }

  return (
    <div className="start-page fade-in" ref={rootRef}>
      <h1 className="start-title">Let's play a game of Chess</h1>
      <div className="start-buttons">
        <button className="start-btn friend" onClick={() => handleClick('friend')}>
          Play a Friend Online
        </button>
        <button className="start-btn pass" onClick={() => handleClick('pass')}>
          Pass and Play
        </button>
      </div>
    </div>
  );
}