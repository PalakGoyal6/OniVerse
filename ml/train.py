"""Training script for YOLO segmentation on onion quality defect dataset."""

import argparse
from pathlib import Path


def train_yolo_seg(
    data_yaml: str = "ml/data/dataset.yaml",
    model_size: str = "yolov8n-seg.pt",
    epochs: int = 100,
    imgsz: int = 640,
    batch_size: int = 16,
    project: str = "runs/train",
    name: str = "onion_yolo_seg_v1",
):
    try:
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] ultralytics package not installed. Run: pip install ultralytics")
        return

    print(f"Starting training on {data_yaml} with {model_size} for {epochs} epochs at imgsz {imgsz}...")
    model = YOLO(model_size)

    # Note: Augmentations enforce no BGR channel flip to preserve rot/black-mould discoloration
    results = model.train(
        data=data_yaml,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch_size,
        project=project,
        name=name,
        hsv_h=0.015,     # subtle hue jitter
        hsv_s=0.7,       # saturation adjustment
        hsv_v=0.4,       # brightness adjustment
        degrees=180.0,   # full rotation invariance
        translate=0.1,
        scale=0.5,
        shear=0.0,
        perspective=0.0005,
        flipud=0.5,
        fliplr=0.5,
        mosaic=1.0,
        mixup=0.1,
        save=True,
        plots=True,
    )
    print("Training complete! Output artifacts saved in:", Path(project) / name)
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=str, default="ml/data/dataset.yaml")
    parser.add_argument("--model", type=str, default="yolov8n-seg.pt")
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--batch", type=int, default=16)
    args = parser.parse_args()

    train_yolo_seg(
        data_yaml=args.data,
        model_size=args.model,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch_size=args.batch,
    )
