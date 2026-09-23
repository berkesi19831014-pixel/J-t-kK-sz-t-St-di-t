import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Paintbrush, 
  Eraser, 
  PaintBucket, 
  Trash2, 
  RotateCcw, 
  Sparkles, 
  Check, 
  User, 
  Smile
} from 'lucide-react';

const PALETTE = [
  'transparent',
  '#000000',
  '#1e293b',
  '#64748b',
  '#f8fafc',
  '#ef4444',
  '#f97316',
  '#facc15',
  '#84cc16',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#78350f',
];

interface PixelEditorProps {
  customSprite: string[] | null;
  onSaveSprite: (pixels: string[]) => void;
  onResetDefault: () => void;
}

export const PixelEditor: React.FC<PixelEditorProps> = ({
  customSprite,
  onSaveSprite,
  onResetDefault,
}) => {
  const [pixels, setPixels] = useState<string[]>(() => {
    if (customSprite && customSprite.length === 256) {
      return [...customSprite];
    }
    return createDefaultHeroPixels();
  });

  const [currentColor, setCurrentColor] = useState<string>('#3b82f6');
  const [tool, setTool] = useState<'brush' | 'eraser' | 'fill'>('brush');
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [history, setHistory] = useState<string[][]>([]);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Push history state before changes
  const pushHistory = (current: string[]) => {
    setHistory((prev) => [...prev.slice(-15), current]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setPixels(prev);
  };

  const setPixelAt = (x: number, y: number, color: string) => {
    if (x < 0 || x >= 16 || y < 0 || y >= 16) return;
    const index = y * 16 + x;
    setPixels((prev) => {
      if (prev[index] === color) return prev;
      const next = [...prev];
      next[index] = color;
      return next;
    });
  };

  const floodFill = (startX: number, startY: number, targetColor: string, replacementColor: string) => {
    if (targetColor === replacementColor) return;
    const next = [...pixels];
    const queue: [number, number][] = [[startX, startY]];
    const visited = new Uint8Array(256);

    while (queue.length > 0) {
      const [cx, cy] = queue.pop()!;
      const idx = cy * 16 + cx;
      if (cx < 0 || cx >= 16 || cy < 0 || cy >= 16) continue;
      if (visited[idx]) continue;
      visited[idx] = 1;

      if (next[idx] === targetColor) {
        next[idx] = replacementColor;
        queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
      }
    }
    pushHistory(pixels);
    setPixels(next);
  };

  const handlePixelInteraction = (x: number, y: number) => {
    const activeColor = tool === 'eraser' ? 'transparent' : currentColor;
    if (tool === 'fill') {
      const targetColor = pixels[y * 16 + x];
      floodFill(x, y, targetColor, activeColor);
    } else {
      setPixelAt(x, y, activeColor);
    }
  };

  const handleMouseDown = (x: number, y: number) => {
    pushHistory(pixels);
    setIsMouseDown(true);
    handlePixelInteraction(x, y);
  };

  const handleMouseEnter = (x: number, y: number) => {
    if (isMouseDown && tool !== 'fill') {
      handlePixelInteraction(x, y);
    }
  };

  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  // Update preview canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = canvas.width / 16;

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const color = pixels[y * 16 + x];
        if (color && color !== 'transparent') {
          ctx.fillStyle = color;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
  }, [pixels]);

  const loadPreset = (presetName: 'knight' | 'alien' | 'cat' | 'hero') => {
    pushHistory(pixels);
    if (presetName === 'knight') {
      setPixels(createKnightPixels());
    } else if (presetName === 'alien') {
      setPixels(createAlienPixels());
    } else if (presetName === 'cat') {
      setPixels(createCatPixels());
    } else {
      setPixels(createDefaultHeroPixels());
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <Smile className="w-4 h-4 text-pink-400" />
            16x16 Pixel Karakter Rajzoló (Sprite Editor)
          </h3>
          <p className="text-xs text-neutral-400">
            Rajzold meg saját egyedi hősödet pixelről pixelre! Azonnal megjelenik a játékban.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSaveSprite(pixels)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Alkalmazás a játékban</span>
          </button>
          <button
            onClick={() => {
              onResetDefault();
              setPixels(createDefaultHeroPixels());
            }}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition cursor-pointer"
          >
            Alapértelmezett
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
        {/* Drawing Grid */}
        <div className="flex flex-col items-center gap-3">
          <div 
            className="grid grid-cols-16 border-2 border-neutral-700 rounded-lg p-1 bg-neutral-950 shadow-2xl select-none"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(16, minmax(0, 1fr))',
              width: 'min(90vw, 320px)',
              height: 'min(90vw, 320px)',
            }}
          >
            {pixels.map((color, idx) => {
              const x = idx % 16;
              const y = Math.floor(idx / 16);
              const isTrans = color === 'transparent';
              return (
                <div
                  key={idx}
                  onMouseDown={() => handleMouseDown(x, y)}
                  onMouseEnter={() => handleMouseEnter(x, y)}
                  className="cursor-crosshair border border-neutral-800/40 transition-colors relative"
                  style={{
                    backgroundColor: isTrans ? '#171717' : color,
                    backgroundImage: isTrans
                      ? 'radial-gradient(circle, #262626 15%, transparent 20%)'
                      : 'none',
                    backgroundSize: '8px 8px',
                  }}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span>Kattints és húzd a kurzort a rajzoláshoz</span>
          </div>
        </div>

        {/* Tools, Colors and Presets */}
        <div className="flex-1 w-full max-w-sm space-y-5">
          {/* Tool Row */}
          <div>
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
              Rajzeszközök
            </span>
            <div className="flex items-center gap-1.5 p-1 bg-neutral-950 border border-neutral-800 rounded-lg">
              <button
                onClick={() => setTool('brush')}
                className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  tool === 'brush' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Paintbrush className="w-3.5 h-3.5" />
                <span>Ecset</span>
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  tool === 'eraser' ? 'bg-rose-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Radír</span>
              </button>
              <button
                onClick={() => setTool('fill')}
                className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  tool === 'fill' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <PaintBucket className="w-3.5 h-3.5" />
                <span>Kitöltés</span>
              </button>
              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className="p-2 rounded-md text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Visszavonás"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  pushHistory(pixels);
                  setPixels(new Array(256).fill('transparent'));
                }}
                className="p-2 rounded-md text-rose-400 hover:text-rose-300 cursor-pointer"
                title="Vászon törlése"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
              Színpaletta
            </span>
            <div className="grid grid-cols-8 gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCurrentColor(c);
                    if (tool === 'eraser') setTool('brush');
                  }}
                  className={`w-7 h-7 rounded-md border transition cursor-pointer relative ${
                    currentColor === c && tool !== 'eraser'
                      ? 'border-white ring-2 ring-indigo-500 scale-110 z-10'
                      : 'border-black/50 hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: c === 'transparent' ? '#171717' : c,
                  }}
                >
                  {c === 'transparent' && (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-neutral-500">
                      ✕
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Character Presets */}
          <div>
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
              Kész hős sablonok
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'hero', name: 'Robot Hős', icon: Sparkles },
                { id: 'knight', name: 'Lovag', icon: User },
                { id: 'alien', name: 'Űrlény', icon: Smile },
                { id: 'cat', name: 'Pixel Cica', icon: Sparkles },
              ].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => loadPreset(preset.id as 'knight' | 'alien' | 'cat' | 'hero')}
                  className="flex items-center gap-2 p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white text-xs transition cursor-pointer"
                >
                  <preset.icon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Display */}
          <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <canvas
                ref={previewCanvasRef}
                width={64}
                height={64}
                className="w-12 h-12 rounded bg-neutral-900 border border-neutral-800 image-pixelated"
                style={{ imageRendering: 'pixelated' }}
              />
              <div>
                <span className="text-xs font-semibold text-neutral-200 block">Játékbeli előnézet</span>
                <span className="text-[11px] text-neutral-400">16×16 felbontás</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Preset Generators (256 length arrays)
function createDefaultHeroPixels(): string[] {
  const arr = new Array(256).fill('transparent');
  // Visor & Head
  for (let x = 6; x <= 9; x++) arr[2 * 16 + x] = '#eab308'; // antenna
  for (let y = 3; y <= 7; y++) {
    for (let x = 4; x <= 11; x++) {
      arr[y * 16 + x] = '#f8fafc';
    }
  }
  // Visor
  for (let x = 5; x <= 10; x++) arr[5 * 16 + x] = '#0f172a';
  arr[5 * 16 + 8] = '#38bdf8';
  arr[5 * 16 + 9] = '#38bdf8';

  // Body
  for (let y = 8; y <= 12; y++) {
    for (let x = 4; x <= 11; x++) {
      arr[y * 16 + x] = '#3b82f6';
    }
  }
  // Chest light
  arr[9 * 16 + 7] = '#06b6d4';
  arr[9 * 16 + 8] = '#06b6d4';

  // Legs
  for (let y = 13; y <= 15; y++) {
    arr[y * 16 + 5] = '#1e3a8a';
    arr[y * 16 + 6] = '#1e3a8a';
    arr[y * 16 + 9] = '#1e3a8a';
    arr[y * 16 + 10] = '#1e3a8a';
  }
  return arr;
}

function createKnightPixels(): string[] {
  const arr = new Array(256).fill('transparent');
  // Helmet
  for (let y = 2; y <= 6; y++) {
    for (let x = 4; x <= 11; x++) {
      arr[y * 16 + x] = '#64748b';
    }
  }
  // Helmet slit
  for (let x = 5; x <= 10; x++) arr[4 * 16 + x] = '#0f172a';
  // Red feather crest
  for (let y = 0; y <= 2; y++) arr[y * 16 + 7] = '#ef4444';

  // Armor body
  for (let y = 7; y <= 11; y++) {
    for (let x = 4; x <= 11; x++) {
      arr[y * 16 + x] = '#94a3b8';
    }
  }
  // Gold belt
  for (let x = 4; x <= 11; x++) arr[11 * 16 + x] = '#facc15';

  // Sword
  for (let y = 6; y <= 12; y++) arr[y * 16 + 13] = '#f8fafc';
  arr[9 * 16 + 12] = '#facc15';
  arr[9 * 16 + 14] = '#facc15';

  // Boots
  for (let y = 12; y <= 15; y++) {
    arr[y * 16 + 5] = '#475569';
    arr[y * 16 + 6] = '#475569';
    arr[y * 16 + 9] = '#475569';
    arr[y * 16 + 10] = '#475569';
  }
  return arr;
}

function createAlienPixels(): string[] {
  const arr = new Array(256).fill('transparent');
  // Green alien head
  for (let y = 2; y <= 7; y++) {
    for (let x = 4; x <= 11; x++) {
      arr[y * 16 + x] = '#84cc16';
    }
  }
  // Huge black alien eyes
  arr[4 * 16 + 5] = '#000000';
  arr[5 * 16 + 5] = '#000000';
  arr[4 * 16 + 6] = '#000000';
  arr[4 * 16 + 9] = '#000000';
  arr[5 * 16 + 10] = '#000000';
  arr[4 * 16 + 10] = '#000000';

  // Purple suit
  for (let y = 8; y <= 12; y++) {
    for (let x = 4; x <= 11; x++) {
      arr[y * 16 + x] = '#a855f7';
    }
  }
  // Feet
  for (let y = 13; y <= 15; y++) {
    arr[y * 16 + 5] = '#84cc16';
    arr[y * 16 + 6] = '#84cc16';
    arr[y * 16 + 9] = '#84cc16';
    arr[y * 16 + 10] = '#84cc16';
  }
  return arr;
}

function createCatPixels(): string[] {
  const arr = new Array(256).fill('transparent');
  // Ears
  arr[2 * 16 + 4] = '#f97316';
  arr[2 * 16 + 11] = '#f97316';
  arr[3 * 16 + 4] = '#f97316';
  arr[3 * 16 + 5] = '#f97316';
  arr[3 * 16 + 10] = '#f97316';
  arr[3 * 16 + 11] = '#f97316';

  // Face
  for (let y = 4; y <= 8; y++) {
    for (let x = 4; x <= 11; x++) {
      arr[y * 16 + x] = '#f97316';
    }
  }
  // Green eyes
  arr[5 * 16 + 6] = '#10b981';
  arr[5 * 16 + 9] = '#10b981';
  // Pink nose
  arr[6 * 16 + 7] = '#ec4899';
  arr[6 * 16 + 8] = '#ec4899';

  // Body
  for (let y = 9; y <= 13; y++) {
    for (let x = 4; x <= 11; x++) {
      arr[y * 16 + x] = '#ea580c';
    }
  }
  // White belly
  for (let y = 9; y <= 12; y++) {
    arr[y * 16 + 7] = '#f8fafc';
    arr[y * 16 + 8] = '#f8fafc';
  }

  // Paws
  for (let y = 14; y <= 15; y++) {
    arr[y * 16 + 5] = '#f8fafc';
    arr[y * 16 + 6] = '#f8fafc';
    arr[y * 16 + 9] = '#f8fafc';
    arr[y * 16 + 10] = '#f8fafc';
  }
  return arr;
}
