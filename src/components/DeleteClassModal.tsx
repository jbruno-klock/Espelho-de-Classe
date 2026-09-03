import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, School, Users, ShieldAlert } from 'lucide-react';
import { Classroom } from '../types';

interface DeleteClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: Classroom | null;
  totalClassrooms: number;
  onConfirmDelete: (classroomId: string) => void;
}

export const DeleteClassModal: React.FC<DeleteClassModalProps> = ({
  isOpen,
  onClose,
  classroom,
  totalClassrooms,
  onConfirmDelete,
}) => {
  if (!isOpen || !classroom) return null;

  const [confirmName, setConfirmName] = useState('');
  const studentCount = classroom.students?.length || 0;
  const isOnlyClassroom = totalClassrooms <= 1;

  const handleDelete = () => {
    onConfirmDelete(classroom.id);
    onClose();
    setConfirmName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="delete-class-modal-dialog"
        className="bg-white dark:bg-[#121216] rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-950/40 max-w-md w-full overflow-hidden text-slate-900 dark:text-zinc-100 transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-rose-50 dark:bg-[#171418]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base font-display">
                Excluir Turma
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400/90 font-bold">Ação irreversível</p>
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
                Tem certeza que deseja excluir esta turma?
              </p>
              <p className="text-rose-800/90 dark:text-rose-300/80 leading-relaxed">
                Você está prestes a remover permanentemente a turma <strong className="text-slate-900 dark:text-white font-bold">{classroom.name}</strong>.
              </p>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-slate-50 dark:bg-[#18181f] p-4 rounded-2xl border border-slate-200 dark:border-zinc-800/80 space-y-2.5 text-xs text-slate-800 dark:text-zinc-300">
            <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-zinc-800">
              <span className="text-slate-600 dark:text-zinc-400 flex items-center gap-2">
                <School className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Turma:
              </span>
              <span className="font-bold text-slate-900 dark:text-zinc-100">{classroom.name}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-zinc-800">
              <span className="text-slate-600 dark:text-zinc-400 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Alunos cadastrados:
              </span>
              <span className="font-bold text-slate-900 dark:text-zinc-100">{studentCount} alunos</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-600 dark:text-zinc-400">Escola / Série:</span>
              <span className="text-slate-800 dark:text-zinc-300">{classroom.schoolName || 'Escola'} • {classroom.grade || 'Geral'}</span>
            </div>
          </div>

          {isOnlyClassroom && (
            <p className="text-[11px] text-amber-900 dark:text-amber-400/90 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-3 rounded-xl flex items-center gap-2 font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              Esta é a sua única turma. Ao excluí-la, uma nova turma padrão vazia será criada para você continuar usando a plataforma.
            </p>
          )}

          <p className="text-xs text-slate-600 dark:text-zinc-400">
            Todos os alunos, registros de afinidade, histórico e configurações de carteiras desta turma serão apagados.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#16161c]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            id="confirm-delete-class-btn"
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Excluir Turma
          </button>
        </div>
      </div>
    </div>
  );
};
