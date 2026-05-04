from ultralytics import YOLO

# You MUST put this 'if' statement here when training on Windows!
if __name__ == "__main__":

    # Load a fresh, uncorrupted base model (using YOLO11 medium)
    model = YOLO("yolo11m.pt")

    # Start training from scratch
    results = model.train(
        data="./1080p.v9i.yolov11/data.yaml",  # Make sure this path is correct
        epochs=100,
        imgsz=1088,  # CRITICAL: If you leave this out, it trains at 640 and destroys small objects!
        batch=4,
        device=0,
        patience=15,
        # Augmentations customized for SMALL objects and TOP-DOWN view
        degrees=15.0,  # Increase slightly for varied drone/camera angles
        scale=0.2,  # REDUCED from 0.5. 0.5 shrinks already tiny bikes too much. 0.2 is safer.
        fliplr=0.5,
        flipud=0.0,  # Top-down views can sometimes benefit from vertical flips, but you can leave 0
        mosaic=1.0,
        mixup=0.1,
        # Advanced optimizations for better bounding box fitting
        box=7.5,  # (Default is 7.5) Increase box loss gain to force the model to care more about tight boxes
        cls=0.5,  # (Default is 0.5) Class loss gain - keeps it balanced
    )
