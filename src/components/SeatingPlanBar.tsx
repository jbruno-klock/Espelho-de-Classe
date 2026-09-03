import React, { useState } from 'react';
import { 
  Bookmark, 
  Plus, 
  Copy, 
  Edit3, 
  Trash2, 
  Star, 
  Check, 
  ChevronDown, 
  Clock, 
  Users, 
  FileText, 
  ClipboardList, 
  FlaskConical, 
  Users2, 
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Classroom, SavedSeatingPlan, SeatingPlanCategory } from '../types';
import { 
  ensureClassroomPlans, 
  SEATING_PLAN_PRESETS 
} from '../utils/seatingPlanUtils';

interface SeatingPlanBarProps {
  classroom: Classroom;
  onSwitchPlan: (planId: string) => void;
  onCreatePlan: (name: string, category: SeatingPlanCategory, initialMode: 'copy_current' | 'blank' | 'clean_unlocked', description?: string) => void;
  onDuplicatePlan: (planId: string, customName?: string) => void;
  onRenamePlan: (planId: string, newName: string, category?: SeatingPlanCategory, description?: string) => void;
  onDeletePlan: (planId: string) => void;
  onSetDefaultPlan: (planId: string) => void;
  onSaveCurrentSnapshot: () => void;
  saveFeedback?: string | null;
}

