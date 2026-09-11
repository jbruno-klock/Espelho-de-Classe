import React, { useRef, useState } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Settings, 
  Users, 
  Grid, 
  Printer, 
  Download, 
  RotateCcw,
  Sparkles,
  ChevronDown,
  Layers,
  HeartHandshake,
  Edit3,
  Trash2,
  Shield,
  Building2,
  UserCheck,
  LogOut,
  ArrowLeft,
  KeyRound,
  Sun,
  Moon,
  Cloud,
  FileText
} from 'lucide-react';
import { Classroom, AppUser, Institution } from '../types';
import { generateUserManualPdf } from '../utils/manualPdfGenerator';

interface NavbarProps {
  currentUser: AppUser;
  activeInstitution?: Institution;
  allInstitutions: Institution[];
  allUsers: AppUser[];
  classrooms: Classroom[];
  activeClassroom: Classroom;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSelectClassroom: (id: string) => void;
  onOpenNewClassModal: () => void;
  onOpenEditClassModal: () => void;
  onOpenDeleteClassModal: () => void;
  onOpenRoomConfigModal: () => void;
  onOpenStudentListModal: () => void;
  onOpenAffinityMatrixModal: () => void;
  onOpenBatchImportModal: () => void;
  onPrintPreview: () => void;
  onExportPDF: () => void;
  onExportBackup: () => void;
  onImportBackup: (data: Classroom[]) => void;
  onResetToSample: () => void;
  onLogout: () => void;
  activeTab: 'map' | 'students' | 'matrix' | 'print' | 'master_admin';
  setActiveTab: (tab: 'map' | 'students' | 'matrix' | 'print' | 'master_admin') => void;
  onSwitchSimulatedUser: (user: AppUser) => void;
  onReturnToMasterDashboard?: () => void;
  onForceSync?: () => Promise<void>;
  onOpenInstitutionSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeInstitution,
  allInstitutions,
  allUsers,
  classrooms,
  activeClassroom,
  theme,
  onToggleTheme,
  onSelectClassroom,
  onOpenNewClassModal,
  onOpenEditClassModal,
  onOpenDeleteClassModal,
  onOpenRoomConfigModal,
  onOpenBatchImportModal,
  onExportPDF,
  onExportBackup,
  onImportBackup,
  onResetToSample,
  onLogout,
  activeTab,
  setActiveTab,
  onSwitchSimulatedUser,
  onReturnToMasterDashboard,
  onForceSync,
  onOpenInstitutionSettings,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleManualSync = async () => {
    if (onForceSync) {
      setIsSyncingCloud(true);
      try {
        await onForceSync();
        setSyncFeedback('Sincronizado!');
        setTimeout(() => setSyncFeedback(null), 2500);
      } catch (err) {
        setSyncFeedback('Erro ao sincronizar');
        setTimeout(() => setSyncFeedback(null), 3000);
      } finally {
        setIsSyncingCloud(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json) && json.length > 0 && json[0].roomConfig) {
          onImportBackup(json);
        } else {
          alert('Arquivo JSON inválido. Certifique-se de selecionar um backup exportado por este aplicativo.');
        }
      } catch (err) {
        alert('Erro ao carregar o arquivo JSON.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isMaster = currentUser.role === 'master';

  return (
    <header className="bg-white dark:bg-[#121216] border-b border-slate-200 dark:border-zinc-800/80 sticky top-0 z-40 backdrop-blur-md w-full transition-colors">
      {/* Upper Status & RBAC Switcher Bar */}
      <div className="bg-slate-50 dark:bg-[#0e0e12] w-full px-3 sm:px-6 lg:px-8 py-1.5 border-b border-slate-200 dark:border-zinc-800/60 flex items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          {/* User Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
              style={{ backgroundColor: currentUser.avatarColor || '#10b981' }}
            >
              {currentUser.name.slice(0, 1)}
            </div>
            <span className="font-semibold text-slate-800 dark:text-zinc-200 text-xs truncate max-w-[120px] sm:max-w-none">
              {currentUser.name}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isMaster 
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
            }`}>
              {isMaster ? 'Master' : 'Gestor'}
            </span>
          </div>

          {/* Current Active Institution indicator */}
          {activeInstitution && (
            <div className="hidden sm:flex items-center gap-1.5 text-slate-600 dark:text-zinc-400 pl-2.5 border-l border-slate-200 dark:border-zinc-800/80">
              <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Unidade:</span>
              <strong className="text-slate-800 dark:text-zinc-200 font-semibold text-xs truncate max-w-[160px] md:max-w-xs">{activeInstitution.name}</strong>
              <span className="font-mono text-[10px] text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800/40 font-bold shrink-0">
                {activeInstitution.code}
              </span>
              {isMaster && onOpenInstitutionSettings && (
                <button
                  onClick={onOpenInstitutionSettings}
                  title="Configurações da Instituição (Logotipo, Dados e Contatos)"
                  className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right side controls in Upper Bar */}
        <div className="flex items-center gap-2 shrink-0">
          {isMaster && (
            <button
              onClick={() => setActiveTab(activeTab === 'master_admin' ? 'map' : 'master_admin')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'master_admin'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-800/40'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{activeTab === 'master_admin' ? 'Voltar p/ Sala' : 'Painel Master'}</span>
            </button>
          )}

          {/* Cloud Sync Status Badge / Button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncingCloud}
            title="Clique para forçar sincronização imediata com o Firestore"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-400 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <Cloud className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isSyncingCloud ? 'animate-spin' : 'animate-pulse'}`} />
            <span className="hidden md:inline">{syncFeedback || (isSyncingCloud ? 'Sincronizando...' : 'Nuvem Ativa')}</span>
          </button>

          {/* User selector for Master testing only */}
          {isMaster && (
            <div className="relative group hidden lg:block">
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const target = allUsers.find(u => u.id === e.target.value);
                  if (target) onSwitchSimulatedUser(target);
                }}
                title="Trocar usuário simulado para testar isolamento (Apenas Master)"
                className="bg-white dark:bg-[#18181f] text-slate-800 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-zinc-700/80 rounded-lg text-[11px] font-medium py-1 px-2.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <optgroup label="Simular como Usuário:">
                  {allUsers.map((u) => {
                    const inst = allInstitutions.find(i => i.id === u.institutionId);
                    return (
                      <option key={u.id} value={u.id} className="bg-white dark:bg-[#18181f] text-slate-800 dark:text-zinc-200">
                        {u.role === 'master' ? '👑 [Master] ' : '🏫 [Gestor] '}
                        {u.name} {inst ? `(${inst.code})` : ''}
                      </option>
                    );
                  })}
                </optgroup>
              </select>
            </div>
          )}

