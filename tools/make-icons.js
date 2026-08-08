// Генератор иконок расширения (Node.js, без зависимостей).
// Запуск: node tools/make-icons.js

'use strict';
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

/* ---------- PNG-энкодер ---------- */

let crcTable = null;
function crc32(buf) {
  if (!crcTable) {
    crcTable = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function encodePng(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const stride = 1 + size * 4;
  const raw = Buffer.alloc(size * stride);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: none
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

/* ---------- отрисовка: тёмный радар ---------- */

const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function draw(size) {
  const buf = Buffer.alloc(size * size * 4);
  const CX = 0.5, CY = 0.53, EDGE = 0.12;

  const BG_TOP = [24, 33, 47];
  const BG_BOTTOM = [8, 11, 17];
  const BORDER = [95, 150, 235];
  const RING = [115, 165, 255];
  const SWEEP_A = [34, 211, 238];
  const SWEEP_B = [167, 139, 250];
  const DOT = [225, 242, 255];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5) / size;
      const ny = (y + 0.5) / size;

      // маска скруглённого квадрата
      const rx = Math.max(Math.abs(nx - 0.5) - (0.5 - EDGE), 0);
      const ry = Math.max(Math.abs(ny - 0.5) - (0.5 - EDGE), 0);
      const rr = Math.hypot(rx, ry);
      if (rr > EDGE) continue;

      let col = mix(BG_TOP, BG_BOTTOM, ny);

      // граница
      const dEdge = EDGE - rr;
      if (dEdge < 0.05) {
        const w = Math.max(0, Math.min(1, dEdge / 0.05));
        col = mix(col, BORDER, w * 0.95);
      }

      const dist = Math.hypot(nx - CX, ny - CY);

      // кольца радара
      for (const r of [0.17, 0.3, 0.43]) {
        const d = Math.abs(dist - r);
        if (d < 0.018) {
          const w = 1 - Math.min(1, d / 0.018);
          col = mix(col, RING, w * 0.85);
        }
      }

      // развёртка (сектор сканирования)
      let ang = Math.atan2(ny - CY, nx - CX);
      const a0 = -Math.PI / 2.6;
      const a1 = Math.PI / 5;
      while (ang < a0) ang += Math.PI * 2;
      if (dist > 0.08 && dist < 0.5 && ang >= a0 && ang <= a1) {
        const t = (ang - a0) / (a1 - a0);
        const w = Math.max(0, 1 - dist / 0.5) * 0.75;
        col = mix(col, mix(SWEEP_A, SWEEP_B, t), w);
      }

      // перекрестие
      if (dist > 0.14 && (Math.abs(nx - CX) < 0.011 || Math.abs(ny - CY) < 0.011)) {
        col = mix(col, [255, 255, 255], 0.28);
      }

      // центральная точка
      if (dist < 0.055) col = mix(col, DOT, 0.95);

      const i = (y * size + x) * 4;
      buf[i] = Math.round(col[0]);
      buf[i + 1] = Math.round(col[1]);
      buf[i + 2] = Math.round(col[2]);
      buf[i + 3] = 255;
    }
  }
  return buf;
}

/* ---------- запись файлов ---------- */

const outDir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(outDir, { recursive: true });
for (const s of [16, 32, 48, 128]) {
  const file = path.join(outDir, `icon${s}.png`);
  fs.writeFileSync(file, encodePng(s, draw(s)));
  console.log('OK', file);
}
console.log('Иконки сгенерированы.');
