# backend/utils/detection.py

import cv2
import mediapipe as mp # type: ignore
import time
import math
import numpy as np
import os
from scipy.spatial import distance

# -----------------------------
# Initialize MediaPipe Face Mesh (Tasks API for Python 3.13)
# -----------------------------
from mediapipe.tasks import python # type: ignore
from mediapipe.tasks.python import vision # type: ignore

model_path = os.path.join(os.path.dirname(__file__), '..', 'model', 'face_landmarker.task')
base_options = python.BaseOptions(model_asset_path=model_path)
options = vision.FaceLandmarkerOptions(
    base_options=base_options,
    output_face_blendshapes=False,
    output_facial_transformation_matrixes=False,
    num_faces=1)
face_mesh = vision.FaceLandmarker.create_from_options(options)

# -----------------------------
# State tracking
# -----------------------------
class State:
    def __init__(self):
        self.blink_counter = 0
        self.micro_sleep_frames = 0
        self.distracted_frames = 0
        
state = State()

# Thresholds
EAR_THRESH = 0.21
MAR_THRESH = 0.6
MICRO_SLEEP_FRAMES_THRESH = 5 # At 5 FPS, ~0.8 seconds
DISTRACTED_FRAMES_THRESH = 5  # At 5 FPS, ~1 second

# -----------------------------
# Helper functions
# -----------------------------
def get_ear(landmarks, eye_indices, iw, ih):
    """Compute Eye Aspect Ratio (EAR) using MediaPipe landmarks"""
    # MediaPipe landmarks are normalized [0.0, 1.0], scale them to image dims
    coords = [(int(landmarks[local_idx].x * iw), int(landmarks[local_idx].y * ih)) for local_idx in eye_indices]
    
    # distance between vertical eye landmarks
    A = distance.euclidean(coords[1], coords[5])
    B = distance.euclidean(coords[2], coords[4])
    # distance between horizontal eye landmarks
    C = distance.euclidean(coords[0], coords[3])
    
    ear = (A + B) / (2.0 * C)
    return ear

def get_mar(landmarks, iw, ih):
    """Compute Mouth Aspect Ratio (MAR) using MediaPipe landmarks"""
    top_lip = (int(landmarks[13].x * iw), int(landmarks[13].y * ih))
    bottom_lip = (int(landmarks[14].x * iw), int(landmarks[14].y * ih))
    left_lip = (int(landmarks[78].x * iw), int(landmarks[78].y * ih))
    right_lip = (int(landmarks[308].x * iw), int(landmarks[308].y * ih))
    
    A = distance.euclidean(top_lip, bottom_lip)
    C = distance.euclidean(left_lip, right_lip)
    
    mar = A / C
    return mar

def get_head_pose(landmarks, iw, ih):
    """Calculate Head Pose (Yaw, Pitch) to detect distraction"""
    face_3d = []
    face_2d = []
    
    # 33: left eye corner, 263: right eye corner, 1: nose tip, 61: left mouth corner, 291: right mouth corner, 152: chin
    key_points = [33, 263, 1, 61, 291, 152]
    
    for idx in key_points:
        lm = landmarks[idx]
        x, y = int(lm.x * iw), int(lm.y * ih)
        face_2d.append([x, y])
        face_3d.append([x, y, lm.z])
        
    face_2d = np.array(face_2d, dtype=np.float64)
    face_3d = np.array(face_3d, dtype=np.float64)
    
    focal_length = 1 * iw
    cam_matrix = np.array([
        [focal_length, 0, ih / 2],
        [0, focal_length, iw / 2],
        [0, 0, 1]
    ])
    dist_matrix = np.zeros((4, 1), dtype=np.float64)
    
    success, rot_vec, trans_vec = cv2.solvePnP(face_3d, face_2d, cam_matrix, dist_matrix)
    rmat, jac = cv2.Rodrigues(rot_vec)
    angles, mtxR, mtxQ, Qx, Qy, Qz = cv2.RQDecomp3x3(rmat)
    
    pitch = angles[0] * 360 # Up/Down
    yaw = angles[1] * 360  # Left/Right
    
    return pitch, yaw

# MediaPipe specific eye indices
LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]

# -----------------------------
# Main detection function
# -----------------------------
def detect_drowsiness(frame, ear_thresh=None, mar_thresh=None, **kwargs):
    global state
    
    ih, iw, _ = frame.shape
    
    # MediaPipe requires RGB
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
    results = face_mesh.detect(mp_image)

    drowsy = False
    warning = False
    reasons = []
    ear = 0
    mar = 0
    pitch = 0
    yaw = 0
    face_detected = False

    current_ear_thresh = ear_thresh if ear_thresh is not None else EAR_THRESH
    current_mar_thresh = mar_thresh if mar_thresh is not None else MAR_THRESH

    if results.face_landmarks:
        face_detected = True
        landmarks = results.face_landmarks[0]
        
        # Calculate EAR
        left_ear = get_ear(landmarks, LEFT_EYE_INDICES, iw, ih)
        right_ear = get_ear(landmarks, RIGHT_EYE_INDICES, iw, ih)
        ear = (left_ear + right_ear) / 2.0
        
        # Calculate MAR
        mar = get_mar(landmarks, iw, ih)
        
        # Calculate Head Pose for distraction
        pitch, yaw = get_head_pose(landmarks, iw, ih)
        
        # 1. Micro-Sleep & Blinking Logic
        if ear < current_ear_thresh:
            state.micro_sleep_frames += 1
            if state.micro_sleep_frames >= MICRO_SLEEP_FRAMES_THRESH:
                reasons.append("eyes_closed_prolonged")
                drowsy = True
        else:
            if state.micro_sleep_frames > 2 and state.micro_sleep_frames < MICRO_SLEEP_FRAMES_THRESH:
                # Registered a valid blink
                state.blink_counter += 1
            state.micro_sleep_frames = 0
            
        # 2. Yawning Logic
        if mar > current_mar_thresh:
            reasons.append("yawning")
            warning = True
            
        # 3. Distraction / Head Pose Logic
        is_distracted = False
        if abs(yaw) > 20: # Looking left or right too much
            is_distracted = True
        if pitch < -15: # Looking down (at phone)
            is_distracted = True
            
        if is_distracted:
            state.distracted_frames += 1
            if state.distracted_frames >= DISTRACTED_FRAMES_THRESH:
                reasons.append("distracted_looking_away")
                warning = True
        else:
            state.distracted_frames = max(0, state.distracted_frames - 2) # cool down

    # Reset state if no face
    else:
        state.micro_sleep_frames = 0
        state.distracted_frames = 0

    # Log for debugging
    if face_detected:
        print(f"Face: YES | EAR: {ear:.3f} (thresh: {current_ear_thresh:.2f}) | MAR: {mar:.3f} (thresh: {current_mar_thresh:.2f}) | Drowsy: {drowsy} | Warning: {warning}")
    else:
        print("Face: NO")

    return {
        "drowsy": drowsy,
        "warning": warning,
        "reasons": reasons,
        "ear": round(ear, 3),
        "mar": round(mar, 3),
        "pitch": round(pitch, 1),
        "yaw": round(yaw, 1),
        "face_detected": face_detected
    }
