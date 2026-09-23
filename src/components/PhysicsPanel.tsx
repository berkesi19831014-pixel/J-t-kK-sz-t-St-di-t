import React from 'react';
import { GameSettings } from '../game/types';
import { 
  Zap, 
  Heart, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Layers, 
  Gauge, 
  ArrowUpCircle 
} from 'lucide-react';
import { sounds } from '../game/audio';

interface PhysicsPanelProps {
  settings: GameSettings;
  onChangeSettings: (newSettings: GameSettings) => void;
}

export const PhysicsPanel: React.FC<PhysicsPanelProps> = ({
  settings,
  onChangeSettings,
}) => {
  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const updated = { ...settings, [key]: value };
    if (key === 'soundEnabled') {
      sounds.enabled = Boolean(value);
    }
    onChangeSettings(updated);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Fizika & Játékszabályok
          </h3>
          <p className="text-xs text-neutral-400">
            Azonnal érvénybe lép a játék tesztelése közben.
          </p>
        </div>

        <button
          onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
          className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
            settings.soundEnabled
              ? 'bg-neutral-800 border-neutral-700 text-neutral-200'
              : 'bg-neutral-950 border-neutral-800 text-neutral-500'
          }`}
          title={settings.soundEnabled ? 'Hangok némítása' : 'Hangok bekapcsolása'}
        >
          {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          <span>{settings.soundEnabled ? 'Hang: BE' : 'Hang: KI'}</span>
        </button>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Gravity */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-300 font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Gravitáció erőssége
            </span>
            <span className="font-mono text-neutral-400">{settings.gravity.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.2"
            step="0.05"
            value={settings.gravity}
            onChange={(e) => updateSetting('gravity', parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-500">
            <span>Holdi lebegés (0.2)</span>
            <span>Nehéz gravitáció (1.2)</span>
          </div>
        </div>

        {/* Jump Force */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-300 font-medium flex items-center gap-1.5">
              <ArrowUpCircle className="w-3.5 h-3.5 text-sky-400" />
              Ugrási magasság (Impulzus)
            </span>
            <span className="font-mono text-neutral-400">{Math.abs(settings.jumpForce).toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="7"
            max="16"
            step="0.5"
            value={Math.abs(settings.jumpForce)}
            onChange={(e) => updateSetting('jumpForce', -parseFloat(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-500">
            <span>Kis szökellés (7)</span>
            <span>Szuperugrás (16)</span>
          </div>
        </div>

        {/* Move Speed */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-300 font-medium flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              Futási sebesség
            </span>
            <span className="font-mono text-neutral-400">{settings.moveSpeed.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="2.5"
            max="8.0"
            step="0.2"
            value={settings.moveSpeed}
            onChange={(e) => updateSetting('moveSpeed', parseFloat(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-500">
            <span>Óvatos séta (2.5)</span>
            <span>Villámfutás (8.0)</span>
          </div>
        </div>

        {/* Enemy Speed */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-300 font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              Ellenségek járőrsebessége
            </span>
            <span className="font-mono text-neutral-400">{settings.enemySpeed.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="4.0"
            step="0.2"
            value={settings.enemySpeed}
            onChange={(e) => updateSetting('enemySpeed', parseFloat(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-500">
            <span>Lassú nyálka (0.5)</span>
            <span>Gyors ragadozó (4.0)</span>
          </div>
        </div>
      </div>

      {/* Rules & Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
        {/* Double Jump */}
        <label className="flex items-center justify-between p-3 rounded-lg bg-neutral-950/60 border border-neutral-800 cursor-pointer hover:bg-neutral-950">
          <div className="pr-4">
            <span className="text-xs font-medium text-neutral-200 block">
              Dupla ugrás (Double Jump)
            </span>
            <span className="text-[11px] text-neutral-400">
              A játékos ugrás közben még egyszer a levegőbe ugorhat.
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.allowDoubleJump}
            onChange={(e) => updateSetting('allowDoubleJump', e.target.checked)}
            className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
          />
        </label>

        {/* Max Lives */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-950/60 border border-neutral-800">
          <div>
            <span className="text-xs font-medium text-neutral-200 block flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              Kezdő életek száma
            </span>
            <span className="text-[11px] text-neutral-400">
              Hányszor sérülhet a játékos bukás előtt.
            </span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 3, 5, 9].map((cnt) => (
              <button
                key={cnt}
                onClick={() => updateSetting('maxLives', cnt)}
                className={`w-7 h-7 rounded-md text-xs font-bold transition cursor-pointer ${
                  settings.maxLives === cnt
                    ? 'bg-rose-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {cnt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Theme Environment Picker */}
      <div className="space-y-2 pt-2 border-t border-neutral-800">
        <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Környezet & Háttér stílus
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'forest', name: 'Zöldellő Erdő', color: 'from-slate-900 to-emerald-950' },
            { id: 'cyber', name: 'Cyberpunk Éj', color: 'from-purple-950 to-indigo-950' },
            { id: 'dungeon', name: 'Vulkáni Barlang', color: 'from-stone-900 to-amber-950' },
            { id: 'sunset', name: 'Lila Naplemente', color: 'from-fuchsia-950 to-orange-950' },
          ].map((themeOption) => (
            <button
              key={themeOption.id}
              onClick={() => updateSetting('theme', themeOption.id as GameSettings['theme'])}
              className={`p-3 rounded-lg border text-left text-xs transition cursor-pointer bg-gradient-to-b ${themeOption.color} ${
                settings.theme === themeOption.id
                  ? 'border-indigo-400 ring-2 ring-indigo-500/30 font-semibold text-white'
                  : 'border-neutral-800 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <span className="block font-medium">{themeOption.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
