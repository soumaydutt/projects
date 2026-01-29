"""Fine‑tune GPT‑2 (or any causal LM) on the chess commentary dataset."""

import math, os
import pandas as pd
import torch
from datasets import Dataset
from transformers import (GPT2LMHeadModel, GPT2Tokenizer, Trainer,
                          TrainingArguments, DataCollatorForLanguageModeling)

DATASET_CSV = "../2_dataset/chess_commentary_dataset.csv"
OUTPUT_DIR = "chess_commentary_model"
MAX_LEN = 512
EPOCHS = 3
LR = 5e-5

df = pd.read_csv(DATASET_CSV)
# Simple split – 80/20
train_df = df.sample(frac=0.8, random_state=42)
val_df   = df.drop(train_df.index)

def make_prompt(row):
    return f"""FEN: {row['fen']}
Side to move: {row['side_to_move']}
Stockfish cp: {row['cp']}
Tactics: {row['tactics']}
Commentary:
{row['commentary']}"""

train_texts = [make_prompt(r) for _, r in train_df.iterrows()]
val_texts   = [make_prompt(r) for _, r in val_df.iterrows()]

model_name = "gpt2"
tokenizer = GPT2Tokenizer.from_pretrained(model_name)
tokenizer.pad_token = tokenizer.eos_token
model = GPT2LMHeadModel.from_pretrained(model_name)
model.config.pad_token_id = model.config.eos_token_id

def tokenize(batch):
    return tokenizer(batch["text"], padding="max_length",
                     truncation=True, max_length=MAX_LEN)

train_ds = Dataset.from_dict({"text": train_texts}).map(tokenize, batched=True, remove_columns=["text"])
val_ds   = Dataset.from_dict({"text": val_texts}).map(tokenize, batched=True, remove_columns=["text"])

collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=EPOCHS,
    per_device_train_batch_size=1,
    gradient_accumulation_steps=8,
    evaluation_strategy="steps",
    eval_steps=500,
    save_steps=1000,
    learning_rate=LR,
    weight_decay=0.01,
    fp16=torch.cuda.is_available(),
    logging_steps=100,
    save_total_limit=2,
    load_best_model_at_end=True,
    greater_is_better=False,
    metric_for_best_model="eval_loss"
)

trainer = Trainer(model=model, args=args, data_collator=collator,
                  train_dataset=train_ds, eval_dataset=val_ds)

trainer.train()
trainer.save_model(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)

eval_res = trainer.evaluate()
print(f"Perplexity: {math.exp(eval_res['eval_loss']):.2f}")
