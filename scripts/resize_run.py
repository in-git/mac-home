from PIL import Image
import os

target = Image.open(r"E:\git\mac-home\src\assets\klrx\face\b1.webp").size
print("target", target, flush=True)
d = r"E:\git\mac-home\src\assets\klrx\celebration"
for f in os.listdir(d):
    if f.lower().endswith((".webp", ".png", ".jpg", ".jpeg")):
        p = os.path.join(d, f)
        im = Image.open(p).convert("RGBA").resize(target, Image.LANCZOS)
        im.save(p, "WEBP")
        print(f, Image.open(p).size, flush=True)
print("done", flush=True)