          {/* Theme Toggle Button in Top Bar */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[#18181f] dark:hover:bg-[#202028] text-slate-700 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700/80 transition-all cursor-pointer shadow-xs"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden md:inline">Escuro</span>
              </>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            title="Encerrar sessão e voltar à tela de login"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/40 hover:border-rose-400 transition-all cursor-pointer shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sair</span>
          </button>
        </div>
      </div>

      {/* Main Bar */}
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-16 py-2 gap-3 flex-wrap lg:flex-nowrap">
          
          {/* Left: Brand & Classroom Selector */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap shrink-0">
            <div 
              onClick={() => setActiveTab('map')}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 flex items-center justify-center shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base text-slate-900 dark:text-zinc-100 tracking-tight font-display">
                    Espelho de Classe
                  </span>
                  {activeInstitution ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-md border border-emerald-300 dark:border-emerald-500/20">
                      {activeInstitution.code}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-400 rounded-md border border-purple-300 dark:border-purple-500/20">
                      Master Hub
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Active Classroom Selector with action buttons */}
            {activeTab !== 'master_admin' && (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#18181f]/90 p-1 rounded-xl border border-slate-300 dark:border-zinc-800/80 shadow-xs">
                <div className="relative group">
                  <select
                    value={activeClassroom?.id || ''}
                    onChange={(e) => onSelectClassroom(e.target.value)}
                    className="appearance-none bg-transparent hover:bg-slate-200 dark:hover:bg-[#202028] transition-colors text-slate-900 dark:text-zinc-200 font-bold text-xs sm:text-sm rounded-lg py-1.5 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer max-w-[150px] sm:max-w-[210px] truncate"
                  >
                    {classrooms.length === 0 ? (
                      <option value="" disabled className="bg-white dark:bg-[#18181f] text-slate-500 dark:text-zinc-400">
                        Nenhuma turma
                      </option>
                    ) : (
                      classrooms.map((cls) => (
                        <option key={cls.id} value={cls.id} className="bg-white dark:bg-[#18181f] text-slate-900 dark:text-zinc-200">
                          {cls.name} ({cls.students.length} alunos)
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="h-4 w-px bg-slate-300 dark:bg-zinc-800 mx-0.5" />

                <button
                  id="new-classroom-btn"
                  onClick={onOpenNewClassModal}
                  title="Criar nova turma nesta instituição"
                  className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-slate-700 hover:text-emerald-700 dark:text-zinc-300 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                {activeClassroom && (
                  <>
                    <button
                      id="edit-classroom-btn"
                      onClick={onOpenEditClassModal}
                      title="Editar dados da turma atual"
                      className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-slate-700 hover:text-emerald-700 dark:text-zinc-300 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id="delete-classroom-btn"
                      onClick={onOpenDeleteClassModal}
                      title="Excluir turma atual"
                      className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-500 hover:text-rose-700 dark:text-zinc-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id="room-config-btn"
                      onClick={onOpenRoomConfigModal}
                      title="Configurar layout e dimensões da sala"
                      className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-slate-700 hover:text-emerald-700 dark:text-zinc-300 dark:hover:text-emerald-400 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline text-[11px]">Layout Sala</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Center: Navigation Tabs (Desktop) */}
          {activeTab !== 'master_admin' && (
            <div className="hidden lg:flex items-center bg-slate-100 dark:bg-[#18181f] p-1 rounded-xl border border-slate-300 dark:border-zinc-800/80 shadow-xs">
              <button
                onClick={() => setActiveTab('map')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'map'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/70 dark:hover:bg-zinc-800/40'
                }`}
              >
                <Grid className="w-4 h-4" />
                Mapa Interativo
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'students'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/70 dark:hover:bg-zinc-800/40'
                }`}
              >
                <Users className="w-4 h-4" />
                Alunos ({activeClassroom?.students?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('matrix')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'matrix'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/70 dark:hover:bg-zinc-800/40'
                }`}
              >
                <HeartHandshake className="w-4 h-4" />
                Proximidade
              </button>
              <button
                onClick={() => setActiveTab('print')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'print'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/70 dark:hover:bg-zinc-800/40'
                }`}
              >
                <Printer className="w-4 h-4" />
                Impressão / PDF
              </button>
            </div>
          )}

          {/* Right: Quick Actions & Export Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            {activeTab !== 'master_admin' && (
              <button
                onClick={onExportPDF}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Baixar PDF</span>
              </button>
            )}

            {/* More Menu */}
            <div className="relative group">
              <button 
                title="Mais ferramentas e opções"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#18181f] dark:hover:bg-[#202028] text-slate-700 dark:text-zinc-300 transition-colors border border-slate-300 dark:border-zinc-800 cursor-pointer shadow-xs"
              >
                <Layers className="w-4 h-4" />
              </button>

              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#16161b] rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 py-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-200 dark:border-zinc-800">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Importação & Exportação</p>
                </div>

                <button
                  onClick={onOpenBatchImportModal}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100 flex items-center gap-2.5 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Importar Alunos em Massa
                </button>

                <button
                  onClick={() => generateUserManualPdf()}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100 flex items-center gap-2.5 cursor-pointer"
                  title="Baixar manual oficial completo com o passo a passo em PDF"
                >
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Manual do Usuário (PDF)
                </button>

                <button
                  onClick={onExportBackup}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100 flex items-center gap-2.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Salvar Backup Completo (JSON)
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100 flex items-center gap-2.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Restaurar Backup (JSON)
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />

                <div className="my-1 border-t border-slate-200 dark:border-zinc-800"></div>

                <button
                  onClick={onResetToSample}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30 flex items-center gap-2.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Restaurar Dados Padrão
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Mobile Navigation Tabs */}
        {activeTab !== 'master_admin' && (
          <div className="flex lg:hidden overflow-x-auto py-2 gap-1 border-t border-slate-200 dark:border-zinc-800/80">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                activeTab === 'map' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Mapa
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                activeTab === 'students' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Alunos ({activeClassroom?.students?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                activeTab === 'matrix' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              Proximidade
            </button>
            <button
              onClick={() => setActiveTab('print')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                activeTab === 'print' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              Impressão
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
