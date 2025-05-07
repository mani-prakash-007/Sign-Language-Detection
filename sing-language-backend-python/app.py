# eventlet monkey patching must be FIRST
import eventlet
eventlet.monkey_patch()

from flask import Flask, request, send_from_directory
from flask_socketio import SocketIO, emit
import base64
import numpy as np
from PIL import Image
from io import BytesIO
from threading import Thread
from queue import Queue
import tensorflow as tf

app = Flask(__name__, static_folder="static")
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

model = tf.keras.models.load_model('final_isl_model.h5')

frame_queue = Queue()
active_clients = set()

def preprocess_image(image_data):
    image_bytes = base64.b64decode(image_data)
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    image = image.resize((64, 64))
    img_array = np.array(image) / 255.0
    
    return np.expand_dims(img_array, axis=0)

def predict(image_data):
    processed = preprocess_image(image_data)
    preds = model.predict(processed)
    class_id = int(np.argmax(preds[0]))
    confidence = float(np.max(preds[0]))
    return class_id, confidence

def process_frames():
    with app.app_context():
        while True:
            if not frame_queue.empty():
                client_sid, frame_data, frame_id = frame_queue.get()
                if client_sid in active_clients:
                    try:
                        print(f"[Processing Frame] ID: {frame_id}")
                        class_id, conf = predict(frame_data)
                        print(f"[Prediction] Frame {frame_id}: Class {class_id}, Confidence {conf:.2f}")

                        socketio.emit('detection', {
                            'frameId': frame_id,
                            'text': f"Class: {class_id} (confidence: {conf:.2f})"
                        }, to=client_sid)

                    except Exception as e:
                        print(f"[Error] Frame {frame_id} prediction error: {e}")
                socketio.sleep(0.01)
            else:
                socketio.sleep(0.1)

Thread(target=process_frames, daemon=True).start()

@app.route('/')
def index():
    return send_from_directory('static', 'client.html')

@socketio.on('connect')
def on_connect():
    print(f"[Connect] Client connected: {request.sid}")
    emit('connection', {'message': 'Connected to sign detection server'})

@socketio.on('disconnect')
def on_disconnect():
    active_clients.discard(request.sid)
    print(f"[Disconnect] Client disconnected: {request.sid}")

@socketio.on('command')
def on_command(data):
    action = data.get('action')
    if action == 'start_detection':
        active_clients.add(request.sid)
        emit('status', {'status': 'detection_started'})
        print(f"[Command] Detection started for {request.sid}")
    elif action == 'stop_detection':
        active_clients.discard(request.sid)
        emit('status', {'status': 'detection_stopped'})
        print(f"[Command] Detection stopped for {request.sid}")

@socketio.on('frame')
def on_frame(data):
    try:
        frame_data = data.get("data")
        frame_id = data.get("frameId")
        if request.sid in active_clients and frame_data:
            if ',' in frame_data:
                frame_data = frame_data.split(',')[1]

            frame_queue.put((request.sid, frame_data, frame_id))
            print(f"[Frame Received] Frame {frame_id} from {request.sid}")
    except Exception as e:
        print(f"[Frame Error] {e}")

# Run server
if __name__ == "__main__":
    print("🚀 Starting sign detection server...")
    socketio.run(app, host='0.0.0.0', port=5001)
