import React from 'react';
import { X, AlertTriangle, AlertCircle, Eye, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import { Classroom, ConflictDiagnostic } from '../types';

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: Classroom;
  conflicts: ConflictDiagnostic[];
  onSwapDesks: (deskId1: string, deskId2: string) => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  isOpen,
  onClose,
  classroom,
  conflicts,
  onSwapDesks,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121216] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-xl w-full overflow-hidden flex flex-col max-h-[85vh] text-slate-900 dark:text-zinc-100 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#16161c]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20 flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base font-display">
                Diagnóstico de Proximidade & Conflitos
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                {conflicts.length === 0
                  ? 'Nenhum conflito detectado no mapa atual'
                  : `${conflicts.length} ponto(s) de atenção identificado(s)`}
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

        {/* Content */}
        <div className="p-6 space-y-3 overflow-y-auto flex-1 text-xs">
          {conflicts.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/50">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
              <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">Espelho de Classe Perfeito!</h4>
              <p className="text-emerald-800 dark:text-emerald-400/80 text-xs mt-1">
                Todas as desafinidades foram isoladas com sucesso e as necessidades pedagógicas foram atendidas.
              </p>
            </div>
          ) : (
            conflicts.map((c) => (
              <div
                key={c.id}
                className={`p-3.5 rounded-2xl border flex items-start gap-3 shadow-xs ${
                  c.severity === 'critical'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-300'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {c.type === 'anti_affinity' && <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                  {c.type === 'two_talkative' && <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                  {c.type === 'front_need_violated' && <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                  {c.type === 'back_need_violated' && <AlertCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">
                      {c.severity === 'critical' ? 'Conflito Crítico' : 'Aviso de Proximidade'}
                    </span>
                    {c.distance && (
                      <span className="text-[10px] bg-slate-200/80 dark:bg-black/40 border border-slate-300 dark:border-white/10 px-2 py-0.5 rounded-full font-bold text-slate-800 dark:text-zinc-200">
                        Distância: {c.distance} carteiras
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-slate-800 dark:text-zinc-300 leading-relaxed font-medium">{c.description}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#16161c]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-300 dark:border-zinc-700/60"
          >
            Fechar Diagnóstico
          </button>
        </div>

      </div>
    </div>
  );
};
