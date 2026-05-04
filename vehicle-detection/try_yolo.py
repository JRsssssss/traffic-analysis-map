import cv2
import numpy as np
from ultralytics import YOLO
import time

# 1. โหลดโมเดล
model = YOLO("api/model/best.pt")

# 2. เปิดไฟล์วิดีโอ
cap = cv2.VideoCapture("api/data/video.mp4")

# --- ตั้งค่าทางวิศวกรรมจราจร (สมมติตามแยกเจริญผล) ---
pcu_map = {"Bus": 2.1, "cars": 1.0, "motorcycle": 0.33, "tuktuk": 0.8, "truck": 2.0}
S_base = 1700  # Saturation Flow (PCU/hr/lane)
num_lanes = 3  # จำนวนเลนหน้าโลตัส
g_time = 70  # เวลาไฟเขียวสมมติ (วินาที)
C_cycle = 180  # เวลารอบไฟสมมติ (วินาที)

# คำนวณ Capacity (C) คงที่ไว้ก่อน
Capacity = (S_base * num_lanes) * (g_time / C_cycle)

# --- ตั้งค่าจุดสำหรับเส้นเฉียง ---
line_points = []
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
    print(line_points)


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


cv2.namedWindow("Traffic Engineering Analysis")
cv2.setMouseCallback("Traffic Engineering Analysis", draw_line_event)

color_map = {
    "Bus": (0, 0, 255),
    "cars": (0, 255, 0),
    "motorcycle": (255, 0, 255),
    "tuktuk": (0, 165, 255),
    "truck": (255, 0, 0),
}

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        break
    frame = cv2.resize(frame, (640, 360))

    if len(line_points) == 2:
        cv2.line(frame, line_points[0], line_points[1], (255, 255, 255), 2)

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
                cumulative_counts[class_name] = cumulative_counts.get(class_name, 0) + 1
                tracked_ids.add(track_id)
                # บวกค่า PCU รวม
                total_pcu += pcu_map.get(class_name, 1.0)

            color = color_map.get(class_name, (255, 255, 255))
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

    # --- ส่วนการคำนวณและแสดงผล Engineering Metrics ---
    # คำนวณ Flow Rate (V) รายชั่วโมง
    elapsed_time = time.time() - start_time
    # ป้องกันการหารด้วยศูนย์และใช้เวลาจริงในการคำนวณ Flow
    current_flow = (total_pcu / (elapsed_time / 3600)) if elapsed_time > 0 else 0
    vc_ratio = current_flow / Capacity if Capacity > 0 else 0
    los_grade, los_color = get_los(vc_ratio)

    # วาดหน้าต่างแสดงผล (Dashboard)
    cv2.rectangle(frame, (20, 20), (350, 220), (0, 0, 0), -1)  # พื้นหลังดำ
    cv2.putText(
        frame,
        f"Analysis Results (PCU/hr)",
        (30, 50),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 255),
        2,
    )
    cv2.putText(
        frame,
        f"V (Flow): {current_flow:.0f}",
        (40, 90),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        1,
    )
    cv2.putText(
        frame,
        f"S (Sat Flow): {S_base * num_lanes}",
        (40, 120),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        1,
    )
    cv2.putText(
        frame,
        f"C (Capacity): {Capacity:.0f}",
        (40, 150),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        1,
    )

    # แสดง LOS ตัวใหญ่ๆ
    cv2.putText(
        frame, f"LOS: ", (40, 195), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2
    )
    cv2.putText(
        frame, f"{los_grade}", (130, 195), cv2.FONT_HERSHEY_SIMPLEX, 1.5, los_color, 4
    )
    cv2.putText(
        frame,
        f"v/c: {vc_ratio:.2f}",
        (200, 195),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        los_color,
        2,
    )

    # แสดงตารางนับรถแบบเดิม (มุมล่างขวา)
    rect_h = 50 + (len(cumulative_counts) * 35)
    cv2.rectangle(frame, (960, 720 - rect_h - 20), (1260, 700), (0, 0, 0), -1)
    curr_y = 720 - rect_h + 10
    for cls_name, count in cumulative_counts.items():
        cv2.putText(
            frame,
            f"{cls_name}: {count}",
            (980, curr_y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            color_map.get(cls_name, (255, 255, 255)),
            2,
        )
        curr_y += 35

    cv2.imshow("Traffic Engineering Analysis", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
