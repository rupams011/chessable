"use client";

import React, { useState, useRef } from 'react';
import './ChessBoard.css';
import {
    Position,
    Piece,
    Board,
    Color,
    PieceType,
    pieceMoveFunctions,
    GameState,
    Move,
} from './chessRules';

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
    const [redBlinkCell, setRedBlinkCell] = useState<{ row: number; col: number } | null>(null);
    const redBlinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // --- Special move state for castling and en passant ---
    // Track which pieces have moved (for castling)
    const [hasMoved, setHasMoved] = useState<{ [key: string]: boolean }>({});
    // Track en passant target square (if any)
    const [enPassantTarget, setEnPassantTarget] = useState<Position | null>(null);
    // Track move history for en passant
    const [moveHistory, setMoveHistory] = useState<Move[]>([]);
    // Add currentTurn state
    const [currentTurn, setCurrentTurn] = useState<Color>('white');

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

    // Helper to build GameState for rules
    function getGameState(board: Board): GameState {
        return {
            board,
            moveHistory,
            hasMoved,
            enPassantTarget,
        };
    }

    // Helper: Check if a move would leave the king in check (placeholder, replace with real logic if available)
    function wouldLeaveKingInCheck(
        from: { row: number; col: number },
        to: { row: number; col: number },
        pieceInfo: { type: PieceType; color: Color }
    ): boolean {
        // Placeholder: always returns false (legal), replace with real check detection if available
        // To implement: simulate the move, check if king of pieceInfo.color is under attack
        return false;
    }

    // --- Enhanced move logic for castling and en passant ---
    const handleSquareClick = (row: number, col: number) => {
        const { actualRow, actualCol } = getActualIndices(row, col);

        // Only allow selecting your own piece on your turn
        if (!selectedCell) {
            const pieceChar = board[actualRow]?.[actualCol];
            if (!pieceChar) {
                setYellowHighlight({ row: actualRow, col: actualCol });
                setValidMoves([]);
                return;
            }
            const pieceInfo = unicodeToPiece[pieceChar];
            if (pieceInfo.color !== currentTurn) {
                // Not your turn, can't select opponent's piece
                return;
            }
            setSelectedCell({ row: actualRow, col: actualCol });
            setGreenHighlights({ from: { row: actualRow, col: actualCol }, to: { row: actualRow, col: actualCol } });
            setYellowHighlight(null);
            const pieceBoard = convertToPieceBoard(board);
            const gameState = getGameState(pieceBoard);
            const moves = pieceMoveFunctions[pieceInfo.type](
                { x: actualCol, y: actualRow },
                pieceBoard,
                pieceInfo.color,
                gameState
            );
            setValidMoves(moves);
            return;
        }

        // If a piece is already selected, only allow moving if it's your piece
        const { row: selectedRow, col: selectedCol } = selectedCell;
        const selectedPieceChar = board[selectedRow][selectedCol];
        if (!selectedPieceChar) {
            setSelectedCell(null);
            setValidMoves([]);
            return;
        }
        const selectedPieceInfo = unicodeToPiece[selectedPieceChar];
        if (selectedPieceInfo.color !== currentTurn) {
            setSelectedCell(null);
            setValidMoves([]);
            return;
        }

        if (isValidMove(actualRow, actualCol)) {
            // --- Check if move would leave king in check (illegal move) ---
            if (wouldLeaveKingInCheck(
                { row: selectedRow, col: selectedCol },
                { row: actualRow, col: actualCol },
                selectedPieceInfo
            )) {
                // Trigger red blink on the selected cell
                setRedBlinkCell({ row: selectedRow, col: selectedCol });
                if (redBlinkTimeoutRef.current) clearTimeout(redBlinkTimeoutRef.current);
                redBlinkTimeoutRef.current = setTimeout(() => {
                    setRedBlinkCell(null);
                }, 1200); // 0.6s * 2 blinks
                // Do not change turn or move piece
                return;
            }

            // Move logic
            const pieceChar = board[selectedRow][selectedCol];
            const pieceInfo = pieceChar ? unicodeToPiece[pieceChar] : null;
            const pieceBoard = convertToPieceBoard(board);

            // Prepare GameState for rules
            const gameState = getGameState(pieceBoard);

            // Detect castling
            let isCastling = false;
            let rookFrom: Position | null = null;
            let rookTo: Position | null = null;

            if (
                pieceInfo &&
                pieceInfo.type === 'king' &&
                Math.abs(actualCol - selectedCol) === 2
            ) {
                isCastling = true;
                const y = selectedRow;
                if (actualCol === 6) {
                    // Kingside
                    rookFrom = { x: 7, y };
                    rookTo = { x: 5, y };
                } else if (actualCol === 2) {
                    // Queenside
                    rookFrom = { x: 0, y };
                    rookTo = { x: 3, y };
                }
            }

            // Detect en passant
            let isEnPassant = false;
            let capturedPawn: { row: number; col: number } | null = null;
            if (
                pieceInfo &&
                pieceInfo.type === 'pawn' &&
                enPassantTarget &&
                actualCol === enPassantTarget.x &&
                actualRow === enPassantTarget.y
            ) {
                isEnPassant = true;
                capturedPawn = {
                    row: selectedRow,
                    col: actualCol,
                };
            }

            // Build new board after move
            let newBoard = board.map(row => [...row]);
            if (isCastling && rookFrom && rookTo) {
                // Move king
                newBoard[actualRow][actualCol] = board[selectedRow][selectedCol];
                newBoard[selectedRow][selectedCol] = null;
                // Move rook
                newBoard[rookTo.y][rookTo.x] = board[rookFrom.y][rookFrom.x];
                newBoard[rookFrom.y][rookFrom.x] = null;
            } else if (isEnPassant && capturedPawn) {
                // Move pawn
                newBoard[actualRow][actualCol] = board[selectedRow][selectedCol];
                newBoard[selectedRow][selectedCol] = null;
                // Remove captured pawn
                newBoard[capturedPawn.row][capturedPawn.col] = null;
            } else {
                // Normal move
                newBoard[actualRow][actualCol] = board[selectedRow][selectedCol];
                newBoard[selectedRow][selectedCol] = null;
            }

            // Update hasMoved for king/rook/pawn
            let newHasMoved = { ...hasMoved };
            if (pieceInfo) {
                const fromKey = `${selectedCol},${selectedRow}`;
                newHasMoved[fromKey] = true;
                // If castling, also mark rook as moved
                if (isCastling && rookFrom) {
                    const rookKey = `${rookFrom.x},${rookFrom.y}`;
                    newHasMoved[rookKey] = true;
                }
            }

            // Update en passant target
            let newEnPassantTarget: Position | null = null;
            if (
                pieceInfo &&
                pieceInfo.type === 'pawn' &&
                Math.abs(actualRow - selectedRow) === 2
            ) {
                // Set en passant target square
                newEnPassantTarget = {
                    x: selectedCol,
                    y: (selectedRow + actualRow) / 2,
                };
            }

            // Build move object for history
            const move: Move = {
                from: { x: selectedCol, y: selectedRow },
                to: { x: actualCol, y: actualRow },
                piece: pieceInfo!,
                isCastling,
                isEnPassant,
                captured: isEnPassant && capturedPawn
                    ? (board[capturedPawn.row][capturedPawn.col]
                        ? unicodeToPiece[board[capturedPawn.row][capturedPawn.col]!]
                        : null)
                    : (board[actualRow][actualCol]
                        ? unicodeToPiece[board[actualRow][actualCol]!]
                        : null),
            };

            setBoard(newBoard);
            setHasMoved(newHasMoved);
            setEnPassantTarget(newEnPassantTarget);
            setMoveHistory([...moveHistory, move]);
            setGreenHighlights({ from: { row: selectedRow, col: selectedCol }, to: { row: actualRow, col: actualCol } });
            setSelectedCell(null);
            setYellowHighlight(null);
            setValidMoves([]);
            // Switch turn after a valid move
            setCurrentTurn(currentTurn === 'white' ? 'black' : 'white');
        } else if (board[actualRow]?.[actualCol]) {
            // Only allow selecting your own piece
            const pieceChar = board[actualRow][actualCol];
            if (!pieceChar) return;
            const pieceInfo = unicodeToPiece[pieceChar];
            if (pieceInfo.color !== currentTurn) return;
            setSelectedCell({ row: actualRow, col: actualCol });
            setGreenHighlights({ from: { row: actualRow, col: actualCol }, to: { row: actualRow, col: actualCol } });
            setYellowHighlight(null);
            const pieceBoard = convertToPieceBoard(board);
            const gameState = getGameState(pieceBoard);
            const moves = pieceMoveFunctions[pieceInfo.type](
                { x: actualCol, y: actualRow },
                pieceBoard,
                pieceInfo.color,
                gameState
            );
            setValidMoves(moves);
        } else {
            // Attempted to move to an invalid square (illegal move)
            if (selectedCell) {
                setRedBlinkCell({ row: selectedCell.row, col: selectedCell.col });
                if (redBlinkTimeoutRef.current) clearTimeout(redBlinkTimeoutRef.current);
                redBlinkTimeoutRef.current = setTimeout(() => {
                    setRedBlinkCell(null);
                }, 1200);
            }
            setSelectedCell(null);
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

    // Placeholder data for clocks and captured pieces
    const opponentClock = "09:45";
    const playerClock = "10:00";
    const capturedByOpponent: string[] = []; // Unicode chars of pieces
    const capturedByPlayer: string[] = [];

    // Example: Generate move list in FIDE notation (placeholder)
    const moveList: string[] = [
        "1. e4 e5",
        "2. Nf3 Nc6",
        "3. Bb5 a6",
        // ...populate from your moveHistory if desired...
    ];

    return (
        <div className="chess-layout">
            {/* Left: Chessboard */}
            <div className="chessboard-panel">
                {/* Existing chessboard rendering */}
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
                                const isRedBlink =
                                    redBlinkCell &&
                                    redBlinkCell.row === actualRow &&
                                    redBlinkCell.col === actualCol;

                                return (
                                    <div
                                        key={`${rowIndex}-${colIndex}`}
                                        className={`chess-square ${((rowIndex + colIndex) % 2 === 0) ? 'light' : 'dark'} ${
                                            isGreenFrom || isGreenTo ? 'green-highlight' : ''
                                        } ${isYellow ? 'yellow-highlight' : ''} ${isValid ? 'highlight' : ''} ${isRedBlink ? 'red-blink' : ''}`}
                                        onClick={() => handleSquareClick(rowIndex, colIndex)}
                                    >
                                        {square && <span className="chess-piece">{square}</span>}
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
                    <button className="flip-button" onClick={flipBoard}>
                        Flip Board
                    </button>
                </div>
            </div>

            {/* Right: Info Panel */}
            <div className="info-panel">
                {/* Left partition (2/3) */}
                <div className="info-left">
                    <div className="clock opponent-clock">Opponent: {opponentClock}</div>
                    <div className="captured-pieces captured-by-opponent">
                        {capturedByOpponent.length === 0 ? (
                            <span className="captured-placeholder">No captures</span>
                        ) : (
                            capturedByOpponent.map((piece, idx) => (
                                <span className="captured-piece" key={idx}>{piece}</span>
                            ))
                        )}
                    </div>
                    <div className="info-separator" />
                    <div className="captured-pieces captured-by-player">
                        {capturedByPlayer.length === 0 ? (
                            <span className="captured-placeholder">No captures</span>
                        ) : (
                            capturedByPlayer.map((piece, idx) => (
                                <span className="captured-piece" key={idx}>{piece}</span>
                            ))
                        )}
                    </div>
                    <div className="clock player-clock">You: {playerClock}</div>
                </div>
                {/* Right partition (1/3) */}
                <div className="info-right">
                    <div className="move-list-title">Move List</div>
                    <div className="move-list">
                        {moveList.map((move, idx) => (
                            <div className="move-list-row" key={idx}>{move}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChessBoard;