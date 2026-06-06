import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const publicDir = join(root, 'public');

const colors = {
  green: [21, 128, 61, 255],
  lightGreen: [187, 247, 208, 255],
  white: [248, 250, 252, 255],
  darkGreen: [22, 101, 52, 255]
};

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  return c >>> 0;
});

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
};

const fill = (pixels, size, x, y, rgba) => {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const offset = (y * size + x) * 4;
  pixels[offset] = rgba[0];
  pixels[offset + 1] = rgba[1];
  pixels[offset + 2] = rgba[2];
  pixels[offset + 3] = rgba[3];
};

const fillCircle = (pixels, size, cx, cy, radius, rgba) => {
  const r2 = radius * radius;
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) {
        fill(pixels, size, x, y, rgba);
      }
    }
  }
};

const fillRoundedRect = (pixels, size, left, top, width, height, radius, rgba) => {
  const right = left + width;
  const bottom = top + height;
  for (let y = Math.floor(top); y < Math.ceil(bottom); y += 1) {
    for (let x = Math.floor(left); x < Math.ceil(right); x += 1) {
      const nearLeft = x < left + radius;
      const nearRight = x >= right - radius;
      const nearTop = y < top + radius;
      const nearBottom = y >= bottom - radius;

      if ((nearLeft || nearRight) && (nearTop || nearBottom)) {
        const cx = nearLeft ? left + radius : right - radius - 1;
        const cy = nearTop ? top + radius : bottom - radius - 1;
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy > radius * radius) continue;
      }

      fill(pixels, size, x, y, rgba);
    }
  }
};

const drawIcon = (size) => {
  const pixels = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      fill(pixels, size, x, y, colors.green);
    }
  }

  fillCircle(pixels, size, size * 0.77, size * 0.2, size * 0.25, colors.lightGreen);
  fillCircle(pixels, size, size * 0.18, size * 0.82, size * 0.22, colors.darkGreen);

  const bagLeft = size * 0.24;
  const bagTop = size * 0.34;
  const bagWidth = size * 0.52;
  const bagHeight = size * 0.44;
  fillRoundedRect(pixels, size, bagLeft, bagTop, bagWidth, bagHeight, size * 0.06, colors.white);

  const handleY = size * 0.37;
  const handleRadius = size * 0.18;
  const handleWidth = size * 0.045;
  for (let i = 0; i <= 120; i += 1) {
    const t = Math.PI * (i / 120);
    const x = size * 0.5 + Math.cos(t) * handleRadius;
    const y = handleY + Math.sin(t) * handleRadius * 0.75;
    fillCircle(pixels, size, x, y, handleWidth, colors.green);
  }

  fillRoundedRect(pixels, size, size * 0.36, size * 0.56, size * 0.28, size * 0.065, size * 0.025, colors.green);
  fillRoundedRect(pixels, size, size * 0.36, size * 0.66, size * 0.2, size * 0.055, size * 0.02, colors.green);

  return pixels;
};

const encodePng = (size, pixels) => {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
};

for (const size of [192, 512]) {
  const png = encodePng(size, drawIcon(size));
  writeFileSync(join(publicDir, `icon-${size}.png`), png);
}

writeFileSync(join(publicDir, 'icon-maskable-512.png'), encodePng(512, drawIcon(512)));
console.log('PWA icons generated.');
