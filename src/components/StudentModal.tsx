import React, { useState } from 'react';
import { 
  X, 
  Check, 
  User, 
  Eye, 
  Ear, 
  Zap, 
  Accessibility, 
  ArrowUpNarrowWide, 
  Heart, 
  AlertTriangle, 
  MessageSquare,
  Plus,
  Trash2,
  Tag,
  Sliders,
  ChevronDown,
  UserCheck,
  UserX
} from 'lucide-react';
import { 
  Student, 
  SpecialNeedType, 
  BehaviorLevel, 
  Gender, 
  StudentRelation, 
  AffinityLevel, 
  AntiAffinityLevel 
} from '../types';
import { AVATAR_COLORS } from '../utils/sampleData';

const DEFAULT_AFFINITY_CATEGORIES = [
  'Apoio Pedagógico / Monitoria',
  'Amizade Produtiva / Estudos',
  'Trabalho em Equipe / Projetos',
  'Acolhimento & Adaptação',
  'Foco Compartilhado',
];

const DEFAULT_ANTI_AFFINITY_CATEGORIES = [
  'Conversa Excessiva / Dispersão',
  'Distração Mútua / Brincadeiras',
  'Conflito / Atrito Pessoal',
  'Dispersão em Dupla',
  'Barulho em Grupo',
];

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveStudent: (student: Student) => void;
  allStudents: Student[];
  initialStudent?: Student | null;
  customCategories?: string[];
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSaveStudent,
  allStudents,
  initialStudent,
  customCategories = [],
}) => {
  if (!isOpen) return null;

  const nextRollNumber = initialStudent
    ? initialStudent.rollNumber
    : allStudents.length > 0
    ? Math.max(...allStudents.map(s => s.rollNumber)) + 1
    : 1;

  const [name, setName] = useState(initialStudent?.name || '');
  const [nickname, setNickname] = useState(initialStudent?.nickname || '');
  const [rollNumber, setRollNumber] = useState(initialStudent?.rollNumber || nextRollNumber);
  const [gender, setGender] = useState<Gender>(initialStudent?.gender || 'M');
  const [avatarColor, setAvatarColor] = useState(
    initialStudent?.avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
  );
  const [behavior, setBehavior] = useState<BehaviorLevel>(initialStudent?.behavior || 'calm');
  const [specialNeeds, setSpecialNeeds] = useState<SpecialNeedType[]>(initialStudent?.specialNeeds || []);
  const [specialNeedsNotes, setSpecialNeedsNotes] = useState(initialStudent?.specialNeedsNotes || '');
  const [preferredRow, setPreferredRow] = useState<Student['preferredRow']>(initialStudent?.preferredRow || 'any');
  
  // Relations state with rich details
  const [affinityDetails, setAffinityDetails] = useState<StudentRelation[]>(() => {
    if (initialStudent?.affinityDetails && initialStudent.affinityDetails.length > 0) {
      return [...initialStudent.affinityDetails];
    }
    if (initialStudent?.affinities && initialStudent.affinities.length > 0) {
      return initialStudent.affinities.map(id => ({
        targetStudentId: id,
        level: 'medium' as AffinityLevel,
        category: 'Amizade Produtiva / Estudos',
      }));
    }
    return [];
  });

  const [antiAffinityDetails, setAntiAffinityDetails] = useState<StudentRelation[]>(() => {
    if (initialStudent?.antiAffinityDetails && initialStudent.antiAffinityDetails.length > 0) {
      return [...initialStudent.antiAffinityDetails];
    }
    if (initialStudent?.antiAffinities && initialStudent.antiAffinities.length > 0) {
      return initialStudent.antiAffinities.map(id => ({
        targetStudentId: id,
        level: 'moderate' as AntiAffinityLevel,
        category: 'Conversa Excessiva / Dispersão',
      }));
    }
    return [];
  });

  const [newAffinityTarget, setNewAffinityTarget] = useState('');
  const [newAffinityLevel, setNewAffinityLevel] = useState<AffinityLevel>('high');
  const [newAffinityCategory, setNewAffinityCategory] = useState(DEFAULT_AFFINITY_CATEGORIES[0]);
  const [customAffCategoryInput, setCustomAffCategoryInput] = useState('');

  const [newAntiTarget, setNewAntiTarget] = useState('');
  const [newAntiLevel, setNewAntiLevel] = useState<AntiAffinityLevel>('critical');
  const [newAntiCategory, setNewAntiCategory] = useState(DEFAULT_ANTI_AFFINITY_CATEGORIES[0]);
  const [customAntiCategoryInput, setCustomAntiCategoryInput] = useState('');

  const [notes, setNotes] = useState(initialStudent?.notes || '');

  const otherStudents = allStudents.filter(s => s.id !== initialStudent?.id);

  const toggleSpecialNeed = (need: SpecialNeedType) => {
    setSpecialNeeds(prev =>
      prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need]
    );
  };

  const handleAddAffinity = () => {
    if (!newAffinityTarget) return;
    const cat = customAffCategoryInput.trim() || newAffinityCategory;
    
    // Remove if in anti-affinities
    setAntiAffinityDetails(prev => prev.filter(r => r.targetStudentId !== newAffinityTarget));

    setAffinityDetails(prev => {
      const filtered = prev.filter(r => r.targetStudentId !== newAffinityTarget);
      return [...filtered, {
        targetStudentId: newAffinityTarget,
        level: newAffinityLevel,
        category: cat,
      }];
    });

    setNewAffinityTarget('');
    setCustomAffCategoryInput('');
  };

  const handleRemoveAffinity = (targetId: string) => {
    setAffinityDetails(prev => prev.filter(r => r.targetStudentId !== targetId));
  };

  const handleAddAntiAffinity = () => {
    if (!newAntiTarget) return;
    const cat = customAntiCategoryInput.trim() || newAntiCategory;

    // Remove if in affinities
    setAffinityDetails(prev => prev.filter(r => r.targetStudentId !== newAntiTarget));

    setAntiAffinityDetails(prev => {
      const filtered = prev.filter(r => r.targetStudentId !== newAntiTarget);
      return [...filtered, {
        targetStudentId: newAntiTarget,
        level: newAntiLevel,
        category: cat,
      }];
    });

    setNewAntiTarget('');
    setCustomAntiCategoryInput('');
  };

  const handleRemoveAntiAffinity = (targetId: string) => {
    setAntiAffinityDetails(prev => prev.filter(r => r.targetStudentId !== targetId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const studentData: Student = {
      id: initialStudent?.id || `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      rollNumber: Number(rollNumber),
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      gender,
      avatarColor,
      behavior,
      specialNeeds,
      specialNeedsNotes: specialNeedsNotes.trim() || undefined,
      preferredRow,
      affinities: affinityDetails.map(r => r.targetStudentId),
      antiAffinities: antiAffinityDetails.map(r => r.targetStudentId),
      affinityDetails,
      antiAffinityDetails,
      notes: notes.trim() || undefined,
      fixedDeskId: initialStudent?.fixedDeskId,
    };

    onSaveStudent(studentData);
    onClose();
  };

  const allAffinityCategories = Array.from(new Set([...DEFAULT_AFFINITY_CATEGORIES, ...customCategories]));
  const allAntiAffinityCategories = Array.from(new Set([...DEFAULT_ANTI_AFFINITY_CATEGORIES, ...customCategories]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121418] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-[#161a20]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-md border border-white/20"
              style={{ backgroundColor: avatarColor }}
            >
              {rollNumber || 'Nº'}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base font-display">
                {initialStudent ? `Editar Aluno(a): ${initialStudent.name}` : 'Cadastrar Novo Aluno'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Ficha de inteligência pedagógica & restrições de proximidade
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800 dark:text-zinc-300">
          
          {/* Basic Info Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                1. Identificação Básica & Fleming ID
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-zinc-300 mb-1">
                  Nº Chamada *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#181c22] border border-slate-300 dark:border-zinc-800 rounded-xl text-sm font-bold text-center text-slate-900 dark:text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-xs font-bold text-slate-800 dark:text-zinc-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Gabriel Henrique Silva"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#181c22] border border-slate-300 dark:border-zinc-800 rounded-xl text-sm font-medium text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-800 dark:text-zinc-300 mb-1">
                  Apelido / Tratamento
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Ex: Biel"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#181c22] border border-slate-300 dark:border-zinc-800 rounded-xl text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Avatar color & Gender */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-400">Cor do Card:</span>
                <div className="flex items-center gap-1.5">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAvatarColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                        avatarColor === color ? 'ring-2 ring-offset-2 ring-emerald-500 ring-offset-white dark:ring-offset-[#121216] scale-110' : 'hover:scale-105 opacity-80'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-400">Gênero:</span>
                <div className="flex bg-slate-100 dark:bg-[#181c22] border border-slate-300 dark:border-zinc-800 p-1 rounded-xl gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setGender('M')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      gender === 'M' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    Masc
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('F')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      gender === 'F' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    Fem
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('other')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      gender === 'other' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    Outro
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Behavior & Pedagogical Needs */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              2. Comportamento & Acessibilidade Pedagógica
            </h4>

            {/* Behavior Level */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-zinc-300 mb-2">
                Perfil de Atenção & Conversa
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBehavior('calm')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    behavior === 'calm'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#161a20]/40 text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <p className="text-xs font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Calmo / Alta Concentração
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5">Mantém foco e auxilia vizinhos</p>
                </button>

                <button
                  type="button"
                  onClick={() => setBehavior('moderate')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    behavior === 'moderate'
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-950 dark:text-sky-200 ring-1 ring-sky-500'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#161a20]/40 text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <p className="text-xs font-bold flex items-center gap-1.5 text-sky-800 dark:text-sky-300">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    Moderado
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5">Interage normalmente na aula</p>
                </button>

                <button
                  type="button"
                  onClick={() => setBehavior('talkative')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    behavior === 'talkative'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-950 dark:text-amber-200 ring-1 ring-amber-500'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#161a20]/40 text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <p className="text-xs font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Dispersivo / Conversador
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5">Isolar de outros conversadores</p>
                </button>
              </div>
            </div>

            {/* Special needs checkboxes */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-zinc-300 mb-2">
                Acessibilidade & Critérios de Inclusão
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                
                <button
                  type="button"
                  onClick={() => toggleSpecialNeed('low_vision')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all cursor-pointer ${
                    specialNeeds.includes('low_vision')
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#161a20]/40 text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-zinc-200">Baixa Visão</p>
                    <p className="text-[10px] text-slate-600 dark:text-zinc-400 font-normal">Frente central</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleSpecialNeed('hearing_impairment')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all cursor-pointer ${
                    specialNeeds.includes('hearing_impairment')
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#161a20]/40 text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <Ear className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-zinc-200">Dificuldade Auditiva</p>
                    <p className="text-[10px] text-slate-600 dark:text-zinc-400 font-normal">Frente e próximo</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleSpecialNeed('adhd_focus')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all cursor-pointer ${
                    specialNeeds.includes('adhd_focus')
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#161a20]/40 text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-zinc-200">TDAH / Foco</p>
                    <p className="text-[10px] text-slate-600 dark:text-zinc-400 font-normal">Longe de portas</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleSpecialNeed('wheelchair_mobility')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all cursor-pointer ${
                    specialNeeds.includes('wheelchair_mobility')
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#161a20]/40 text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <Accessibility className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-zinc-200">Cadeirante</p>
                    <p className="text-[10px] text-slate-600 dark:text-zinc-400 font-normal">Acesso corredor</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleSpecialNeed('tall_student')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all cursor-pointer ${
                    specialNeeds.includes('tall_student')
                      ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-900 dark:text-purple-200 font-semibold'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#161a20]/40 text-slate-700 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <ArrowUpNarrowWide className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-zinc-200">Aluno Alto</p>
                    <p className="text-[10px] text-slate-600 dark:text-zinc-400 font-normal">Fileiras do fundo</p>
                  </div>
                </button>

              </div>
            </div>

            {specialNeeds.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-zinc-300 mb-1">
                  Detalhes do Laudo / Orientação Pedagógica
                </label>
                <input
                  type="text"
                  value={specialNeedsNotes}
                  onChange={(e) => setSpecialNeedsNotes(e.target.value)}
                  placeholder="Ex: Aluno requer sentar centralizado na frente devido ao aparelho auditivo..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#181c22] border border-slate-300 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Granular Affinities Module */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800/80">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                3. Proximidade Permitida / Recomendada (Quem PODE ficar perto)
              </h4>
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                {affinityDetails.length} permitido(s)
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400">
              Aponte quais colegas podem ou devem sentar perto deste aluno, indicando a prioridade (+3 Alta, +2 Média, +1 Baixa) e a finalidade pedagógica.
            </p>

            {/* Existing Affinities List */}
            {affinityDetails.length > 0 && (
              <div className="space-y-2">
                {affinityDetails.map((rel) => {
                  const target = allStudents.find(s => s.id === rel.targetStudentId);
                  if (!target) return null;
                  return (
                    <div
                      key={rel.targetStudentId}
                      className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-[#0e1d16] border border-emerald-300 dark:border-emerald-800/60 text-xs shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center text-white font-bold text-[10px] shadow-xs"
                          style={{ backgroundColor: target.avatarColor }}
                        >
                          {target.rollNumber}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-zinc-100">{target.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              rel.level === 'high'
                                ? 'bg-emerald-200 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-500/30'
                                : rel.level === 'medium'
                                ? 'bg-teal-200 dark:bg-teal-500/20 text-teal-900 dark:text-teal-300 border border-teal-400 dark:border-teal-500/30'
                                : 'bg-slate-200 dark:bg-zinc-700/50 text-slate-800 dark:text-zinc-300 border border-slate-300 dark:border-zinc-600'
                            }`}>
                              {rel.level === 'high' ? 'Alta (+3)' : rel.level === 'medium' ? 'Média (+2)' : 'Baixa (+1)'}
                            </span>
                            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1">
                              <Tag className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {rel.category || 'Geral'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveAffinity(rel.targetStudentId)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                        title="Remover proximidade permitida"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add New Affinity Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#151a20] border border-slate-200 dark:border-zinc-800/80 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Vincular Colega Próximo (Pode Ficar Perto)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                {/* Target student */}
                <div className="sm:col-span-5">
                  <select
                    value={newAffinityTarget}
                    onChange={(e) => setNewAffinityTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#1c222a] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-xs font-semibold text-slate-900 dark:text-zinc-100 focus:border-emerald-500 focus:outline-none cursor-pointer shadow-xs"
                  >
                    <option value="">Selecione o colega...</option>
                    {otherStudents
                      .filter(s => !affinityDetails.some(r => r.targetStudentId === s.id))
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          Nº {s.rollNumber} - {s.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Level */}
                <div className="sm:col-span-3">
                  <select
                    value={newAffinityLevel}
                    onChange={(e) => setNewAffinityLevel(e.target.value as AffinityLevel)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#1c222a] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-400 font-bold focus:border-emerald-500 focus:outline-none cursor-pointer shadow-xs"
                  >
                    <option value="high">Alta (+3 pontos)</option>
                    <option value="medium">Média (+2 pontos)</option>
                    <option value="low">Baixa (+1 ponto)</option>
                  </select>
                </div>

                {/* Category */}
                <div className="sm:col-span-4">
                  <select
                    value={newAffinityCategory}
                    onChange={(e) => setNewAffinityCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#1c222a] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-xs font-semibold text-slate-900 dark:text-zinc-100 focus:border-emerald-500 focus:outline-none cursor-pointer shadow-xs"
                  >
                    {allAffinityCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="custom">+ Digitar Categoria Personalizada...</option>
                  </select>
                </div>
              </div>

              {newAffinityCategory === 'custom' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAffCategoryInput}
                    onChange={(e) => setCustomAffCategoryInput(e.target.value)}
                    placeholder="Nome da categoria personalizada (ex: Dupla de Biologia Fleming)..."
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-[#1c222a] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!newAffinityTarget}
                  onClick={handleAddAffinity}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Permitir Proximidade
                </button>
              </div>
            </div>
          </div>

          {/* Granular Anti-Affinities Module */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800/80">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400 flex items-center gap-1.5">
                <UserX className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                4. Restrições de Proximidade (Quem NÃO PODE ficar perto)
              </h4>
              <span className="text-[11px] font-bold text-rose-800 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-300 dark:border-rose-800">
                {antiAffinityDetails.length} restrição(ões)
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400">
              Aponte quais colegas NÃO podem sentar perto deste aluno, definindo o nível de distanciamento (-3 Crítico/Separação Absoluta, -2 Moderado, -1 Leve) e a justificativa pedagógica.
            </p>

            {/* Existing Anti-Affinities List */}
            {antiAffinityDetails.length > 0 && (
              <div className="space-y-2">
                {antiAffinityDetails.map((rel) => {
                  const target = allStudents.find(s => s.id === rel.targetStudentId);
                  if (!target) return null;
                  return (
                    <div
                      key={rel.targetStudentId}
                      className="flex items-center justify-between p-3 rounded-2xl bg-rose-50 dark:bg-[#200e12] border border-rose-300 dark:border-rose-800/60 text-xs shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center text-white font-bold text-[10px] shadow-xs"
                          style={{ backgroundColor: target.avatarColor }}
                        >
                          {target.rollNumber}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-zinc-100">{target.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              rel.level === 'critical'
                                ? 'bg-rose-200 dark:bg-rose-500/25 text-rose-900 dark:text-rose-300 border border-rose-400 dark:border-rose-500/40'
                                : rel.level === 'moderate'
                                ? 'bg-amber-200 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-400 dark:border-amber-500/30'
                                : 'bg-slate-200 dark:bg-zinc-700/50 text-slate-800 dark:text-zinc-300 border border-slate-300 dark:border-zinc-600'
                            }`}>
                              {rel.level === 'critical' ? 'Crítica (-3)' : rel.level === 'moderate' ? 'Moderada (-2)' : 'Leve (-1)'}
                            </span>
                            <span className="text-[10px] text-rose-800 dark:text-rose-300 font-semibold flex items-center gap-1">
                              <Tag className="w-3 h-3 text-rose-600 dark:text-rose-400" /> {rel.category || 'Geral'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveAntiAffinity(rel.targetStudentId)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                        title="Remover restrição de distanciamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add New Anti-Affinity Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#151a20] border border-slate-200 dark:border-zinc-800/80 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                Vincular Restrição de Distanciamento (NÃO Pode Ficar Perto)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                {/* Target student */}
                <div className="sm:col-span-5">
                  <select
                    value={newAntiTarget}
                    onChange={(e) => setNewAntiTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#1c222a] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-xs font-semibold text-slate-900 dark:text-zinc-100 focus:border-rose-500 focus:outline-none cursor-pointer shadow-xs"
                  >
                    <option value="">Selecione o colega...</option>
                    {otherStudents
                      .filter(s => !antiAffinityDetails.some(r => r.targetStudentId === s.id))
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          Nº {s.rollNumber} - {s.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Level */}
                <div className="sm:col-span-3">
                  <select
                    value={newAntiLevel}
                    onChange={(e) => setNewAntiLevel(e.target.value as AntiAffinityLevel)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#1c222a] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-xs text-rose-800 dark:text-rose-400 font-bold focus:border-rose-500 focus:outline-none cursor-pointer shadow-xs"
                  >
                    <option value="critical">Crítica (-3 pts)</option>
                    <option value="moderate">Moderada (-2 pts)</option>
                    <option value="mild">Leve (-1 pt)</option>
                  </select>
                </div>

                {/* Category */}
                <div className="sm:col-span-4">
                  <select
                    value={newAntiCategory}
                    onChange={(e) => setNewAntiCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#1c222a] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-xs font-semibold text-slate-900 dark:text-zinc-100 focus:border-rose-500 focus:outline-none cursor-pointer shadow-xs"
                  >
                    {allAntiAffinityCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="custom">+ Digitar Categoria Personalizada...</option>
                  </select>
                </div>
              </div>

              {newAntiCategory === 'custom' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAntiCategoryInput}
                    onChange={(e) => setCustomAntiCategoryInput(e.target.value)}
                    placeholder="Nome da categoria personalizada (ex: Conversa em Resolução de Exercício)..."
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-[#1c222a] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!newAntiTarget}
                  onClick={handleAddAntiAffinity}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Restrição
                </button>
              </div>
            </div>
          </div>

          {/* General Notes */}
          <div className="pt-4 border-t border-slate-200 dark:border-zinc-800/80">
            <label className="block text-xs font-bold text-slate-800 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              Observações Pedagógicas do Docente
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Aluno responde muito bem a duplas de monitoria e estudos dirigidos..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#181c22] border border-slate-300 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {initialStudent ? 'Salvar Aluno' : 'Cadastrar Aluno'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

