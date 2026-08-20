"""
把 celebration 目录下的方形图片，等比缩放（保持原始比例，不变形）到
face/b1.webp 的尺寸 (424, 640)，居中放置，四周用透明留边补齐。

用法: python scripts/resize_celebration.py
"""
from PIL import Image
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # mac-home
SRC_DIR = os.path.join(BASE, "src", "assets", "klrx", "celebration")
TARGET_PATH = os.path.join(BASE, "src", "assets", "klrx", "face", "b1.webp")


def resize_keep_ratio(src_dir: str, target_path: str) -> None:
    target_w, target_h = Image.open(target_path).size  # (424, 640)
    for name in sorted(os.listdir(src_dir)):
        if not name.lower().endswith((".webp", ".png", ".jpg", ".jpeg")):
            continue
        src = os.path.join(src_dir, name)
        im = Image.open(src).convert("RGBA")

        # contain: 等比缩放到能放进目标框的最大尺寸
        scale = min(target_w / im.width, target_h / im.height)
        new_w, new_h = int(round(im.width * scale)), int(round(im.height * scale))
        im = im.resize((new_w, new_h), Image.LANCZOS)

        # 透明画布，居中贴图
        canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
        canvas.paste(im, ((target_w - new_w) // 2, (target_h - new_h) // 2))

        canvas.save(src, "WEBP")
        print(f"{name}: {im.size} -> {canvas.size} (contain, no distortion)")


if __name__ == "__main__":
    resize_keep_ratio(SRC_DIR, TARGET_PATH)
    print("done")
