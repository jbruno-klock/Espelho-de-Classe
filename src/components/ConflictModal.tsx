import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  AlertCircle, 
  Eye, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  Lightbulb, 
  ArrowRightLeft, 
  Sparkles, 
  Check, 
  Info, 
  ShieldCheck, 
  Zap 
} from 'lucide-react';
import { Classroom, ConflictDiagnostic, ConflictSuggestion } from '../types';

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: Classroom;
  conflicts: ConflictDiagnostic[];
  onSwapDesks: (deskId1: string, deskId2: string) => void;
  onAutoResolveAll?: () => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  isOpen,
  onClose,
  classroom,
  conflicts,
  onSwapDesks,
  onAutoResolveAll,
}) => {
  const [appliedSuggestionId, setAppliedSuggestionId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplySuggestion = (sug: ConflictSuggestion) => {
    setAppliedSuggestionId(sug.id);
    onSwapDesks(sug.sourceDeskId, sug.targetDeskId);

    setTimeout(() => {
      setAppliedSuggestionId(null);
    }, 1800);
  };

  const criticalConflicts = conflicts.filter(c => c.severity === 'critical');
  const warningConflicts = conflicts.filter(c => c.severity === 'warning');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121216] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-2xl w-full overflow-hidden flex flex-col max-h-[88vh] text-slate-900 dark:text-zinc-100 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#16161c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20 flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base font-display">
                  Diagnóstico & Sugestões de Correção
                </h3>
                {conflicts.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60">
                    {conflicts.length} {conflicts.length === 1 ? 'conflito' : 'conflitos'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                {conflicts.length === 0
                  ? 'Nenhum conflito detectado no mapa atual'
                  : 'Identificação de problemas e recomendações automáticas de troca de carteira'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {conflicts.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/50">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
              <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm font-display">Espelho de Classe em Perfeita Harmonia!</h4>
              <p className="text-emerald-800 dark:text-emerald-400/80 text-xs mt-1.5 max-w-md mx-auto">
                Todas as regras de distanciamento, afinidade e necessidades pedagógicas estão cumpridas sem nenhum conflito.
              </p>
            </div>
          ) : (
            <>
              {/* Top Quick Status & Auto-resolve bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-indigo-50/90 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-indigo-950 dark:text-indigo-200 font-bold block">
                      Resolução de Conflitos
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-zinc-400">
                      Resolva todos de uma vez com o botão ao lado ou aplique as sugestões isoladas abaixo.
                    </span>
                  </div>
                </div>
                {onAutoResolveAll && conflicts.length > 0 && (
                  <button
                    id="conflict-modal-auto-resolve-all-btn"
                    type="button"
                    onClick={onAutoResolveAll}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0 ml-auto sm:ml-0 group"
                    title="Executa permutações automáticas para eliminar todos os conflitos do espelho de uma só vez"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-200 group-hover:rotate-12 transition-transform" />
                    <span>Resolver Todos Automaticamente</span>
                  </button>
                )}
              </div>

              {/* Conflicts List with actionable suggestions */}
              {conflicts.map((c, index) => {
                const suggestions = c.suggestions || [];

                return (
                  <div
                    key={c.id}
                    className={`p-4 rounded-2xl border transition-all shadow-xs ${
                      c.severity === 'critical'
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                        : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                    }`}
                  >
                    {/* Conflict Title & Type Banner */}
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        c.severity === 'critical'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                      }`}>
                        {c.type === 'anti_affinity' && <AlertTriangle className="w-4 h-4" />}
                        {c.type === 'two_talkative' && <Users className="w-4 h-4" />}
                        {c.type === 'front_need_violated' && <Eye className="w-4 h-4" />}
                        {c.type === 'back_need_violated' && <AlertCircle className="w-4 h-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-xs ${
                              c.severity === 'critical'
                                ? 'text-rose-900 dark:text-rose-300'
                                : 'text-amber-900 dark:text-amber-300'
                            }`}>
                              {c.severity === 'critical' ? 'Conflito Crítico' : 'Ponto de Atenção'} #{index + 1}
                            </span>
                            {c.category && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold">
                                {c.category}
                              </span>
                            )}
                          </div>

                          {c.distance !== undefined && (
                            <span className="text-[10px] bg-white dark:bg-black/40 border border-slate-300 dark:border-zinc-700 px-2 py-0.5 rounded-full font-bold text-slate-800 dark:text-zinc-200 shrink-0">
                              Distância: {c.distance} carteiras
                            </span>
                          )}
                        </div>

                        <p className="mt-1.5 text-slate-800 dark:text-zinc-200 leading-relaxed font-medium">
                          {c.description}
                        </p>
                      </div>
                    </div>

                    {/* Suggestions Section */}
                    <div className="mt-3.5 pt-3 border-t border-slate-200/80 dark:border-zinc-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-300">
                        <span className="flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          Sugestões Inteligentes de Correção:
                        </span>
                        {suggestions.length > 0 && (
                          <span className="text-[10px] font-normal text-slate-500 dark:text-zinc-400">
                            {suggestions.length} {suggestions.length === 1 ? 'alternativa calculada' : 'alternativas calculadas'}
                          </span>
                        )}
                      </div>

                      {suggestions.length === 0 ? (
                        <div className="p-3 bg-white/70 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 text-xs flex items-center gap-2">
                          <Info className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>
                            Nenhuma troca viável encontrada sem afetar carteiras travadas. Tente destravar algumas posições ou redistribuir manualmente no mapa.
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {suggestions.map((sug) => {
                            const isApplied = appliedSuggestionId === sug.id;

                            return (
                              <div
                                key={sug.id}
                                className={`p-3 rounded-xl border transition-all ${
                                  isApplied
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 scale-99'
                                    : 'bg-white dark:bg-[#181820] border-slate-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 shadow-2xs'
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                  <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-slate-900 dark:text-zinc-100 text-xs">
                                        {sug.title}
                                      </span>
                                      
                                      {/* Impact Badge */}
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                                        sug.impact === 'resolves_completely'
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60'
                                          : 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-800/60'
                                      }`}>
                                        <ShieldCheck className="w-2.5 h-2.5" />
                                        {sug.impact === 'resolves_completely' ? 'Resolve o Conflito' : 'Melhora Expressiva'}
                                      </span>

                                      {sug.expectedScoreImprovement > 0 && (
                                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                                          +{sug.expectedScoreImprovement}% Harmonia
                                        </span>
                                      )}
                                    </div>

                                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                                      {sug.explanation}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleApplySuggestion(sug)}
                                    disabled={isApplied}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs ${
                                      isApplied
                                        ? 'bg-emerald-600 text-white cursor-default'
                                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-800/50 active:scale-97'
                                    }`}
                                  >
                                    {isApplied ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-white" />
                                        <span>Aplicado!</span>
                                      </>
                                    ) : (
                                      <>
                                        <ArrowRightLeft className="w-3.5 h-3.5" />
                                        <span>Aplicar Correção</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#16161c]">
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 hidden sm:inline">
            As alterações são salvas automaticamente no espelho da turma.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-300 dark:border-zinc-700/60 ml-auto"
          >
            Fechar Diagnóstico
          </button>
        </div>

      </div>
    </div>
  );
};
