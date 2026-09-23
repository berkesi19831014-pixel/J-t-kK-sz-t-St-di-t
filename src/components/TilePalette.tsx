import React from 'react';
import { TileType, TILE_DEFINITIONS } from '../game/types';
import { 
  Paintbrush, 
  Eraser, 
  PaintBucket, 
  Square, 
  Pipette, 
  RotateCcw, 
  RotateCw, 
  Trash2,
  Sparkles
} from 'lucide-react';

export type ToolType = 'brush' | 'eraser' | 'bucket' | 'rect' | 'eyedropper';

interface TilePaletteProps {
  selectedTile: TileType;
  onSelectTile: (tile: TileType) => void;
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onGenerateGround: () => void;
}

export const TilePalette: React.FC<TilePaletteProps> = ({
  selectedTile,
  onSelectTile,
  currentTool,
  onSelectTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onGenerateGround,
}) => {
  const categories: Array<{ id: string; label: string; tiles: TileType[] }> = [
    {
      id: 'terep',
      label: 'Terep elemek',
      tiles: ['solid_ground', 'solid_brick', 'solid_wood'],
    },
    {
      id: 'csapda',
      label: 'Veszélyek & Csapdák',
      tiles: ['hazard_spikes', 'hazard_lava'],
    },
    {
      id: 'gyujtheto',
      label: 'Kincsek & Bónuszok',
      tiles: ['coin', 'gem', 'star', 'powerup_jump', 'powerup_speed'],
    },
    {
      id: 'ellenseg',
      label: 'Ellenségek & Lények',
      tiles: ['enemy_slime', 'enemy_bat'],
    },
    {
      id: 'specialis',
      label: 'Mechanika & Cél',
      tiles: ['player_spawn', 'goal', 'moving_platform_h', 'moving_platform_v'],
    },
  ];

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-5">
      {/* Editor Tools Row */}
      <div>
        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
          Eszközök
        </span>
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-950/70 border border-neutral-800 rounded-lg">
          <button
            onClick={() => onSelectTool('brush')}
            title="Ceruza / Elhelyezés"
            className={`p-2 rounded-md transition cursor-pointer flex items-center gap-1.5 text-xs ${
              currentTool === 'brush'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ceruza</span>
          </button>

          <button
            onClick={() => onSelectTool('eraser')}
            title="Radír"
            className={`p-2 rounded-md transition cursor-pointer flex items-center gap-1.5 text-xs ${
              currentTool === 'eraser'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Radír</span>
          </button>

          <button
            onClick={() => onSelectTool('bucket')}
            title="Kitöltő vödör"
            className={`p-2 rounded-md transition cursor-pointer flex items-center gap-1.5 text-xs ${
              currentTool === 'bucket'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <PaintBucket className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Vödör</span>
          </button>

          <button
            onClick={() => onSelectTool('rect')}
            title="Téglalap terület"
            className={`p-2 rounded-md transition cursor-pointer flex items-center gap-1.5 text-xs ${
              currentTool === 'rect'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Téglalap</span>
          </button>

          <button
            onClick={() => onSelectTool('eyedropper')}
            title="Pipetta / Csempe mintavevő"
            className={`p-2 rounded-md transition cursor-pointer flex items-center gap-1.5 text-xs ${
              currentTool === 'eyedropper'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Pipette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pipetta</span>
          </button>

          <div className="h-5 w-px bg-neutral-800 mx-1" />

          {/* Undo / Redo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Visszavonás (Ctrl+Z)"
            className="p-2 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Újra (Ctrl+Y)"
            className="p-2 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tile Categories Palette */}
      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.id}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                {cat.label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {cat.tiles.map((tileKey) => {
                const def = TILE_DEFINITIONS[tileKey];
                const isSelected = selectedTile === tileKey && currentTool !== 'eraser';

                return (
                  <button
                    key={tileKey}
                    onClick={() => {
                      onSelectTile(tileKey);
                      if (currentTool === 'eraser') onSelectTool('brush');
                    }}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border text-left text-xs transition cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-800 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/40'
                        : 'bg-neutral-950/50 border-neutral-800/80 text-neutral-300 hover:bg-neutral-800/70 hover:border-neutral-700'
                    }`}
                  >
                    {/* Visual Color Dot or Preview */}
                    <span
                      className="w-4 h-4 rounded-sm shrink-0 border border-black/30 shadow-xs"
                      style={{ backgroundColor: def.color }}
                    />
                    <span className="truncate font-medium">{def.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Level Actions */}
      <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
        <button
          onClick={onGenerateGround}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 bg-neutral-800/80 hover:bg-neutral-800 hover:text-white border border-neutral-700/60 transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Talaj generálás</span>
        </button>

        <button
          onClick={onClear}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Pálya kiürítése</span>
        </button>
      </div>
    </div>
  );
};
