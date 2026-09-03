import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Upload, 
  Trash2, 
  Edit3, 
  Heart, 
  AlertTriangle, 
  Eye, 
  Ear, 
  Zap, 
  Accessibility, 
  ArrowUpNarrowWide,
  Users,
  Filter,
  UserCheck,
  X
} from 'lucide-react';
import { Student, Classroom } from '../types';

interface StudentDatabaseProps {
  classroom: Classroom;
  onOpenAddStudentModal: () => void;
  onOpenEditStudentModal: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onOpenBatchImportModal: () => void;
}

export const StudentDatabase: React.FC<StudentDatabaseProps> = ({
  classroom,
  onOpenAddStudentModal,
  onOpenEditStudentModal,
  onDeleteStudent,
  onOpenBatchImportModal,
}) => {
  const [search, setSearch] = useState('');
  const [filterBehavior, setFilterBehavior] = useState<string>('all');
  const [filterNeed, setFilterNeed] = useState<string>('all');
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const students = classroom.students;

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.nickname && s.nickname.toLowerCase().includes(search.toLowerCase())) ||
      s.rollNumber.toString().includes(search);
    
    const matchesBehavior = filterBehavior === 'all' || s.behavior === filterBehavior;
    const matchesNeed = filterNeed === 'all' || s.specialNeeds.includes(filterNeed as any);

    return matchesSearch && matchesBehavior && matchesNeed;
  }).sort((a, b) => a.rollNumber - b.rollNumber);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-900 dark:text-zinc-100">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121216] p-6 rounded-3xl border border-slate-200 dark:border-zinc-800/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100 font-display">
              Base de Dados de Alunos: {classroom.name}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20">
              {students.length} alunos cadastrados
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
            Cadastre os perfis individuais, necessidades de visão/audição/foco, e restrições de afinidade
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenBatchImportModal}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#18181f] dark:hover:bg-[#202028] text-slate-800 dark:text-zinc-200 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-300 dark:border-zinc-800 shadow-xs"
          >
            <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Importar Planilha / CSV
          </button>

          <button
            onClick={onOpenAddStudentModal}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Adicionar Aluno
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 dark:text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, apelido ou número de chamada..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#18181f] border border-slate-300 dark:border-zinc-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={filterBehavior}
              onChange={(e) => setFilterBehavior(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-white dark:bg-[#18181f] border border-slate-300 dark:border-zinc-800 rounded-2xl py-2.5 pl-3 pr-8 text-xs font-bold text-slate-800 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer"
            >
              <option value="all">Todos Comportamentos</option>
              <option value="calm">Calmo / Focado</option>
              <option value="moderate">Moderado</option>
              <option value="talkative">Muito Conversador</option>
            </select>
          </div>

          <div className="relative flex-1 sm:flex-initial">
            <select
              value={filterNeed}
              onChange={(e) => setFilterNeed(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-white dark:bg-[#18181f] border border-slate-300 dark:border-zinc-800 rounded-2xl py-2.5 pl-3 pr-8 text-xs font-bold text-slate-800 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer"
            >
              <option value="all">Todas as Necessidades</option>
              <option value="low_vision">Baixa Visão</option>
              <option value="hearing_impairment">Auditivo</option>
              <option value="adhd_focus">TDAH / Foco</option>
              <option value="wheelchair_mobility">Cadeirante / Mobilidade</option>
              <option value="tall_student">Aluno Alto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student List Table/Grid */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white dark:bg-[#121216] rounded-3xl p-12 text-center border border-slate-200 dark:border-zinc-800/80 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-300 dark:border-emerald-500/20">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-zinc-200 text-base font-display">Nenhum aluno encontrado</h3>
          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {students.length === 0
              ? 'Esta turma ainda não tem alunos cadastrados. Adicione individualmente ou importe a lista de chamada via planilha.'
              : 'Nenhum aluno corresponde aos filtros selecionados.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={onOpenAddStudentModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Cadastrar Aluno
            </button>
            <button
              onClick={onOpenBatchImportModal}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#18181f] dark:hover:bg-[#202028] text-slate-800 dark:text-zinc-300 border border-slate-300 dark:border-zinc-800 rounded-xl text-xs font-bold cursor-pointer"
            >
              Importar Planilha
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#121216] rounded-3xl border border-slate-200 dark:border-zinc-800/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800 dark:text-zinc-300">
              <thead className="bg-slate-100 dark:bg-[#16161c] text-slate-800 dark:text-zinc-400 font-bold border-b border-slate-200 dark:border-zinc-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">Nº</th>
                  <th className="py-3.5 px-4">Aluno(a)</th>
                  <th className="py-3.5 px-4">Comportamento</th>
                  <th className="py-3.5 px-4">Necessidades & Inclusão</th>
                  <th className="py-3.5 px-4">Afinidades</th>
                  <th className="py-3.5 px-4">Desafinidades</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {filteredStudents.map((student) => {
                  const affinityNames = student.affinities
                    .map(id => students.find(s => s.id === id)?.nickname || students.find(s => s.id === id)?.name.split(' ')[0])
                    .filter(Boolean);

                  const antiAffinityNames = student.antiAffinities
                    .map(id => students.find(s => s.id === id)?.nickname || students.find(s => s.id === id)?.name.split(' ')[0])
                    .filter(Boolean);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                      
                      {/* Roll Number Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className="inline-flex items-center justify-center w-7 h-7 rounded-xl text-white font-bold text-xs shadow-xs"
                          style={{ backgroundColor: student.avatarColor || '#6366f1' }}
                        >
                          {student.rollNumber}
                        </span>
                      </td>

                      {/* Name & Nickname */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-zinc-100 text-sm">{student.name}</div>
                        {student.nickname && (
                          <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal">
                            "{student.nickname}"
                          </span>
                        )}
                      </td>

                      {/* Behavior */}
                      <td className="py-3.5 px-4">
                        {student.behavior === 'calm' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Calmo / Focado
                          </span>
                        )}
                        {student.behavior === 'moderate' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-300 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                            Moderado
                          </span>
                        )}
                        {student.behavior === 'talkative' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Muito Conversador
                          </span>
                        )}
                      </td>

                      {/* Special Needs */}
                      <td className="py-3.5 px-4">
                        {student.specialNeeds.length === 0 ? (
                          <span className="text-slate-400 dark:text-zinc-500 text-xs">Padrão</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {student.specialNeeds.map(need => (
                              <span
                                key={need}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/40"
                                title={student.specialNeedsNotes || undefined}
                              >
                                {need === 'low_vision' && <Eye className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
                                {need === 'hearing_impairment' && <Ear className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
                                {need === 'adhd_focus' && <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                                {need === 'wheelchair_mobility' && <Accessibility className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                                {need === 'tall_student' && <ArrowUpNarrowWide className="w-3 h-3 text-purple-600 dark:text-purple-400" />}
                                {need === 'low_vision' && 'Baixa Visão'}
                                {need === 'hearing_impairment' && 'Auditivo'}
                                {need === 'adhd_focus' && 'TDAH/Foco'}
                                {need === 'wheelchair_mobility' && 'Cadeirante'}
                                {need === 'tall_student' && 'Muito Alto'}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Affinities */}
                      <td className="py-3.5 px-4">
                        {affinityNames.length === 0 ? (
                          <span className="text-slate-400 dark:text-zinc-500 text-xs">-</span>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/30">
                              <Heart className="w-3 h-3 fill-emerald-500 text-emerald-600 dark:text-emerald-400" />
                              {affinityNames.join(', ')}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Anti-Affinities */}
                      <td className="py-3.5 px-4">
                        {antiAffinityNames.length === 0 ? (
                          <span className="text-slate-400 dark:text-zinc-500 text-xs">-</span>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/30">
                              <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                              {antiAffinityNames.join(', ')}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenEditStudentModal(student)}
                            title="Editar informações do aluno"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-indigo-400 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setStudentToDelete(student)}
                            title="Excluir aluno"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-100 dark:text-zinc-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Student Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121216] rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-950/40 max-w-md w-full overflow-hidden flex flex-col text-slate-900 dark:text-zinc-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-rose-50 dark:bg-[#171418]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base font-display">
                    Excluir Aluno
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">Remoção da turma</p>
                </div>
              </div>
              <button
                onClick={() => setStudentToDelete(null)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="text-rose-900 dark:text-rose-200 font-bold">
                    Tem certeza que deseja remover este aluno?
                  </p>
                  <p className="text-rose-800/90 dark:text-rose-300/80 leading-relaxed">
                    Você está removendo <strong className="text-slate-900 dark:text-white font-bold">{studentToDelete.name}</strong> da turma <strong className="text-slate-900 dark:text-white font-bold">{classroom.name}</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setStudentToDelete(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteStudent(studentToDelete.id);
                    setStudentToDelete(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-950/50 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
