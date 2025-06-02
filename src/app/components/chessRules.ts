// Types
export type Position = { x: number; y: number };
export type Color = 'white' | 'black';
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';

export interface Piece {
  type: PieceType;
  color: Color;
  // You can extend this for future features (e.g., hasMoved for castling)
}

export type Board = (Piece | null)[][];

// Utility: Check if position is on board
function isOnBoard(pos: Position): boolean {
  return pos.x >= 0 && pos.x < 8 && pos.y >= 0 && pos.y < 8;
}

// Utility: Check if a square is empty or has an opponent's piece
function canMoveTo(board: Board, pos: Position, color: Color): boolean {
  if (!isOnBoard(pos)) return false;
  const target = board[pos.y][pos.x];
  return !target || target.color !== color;
}

// Pawn moves
export function getPawnMoves(
  pos: Position,
  board: Board,
  color: Color
): Position[] {
  const moves: Position[] = [];
  const dir = color === 'white' ? -1 : 1;
  const startRow = color === 'white' ? 6 : 1;

  // Forward 1
  const oneForward = { x: pos.x, y: pos.y + dir };
  if (isOnBoard(oneForward) && !board[oneForward.y][oneForward.x]) {
    moves.push(oneForward);

    // Forward 2 from starting position
    const twoForward = { x: pos.x, y: pos.y + 2 * dir };
    if (
      pos.y === startRow &&
      !board[twoForward.y][twoForward.x]
    ) {
      moves.push(twoForward);
    }
  }

  // Captures
  for (const dx of [-1, 1]) {
    const diag = { x: pos.x + dx, y: pos.y + dir };
    if (
      isOnBoard(diag) &&
      board[diag.y][diag.x] &&
      board[diag.y][diag.x]?.color !== color
    ) {
      moves.push(diag);
    }
  }

  // Placeholder: En passant logic can be added here

  return moves;
}

// Rook moves
export function getRookMoves(
  pos: Position,
  board: Board,
  color: Color
): Position[] {
  const moves: Position[] = [];
  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  for (const { dx, dy } of directions) {
    let x = pos.x + dx;
    let y = pos.y + dy;
    while (isOnBoard({ x, y })) {
      const target = board[y][x];
      if (!target) {
        moves.push({ x, y });
      } else {
        if (target.color !== color) moves.push({ x, y });
        break;
      }
      x += dx;
      y += dy;
    }
  }
  return moves;
}

// Knight moves
export function getKnightMoves(
  pos: Position,
  board: Board,
  color: Color
): Position[] {
  const moves: Position[] = [];
  const deltas = [
    { dx: 1, dy: 2 },
    { dx: 2, dy: 1 },
    { dx: -1, dy: 2 },
    { dx: -2, dy: 1 },
    { dx: 1, dy: -2 },
    { dx: 2, dy: -1 },
    { dx: -1, dy: -2 },
    { dx: -2, dy: -1 },
  ];

  for (const { dx, dy } of deltas) {
    const target = { x: pos.x + dx, y: pos.y + dy };
    if (canMoveTo(board, target, color)) {
      moves.push(target);
    }
  }
  return moves;
}

// Bishop moves
export function getBishopMoves(
  pos: Position,
  board: Board,
  color: Color
): Position[] {
  const moves: Position[] = [];
  const directions = [
    { dx: 1, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 1 },
    { dx: -1, dy: -1 },
  ];

  for (const { dx, dy } of directions) {
    let x = pos.x + dx;
    let y = pos.y + dy;
    while (isOnBoard({ x, y })) {
      const target = board[y][x];
      if (!target) {
        moves.push({ x, y });
      } else {
        if (target.color !== color) moves.push({ x, y });
        break;
      }
      x += dx;
      y += dy;
    }
  }
  return moves;
}

// Queen moves (rook + bishop)
export function getQueenMoves(
  pos: Position,
  board: Board,
  color: Color
): Position[] {
  return [
    ...getRookMoves(pos, board, color),
    ...getBishopMoves(pos, board, color),
  ];
}

