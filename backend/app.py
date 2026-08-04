from flask import Flask, Response, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import cv2
import base64
import numpy as np
from utils.detection import detect_drowsiness
import eventlet

# -----------------------------
# Flask App Setup
# -----------------------------
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# -----------------------------
# Frame Processing Function
# -----------------------------
def process_frame(data_obj):
    # Decode base64 image
    try:
        if isinstance(data_obj, dict):
            image_data = data_obj.get('image')
            timestamp = data_obj.get('timestamp')
        else:
            image_data = data_obj
            timestamp = None

        encoded_data = image_data.split(',')[1]
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return {"error": "Invalid frame", "timestamp": timestamp}

        # Drowsiness detection logic
        data = detect_drowsiness(frame)
        data['timestamp'] = timestamp
        
        return data
    except Exception as e:
        print(f"Error processing frame: {e}")
        return {"error": str(e), "timestamp": data_obj.get('timestamp') if isinstance(data_obj, dict) else None}

# -----------------------------
# WebSocket Events
# -----------------------------
@socketio.on('image')
def handle_image(data):
    result = process_frame(data)
    emit('response', result)

# -----------------------------
# Routes
# -----------------------------
@app.route('/')
def index():
    return jsonify({"status": "running", "message": "Driver Drowsiness Detection Backend with Socket.IO"})

@app.route('/status')
def status():
    # Placeholder for status check if needed by frontend polling
    return jsonify({"message": "Backend is active"})

# -----------------------------
# Main
# -----------------------------
if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
