import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserCheck, 
  Plus, 
  Check, 
  X, 
  Shield, 
  Building2, 
  Mail, 
  Phone, 
  AlertCircle, 
  Sparkles, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Trash2, 
  Copy, 
  ExternalLink, 
  CheckCircle2, 
  Send,
  MessageSquare,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppUser, Institution, UserRole } from '../types';
import { AVATAR_COLORS } from '../utils/sampleData';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: AppUser) => void;
  onDelete?: (userId: string) => void;
  institutions: Institution[];
  initialData?: AppUser | null;
  initialTab?: 'form' | 'credentials';
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  institutions,
  initialData,
  initialTab = 'form',
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'credentials'>(initialTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCredentialsPassword, setShowCredentialsPassword] = useState(true);
  const [role, setRole] = useState<UserRole>('manager');
  const [institutionId, setInstitutionId] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [error, setError] = useState('');

  // Post-creation / Saved user state for the credentials tab
  const [savedUser, setSavedUser] = useState<AppUser | null>(null);
  const [justCreated, setJustCreated] = useState(false);

  // Copy feedback state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Sync state whenever modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setEmail(initialData.email || '');
        setPassword(initialData.password || '');
        setRole(initialData.role || 'manager');
        setInstitutionId(initialData.institutionId || (institutions[0]?.id || ''));
        setPhone(initialData.phone || '');
        setIsActive(initialData.isActive ?? true);
        setAvatarColor(initialData.avatarColor || AVATAR_COLORS[0]);
        setSavedUser(initialData);
        setActiveTab(initialTab);
      } else {
        // Reset form for fresh user creation
        setName('');
        setEmail('');
        setPassword('');
        setRole('manager');
        setInstitutionId(institutions[0]?.id || '');
        setPhone('');
        setIsActive(true);
        setAvatarColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
        setSavedUser(null);
        setActiveTab('form');
      }
      setShowPassword(false);
      setShowCredentialsPassword(true);
      setError('');
      setJustCreated(false);
      setCopiedField(null);
    }
  }, [isOpen, initialData, initialTab, institutions]);

  // Derive target user to display on credentials tab
  const displayUser: AppUser | null = useMemo(() => {
    if (savedUser) return savedUser;
    if (initialData) return initialData;
    if (name.trim() || email.trim()) {
      return {
        id: 'preview',
        name: name.trim() || 'Novo Usuário',
        email: email.trim().toLowerCase() || 'usuario@escola.com.br',
        password: password.trim() || '••••••••',
        role,
        institutionId: role === 'manager' ? institutionId : undefined,
        phone: phone.trim() || undefined,
        isActive,
        avatarColor,
      };
    }
    return null;
  }, [savedUser, initialData, name, email, password, role, institutionId, phone, isActive, avatarColor]);

  // Institutional info
  const userInstitution = useMemo(() => {
    const targetInstId = displayUser?.institutionId || institutionId;
    return institutions.find(i => i.id === targetInstId);
  }, [displayUser, institutionId, institutions]);

  // Clean Login URL
  const loginUrl = useMemo(() => {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.origin + window.location.pathname;
    }
    return 'https://app.espelhodeclasse.com.br';
  }, []);

  // Pre-formatted invitation text for WhatsApp, E-mail or clipboard
  const formattedShareMessage = useMemo(() => {
    if (!displayUser) return '';
    const userRoleText = displayUser.role === 'master' 
      ? 'Super Administrador (Master)' 
      : 'Gestor de Unidade Escolar';

    let text = `*ACESSO AO ESPELHO DE CLASSE*\n\n`;
    text += `Olá, *${displayUser.name}*!\n`;
    text += `Seu cadastro no sistema foi realizado com sucesso. Seguem seus dados de acesso:\n\n`;
    text += `🔗 *Link para Acesso:* ${loginUrl}\n`;
    text += `👤 *E-mail de Login:* ${displayUser.email}\n`;
    text += `🔑 *Senha:* ${displayUser.password || password || 'A senha definida no cadastro'}\n`;
    text += `🛡️ *Perfil:* ${userRoleText}\n`;
    if (displayUser.role === 'manager' && userInstitution) {
      text += `🏫 *Instituição:* ${userInstitution.name} (${userInstitution.code})\n`;
    }
    text += `\nPara entrar, basta acessar o link acima e inserir seu e-mail e senha. Bom trabalho!`;
    return text;
  }, [displayUser, loginUrl, password, userInstitution]);

  // Copy helper with iframe fallback
  const handleCopy = async (textToCopy: string, fieldId: string) => {
    let success = false;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        success = true;
      }
    } catch {
      success = false;
    }

    if (!success) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (err) {
        console.error('Copy fallback error:', err);
      }
    }

    setCopiedField(fieldId);
    setTimeout(() => {
      setCopiedField((curr) => (curr === fieldId ? null : curr));
    }, 2500);
  };

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

    const finalPassword = password.trim() || initialData?.password || (role === 'master' ? 'master@fleming2026' : 'gestor@escola2026');

    const userToSave: AppUser = {
      id: initialData?.id || `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: finalPassword,
      role,
      institutionId: role === 'manager' ? institutionId : undefined,
      phone: phone.trim() || undefined,
      isActive,
      avatarColor,
      createdAt: initialData?.createdAt || Date.now(),
      lastLoginAt: initialData?.lastLoginAt,
    };

    // Save user to state & cloud
    onSave(userToSave);
    setSavedUser(userToSave);
    setJustCreated(true);
    setError('');

    // Switch to credentials tab
    setActiveTab('credentials');

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  const handleResetForNewUser = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('manager');
    setInstitutionId(institutions[0]?.id || '');
    setPhone('');
    setIsActive(true);
    setAvatarColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
    setSavedUser(null);
    setJustCreated(false);
    setError('');
    setActiveTab('form');
  };

  // Build WhatsApp link
  const whatsappUrl = useMemo(() => {
    if (!displayUser) return '';
    const cleanPhone = (displayUser.phone || phone || '').replace(/\D/g, '');
    const phoneParam = cleanPhone.length >= 10 ? (cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`) : '';
    const encoded = encodeURIComponent(formattedShareMessage);
    return phoneParam ? `https://api.whatsapp.com/send?phone=${phoneParam}&text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
  }, [displayUser, phone, formattedShareMessage]);

  // Build Mailto link
  const mailtoUrl = useMemo(() => {
    if (!displayUser) return '';
    const subject = encodeURIComponent('Suas Credenciais de Acesso - Espelho de Classe');
    const body = encodeURIComponent(formattedShareMessage.replace(/\*/g, ''));
    return `mailto:${encodeURIComponent(displayUser.email)}?subject=${subject}&body=${body}`;
  }, [displayUser, formattedShareMessage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="user-modal-dialog"
        className="bg-white dark:bg-[#121216] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh] text-slate-900 dark:text-zinc-100 transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#16161c]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs border ${
              activeTab === 'credentials'
                ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-500/30'
                : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/20'
            }`}>
              {activeTab === 'credentials' ? <KeyRound className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base font-display flex items-center gap-2">
                {initialData ? 'Gerenciar Usuário' : 'Novo Usuário do Sistema'}
                {role === 'master' ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 uppercase">
                    Admin Master
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 uppercase">
                    Gestor
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                {activeTab === 'credentials' 
                  ? 'Copie ou envie o link e credenciais de login para o usuário'
                  : 'Definição de perfil, senha e permissões de acesso (RBAC)'}
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

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-zinc-800 bg-slate-100/70 dark:bg-[#15151c] px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-t-2 cursor-pointer ${
              activeTab === 'form'
                ? 'bg-white dark:bg-[#121216] text-slate-900 dark:text-white border-emerald-600 dark:border-emerald-500 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 border-transparent hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/50 dark:hover:bg-zinc-800/40'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>1. Dados Cadastrais</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (displayUser) {
                setActiveTab('credentials');
              }
            }}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-t-2 cursor-pointer relative ${
              activeTab === 'credentials'
                ? 'bg-white dark:bg-[#121216] text-indigo-700 dark:text-indigo-400 border-indigo-600 dark:border-indigo-500 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 border-transparent hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/50 dark:hover:bg-zinc-800/40'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>2. Credenciais de Login</span>
            {justCreated && (
              <span className="ml-1 px-1.5 py-0.2 text-[9px] font-extrabold bg-emerald-500 text-white rounded-full animate-pulse">
                Salvo!
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: FORM (DADOS CADASTRAIS) */}
        {activeTab === 'form' && (
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
                    Administra turmas, carteiras e alunos da sua instituição vinculada.
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
                    Acesso global a todas as instituições, usuários e relatórios.
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
                  🔒 Regra de Isolamento: Este gestor só terá acesso aos dados da unidade selecionada.
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
                  Telefone / WhatsApp (para envio)
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
                  className="w-full pl-3.5 pr-10 py-2 bg-white dark:bg-[#121216] border border-slate-300 dark:border-zinc-700/80 rounded-xl text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs font-mono"
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
                Ao clicar em salvar, você verá a tela com as opções de copiar e enviar estas credenciais.
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
                  Excluir
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
                  {initialData ? 'Salvar & Ver Credenciais' : 'Criar Usuário & Gerar Credenciais'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: CREDENCIAIS DE LOGIN & ENVIO */}
        {activeTab === 'credentials' && (
          <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-slate-800 dark:text-zinc-300 animate-in fade-in duration-150">
            
            {/* Success Banner if just created or updated */}
            {justCreated && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">
                      Usuário Cadastrado com Sucesso!
                    </h4>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      As credenciais abaixo já estão ativas para login. Envie os dados ao novo gestor/admin.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white uppercase tracking-wider shrink-0">
                  Ativo
                </span>
              </div>
            )}

            {/* User Identity Chip */}
            {displayUser && (
              <div className="p-3.5 bg-slate-50 dark:bg-[#18181f] rounded-2xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs"
                    style={{ backgroundColor: displayUser.avatarColor || '#6366f1' }}
                  >
                    {displayUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-zinc-100 text-sm truncate">
                      {displayUser.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 truncate flex items-center gap-1.5 font-medium">
                      {displayUser.role === 'master' ? (
                        <span className="text-purple-700 dark:text-purple-400 font-bold flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" /> Super Admin (Master)
                        </span>
                      ) : (
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" /> Gestor {userInstitution ? `• ${userInstitution.name}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  Editar Dados
                </button>
              </div>
            )}

            {/* Individual Credential Fields */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                Credenciais Individuais de Acesso
              </label>

              {/* 1. Link para Acesso */}
              <div className="p-3 bg-slate-50 dark:bg-[#18181f] rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Link para Acesso ao Sistema
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400">URL Direta</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={loginUrl}
                    className="flex-1 px-3 py-2 bg-white dark:bg-[#121216] border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-slate-800 dark:text-zinc-200 select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(loginUrl, 'link')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      copiedField === 'link'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700'
                    }`}
                  >
                    {copiedField === 'link' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 2. E-mail de Login */}
              <div className="p-3 bg-slate-50 dark:bg-[#18181f] rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    E-mail de Login
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400">Usuário</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={displayUser?.email || email}
                    className="flex-1 px-3 py-2 bg-white dark:bg-[#121216] border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-zinc-200 select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(displayUser?.email || email, 'email')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      copiedField === 'email'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700'
                    }`}
                  >
                    {copiedField === 'email' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar E-mail</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 3. Senha de Acesso */}
              <div className="p-3 bg-slate-50 dark:bg-[#18181f] rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Senha de Acesso
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCredentialsPassword(!showCredentialsPassword)}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showCredentialsPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showCredentialsPassword ? 'Ocultar Senha' : 'Ver Senha'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type={showCredentialsPassword ? 'text' : 'password'}
                    readOnly
                    value={displayUser?.password || password || ''}
                    className="flex-1 px-3 py-2 bg-white dark:bg-[#121216] border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-zinc-200 select-all focus:outline-none tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(displayUser?.password || password || '', 'password')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      copiedField === 'password'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700'
                    }`}
                  >
                    {copiedField === 'password' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Senha</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Card: Mensagem Completa Pronta para Envio */}
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Mensagem Formatada Pronta para Enviar ao Usuário
                </span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                  WhatsApp & E-mail
                </span>
              </div>

              {/* Message Box */}
              <div className="p-3 bg-white dark:bg-[#121216] rounded-xl border border-indigo-100 dark:border-indigo-900/30 text-xs text-slate-700 dark:text-zinc-300 font-sans whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto custom-scrollbar select-all">
                {formattedShareMessage}
              </div>

              {/* Dispatch Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <button
                  type="button"
                  id="btn-copy-full-credentials"
                  onClick={() => handleCopy(formattedShareMessage, 'full-message')}
                  className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                    copiedField === 'full-message'
                      ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                  }`}
                >
                  {copiedField === 'full-message' ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Mensagem Completa Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Mensagem Completa</span>
                    </>
                  )}
                </button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                  title="Abrir WhatsApp para enviar"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={mailtoUrl}
                  className="py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 cursor-pointer shadow-xs"
                  title="Enviar por e-mail"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>E-mail</span>
                </a>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleResetForNewUser}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 cursor-pointer py-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Cadastrar Outro Usuário
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  Voltar para Dados
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Concluir e Fechar
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
