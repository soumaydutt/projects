"""Generate (FEN, features) → commentary pairs using an instruction‑tuned LLM.

Requires:
    * Pre‑extracted CSV with at least a 'fen' column (output of PGN_to_FEN.py)
    * Local Stockfish binary for deeper analysis
"""

import os, random, json, math
import pandas as pd
import torch
import chess
import chess.engine
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
from huggingface_hub import login
from tqdm import tqdm

INPUT_CSV = "../1_data/chess_dataset.csv"        # produced earlier
OUTPUT_CSV = "chess_commentary_dataset.csv"
STOCKFISH_PATH = "../stockfish/stockfish-windows-x86-64-avx2.exe"

MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.1"   # switch to gpt2 if GPU is limited
MAX_TOKENS = 250
TEMPERATURE = 0.9

# ----- Authenticate to HuggingFace (optional – comment if not needed) -----
hf_token = os.getenv("HF_TOKEN")  # export HF_TOKEN=...
if hf_token:
    login(token=hf_token)

# ----- Load model -----
use_gpu = torch.cuda.is_available()
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    torch_dtype=torch.float16 if use_gpu else torch.float32,
    device_map="auto" if use_gpu else None,
    trust_remote_code=True
)
text_gen = pipeline("text-generation", model=model, tokenizer=tokenizer,
                    device=0 if use_gpu else -1)

# ----- Helper functions -----
def eval_position(fen, engine, depth=18):
    board = chess.Board(fen)
    info = engine.analyse(board, chess.engine.Limit(depth=depth))
    cp = info["score"].white().score(mate_score=10000)
    pv  = info.get("pv", [])
    return cp, pv

def build_prompt(fen, side, cp, tactics):
    return f"""You are a grandmaster chess commentator.
FEN: {fen}
Side to move: {side}
Stockfish evaluation (centipawns): {cp}
Detected tactical motifs: {', '.join(tactics) if tactics else 'none'}
Provide an insightful yet concise human‑readable commentary, explaining strategic plans, tactical ideas, and any hidden resources."""

def detect_tactics(board, pv):
    motifs = []
    if pv:
        move = pv[0]
        if board.is_capture(move):
            motifs.append("capture")
        board.push(move)
        if board.is_check():
            motifs.append("check")
    return motifs

# ----- Main loop -----
df = pd.read_csv(INPUT_CSV).dropna(subset=["fen"]).sample(frac=1.0, random_state=42)  # shuffle
results = []

with chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH) as engine:
    for fen in tqdm(df["fen"], total=len(df), desc="Generating commentary"):
        board = chess.Board(fen)
        cp, pv = eval_position(fen, engine)
        tactics = detect_tactics(board.copy(), pv)
        side = "White" if board.turn == chess.WHITE else "Black"
        prompt = build_prompt(fen, side, cp, tactics)

        try:
            completion = text_gen(prompt, max_new_tokens=MAX_TOKENS,
                                  temperature=TEMPERATURE)[0]["generated_text"]
            comment = completion.replace(prompt, "").strip()
        except Exception as e:
            comment = f"[Generation error: {e}]"

        results.append({
            "fen": fen,
            "cp": cp,
            "side_to_move": side,
            "tactics": ", ".join(tactics),
            "commentary": comment
        })

pd.DataFrame(results).to_csv(OUTPUT_CSV, index=False)
print(f"✅ Dataset saved → {OUTPUT_CSV} (n={len(results)})")
