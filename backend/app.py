from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import torch
import io
from datetime import datetime
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)

# Load model
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

try:
    # Load YOLOv5/v8 model using ultralytics
    model = YOLO('best.pt')
    model.to(device)
    print("Model loaded successfully")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Store logs
detection_logs = []

@app.route('/api/detect', methods=['POST'])
def detect():
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        image_file = request.files['image']
        image = Image.open(io.BytesIO(image_file.read())).convert('RGB')
        
        # Run inference
        results = model(image, conf=0.25)
        
        # Parse results
        detections = []
        if len(results) > 0:
            for result in results:
                if result.boxes is not None:
                    for box in result.boxes:
                        obj = {
                            'category': result.names[int(box.cls)],
                            'confidence': float(box.conf)
                        }
                        detections.append(obj)
        
        # Log detection
        log_entry = {
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'seabin': 'SB-002',
            'detections': detections,
            'total_objects': len(detections)
        }
        detection_logs.insert(0, log_entry)  # Add to front of list
        
        return jsonify(log_entry), 200
    
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/logs', methods=['GET'])
def get_logs():
    return jsonify(detection_logs), 200

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'device': str(device)}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
