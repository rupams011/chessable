"use client";

import React, { useState, useRef, useEffect } from 'react';
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
    isSquareUnderAttack,
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

// Helper: Convert board of Piece | null to board of strings (used for FEN, debugging, or export)
// function convertToStringBoard(board: Board): (string | null)[][] {
//     const pieceToUnicode: Record<Color, Record<PieceType, string>> = {
//         white: {
//             pawn: '♙',
//             rook: '♖',
//             knight: '♘',
//             bishop: '♗',
//             queen: '♕',
//             king: '♔',
//         },
//         black: {
//             pawn: '♟',
//             rook: '♜',
//             knight: '♞',
//             bishop: '♝',
//             queen: '♛',
//             king: '♚',
//         },
//     };
//     return board.map(row =>
//         row.map(cell =>
//             cell ? pieceToUnicode[cell.color][cell.type] : null
//         )
//     );
// }

interface ChessBoardProps {
  isFlipped: boolean;
  boardEnabled: boolean;
  gameStarted: boolean;
  onMove: () => void;
  gameMode: 'friend' | 'pass';
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  isFlipped,
  boardEnabled,
  gameStarted,
  onMove,
//   gameMode,
}) => {
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
    // const [isFlipped, setIsFlipped] = useState(false);
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

    // Add timer and move list state
    const INITIAL_TIME = 10 * 60; // 10 minutes in seconds

    const [playerTime, setPlayerTime] = useState(INITIAL_TIME); // White
    const [opponentTime, setOpponentTime] = useState(INITIAL_TIME); // Black
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Move list as array of {white: string, black: string}
    const [moveList, setMoveList] = useState<{ white?: string; black?: string }[]>([]);

    // Captured pieces state (unicode chars)
    const [capturedByOpponent, setCapturedByOpponent] = useState<string[]>([]);
    const [capturedByPlayer, setCapturedByPlayer] = useState<string[]>([]);

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

    // Helper: Simulate a move and check if king is in check after the move
    function wouldLeaveKingInCheck(
        from: { row: number; col: number },
        to: { row: number; col: number },
        pieceInfo: { type: PieceType; color: Color },
        board: (string | null)[][],
        enPassantTarget: Position | null
    ): boolean {
        // Simulate the move on a copy of the board
        const simulatedBoard = board.map(row => [...row]);
        const movingPiece = simulatedBoard[from.row][from.col];

        // Handle castling simulation
        if (pieceInfo.type === 'king' && Math.abs(to.col - from.col) === 2) {
            // Kingside
            if (to.col === 6) {
                simulatedBoard[from.row][4] = null;
                simulatedBoard[from.row][6] = movingPiece;
                simulatedBoard[from.row][7] = null;
                simulatedBoard[from.row][5] = pieceInfo.color === 'white' ? '♖' : '♜';
            }
            // Queenside
            else if (to.col === 2) {
                simulatedBoard[from.row][4] = null;
                simulatedBoard[from.row][2] = movingPiece;
                simulatedBoard[from.row][0] = null;
                simulatedBoard[from.row][3] = pieceInfo.color === 'white' ? '♖' : '♜';
            }
        } else if (
            pieceInfo.type === 'pawn' &&
            enPassantTarget &&
            to.col === enPassantTarget.x &&
            to.row === enPassantTarget.y
        ) {
            // En passant simulation
            simulatedBoard[to.row][to.col] = movingPiece;
            simulatedBoard[from.row][from.col] = null;
            simulatedBoard[from.row][to.col] = null; // Remove captured pawn
        } else {
            // Normal move
            simulatedBoard[to.row][to.col] = movingPiece;
            simulatedBoard[from.row][from.col] = null;
        }

        // Find king's position after move
        const kingChar = pieceInfo.color === 'white' ? '♔' : '♚'; // Use const instead of let
        let kingPos: { x: number; y: number } | null = null;
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                if (simulatedBoard[y][x] === kingChar) {
                    kingPos = { x, y };
                }
            }
        }
        // If king was moved, update kingPos
        if (pieceInfo.type === 'king') {
            kingPos = { x: to.col, y: to.row };
        }
        if (!kingPos) return true;

        const pieceBoard = convertToPieceBoard(simulatedBoard);

        return isSquareUnderAttack(kingPos, pieceBoard, pieceInfo.color === 'white' ? 'black' : 'white');
    }

    // Helper: Format seconds as mm:ss
    function formatClock(seconds: number) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    }

    // Helper: Convert move to FIDE notation (very basic, can be improved)
    function getMoveNotation(move: Move, moveNumber: number, isWhite: boolean) {
        // Basic: piece letter (except pawn), destination square, 'x' for capture, 'O-O'/'O-O-O' for castling
        if (move.isCastling) {
            if (move.to.x === 6) return isWhite ? "O-O" : "O-O";
            if (move.to.x === 2) return isWhite ? "O-O-O" : "O-O-O";
        }
        const files = "abcdefgh";
        const pieceLetter = move.piece.type === "pawn" ? "" : move.piece.type[0].toUpperCase();
        const capture = move.captured ? "x" : "";
        const toSquare = files[move.to.x] + (8 - move.to.y);
        if (move.piece.type === "pawn" && move.captured) {
            // Pawn capture: exd5
            return files[move.from.x] + "x" + toSquare;
        }
        return pieceLetter + capture + toSquare;
    }

    // --- Timer logic ---
    useEffect(() => {
        // Clear any previous timer
        if (timerRef.current) clearInterval(timerRef.current);

        // Only run timer if gameStarted is true
        if (!gameStarted) return;

        // Only run timer for the current turn
        timerRef.current = setInterval(() => {
            if (currentTurn === "white") {
                setPlayerTime((t) => (t > 0 ? t - 1 : 0));
            } else {
                setOpponentTime((t) => (t > 0 ? t - 1 : 0));
            }
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [currentTurn, gameStarted]);

    // --- Move list update logic ---
    // Call this after every valid move
    function updateMoveList(move: Move) {
        const isWhiteMove = move.piece.color === "white";
        setMoveList((prev) => {
            const moveNotation = getMoveNotation(
                move,
                Math.floor(prev.length / 2) + 1,
                isWhiteMove
            );
            if (isWhiteMove) {
                // Start new row
                return [...prev, { white: moveNotation }];
            } else {
                // Add to last row
                if (prev.length === 0) return [{ black: moveNotation }];
                const last = prev[prev.length - 1];
                return [...prev.slice(0, -1), { ...last, black: moveNotation }];
            }
        });
    }

    // --- Captured pieces update logic ---
    // Call this after every valid move
    function updateCapturedPieces(move: Move) {
        if (move.captured && move.captured.type) {
            // Unicode for captured piece
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
            const capturedChar = pieceToUnicode[move.captured.color][move.captured.type];
            if (move.piece.color === "white") {
                setCapturedByPlayer((prev) => [...prev, capturedChar]);
            } else {
                setCapturedByOpponent((prev) => [...prev, capturedChar]);
            }
        }
    }

    // --- Enhanced move logic for castling and en passant ---
    const handleSquareClick = boardEnabled
      ? (row: number, col: number) => {
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
                  selectedPieceInfo,
                  board,
                  enPassantTarget
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
              // const pieceBoard = convertToPieceBoard(board);

              // Remove unused assignment: gameState
              // If you want to use gameState, use it for move validation or pass to move functions.
              // Otherwise, just remove this line:
              // const gameState = getGameState(pieceBoard);

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
              const newBoard = board.map(row => [...row]);
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
              const newHasMoved = { ...hasMoved };
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

              // --- Timer and move list/capture updates ---
              updateMoveList(move);
              updateCapturedPieces(move);

              // Switch turn after a valid move (timer handled by useEffect)
              setCurrentTurn(currentTurn === 'white' ? 'black' : 'white');
              // After a valid move:
              if (onMove) onMove();
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
      }
      : () => {};

    const flipBoard = () => {
        // setIsFlipped(!isFlipped); // Remove this, as isFlipped is a prop
        setYellowHighlight(null);
        if (selectedCell) {
            setSelectedCell({
                row: 7 - selectedCell.row,
                col: 7 - selectedCell.col,
            });
        }
    };

    // Helper to flip captured pieces and clocks order
    function renderInfoLeft() {
        // If not flipped: opponent clock, opponent captures, separator, player captures, player clock
        // If flipped: player clock, player captures, separator, opponent captures, opponent clock
        if (!isFlipped) {
            return (
                <>
                    <div className="clock opponent-clock">Opponent: {formatClock(opponentTime)}</div>
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
                    <div className="clock player-clock">You: {formatClock(playerTime)}</div>
                </>
            );
        } else {
            // Flipped order
            return (
                <>
                    <div className="clock player-clock">You: {formatClock(playerTime)}</div>
                    <div className="captured-pieces captured-by-player">
                        {capturedByPlayer.length === 0 ? (
                            <span className="captured-placeholder">No captures</span>
                        ) : (
                            capturedByPlayer.map((piece, idx) => (
                                <span className="captured-piece" key={idx}>{piece}</span>
                            ))
                        )}
                    </div>
                    <div className="info-separator" />
                    <div className="captured-pieces captured-by-opponent">
                        {capturedByOpponent.length === 0 ? (
                            <span className="captured-placeholder">No captures</span>
                        ) : (
                            capturedByOpponent.map((piece, idx) => (
                                <span className="captured-piece" key={idx}>{piece}</span>
                            ))
                        )}
                    </div>
                    <div className="clock opponent-clock">Opponent: {formatClock(opponentTime)}</div>
                </>
            );
        }
    }

    return (
        <div className="chess-layout">
            {/* Left: Chessboard */}
            <div className="chessboard-panel">
                <div className="chess-container">
                    <div className={`chess-board${!boardEnabled ? ' disabled' : ''}`}>
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
                    {renderInfoLeft()}
                </div>
                {/* Right partition (1/3) */}
                <div className="info-right">
                    <div className="move-list-title">Move List</div>
                    <div className="move-list">
                        {moveList.map((move, idx) => (
                            <div className="move-list-row" key={idx}>
                                {`${idx + 1}. ${move.white || ""}${move.black ? " " + move.black : ""}`}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChessBoard;