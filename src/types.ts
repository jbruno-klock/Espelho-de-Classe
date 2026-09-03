export type SpecialNeedType = 
  | 'low_vision' // Baixa visão (precisa frente)
  | 'hearing_impairment' // Dificuldade auditiva (precisa frente)
  | 'adhd_focus' // TDAH / Dificuldade de foco (frente e longe de portas/janelas)
  | 'wheelchair_mobility' // Mobilidade reduzida / Cadeirante (corredor / fácil acesso)
  | 'tall_student' // Aluno muito alto (fundo para não tapar visão dos outros)
  | 'custom'; // Outro motivo pedagógico

export type BehaviorLevel = 'calm' | 'moderate' | 'talkative';
export type Gender = 'M' | 'F' | 'other';

export type AffinityLevel = 'high' | 'medium' | 'low'; // Alta (+3), Média (+2), Baixa (+1)
export type AntiAffinityLevel = 'critical' | 'moderate' | 'mild'; // Crítica (-3), Moderada (-2), Leve (-1)

export interface StudentRelation {
  targetStudentId: string;
  level: AffinityLevel | AntiAffinityLevel;
  category?: string; // Ex: 'Apoio Pedagógico', 'Conversa Excessiva', 'Atrito Pessoal', etc.
  notes?: string;
}

export const DEFAULT_AFFINITY_CATEGORIES = [
  'Amizade Produtiva / Estudos',
  'Dupla de Apoio Mútuo',
  'Monitoria / Nível Complementar',
  'Grupo de Pesquisa / Laboratório',
  'Afinidade Geral',
];

export const DEFAULT_ANTI_AFFINITY_CATEGORIES = [
  'Conversa Excessiva / Dispersão',
  'Conflito / Histórico de Atrito',
  'Incompatibilidade de Ritmo',
  'Desatenção Coletiva',
  'Desafinidade Geral',
];

export interface Student {
  id: string;
  rollNumber: number; // Número da chamada (1, 2, 3...)
  name: string;
  nickname?: string;
  gender?: Gender;
  avatarColor?: string;
  behavior: BehaviorLevel; // 'calm' | 'moderate' | 'talkative'
  specialNeeds: SpecialNeedType[];
  specialNeedsNotes?: string;
  preferredRow?: 'front' | 'middle' | 'back' | 'any';
  academicLevel?: 'regular' | 'advanced' | 'needs_help';
  visionNeeds?: 'standard' | 'needs_front';
  hearingNeeds?: 'standard' | 'needs_front';
  reducedMobility?: boolean;
  affinities: string[]; // IDs de alunos que podem/devem sentar perto (retrocompatível)
  antiAffinities: string[]; // IDs de alunos que NÃO PODEM sentar perto (retrocompatível)
  affinityDetails?: StudentRelation[]; // Relações detalhadas com nível e categoria
  antiAffinityDetails?: StudentRelation[]; // Relações detalhadas de desafinidade com nível e categoria
  notes?: string;
  fixedDeskId?: string; // ID da carteira fixa, se houver
}

export type LayoutType = 'rows' | 'pairs' | 'groups_4' | 'u_shape';
export type FeaturePosition = 'front_center' | 'front_left' | 'front_right' | 'back_left' | 'back_right' | 'left' | 'right' | 'none';

export interface RoomConfig {
  rows: number; // Ex: 5 ou 6
  cols: number; // Ex: 6 ou 7
  layoutType: LayoutType; // 'rows' | 'pairs' | 'groups_4' | 'u_shape'
  teacherDeskPosition: FeaturePosition; // onde fica a mesa do professor
  boardPosition: 'top'; // Quadro sempre no topo (frente)
  doorPosition: FeaturePosition;
  windowPosition: FeaturePosition;
  activeDesks: Record<string, boolean>; // 'r{row}_c{col}' -> boolean (se false, carteira está desativada/corredor)
  deskLabels?: Record<string, string>; // rótulos opcionais
}

export type UserRole = 'master' | 'manager';

export interface Institution {
  id: string;
  name: string;
  code: string; // ex: FLEMING-PRIME, FLEMING-MED
  cnpj?: string;
  status: 'active' | 'inactive' | 'suspended';
  contactEmail?: string;
  contactPhone?: string;
  city?: string;
  state?: string;
  logoUrl?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  password?: string; // Senha para autenticação segura
  role: UserRole;
  institutionId?: string; // Obrigatório para 'manager', opcional/null para 'master'
  isActive: boolean;
  avatarColor?: string;
  phone?: string;
  createdAt: number;
  lastLoginAt?: number;
}

export interface Classroom {
  id: string;
  institutionId?: string; // ID da Instituição proprietária da turma (Isolamento Multi-tenant)
  name: string; // Ex: "Fleming Medicina - Turma Alfa"
  grade: string; // Ex: "Pré-Vestibular / Ensino Médio"
  schoolName: string; // Ex: "Fleming Educação"
  teacherName: string; // Ex: "Profª Cláudia Valença"
  academicYear: string; // Ex: "2026"
  roomNumber?: string; // Ex: "Sala 204"
  roomConfig: RoomConfig;
  students: Student[];
  seatingMap: Record<string, string | null>; // deskId ('r0_c0') -> studentId or null
  lockedDesks: Record<string, boolean>; // deskId -> true se o professor travou a posição manualmente
  customAffinityCategories?: string[]; // Categorias personalizadas de afinidade
  customAntiAffinityCategories?: string[]; // Categorias personalizadas de desafinidade
  createdAt: number;
  updatedAt: number;
}

export type GenerationMode = 
  | 'balanced' // Balanceado (evita conflitos e espalha alunos falantes)
  | 'maximize_separation' // Rigoroso: prioridade máxima em separar desafetos e conversadores
  | 'focus_pairs' // Duplas colaborativas (junta afinidades e afasta desafetos)
  | 'pedagogical_inclusion' // Inclusão total: prioridade máxima a necessidades especiais e foco
  | 'random_constrained'; // Aleatório com respeito a regras mínimas (para provas/avaliações)

export interface GenerationOptions {
  mode: GenerationMode;
  antiAffinityWeight: number; // 1 a 10
  affinityWeight: number; // 1 a 10
  specialNeedsWeight: number; // 1 a 10
  separateTalkativeWeight: number; // 1 a 10
  avoidIsolatedStudents: boolean;
  respectFixedDesks: boolean;
}

export interface ConflictDiagnostic {
  id: string;
  type: 'anti_affinity' | 'two_talkative' | 'front_need_violated' | 'back_need_violated' | 'door_distraction';
  severity: 'critical' | 'warning' | 'info';
  student1Id: string;
  student2Id?: string;
  student1Name: string;
  student2Name?: string;
  desk1Id: string;
  desk2Id?: string;
  description: string;
  distance?: number;
  category?: string;
  level?: string;
}

export interface GenerationReport {
  score: number; // 0 - 100%
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  conflicts: ConflictDiagnostic[];
  affinitiesSatisfied: number;
  totalAffinities: number;
  specialNeedsSatisfied: number;
  totalSpecialNeeds: number;
  talkativeIsolated: number;
  totalTalkative: number;
  summary: string;
}