// King moves
export function getKingMoves(
  pos: Position,
  board: Board,
  color: Color
): Position[] {
  const moves: Position[] = [];
  const deltas = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 1 },
    { dx: -1, dy: -1 },
  ];

  for (const { dx, dy } of deltas) {
    const target = { x: pos.x + dx, y: pos.y + dy };
    if (canMoveTo(board, target, color)) {
      moves.push(target);
    }
  }

  // Placeholder: Castling logic can be added here

  return moves;
}

// --- Additions for special moves ---

// Move and GameState types for special move tracking
export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece | null;
  isEnPassant?: boolean;
  isCastling?: boolean;
}
export interface GameState {
  board: Board;
  moveHistory: Move[];
  hasMoved: { [key: string]: boolean }; // e.g. "4,7" for white king, "0,7" for white queenside rook, etc.
  enPassantTarget?: Position | null; // Square where en passant is possible
}

// Placeholder: Check if a square is under attack
export function isSquareUnderAttack(
  pos: Position,
  board: Board,
  attackerColor: Color
): boolean {
  // Check if any piece of attackerColor can attack pos
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const piece = board[y][x];
      if (piece && piece.color === attackerColor) {
        let moves: Position[] = [];
        switch (piece.type) {
          case 'pawn':
            // Pawns attack diagonally
            const dir = attackerColor === 'white' ? -1 : 1;
            for (const dx of [-1, 1]) {
              if (x + dx === pos.x && y + dir === pos.y) {
                return true;
              }
            }
            break;
          case 'rook':
            moves = getRookMoves({ x, y }, board, attackerColor);
            break;
          case 'knight':
            moves = getKnightMoves({ x, y }, board, attackerColor);
            break;
          case 'bishop':
            moves = getBishopMoves({ x, y }, board, attackerColor);
            break;
          case 'queen':
            moves = getQueenMoves({ x, y }, board, attackerColor);
            break;
          case 'king':
            moves = getKingMoves({ x, y }, board, attackerColor);
            break;
        }
        if (moves.some(m => m.x === pos.x && m.y === pos.y)) return true;
      }
    }
  }
  return false;
}

// --- Castling utility functions ---
function canCastleKingside(
  color: Color,
  gameState: GameState
): boolean {
  const y = color === 'white' ? 7 : 0;
  const kingFrom = { x: 4, y };
  const rookFrom = { x: 7, y };
  const kingKey = `${kingFrom.x},${kingFrom.y}`;
  const rookKey = `${rookFrom.x},${rookFrom.y}`;

  // King and rook must not have moved
  if (gameState.hasMoved[kingKey] || gameState.hasMoved[rookKey]) return false;

  // Squares between king and rook must be empty
  for (let x = 5; x < 7; x++) {
    if (gameState.board[y][x]) return false;
  }

  // King may not be in check, pass through, or land on attacked squares
  for (let x = 4; x <= 6; x++) {
    if (isSquareUnderAttack({ x, y }, gameState.board, color === 'white' ? 'black' : 'white')) return false;
  }

  return true;
}

function canCastleQueenside(
  color: Color,
  gameState: GameState
): boolean {
  const y = color === 'white' ? 7 : 0;
  const kingFrom = { x: 4, y };
  const rookFrom = { x: 0, y };
  const kingKey = `${kingFrom.x},${kingFrom.y}`;
  const rookKey = `${rookFrom.x},${rookFrom.y}`;

  if (gameState.hasMoved[kingKey] || gameState.hasMoved[rookKey]) return false;

  // Squares between king and rook must be empty
  for (let x = 1; x < 4; x++) {
    if (gameState.board[y][x]) return false;
  }

  // King may not be in check, pass through, or land on attacked squares
  for (let x = 2; x <= 4; x++) {
    if (isSquareUnderAttack({ x, y }, gameState.board, color === 'white' ? 'black' : 'white')) return false;
  }

  return true;
}

