import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Layers, 
  Smile, 
  Download, 
  Upload, 
  Plus, 
  Save, 
  Gamepad2, 
  Heart, 
  Coins, 
  Trophy, 
  Clock, 
  ChevronRight, 
  Flame, 
  Sliders, 
  Eye, 
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { LevelData, TileType, GameSettings, TILE_DEFINITIONS } from './game/types';
import { PRESET_LEVELS, createLevel1 } from './game/levels';
import { GameEngine, EngineStats } from './game/engine';
import { TilePalette, ToolType } from './components/TilePalette';
import { PhysicsPanel } from './components/PhysicsPanel';
import { PixelEditor } from './components/PixelEditor';

export default function App() {
  // Current mode
  const [mode, setMode] = useState<'edit' | 'play'>('edit');
  const [activeTab, setActiveTab] = useState<'tiles' | 'physics' | 'sprite' | 'levels'>('tiles');

  // Level State
  const [currentLevel, setCurrentLevel] = useState<LevelData>(() => {
    const saved = localStorage.getItem('pixelcraft_custom_level');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return createLevel1();
  });

  // Undo/Redo History for Tilemap
  const [tileHistory, setTileHistory] = useState<TileType[][][]>([]);
  const [redoStack, setRedoStack] = useState<TileType[][][]>([]);

  // Editor Tools
  const [selectedTile, setSelectedTile] = useState<TileType>('solid_ground');
  const [currentTool, setCurrentTool] = useState<ToolType>('brush');
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [hoverTile, setHoverTile] = useState<{ x: number; y: number } | null>(null);
  const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(null);

  // Custom Sprite
  const [customPlayerSprite, setCustomPlayerSprite] = useState<string[] | null>(() => {
    const saved = localStorage.getItem('pixelcraft_player_sprite');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  // Game Engine & Stats
  const gameCanvasRef = useRef<HTMLCanvasElement>(null);
  const editorCanvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameStats, setGameStats] = useState<EngineStats>({
    score: 0,
    coins: 0,
    lives: currentLevel.settings.maxLives,
    maxLives: currentLevel.settings.maxLives,
    status: 'playing',
    timeElapsed: 0,
    hasJumpPowerup: false,
    hasSpeedPowerup: false,
  });

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Push level grid to undo history
  const pushGridHistory = () => {
    const copy = currentLevel.tiles.map((row) => [...row]);
    setTileHistory((prev) => [...prev.slice(-20), copy]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (tileHistory.length === 0) return;
    const previous = tileHistory[tileHistory.length - 1];
    setRedoStack((prev) => [...prev, currentLevel.tiles.map((r) => [...r])]);
    setTileHistory((prev) => prev.slice(0, -1));
    setCurrentLevel((lvl) => ({
      ...lvl,
      tiles: previous,
    }));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setTileHistory((prev) => [...prev, currentLevel.tiles.map((r) => [...r])]);
    setRedoStack((prev) => prev.slice(0, -1));
    setCurrentLevel((lvl) => ({
      ...lvl,
      tiles: next,
    }));
  };

  // Switch to Play Mode
  const startPlaying = () => {
    // Check if player spawn exists
    let hasSpawn = false;
    for (let y = 0; y < currentLevel.height; y++) {
      for (let x = 0; x < currentLevel.width; x++) {
        if (currentLevel.tiles[y][x] === 'player_spawn') {
          hasSpawn = true;
          break;
        }
      }
      if (hasSpawn) break;
    }

    if (!hasSpawn) {
      // Auto place spawn at tile (1, 12) if empty
      const nextTiles = currentLevel.tiles.map((r) => [...r]);
      nextTiles[Math.min(12, currentLevel.height - 2)][1] = 'player_spawn';
      setCurrentLevel((prev) => ({ ...prev, tiles: nextTiles }));
      showNotification('Játékos kezdőpont elhelyezve a pályán!');
    }

    setMode('play');
  };

  // Switch to Edit Mode
  const stopPlaying = () => {
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current.unbindEvents();
      engineRef.current = null;
    }
    setMode('edit');
  };

  // Initialize engine when switching to play
  useEffect(() => {
    if (mode === 'play' && gameCanvasRef.current) {
      const canvas = gameCanvasRef.current;
      const engine = new GameEngine(canvas, currentLevel, customPlayerSprite);
      engine.onStatsChange = (newStats) => {
        setGameStats({ ...newStats });
      };
      engineRef.current = engine;
      engine.start();

      return () => {
        engine.stop();
        engine.unbindEvents();
      };
    }
  }, [mode, currentLevel, customPlayerSprite]);

  // Redraw Editor Canvas
  const drawEditor = useCallback(() => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ts = currentLevel.tileSize;
    const w = currentLevel.width * ts;
    const h = currentLevel.height * ts;

    canvas.width = w;
    canvas.height = h;

    // Background gradient based on theme
    const theme = currentLevel.settings.theme;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (theme === 'forest') {
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.7, '#1e293b');
      grad.addColorStop(1, '#064e3b');
    } else if (theme === 'cyber') {
      grad.addColorStop(0, '#0f051d');
      grad.addColorStop(0.6, '#2e1065');
      grad.addColorStop(1, '#1e1b4b');
    } else if (theme === 'dungeon') {
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(0.6, '#292524');
      grad.addColorStop(1, '#451a03');
    } else {
      grad.addColorStop(0, '#311042');
      grad.addColorStop(0.6, '#701a75');
      grad.addColorStop(1, '#9a3412');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= currentLevel.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * ts, 0);
      ctx.lineTo(x * ts, h);
      ctx.stroke();
    }
    for (let y = 0; y <= currentLevel.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * ts);
      ctx.lineTo(w, y * ts);
      ctx.stroke();
    }

    // Draw tiles
    for (let y = 0; y < currentLevel.height; y++) {
      for (let x = 0; x < currentLevel.width; x++) {
        const tile = currentLevel.tiles[y][x];
        const px = x * ts;
        const py = y * ts;

        if (tile === 'empty') continue;

        if (tile === 'solid_ground') {
          ctx.fillStyle = '#78350f';
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = '#10b981';
          ctx.fillRect(px, py, ts, 6);
          ctx.fillStyle = '#059669';
          for (let i = 0; i < ts; i += 6) ctx.fillRect(px + i, py + 6, 4, 3);
        } else if (tile === 'solid_brick') {
          ctx.fillStyle = '#334155';
          ctx.fillRect(px, py, ts, ts);
          ctx.strokeStyle = '#1e293b';
          ctx.strokeRect(px, py, ts, ts);
          ctx.fillStyle = '#475569';
          ctx.fillRect(px + 2, py + 2, ts - 4, 3);
        } else if (tile === 'solid_wood') {
          ctx.fillStyle = '#b45309';
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(px, py + ts / 2, ts, 1);
        } else if (tile === 'hazard_spikes') {
          ctx.fillStyle = '#ef4444';
          const sw = ts / 3;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(px + i * sw, py + ts);
            ctx.lineTo(px + (i + 0.5) * sw, py + 4);
            ctx.lineTo(px + (i + 1) * sw, py + ts);
            ctx.fill();
          }
        } else if (tile === 'hazard_lava') {
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(px, py, ts, 4);
        } else if (tile === 'coin') {
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(px + ts / 2, py + ts / 2, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(px + ts / 2, py + ts / 2, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === 'gem') {
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.moveTo(px + ts / 2, py + 6);
          ctx.lineTo(px + ts - 6, py + ts / 2);
          ctx.lineTo(px + ts / 2, py + ts - 6);
          ctx.lineTo(px + 6, py + ts / 2);
          ctx.fill();
        } else if (tile === 'star') {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(px + ts / 2, py + ts / 2, 8, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === 'powerup_jump') {
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(px + 6, py + 8, ts - 12, ts - 16);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px + 8, py + 10, 4, 4);
        } else if (tile === 'powerup_speed') {
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(px + 6, py + 6, ts - 12, ts - 12);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(px + 10, py + 10, 4, 4);
        } else if (tile === 'enemy_slime') {
          ctx.fillStyle = '#84cc16';
          ctx.beginPath();
          ctx.roundRect(px + 2, py + 8, ts - 4, ts - 8, [8, 8, 3, 3]);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(px + 12, py + 14, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === 'enemy_bat') {
          ctx.fillStyle = '#6366f1';
          ctx.beginPath();
          ctx.arc(px + ts / 2, py + ts / 2, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(px + 4, py + 10, 6, 4);
          ctx.fillRect(px + ts - 10, py + 10, 6, 4);
        } else if (tile === 'moving_platform_h') {
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(px, py + 6, ts * 2, 12);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(px + 2, py + 8, ts * 2 - 4, 2);
        } else if (tile === 'moving_platform_v') {
          ctx.fillStyle = '#4f46e5';
          ctx.fillRect(px, py + 6, ts * 2, 12);
          ctx.fillStyle = '#818cf8';
          ctx.fillRect(px + 2, py + 8, ts * 2 - 4, 2);
        } else if (tile === 'player_spawn') {
          // Blue hero spawn indicator
          ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
          ctx.fillRect(px, py, ts, ts);
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 2, py + 2, ts - 4, ts - 4);
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(px + 8, py + 6, ts - 16, ts - 12);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.fillText('START', px + 3, py + ts - 4);
        } else if (tile === 'goal') {
          // Goal portal
          ctx.fillStyle = 'rgba(236, 72, 153, 0.3)';
          ctx.beginPath();
          ctx.arc(px + ts / 2, py + ts / 2, ts / 2 - 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ec4899';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('CÉL', px + 7, py + ts / 2 + 3);
        }
      }
    }

    // Hover or Drag preview
    if (hoverTile && hoverTile.x >= 0 && hoverTile.x < currentLevel.width && hoverTile.y >= 0 && hoverTile.y < currentLevel.height) {
      const hpx = hoverTile.x * ts;
      const hpy = hoverTile.y * ts;

      if (currentTool === 'rect' && rectStart && isMouseDown) {
        const minX = Math.min(rectStart.x, hoverTile.x);
        const maxX = Math.max(rectStart.x, hoverTile.x);
        const minY = Math.min(rectStart.y, hoverTile.y);
        const maxY = Math.max(rectStart.y, hoverTile.y);

        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.strokeRect(minX * ts, minY * ts, (maxX - minX + 1) * ts, (maxY - minY + 1) * ts);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
        ctx.fillRect(minX * ts, minY * ts, (maxX - minX + 1) * ts, (maxY - minY + 1) * ts);
      } else {
        ctx.strokeStyle = currentTool === 'eraser' ? '#f43f5e' : '#6366f1';
        ctx.lineWidth = 2;
        ctx.strokeRect(hpx, hpy, ts, ts);

        if (currentTool !== 'eraser') {
          const def = TILE_DEFINITIONS[selectedTile];
          ctx.fillStyle = def ? def.color : '#ffffff';
          ctx.globalAlpha = 0.4;
          ctx.fillRect(hpx + 4, hpy + 4, ts - 8, ts - 8);
          ctx.globalAlpha = 1.0;
        }
      }
    }
  }, [currentLevel, hoverTile, currentTool, selectedTile, rectStart, isMouseDown]);

  useEffect(() => {
    if (mode === 'edit') {
      drawEditor();
    }
  }, [mode, drawEditor]);

  // Flood fill algorithm for tilemap
  const floodFillTiles = (startX: number, startY: number, targetTile: TileType, fillTile: TileType) => {
    if (targetTile === fillTile) return;
    const nextTiles = currentLevel.tiles.map((r) => [...r]);
    const queue: [number, number][] = [[startX, startY]];
    const visited = new Uint8Array(currentLevel.width * currentLevel.height);

    while (queue.length > 0) {
      const [cx, cy] = queue.pop()!;
      const idx = cy * currentLevel.width + cx;
      if (cx < 0 || cx >= currentLevel.width || cy < 0 || cy >= currentLevel.height) continue;
      if (visited[idx]) continue;
      visited[idx] = 1;

      if (nextTiles[cy][cx] === targetTile) {
        nextTiles[cy][cx] = fillTile;
        queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
      }
    }

    pushGridHistory();
    setCurrentLevel((lvl) => ({ ...lvl, tiles: nextTiles }));
  };

  // Place Tile or execute tool action
  const applyToolAt = (tx: number, ty: number) => {
    if (tx < 0 || tx >= currentLevel.width || ty < 0 || ty >= currentLevel.height) return;

    if (currentTool === 'eyedropper') {
      const picked = currentLevel.tiles[ty][tx];
      if (picked) {
        setSelectedTile(picked);
        setCurrentTool('brush');
        showNotification(`Pipetta: ${TILE_DEFINITIONS[picked]?.name || picked}`);
      }
      return;
    }

    if (currentTool === 'bucket') {
      const target = currentLevel.tiles[ty][tx];
      floodFillTiles(tx, ty, target, selectedTile);
      return;
    }

    const placeTile: TileType = currentTool === 'eraser' ? 'empty' : selectedTile;
    if (currentLevel.tiles[ty][tx] === placeTile) return;

    const nextTiles = currentLevel.tiles.map((row, rIdx) => {
      if (rIdx !== ty) return row;
      const newRow = [...row];
      newRow[tx] = placeTile;
      return newRow;
    });

    setCurrentLevel((lvl) => ({ ...lvl, tiles: nextTiles }));
  };

  // Canvas Mouse handlers
  const handleEditorMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const tx = Math.floor(((e.clientX - rect.left) * scaleX) / currentLevel.tileSize);
    const ty = Math.floor(((e.clientY - rect.top) * scaleY) / currentLevel.tileSize);

    setIsMouseDown(true);

    if (currentTool === 'rect') {
      setRectStart({ x: tx, y: ty });
    } else {
      pushGridHistory();
      applyToolAt(tx, ty);
    }
  };

  const handleEditorMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const tx = Math.floor(((e.clientX - rect.left) * scaleX) / currentLevel.tileSize);
    const ty = Math.floor(((e.clientY - rect.top) * scaleY) / currentLevel.tileSize);

    setHoverTile({ x: tx, y: ty });

    if (isMouseDown && (currentTool === 'brush' || currentTool === 'eraser')) {
      applyToolAt(tx, ty);
    }
  };

  const handleEditorMouseUp = () => {
    if (isMouseDown && currentTool === 'rect' && rectStart && hoverTile) {
      pushGridHistory();
      const minX = Math.max(0, Math.min(rectStart.x, hoverTile.x));
      const maxX = Math.min(currentLevel.width - 1, Math.max(rectStart.x, hoverTile.x));
      const minY = Math.max(0, Math.min(rectStart.y, hoverTile.y));
      const maxY = Math.min(currentLevel.height - 1, Math.max(rectStart.y, hoverTile.y));

      const placeTile: TileType = selectedTile;
      const nextTiles = currentLevel.tiles.map((row, y) => {
        if (y < minY || y > maxY) return row;
        return row.map((cell, x) => {
          if (x >= minX && x <= maxX) return placeTile;
          return cell;
        });
      });

      setCurrentLevel((lvl) => ({ ...lvl, tiles: nextTiles }));
      setRectStart(null);
    }
    setIsMouseDown(false);
  };

  // Keyboard shortcuts in Edit Mode
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (mode === 'edit') {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          e.preventDefault();
          handleUndo();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
          e.preventDefault();
          handleRedo();
        } else if (e.key === 'p' || e.key === 'P') {
          startPlaying();
        }
      } else if (mode === 'play') {
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
          stopPlaying();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mode, tileHistory, redoStack, currentLevel]);

  // Ground Generator
  const handleGenerateGround = () => {
    pushGridHistory();
    const nextTiles = currentLevel.tiles.map((row) => [...row]);
    for (let x = 0; x < currentLevel.width; x++) {
      nextTiles[currentLevel.height - 2][x] = 'solid_ground';
      nextTiles[currentLevel.height - 1][x] = 'solid_brick';
    }
    // Player spawn & goal if absent
    nextTiles[currentLevel.height - 3][1] = 'player_spawn';
    nextTiles[currentLevel.height - 3][currentLevel.width - 2] = 'goal';

    setCurrentLevel((lvl) => ({ ...lvl, tiles: nextTiles }));
    showNotification('Alap talaj és kezdőpontok sikeresen generálva!');
  };

  // Clear level
  const handleClearLevel = () => {
    pushGridHistory();
    const empty = currentLevel.tiles.map((row) => row.map(() => 'empty' as TileType));
    setCurrentLevel((lvl) => ({ ...lvl, tiles: empty }));
    showNotification('Pálya kiürítve.');
  };

  // Save to LocalStorage
  const handleSaveToLocal = () => {
    localStorage.setItem('pixelcraft_custom_level', JSON.stringify(currentLevel));
    showNotification('Pálya sikeresen mentve a böngészőbe!');
  };

  // Export JSON
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(currentLevel, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentLevel.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Pályafájl (.json) letöltve!');
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.tiles && parsed.width && parsed.height) {
          pushGridHistory();
          setCurrentLevel(parsed);
          showNotification('Pálya sikeresen importálva!');
        } else {
          showNotification('Érvénytelen pályafájl formátum!');
        }
      } catch {
        showNotification('Hiba történt a fájl beolvasásakor.');
      }
    };
    reader.readAsText(file);
  };

  // Load Preset
  const handleLoadPreset = (lvl: LevelData) => {
    pushGridHistory();
    setCurrentLevel(JSON.parse(JSON.stringify(lvl)));
    showNotification(`Betöltve: ${lvl.name}`);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white select-none">
      {/* Top Header Bar */}
      <header className="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white font-black text-lg">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  JátékKészítő Stúdió
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  2D Engine
                </span>
              </div>
              <span className="text-xs text-neutral-400 block -mt-0.5">
                Vizuális pályaszerkesztő, fizika és sprite készítő
              </span>
            </div>
          </div>

          {/* Center: Mode Tabs */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-xl">
            <button
              onClick={() => {
                if (mode === 'play') stopPlaying();
                setActiveTab('tiles');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                mode === 'edit' && activeTab === 'tiles'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pályaszerkesztő</span>
            </button>

            <button
              onClick={() => {
                if (mode === 'play') stopPlaying();
                setActiveTab('physics');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                mode === 'edit' && activeTab === 'physics'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Fizika & Szabályok</span>
            </button>

            <button
              onClick={() => {
                if (mode === 'play') stopPlaying();
                setActiveTab('sprite');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                mode === 'edit' && activeTab === 'sprite'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Smile className="w-3.5 h-3.5 text-pink-400" />
              <span>Hős Rajzoló (16x16)</span>
            </button>

            <button
              onClick={() => {
                if (mode === 'play') stopPlaying();
                setActiveTab('levels');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                mode === 'edit' && activeTab === 'levels'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pályák & Mentés</span>
            </button>
          </div>

          {/* Right Action: Play / Edit Mode Switcher */}
          <div className="flex items-center gap-3">
            {mode === 'edit' ? (
              <button
                onClick={startPlaying}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Játék Indítása (P)</span>
              </button>
            ) : (
              <button
                onClick={stopPlaying}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-semibold text-xs sm:text-sm transition cursor-pointer shadow-md"
              >
                <RotateCcw className="w-4 h-4 text-indigo-400" />
                <span>Vissza a Szerkesztőbe (Esc)</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="md:hidden flex items-center justify-around border-t border-neutral-800 py-2 bg-neutral-950 px-2 text-xs">
          <button
            onClick={() => {
              if (mode === 'play') stopPlaying();
              setActiveTab('tiles');
            }}
            className={`p-1.5 rounded ${activeTab === 'tiles' && mode === 'edit' ? 'text-indigo-400 font-bold' : 'text-neutral-400'}`}
          >
            Pálya
          </button>
          <button
            onClick={() => {
              if (mode === 'play') stopPlaying();
              setActiveTab('physics');
            }}
            className={`p-1.5 rounded ${activeTab === 'physics' && mode === 'edit' ? 'text-amber-400 font-bold' : 'text-neutral-400'}`}
          >
            Fizika
          </button>
          <button
            onClick={() => {
              if (mode === 'play') stopPlaying();
              setActiveTab('sprite');
            }}
            className={`p-1.5 rounded ${activeTab === 'sprite' && mode === 'edit' ? 'text-pink-400 font-bold' : 'text-neutral-400'}`}
          >
            Hős
          </button>
          <button
            onClick={() => {
              if (mode === 'play') stopPlaying();
              setActiveTab('levels');
            }}
            className={`p-1.5 rounded ${activeTab === 'levels' && mode === 'edit' ? 'text-emerald-400 font-bold' : 'text-neutral-400'}`}
          >
            Pályák
          </button>
        </div>
      </header>

      {/* Floating Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-indigo-400 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col gap-6">
        {mode === 'play' ? (
          /* ========================================================
             PLAY MODE CANVAS & HUD
             ======================================================== */
          <div className="flex flex-col items-center gap-4">
            {/* Play HUD Top Bar */}
            <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-xl p-3 sm:px-6 flex items-center justify-between shadow-xl">
              {/* Lives */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-neutral-400 hidden sm:inline mr-1">Életek:</span>
                {Array.from({ length: gameStats.maxLives }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-5 h-5 ${
                      i < gameStats.lives ? 'text-rose-500 fill-rose-500' : 'text-neutral-700'
                    }`}
                  />
                ))}
              </div>

              {/* Coins & Score */}
              <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Coins className="w-4 h-4 fill-amber-400" />
                  <span>{gameStats.coins}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-white">
                  <Trophy className="w-4 h-4 text-indigo-400" />
                  <span>{gameStats.score} pont</span>
                </div>
                <div className="flex items-center gap-1 text-neutral-400 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{gameStats.timeElapsed}s</span>
                </div>
              </div>

              {/* Status or Controls hint */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => engineRef.current?.restart()}
                  className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition cursor-pointer"
                  title="Újrakezdés"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Game Canvas Container with Overlays */}
            <div className="relative border-4 border-neutral-800 rounded-2xl overflow-hidden shadow-2xl bg-black">
              <canvas
                ref={gameCanvasRef}
                width={currentLevel.width * currentLevel.tileSize}
                height={currentLevel.height * currentLevel.tileSize}
                className="block max-w-full h-auto cursor-none"
                style={{
                  maxHeight: 'min(70vh, 520px)',
                  aspectRatio: `${currentLevel.width} / ${currentLevel.height}`,
                }}
              />

              {/* Game Over Modal Overlay */}
              {gameStats.status === 'gameover' && (
                <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                  <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-4 text-rose-500">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
                    Vége a Játéknak!
                  </h2>
                  <p className="text-sm text-neutral-400 max-w-xs mb-6">
                    Elfogyott az összes életed. Próbáld meg újra vagy finomítsd a pályát a szerkesztőben!
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => engineRef.current?.restart()}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Újrapróbálás</span>
                    </button>
                    <button
                      onClick={stopPlaying}
                      className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium transition cursor-pointer"
                    >
                      Pályaszerkesztő
                    </button>
                  </div>
                </div>
              )}

              {/* Victory Modal Overlay */}
              {gameStats.status === 'won' && (
                <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-4 text-emerald-400">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
                    Gratulálunk! Pálya Teljesítve!
                  </h2>
                  <p className="text-sm text-neutral-300 mb-4">
                    Sikeresen elérted a célportált!
                  </p>
                  <div className="flex items-center gap-4 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 mb-6 text-xs text-neutral-300">
                    <div>
                      <span className="text-neutral-500 block">Pontszám</span>
                      <span className="font-bold text-white text-base">{gameStats.score}</span>
                    </div>
                    <div className="h-6 w-px bg-neutral-800" />
                    <div>
                      <span className="text-neutral-500 block">Érmék</span>
                      <span className="font-bold text-amber-400 text-base">{gameStats.coins}</span>
                    </div>
                    <div className="h-6 w-px bg-neutral-800" />
                    <div>
                      <span className="text-neutral-500 block">Idő</span>
                      <span className="font-bold text-white text-base">{gameStats.timeElapsed}s</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => engineRef.current?.restart()}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition cursor-pointer flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Újrajátszás</span>
                    </button>
                    <button
                      onClick={stopPlaying}
                      className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium transition cursor-pointer"
                    >
                      Vissza a Szerkesztőbe
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Virtual Touch Controls for Mobile / Tablet */}
            <div className="w-full max-w-md flex items-center justify-between px-4 py-3 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl md:hidden">
              <div className="flex items-center gap-2">
                <button
                  onMouseDown={() => engineRef.current?.pressVirtualKey('left', true)}
                  onMouseUp={() => engineRef.current?.pressVirtualKey('left', false)}
                  onTouchStart={(e) => { e.preventDefault(); engineRef.current?.pressVirtualKey('left', true); }}
                  onTouchEnd={(e) => { e.preventDefault(); engineRef.current?.pressVirtualKey('left', false); }}
                  className="w-14 h-14 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center active:bg-neutral-700 active:scale-95 text-white"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <button
                  onMouseDown={() => engineRef.current?.pressVirtualKey('right', true)}
                  onMouseUp={() => engineRef.current?.pressVirtualKey('right', false)}
                  onTouchStart={(e) => { e.preventDefault(); engineRef.current?.pressVirtualKey('right', true); }}
                  onTouchEnd={(e) => { e.preventDefault(); engineRef.current?.pressVirtualKey('right', false); }}
                  className="w-14 h-14 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center active:bg-neutral-700 active:scale-95 text-white"
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>

              <div>
                <button
                  onMouseDown={() => engineRef.current?.pressVirtualKey('jump', true)}
                  onMouseUp={() => engineRef.current?.pressVirtualKey('jump', false)}
                  onTouchStart={(e) => { e.preventDefault(); engineRef.current?.pressVirtualKey('jump', true); }}
                  onTouchEnd={(e) => { e.preventDefault(); engineRef.current?.pressVirtualKey('jump', false); }}
                  className="w-16 h-16 rounded-2xl bg-indigo-600 border border-indigo-500 flex flex-col items-center justify-center active:bg-indigo-500 active:scale-95 text-white shadow-lg shadow-indigo-600/30"
                >
                  <ArrowUp className="w-6 h-6" />
                  <span className="text-[10px] font-bold">UGRÁS</span>
                </button>
              </div>
            </div>

            {/* Keyboard hints */}
            <div className="text-center text-xs text-neutral-500 hidden sm:block">
              Irányítás billentyűzettel: <strong className="text-neutral-300">Nyilak</strong> vagy <strong className="text-neutral-300">A / D</strong> a mozgáshoz, <strong className="text-neutral-300">W / Felfelé / Space</strong> az ugráshoz, <strong className="text-neutral-300">Esc</strong> a szerkesztőhöz.
            </div>
          </div>
        ) : (
          /* ========================================================
             EDIT MODE WORKSPACE
             ======================================================== */
          <div className="space-y-6">
            {activeTab === 'tiles' && (
              <div className="flex flex-col lg:flex-row items-start gap-6">
                {/* Level Canvas Workbench */}
                <div className="flex-1 w-full flex flex-col items-center gap-3">
                  {/* Canvas header info */}
                  <div className="w-full flex items-center justify-between text-xs text-neutral-400 px-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-200">{currentLevel.name}</span>
                      <span className="text-neutral-600">•</span>
                      <span>{currentLevel.width} × {currentLevel.height} csempe ({currentLevel.tileSize}px)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveToLocal}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs transition cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Mentés</span>
                      </button>
                    </div>
                  </div>

                  {/* Level Canvas Viewport */}
                  <div className="w-full border-2 border-neutral-800 rounded-2xl overflow-auto bg-black p-2 flex items-center justify-center shadow-2xl">
                    <canvas
                      ref={editorCanvasRef}
                      onMouseDown={handleEditorMouseDown}
                      onMouseMove={handleEditorMouseMove}
                      onMouseUp={handleEditorMouseUp}
                      onMouseLeave={() => {
                        setIsMouseDown(false);
                        setHoverTile(null);
                      }}
                      className="cursor-crosshair block rounded-lg select-none"
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                        imageRendering: 'pixelated',
                      }}
                    />
                  </div>

                  {/* Help bar */}
                  <div className="w-full flex items-center justify-between text-[11px] text-neutral-500 px-1">
                    <div className="flex items-center gap-3">
                      <span>Kattints és húzd a ceruzát a rajzoláshoz</span>
                      <span>•</span>
                      <span>Ctrl+Z: Visszavonás</span>
                      <span>•</span>
                      <span>P: Játék tesztelése</span>
                    </div>
                  </div>
                </div>

                {/* Right Side Palette & Tools */}
                <div className="w-full lg:w-80 shrink-0">
                  <TilePalette
                    selectedTile={selectedTile}
                    onSelectTile={setSelectedTile}
                    currentTool={currentTool}
                    onSelectTool={setCurrentTool}
                    canUndo={tileHistory.length > 0}
                    canRedo={redoStack.length > 0}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onClear={handleClearLevel}
                    onGenerateGround={handleGenerateGround}
                  />
                </div>
              </div>
            )}

            {/* Physics & Rules Tab */}
            {activeTab === 'physics' && (
              <div className="max-w-3xl mx-auto">
                <PhysicsPanel
                  settings={currentLevel.settings}
                  onChangeSettings={(newSettings) => {
                    setCurrentLevel((lvl) => ({ ...lvl, settings: newSettings }));
                  }}
                />
              </div>
            )}

            {/* Pixel Art & Character Editor Tab */}
            {activeTab === 'sprite' && (
              <div className="max-w-4xl mx-auto">
                <PixelEditor
                  customSprite={customPlayerSprite}
                  onSaveSprite={(pixels) => {
                    setCustomPlayerSprite(pixels);
                    localStorage.setItem('pixelcraft_player_sprite', JSON.stringify(pixels));
                    showNotification('Egyedi karakter elmentve és aktiválva!');
                  }}
                  onResetDefault={() => {
                    setCustomPlayerSprite(null);
                    localStorage.removeItem('pixelcraft_player_sprite');
                    showNotification('Visszaállítva az alapértelmezett robot hősre.');
                  }}
                />
              </div>
            )}

            {/* Levels & Preset Management Tab */}
            {activeTab === 'levels' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                  <h3 className="text-base font-bold text-white mb-2">
                    Kész Mintapályák Betöltése
                  </h3>
                  <p className="text-xs text-neutral-400 mb-6">
                    Válassz egy előre megtervezett pályát a tanuláshoz vagy módosításhoz!
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {PRESET_LEVELS.map((lvl) => (
                      <div
                        key={lvl.id}
                        className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between hover:border-neutral-700 transition"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                            Előre készített szint
                          </span>
                          <h4 className="font-bold text-neutral-100 text-sm mb-1">
                            {lvl.name}
                          </h4>
                          <p className="text-xs text-neutral-400 line-clamp-2 mb-4">
                            {lvl.description}
                          </p>
                        </div>

                        <button
                          onClick={() => handleLoadPreset(lvl)}
                          className="w-full py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <span>Pálya Betöltése</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Import / Export Card */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">
                      Pályafájlok Exportálása & Importálása
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Mentsd el a munkádat szabványos JSON formátumban, oszd meg barátaiddal vagy tölts be korábbi pályákat.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExportJSON}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Pálya Letöltése (JSON)</span>
                    </button>

                    <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>Fájl Beolvasása</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportJSON}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 py-4 text-center text-xs text-neutral-500">
        <p>JátékKészítő Stúdió • 2D Platformer Játékmotor & Pályaszerkesztő</p>
      </footer>
    </div>
  );
}
