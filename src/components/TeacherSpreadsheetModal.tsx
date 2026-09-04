import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  HeartHandshake, 
  ShieldAlert, 
  Eye, 
  Ear, 
  Users, 
  Sparkles,
  Info,
  ExternalLink,
  TableProperties,
  ChevronDown,
  ListFilter
} from 'lucide-react';
import { Classroom, Institution } from '../types';
import { 
  downloadTeacherSpreadsheetExcel, 
  downloadTeacherSpreadsheetCSV 
} from '../utils/teacherSpreadsheetGenerator';

interface TeacherSpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: Classroom;
  institution?: Institution;
}

export const TeacherSpreadsheetModal: React.FC<TeacherSpreadsheetModalProps> = ({
  isOpen,
  onClose,
  classroom,
  institution,
}) => {
  if (!isOpen) return null;

  const [includeExisting, setIncludeExisting] = useState<boolean>(
    classroom.students && classroom.students.length > 0
  );
  const [activeTab, setActiveTab] = useState<'preview' | 'guide' | 'dictionary'>('preview');

  const instName = institution?.name || classroom.schoolName || 'FLEMING FLORIPA';
  const instCode = institution?.code || 'FLEMING-EDU';

  const handleDownloadExcel = () => {
    downloadTeacherSpreadsheetExcel(classroom, institution, {
      includeCurrentStudents: includeExisting,
    });
  };

  const handleDownloadCSV = () => {
    downloadTeacherSpreadsheetCSV(classroom, institution, {
      includeCurrentStudents: includeExisting,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121216] text-slate-900 dark:text-zinc-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-5xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Institucional */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200 dark:border-zinc-800 bg-emerald-950 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-emerald-600/20 to-transparent pointer-events-none" />
          
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-emerald-800/80 text-emerald-300 border border-emerald-700/60 flex items-center justify-center shadow-inner">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {instCode}
                </span>
                <span className="text-xs text-emerald-300/80 font-medium">
                  {instName}
                </span>
              </div>
              <h3 className="font-bold text-lg text-white font-display flex items-center gap-2">
                Planilha Oficial do Professor Regente
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-emerald-100 flex items-center justify-center transition-all cursor-pointer relative z-10"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar & Mode Selector */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-[#16161c] border-b border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Options toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">Conteúdo do arquivo:</span>
            <div className="flex items-center bg-slate-200 dark:bg-zinc-800/80 p-0.5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setIncludeExisting(false)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  !includeExisting
                    ? 'bg-white dark:bg-[#1f1f28] text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                Planilha Modelo em Branco
              </button>
              <button
                onClick={() => setIncludeExisting(true)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  includeExisting
                    ? 'bg-white dark:bg-[#1f1f28] text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                }`}
              >
                <span>Pré-preencher com Alunos Atuais</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                  {classroom.students?.length || 0}
                </span>
              </button>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 dark:bg-[#1f1f28] dark:hover:bg-[#282834] text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Baixar em formato CSV com padrão brasileiro (ponto e vírgula e acentos)"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Baixar CSV (Excel BR)</span>
            </button>

            <button
              onClick={handleDownloadExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs"
              title="Baixar planilha nativa em Excel (.xlsx) com múltiplas abas, guia e formatação institucional"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Baixar Planilha Oficial (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-6 bg-white dark:bg-[#121216]">
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <TableProperties className="w-4 h-4" />
            <span>Estrutura das Colunas & Prévia</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Guia de Preenchimento & Algoritmo de Espelho</span>
          </button>

          <button
            onClick={() => setActiveTab('dictionary')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'dictionary'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Tabelas de Referência & Opções</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              {/* Institutional Banner Card */}
              <div className="p-4.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100 font-display">
                      {instName} • Turma: {classroom.name}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                      Esta planilha foi desenhada especificamente para que você, professor regente, preencha as particularidades dos estudantes. Ao carregar o arquivo preenchido, o sistema gera o espelho de carteiras respeitando 100% das suas orientações.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 shadow-xs">
                    Ano: {classroom.academicYear || '2026'}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs">
                    Regente: {classroom.teacherName || 'Professor'}
                  </span>
                </div>
              </div>

              {/* Dropdown Feature Announcement */}
              <div className="p-4 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-start gap-3 shadow-xs">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                  <ListFilter className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                      Listas Suspensas (Dropdowns) Nativas Integradas
                    </h5>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-600 text-white">
                      Em cada célula
                    </span>
                  </div>
                  <p className="text-xs text-emerald-900/90 dark:text-emerald-300/90 mt-1">
                    No arquivo Excel (.xlsx), cada coluna padronizada (Gênero, Perfil Comportamental, Nível Acadêmico, Visão, Audição, Mobilidade, Condição/Laudo, Fileira, Prioridades de Parceria e Níveis de Separação) já possui uma <strong>setinha de seleção suspensa (dropdown)</strong>. Basta clicar sobre qualquer célula para escolher a opção desejada rapidamente!
                  </p>
                </div>
              </div>

              {/* Functional Column Grouping Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Grupos de Colunas da Planilha (19 Colunas Inteligentes)
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Compatível com Microsoft Excel, Google Planilhas e LibreOffice
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Bloco 1 */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-zinc-800 shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold">
                      <Users className="w-4 h-4" />
                      <span>1. Identificação do Aluno</span>
                    </div>
                    <ul className="space-y-1 text-slate-600 dark:text-zinc-400 text-[11px]">
                      <li>• <strong>Nº Chamada:</strong> Número de ordem</li>
                      <li>• <strong>Nome Completo:</strong> Nome oficial</li>
                      <li>• <strong>Apelido / Nome Social:</strong> Como gosta de ser chamado</li>
                      <li>• <strong>Gênero:</strong> M / F / Outro</li>
                    </ul>
                  </div>

                  {/* Bloco 2 */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-zinc-800 shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-400 font-bold">
                      <Eye className="w-4 h-4" />
                      <span>2. Perfil & Inclusão</span>
                    </div>
                    <ul className="space-y-1 text-slate-600 dark:text-zinc-400 text-[11px]">
                      <li>• <strong>Perfil:</strong> Calmo, Moderado ou Muito Conversador</li>
                      <li>• <strong>Visão & Audição:</strong> Normal ou Precisa de Frente</li>
                      <li>• <strong>Mobilidade:</strong> Cadeirante / Corredor</li>
                      <li>• <strong>Condição / Laudo:</strong> TDAH, Autismo, Aluno Alto, etc.</li>
                      <li>• <strong>Preferência de Fileira:</strong> Frente, Fundo, Meio</li>
                    </ul>
                  </div>

                  {/* Bloco 3 */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-zinc-800 shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-rose-800 dark:text-rose-400 font-bold">
                      <HeartHandshake className="w-4 h-4 text-emerald-600" />
                      <span>3. Proximidade no Espelho</span>
                    </div>
                    <ul className="space-y-1 text-slate-600 dark:text-zinc-400 text-[11px]">
                      <li>• <strong>PODEM FICAR PERTO:</strong> Nomes ou números dos colegas</li>
                      <li>• <strong>Prioridade da Parceria:</strong> Alta (+3), Média (+2), Baixa (+1)</li>
                      <li>• <strong>NÃO PODEM FICAR PERTO:</strong> Nomes ou números de quem afastar</li>
                      <li>• <strong>Nível de Separação:</strong> Crítica (-3), Moderada (-2), Leve (-1)</li>
                      <li>• <strong>Motivos Pedagógicos:</strong> Apoio, Estudo, Conversa, etc.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Interactive Mock Table Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Amostra das Linhas de Exemplo que acompanham o arquivo
                  </h4>
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-400 font-semibold">
                    Cores temáticas aplicadas nativamente no Excel (.xlsx)
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xs bg-white dark:bg-[#14141a]">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-emerald-900 text-white font-bold divide-x divide-emerald-800">
                        <th className="py-2.5 px-3 whitespace-nowrap">Nº</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Nome Completo</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>Perfil</span>
                            <ChevronDown className="w-3.5 h-3.5 text-emerald-300" />
                          </div>
                        </th>
                        <th className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>Inclusão / Laudo</span>
                            <ChevronDown className="w-3.5 h-3.5 text-emerald-300" />
                          </div>
                        </th>
                        <th className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span>Fileira</span>
                            <ChevronDown className="w-3.5 h-3.5 text-emerald-300" />
                          </div>
                        </th>
                        <th className="py-2.5 px-3 whitespace-nowrap bg-emerald-800 text-emerald-200">
                          <div className="flex items-center gap-1">
                            <span>Podem Perto (Prioridade)</span>
                            <ChevronDown className="w-3.5 h-3.5 text-emerald-300" />
                          </div>
                        </th>
                        <th className="py-2.5 px-3 whitespace-nowrap bg-rose-900 text-rose-200">
                          <div className="flex items-center gap-1">
                            <span>NÃO Podem Perto (Separação)</span>
                            <ChevronDown className="w-3.5 h-3.5 text-rose-300" />
                          </div>
                        </th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Observações Regente</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 text-slate-700 dark:text-zinc-300">
                      <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-zinc-100">1</td>
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-zinc-100 whitespace-nowrap">Alice Monteiro</td>
                        <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Calmo / Focado</span></td>
                        <td className="py-2 px-3">Nenhuma</td>
                        <td className="py-2 px-3 font-medium">Frente</td>
                        <td className="py-2 px-3 font-medium text-emerald-800 dark:text-emerald-400">Bernardo Silva; Caio [Alta +3]</td>
                        <td className="py-2 px-3 font-medium text-rose-800 dark:text-rose-400">Gabriel Santos [Obrigatória -3]</td>
                        <td className="py-2 px-3 text-slate-500">Excelente aluna para monitoria</td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-zinc-100">2</td>
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-zinc-100 whitespace-nowrap">Bernardo Silva</td>
                        <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">Moderado</span></td>
                        <td className="py-2 px-3 text-amber-700 dark:text-amber-400 font-medium">TDAH (Laudo)</td>
                        <td className="py-2 px-3 font-medium">Frente</td>
                        <td className="py-2 px-3 font-medium text-emerald-800 dark:text-emerald-400">Alice Monteiro [Alta +3]</td>
                        <td className="py-2 px-3 font-medium text-rose-800 dark:text-rose-400">Gabriel Santos [Obrigatória -3]</td>
                        <td className="py-2 px-3 text-slate-500">Rendimento melhora perto de Alice</td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-zinc-100">3</td>
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-zinc-100 whitespace-nowrap">Gabriel Santos</td>
                        <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">Muito Conversador</span></td>
                        <td className="py-2 px-3">Nenhuma</td>
                        <td className="py-2 px-3 font-medium">Meio</td>
                        <td className="py-2 px-3 text-slate-400">-</td>
                        <td className="py-2 px-3 font-medium text-rose-800 dark:text-rose-400">Bernardo; Alice [Obrigatória -3]</td>
                        <td className="py-2 px-3 text-slate-500">Conversa muito em grupo</td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-zinc-100">4</td>
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-zinc-100 whitespace-nowrap">Lucas Ferreira</td>
                        <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">Moderado</span></td>
                        <td className="py-2 px-3 text-indigo-700 dark:text-indigo-400 font-medium">Aluno Alto (1,91m)</td>
                        <td className="py-2 px-3 font-medium text-indigo-800 dark:text-indigo-400 font-bold">Fundo</td>
                        <td className="py-2 px-3 text-slate-400">-</td>
                        <td className="py-2 px-3 text-slate-400">-</td>
                        <td className="py-2 px-3 text-slate-500">Fundo para não tapar visão</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-6 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
              <div className="bg-emerald-50/80 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/40">
                <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Como as informações da planilha influenciam o algoritmo de espelho
                </h4>
                <p className="mt-1 text-slate-600 dark:text-zinc-400">
                  O gerador de espelhos do Fleming Seating Studio utiliza inteligência computacional (Simulated Annealing com busca local guiada). Ele avalia milhares de combinações de carteiras até encontrar a harmonia máxima para a turma.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Coluna Verde: Afinidades */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#16161e] border border-emerald-200 dark:border-emerald-900/40 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-sm">
                    <HeartHandshake className="w-5 h-5 text-emerald-600" />
                    <span>Quem PODE Ficar Perto (Afinidades Pedagógicas)</span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-400">
                    Indique os estudantes que produzem melhor juntos. O motor de cálculo atrai estes alunos para carteiras adjacentes (lado a lado ou frente/atrás).
                  </p>
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-emerald-700 dark:text-emerald-400">Alta (+3):</span>
                      <span className="text-slate-500">Parcerias essenciais (monitoria, acolhimento)</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-emerald-700 dark:text-emerald-400">Média (+2):</span>
                      <span className="text-slate-500">Trabalhos em dupla e boa cooperação</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-emerald-700 dark:text-emerald-400">Baixa (+1):</span>
                      <span className="text-slate-500">Boa convivência em geral</span>
                    </div>
                  </div>
                </div>

                {/* Coluna Vermelha: Desafinidades */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#16161e] border border-rose-200 dark:border-rose-900/40 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-400 font-bold text-sm">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    <span>Quem NÃO PODE Ficar Perto (Distanciamento)</span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-400">
                    Evite atritos, indisciplina e dispersão em sala. O algoritmo repele os alunos marcados para lados opostos da sala.
                  </p>
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-rose-700 dark:text-rose-400">Separação Obrigatória (-3):</span>
                      <span className="text-slate-500">Proibido ficarem adjacentes ou na mesma linha</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-rose-700 dark:text-rose-400">Evitar Vizinhança (-2):</span>
                      <span className="text-slate-500">Separação recomendada por distração mútua</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-rose-700 dark:text-rose-400">Afastamento (-1):</span>
                      <span className="text-slate-500">Leve preferência por carteiras distantes</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passo a passo do Professor */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#16161e] border border-slate-200 dark:border-zinc-800 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                  Fluxo Recomendado para o Regente
                </h4>
                <ol className="space-y-2 list-decimal list-inside text-slate-600 dark:text-zinc-400">
                  <li><strong>Baixe a Planilha:</strong> Clique no botão verde "Baixar Planilha Oficial (.xlsx)" no topo deste modal.</li>
                  <li><strong>Abra no seu editor favorito:</strong> Abra no Microsoft Excel, Google Drive / Planilhas ou LibreOffice.</li>
                  <li><strong>Preencha os Alunos:</strong> Digite o nome, número de chamada e selecione as características de cada estudante.</li>
                  <li><strong>Defina as Parcerias & Distanciamentos:</strong> Use o nome ou número de chamada dos colegas nas colunas "PODEM FICAR PERTO" e "NÃO PODEM FICAR PERTO".</li>
                  <li><strong>Importe de volta:</strong> Na aba "Alunos" do sistema, clique em "Importar Planilha / CSV" e solte o arquivo. O cadastro é atualizado em segundos!</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: DICTIONARY */}
          {activeTab === 'dictionary' && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-600 dark:text-zinc-400">
                Consulte as opções padronizadas aceitas pelo sistema para garantir que os dados sejam importados sem qualquer divergência:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-zinc-800 space-y-2">
                  <h5 className="font-bold text-slate-900 dark:text-zinc-100">Perfil Comportamental</h5>
                  <ul className="space-y-1 text-slate-600 dark:text-zinc-400 text-[11px]">
                    <li>• <code className="bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-800 dark:text-emerald-400 font-bold">Calmo / Focado</code></li>
                    <li>• <code className="bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-blue-800 dark:text-blue-400 font-bold">Moderado</code></li>
                    <li>• <code className="bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-amber-800 dark:text-amber-400 font-bold">Muito Conversador</code></li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-zinc-800 space-y-2">
                  <h5 className="font-bold text-slate-900 dark:text-zinc-100">Visão / Audição / Mobilidade</h5>
                  <ul className="space-y-1 text-slate-600 dark:text-zinc-400 text-[11px]">
                    <li>• <strong>Visão:</strong> Normal | Precisa de Frente | Baixa Visão</li>
                    <li>• <strong>Audição:</strong> Normal | Precisa de Frente</li>
                    <li>• <strong>Mobilidade:</strong> Não | Sim (Cadeirante / Corredor)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-zinc-800 space-y-2">
                  <h5 className="font-bold text-slate-900 dark:text-zinc-100">Preferência de Fileira</h5>
                  <ul className="space-y-1 text-slate-600 dark:text-zinc-400 text-[11px]">
                    <li>• <code className="bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-bold">Frente</code> (Fileiras 1 ou 2)</li>
                    <li>• <code className="bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-bold">Fundo</code> (Últimas fileiras / Alunos altos)</li>
                    <li>• <code className="bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-bold">Meio</code> ou <code className="bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-bold">Indiferente</code></li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-zinc-800 space-y-2">
                  <h5 className="font-bold text-slate-900 dark:text-zinc-100">Condição Especial / Laudo</h5>
                  <ul className="space-y-1 text-slate-600 dark:text-zinc-400 text-[11px]">
                    <li>• TDAH / Foco</li>
                    <li>• TEA / Autismo</li>
                    <li>• Aluno Alto</li>
                    <li>• Cadeirante / Mobilidade</li>
                    <li>• Baixa Visão / Dificuldade Auditiva</li>
                    <li>• Nenhuma</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-zinc-800 space-y-2 sm:col-span-2">
                  <h5 className="font-bold text-slate-900 dark:text-zinc-100">Motivos Pedagógicos Sugeridos</h5>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-zinc-400">
                    <div>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">Para Afinidades (+):</span>
                      <p>• Apoio Pedagógico & Monitoria</p>
                      <p>• Trabalho em Dupla / Estudo</p>
                      <p>• Sinergia de Foco / Produtividade</p>
                      <p>• Inclusão & Acolhimento</p>
                    </div>
                    <div>
                      <span className="font-bold text-rose-700 dark:text-rose-400 block mb-1">Para Desafinidades (-):</span>
                      <p>• Conversa Excessiva / Dispersão</p>
                      <p>• Conflito / Atrito Comportamental</p>
                      <p>• Distração Mútua</p>
                      <p>• Histórico de Indisciplina</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#16161c] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
            <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>O arquivo gerado é 100% compatível com a função de importação em lote do sistema.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Fechar
            </button>
            <button
              onClick={handleDownloadExcel}
              className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Excel Oficial (.xlsx)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
