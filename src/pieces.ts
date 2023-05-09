import { Square, PieceSymbol, Color } from "chess.js";

type Cell = {
  // occupied?: { piece: Piece; player: Color };
  vision: number;
};
type ChessCell = {
  square: Square;
  type: PieceSymbol;
  color: Color;
} | null;

type Board = Cell[][];
type RawBoard = ChessCell[][];

const skipPawns = false;
const skipRooks = false;
const skipBishops = false;
const skipKnights = false;
const skipQueens = false;

function pieceVision(
  piece: PieceSymbol,
  player: Color,
  [x, y]: [number, number],
  rawBoard: RawBoard
): [number, number][] {
  let v: [number, number][];
  switch (piece) {
    case "p":
      if (skipPawns) return [];
      const visionY = player === "w" ? y + 1 : y - 1;
      v = [ifValidCell(x - 1, visionY), ifValidCell(x + 1, visionY)].filter(
        (x): x is [number, number] => x !== null
      );
      // console.log(
      //   `${player} pawn at ${x},${y} has vision ${v.map(
      //     ([x, y]) => `${x},${y}; `
      //   )}`
      // );
      return v;

    case "r":
      if (skipRooks) return [];
      v = rookVision(x, y, rawBoard);
      // console.log(
      //   `${player} rook at ${x},${y} has vision ${v.map(
      //     ([x, y]) => `${x},${y}; `
      //   )}`
      // );
      return v;

    case "b":
      if (skipBishops) return [];
      v = bishopVision(x, y, rawBoard);
      // console.log(
      //   `${player} bishop at ${x},${y} has vision ${v.map(
      //     ([x, y]) => `${x},${y}; `
      //   )}`
      // );
      return v;

    case "n":
      if (skipKnights) return [];
      v = [
        ifValidCell(x + 2, y + 1),
        ifValidCell(x + 2, y - 1),
        ifValidCell(x - 2, y + 1),
        ifValidCell(x - 2, y - 1),
        ifValidCell(x + 1, y + 2),
        ifValidCell(x + 1, y - 2),
        ifValidCell(x - 1, y + 2),
        ifValidCell(x - 1, y - 2),
      ].filter((x): x is [number, number] => x !== null);
      // console.log(
      //   `${player} knight at ${x},${y} has vision ${v.map(
      //     ([x, y]) => `${x},${y}; `
      //   )}`
      // );
      return v;

    case "q":
      if (skipQueens) return [];
      v = [...bishopVision(x, y, rawBoard), ...rookVision(x, y, rawBoard)];
      // console.log(
      //   `${player} queen at ${x},${y} has vision ${v.map(
      //     ([x, y]) => `${x},${y}; `
      //   )}`
      // );
      return v;

    case "k":
      v = [
        ifValidCell(x + 1, y),
        ifValidCell(x + 1, y + 1),
        ifValidCell(x, y + 1),
        ifValidCell(x - 1, y + 1),
        ifValidCell(x - 1, y),
        ifValidCell(x - 1, y - 1),
        ifValidCell(x, y - 1),
        ifValidCell(x + 1, y - 1),
      ].filter((x): x is [number, number] => x !== null);
      // console.log(
      //   `${player} king at ${x},${y} has vision ${v.map(
      //     ([x, y]) => `${x},${y}; `
      //   )}`
      // );
      return v;

    default:
      throw new Error(`What tf is this piece`);
  }
}

function bishopVision(x: number, y: number, rawBoard: RawBoard) {
  const vision: [number, number][] = [];

  // ne
  let [nex, ney] = [x + 1, y + 1];
  while (nex < 8 && ney < 8) {
    vision.push([nex, ney]);

    const cell = rawBoard[nex][ney];
    if (cell) break;
    nex++, ney++;
  }

  // nw
  let [nwx, nwy] = [x - 1, y + 1];
  while (nwx >= 0 && nwy < 8) {
    vision.push([nwx, nwy]);

    const cell = rawBoard[nwx][nwy];
    if (cell) break;
    nwx--, nwy++;
  }

  // se
  let [sex, sey] = [x + 1, y - 1];
  while (sex < 8 && sey >= 0) {
    vision.push([sex, sey]);

    const cell = rawBoard[sex][sey];
    if (cell) break;
    sex++, sey--;
  }

  // sw
  let [swx, swy] = [x - 1, y - 1];
  while (swx >= 0 && swy >= 0) {
    vision.push([swx, swy]);

    const cell = rawBoard[swx][swy];
    if (cell) break;
    swx--, swy--;
  }

  return vision;
}

function rookVision(x: number, y: number, rawBoard: RawBoard) {
  const vision: [number, number][] = [];

  //up
  let upY = y + 1;
  while (upY < 8) {
    vision.push([x, upY]);

    const cell = rawBoard[x][upY];
    if (cell) break;
    upY++;
  }

  //left
  let leftX = x - 1;
  while (leftX >= 0) {
    vision.push([leftX, y]);

    const cell = rawBoard[leftX][y];
    if (cell) break;
    leftX--;
  }

  //down
  let downY = y - 1;
  while (downY >= 0) {
    vision.push([x, downY]);

    const cell = rawBoard[x][downY];
    if (cell) break;
    downY--;
  }

  //right
  let rightX = x + 1;
  while (rightX < 8) {
    vision.push([rightX, y]);

    const cell = rawBoard[rightX][y];
    if (cell) break;
    rightX++;
  }

  return vision;
}

export function hydrateBoard(rawBoard: RawBoard): Board {
  const board: Board = [];
  for (let i = 0; i < 8; i++) {
    board[i] = [];
    for (let j = 0; j < 8; j++) {
      board[i][j] = { vision: 0 };
    }
  }

  rawBoard.forEach((row, x) =>
    row.forEach((cell, y) => {
      if (cell) {
        const { type, color } = cell;

        const vision = pieceVision(type, color, [x, y], rawBoard);

        vision.forEach(([vx, vy]) => {
          if (color === "w") board[vx][vy].vision++;
          else board[vx][vy].vision--;
        });
      }
    })
  );

  return board;
}

function ifValidCell(x: number, y: number) {
  if (x >= 0 && x < 8 && y >= 0 && y < 8) return [x, y];
  return null;
}