export const SeatingPlanBar: React.FC<SeatingPlanBarProps> = ({
  classroom,
  onSwitchPlan,
  onCreatePlan,
  onDuplicatePlan,
  onRenamePlan,
  onDeletePlan,
  onSetDefaultPlan,
  onSaveCurrentSnapshot,
  saveFeedback,
}) => {
  const { plans, activePlan, activePlanId } = ensureClassroomPlans(classroom);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [planToRename, setPlanToRename] = useState<SavedSeatingPlan | null>(null);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanCategory, setNewPlanCategory] = useState<SeatingPlanCategory>('custom');
  const [newPlanDescription, setNewPlanDescription] = useState('');
  const [initialMode, setInitialMode] = useState<'copy_current' | 'blank' | 'clean_unlocked'>('copy_current');
  const [deleteConfirmPlanId, setDeleteConfirmPlanId] = useState<string | null>(null);

  // Helper for category badge and icon
  const getCategoryIcon = (category?: SeatingPlanCategory) => {
    switch (category) {
      case 'official':
        return <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />;
      case 'exam':
        return <ClipboardList className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
      case 'test':
        return <FlaskConical className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
      case 'group':
        return <Users2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
    }
  };

  const getCategoryLabel = (category?: SeatingPlanCategory) => {
    switch (category) {
      case 'official': return 'Oficial';
      case 'exam': return 'Dia de Prova';
      case 'test': return 'Teste / Simulado';
      case 'group': return 'Grupos / Duplas';
      default: return 'Personalizado';
    }
  };

  // Count assigned students in plan
  const countAssigned = (plan: SavedSeatingPlan) => {
    const map = plan.id === activePlanId ? (classroom.seatingMap || {}) : (plan.seatingMap || {});
    return Object.values(map).filter(Boolean).length;
  };

  const totalStudents = classroom.students.length;

  const handleOpenCreate = (preset?: { name: string; category: SeatingPlanCategory; description: string }) => {
    if (preset) {
      setNewPlanName(preset.name);
      setNewPlanCategory(preset.category);
      setNewPlanDescription(preset.description);
    } else {
      setNewPlanName('');
      setNewPlanCategory('custom');
      setNewPlanDescription('');
    }
    setInitialMode('copy_current');
    setIsCreateModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handleConfirmCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;
    onCreatePlan(newPlanName.trim(), newPlanCategory, initialMode, newPlanDescription.trim());
    setIsCreateModalOpen(false);
    setNewPlanName('');
  };

  const handleOpenRename = (plan: SavedSeatingPlan, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPlanToRename(plan);
    setNewPlanName(plan.name);
    setNewPlanCategory(plan.category || 'custom');
    setNewPlanDescription(plan.description || '');
    setIsRenameModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handleConfirmRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planToRename || !newPlanName.trim()) return;
    onRenamePlan(planToRename.id, newPlanName.trim(), newPlanCategory, newPlanDescription.trim());
    setIsRenameModalOpen(false);
    setPlanToRename(null);
  };

  const handleDeletePlanConfirm = (planId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (plans.length <= 1) return;
    onDeletePlan(planId);
    setDeleteConfirmPlanId(null);
  };

  return (
    <div className="bg-white dark:bg-[#121216] rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-xs p-3 sm:p-4 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Left: Espelho Selector Dropdown & Quick Switching Pills */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/40 flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 block leading-none">
                Espelho Ativo da Turma
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-300">
                {plans.length} {plans.length === 1 ? 'espelho salvo' : 'espelhos salvos'}
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-zinc-800 hidden sm:block mx-1" />

          {/* Active Plan Selector Button / Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              id="active-plan-selector-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#18181f] dark:hover:bg-[#202028] text-slate-900 dark:text-zinc-100 border border-slate-300 dark:border-zinc-700/80 font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer min-w-[200px] justify-between"
            >
              <div className="flex items-center gap-2 truncate">
                {getCategoryIcon(activePlan.category)}
                <span className="truncate">{activePlan.name}</span>
                {activePlan.isDefault && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-800/40 shrink-0">
                    Oficial
                  </span>
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {/* Dropdown Menu of Saved Plans */}
            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsDropdownOpen(false)} 
                />
                <div className="absolute left-0 top-full mt-1.5 w-80 sm:w-96 bg-white dark:bg-[#16161c] rounded-2xl border border-slate-200 dark:border-zinc-700/80 shadow-xl z-40 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                      Espelhos Desta Turma
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenCreate()}
                      className="text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Novo Espelho
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-1 py-1 pr-1">
                    {plans.map((plan) => {
                      const isActive = plan.id === activePlanId;
                      const assigned = countAssigned(plan);

                      return (
                        <div
                          key={plan.id}
                          onClick={() => {
                            onSwitchPlan(plan.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`group flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer border ${
                            isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-bold'
                              : 'hover:bg-slate-50 dark:hover:bg-[#1f1f27] border-transparent text-slate-800 dark:text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            {getCategoryIcon(plan.category)}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="truncate font-semibold text-slate-900 dark:text-zinc-100">
                                  {plan.name}
                                </span>
                                {plan.isDefault && (
                                  <span className="text-[9px] font-bold px-1 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                                    Oficial
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                                <span>{assigned}/{totalStudents} alunos alocados</span>
                                <span>•</span>
                                <span>{getCategoryLabel(plan.category)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Plan Item Actions */}
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {!plan.isDefault && (
                              <button
                                type="button"
                                onClick={() => onSetDefaultPlan(plan.id)}
                                title="Definir como Espelho Oficial da turma"
                                className="p-1 rounded-md text-slate-400 hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                              >
                                <Star className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => onDuplicatePlan(plan.id)}
                              title="Duplicar este espelho"
                              className="p-1 rounded-md text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleOpenRename(plan, e)}
                              title="Renomear ou editar detalhes"
                              className="p-1 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {plans.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmPlanId(plan.id)}
                                title="Excluir este espelho"
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => handleOpenCreate()}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Criar Novo Espelho para esta Turma
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Segmented Pills for fast 1-click switching (if multiple plans) */}
          <div className="hidden xl:flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-zinc-800">
            {plans.map((p) => {
              const isSelected = p.id === activePlanId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSwitchPlan(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-[#18181f] dark:hover:bg-[#22222a] text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800'
                  }`}
                  title={`Alternar para ${p.name}`}
                >
                  {getCategoryIcon(p.category)}
                  <span className="truncate max-w-[130px]">{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Actions (Criar Novo, Salvar / Salvar Como, Duplicar) */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {saveFeedback && (
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800/40 animate-in fade-in duration-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {saveFeedback}
            </span>
          )}

          {/* Botão Snapshot / Salvar Alterações */}
          <button
            type="button"
            onClick={onSaveCurrentSnapshot}
            title="Salvar alterações do mapa neste espelho agora"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer border border-slate-300 dark:border-zinc-700/60 shadow-xs"
          >
            <Save className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Salvar Espelho</span>
          </button>

          {/* Botão Duplicar Espelho Atual */}
          <button
            type="button"
            onClick={() => onDuplicatePlan(activePlanId)}
            title="Duplicar o espelho atual para criar uma variante (ex: Prova)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer border border-slate-300 dark:border-zinc-700/60 shadow-xs"
          >
            <Copy className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400" />
            <span className="hidden sm:inline">Duplicar</span>
          </button>

          {/* Botão Criar Novo Espelho */}
          <button
            type="button"
            id="create-new-plan-btn"
            onClick={() => handleOpenCreate()}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Espelho</span>
          </button>
        </div>

      </div>

      {/* MODAL: CRIAR NOVO ESPELHO */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#141418] rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header fixo */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 font-display">
                    Criar Novo Espelho para a Turma
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400">
                    {classroom.name} • {classroom.grade}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Formulário com corpo rolável garantido */}
            <form onSubmit={handleConfirmCreate} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-scroll flex-1 overscroll-contain custom-modal-scroll pr-3">
                {/* Sugestões Rápidas de Espelhos */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1.5 uppercase tracking-wider text-[10px]">
                    Sugestões Rápidas:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {SEATING_PLAN_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setNewPlanName(preset.name);
                          setNewPlanCategory(preset.category);
                          setNewPlanDescription(preset.description);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          newPlanName === preset.name
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                            : 'bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700/60'
                        }`}
                      >
                        {getCategoryIcon(preset.category)}
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nome do Espelho */}
                <div>
                  <label className="font-bold text-slate-800 dark:text-zinc-200 block mb-1">
                    Nome do Espelho *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dias de Prova, Espelho 2º Semestre, etc."
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1a20] border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    autoFocus
                  />
                </div>

                {/* Finalidade / Categoria */}
                <div>
                  <label className="font-bold text-slate-800 dark:text-zinc-200 block mb-1.5">
                    Finalidade / Tipo de Espelho
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(['official', 'exam', 'test', 'group', 'custom'] as SeatingPlanCategory[]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewPlanCategory(cat)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                          newPlanCategory === cat
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold'
                            : 'bg-slate-50 dark:bg-[#1a1a20] border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
                        }`}
                      >
                        {getCategoryIcon(cat)}
                        <span className="text-[11px] truncate">{getCategoryLabel(cat)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modo Inicial do Novo Espelho */}
                <div>
                  <label className="font-bold text-slate-800 dark:text-zinc-200 block mb-1.5">
                    Como iniciar o layout deste novo espelho?
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 cursor-pointer hover:border-slate-300 dark:hover:border-zinc-700">
                      <input
                        type="radio"
                        name="initialMode"
                        checked={initialMode === 'copy_current'}
                        onChange={() => setInitialMode('copy_current')}
                        className="mt-0.5 accent-emerald-600"
                      />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-zinc-200 block">
                          Copiar a disposição atual (Recomendado)
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                          Inicia com os alunos já sentados onde estão agora, permitindo ajustes pontuais com segurança sem perder o original.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 cursor-pointer hover:border-slate-300 dark:hover:border-zinc-700">
                      <input
                        type="radio"
                        name="initialMode"
                        checked={initialMode === 'clean_unlocked'}
                        onChange={() => setInitialMode('clean_unlocked')}
                        className="mt-0.5 accent-emerald-600"
                      />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-zinc-200 block">
                          Manter apenas carteiras travadas (Fixas)
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                          Mantém alunos com necessidades ou posições fixadas e libera as demais carteiras para nova alocação.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 cursor-pointer hover:border-slate-300 dark:hover:border-zinc-700">
                      <input
                        type="radio"
                        name="initialMode"
                        checked={initialMode === 'blank'}
                        onChange={() => setInitialMode('blank')}
                        className="mt-0.5 accent-emerald-600"
                      />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-zinc-200 block">
                          Iniciar com carteiras vazias (Em Branco)
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                          Limpa todo o mapa para distribuir os alunos do zero ou gerar com novo modo.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Descrição Opcional */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    Observações / Finalidade (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Utilizado para as provas trimestrais de Física e Matemática"
                    value={newPlanDescription}
                    onChange={(e) => setNewPlanDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1a20] border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Rodapé fixo com botões de ação */}
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-[#16161c] flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold cursor-pointer shadow-md shadow-emerald-950/20"
                >
                  Criar Espelho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RENOMEAR / EDITAR ESPELHO */}
      {isRenameModalOpen && planToRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#141418] rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 font-display flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-500" />
                Editar Detalhes do Espelho
              </h3>
              <button
                type="button"
                onClick={() => setIsRenameModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmRename} className="flex flex-col flex-1 min-h-0">
              <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1 overscroll-contain custom-modal-scroll">
                <div>
                  <label className="font-bold text-slate-800 dark:text-zinc-200 block mb-1">
                    Nome do Espelho *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1a20] border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 dark:text-zinc-200 block mb-1.5">
                    Finalidade
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(['official', 'exam', 'test', 'group', 'custom'] as SeatingPlanCategory[]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewPlanCategory(cat)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                          newPlanCategory === cat
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold'
                            : 'bg-slate-50 dark:bg-[#1a1a20] border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
                        }`}
                      >
                        {getCategoryIcon(cat)}
                        <span className="text-[11px] truncate">{getCategoryLabel(cat)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    Observações (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newPlanDescription}
                    onChange={(e) => setNewPlanDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1a20] border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-[#16161c] flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRenameModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMAÇÃO DE EXCLUSÃO */}
      {deleteConfirmPlanId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#141418] rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl w-full max-w-sm overflow-hidden p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-zinc-100 text-sm">
                  Excluir este espelho?
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Esta ação removerá apenas esta versão de espelho. Os alunos e a turma permanecerão salvos normalmente.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmPlanId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeletePlanConfirm(deleteConfirmPlanId)}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl cursor-pointer"
              >
                Excluir Espelho
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
