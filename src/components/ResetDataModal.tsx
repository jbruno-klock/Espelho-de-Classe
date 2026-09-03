import React from 'react';
import { RotateCcw, AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface ResetDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
}

export const ResetDataModal: React.FC<ResetDataModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirmReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="reset-data-modal-dialog"
        className="bg-white dark:bg-[#131317] rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
      >
        <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-rose-50/60 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 font-display">
                Restaurar Dados de Exemplo
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                Substituição dos dados locais e na nuvem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-950 dark:text-rose-200">
                Tem certeza que deseja restaurar os dados de demonstração?
              </p>
              <p className="text-rose-900/80 dark:text-rose-300/80 leading-relaxed">
                Essa ação irá recarregar as instituições, gestores e turmas de exemplo padrão, substituindo as edições atuais.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-[#16161c] flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800 font-semibold cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-900/20 cursor-pointer transition-all active:scale-98"
          >
            Restaurar Demonstração
          </button>
        </div>
      </div>
    </div>
  );
};
