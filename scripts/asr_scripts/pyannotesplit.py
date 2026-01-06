import os
from pathlib import Path
from collections import defaultdict

import torch
import torchaudio
from pyannote.audio import Pipeline

# ---- config ----
INPUT_DIR = Path("/Users/rayyu/Mindco/R&D/Projects/labelapp/public/audio/transcripts")
OUTPUT_DIR = Path("diarized")
MODEL_ID = "pyannote/speaker-diarization-community-1"
DEVICE = "mps"  # cpu | cuda | mps
HF_TOKEN = os.environ.get("HF_TOKEN")
MIN_SEGMENT_S = 0.3
MERGE_GAP_S = 0.2
# ----------------


def load_mono(path: Path):
    wav, sr = torchaudio.load(path)
    if wav.shape[0] > 1:
        wav = wav.mean(dim=0, keepdim=True)
    return wav, sr


def slice_audio(wav, sr, start_s, end_s):
    start = int(start_s * sr)
    end = int(end_s * sr)
    return wav[:, start:end]


def merge_segments(segments, gap_s):
    if not segments:
        return []
    segments = sorted(segments, key=lambda x: (x["speaker"], x["start"]))
    out = [segments[0]]
    for s in segments[1:]:
        prev = out[-1]
        if s["speaker"] == prev["speaker"] and s["start"] - prev["end"] <= gap_s:
            prev["end"] = max(prev["end"], s["end"])
        else:
            out.append(s)
    return out


def diarize(wav, sr, pipeline):
    # Pass audio in-memory to bypass torchcodec
    audio_dict = {"waveform": wav, "sample_rate": sr}
    result = pipeline(audio_dict)
    diarization = result.speaker_diarization
    segments = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        dur = turn.end - turn.start
        if dur >= MIN_SEGMENT_S:
            segments.append(
                {
                    "speaker": speaker,
                    "start": float(turn.start),
                    "end": float(turn.end),
                }
            )
    return merge_segments(segments, MERGE_GAP_S)


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    pipeline = Pipeline.from_pretrained(
        MODEL_ID,
        token=HF_TOKEN or True,
    )
    try:
        pipeline.to(DEVICE)
    except Exception:
        pass

    for audio_path in INPUT_DIR.glob("*.wav"):
        print(f"diarizing {audio_path.name}")

        wav, sr = load_mono(audio_path)
        segments = diarize(wav, sr, pipeline)

        by_speaker = defaultdict(list)
        for s in segments:
            by_speaker[s["speaker"]].append(s)

        for speaker, segs in by_speaker.items():
            chunks = [
                slice_audio(wav, sr, s["start"], s["end"])
                for s in sorted(segs, key=lambda x: x["start"])
            ]
            speaker_wav = torch.cat(chunks, dim=1)
            out = OUTPUT_DIR / f"{audio_path.stem}_speaker_{speaker}.wav"
            torchaudio.save(out, speaker_wav, sr)

    print("done")


if __name__ == "__main__":
    main()
