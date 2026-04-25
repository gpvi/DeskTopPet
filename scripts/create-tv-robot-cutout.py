from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


SOURCE = Path("img/电视机器人.jpg")
OUTPUT = Path("src/ui/desktop-pet/assets/tv-robot-cutout.png")


def color_distance(left: tuple[int, int, int, int], right: tuple[int, int, int]) -> float:
    return sum((left[index] - right[index]) ** 2 for index in range(3)) ** 0.5


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    image = Image.open(SOURCE).convert("RGBA")
    width, height = image.size
    pixels = image.load()
    corners = [pixels[0, 0], pixels[width - 1, 0], pixels[0, height - 1], pixels[width - 1, height - 1]]
    background = tuple(sum(pixel[index] for pixel in corners) // len(corners) for index in range(3))

    background_mask = Image.new("L", (width, height), 0)
    mask_pixels = background_mask.load()
    queue: deque[tuple[int, int]] = deque()
    visited: set[tuple[int, int]] = set()

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited or x < 0 or y < 0 or x >= width or y >= height:
            continue
        visited.add((x, y))

        if color_distance(pixels[x, y], background) > 42:
            continue

        mask_pixels[x, y] = 255
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    soft_mask = background_mask.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.9))
    alpha = Image.new("L", (width, height), 255)
    alpha_pixels = alpha.load()
    soft_pixels = soft_mask.load()

    for y in range(height):
        for x in range(width):
            alpha_pixels[x, y] = max(0, 255 - soft_pixels[x, y])

    image.putalpha(alpha)
    bbox = alpha.getbbox()
    if bbox:
        left, top, right, bottom = bbox
        padding = 10
        image = image.crop(
            (
                max(0, left - padding),
                max(0, top - padding),
                min(width, right + padding),
                min(height, bottom + padding),
            )
        )

    image.save(OUTPUT)


if __name__ == "__main__":
    main()
