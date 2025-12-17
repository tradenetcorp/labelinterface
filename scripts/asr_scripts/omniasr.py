from __future__ import annotations

import os
os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"  # Allow CPU fallback for unsupported MPS ops

import argparse
import json
from pathlib import Path
from typing import Iterable, List, Optional

from omnilingual_asr.models.inference.pipeline import ASRInferencePipeline


AUDIO_EXTS = {".wav", ".flac", ".ogg", ".m4a", ".aiff", ".aif", ".aifc"}  # libsndfile-friendly set


def iter_audio_files(root: Path) -> Iterable[Path]:
    for p in root.rglob("*"):
        if p.is_file() and p.suffix.lower() in AUDIO_EXTS:
            yield p


def chunked(items: List[Path], n: int) -> Iterable[List[Path]]:
    for i in range(0, len(items), n):
        yield items[i : i + n]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input-dir", default="public/audio/transcripts", help="Directory containing audio files")
    ap.add_argument("--output-file", default="public/audio/transcripts/transcriptions.jsonl", help="JSONL output path")
    ap.add_argument("--lang", default="div_Thaa", help="Language+script ID (e.g., eng_Latn, div_Thaa). Default: Dhivehi")
    ap.add_argument("--batch-size", type=int, default=2, help="Batch size per forward pass")
    args = ap.parse_args()

    input_dir = Path(args.input_dir)
    output_file = Path(args.output_file)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    audio_files = sorted(iter_audio_files(input_dir))
    if not audio_files:
        raise SystemExit(f"No supported audio files found under: {input_dir}")

    pipeline = ASRInferencePipeline(model_card="omniASR_LLM_Unlimited_3B_v2", device="mps")

    # Append-safe JSONL writer
    with output_file.open("a", encoding="utf-8") as f:
        total = len(audio_files)
        processed = 0

        for batch_paths in chunked(audio_files, max(1, int(args.batch_size))):
            batch_strs = [str(p) for p in batch_paths]

            # For LLM+LID models, lang can be optional; if provided, pass a list aligned with batch
            lang_list: Optional[List[str]] = None
            if args.lang:
                lang_list = [args.lang] * len(batch_strs)

            try:
                transcriptions = pipeline.transcribe(batch_strs, lang=lang_list, batch_size=len(batch_strs))
            except TypeError:
                # Some versions may not accept lang=None; retry without the kwarg
                if lang_list is None:
                    transcriptions = pipeline.transcribe(batch_strs, batch_size=len(batch_strs))
                else:
                    raise

            for path_str, text in zip(batch_strs, transcriptions):
                rec = {"path": path_str, "transcription": text}
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")

            processed += len(batch_strs)
            print(f"[{processed}/{total}] wrote -> {output_file}")

    print("Done.")


if __name__ == "__main__":
    main()