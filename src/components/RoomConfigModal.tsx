import React, { useState } from 'react';
import { X, Check, LayoutGrid, DoorOpen, Presentation, Columns3, CheckCircle2, XCircle } from 'lucide-react';
import { Classroom, RoomConfig } from '../types';

interface RoomConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: Classroom;
  onSaveConfig: (config: RoomConfig) => void;
}

export const RoomConfigModal: React.FC<RoomConfigModalProps> = ({
  isOpen,
  onClose,
  classroom,
  onSaveConfig,
}) => {
  if (!isOpen) return null;

  const [rows, setRows] = useState(classroom.roomConfig.rows);
  const [cols, setCols] = useState(classroom.roomConfig.cols);
  const [layoutType, setLayoutType] = useState<RoomConfig['layoutType']>(classroom.roomConfig.layoutType);
  const [teacherDeskPosition, setTeacherDeskPosition] = useState<RoomConfig['teacherDeskPosition']>(
    classroom.roomConfig.teacherDeskPosition
  );
  const [doorPosition, setDoorPosition] = useState<RoomConfig['doorPosition']>(classroom.roomConfig.doorPosition);
  const [windowPosition, setWindowPosition] = useState<RoomConfig['windowPosition']>(classroom.roomConfig.windowPosition);
  const [activeDesks, setActiveDesks] = useState<Record<string, boolean>>({ ...classroom.roomConfig.activeDesks });

  // Quick apply layout templates
  const applyPreset = (type: RoomConfig['layoutType']) => {
    setLayoutType(type);
    const newActive: Record<string, boolean> = {};

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `r${r}_c${c}`;
        if (type === 'u_shape') {
          newActive[key] = r === 0 || c === 0 || c === cols - 1;
        } else if (type === 'pairs') {
          // Keep all active, but layout handles pair spacing
          newActive[key] = true;
        } else {
          newActive[key] = true;
        }
      }
    }
    setActiveDesks(newActive);
  };

  const toggleDesk = (r: number, c: number) => {
    const key = `r${r}_c${c}`;
    setActiveDesks(prev => ({
      ...prev,
      [key]: prev[key] === false ? true : false,
    }));
  };

  const activeCount = Object.values(activeDesks).filter(v => v !== false).length;

  const handleSave = () => {
    onSaveConfig({
      rows,
      cols,
      layoutType,
      teacherDeskPosition,
      boardPosition: 'top',
      doorPosition,
      windowPosition,
      activeDesks,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121216] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-zinc-100 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#16161c]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-500/20 flex items-center justify-center shadow-xs">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base font-display">
                Layout e Arquitetura da Sala ({classroom.name})
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Ative ou desative carteiras para criar corredores e posicione portas e lousa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-800 dark:text-zinc-300">
          
          {/* Controls Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-[#18181f] p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-zinc-400 mb-1">
                Fileiras (Linhas)
              </label>
              <select
                value={rows}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setRows(val);
                }}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-[#121216] border border-slate-300 dark:border-zinc-700/60 rounded-lg text-xs font-semibold text-slate-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
              >
                {[3, 4, 5, 6, 7, 8].map(r => (
                  <option key={r} value={r} className="bg-white dark:bg-[#121216] text-slate-900 dark:text-zinc-200">{r} fileiras</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-zinc-400 mb-1">
                Colunas (Carteiras)
              </label>
              <select
                value={cols}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCols(val);
                }}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-[#121216] border border-slate-300 dark:border-zinc-700/60 rounded-lg text-xs font-semibold text-slate-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
              >
                {[3, 4, 5, 6, 7, 8, 9, 10].map(c => (
                  <option key={c} value={c} className="bg-white dark:bg-[#121216] text-slate-900 dark:text-zinc-200">{c} colunas</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-zinc-400 mb-1">
                Mesa do Professor
              </label>
              <select
                value={teacherDeskPosition}
                onChange={(e) => setTeacherDeskPosition(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-[#121216] border border-slate-300 dark:border-zinc-700/60 rounded-lg text-xs font-semibold text-slate-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
              >
                <option value="front_left" className="bg-white dark:bg-[#121216] text-slate-900 dark:text-zinc-200">Frente Esquerda</option>
                <option value="front_center" className="bg-white dark:bg-[#121216] text-slate-900 dark:text-zinc-200">Frente Centro</option>
                <option value="front_right" className="bg-white dark:bg-[#121216] text-slate-900 dark:text-zinc-200">Frente Direita</option>
                <option value="none" className="bg-white dark:bg-[#121216] text-slate-900 dark:text-zinc-200">Sem Mesa Fixa</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-zinc-400 mb-1">
                Porta de Entrada
              </label>
              <select
                value={doorPosition}
                onChange={(e) => setDoorPosition(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-[#121216] border border-slate-300 dark:border-zinc-700/60 rounded-lg text-xs font-semibold text-slate-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
              >
                <option value="front_right" className="bg-white dark:bg-[#121216] text-slate-900 dark:text-zinc-200">Frente Direita</option>
                <option value="front_left" className="bg-white dark:bg-[#121216] text-slate-900 dark:text-zinc-200">Frente Esquerda</option>
                <option value="back_right" className="bg-white dark:bg-[#121216] text-slate-900 dark:text-zinc-200">Fundo Direita</option>
                <option value="back_left" className="bg-white dark:bg-[#121216] text-slate-900 dark:text-zinc-200">Fundo Esquerda</option>
              </select>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-400 mb-2">
              Modelos Rápidos de Sala
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('rows')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  layoutType === 'rows' ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-300 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40 text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                Fileiras Padrão
              </button>
              <button
                type="button"
                onClick={() => applyPreset('pairs')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  layoutType === 'pairs' ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-300 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40 text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                Duplas (Pares)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('groups_4')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  layoutType === 'groups_4' ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-300 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40 text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                Ilhas / Grupos
              </button>
              <button
                type="button"
                onClick={() => applyPreset('u_shape')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  layoutType === 'u_shape' ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-300 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40 text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                Formato em U
              </button>
            </div>
          </div>

          {/* Interactive Room Grid Simulator */}
          <div className="bg-slate-100 dark:bg-[#0a0a0d] p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-inner flex flex-col items-center">
            
            {/* Chalkboard / Front of class */}
            <div className="w-full max-w-md bg-slate-900 dark:bg-[#0c0c10] border-2 border-emerald-600 dark:border-emerald-950/80 rounded-lg py-2 px-4 text-center mb-6 shadow-md flex items-center justify-center gap-2">
              <Presentation className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                QUADRO NEGRO / LOUSA (FRENTE)
              </span>
            </div>

            {/* Teacher desk indicator */}
            {teacherDeskPosition !== 'none' && (
              <div className="w-full max-w-md flex justify-between items-center mb-4 px-2 text-[11px]">
                {teacherDeskPosition === 'front_left' && (
                  <div className="bg-amber-100 dark:bg-[#1a1714] text-amber-900 dark:text-amber-300 px-3 py-1 rounded-md border border-amber-300 dark:border-amber-800/50 font-bold flex items-center gap-1">
                    👨‍🏫 Mesa do Professor
                  </div>
                )}
                {teacherDeskPosition === 'front_center' && (
                  <div className="mx-auto bg-amber-100 dark:bg-[#1a1714] text-amber-900 dark:text-amber-300 px-3 py-1 rounded-md border border-amber-300 dark:border-amber-800/50 font-bold flex items-center gap-1">
                    👨‍🏫 Mesa do Professor
                  </div>
                )}
                {teacherDeskPosition === 'front_right' && (
                  <div className="ml-auto bg-amber-100 dark:bg-[#1a1714] text-amber-900 dark:text-amber-300 px-3 py-1 rounded-md border border-amber-300 dark:border-amber-800/50 font-bold flex items-center gap-1">
                    👨‍🏫 Mesa do Professor
                  </div>
                )}
              </div>
            )}

            {/* Desks Matrix */}
            <div
              className="grid gap-2 p-2 bg-white dark:bg-[#121216]/80 rounded-xl border border-slate-200 dark:border-zinc-800 max-w-full overflow-x-auto shadow-xs"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(44px, 1fr))`,
              }}
            >
              {Array.from({ length: rows }).map((_, r) =>
                Array.from({ length: cols }).map((_, c) => {
                  const key = `r${r}_c${c}`;
                  const isActive = activeDesks[key] !== false;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleDesk(r, c)}
                      title={`Clique para ${isActive ? 'desativar (virar corredor/vazio)' : 'ativar carteira'}`}
                      className={`h-11 min-w-[44px] rounded-lg text-[10px] font-bold flex flex-col items-center justify-center transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-400 hover:bg-indigo-700 shadow-xs'
                          : 'bg-slate-100 dark:bg-zinc-900/40 border-dashed border-slate-300 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-600 text-slate-400 dark:text-zinc-600'
                      }`}
                    >
                      <span>F{r + 1}</span>
                      <span className="text-[9px] font-normal opacity-80">C{c + 1}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom info */}
            <div className="flex items-center justify-between w-full max-w-md mt-4 text-xs text-slate-600 dark:text-zinc-400">
              <span className="flex items-center gap-1 font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block"></span>
                {activeCount} Carteiras Ativas
              </span>
              <span className="text-slate-600 dark:text-zinc-400">
                Alunos na turma: <strong className="text-slate-900 dark:text-zinc-200">{classroom.students.length}</strong>
              </span>
            </div>

          </div>

          <p className="text-xs text-slate-600 dark:text-zinc-400 text-center">
            💡 Dica: Clique nas carteiras acima para desativá-las e criar corredores laterais ou centrais conforme o espaço real da sua sala.
          </p>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#16161c]">
          <span className="text-xs text-slate-600 dark:text-zinc-400">
            Capacidade: <strong className="text-slate-900 dark:text-zinc-200">{activeCount}</strong> de <strong className="text-slate-900 dark:text-zinc-200">{rows * cols}</strong> posições
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Salvar Layout
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
