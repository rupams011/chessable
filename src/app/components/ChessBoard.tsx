"use client";

import React, { useState } from 'react';
import './ChessBoard.css'; // Import the CSS file for styling
import {
    Position,
    Piece,
    Board,
    Color,
    PieceType,
    pieceMoveFunctions,
} from './chessRules'; // Import chess rules

// Helper: Map Unicode to PieceType and Color
const unicodeToPiece: Record<string, { type: PieceType; color: Color }> = {
    '♙': { type: 'pawn', color: 'white' },
    '♖': { type: 'rook', color: 'white' },
    '♘': { type: 'knight', color: 'white' },
    '♗': { type: 'bishop', color: 'white' },
    '♕': { type: 'queen', color: 'white' },
    '♔': { type: 'king', color: 'white' },
    '♟': { type: 'pawn', color: 'black' },
    '♜': { type: 'rook', color: 'black' },
    '♞': { type: 'knight', color: 'black' },
    '♝': { type: 'bishop', color: 'black' },
    '♛': { type: 'queen', color: 'black' },
    '♚': { type: 'king', color: 'black' },
};

// Helper: Convert board of strings to board of Piece | null
function convertToPieceBoard(board: (string | null)[][]): Board {
    return board.map(row =>
        row.map(cell =>
            cell ? { ...unicodeToPiece[cell] } as Piece : null
        )
    );
}

// Helper: Convert board of Piece | null to board of strings
function convertToStringBoard(board: Board): (string | null)[][] {
    const pieceToUnicode: Record<Color, Record<PieceType, string>> = {
        white: {
            pawn: '♙',
            rook: '♖',
            knight: '♘',
            bishop: '♗',
            queen: '♕',
            king: '♔',
        },
        black: {
            pawn: '♟',
            rook: '♜',
            knight: '♞',
            bishop: '♝',
            queen: '♛',
            king: '♚',
        },
    };
    return board.map(row =>
        row.map(cell =>
            cell ? pieceToUnicode[cell.color][cell.type] : null
        )
    );
}

const ChessBoard: React.FC = () => {
    // Initial board setup with pieces
    const initialBoard = [
        ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
        ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
        ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'],
    ];

    const [board, setBoard] = useState<(string | null)[][]>(initialBoard);
    const [isFlipped, setIsFlipped] = useState(false);
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [greenHighlights, setGreenHighlights] = useState<{ from: { row: number; col: number }; to: { row: number; col: number } } | null>(null);
    const [yellowHighlight, setYellowHighlight] = useState<{ row: number; col: number } | null>(null);
    const [validMoves, setValidMoves] = useState<Position[]>([]); // Store valid moves for selected piece

    // Generate row and column labels dynamically based on the board orientation
    const rows = isFlipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
    const columns = isFlipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    // Get the actual row and column indices based on the flipped state
    const getActualIndices = (row: number, col: number) => {
        const actualRow = isFlipped ? 7 - row : row;
        const actualCol = isFlipped ? 7 - col : col;
        return { actualRow, actualCol };
    };

    const isValidMove = (row: number, col: number) =>
        validMoves.some(move => move.x === col && move.y === row);

    const handleSquareClick = (row: number, col: number) => {
        const { actualRow, actualCol } = getActualIndices(row, col);

        if (selectedCell) {
            // If the clicked square is a valid move, move the piece
            if (isValidMove(actualRow, actualCol)) {
                const { row: selectedRow, col: selectedCol } = selectedCell;
                const newBoard = board.map((r, rowIndex) =>
                    r.map((square, colIndex) => {
                        if (rowIndex === actualRow && colIndex === actualCol) {
                            return board[selectedRow][selectedCol];
                        }
                        if (rowIndex === selectedRow && colIndex === selectedCol) {
                            return null;
                        }
                        return square;
                    })
                );
                setBoard(newBoard);
                setGreenHighlights({ from: { row: selectedRow, col: selectedCol }, to: { row: actualRow, col: actualCol } });
                setSelectedCell(null);
                setYellowHighlight(null);
                setValidMoves([]);
            } else if (board[actualRow]?.[actualCol]) {
                // If another piece is selected, select it and show its moves
                setSelectedCell({ row: actualRow, col: actualCol });
                setGreenHighlights({ from: { row: actualRow, col: actualCol }, to: { row: actualRow, col: actualCol } });
                setYellowHighlight(null);
                // Calculate valid moves for the new selection
                const pieceChar = board[actualRow][actualCol];
                if (pieceChar) {
                    const pieceInfo = unicodeToPiece[pieceChar];
                    const pieceBoard = convertToPieceBoard(board);
                    const moves = pieceMoveFunctions[pieceInfo.type](
                        { x: actualCol, y: actualRow },
                        pieceBoard,
                        pieceInfo.color
                    );
                    setValidMoves(moves);
                } else {
                    setValidMoves([]);
                }
            } else {
                // Clicked on an invalid square, clear selection
                setSelectedCell(null);
                setYellowHighlight({ row: actualRow, col: actualCol });
                setValidMoves([]);
            }
        } else if (board[actualRow]?.[actualCol]) {
            // Select the piece if the square contains one
            setSelectedCell({ row: actualRow, col: actualCol });
            setGreenHighlights({ from: { row: actualRow, col: actualCol }, to: { row: actualRow, col: actualCol } });
            setYellowHighlight(null);
            // Calculate valid moves for the selected piece
            const pieceChar = board[actualRow][actualCol];
            if (pieceChar) {
                const pieceInfo = unicodeToPiece[pieceChar];
                const pieceBoard = convertToPieceBoard(board);
                const moves = pieceMoveFunctions[pieceInfo.type](
                    { x: actualCol, y: actualRow },
                    pieceBoard,
                    pieceInfo.color
                );
                setValidMoves(moves);
            } else {
                setValidMoves([]);
            }
        } else {
            // Highlight the selected empty cell in yellow
            setYellowHighlight({ row: actualRow, col: actualCol });
            setValidMoves([]);
        }
    };

    const flipBoard = () => {
        setIsFlipped(!isFlipped);
        setYellowHighlight(null);
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
                        const isValid =
                            selectedCell &&
                            isValidMove(actualRow, actualCol);

                        return (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`chess-square ${((rowIndex + colIndex) % 2 === 0) ? 'light' : 'dark'} ${
                                    isGreenFrom || isGreenTo ? 'green-highlight' : ''
                                } ${isYellow ? 'yellow-highlight' : ''} ${isValid ? 'highlight' : ''}`}
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