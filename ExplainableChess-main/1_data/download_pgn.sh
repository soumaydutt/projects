#!/usr/bin/env bash
# Download a bundle of classical & rapid PGNs from the lichess public database
# See https://database.lichess.org/ for monthly dumps

mkdir -p pgn
cd pgn || exit 1

echo "⏬ Downloading sample PGN (classical‑2024‑01.pgn.zst)…"
wget -q --show-progress https://database.lichess.org/standard/lichess_db_standard_rated_2024-01.pgn.zst

echo "📦 Decompressing…"
zstd -d lichess_db_standard_rated_2024-01.pgn.zst
echo "✅ Done – PGN ready."
