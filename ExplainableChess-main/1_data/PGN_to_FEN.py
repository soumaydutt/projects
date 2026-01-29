"""Convert PGN games → intermediate FEN positions + Stockfish features.

Usage:
    python 1_data/PGN_to_FEN.py pgn/lichess_db_standard_2024-01.pgn chess_dataset.csv
"""

import sys
import chess.pgn as pgn
import chess
import pandas as pd
import numpy as np
from stockfish import Stockfish
from tqdm import tqdm

STOCKFISH_PATH = "../stockfish/stockfish-windows-x86-64-avx2.exe"
DEPTH = 15

stockfish = Stockfish(STOCKFISH_PATH, depth=DEPTH)

PIECE_VALUES = {chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3,
                chess.ROOK: 5, chess.QUEEN: 9, chess.KING: 0}

KNIGHT_TABLE = np.array([
    [-5, -4, -3, -3, -3, -3, -4, -5],
    [-4, -2,  0,  0,  0,  0, -2, -4],
    [-3,  0,  1,  1.5,1.5, 1,  0, -3],
    [-3, .5, 1.5,   2,  2,1.5, .5,-3],
    [-3,  0,1.5,    2,  2,1.5,  0,-3],
    [-3, .5,  1,  1.5,1.5, 1, .5, -3],
    [-4, -2,  0,  .5, .5, 0, -2, -4],
    [-5, -4, -3, -3, -3, -3, -4, -5]
])

def pawn_islands(board, color):
    pawns = list(board.pieces(chess.PAWN, color))
    if not pawns:
        return 0
    files = sorted(chess.square_file(p) for p in pawns)
    islands = 1
    for a, b in zip(files, files[1:]):
        if b - a > 1:
            islands += 1
    return islands

def features(board: chess.Board):
    f = {}
    white_mat = sum(PIECE_VALUES[p.piece_type] for p in board.piece_map().values()
                    if p.color == chess.WHITE)
    black_mat = sum(PIECE_VALUES[p.piece_type] for p in board.piece_map().values()
                    if p.color == chess.BLACK)
    f["material_diff"] = white_mat - black_mat
    f["pawn_islands_white"] = pawn_islands(board, chess.WHITE)
    f["pawn_islands_black"] = pawn_islands(board, chess.BLACK)

    knight_score = 0
    for sq in board.pieces(chess.KNIGHT, chess.WHITE):
        knight_score += KNIGHT_TABLE[7 - (sq // 8)][sq % 8]
    for sq in board.pieces(chess.KNIGHT, chess.BLACK):
        knight_score -= KNIGHT_TABLE[sq // 8][sq % 8]
    f["knight_activity"] = round(knight_score, 2)

    f["move_number"] = board.fullmove_number
    f["castling_rights"] = board.castling_xfen()
    return f

def main(pgn_path: str, csv_out: str):
    rows = []
    with open(pgn_path, encoding="utf-8", errors="replace") as fh:
        total_games = sum(1 for _ in fh if _.startswith("[Event "))
    with open(pgn_path, encoding="utf-8", errors="replace") as fh,                  tqdm(total=total_games, desc="Parsing games") as pbar:
        while (game := pgn.read_game(fh)) is not None:
            board = game.board()
            for move in game.mainline_moves():
                board.push(move)
                stockfish.set_fen_position(board.fen())
                try:
                    eval_score = stockfish.get_evaluation()
                    cp = eval_score["value"] if eval_score["type"] == "cp" else (
                        10000 if eval_score["value"] > 0 else -10000)
                except Exception:
                    cp = None
                row = {"fen": board.fen(), "stockfish_cp": cp, **features(board)}
                rows.append(row)
            pbar.update(1)

    pd.DataFrame(rows).to_csv(csv_out, index=False)
    print(f"✅ Saved {len(rows)} positions → {csv_out}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python PGN_to_FEN.py <input.pgn> <output.csv>")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
