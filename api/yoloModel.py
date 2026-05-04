import cv2
import numpy as np
from ultralytics import YOLO
import time
import base64

# 1. โหลดโมเดล
model = YOLO("api/model/best.pt")

# 2. เปิดไฟล์วิดีโอ
cap = cv2.VideoCapture("api/data/video.mp4")

# --- ตั้งค่าทางวิศวกรรมจราจร (สมมติตามแยกเจริญผล) ---
pcu_map = {"bus": 2.1, "car": 1.0, "motorcycle": 0.33, "tuktuk": 0.8, "truck": 2.0}
S_base = 1700  # Saturation Flow (PCU/hr/lane)
num_lanes = 3  # จำนวนเลนหน้าโลตัส
g_time = 70  # เวลาไฟเขียวสมมติ (วินาที)
C_cycle = 180  # เวลารอบไฟสมมติ (วินาที)

# คำนวณ Capacity (C) คงที่ไว้ก่อน
Capacity = (S_base * num_lanes) * (g_time / C_cycle)

# --- ตั้งค่าจุดสำหรับเส้นเฉียง ---
line_points = [(308, 256), (264, 292)]  # [POOM] This value need to be polish
cumulative_counts = {}
tracked_ids = set()
total_pcu = 0.0
start_time = time.time()


def draw_line_event(event, x, y, flags, param):
    global line_points
    if event == cv2.EVENT_LBUTTONDOWN:
        if len(line_points) >= 2:
            line_points = []
        line_points.append((x, y))


def is_below_line(px, py, x1, y1, x2, y2):
    return (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1) > 0


def get_los(vc_ratio):
    if vc_ratio <= 0.2:
        return "A", (0, 255, 0)
    elif vc_ratio <= 0.4:
        return "B", (150, 255, 0)
    elif vc_ratio <= 0.6:
        return "C", (255, 255, 0)
    elif vc_ratio <= 0.8:
        return "D", (255, 165, 0)
    elif vc_ratio <= 1.0:
        return "E", (255, 0, 0)
    else:
        return "F", (0, 0, 255)


color_map = {
    "bus": (0, 0, 255),
    "car": (0, 255, 0),
    "motorcycle": (255, 0, 255),
    "tuktuk": (0, 165, 255),
    "truck": (255, 0, 0),
}


def get_live_data():
    global total_pcu
    global start_time

    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            total_pcu = 0
            start_time = time.time()
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
        frame = cv2.resize(frame, (640, 360))

        # if len(line_points) == 2:
        # cv2.line(frame, line_points[0], line_points[1], (255, 255, 255), 2)

        results = model.track(
            frame, persist=True, tracker="bytetrack.yaml", conf=0.5, verbose=False
        )

        if results[0].boxes.id is not None and len(line_points) == 2:
            boxes = results[0].boxes.xyxy.int().cpu().tolist()
            class_ids = results[0].boxes.cls.int().cpu().tolist()
            track_ids = results[0].boxes.id.int().cpu().tolist()
            lx1, ly1 = line_points[0]
            lx2, ly2 = line_points[1]

            for box, cls_id, track_id in zip(boxes, class_ids, track_ids):
                class_name = results[0].names[cls_id]
                x1, y1, x2, y2 = box
                cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2)

                if (
                    is_below_line(cx, cy, lx1, ly1, lx2, ly2)
                    and track_id not in tracked_ids
                ):
                    cumulative_counts[class_name] = (
                        cumulative_counts.get(class_name, 0) + 1
                    )
                    tracked_ids.add(track_id)
                    # บวกค่า PCU รวม
                    total_pcu += pcu_map.get(class_name, 1.0)

                # color = color_map.get(class_name, (255, 255, 255))
                # cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

        # --- ส่วนการคำนวณและแสดงผล Engineering Metrics ---
        # คำนวณ Flow Rate (V) รายชั่วโมง
        elapsed_time = time.time() - start_time
        # ป้องกันการหารด้วยศูนย์และใช้เวลาจริงในการคำนวณ Flow
        current_flow = (total_pcu / (elapsed_time / 3600)) if elapsed_time > 0 else 0
        vc_ratio = current_flow / Capacity if Capacity > 0 else 0
        los_grade, los_color = get_los(vc_ratio)

        # encode frame to base64 for the frontend
        ret, buffer = cv2.imencode(".jpg", frame)
        frame_b64 = base64.b64encode(buffer).decode("utf-8")

        yield {
            "current_flow": current_flow,
            "sat_flow": S_base,
            "capacity": Capacity,
            "los_data": {
                "grade": los_grade,
                "color": los_color,
            },
            "cumulative_counts": cumulative_counts,
            "vc_ratio": vc_ratio,
            "frame": frame_b64,
        }
