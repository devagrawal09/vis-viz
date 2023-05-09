import { CSSProperties, Component } from "react";
import PropTypes from "prop-types";
import { Chess, Move, Square } from "chess.js"; // import Chess from  "chess.js"(default) if recieving an error about new Chess() not being a constructor

import Chessboard from "./chessboardjsx/Chessboard";
import { hydrateBoard } from "./pieces";

const initial = {
  fen: "start",
  // square styles for active drop square
  dropSquareStyle: {},
  // custom square styles
  squareStyles: {} as SqSt,
  // square with the currently clicked piece
  pieceSquare: "" as Square | "",
  // currently clicked square
  square: "" as Square,
  // array of past game moves
  history: [] as Move[],

  highlights: [] as { square: Square; vision: number }[][],
};

type State = typeof initial;

type SqSt = { [square in Square]?: CSSProperties };

class HumanVsHuman extends Component<any, State> {
  static propTypes = { children: PropTypes.func };

  state = {
    fen: "start",
    // square styles for active drop square
    dropSquareStyle: {},
    // custom square styles
    squareStyles: {},
    // square with the currently clicked piece
    pieceSquare: "",
    // currently clicked square
    square: "",
    // array of past game moves
    history: [],

    highlights: [],
  } as any;

  game!: Chess;

  componentDidMount() {
    this.game = new Chess();

    const highlights = this.getVisionHighlights();

    this.setState({ highlights });
  }

  // setState:

  // keep clicked square style and remove hint squares
  removeHighlightSquare = () => {
    this.setState(({ pieceSquare, history, highlights }) => ({
      squareStyles: squareStyling({ pieceSquare, history, highlights }),
    }));
  };

  // show possible moves
  highlightSquare = (sourceSquare: Square, squaresToHighlight: Square[]) => {
    const highlightStyles = [sourceSquare, ...squaresToHighlight].reduce(
      (a, c) => {
        return {
          ...a,
          ...{
            [c]: {
              background:
                "radial-gradient(circle, #fffc00 36%, transparent 40%)",
              borderRadius: "50%",
            },
          },
          ...squareStyling({
            history: this.state.history,
            pieceSquare: this.state.pieceSquare,
            highlights: this.state.highlights,
          }),
        };
      },
      {}
    );

    this.setState(({ squareStyles }) => ({
      squareStyles: { ...squareStyles, ...highlightStyles },
    }));
  };

  onDrop = ({ sourceSquare, targetSquare }: any) => {
    // see if the move is legal
    const move = this.game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // always promote to a queen for example simplicity
    });

    // illegal move
    if (move === null) return;

    const highlights = this.getVisionHighlights();

    this.setState(({ history, pieceSquare }: State) => ({
      fen: this.game.fen(),
      history: this.game.history({ verbose: true }),
      squareStyles: squareStyling({ pieceSquare, history, highlights }),
      highlights,
    }));
  };

  onMouseOverSquare = (square: Square) => {
    // get list of possible moves for this square
    const moves = this.game.moves({
      square: square,
      verbose: true,
    });

    // exit if there are no moves available for this square
    if (moves.length === 0) return;

    const squaresToHighlight: Square[] = [];
    for (let i = 0; i < moves.length; i++) {
      squaresToHighlight.push(moves[i].to);
    }

    this.highlightSquare(square, squaresToHighlight);
  };

  onMouseOutSquare = () => this.removeHighlightSquare();

  // central squares get diff dropSquareStyles
  onDragOverSquare = (square) => {
    this.setState({
      dropSquareStyle:
        square === "e4" || square === "d4" || square === "e5" || square === "d5"
          ? { backgroundColor: "cornFlowerBlue" }
          : { boxShadow: "inset 0 0 1px 4px rgb(255, 255, 0)" },
    });
  };

  onSquareClick = (square: Square) => {
    this.setState(({ history, highlights }) => ({
      squareStyles: squareStyling({ pieceSquare: square, history, highlights }),
      pieceSquare: square,
    }));

    const move = this.game.move({
      from: this.state.pieceSquare,
      to: square,
      promotion: "q", // always promote to a queen for example simplicity
    });

    // illegal move
    if (move === null) return;

    const highlights = this.getVisionHighlights();

    this.setState({
      fen: this.game.fen(),
      history: this.game.history({ verbose: true }),
      pieceSquare: "",
      highlights,
    });
  };

  onSquareRightClick = (square) =>
    this.setState({
      squareStyles: { [square]: { backgroundColor: "deepPink" } },
    });

  private getVisionHighlights() {
    return hydrateBoard(invertArray(this.game.board().reverse())).map((r, x) =>
      r.map((c, y) => ({
        square: toChessCoordinates(x, y),
        vision: c.vision,
      }))
    );
  }

  undoLastMove = () => {
    const move = this.game.undo();

    if (move === null) return;

    const highlights = this.getVisionHighlights();

    this.setState(({ history, pieceSquare }) => ({
      fen: this.game.fen(),
      history: this.game.history({ verbose: true }),
      squareStyles: squareStyling({ history, highlights, pieceSquare }),
      highlights,
    }));
  };

  render() {
    const { fen, dropSquareStyle, squareStyles } = this.state;

    return this.props.children({
      squareStyles,
      position: fen,
      onMouseOverSquare: this.onMouseOverSquare,
      onMouseOutSquare: this.onMouseOutSquare,
      onDrop: this.onDrop,
      dropSquareStyle,
      onDragOverSquare: this.onDragOverSquare,
      onSquareClick: this.onSquareClick,
      onSquareRightClick: this.onSquareRightClick,
      undoLastMove: this.undoLastMove,
      highlights: this.state.highlights,
    });
  }
}

