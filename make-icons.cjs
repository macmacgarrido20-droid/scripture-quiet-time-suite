/**
 * make-icons.js
 * Generates minimal valid PNG placeholder icons at 16, 48, and 128px.
 * Solid green (#4a7c59) squares — no external dependencies required.
 * Run once: node make-icons.js
 */
const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let v = n;
    for (let k = 0; k < 8; k++) v = (v & 1) ? (0xEDB88320 ^ (v >>> 1)) : (v >>> 1);
    table[n] = v;
  }
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const combined = Buffer.concat([typeBuf, data]);
  const crcVal   = crc32(combined);
  const lenBuf   = Buffer.alloc(4); lenBuf.writeUInt32BE(data.length);
  const crcBuf   = Buffer.alloc(4); crcBuf.writeUInt32BE(crcVal);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function makePng(size) {
  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8]  = 8; // bit depth
  ihdr[9]  = 2; // color type: RGB truecolor
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Raw scanlines: filter byte (0) + RGB per pixel
  const raw = Buffer.alloc(size * (1 + size * 3), 0);
  for (let y = 0; y < size; y++) {
    const off = y * (1 + size * 3);
    raw[off] = 0; // no filter
    for (let x = 0; x < size; x++) {
      raw[off + 1 + x * 3 + 0] = 0x4a; // R
      raw[off + 1 + x * 3 + 1] = 0x7c; // G
      raw[off + 1 + x * 3 + 2] = 0x59; // B
    }
  }

  const idat = zlib.deflateSync(raw);
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', iend),
  ]);
}

const iconsDir = path.join(__dirname, 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

for (const size of [16, 48, 128, 192, 512]) {
  const outPath = path.join(iconsDir, 'icon' + size + '.png');
  fs.writeFileSync(outPath, makePng(size));
  console.log('Created', outPath);
}

console.log('Done.');
