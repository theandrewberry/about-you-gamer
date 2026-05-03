"use client";

import { useRef, useState } from "react";

const CATEGORIES = [
  "Favorite Game of all Time",
  "Favorite Series",
  "Best Soundtrack",
  "Favorite Protagonist",
  "Favorite Villain",
  "Best Story",
  "Have not played but want to",
  "You Love Everyone Hates",
  "You Hate Everyone Loves",
  "Best Art Style",
  "Favorite Ending",
  "Favorite Boss Fight",
  "Childhood Game",
  "Relaxing Game",
  "Stressful Game",
  "Game you always come back to",
  "Guilty Pleasure",
  "Tons of Hours Played",
];

export default function Home() {
  const [images, setImages] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputs = useRef<(HTMLInputElement | null)[]>([]);
  const boardRef = useRef<HTMLDivElement | null>(null);

  const handleFileChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setImages(prev => ({ ...prev, [i]: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Manual canvas export for full compatibility
  const handleSave = async () => {
    setSaving(true);
    try {
      const COLS = 6;
      const ROWS = 3;
      const TILE_W = 300;
      const TILE_H = 400;
      const GAP = 16;
      const PAD = 30;
      const TITLE_H = 80;
      const LABEL_H = 50;

      const W = PAD * 2 + COLS * TILE_W + (COLS - 1) * GAP;
      const H = PAD * 2 + TITLE_H + ROWS * (TILE_H + LABEL_H) + (ROWS - 1) * GAP;

      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      // background
      ctx.fillStyle = "#0f0f17";
      ctx.fillRect(0, 0, W, H);

      // title
      ctx.fillStyle = "#f5f5f5";
      ctx.font = "bold 44px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("About You: Video Games", W / 2, PAD + TITLE_H / 2);

      // pre-load all images
      const loaded: (HTMLImageElement | null)[] = await Promise.all(
        CATEGORIES.map((_, i) => {
          const src = images[i];
          if (!src) return Promise.resolve(null);
          return new Promise<HTMLImageElement | null>(resolve => {
            const im = new window.Image();
            im.onload = () => resolve(im);
            im.onerror = () => resolve(null);
            im.src = src;
          });
        })
      );

      CATEGORIES.forEach((label, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x = PAD + col * (TILE_W + GAP);
        const y = PAD + TITLE_H + row * (TILE_H + LABEL_H + GAP);

        // tile bg
        ctx.fillStyle = "#1a1a26";
        ctx.fillRect(x, y, TILE_W, TILE_H);

        const img = loaded[i];
        if (img) {
          const scale = Math.max(TILE_W / img.width, TILE_H / img.height);
          const dw = img.width * scale;
          const dh = img.height * scale;
          const dx = x + (TILE_W - dw) / 2;
          const dy = y + (TILE_H - dh) / 2;
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, TILE_W, TILE_H);
          ctx.clip();
          ctx.drawImage(img, dx, dy, dw, dh);
          ctx.restore();
        } else {
          ctx.fillStyle = "#444";
          ctx.font = "60px sans-serif";
          ctx.fillText("+", x + TILE_W / 2, y + TILE_H / 2);
        }

        // label
        ctx.fillStyle = "#d8d8d8";
        ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
        wrapText(ctx, label, x + TILE_W / 2, y + TILE_H + 22, TILE_W, 22);
      });

      const dataUrl = canvas.toDataURL("image/png");
      setPreviewUrl(dataUrl);
      setTimeout(() => {
        document.getElementById("preview")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      alert("Save failed: " + (err instanceof Error ? err.message : String(err)));
    }
    setSaving(false);
  };

  const openInNewTab = () => {
    if (!previewUrl) return;
    const w = window.open();
    if (w) {
      w.document.write(
        `<html><head><title>Your Board</title><meta name="viewport" content="width=device-width, initial-scale=1"/></head><body style="margin:0;background:#0f0f17;"><img src="${previewUrl}" style="width:100%;display:block;"/></body></html>`
      );
    }
  };

  return (
    <>
      <style>{`
        body, html {
          background: #0a0a12;
          color: #eaeaea;
          font-family: system-ui, sans-serif;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 16px;
        }
        h1 {
          text-align: center;
          color: #f5d142;
          font-size: 2.1rem;
          margin-bottom: 18px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .board {
          background: #0f0f17;
          border-radius: 14px;
          padding: 18px 8px 24px 8px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.5);
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
        }
        @media (max-width: 900px) {
          .grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 560px) {
          .grid { grid-template-columns: repeat(2, 1fr); }
        }
        .item {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 6px;
          min-width: 0;
        }
        .cell {
          aspect-ratio: 3 / 4;
          width: 100%;
          background: #1a1a26;
          border: 1px solid #2a2a3a;
          border-radius: 10px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }
        .cell img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 10px;
        }
        .cell .plus-btn {
          background: none;
          border: none;
          color: #f5d142;
          font-size: 2.5rem;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 2;
          position: absolute;
          inset: 0;
          transition: background 0.15s;
        }
        .cell .plus-btn:active {
          background: rgba(245, 209, 66, 0.08);
        }
        .cell input[type="file"] {
          display: none;
        }
        .label {
          font-size: 13px;
          color: #d8d8d8;
          text-align: center;
          line-height: 1.25;
          font-weight: 600;
          word-break: break-word;
          min-height: 2.2em;
          background: rgba(0,0,0,0.18);
          border-radius: 6px;
          padding: 2px 2px 2px 2px;
        }
        .controls {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          max-width: 320px;
          margin: 24px auto 0;
        }
        .btn {
          background: #f5d142;
          color: #0f0f17;
          border: none;
          padding: 14px 28px;
          font-size: 16px;
          font-weight: bold;
          border-radius: 10px;
          cursor: pointer;
          width: 100%;
          -webkit-appearance: none; appearance: none;
          touch-action: manipulation;
        }
        .btn.secondary { background: #2a2a3a; color: #eaeaea; }
        .btn:disabled { opacity: 0.6; }
        .preview {
          margin-top: 20px;
          width: 100%;
          max-width: 1100px;
          text-align: center;
        }
        .preview img {
          width: 100%;
          border-radius: 10px;
          border: 1px solid #2a2a3a;
        }
        .preview p {
          color: #ddd; font-size: 14px;
          margin: 12px 0 0;
          background: #1a1a26;
          padding: 12px; border-radius: 8px;
        }
      `}</style>
      <div className="container">
        <h1>About You: Video Games</h1>
        <div className="board" ref={boardRef}>
          <div className="grid">
            {CATEGORIES.map((label, i) => (
              <div className="item" key={i}>
                <div className="cell">
                  {images[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={images[i]} alt={label} />
                  ) : (
                    <>
                      <button
                        className="plus-btn"
                        type="button"
                        aria-label={`Upload image for ${label}`}
                        onClick={() => fileInputs.current[i]?.click()}
                      >+</button>
                      <input
                        ref={el => { fileInputs.current[i] = el; }}
                        type="file"
                        accept="image/*"
                        onChange={e => handleFileChange(i, e)}
                        tabIndex={-1}
                      />
                    </>
                  )}
                </div>
                <span className="label">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="controls">
          <button className="btn" onClick={handleSave} disabled={saving} type="button">
            {saving ? "Building…" : "💾 Build Image"}
          </button>
          {previewUrl && (
            <button className="btn secondary" onClick={openInNewTab} type="button">
              🔗 Open in New Tab
            </button>
          )}
        </div>
        {previewUrl && (
          <div className="preview" id="preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Your board" />
            <p>
              📱 <b>iPhone:</b> long-press the image above → <b>Save to Photos</b>.
              <br />Or tap <b>Open in New Tab</b> first if long-press doesn&apos;t offer save.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

// Helper for canvas label wrapping
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.forEach((l, idx) => ctx.fillText(l, x, y + idx * lineHeight));
}
