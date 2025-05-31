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

// Example: Map piece type to move function
export const pieceMoveFunctions: Record<
  PieceType,
  (pos: Position, board: Board, color: Color) => Position[]
> = {
  pawn: getPawnMoves,
  rook: getRookMoves,
  knight: getKnightMoves,
  bishop: getBishopMoves,
  queen: getQueenMoves,
  king: getKingMoves,
};