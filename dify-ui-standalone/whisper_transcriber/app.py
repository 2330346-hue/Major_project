import os
import sys
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper

# Add ffmpeg directory to PATH if present
ffmpeg_dir = r"C:\Program Files\KMPlayer 64X\LAVFilters64"
if os.path.exists(ffmpeg_dir) and ffmpeg_dir not in os.environ.get("PATH", ""):
    os.environ["PATH"] += os.pathsep + ffmpeg_dir

app = Flask(__name__)
CORS(app)

print("Loading Whisper 'tiny' model...")
model = whisper.load_model("tiny")
print("Whisper model loaded successfully!")

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    
    ext = os.path.splitext(file.filename)[1] or '.webm'
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        lang = request.form.get("language")
        if not lang or lang == "auto":
            lang = None

        task = request.form.get("task", "transcribe")

        result = model.transcribe(
            tmp_path,
            language=lang,
            task=task,
            fp16=False,
            condition_on_previous_text=False
        )
        transcription_text = result.get("text", "").strip()
        detected_lang = result.get("language", "en")
        
        output_dir = os.path.join(os.path.dirname(__file__), "output")
        os.makedirs(output_dir, exist_ok=True)
        with open(os.path.join(output_dir, "transcription.txt"), "w", encoding="utf-8") as f:
            f.write(transcription_text + "\n")
            
        return jsonify({
            'status': 'success',
            'text': transcription_text,
            'language': detected_lang
        })
    except Exception as e:
        print(f"Error during transcription: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass

if __name__ == '__main__':
    port = 5000
    print(f"Starting Whisper Transcriber server on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
