"""TFLite model export script for mobile on-device inference."""

import argparse
from pathlib import Path


def export_to_tflite(
    weights_path: str = "best.pt",
    imgsz: int = 640,
    int8: bool = False,
    onnx_also: bool = True,
):
    try:
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] ultralytics package not installed. Run: pip install ultralytics")
        return

    print(f"Loading weights from {weights_path}...")
    model = YOLO(weights_path)

    print(f"Exporting to TFLite/LiteRT (imgsz={imgsz}, INT8={int8})...")
    try:
        export_path = model.export(
            format="tflite",
            imgsz=imgsz,
            int8=int8,
        )
        print(f"TFLite export successful: {export_path}")
    except Exception as e:
        print(f"[Note] Direct TFLite export reported: {e}. Attempting ONNX export...")
        export_path = model.export(format="onnx", imgsz=imgsz)
        print(f"ONNX export successful: {export_path}")

    return export_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--weights", type=str, default="best.pt")
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--int8", action="store_true", help="Enable INT8 quantization")
    args = parser.parse_args()

    export_to_tflite(
        weights_path=args.weights,
        imgsz=args.imgsz,
        int8=args.int8,
    )
