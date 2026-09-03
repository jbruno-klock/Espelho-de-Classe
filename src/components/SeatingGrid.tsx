import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  X, 
  Eye, 
  Ear, 
  Zap, 
  Accessibility, 
  ArrowUpNarrowWide, 
  Heart, 
  AlertTriangle, 
  User, 
  Users,
  Users2,
  Presentation, 
  DoorOpen, 
  Sparkles,
  Layers,
  Info
} from 'lucide-react';
import { Classroom, Student, RoomConfig } from '../types';

interface SeatingGridProps {
  classroom: Classroom;
  onSwapDesks: (deskId1: string, deskId2: string) => void;
  onAssignStudentToDesk: (studentId: string, deskId: string) => void;
  onRemoveStudentFromDesk: (deskId: string) => void;
  onToggleLockDesk: (deskId: string) => void;
  onSelectStudent: (student: Student) => void;
}

export const SeatingGrid: React.FC<SeatingGridProps> = ({
  classroom,
  onSwapDesks,
  onAssignStudentToDesk,
  onRemoveStudentFromDesk,
  onToggleLockDesk,
  onSelectStudent,
}) => {
  const [selectedDeskId, setSelectedDeskId] = useState<string | null>(null);
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);
  const [draggedDeskId, setDraggedDeskId] = useState<string | null>(null);
  const [hoveredStudentId, setHoveredStudentId] = useState<string | null>(null);

  const { rows, cols, layoutType, teacherDeskPosition, doorPosition, windowPosition, activeDesks } = classroom.roomConfig;
  const seatingMap = classroom.seatingMap || {};
  const lockedDesks = classroom.lockedDesks || {};

  // Build lookup maps
  const studentMap = new Map<string, Student>();
  classroom.students.forEach(s => studentMap.set(s.id, s));

  // Find unassigned students
  const assignedStudentIds = new Set(Object.values(seatingMap).filter(Boolean) as string[]);
  const unassignedStudents = classroom.students.filter(s => !assignedStudentIds.has(s.id));

  // Active student for relationship highlight (either selected or hovered)
  const activeHighlightStudentId = selectedDeskId ? seatingMap[selectedDeskId] : hoveredStudentId;
  const highlightStudent = activeHighlightStudentId ? studentMap.get(activeHighlightStudentId) : null;

  // Handle desk click
  const handleDeskClick = (deskId: string) => {
    if (!selectedDeskId) {
      // First click: select this desk
      setSelectedDeskId(deskId);
    } else if (selectedDeskId === deskId) {
      // Clicked same desk: deselect
      setSelectedDeskId(null);
    } else {
      // Second click on different desk: SWAP or MOVE!
      onSwapDesks(selectedDeskId, deskId);
      setSelectedDeskId(null);
    }
  };

  // Drag and drop handlers
  const handleDragStartDesk = (e: React.DragEvent, deskId: string, studentId: string) => {
    setDraggedDeskId(deskId);
    setDraggedStudentId(studentId);
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'desk', deskId, studentId }));
  };

  const handleDragStartUnassigned = (e: React.DragEvent, studentId: string) => {
    setDraggedDeskId(null);
    setDraggedStudentId(studentId);
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'unassigned', studentId }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnDesk = (e: React.DragEvent, targetDeskId: string) => {
    e.preventDefault();
    if (draggedDeskId) {
      onSwapDesks(draggedDeskId, targetDeskId);
    } else if (draggedStudentId) {
      onAssignStudentToDesk(draggedStudentId, targetDeskId);
    }
    setDraggedDeskId(null);
    setDraggedStudentId(null);
    setSelectedDeskId(null);
  };

  // Density-based styling configuration based on total columns
  const isHighDensity = cols >= 6;
  const isVeryHighDensity = cols >= 8;
  const isUltraDensity = cols >= 11;

  return (
    <div className="space-y-4 w-full">
      
      {/* Classroom Container */}
      <div className="w-full bg-white dark:bg-[#121216] rounded-3xl p-3 sm:p-5 md:p-6 border border-slate-200 dark:border-zinc-800/80 shadow-sm relative overflow-hidden flex flex-col items-center transition-colors">
        
        {/* Top Header: Blackboard / Quadro & Room Boundaries */}
        <div className="w-full flex flex-col items-center mb-4">
          
          {/* Windows / Door Top Indicators if configured */}
          <div className="w-full flex justify-between items-center text-xs text-slate-600 dark:text-zinc-400 mb-2 px-1 sm:px-3">
            <span className="flex items-center gap-1.5 font-medium">
              🪟 Parede com Janelas {windowPosition === 'left' ? '(Esquerda)' : ''}
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              🚪 Porta de Acesso {doorPosition.includes('right') ? '(Direita)' : '(Esquerda)'}
            </span>
          </div>

          {/* Blackboard / Lousa */}
          <div className="w-full bg-slate-900 dark:bg-[#0c0c10] border-4 border-slate-800 dark:border-amber-950/70 rounded-2xl py-3 px-3 sm:px-6 text-center shadow-md flex items-center justify-between relative">
            <div className="flex items-center gap-2.5 min-w-0">
              <Presentation className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-left hidden sm:block truncate">
                <span className="font-extrabold text-xs uppercase tracking-widest text-emerald-400 font-display block">
                  QUADRO NEGRO & TELA INTERATIVA
                </span>
                <p className="text-[10px] text-slate-300 dark:text-zinc-400 truncate">
                  {classroom.schoolName} • {classroom.name} • {classroom.academicYear}
                </p>
              </div>
            </div>

            <div className="sm:hidden text-center truncate px-1">
              <span className="font-extrabold text-xs uppercase tracking-widest text-emerald-400 font-display">
                QUADRO (FRENTE)
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-200 dark:text-zinc-300 bg-slate-800 dark:bg-zinc-900 border border-slate-700 dark:border-zinc-800 px-2.5 py-1 rounded-lg shrink-0">
              <span>Fila 1 = Frente</span>
            </div>
          </div>

          {/* Teacher's Desk */}
          {teacherDeskPosition !== 'none' && (
            <div className={`w-full flex mt-2.5 px-1 ${
              teacherDeskPosition === 'front_left' ? 'justify-start' : teacherDeskPosition === 'front_right' ? 'justify-end' : 'justify-center'
            }`}>
              <div className="bg-amber-50 dark:bg-[#1a1714] border border-amber-300 dark:border-amber-800/40 text-amber-900 dark:text-amber-300 px-3.5 py-1 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2">
                <span>👨‍🏫 Mesa do(a) Professor(a)</span>
                <span className="text-[10px] font-normal text-amber-700 dark:text-amber-400/80">({classroom.teacherName})</span>
              </div>
            </div>
          )}
        </div>

        {/* Desks Grid - Framed with smooth scroll on high column count if screen is narrow */}
        <div className="w-full flex justify-center overflow-x-auto pb-2">
          <div
            className={`grid p-2 sm:p-3 md:p-4 bg-slate-50 dark:bg-[#0a0a0d]/80 rounded-2xl border border-slate-200 dark:border-zinc-800/60 shadow-inner w-full ${
              isUltraDensity
                ? 'gap-1 sm:gap-1.5'
                : isVeryHighDensity 
                ? 'gap-1.5 sm:gap-2' 
                : isHighDensity 
                ? 'gap-2 sm:gap-2.5' 
                : 'gap-2.5 sm:gap-3.5'
            }`}
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(${cols >= 12 ? '48px' : cols >= 9 ? '56px' : '0'}, 1fr))`,
              minWidth: cols >= 12 ? `${cols * 50}px` : cols >= 9 ? `${cols * 58}px` : '100%',
            }}
          >
            {Array.from({ length: rows }).map((_, r) =>
              Array.from({ length: cols }).map((_, c) => {
                const deskId = `r${r}_c${c}`;
                const isActive = activeDesks[deskId] !== false;

                if (!isActive) {
                  // Inactive desk (aisle / corridor / pillar)
                  return (
                    <div
                      key={deskId}
                      className={`${
                        isUltraDensity ? 'min-h-[64px] sm:min-h-[76px]' : 'min-h-[72px] sm:min-h-[88px]'
                      } rounded-xl border border-dashed border-slate-300 dark:border-zinc-800/50 bg-slate-100/60 dark:bg-zinc-900/20 flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-slate-400 dark:text-zinc-500 select-none`}
                    >
                      Corredor
                    </div>
                  );
                }

                const studentId = seatingMap[deskId];
                const student = studentId ? studentMap.get(studentId) : null;
                const isLocked = lockedDesks[deskId];
                const isSelected = selectedDeskId === deskId;

                // Affinity / Anti-affinity highlight check
                let highlightClass = '';
                let highlightBadge = null;

                if (highlightStudent && student && student.id !== highlightStudent.id) {
                  const isAffinity = highlightStudent.affinities.includes(student.id) || student.affinities.includes(highlightStudent.id);
                  const isAnti = highlightStudent.antiAffinities.includes(student.id) || student.antiAffinities.includes(highlightStudent.id);

                  if (isAffinity) {
                    highlightClass = 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 shadow-md animate-pulse border-emerald-400 dark:border-emerald-500/50';
                    highlightBadge = (
                      <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white rounded-full p-0.5 shadow-md text-[8px] font-bold flex items-center gap-0.5 z-20">
                        <Heart className="w-2.5 h-2.5 fill-white" />
                      </span>
                    );
                  } else if (isAnti) {
                    highlightClass = 'ring-2 ring-rose-500 bg-rose-50 dark:bg-rose-950/40 shadow-md animate-bounce border-rose-400 dark:border-rose-500/50';
                    highlightBadge = (
                      <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 shadow-md text-[8px] font-bold flex items-center gap-0.5 z-20">
                        <AlertTriangle className="w-2.5 h-2.5" />
                      </span>
                    );
                  }
                }

                return (
                  <div
                    key={deskId}
                    onClick={() => handleDeskClick(deskId)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnDesk(e, deskId)}
                    onMouseEnter={() => student && setHoveredStudentId(student.id)}
                    onMouseLeave={() => setHoveredStudentId(null)}
                    draggable={!!student}
                    onDragStart={(e) => student && handleDragStartDesk(e, deskId, student.id)}
                    className={`${
                      isUltraDensity
                        ? 'min-h-[64px] sm:min-h-[76px] md:min-h-[84px] p-1 sm:p-1.5'
                        : isHighDensity
                        ? 'min-h-[76px] sm:min-h-[92px] md:min-h-[100px] p-1 sm:p-2'
                        : 'min-h-[76px] sm:min-h-[92px] md:min-h-[100px] p-1.5 sm:p-2.5'
                    } rounded-xl sm:rounded-2xl transition-all duration-150 relative flex flex-col justify-between cursor-pointer border ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 shadow-lg scale-102 z-10'
                        : highlightClass
                        ? highlightClass
                        : student
                        ? 'bg-white dark:bg-[#181820] border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50 dark:hover:bg-[#1e1e27] shadow-xs'
                        : 'bg-white/70 dark:bg-zinc-900/30 border-dashed border-slate-300 dark:border-zinc-800/80 text-slate-500 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-indigo-950/20 hover:border-emerald-400 dark:hover:border-indigo-500/40'
                    }`}
                  >
                    {highlightBadge}

                    {/* Desk Top Bar: Position Coordinate & Lock/Remove */}
                    <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
                      <span className={`font-extrabold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800/80 ${
                        isUltraDensity ? 'px-0.5 py-0.2 text-[7px] sm:text-[8px]' : 'px-1 py-0.2 sm:px-1.5 sm:py-0.5 text-[8px] sm:text-[9px]'
                      } rounded-md border border-slate-200 dark:border-zinc-700/40`}>
                        F{r + 1}•C{c + 1}
                      </span>

                      {student && (
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleLockDesk(deskId);
                            }}
                            title={isLocked ? 'Desbloquear carteira' : 'Fixar aluno nesta carteira'}
                            className={`p-0.5 sm:p-1 rounded-md transition-colors cursor-pointer ${
                              isLocked ? 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 font-bold border border-amber-300 dark:border-amber-800/40' : 'text-slate-400 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200'
                            }`}
                          >
                            {isLocked ? <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <Unlock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveStudentFromDesk(deskId);
                            }}
                            title="Desalocar aluno da carteira"
                            className="p-0.5 sm:p-1 rounded-md text-slate-400 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Desk Center Content: Student Info */}
                    {student ? (
                      <div className="my-auto py-0.5">
                        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                          <div
                            className={`${
                              isUltraDensity ? 'w-3.5 h-3.5 sm:w-4 sm:h-4 text-[8px]' : 'w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[9px] sm:text-[10px]'
                            } rounded-md sm:rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-xs`}
                            style={{ backgroundColor: student.avatarColor || '#6366f1' }}
                          >
                            {student.rollNumber}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`${
                              isUltraDensity ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs'
                            } font-bold text-slate-900 dark:text-zinc-100 truncate leading-tight`}>
                              {student.name.split(' ')[0]} {isHighDensity ? '' : (student.name.split(' ')[1] || '')}
                            </p>
                            {student.nickname && !isVeryHighDensity && (
                              <p className="text-[8px] sm:text-[9px] text-slate-500 dark:text-zinc-400 truncate leading-tight">
                                "{student.nickname}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Special Needs & Behavior Icons */}
                        <div className="flex items-center gap-0.5 sm:gap-1 mt-1 flex-wrap">
                          {student.specialNeeds.map(n => (
                            <span key={n} className="text-indigo-600 dark:text-indigo-400" title={n}>
                              {n === 'low_vision' && <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                              {n === 'hearing_impairment' && <Ear className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                              {n === 'adhd_focus' && <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 dark:text-amber-400" />}
                              {n === 'wheelchair_mobility' && <Accessibility className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 dark:text-emerald-400" />}
                              {n === 'tall_student' && <ArrowUpNarrowWide className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-600 dark:text-purple-400" />}
                            </span>
                          ))}

                          {student.behavior === 'talkative' && (
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 dark:bg-amber-400 inline-block" title="Muito Conversador" />
                          )}
                          {student.behavior === 'calm' && (
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 inline-block" title="Calmo" />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center my-auto text-slate-400 dark:text-zinc-500 py-1">
                        <span className="text-[9px] sm:text-[10px] font-semibold">Vazio</span>
                      </div>
                    )}

                    {/* Bottom Indicator */}
                    <div className="text-[8px] text-slate-400 dark:text-zinc-500 text-center leading-none">
                      {isLocked ? '🔒' : ''}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Classroom Back Wall */}
        <div className="w-full mt-3 pt-2.5 border-t border-slate-200 dark:border-zinc-800 text-center text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-widest flex items-center justify-center gap-3">
          <div className="h-px bg-slate-200 dark:bg-zinc-800 flex-1" />
          <span>FUNDO DA SALA DE AULA</span>
          <div className="h-px bg-slate-200 dark:bg-zinc-800 flex-1" />
        </div>

      </div>

      {/* Unassigned Students Dock (if any) */}
      {unassignedStudents.length > 0 && (
        <div className="bg-amber-50 dark:bg-[#161310] rounded-3xl p-5 border border-amber-200 dark:border-amber-800/40 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-2">
              <Users2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Alunos Não Alocados / Reserva ({unassignedStudents.length})
            </h4>
            <span className="text-xs text-amber-700 dark:text-amber-400/80 font-medium">
              Arraste para uma carteira vazia ou clique na carteira para alocar
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {unassignedStudents.map((s) => (
              <div
                key={s.id}
                draggable
                onDragStart={(e) => handleDragStartUnassigned(e, s.id)}
                onClick={() => onSelectStudent(s)}
                className="px-3 py-1.5 bg-white dark:bg-[#201c18] border border-amber-300 dark:border-amber-700/50 rounded-xl text-xs font-semibold text-slate-900 dark:text-zinc-200 shadow-xs flex items-center gap-2 cursor-grab active:cursor-grabbing hover:border-amber-500 transition-all"
              >
                <span
                  className="w-5 h-5 rounded-md text-white font-bold text-[10px] flex items-center justify-center"
                  style={{ backgroundColor: s.avatarColor }}
                >
                  {s.rollNumber}
                </span>
                <span>{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guide / Legend Card */}
      <div className="bg-white dark:bg-[#121216] p-4 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700 dark:text-zinc-300 transition-colors">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-bold text-slate-900 dark:text-zinc-100">Legenda:</span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Baixa Visão
          </span>
          <span className="flex items-center gap-1">
            <Ear className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Auditivo
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> TDAH / Foco
          </span>
          <span className="flex items-center gap-1">
            <Accessibility className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Cadeirante
          </span>
          <span className="flex items-center gap-1">
            <ArrowUpNarrowWide className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Aluno Alto
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 dark:bg-amber-400 inline-block" /> Conversador
          </span>
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Carteira Travada
          </span>
        </div>

        <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
          💡 Clique em uma carteira e depois em outra para trocar os alunos instantaneamente!
        </span>
      </div>

    </div>
  );
};
