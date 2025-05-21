import React from "react";
import ChessBoard from "./components/ChessBoard";

export default function Home() {
  return (
    <div>
      <h1 style={{ textAlign: "center" }}>Chess Game</h1>
      <ChessBoard />
    </div>
  );
}
