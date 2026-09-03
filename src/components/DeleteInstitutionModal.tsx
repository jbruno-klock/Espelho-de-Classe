import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, Building2, Users, School, GraduationCap } from 'lucide-react';
import { Institution } from '../types';

interface DeleteInstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  institution: Institution | null;
  managersCount: number;
  classroomsCount: number;
  studentsCount: number;
  onConfirmDelete: (institutionId: string) => void;
}

export const DeleteInstitutionModal: React.FC<DeleteInstitutionModalProps> = ({
  isOpen,
  onClose,
  institution,
  managersCount,
  classroomsCount,
  studentsCount,
  onConfirmDelete,
}) => {
  if (!isOpen || !institution) return null;

  const [confirmText, setConfirmText] = useState('');
  const isCodeConfirmed = confirmText.trim().toUpperCase() === institution.code.toUpperCase();

  const handleDelete = () => {
    onConfirmDelete(institution.id);
    onClose();
    setConfirmText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="delete-institution-modal-dialog"
        className="bg-white dark:bg-[#121216] rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-950/40 max-w-md w-full overflow-hidden flex flex-col text-slate-900 dark:text-zinc-100 transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-rose-50 dark:bg-[#171418]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base font-display">
                Excluir Instituição de Ensino
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">Ação Administrativa Master</p>
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
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="text-rose-900 dark:text-rose-200 font-bold">
                Tem certeza que deseja excluir esta instituição?
              </p>
              <p className="text-rose-800/90 dark:text-rose-300/80 leading-relaxed">
                Você está prestes a remover <strong className="text-slate-900 dark:text-white font-bold">{institution.name}</strong> ({institution.code}).
              </p>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-slate-50 dark:bg-[#18181f] p-4 rounded-2xl border border-slate-200 dark:border-zinc-800/80 space-y-2.5 text-xs text-slate-800 dark:text-zinc-300">
            <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-zinc-800">
              <span className="text-slate-600 dark:text-zinc-400 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                Instituição:
              </span>
              <span className="font-bold text-slate-900 dark:text-zinc-100">{institution.name}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-zinc-800">
              <span className="text-slate-600 dark:text-zinc-400 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                Gestores Vinculados:
              </span>
              <span className="font-bold text-purple-700 dark:text-purple-300">{managersCount} gestor(es)</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-zinc-800">
              <span className="text-slate-600 dark:text-zinc-400 flex items-center gap-2">
                <School className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Turmas Associadas:
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">{classroomsCount} turma(s)</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-600 dark:text-zinc-400 flex items-center gap-2">
                <GraduationCap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Total de Alunos:
              </span>
              <span className="font-bold text-amber-700 dark:text-amber-300">{studentsCount} aluno(s)</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-700 dark:text-zinc-400 bg-slate-100 dark:bg-[#18181f] p-3 rounded-xl border border-slate-200 dark:border-zinc-800 font-medium">
            ⚠️ <strong>Impacto:</strong> As turmas vinculadas serão removidas e os gestores desta instituição terão seus acessos desativados.
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              Digite <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">{institution.code}</span> para confirmar a exclusão:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Digite ${institution.code}`}
              className="w-full px-3 py-2 bg-white dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-mono text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase shadow-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!isCodeConfirmed}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Confirmar Exclusão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
