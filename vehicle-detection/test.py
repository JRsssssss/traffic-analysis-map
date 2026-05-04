import cv2
from ultralytics import YOLO

# 1. โหลดโมเดล
# model = YOLO("api/model/best.pt")
model = YOLO("runs/detect/train-8/weights/best.pt")

# 2. เปิดไฟล์วิดีโอ
cap = cv2.VideoCapture("api/data/video.mp4")

print("Starting video... Press 'q' on your keyboard to close the window.")

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        print("Video finished playing.")
        break

    # --- ROI CROP (Optional but recommended based on our previous chat) ---
    # To crop out the Lotus roof (top 30% of the image), uncomment the lines below:
    # height, width, _ = frame.shape
    # frame = frame[int(height * 0.3):, :]

    # Resize the frame so it fits nicely on your monitor for debugging
    frame = cv2.resize(frame, (1280, 720))

    # 3. Run YOLO detection/tracking on the frame
    # results = model.track(frame, persist=True, conf=0.5, verbose=False)
    # Using imgsz=1088 (closest multiple of 32 to 1080p) to match training resolution without distortion
    results = model.track(
        frame,
        persist=True,
        tracker="bytetrack.yaml",
        conf=0.3,
        iou=0.45,
        imgsz=1088,
        verbose=False,
    )

    # 4. Draw the bounding boxes automatically!
    # The .plot() function takes the results and draws the boxes and labels directly onto the frame.
    annotated_frame = results[0].plot(line_width=2, font_size=3)

    # 5. Display the result in a window
    cv2.imshow("YOLO Bounding Box Test", annotated_frame)

    # Exit the loop if the 'q' key is pressed
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# Clean up
cap.release()
cv2.destroyAllWindows()
