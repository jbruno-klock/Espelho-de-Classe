import React, { useState } from 'react';
import { UserCheck, Plus, Check, X, Shield, Building2, Mail, Phone, AlertCircle, Sparkles, KeyRound, Eye, EyeOff, Trash2 } from 'lucide-react';
import { AppUser, Institution, UserRole } from '../types';
import { AVATAR_COLORS } from '../utils/sampleData';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: AppUser) => void;
  onDelete?: (userId: string) => void;
  institutions: Institution[];
  initialData?: AppUser | null;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  institutions,
  initialData,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>(initialData?.role || 'manager');
  const [institutionId, setInstitutionId] = useState<string>(
    initialData?.institutionId || (institutions[0]?.id || '')
  );
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [isActive, setIsActive] = useState(initialData ? initialData.isActive : true);
  const [avatarColor, setAvatarColor] = useState(
    initialData?.avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
  );
  const [error, setError] = useState('');

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789@#$';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do usuário é obrigatório.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Informe um e-mail corporativo válido.');
      return;
    }
    if (!initialData && !password.trim()) {
      setError('Defina uma senha de acesso para este novo usuário.');
      return;
    }
    if (password && password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }
    if (role === 'manager' && !institutionId) {
      setError('Usuários com perfil de Gestor devem obrigatoriamente estar vinculados a uma Instituição.');
      return;
    }

    const userToSave: AppUser = {
      id: initialData?.id || `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim() || initialData?.password || (role === 'master' ? 'master@fleming2026' : 'gestor@escola2026'),
      role,
      institutionId: role === 'manager' ? institutionId : undefined,
      phone: phone.trim() || undefined,
      isActive,
      avatarColor,
      createdAt: initialData?.createdAt || Date.now(),
      lastLoginAt: initialData?.lastLoginAt,
    };

    onSave(userToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="user-modal-dialog"
        className="bg-white dark:bg-[#121216] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-zinc-100 transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#16161c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 flex items-center justify-center shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base font-display">
                {initialData ? 'Editar Usuário' : 'Novo Usuário (Master / Gestor)'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Definição de Credenciais, Senha e Vínculo Institucional (RBAC)
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-slate-800 dark:text-zinc-300">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              {error}
            </div>
          )}

          {/* Role Selection Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-2">
              Perfil de Acesso (Papel no Sistema) *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('manager')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
                  role === 'manager'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/40 text-slate-900 dark:text-white'
                    : 'bg-slate-50 dark:bg-[#18181f] border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-700 dark:text-emerald-400 mb-1">
                  <Building2 className="w-4 h-4" />
                  Gestor de Instituição
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-snug">
                  Administra turmas, carteiras e alunos apenas da sua instituição vinculada.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRole('master')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
                  role === 'master'
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/40 text-slate-900 dark:text-white'
                    : 'bg-slate-50 dark:bg-[#18181f] border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-purple-700 dark:text-purple-400 mb-1">
                  <Shield className="w-4 h-4" />
                  Super Admin (Master)
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-snug">
                  Acesso irrestrito a todas as instituições, usuários e turmas globais.
                </p>
              </button>
            </div>
          </div>

          {/* Institution Link (Only for Manager) */}
          {role === 'manager' && (
            <div className="p-3.5 bg-slate-50 dark:bg-[#18181f] rounded-2xl border border-emerald-300 dark:border-emerald-500/20 space-y-2">
              <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Vincular a uma Instituição de Ensino *
              </label>
              {institutions.length === 0 ? (
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  Nenhuma instituição cadastrada. Cadastre uma instituição antes de criar um Gestor.
                </p>
              ) : (
                <select
                  value={institutionId}
                  onChange={(e) => setInstitutionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-[#121216] border border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
                >
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id} className="bg-white dark:bg-[#121216] text-slate-900 dark:text-zinc-200">
                      {inst.name} ({inst.code})
                    </option>
                  ))}
                </select>
              )}
              <p className="text-[10px] text-slate-600 dark:text-zinc-400">
                🔒 Regra de Isolamento: Este gestor só terá visibilidade sobre as turmas e alunos desta unidade.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              Nome Completo do Usuário *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Cláudia Valença, Marcos Andrade..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-sm font-medium text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                E-mail de Acesso (Login) *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="gestor@escola.com.br"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-sm text-slate-900 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(82) 99999-0000"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-sm text-slate-900 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#18181f] rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Senha de Acesso {initialData ? '(Deixe em branco para manter a atual)' : '*'}
              </label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-[10px] text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" /> Gerar Aleatória
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={initialData ? '••••••••••••' : 'Defina a senha do usuário'}
                className="w-full pl-3.5 pr-10 py-2 bg-white dark:bg-[#121216] border border-slate-300 dark:border-zinc-700/80 rounded-xl text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-zinc-400">
              O usuário usará este e-mail e senha para realizar o login seguro na plataforma.
            </p>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-[#18181f] rounded-2xl border border-slate-200 dark:border-zinc-800">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">Status da Conta</span>
              <span className="text-[11px] text-slate-600 dark:text-zinc-400">Usuários inativos não conseguem realizar login</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
            {initialData && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(initialData.id);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/30 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Usuário
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {initialData ? 'Salvar Alterações' : 'Criar Usuário'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