export default function WithMoveValidation() {
  return (
    <div>
      <HumanVsHuman>
        {({
          position,
          onDrop,
          onMouseOverSquare,
          onMouseOutSquare,
          squareStyles,
          dropSquareStyle,
          onDragOverSquare,
          onSquareClick,
          onSquareRightClick,
          undoLastMove,
          highlights,
        }: any) => (
          <>
            <Chessboard
              id="humanVsHuman"
              position={position}
              onDrop={onDrop}
              onMouseOverSquare={onMouseOverSquare}
              onMouseOutSquare={onMouseOutSquare}
              boardStyle={{
                borderRadius: "5px",
                boxShadow: `0 5px 15px rgba(0, 0, 0, 0.5)`,
                backgroundColor: "black",
              }}
              squareStyles={squareStyles}
              dropSquareStyle={dropSquareStyle}
              onDragOverSquare={onDragOverSquare}
              onSquareClick={onSquareClick}
              onSquareRightClick={onSquareRightClick}
              darkSquareStyle={{ backgroundColor: "rgba(240, 217, 181,0.8)" }}
              lightSquareStyle={{ backgroundColor: "rgba(181, 136, 99, 0.8)" }}
              content={(highlights as { square: Square; vision: number }[][])
                .flat()
                .reduce((acc, cell) => {
                  acc[cell.square] = cell.vision && (
                    <span
                      style={{
                        position: "absolute",
                        marginTop: "-0.3em",
                        marginLeft: "3em",
                        fontSize: "1em",
                        zIndex: 100,
                        color:
                          cell.vision > 0
                            ? "rgb(150,255,150)"
                            : cell.vision < 0
                            ? "rgb(255,150,150)"
                            : "black",
                        // neon effect using text-shadow
                        // textShadow:
                        //   cell.vision > 0
                        //     ? "0 0 5px rgb(150,255,150), 0 0 10px rgb(150,255,150), 0 0 20px rgb(150,255,150), 0 0 40px rgb(150,255,150)"
                        //     : cell.vision < 0
                        //     ? "0 0 5px rgb(255,150,150), 0 0 10px rgb(255,150,150), 0 0 20px rgb(255,150,150), 0 0 40px rgb(255,150,150)"
                        //     : "",
                        textShadow:
                          "0 0 5px black, 0 0 10px black, 0 0 20px black",
                      }}
                    >
                      {Math.abs(cell.vision)}
                    </span>
                  );
                  return acc;
                }, {})}
            />

            {/* // undo button */}
            <button onClick={undoLastMove}>Undo</button>
          </>
        )}
      </HumanVsHuman>
    </div>
  );
}

const squareStyling = ({
  pieceSquare,
  history,
  highlights,
}: {
  highlights: {
    square: Square;
    vision: number;
  }[][];
  pieceSquare: Square | "";
  history: Move[];
}): SqSt => {
  const sourceSquare = history.length && history[history.length - 1].from;
  const targetSquare = history.length && history[history.length - 1].to;

  const highlightedSquareStyles = highlights.reduce<SqSt>((acc, row) => {
    row.reduce((acc, cell) => {
      acc[cell.square] = {
        // backgroundColor:
        //   cell.vision > 0
        //     ? `rgba(0, 255, 0, 0.2)`
        //     : cell.vision < 0
        //     ? `rgba(255, 0, 0, 0.2)`
        //     : ``,

        boxShadow: Array.from({ length: Math.abs(cell.vision) }, (_, i) => {
          const color =
            cell.vision > 0 ? `rgba(5, 255, 5, 0.3)` : `rgba(255, 5, 5, 0.3)`;

          return `inset 0px 0px ${i ? 0 : `2px`} ${
            6 * i + 4
          }px ${color}, inset 0px 0px 5px ${6 * i + 1}px rgba(0,0,0,0.3)`;
        }).join(", "),
        borderRadius: "2px",
        ...(sourceSquare === cell.square || targetSquare === cell.square
          ? {
              backgroundColor: "rgba(255, 255, 0, 0.4)",
            }
          : {}),

        ...(pieceSquare === cell.square
          ? {
              backgroundColor: "rgba(150, 150, 255, 0.9)",
            }
          : {}),
      };
      return acc;
    }, acc);
    return acc;
  }, {});

  return highlightedSquareStyles;
};

function invertArray<T>(arr: T[][]): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr[0].length; i++) {
    result[i] = [];
    for (let j = 0; j < arr.length; j++) {
      result[i][j] = arr[j][i];
    }
  }
  return result;
}

function toChessCoordinates(x: number, y: number): Square {
  const file = String.fromCharCode("a".charCodeAt(0) + x);
  const rank = y + 1;
  return `${file}${rank}` as Square;
}
