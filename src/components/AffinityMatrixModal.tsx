import React, { useState } from 'react';
import { 
  X, Heart, AlertTriangle, User, Search, Check, Sparkles, Plus, 
  Tag, Filter, Grid, List, ArrowRightLeft, ShieldAlert, Zap, Info, ArrowLeft,
  Users, UserCheck, UserX
} from 'lucide-react';
import { Student, Classroom, StudentRelation, AffinityLevel, AntiAffinityLevel, DEFAULT_AFFINITY_CATEGORIES, DEFAULT_ANTI_AFFINITY_CATEGORIES } from '../types';

interface AffinityMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: Classroom;
  onUpdateStudentRelations: (
    studentId: string, 
    affinities: string[], 
    antiAffinities: string[],
    affinityDetails?: StudentRelation[],
    antiAffinityDetails?: StudentRelation[]
  ) => void;
  onAddCustomCategory?: (category: string, type: 'affinity' | 'antiAffinity') => void;
  embedded?: boolean;
}

export const AffinityMatrixModal: React.FC<AffinityMatrixModalProps> = ({
  isOpen,
  onClose,
  classroom,
  onUpdateStudentRelations,
  onAddCustomCategory,
  embedded = false,
}) => {
  if (!isOpen) return null;

  const [viewMode, setViewMode] = useState<'focused' | 'matrix'>('focused');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    classroom.students[0]?.id || ''
  );
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [reciprocalMode, setReciprocalMode] = useState(true);

  // New category creation modal/inline state
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'affinity' | 'antiAffinity'>('affinity');
  const [isAddingCat, setIsAddingCat] = useState(false);

  const students = classroom.students;
  const currentStudent = students.find(s => s.id === selectedStudentId);

  // Available categories
  const affinityCategories = Array.from(new Set([
    ...DEFAULT_AFFINITY_CATEGORIES,
    ...(classroom.customAffinityCategories || [])
  ]));

  const antiAffinityCategories = Array.from(new Set([
    ...DEFAULT_ANTI_AFFINITY_CATEGORIES,
    ...(classroom.customAntiAffinityCategories || [])
  ]));

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber.toString().includes(search)
  );

  // Helper to get normalized relations
  const getStudentAffinityDetails = (student: Student): StudentRelation[] => {
    if (student.affinityDetails && student.affinityDetails.length > 0) {
      return student.affinityDetails;
    }
    return (student.affinities || []).map(id => ({
      targetStudentId: id,
      level: 'high' as const,
      category: 'Amizade Produtiva / Estudos',
    }));
  };

  const getStudentAntiAffinityDetails = (student: Student): StudentRelation[] => {
    if (student.antiAffinityDetails && student.antiAffinityDetails.length > 0) {
      return student.antiAffinityDetails;
    }
    return (student.antiAffinities || []).map(id => ({
      targetStudentId: id,
      level: 'critical' as const,
      category: 'Conversa Excessiva / Dispersão',
    }));
  };

  // Update relation with specific level and category
  const setRelation = (
    targetId: string, 
    type: 'affinity' | 'antiAffinity' | 'none', 
    level?: AffinityLevel | AntiAffinityLevel, 
    category?: string
  ) => {
    if (!currentStudent) return;

    const currentAffDetails = getStudentAffinityDetails(currentStudent);
    const currentAntiDetails = getStudentAntiAffinityDetails(currentStudent);

    let nextAffDetails = [...currentAffDetails];
    let nextAntiDetails = [...currentAntiDetails];

    if (type === 'none') {
      nextAffDetails = nextAffDetails.filter(r => r.targetStudentId !== targetId);
      nextAntiDetails = nextAntiDetails.filter(r => r.targetStudentId !== targetId);
    } else if (type === 'affinity') {
      nextAntiDetails = nextAntiDetails.filter(r => r.targetStudentId !== targetId);
      const existingIdx = nextAffDetails.findIndex(r => r.targetStudentId === targetId);
      const newRel: StudentRelation = {
        targetStudentId: targetId,
        level: (level as AffinityLevel) || 'high',
        category: category || affinityCategories[0] || 'Geral',
      };
      if (existingIdx >= 0) {
        nextAffDetails[existingIdx] = { ...nextAffDetails[existingIdx], ...newRel };
      } else {
        nextAffDetails.push(newRel);
      }
    } else if (type === 'antiAffinity') {
      nextAffDetails = nextAffDetails.filter(r => r.targetStudentId !== targetId);
      const existingIdx = nextAntiDetails.findIndex(r => r.targetStudentId === targetId);
      const newRel: StudentRelation = {
        targetStudentId: targetId,
        level: (level as AntiAffinityLevel) || 'critical',
        category: category || antiAffinityCategories[0] || 'Geral',
      };
      if (existingIdx >= 0) {
        nextAntiDetails[existingIdx] = { ...nextAntiDetails[existingIdx], ...newRel };
      } else {
        nextAntiDetails.push(newRel);
      }
    }

    const nextAffIds = nextAffDetails.map(r => r.targetStudentId);
    const nextAntiIds = nextAntiDetails.map(r => r.targetStudentId);

    onUpdateStudentRelations(
      currentStudent.id, 
      nextAffIds, 
      nextAntiIds, 
      nextAffDetails, 
      nextAntiDetails
    );

    // If reciprocal mode is on, apply the same to target student
    if (reciprocalMode && targetId !== currentStudent.id) {
      const targetStudent = students.find(s => s.id === targetId);
      if (targetStudent) {
        const tAffDetails = getStudentAffinityDetails(targetStudent);
        const tAntiDetails = getStudentAntiAffinityDetails(targetStudent);

        let nextTAff = [...tAffDetails];
        let nextTAnti = [...tAntiDetails];

        if (type === 'none') {
          nextTAff = nextTAff.filter(r => r.targetStudentId !== currentStudent.id);
          nextTAnti = nextTAnti.filter(r => r.targetStudentId !== currentStudent.id);
        } else if (type === 'affinity') {
          nextTAnti = nextTAnti.filter(r => r.targetStudentId !== currentStudent.id);
          const tIdx = nextTAff.findIndex(r => r.targetStudentId === currentStudent.id);
          const tRel: StudentRelation = {
            targetStudentId: currentStudent.id,
            level: (level as AffinityLevel) || 'high',
            category: category || affinityCategories[0] || 'Geral',
          };
          if (tIdx >= 0) nextTAff[tIdx] = tRel;
          else nextTAff.push(tRel);
        } else if (type === 'antiAffinity') {
          nextTAff = nextTAff.filter(r => r.targetStudentId !== currentStudent.id);
          const tIdx = nextTAnti.findIndex(r => r.targetStudentId === currentStudent.id);
          const tRel: StudentRelation = {
            targetStudentId: currentStudent.id,
            level: (level as AntiAffinityLevel) || 'critical',
            category: category || antiAffinityCategories[0] || 'Geral',
          };
          if (tIdx >= 0) nextTAnti[tIdx] = tRel;
          else nextTAnti.push(tRel);
        }

        onUpdateStudentRelations(
          targetStudent.id,
          nextTAff.map(r => r.targetStudentId),
          nextTAnti.map(r => r.targetStudentId),
          nextTAff,
          nextTAnti
        );
      }
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    if (onAddCustomCategory) {
      onAddCustomCategory(newCatName.trim(), newCatType);
    }
    setNewCatName('');
    setIsAddingCat(false);
  };

  const currentAffDetails = currentStudent ? getStudentAffinityDetails(currentStudent) : [];
  const currentAntiDetails = currentStudent ? getStudentAntiAffinityDetails(currentStudent) : [];

  const modalBody = (
    <div className={`bg-white dark:bg-[#121216] ${
      embedded 
        ? 'rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[640px]' 
        : 'rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 max-w-5xl w-full overflow-hidden flex flex-col h-[90vh] max-h-[92vh]'
    }`}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#16161c] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base font-display">
                Matriz de Proximidade entre Alunos
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60">
                {classroom.name}
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Aponte quem pode ficar perto de quem (apoio e sinergia) e quem NÃO pode ficar perto (restrição de distanciamento).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View switcher */}
          <div className="flex items-center bg-zinc-100 dark:bg-[#1e1e26] p-1 rounded-xl border border-zinc-300 dark:border-zinc-700/60">
            <button
              type="button"
              onClick={() => setViewMode('focused')}
              className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'focused'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Por Aluno
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Matriz Geral
            </button>
          </div>

          {embedded ? (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5 border border-zinc-300 dark:border-zinc-700/60 shadow-xs"
              title="Voltar ao mapa"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar ao Espelho</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Fechar janela"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

        {/* Global Toolbar */}
        <div className="px-6 py-2.5 bg-zinc-50/80 dark:bg-[#14141a] border-b border-zinc-200 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-zinc-800 dark:text-zinc-300 font-semibold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={reciprocalMode}
                onChange={(e) => setReciprocalMode(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-zinc-800"
              />
              <span className="flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Aplicar reciprocidade automática (A ↔ B)
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddingCat(true)}
              className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg border border-zinc-300 dark:border-zinc-700 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Nova Categoria
            </button>
          </div>
        </div>

        {/* Modal for adding custom category */}
        {isAddingCat && (
          <div className="px-6 py-3 bg-emerald-50/80 dark:bg-[#181822] border-b border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between animate-in slide-in-from-top-2">
            <form onSubmit={handleCreateCategory} className="flex flex-wrap items-center gap-3 w-full">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Criar Categoria Personalizada:
              </span>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Ex: Grupo de Iniciação Científica, Dupla de Xadrez..."
                className="flex-1 min-w-[220px] px-3 py-1.5 bg-white dark:bg-[#121216] border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white dark:bg-[#121216] border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-300 focus:outline-none"
              >
                <option value="affinity">Para Proximidade (Quem PODE ficar perto)</option>
                <option value="antiAffinity">Para Distanciamento (Quem NÃO PODE ficar perto)</option>
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Salvar Categoria
              </button>
              <button
                type="button"
                onClick={() => setIsAddingCat(false)}
                className="px-2.5 py-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
            </form>
          </div>
        )}

        {/* Content Body */}
        {viewMode === 'focused' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 overflow-hidden flex-1 min-h-0 h-full">
            
            {/* Left Student Selector Sidebar with high-contrast visible scrollbar */}
            <div className="md:col-span-4 border-r border-zinc-200 dark:border-zinc-800 p-3.5 sm:p-4 flex flex-col bg-zinc-50 dark:bg-[#141419]/80 min-h-0 h-full overflow-hidden">
              
              {/* Search Bar */}
              <div className="relative mb-2.5 shrink-0">
                <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrar aluno por nome ou nº..."
                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-[#18181f] border border-zinc-300 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                />
              </div>

              {/* Student Counter and Scroll indicator */}
              <div className="flex items-center justify-between px-1 mb-2 text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0 font-medium select-none">
                <span>{filteredStudents.length} {filteredStudents.length === 1 ? 'aluno' : 'alunos'}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span>Barra de rolagem ativa</span>
                  <span className="text-xs">↕</span>
                </span>
              </div>

              {/* Scrollable Students List */}
              <div 
                id="affinity-student-selector-list"
                className="overflow-y-scroll visible-scrollbar space-y-1.5 flex-1 min-h-0 pr-1.5 focus:outline-none"
                tabIndex={0}
                aria-label="Lista de alunos para seleção de afinidades"
              >
                {filteredStudents.map((s) => {
                  const isSelected = s.id === selectedStudentId;
                  const affList = getStudentAffinityDetails(s);
                  const antiList = getStudentAntiAffinityDetails(s);

                  return (
                    <button
                      key={s.id}
                      id={`student-selector-item-${s.id}`}
                      onClick={() => setSelectedStudentId(s.id)}
                      className={`w-full text-left p-2.5 rounded-2xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-500 dark:border-emerald-600/80 text-emerald-950 dark:text-emerald-200 shadow-xs ring-1 ring-emerald-500/30'
                          : 'bg-white dark:bg-[#16161c]/60 border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-800 dark:text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: s.avatarColor }}
                        >
                          {s.rollNumber}
                        </span>
                        <div className="truncate">
                          <p className="font-bold text-zinc-900 dark:text-zinc-200 truncate">{s.name}</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                            {s.gender === 'M' ? 'Masc' : 'Fem'} • {s.academicLevel === 'advanced' ? 'Avançado' : s.academicLevel === 'needs_help' ? 'Apoio' : 'Médio'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        {affList.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50" title={`${affList.length} colega(s) que pode ficar perto`}>
                            +{affList.length} perto
                          </span>
                        )}
                        {antiList.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700/50" title={`${antiList.length} restrição(ões) de distanciamento`}>
                            -{antiList.length} longe
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}

                {filteredStudents.length === 0 && (
                  <div className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400 flex flex-col items-center justify-center gap-2">
                    <Search className="w-6 h-6 text-zinc-400 opacity-40" />
                    <p>Nenhum aluno encontrado para "{search}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Relations Configurator */}
            <div className="md:col-span-8 p-4 sm:p-5 overflow-y-auto visible-scrollbar flex flex-col bg-white dark:bg-[#121216] min-h-0 h-full">
              {currentStudent ? (
                <div className="space-y-4">
                  
                  {/* Active Student Header */}
                  <div className="flex items-center justify-between bg-zinc-50 dark:bg-[#181820] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-xs"
                        style={{ backgroundColor: currentStudent.avatarColor }}
                      >
                        {currentStudent.rollNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                            {currentStudent.name}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300">
                            Nº {currentStudent.rollNumber}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          Comportamento: <strong className="text-zinc-900 dark:text-zinc-200">{currentStudent.behavior === 'talkative' ? 'Muito conversador' : currentStudent.behavior === 'moderate' ? 'Moderado' : 'Calmo'}</strong> • Visão: <strong className="text-zinc-900 dark:text-zinc-200">{currentStudent.visionNeeds === 'needs_front' ? 'Frente' : 'Normal'}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800/60 flex items-center gap-1.5" title="Colegas que podem sentar próximos">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {currentAffDetails.length} pode(m) perto
                      </span>
                      <span className="px-3 py-1 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-800/60 flex items-center gap-1.5" title="Colegas que NÃO podem sentar próximos">
                        <UserX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        {currentAntiDetails.length} NÃO pode(m) perto
                      </span>
                    </div>
                  </div>

                  {/* Classmates Grid with Granular Level Controls */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-400">
                        Configurar Proximidade com Colegas da Turma:
                      </h5>
                      <span className="text-[11px] text-zinc-500">
                        {students.length - 1} colegas disponíveis
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[48vh] md:max-h-[52vh] overflow-y-auto visible-scrollbar pr-1.5">
                      {students.filter(s => s.id !== currentStudent.id).map(other => {
                        const affRel = currentAffDetails.find(r => r.targetStudentId === other.id);
                        const antiRel = currentAntiDetails.find(r => r.targetStudentId === other.id);

                        const isAff = !!affRel;
                        const isAnti = !!antiRel;

                        return (
                          <div
                            key={other.id}
                            className={`p-3 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                              isAff
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/60 ring-1 ring-emerald-500/20'
                                : isAnti
                                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700/60 ring-1 ring-rose-500/20'
                                : 'bg-zinc-50 dark:bg-[#16161d] border-zinc-200 dark:border-zinc-800/90 hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              
                              {/* Student Info */}
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className="w-7 h-7 rounded-xl text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs"
                                  style={{ backgroundColor: other.avatarColor }}
                                >
                                  {other.rollNumber}
                                </span>
                                <div className="truncate">
                                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-200 truncate">{other.name}</p>
                                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                    Nº {other.rollNumber} • {other.gender === 'M' ? 'Masc' : 'Fem'} • {other.behavior === 'talkative' ? 'Conversador' : other.behavior === 'moderate' ? 'Moderado' : 'Calmo'}
                                  </p>
                                </div>
                              </div>

                              {/* Action Switch Buttons */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isAff) setRelation(other.id, 'none');
                                    else setRelation(other.id, 'affinity', 'high', affinityCategories[0]);
                                  }}
                                  className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                                    isAff
                                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                                      : 'bg-white dark:bg-[#1e1e26] hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700/60'
                                  }`}
                                  title={isAff ? 'Remover proximidade permitida' : 'Definir que este colega PODE ficar perto'}
                                >
                                  <UserCheck className={`w-3.5 h-3.5 ${isAff ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                                  <span>{isAff ? 'Pode Ficar Perto' : '+ Pode Perto'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isAnti) setRelation(other.id, 'none');
                                    else setRelation(other.id, 'antiAffinity', 'critical', antiAffinityCategories[0]);
                                  }}
                                  className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                                    isAnti
                                      ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                                      : 'bg-white dark:bg-[#1e1e26] hover:bg-rose-50 dark:hover:bg-rose-950/60 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700/60'
                                  }`}
                                  title={isAnti ? 'Remover restrição de distanciamento' : 'Definir que este colega NÃO PODE ficar perto'}
                                >
                                  <UserX className={`w-3.5 h-3.5 ${isAnti ? 'text-white' : 'text-rose-600 dark:text-rose-400'}`} />
                                  <span>{isAnti ? 'NÃO Pode Perto' : '- NÃO Pode Perto'}</span>
                                </button>
                              </div>
                            </div>

                            {/* Detailed Sub-Configuration when Can Be Near is Active */}
                            {isAff && (
                              <div className="pt-2 border-t border-emerald-200 dark:border-emerald-900/40 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div>
                                  <label className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                                    Prioridade de Proximidade:
                                  </label>
                                  <div className="grid grid-cols-3 gap-1">
                                    {[
                                      { id: 'high', label: 'Alta (+3)', desc: 'Prioridade máxima sentar junto' },
                                      { id: 'medium', label: 'Média (+2)', desc: 'Recomendado sentar próximo' },
                                      { id: 'low', label: 'Baixa (+1)', desc: 'Desejável' },
                                    ].map(lvl => (
                                      <button
                                        key={lvl.id}
                                        type="button"
                                        onClick={() => setRelation(other.id, 'affinity', lvl.id as AffinityLevel, affRel.category)}
                                        className={`py-1 px-1.5 rounded-lg text-[11px] font-bold border text-center transition-all cursor-pointer ${
                                          affRel.level === lvl.id
                                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                                            : 'bg-emerald-100/70 dark:bg-[#141e18] text-emerald-900 dark:text-emerald-200/80 border-emerald-300 dark:border-emerald-900/60 hover:bg-emerald-200'
                                        }`}
                                      >
                                        {lvl.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                                    Finalidade Pedagógica:
                                  </label>
                                  <select
                                    value={affRel.category || affinityCategories[0]}
                                    onChange={(e) => setRelation(other.id, 'affinity', affRel.level, e.target.value)}
                                    className="w-full py-1 px-2 bg-white dark:bg-[#141e18] border border-emerald-300 dark:border-emerald-900/70 rounded-lg text-xs font-semibold text-emerald-900 dark:text-emerald-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                  >
                                    {affinityCategories.map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}

                            {/* Detailed Sub-Configuration when Cannot Be Near is Active */}
                            {isAnti && (
                              <div className="pt-2 border-t border-rose-200 dark:border-rose-900/40 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div>
                                  <label className="text-[10px] font-bold text-rose-800 dark:text-rose-300 block mb-1">
                                    Grau de Distanciamento Obrigatório:
                                  </label>
                                  <div className="grid grid-cols-3 gap-1">
                                    {[
                                      { id: 'critical', label: 'Crítica (-3)', desc: 'Nunca sentar próximos' },
                                      { id: 'moderate', label: 'Moderada (-2)', desc: 'Evitar vizinhança' },
                                      { id: 'mild', label: 'Leve (-1)', desc: 'Separar se possível' },
                                    ].map(lvl => (
                                      <button
                                        key={lvl.id}
                                        type="button"
                                        onClick={() => setRelation(other.id, 'antiAffinity', lvl.id as AntiAffinityLevel, antiRel.category)}
                                        className={`py-1 px-1.5 rounded-lg text-[11px] font-bold border text-center transition-all cursor-pointer ${
                                          antiRel.level === lvl.id
                                            ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                                            : 'bg-rose-100/70 dark:bg-[#221417] text-rose-900 dark:text-rose-200/80 border-rose-300 dark:border-rose-900/60 hover:bg-rose-200'
                                        }`}
                                      >
                                        {lvl.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-rose-800 dark:text-rose-300 block mb-1">
                                    Motivo do Distanciamento:
                                  </label>
                                  <select
                                    value={antiRel.category || antiAffinityCategories[0]}
                                    onChange={(e) => setRelation(other.id, 'antiAffinity', antiRel.level, e.target.value)}
                                    className="w-full py-1 px-2 bg-white dark:bg-[#221417] border border-rose-300 dark:border-rose-900/70 rounded-lg text-xs font-semibold text-rose-900 dark:text-rose-200 focus:outline-none focus:ring-1 focus:ring-rose-400"
                                  >
                                    {antiAffinityCategories.map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500">
                  Selecione um aluno na coluna à esquerda para editar suas relações.
                </div>
              )}
            </div>

          </div>
        ) : (
          /* Matrix Full Grid View with visible scrollbars */
          <div className="p-4 sm:p-5 overflow-auto visible-scrollbar flex-1 min-h-0 bg-white dark:bg-[#121216]">
            <div className="mb-3 flex items-center justify-between text-xs shrink-0">
              <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                Clique nas células para alternar: <span className="text-zinc-500 font-bold">Neutro (•)</span> → <span className="text-emerald-700 dark:text-emerald-400 font-bold">Pode Perto (+)</span> → <span className="text-rose-700 dark:text-rose-400 font-bold">NÃO Pode Perto (-)</span>
              </p>
              <div className="flex items-center gap-3 font-semibold">
                <span className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Pode Ficar Perto (+)
                </span>
                <span className="flex items-center gap-1 text-[11px] text-rose-700 dark:text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> NÃO Pode Ficar Perto (-)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto visible-scrollbar border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
              <table className="w-full border-collapse text-xs matrix-table">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-[#181820]">
                    <th className="p-2.5 border-b border-r border-zinc-200 dark:border-zinc-800 text-left font-bold text-zinc-900 dark:text-zinc-300 min-w-[140px] sticky left-0 bg-zinc-100 dark:bg-[#181820] z-10">
                      Aluno (Origem)
                    </th>
                    {students.map(s => (
                      <th key={s.id} className="p-2 border-b border-r border-zinc-200 dark:border-zinc-800 text-center font-bold text-zinc-800 dark:text-zinc-300 min-w-[42px]" title={s.name}>
                        <div className="w-6 h-6 rounded-lg text-[10px] font-bold text-white flex items-center justify-center mx-auto shadow-xs" style={{ backgroundColor: s.avatarColor }}>
                          {s.rollNumber}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map(rowStudent => {
                    const rowAffs = getStudentAffinityDetails(rowStudent);
                    const rowAntis = getStudentAntiAffinityDetails(rowStudent);

                    return (
                      <tr key={rowStudent.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="p-2.5 border-b border-r border-zinc-200 dark:border-zinc-800 font-bold text-zinc-900 dark:text-zinc-200 sticky left-0 bg-zinc-50 dark:bg-[#14141a] z-10">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md text-[10px] font-bold text-white flex items-center justify-center shrink-0 shadow-xs" style={{ backgroundColor: rowStudent.avatarColor }}>
                              {rowStudent.rollNumber}
                            </span>
                            <span className="truncate max-w-[110px]">{rowStudent.name}</span>
                          </div>
                        </td>

                        {students.map(colStudent => {
                          const isSelf = rowStudent.id === colStudent.id;
                          if (isSelf) {
                            return (
                              <td key={colStudent.id} className="p-1 border-b border-r border-zinc-200 dark:border-zinc-800 text-center bg-zinc-100 dark:bg-zinc-900/80 text-zinc-400">
                                —
                              </td>
                            );
                          }

                          const aff = rowAffs.find(r => r.targetStudentId === colStudent.id);
                          const anti = rowAntis.find(r => r.targetStudentId === colStudent.id);

                          return (
                            <td key={colStudent.id} className="p-1 border-b border-r border-zinc-200 dark:border-zinc-800 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentId(rowStudent.id);
                                  if (aff) {
                                    setRelation(colStudent.id, 'antiAffinity', 'critical');
                                  } else if (anti) {
                                    setRelation(colStudent.id, 'none');
                                  } else {
                                    setRelation(colStudent.id, 'affinity', 'high');
                                  }
                                }}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold mx-auto transition-all cursor-pointer ${
                                  aff
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : anti
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 dark:bg-transparent dark:hover:bg-zinc-800 dark:text-zinc-600 dark:hover:text-zinc-300'
                                }`}
                                title={`${rowStudent.name} e ${colStudent.name}: ${
                                  aff ? `PODE ficar perto (${aff.level} / ${aff.category})` : anti ? `NÃO PODE ficar perto (${anti.level} / ${anti.category})` : 'Neutro (Sem restrição)'
                                }`}
                              >
                                {aff ? '+3' : anti ? '-3' : '•'}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#16161c] shrink-0">
          <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400 font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              Pode ficar perto (+1 a +3)
            </span>
            <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              NÃO pode ficar perto (-1 a -3)
            </span>
            <span className="hidden sm:inline text-zinc-500 font-normal">
              Ponderado pelo algoritmo inteligente de distribuição
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs shadow-emerald-950/40 cursor-pointer transition-colors flex items-center gap-1.5"
          >
            {embedded ? (
              <>
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao Espelho</span>
              </>
            ) : (
              'Concluir Edição'
            )}
          </button>
        </div>

      </div>
  );

  if (embedded) {
    return modalBody;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {modalBody}
    </div>
  );
};

