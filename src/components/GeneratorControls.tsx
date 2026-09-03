import React, { useState } from 'react';
import { 
  Sparkles, 
  Play, 
  RotateCcw, 
  ShieldCheck, 
  Users2, 
  Shuffle, 
  AlertCircle, 
  Sliders, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  HeartHandshake,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Classroom, GenerationOptions, GenerationReport } from '../types';

interface GeneratorControlsProps {
  classroom: Classroom;
  report: GenerationReport | null;
  onRunGenerator: (options: GenerationOptions) => void;
  onClearSeating: () => void;
  isGenerating: boolean;
  onOpenConflictModal: () => void;
}

export const GeneratorControls: React.FC<GeneratorControlsProps> = ({
  classroom,
  report,
  onRunGenerator,
  onClearSeating,
  isGenerating,
  onOpenConflictModal,
}) => {
  const [mode, setMode] = useState<GenerationOptions['mode']>('balanced');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [antiAffinityWeight, setAntiAffinityWeight] = useState(9);
  const [affinityWeight, setAffinityWeight] = useState(7);
  const [specialNeedsWeight, setSpecialNeedsWeight] = useState(10);
  const [separateTalkativeWeight, setSeparateTalkativeWeight] = useState(8);

  const handleGenerate = () => {
    onRunGenerator({
      mode,
      antiAffinityWeight,
      affinityWeight,
      specialNeedsWeight,
      separateTalkativeWeight,
      avoidIsolatedStudents: true,
      respectFixedDesks: true,
    });
  };

  const criticalConflicts = report?.conflicts.filter(c => c.severity === 'critical') || [];
  const warningConflicts = report?.conflicts.filter(c => c.severity === 'warning') || [];

  return (
    <div className="bg-white dark:bg-[#121216] rounded-3xl border border-slate-200 dark:border-zinc-800/80 shadow-sm p-5 space-y-4 no-print transition-colors">
      
      {/* Primary Bar: Generator Trigger & Mode */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Mode Selection */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mr-1">
            Modo do Algoritmo:
          </span>

          <button
            onClick={() => setMode('balanced')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'balanced'
                ? 'bg-emerald-600 dark:bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#18181f] dark:hover:bg-[#22222a] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Harmônico & Equilibrado
          </button>

          <button
            onClick={() => setMode('focus_pairs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'focus_pairs'
                ? 'bg-emerald-600 dark:bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#18181f] dark:hover:bg-[#22222a] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800'
            }`}
          >
            <Users2 className="w-3.5 h-3.5" />
            Duplas Produtivas
          </button>

          <button
            onClick={() => setMode('pedagogical_inclusion')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'pedagogical_inclusion'
                ? 'bg-emerald-600 dark:bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#18181f] dark:hover:bg-[#22222a] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Foco em Inclusão (Frente)
          </button>

          <button
            onClick={() => setMode('random_constrained')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'random_constrained'
                ? 'bg-emerald-600 dark:bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#18181f] dark:hover:bg-[#22222a] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            Provas / Avaliações
          </button>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            title="Ajustar pesos e parâmetros do algoritmo"
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-[#18181f] transition-colors ml-auto lg:ml-0 border border-slate-200 dark:border-zinc-800/60 cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onClearSeating}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-[#18181f] rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-zinc-800/60 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar Mapa
          </button>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || classroom.students.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-2xl shadow-md shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Otimizando Sala...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Gerar Espelho Automaticamente</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Advanced Settings Drawer */}
      {showAdvanced && (
        <div className="bg-slate-50 dark:bg-[#18181f] p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 animate-in fade-in slide-in-from-top-1 duration-150 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-indigo-400" />
              Pesos de Otimização do Algoritmo
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">Escala de 1 a 10</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-slate-700 dark:text-zinc-300">Evitar Desafinidades:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{antiAffinityWeight}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={antiAffinityWeight}
                onChange={(e) => setAntiAffinityWeight(Number(e.target.value))}
                className="w-full accent-rose-500 bg-slate-200 dark:bg-zinc-800"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-slate-700 dark:text-zinc-300">Estimular Afinidades:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{affinityWeight}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={affinityWeight}
                onChange={(e) => setAffinityWeight(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-200 dark:bg-zinc-800"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-slate-700 dark:text-zinc-300">Necessidades Especiais:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{specialNeedsWeight}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={specialNeedsWeight}
                onChange={(e) => setSpecialNeedsWeight(Number(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-200 dark:bg-zinc-800"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-slate-700 dark:text-zinc-300">Separar Conversadores:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{separateTalkativeWeight}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={separateTalkativeWeight}
                onChange={(e) => setSeparateTalkativeWeight(Number(e.target.value))}
                className="w-full accent-amber-500 bg-slate-200 dark:bg-zinc-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* Real-time Diagnostics Banner */}
      {report && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800/80">
          
          {/* Harmony Score Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-xl font-display font-extrabold text-sm flex items-center gap-1.5 ${
                report.score >= 90
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60'
                  : report.score >= 75
                  ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-800/60'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60'
              }`}>
                <span>{report.score}%</span>
                <span className="text-xs font-bold opacity-80">({report.grade})</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                  {report.score >= 90 ? 'Harmonia Excelente' : report.score >= 75 ? 'Boa Harmonia' : 'Harmonia Moderada'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">{report.summary}</p>
              </div>
            </div>
          </div>

          {/* Conflict Count Button */}
          <div className="flex items-center gap-3 text-xs">
            {criticalConflicts.length > 0 && (
              <button
                onClick={onOpenConflictModal}
                className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-300 rounded-xl font-bold border border-rose-300 dark:border-rose-800/50 transition-colors cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                {criticalConflicts.length} Conflito(s) Crítico(s)
              </button>
            )}

            {warningConflicts.length > 0 && criticalConflicts.length === 0 && (
              <button
                onClick={onOpenConflictModal}
                className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 dark:text-amber-300 rounded-xl font-medium border border-amber-300 dark:border-amber-800/50 transition-colors cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                {warningConflicts.length} Ponto(s) de Atenção
              </button>
            )}

            {criticalConflicts.length === 0 && warningConflicts.length === 0 && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Zero Conflitos!
              </span>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
