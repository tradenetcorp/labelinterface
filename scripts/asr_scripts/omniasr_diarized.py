from __future__ import annotations

import os
os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"

import argparse
import json
import re
from pathlib import Path
from typing import Iterable, List, Optional

from omnilingual_asr.models.inference.pipeline import ASRInferencePipeline


AUDIO_EXTS = {".wav", ".flac", ".ogg", ".m4a", ".aiff", ".aif", ".aifc"}


def iter_audio_files(root: Path) -> Iterable[Path]:
    for p in root.rglob("*"):
        if p.is_file() and p.suffix.lower() in AUDIO_EXTS:
            yield p


def chunked(items: List[Path], n: int) -> Iterable[List[Path]]:
    for i in range(0, len(items), n):
        yield items[i : i + n]


def parse_speaker_filename(filename: str) -> tuple[str, str]:
    """
    Parse diarized filename like: 'original_audio_speaker_SPEAKER_01.wav'
    Returns (original_stem, speaker_id)
    """
    match = re.match(r"(.+)_speaker_(.+)\.wav$", filename, re.IGNORECASE)
    if match:
        return match.group(1), match.group(2)
    return filename, "UNKNOWN"


def main() -> None:
    ap = argparse.ArgumentParser(description="Transcribe diarized speaker audio files")
    ap.add_argument(
        "--input-dir",
        default="diarized",
        help="Directory containing diarized audio files",
    )
    ap.add_argument(
        "--output-file",
        default="diarized/transcriptions.jsonl",
        help="JSONL output path",
    )
    ap.add_argument(
        "--lang",
        default="div_Thaa",
        help="Language+script ID (e.g., eng_Latn, div_Thaa). Default: Dhivehi",
    )
    ap.add_argument("--batch-size", type=int, default=2, help="Batch size per forward pass")
    ap.add_argument(
        "--group-by-source",
        action="store_true",
        help="Group output by original source file",
    )
    args = ap.parse_args()

    input_dir = Path(args.input_dir)
    output_file = Path(args.output_file)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    audio_files = sorted(iter_audio_files(input_dir))
    if not audio_files:
        raise SystemExit(f"No supported audio files found under: {input_dir}")

    print(f"Found {len(audio_files)} diarized audio files")

    pipeline = ASRInferencePipeline(model_card="omniASR_LLM_Unlimited_3B_v2", device="mps")

    results: List[dict] = []

    total = len(audio_files)
    processed = 0

    for batch_paths in chunked(audio_files, max(1, int(args.batch_size))):
        batch_strs = [str(p) for p in batch_paths]

        lang_list: Optional[List[str]] = None
        if args.lang:
            lang_list = [args.lang] * len(batch_strs)

        try:
            transcriptions = pipeline.transcribe(batch_strs, lang=lang_list, batch_size=len(batch_strs))
        except TypeError:
            if lang_list is None:
                transcriptions = pipeline.transcribe(batch_strs, batch_size=len(batch_strs))
            else:
                raise

        for path, text in zip(batch_paths, transcriptions):
            source_stem, speaker_id = parse_speaker_filename(path.name)
            rec = {
                "path": str(path),
                "source_file": source_stem,
                "speaker": speaker_id,
                "transcription": text,
            }
            results.append(rec)
            print(f"[{processed + 1}/{total}] {speaker_id}: {text[:60]}...")

        processed += len(batch_strs)

    # Write output
    with output_file.open("w", encoding="utf-8") as f:
        if args.group_by_source:
            # Group by original source file
            from collections import defaultdict
            grouped = defaultdict(list)
            for r in results:
                grouped[r["source_file"]].append({
                    "speaker": r["speaker"],
                    "transcription": r["transcription"],
                })
            for source, speakers in grouped.items():
                rec = {"source_file": source, "speakers": speakers}
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")
        else:
            for rec in results:
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    print(f"\nDone! Output written to: {output_file}")


if __name__ == "__main__":
    main()
