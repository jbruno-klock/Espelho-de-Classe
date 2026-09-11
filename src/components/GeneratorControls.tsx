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
  HelpCircle,
  Lightbulb,
  ArrowDownAZ,
  Columns,
  Rows
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
  onOpenAlphabeticalModal: () => void;
  onGenerateAlphabeticalDirect?: (direction: 'columns' | 'rows') => void;
}

export const GeneratorControls: React.FC<GeneratorControlsProps> = ({
  classroom,
  report,
  onRunGenerator,
  onClearSeating,
  isGenerating,
  onOpenConflictModal,
  onOpenAlphabeticalModal,
  onGenerateAlphabeticalDirect,
}) => {
  const [mode, setMode] = useState<GenerationOptions['mode']>('balanced');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAlphaDropdownOpen, setIsAlphaDropdownOpen] = useState(false);
  const [antiAffinityWeight, setAntiAffinityWeight] = useState(9);
  const [affinityWeight, setAffinityWeight] = useState(8);
  const [specialNeedsWeight, setSpecialNeedsWeight] = useState(10);
  const [separateTalkativeWeight, setSeparateTalkativeWeight] = useState(8);

  const handleModeChange = (newMode: GenerationOptions['mode']) => {
    setMode(newMode);
    if (newMode === 'focus_pairs') {
      setAffinityWeight(10);
      setAntiAffinityWeight(8);
    } else if (newMode === 'pedagogical_inclusion') {
      setSpecialNeedsWeight(10);
      setAffinityWeight(8);
      setAntiAffinityWeight(9);
    } else if (newMode === 'random_constrained') {
      setAntiAffinityWeight(10);
      setAffinityWeight(2);
      setSeparateTalkativeWeight(10);
    } else {
      setAntiAffinityWeight(9);
      setAffinityWeight(8);
      setSpecialNeedsWeight(10);
      setSeparateTalkativeWeight(8);
    }
  };

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
            onClick={() => handleModeChange('balanced')}
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
            onClick={() => handleModeChange('focus_pairs')}
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
            onClick={() => handleModeChange('pedagogical_inclusion')}
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
            onClick={() => handleModeChange('random_constrained')}
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
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onClearSeating}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-[#18181f] rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-zinc-800/60 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar Mapa
          </button>

          {/* Botão de Ordem Alfabética com Menu Rápido e Modal */}
          <div className="relative inline-flex items-center">
            <div className="inline-flex items-center rounded-xl bg-indigo-50 hover:bg-indigo-100/90 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/50 shadow-2xs transition-all">
              <button
                id="btn-open-alphabetical-modal"
                type="button"
                onClick={onOpenAlphabeticalModal}
                disabled={isGenerating || classroom.students.length === 0}
                className="px-3 py-2 text-xs font-bold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Gerar espelho em ordem alfabética (A-Z)"
              >
                <ArrowDownAZ className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Ordem Alfabética</span>
              </button>

              <button
                id="btn-toggle-alphabetical-dropdown"
                type="button"
                onClick={() => setIsAlphaDropdownOpen(!isAlphaDropdownOpen)}
                disabled={isGenerating || classroom.students.length === 0}
                className="px-1.5 py-2 border-l border-indigo-200/80 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-200 cursor-pointer disabled:opacity-50"
                title="Opções rápidas de ordem alfabética"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Dropdown Menu */}
            {isAlphaDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsAlphaDropdownOpen(false)} 
                />
                <div className="absolute right-0 top-full mt-1.5 z-50 w-56 rounded-2xl bg-white dark:bg-[#18181f] border border-slate-200 dark:border-zinc-800 shadow-xl p-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    Geração Rápida
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAlphaDropdownOpen(false);
                      if (onGenerateAlphabeticalDirect) {
                        onGenerateAlphabeticalDirect('columns');
                      } else {
                        onOpenAlphabeticalModal();
                      }
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-slate-700 dark:text-zinc-200 cursor-pointer font-medium"
                  >
                    <Columns className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">Por Fileiras (Vertical)</div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400">Coluna por coluna, da frente ao fundo</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAlphaDropdownOpen(false);
                      if (onGenerateAlphabeticalDirect) {
                        onGenerateAlphabeticalDirect('rows');
                      } else {
                        onOpenAlphabeticalModal();
                      }
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-slate-700 dark:text-zinc-200 cursor-pointer font-medium"
                  >
                    <Rows className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">Por Linhas (Horizontal)</div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400">Esquerda à direita, da frente ao fundo</div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsAlphaDropdownOpen(false);
                      onOpenAlphabeticalModal();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/50 flex items-center gap-2 text-indigo-700 dark:text-indigo-300 cursor-pointer font-bold"
                  >
                    <Sliders className="w-3.5 h-3.5 shrink-0" />
                    <span>Personalizar e Ver Prévia...</span>
                  </button>
                </div>
              </>
            )}
          </div>

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
                <span className="font-semibold text-slate-700 dark:text-zinc-300">Distanciar (NÃO Perto):</span>
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
                <span className="font-semibold text-slate-700 dark:text-zinc-300">Aproximar (Pode Perto):</span>
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

          {/* Conflict & Proximity Badges */}
          <div className="flex items-center gap-2.5 flex-wrap text-xs">
            {report.totalAffinities > 0 && (
              <span 
                className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800/50 flex items-center gap-1.5"
                title="Proporção de afinidades pedagógicas atendidas próximas no espelho"
              >
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Proximidade: {report.affinitiesSatisfied}/{report.totalAffinities}</span>
              </span>
            )}

            {criticalConflicts.length > 0 && (
              <button
                onClick={onOpenConflictModal}
                className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-300 rounded-xl font-bold border border-rose-300 dark:border-rose-800/50 transition-colors cursor-pointer shadow-xs"
                title="Visualizar diagnóstico e aplicar sugestões de correção de carteiras"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>{criticalConflicts.length} Conflito(s) Crítico(s)</span>
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-white/80 dark:bg-black/40 text-rose-800 dark:text-rose-200 rounded-md font-extrabold flex items-center gap-1">
                  <Lightbulb className="w-2.5 h-2.5" />
                  Sugestões
                </span>
              </button>
            )}

            {warningConflicts.length > 0 && criticalConflicts.length === 0 && (
              <button
                onClick={onOpenConflictModal}
                className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 dark:text-amber-300 rounded-xl font-medium border border-amber-300 dark:border-amber-800/50 transition-colors cursor-pointer shadow-xs"
                title="Visualizar diagnóstico e aplicar sugestões de correção de carteiras"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{warningConflicts.length} Ponto(s) de Atenção</span>
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-white/80 dark:bg-black/40 text-amber-800 dark:text-amber-200 rounded-md font-extrabold flex items-center gap-1">
                  <Lightbulb className="w-2.5 h-2.5" />
                  Sugestões
                </span>
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