// --- En Passant utility function ---
function canEnPassant(
  pawnPos: Position,
  target: Position,
  gameState: GameState,
  color: Color
): boolean {
  if (!gameState.enPassantTarget) return false;
  if (gameState.enPassantTarget.x !== target.x || gameState.enPassantTarget.y !== target.y) return false;

  // The pawn must be on the correct rank and adjacent to the en passant target
  const dir = color === 'white' ? -1 : 1;
  if (pawnPos.y !== (color === 'white' ? 3 : 4)) return false;
  if (Math.abs(pawnPos.x - target.x) !== 1) return false;
  if (target.y !== pawnPos.y + dir) return false;

  // The last move must have been a two-square pawn advance to the en passant target's file
  const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
  if (!lastMove) return false;
  if (
    lastMove.piece.type !== 'pawn' ||
    Math.abs(lastMove.from.y - lastMove.to.y) !== 2 ||
    lastMove.to.x !== target.x ||
    lastMove.to.y !== pawnPos.y
  ) {
    return false;
  }

  return true;
}

// --- Updated Pawn Moves with En Passant ---
export function getValidMovesForPawn(
  pos: Position,
  board: Board,
  color: Color,
  gameState: GameState
): Position[] {
  const moves: Position[] = [];
  const dir = color === 'white' ? -1 : 1;
  const startRow = color === 'white' ? 6 : 1;

  // Forward 1
  const oneForward = { x: pos.x, y: pos.y + dir };
  if (isOnBoard(oneForward) && !board[oneForward.y][oneForward.x]) {
    moves.push(oneForward);

    // Forward 2 from starting position
    const twoForward = { x: pos.x, y: pos.y + 2 * dir };
    if (
      pos.y === startRow &&
      !board[twoForward.y][twoForward.x] &&
      !board[oneForward.y][oneForward.x]
    ) {
      moves.push(twoForward);
    }
  }

  // Captures
  for (const dx of [-1, 1]) {
    const diag = { x: pos.x + dx, y: pos.y + dir };
    if (
      isOnBoard(diag) &&
      board[diag.y][diag.x] &&
      board[diag.y][diag.x]?.color !== color
    ) {
      moves.push(diag);
    }
    // En Passant
    if (canEnPassant(pos, diag, gameState, color)) {
      moves.push(diag);
    }
  }

  return moves;
}

// --- Updated King Moves with Castling ---
export function getValidMovesForKing(
  pos: Position,
  board: Board,
  color: Color,
  gameState: GameState
): Position[] {
  const moves: Position[] = [];
  const deltas = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 1 },
    { dx: -1, dy: -1 },
  ];

  for (const { dx, dy } of deltas) {
    const target = { x: pos.x + dx, y: pos.y + dy };
    if (canMoveTo(board, target, color)) {
      moves.push(target);
    }
  }

  // Castling
  if (
    (color === 'white' && pos.x === 4 && pos.y === 7) ||
    (color === 'black' && pos.x === 4 && pos.y === 0)
  ) {
    if (canCastleKingside(color, gameState)) {
      moves.push({ x: 6, y: pos.y }); // Kingside castling
    }
    if (canCastleQueenside(color, gameState)) {
      moves.push({ x: 2, y: pos.y }); // Queenside castling
    }
  }

  return moves;
}

// --- Export updated move functions for integration ---
export const pieceMoveFunctions: Record<
  PieceType,
  (
    pos: Position,
    board: Board,
    color: Color,
    gameState?: GameState
  ) => Position[]
> = {
  pawn: (pos, board, color, gameState) =>
    gameState
      ? getValidMovesForPawn(pos, board, color, gameState)
      : getPawnMoves(pos, board, color),
  rook: getRookMoves,
  knight: getKnightMoves,
  bishop: getBishopMoves,
  queen: getQueenMoves,
  king: (pos, board, color, gameState) =>
    gameState
      ? getValidMovesForKing(pos, board, color, gameState)
      : getKingMoves(pos, board, color),
};

// --- Notes ---
// - When making a move, update GameState.hasMoved for the king/rook involved in castling.
// - When a pawn moves two squares, set GameState.enPassantTarget to the square behind the pawn.
// - When en passant is performed, remove the captured pawn from the board.
// - Use isSquareUnderAttack to prevent illegal castling through/into check.
// - This structure is modular for future check/checkmate logic.