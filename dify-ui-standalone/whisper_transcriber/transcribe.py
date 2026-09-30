import os
import sys
import argparse

# Add ffmpeg directory to PATH if present
ffmpeg_dirs = [
    r"C:\Program Files\KMPlayer 64X\LAVFilters64",
    r"C:\Program Files\ffmpeg\bin",
    r"C:\ffmpeg\bin"
]
for d in ffmpeg_dirs:
    if os.path.exists(d) and d not in os.environ.get("PATH", ""):
        os.environ["PATH"] += os.pathsep + d

import whisper

def transcribe_audio(audio_path):
    # Check if the input file exists
    if not os.path.exists(audio_path):
        print(f"Error: The input audio file '{audio_path}' does not exist.", file=sys.stderr)
        sys.exit(1)

    print(f"Loading Whisper 'tiny' model locally...")
    try:
        # Load the tiny model locally
        model = whisper.load_model("tiny")
    except Exception as e:
        print(f"Error loading Whisper model: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"Transcribing '{audio_path}' in English...")
    try:
        # Perform transcription with English language specified
        result = model.transcribe(audio_path, language="en")
    except Exception as e:
        print(f"Error during transcription: {e}", file=sys.stderr)
        print("\nNote: OpenAI Whisper requires 'ffmpeg' to be installed and available on your system PATH.", file=sys.stderr)
        sys.exit(1)

    transcription_text = result.get("text", "").strip()

    # Print the transcription to the terminal
    print("\n--- Transcription ---")
    print(transcription_text)
    print("---------------------\n")

    # Create the output directory automatically if it does not exist
    output_dir = "output"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "transcription.txt")

    # Save transcription to output/transcription.txt
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(transcription_text + "\n")
        print(f"Transcription successfully saved to '{output_path}'")
    except Exception as e:
        print(f"Error saving transcription to file: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Transcribe an audio file locally using OpenAI Whisper 'tiny' model.")
    parser.add_argument("audio_path", help="Path to the input audio file (e.g., MP3)")
    args = parser.parse_args()

    transcribe_audio(args.audio_path)
