import React from 'react';
import { Trash2, AlertTriangle, X, User, Mail, Shield, Building2, AlertCircle } from 'lucide-react';
import { AppUser } from '../types';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser | null;
  isCurrentUser: boolean;
  institutionName?: string;
  onConfirmDelete: (userId: string) => void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  onClose,
  user,
  isCurrentUser,
  institutionName,
  onConfirmDelete,
}) => {
  if (!isOpen || !user) return null;

  const handleDelete = () => {
    onConfirmDelete(user.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="delete-user-modal-dialog"
        className="bg-white dark:bg-[#121216] rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-950/40 max-w-md w-full overflow-hidden flex flex-col text-slate-900 dark:text-zinc-100 transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-rose-50 dark:bg-[#171418]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center shrink-0 shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base font-display">
                Excluir Usuário
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
                Tem certeza que deseja remover este usuário do sistema?
              </p>
              <p className="text-rose-800/90 dark:text-rose-300/80 leading-relaxed">
                As credenciais de acesso de <strong className="text-slate-900 dark:text-white font-bold">{user.name}</strong> serão permanentemente excluídas.
              </p>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-slate-50 dark:bg-[#18181f] p-4 rounded-2xl border border-slate-200 dark:border-zinc-800/80 space-y-2.5 text-xs text-slate-800 dark:text-zinc-300">
            <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-zinc-800">
              <span className="text-slate-600 dark:text-zinc-400 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Nome:
              </span>
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: user.avatarColor || '#6366f1' }}
                >
                  {user.name.slice(0, 1)}
                </div>
                <span className="font-bold text-slate-900 dark:text-zinc-100">{user.name}</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-zinc-800">
              <span className="text-slate-600 dark:text-zinc-400 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
                E-mail (Login):
              </span>
              <span className="font-mono text-slate-900 dark:text-zinc-200">{user.email}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-zinc-800">
              <span className="text-slate-600 dark:text-zinc-400 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                Papel / Permissão:
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                user.role === 'master'
                  ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30'
                  : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
              }`}>
                {user.role === 'master' ? 'Super Admin (Master)' : 'Gestor de Unidade'}
              </span>
            </div>

            {user.role === 'manager' && (
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600 dark:text-zinc-400 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Instituição:
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">{institutionName || 'Sem Vínculo'}</span>
              </div>
            )}
          </div>

          {isCurrentUser && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <span>
                <strong>Atenção:</strong> Você está excluindo o seu próprio usuário atualmente logado. Ao confirmar, sua sessão será encerrada imediatamente.
              </span>
            </div>
          )}

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
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
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
