"use client";

import React, { useState } from 'react';
import './ChessBoard.css'; // Import the CSS file for styling

const ChessBoard: React.FC = () => {
    // Initial board setup with pieces
    const initialBoard = [
        ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'], // Black pieces
        ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'], // Black pawns
        [null, null, null, null, null, null, null, null], // Empty row
        [null, null, null, null, null, null, null, null], // Empty row
        [null, null, null, null, null, null, null, null], // Empty row
        [null, null, null, null, null, null, null, null], // Empty row
        ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'], // White pawns
        ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'], // White pieces
    ];

    const [board, setBoard] = useState<(string | null)[][]>(initialBoard);
    const [isFlipped, setIsFlipped] = useState(false); // Track whether the board is flipped
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [greenHighlights, setGreenHighlights] = useState<{ from: { row: number; col: number }; to: { row: number; col: number } } | null>(null);
    const [yellowHighlight, setYellowHighlight] = useState<{ row: number; col: number } | null>(null);

    // Generate row and column labels dynamically based on the board orientation
    const rows = isFlipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
    const columns = isFlipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    // Get the actual row and column indices based on the flipped state
    const getActualIndices = (row: number, col: number) => {
        const actualRow = isFlipped ? 7 - row : row;
        const actualCol = isFlipped ? 7 - col : col;
        return { actualRow, actualCol };
    };

    const handleSquareClick = (row: number, col: number) => {
        const { actualRow, actualCol } = getActualIndices(row, col);

        if (selectedCell) {
            const { row: selectedRow, col: selectedCol } = selectedCell; // Use logical indices from selectedCell

            // Move the piece to the new square
            const newBoard = board.map((r, rowIndex) =>
                r.map((square, colIndex) => {
                    if (rowIndex === actualRow && colIndex === actualCol) {
                        return board[selectedRow][selectedCol]; // Move the piece here
                    }
                    if (rowIndex === selectedRow && colIndex === selectedCol) {
                        return null; // Clear the original square
                    }
                    return square; // Leave other squares unchanged
                })
            );

            setBoard(newBoard);
            setGreenHighlights({ from: { row: selectedRow, col: selectedCol }, to: { row: actualRow, col: actualCol } }); // Highlight the move
            setSelectedCell(null); // Clear the selected cell
            setYellowHighlight(null); // Clear yellow highlight
        } else if (board[actualRow]?.[actualCol]) {
            // Select the piece if the square contains one
            setSelectedCell({ row: actualRow, col: actualCol }); // Store logical indices in selectedCell
            setGreenHighlights({ from: { row: actualRow, col: actualCol }, to: { row: actualRow, col: actualCol } }); // Highlight the selected piece
            setYellowHighlight(null); // Clear yellow highlight
        } else {
            // Highlight the selected empty cell in yellow
            setYellowHighlight({ row: actualRow, col: actualCol }); // Use actual indices for yellow highlight
        }
    };

    const flipBoard = () => {
        setIsFlipped(!isFlipped); // Toggle the flipped state
        setYellowHighlight(null); // Clear yellow highlight when flipping
        // Adjust selectedCell to ensure it remains consistent with the logical board
        if (selectedCell) {
            setSelectedCell({
                row: 7 - selectedCell.row,
                col: 7 - selectedCell.col,
            });
        }
    };

    return (
        <div className="chess-container">
            <div className="chess-board">
                {(isFlipped ? [...board].reverse() : board).map((row, rowIndex) =>
                    (isFlipped ? [...row].reverse() : row).map((square, colIndex) => {
                        const { actualRow, actualCol } = getActualIndices(rowIndex, colIndex);
                        const isGreenFrom =
                            greenHighlights &&
                            greenHighlights.from.row === actualRow &&
                            greenHighlights.from.col === actualCol;
                        const isGreenTo =
                            greenHighlights &&
                            greenHighlights.to.row === actualRow &&
                            greenHighlights.to.col === actualCol;
                        const isYellow =
                            yellowHighlight &&
                            yellowHighlight.row === actualRow &&
                            yellowHighlight.col === actualCol;

                        return (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`chess-square ${((rowIndex + colIndex) % 2 === 0) ? 'light' : 'dark'} ${
                                    isGreenFrom || isGreenTo ? 'green-highlight' : ''
                                } ${isYellow ? 'yellow-highlight' : ''}`}
                                onClick={() => handleSquareClick(rowIndex, colIndex)}
                            >
                                {square && <span className="chess-piece">{square}</span>}
                                {/* Add row and column labels */}
                                {colIndex === 0 && (
                                    <span className="row-label">
                                        {rows[rowIndex]}
                                    </span>
                                )}
                                {rowIndex === 7 && (
                                    <span className="column-label">
                                        {columns[colIndex]}
                                    </span>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
            {/* Flip Board Button */}
            <button className="flip-button" onClick={flipBoard}>
                Flip Board
            </button>
        </div>
    );
};

export default ChessBoard;