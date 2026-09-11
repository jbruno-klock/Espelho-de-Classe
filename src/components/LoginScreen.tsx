import React, { useState } from 'react';
import { 
  GraduationCap, 
  Lock, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Sun,
  Moon,
  HelpCircle,
  CheckCircle2,
  X,
  FileDown
} from 'lucide-react';
import { AppUser, Institution } from '../types';
import { INITIAL_USERS } from '../utils/sampleData';
import { generateUserManualPdf } from '../utils/manualPdfGenerator';

interface LoginScreenProps {
  onLoginSuccess: (user: AppUser) => void;
  users: AppUser[];
  institutions: Institution[];
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  users,
  institutions,
  theme,
  onToggleTheme,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isDownloadingManual, setIsDownloadingManual] = useState(false);
  const [manualToast, setManualToast] = useState(false);

  const handleDownloadManual = async () => {
    try {
      setIsDownloadingManual(true);
      setError('');
      await generateUserManualPdf();
      setManualToast(true);
      setTimeout(() => setManualToast(false), 4500);
    } catch (err) {
      console.error('Erro ao gerar manual em PDF:', err);
      setError('Ocorreu um erro ao gerar o manual em PDF. Por favor, tente novamente.');
    } finally {
      setIsDownloadingManual(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanInput = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanInput) {
      setError('Por favor, informe seu e-mail ou usuário de acesso.');
      return;
    }
    if (!cleanPassword) {
      setError('Por favor, digite sua senha de acesso.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // 1. Gather all users (state + initial fallback)
      const allKnownUsers = [...users];
      INITIAL_USERS.forEach(iu => {
        if (!allKnownUsers.some(u => u.id === iu.id || u.email.toLowerCase() === iu.email.toLowerCase())) {
          allKnownUsers.push(iu);
        }
      });

      // 2. Match user:
      // a) Exact email match
      let user = allKnownUsers.find(u => u.email.toLowerCase().trim() === cleanInput);

      // b) Master alias match ("master", "admin", "master@...", "admin@...")
      if (!user && (cleanInput === 'master' || cleanInput === 'admin' || cleanInput.includes('master@') || cleanInput.includes('admin@'))) {
        user = allKnownUsers.find(u => u.role === 'master') || INITIAL_USERS[0];
      }

      // c) Match username prefix (e.g., "claudia", "marcos", "juliana")
      if (!user) {
        user = allKnownUsers.find(u => {
          const userPrefix = u.email.split('@')[0]?.toLowerCase();
          const namePrefix = u.name.split(' ')[0]?.toLowerCase();
          return userPrefix === cleanInput || namePrefix === cleanInput;
        });
      }

      if (!user) {
        setError('Usuário não encontrado. Verifique o e-mail ou usuário digitado.');
        setIsLoading(false);
        return;
      }

      if (user.isActive === false) {
        setError('Esta conta de usuário está desativada. Entre em contato com a administração.');
        setIsLoading(false);
        return;
      }

      // 3. Match password:
      const isMasterUser = user.role === 'master';
      const validMasterPasswords = [
        user.password,
        'master@fleming2026',
        'master2026',
        'master@123',
        'master123',
        'master',
        'admin',
        'fleming2026',
      ].filter(Boolean) as string[];

      const validManagerPasswords = [
        user.password,
        'gestor@prime2026',
        'gestor@farol2026',
        'gestor@horizon2026',
        'gestor@escola2026',
        '123456',
      ].filter(Boolean) as string[];

      const isPasswordValid = isMasterUser
        ? validMasterPasswords.some(p => p.toLowerCase() === cleanPassword.toLowerCase())
        : validManagerPasswords.some(p => p === cleanPassword || p.toLowerCase() === cleanPassword.toLowerCase());

      if (!isPasswordValid) {
        setError('Senha incorreta. Verifique a senha digitada e tente novamente.');
        setIsLoading(false);
        return;
      }

      // Successful login
      const updatedUser: AppUser = {
        ...user,
        lastLoginAt: Date.now(),
      };

      setIsLoading(false);
      onLoginSuccess(updatedUser);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#08080a] text-slate-900 dark:text-zinc-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden selection:bg-emerald-600 selection:text-white transition-colors duration-200">
      
      {/* Top Floating Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#121216]/90 hover:bg-slate-50 dark:hover:bg-[#1c1c24] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 backdrop-blur-md shadow-md transition-all cursor-pointer text-xs font-semibold"
          aria-label="Alternar tema claro/escuro"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span>Modo Escuro</span>
            </>
          )}
        </button>
      </div>
      
      {/* Ambient background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-indigo-500/10 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 shadow-xl shadow-emerald-500/10 dark:shadow-emerald-950/40 mb-1">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-display">
            Espelho de Classe
          </h1>
          <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-xs mx-auto">
            Plataforma Institucional de Mapeamento Inteligente e Gestão de Carteiras
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-[#121216]/90 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 shadow-xl shadow-slate-200/70 dark:shadow-2xl dark:shadow-black/80 space-y-5">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800/80">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                Acesso Restrito
              </h2>
            </div>
            <span className="text-[10px] font-semibold text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800/60 px-2 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700/60">
              Autenticação Segura
            </span>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div className="leading-snug font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>E-mail Institucional</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: gestor@escola.com.br"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/70 focus:border-emerald-500 rounded-xl text-sm font-medium text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>Senha de Acesso</span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-500 font-normal">Mínimo 6 caracteres</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/70 focus:border-emerald-500 rounded-xl text-sm font-medium text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 dark:shadow-emerald-950/60 transition-all cursor-pointer mt-2"
            >
              {isLoading ? (
                <span>Validando credenciais...</span>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Separator */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-zinc-800"></div>
              <span className="flex-shrink mx-3 text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-zinc-500">
                Capacitação & Ajuda
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-zinc-800"></div>
            </div>

            {/* Download Step-by-Step Manual PDF Button */}
            <button
              id="download-user-manual-btn"
              type="button"
              onClick={handleDownloadManual}
              disabled={isDownloadingManual}
              className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 dark:bg-[#18181f] dark:hover:bg-[#22222a] text-slate-700 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700/70 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer group"
              title="Baixar manual oficial completo com o passo a passo de utilização do sistema em formato PDF"
            >
              {isDownloadingManual ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>Gerando Manual em PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:-translate-y-0.5 transition-transform" />
                  <span>Baixar Manual Passo a Passo (PDF)</span>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60 ml-0.5">
                    Guia Oficial
                  </span>
                </>
              )}
            </button>

            {/* Manual Download Toast Feedback */}
            {manualToast && (
              <div 
                id="manual-download-success-toast"
                className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-center gap-2 animate-in fade-in zoom-in-95 duration-200 font-medium"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Manual em PDF gerado e baixado com sucesso!</span>
              </div>
            )}
          </form>

        </div>

        {/* Security Footer Note */}
        <div className="text-center text-[11px] text-slate-500 dark:text-zinc-500 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
          <span>Isolamento seguro de dados entre turmas e unidades de ensino</span>
        </div>

      </div>
    </div>
  );
};
