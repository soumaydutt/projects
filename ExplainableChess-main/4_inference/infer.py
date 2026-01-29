"""Run inference with a fine‑tuned chess commentary model."""

import sys, torch
from transformers import AutoTokenizer, AutoModelForCausalLM

MODEL_DIR = "../3_training/chess_commentary_model"   # adjust if needed
MAX_NEW_TOKENS = 128

tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
model = AutoModelForCausalLM.from_pretrained(MODEL_DIR,
                                             torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                                             device_map="auto" if torch.cuda.is_available() else None)

def generate_commentary(fen: str) -> str:
    prompt = f"FEN: {fen}\nCommentary:"
    input_ids = tokenizer(prompt, return_tensors="pt").to(model.device)
    out = model.generate(**input_ids, max_new_tokens=MAX_NEW_TOKENS,
                         do_sample=True, temperature=0.7)
    text = tokenizer.decode(out[0], skip_special_tokens=True)
    return text.replace(prompt, "").strip()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python infer.py '<fen>'")
        sys.exit(1)
    print(generate_commentary(sys.argv[1]))
