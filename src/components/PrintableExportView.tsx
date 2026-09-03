import React, { useState } from 'react';
import { 
  Download, 
  ArrowLeft, 
  School, 
  Settings,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Hash,
  Printer,
  Bookmark
} from 'lucide-react';
import { Classroom, Institution, Student } from '../types';
import { exportToPdf } from '../utils/exportUtils';
import { ensureClassroomPlans } from '../utils/seatingPlanUtils';

interface PrintableExportViewProps {
  classroom: Classroom;
  institution?: Institution;
  onBackToEditor: () => void;
  onOpenInstitutionSettings?: () => void;
  onSwitchPlan?: (planId: string) => void;
}

export const PrintableExportView: React.FC<PrintableExportViewProps> = ({
  classroom,
  institution,
  onBackToEditor,
  onOpenInstitutionSettings,
  onSwitchPlan,
}) => {
  const { rows, cols, teacherDeskPosition, activeDesks } = classroom.roomConfig;
  const seatingMap = classroom.seatingMap || {};
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [showRollNumbers, setShowRollNumbers] = useState<boolean>(true);

  const { plans, activePlan } = ensureClassroomPlans(classroom);

  const studentMap = new Map<string, Student>();
  classroom.students.forEach(s => studentMap.set(s.id, s));

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    setExportFeedback(null);
    try {
      const sanitizedClassName = classroom.name.replace(/[\s/]+/g, '_');
      const sanitizedPlanName = (activePlan?.name || 'Oficial').replace(/[\s/]+/g, '_');
      const fileName = `espelho_${sanitizedClassName}_${sanitizedPlanName}_${classroom.academicYear}`;
      await exportToPdf('printable-document-content', fileName, classroom, institution, { showRollNumber: showRollNumbers });
      setExportFeedback('PDF gerado e baixado com sucesso!');
      setTimeout(() => setExportFeedback(null), 4000);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setExportFeedback('Erro ao gerar PDF. Verifique se o navegador permite downloads.');
      setTimeout(() => setExportFeedback(null), 5000);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const schoolLogo = institution?.logoUrl || classroom.schoolLogoUrl;
  const displaySchoolName = institution?.name || classroom.schoolName || 'FLEMING FLORIPA';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Action Bar (hidden in print) */}
      <div className="bg-white dark:bg-[#121216] p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 no-print transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToEditor}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer border border-slate-200 dark:border-zinc-700"
            title="Voltar ao editor de espelho"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100 font-display">
                Impressão & PDF
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/40">
                {activePlan.name}
              </span>
              {institution && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 rounded-full border border-emerald-300 dark:border-emerald-500/20">
                  {institution.code}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400">
              Layout padronizado para impressão e exportação em folha A4
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Seletor de Espelho para Impressão Rápida */}
          {plans.length > 1 && onSwitchPlan && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-300 dark:border-zinc-700/60 shadow-xs">
              <Bookmark className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ml-1.5" />
              <select
                value={activePlan.id}
                onChange={(e) => onSwitchPlan(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-zinc-200 text-xs font-bold py-1.5 px-2 rounded-lg cursor-pointer focus:outline-none"
                title="Alternar entre espelhos salvos desta turma para imprimir"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">
                    {p.name} {p.isDefault ? '(Oficial)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Botão para Ativar/Desativar Número da Chamada */}
          <button
            type="button"
            id="toggle-roll-numbers-btn"
            onClick={() => setShowRollNumbers(prev => !prev)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-xs ${
              showRollNumbers 
                ? 'bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60' 
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-400 border-slate-300 dark:border-zinc-700/60'
            }`}
            title={showRollNumbers ? "Clique para desabilitar o número da chamada do PDF e da impressão" : "Clique para habilitar o número da chamada no PDF e na impressão"}
            aria-pressed={showRollNumbers}
          >
            <Hash className={`w-4 h-4 ${showRollNumbers ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
            <span>Nº da Chamada:</span>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider ${
              showRollNumbers 
                ? 'bg-emerald-200/80 dark:bg-emerald-800/70 text-emerald-950 dark:text-emerald-100' 
                : 'bg-slate-200 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400 line-through'
            }`}>
              {showRollNumbers ? 'Ativado' : 'Desativado'}
            </span>
          </button>

          {onOpenInstitutionSettings && (
            <button
              onClick={onOpenInstitutionSettings}
              title="Configurar logotipo e dados da instituição"
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-300 dark:border-zinc-700/60 shadow-xs"
            >
              <Settings className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {schoolLogo ? 'Alterar Logo' : 'Inserir Logo'}
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-300 dark:border-zinc-700/60 shadow-xs"
            title="Imprimir diretamente pelo navegador"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
          >
            {isExportingPDF ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Baixar PDF (A4)
              </>
            )}
          </button>
        </div>
      </div>

      {exportFeedback && (
        <div className={`p-3 rounded-2xl text-xs font-medium flex items-center gap-2 no-print ${
          exportFeedback.includes('sucesso') 
            ? 'bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-100 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/40 text-rose-800 dark:text-rose-300'
        }`}>
          {exportFeedback.includes('sucesso') ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{exportFeedback}</span>
        </div>
      )}

      {/* Printable Sheet (Document Container) */}
      <div
        id="printable-document-content"
        className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm text-slate-900 print:border-none print:shadow-none print:p-0 print:m-0 font-sans"
      >
        {/* 1. CABEÇALHO: Estética Minimalista Premium com Tipografia Sem Serifa */}
        <div className="border-b border-slate-200 pb-5 mb-6">
          {/* Linha Superior: Nome da Escola/Título e Logo Isolada */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-2">
            <div className="flex-1 min-w-0 space-y-1">
              {/* Título da Instituição em Destaque */}
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 font-sans truncate">
                {displaySchoolName}
              </h1>
              {/* Subtítulo Destaque */}
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-600 font-sans flex items-center gap-1.5 flex-wrap">
                <span>ESPELHO DE CLASSE •</span>
                <span className="text-slate-900 font-black">{activePlan.name.toUpperCase()}</span>
                {activePlan.isDefault && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-300 ml-1">
                    OFICIAL
                  </span>
                )}
              </h2>
            </div>

            {/* Contêiner Isolado da Logo com Margem e Dimensões Fixas */}
            <div className="shrink-0 flex items-center sm:justify-end">
              {schoolLogo ? (
                <div className="h-14 sm:h-16 max-w-[200px] flex items-center justify-end p-1">
                  <img 
                    src={schoolLogo} 
                    alt={`Logotipo ${displaySchoolName}`} 
                    className="max-h-14 sm:max-h-16 max-w-[200px] w-auto object-contain block"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="h-12 w-28 border border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-1.5 px-3 bg-slate-50/60 text-slate-400">
                  <School className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Logo
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Metadados Agrupados Estritamente Abaixo da Logo com Respiro Visual Adequado */}
          <div className="pt-3 border-t border-slate-200/90 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 text-xs text-slate-700">
            <div className="flex flex-col bg-slate-50/50 p-2 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Turma</span>
              <span className="font-bold text-slate-900 text-sm truncate" title={classroom.name}>{classroom.name}</span>
            </div>
            <div className="flex flex-col bg-slate-50/50 p-2 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Versão / Espelho</span>
              <span className="font-bold text-emerald-800 text-sm truncate" title={activePlan.name}>{activePlan.name}</span>
            </div>
            <div className="flex flex-col bg-slate-50/50 p-2 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Nível</span>
              <span className="font-semibold text-slate-800 text-sm truncate" title={classroom.grade}>{classroom.grade}</span>
            </div>
            <div className="flex flex-col bg-slate-50/50 p-2 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Professor(a)</span>
              <span className="font-semibold text-slate-800 text-sm truncate" title={classroom.teacherName}>{classroom.teacherName}</span>
            </div>
            <div className="flex flex-col bg-slate-50/50 p-2 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Sala</span>
              <span className="font-semibold text-slate-800 text-sm">{classroom.roomNumber || 'Sala Padrão'}</span>
            </div>
            <div className="flex flex-col bg-slate-50/50 p-2 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Ano Letivo</span>
              <span className="font-semibold text-slate-800 text-sm">{classroom.academicYear}</span>
            </div>
            <div className="flex flex-col bg-slate-50/50 p-2 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total de Alunos</span>
              <span className="font-bold text-slate-900 text-sm">{classroom.students.length} matriculados</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Data de Emissão: <strong className="text-slate-700 font-semibold">{new Date().toLocaleDateString('pt-BR')}</strong></span>
            <span>Documento oficial de organização pedagógica</span>
          </div>
        </div>

        {/* 2. ESPAÇO DA SALA: Tons Institucionais Suaves */}
        <div className="border border-slate-200 rounded-2xl p-6 mb-6 bg-slate-50/40">
          
          {/* Quadro Negro em tom institucional suave e sofisticado */}
          <div 
            id="blackboard-banner"
            className="blackboard-banner bg-slate-700 text-slate-100 py-2 px-4 rounded-xl text-center font-bold text-xs uppercase tracking-widest mb-6 flex items-center justify-center gap-2 border border-slate-600 shadow-xs"
            style={{ backgroundColor: '#334155', color: '#f8fafc' }}
          >
            <span className="text-slate-100 font-bold tracking-wider" style={{ color: '#f8fafc !important' }}>
              QUADRO NEGRO / LOUSA (FRENTE DA SALA)
            </span>
          </div>

          {/* Mesa do Professor em tom institucional suave */}
          {teacherDeskPosition !== 'none' && (
            <div className={`flex mb-5 px-1 ${
              teacherDeskPosition === 'front_left' ? 'justify-start' : teacherDeskPosition === 'front_right' ? 'justify-end' : 'justify-center'
            }`}>
              <div className="border border-slate-300 bg-slate-100/90 text-slate-700 px-4 py-1.5 rounded-lg text-xs font-bold shadow-2xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Mesa do Professor
              </div>
            </div>
          )}

          {/* 3. LAYOUT DAS MESAS: Minimalista Premium */}
          <div
            className={`grid ${cols >= 12 ? 'gap-1' : cols >= 8 ? 'gap-1.5' : 'gap-2 sm:gap-3'}`}
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: rows }).map((_, r) =>
              Array.from({ length: cols }).map((_, c) => {
                const deskId = `r${r}_c${c}`;
                const isActive = activeDesks[deskId] !== false;
                const isCompact = cols >= 12 || rows >= 12;
                const isMediumCompact = cols >= 8 || rows >= 8;

                // CORREDORES: Oculta apenas as células de corredor, usando como espaçamento invisível
                if (!isActive) {
                  return (
                    <div
                      key={deskId}
                      className={`${isCompact ? 'h-14' : isMediumCompact ? 'h-16' : 'h-20'} invisible pointer-events-none`}
                      aria-hidden="true"
                    />
                  );
                }

                const studentId = seatingMap[deskId];
                const student = studentId ? studentMap.get(studentId) : null;

                // CARTEIRAS VAZIAS: Cartões inativos visíveis com fundo levemente acinzentado
                if (!student) {
                  return (
                    <div
                      key={deskId}
                      className={`${isCompact ? 'h-14 p-1' : isMediumCompact ? 'h-16 p-1.5' : 'h-20 p-2.5'} rounded-xl border border-dashed border-slate-200 bg-slate-100/60 flex flex-col items-center justify-center text-center transition-all`}
                    >
                      <span className={`${isCompact ? 'text-[9px]' : 'text-[11px]'} font-medium text-slate-400 tracking-wide`}>
                        Vazia
                      </span>
                    </div>
                  );
                }

                // ALUNOS: Cartões brancos com cantos arredondados, sombras sutis, SEM código de grade, número e nome centralizados
                return (
                  <div
                    key={deskId}
                    className={`${isCompact ? 'h-14 p-1' : isMediumCompact ? 'h-16 p-1.5' : 'h-20 p-2.5'} rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center transition-all hover:border-slate-300`}
                  >
                    {/* Número da chamada centralizado (condicional) */}
                    {showRollNumbers && (
                      <span className={`${isCompact ? 'text-[8px] px-1.5 py-0.2 mb-0.5' : 'text-[10px] px-2 py-0.5 mb-1.5'} font-bold text-slate-600 bg-slate-100 rounded-full inline-flex items-center justify-center leading-none shrink-0`}>
                        Nº {student.rollNumber}
                      </span>
                    )}

                    {/* Nome do aluno centralizado */}
                    <div className="w-full px-0.5 overflow-hidden flex flex-col items-center justify-center">
                      <p 
                        className={`${
                          isCompact 
                            ? (showRollNumbers ? 'text-[8.5px]' : 'text-[9.5px]') 
                            : isMediumCompact 
                            ? (showRollNumbers ? 'text-[10px]' : 'text-[11.5px]') 
                            : (showRollNumbers ? 'text-[11.5px]' : 'text-[13px]')
                        } font-extrabold text-slate-900 text-center leading-tight line-clamp-2`}
                        style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                      >
                        {student.name}
                      </p>
                      {student.nickname && !isCompact && (
                        <p className="text-[9px] text-slate-500 italic truncate mt-0.5 text-center">
                          ({student.nickname})
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Fundo da Sala */}
          <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-6 pt-3 border-t border-slate-200/80">
            FUNDO DA SALA DE AULA
          </div>
        </div>

        {/* Rodapé institucional com linha de assinatura */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
          <p>Plataforma de Gestão Pedagógica • {displaySchoolName}</p>
          <p>Assinatura do(a) Professor(a): ____________________________________</p>
        </div>

      </div>

    </div>
  );
};
