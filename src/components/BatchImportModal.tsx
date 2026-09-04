import React, { useState, useRef } from 'react';
import { 
  X, FileText, Check, Upload, HelpCircle, ArrowRight, ArrowLeft,
  UserCheck, Download, AlertCircle, Sparkles, RefreshCw, CheckCircle2,
  Sliders, Eye, Table, Layers, FileSpreadsheet, Search
} from 'lucide-react';
import { Student, StudentRelation, SpecialNeedType, Classroom, Institution, CanBeNearLevel, CannotBeNearLevel } from '../types';
import { AVATAR_COLORS } from '../utils/sampleData';
import { decodeFileBuffer, normalizeForSearch, fixMojibake } from '../utils/fileImportUtils';
import { downloadTeacherSpreadsheetExcel, downloadTeacherSpreadsheetCSV } from '../utils/teacherSpreadsheetGenerator';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportStudents: (students: Student[], mode: 'append' | 'replace') => void;
  existingStudents?: Student[];
  existingCount: number;
  classroom?: Classroom;
  institution?: Institution;
  onOpenTeacherSpreadsheetModal?: () => void;
}

type TargetField = 
  | 'none'
  | 'name'
  | 'nickname'
  | 'rollNumber'
  | 'gender'
  | 'behavior'
  | 'academicLevel'
  | 'visionNeeds'
  | 'hearingNeeds'
  | 'reducedMobility'
  | 'specialNeeds'
  | 'specialNeedsNotes'
  | 'preferredRow'
  | 'affinities'
  | 'affinityPriority'
  | 'affinityCategory'
  | 'antiAffinities'
  | 'antiAffinitySeverity'
  | 'antiAffinityCategory'
  | 'notes';

interface ColumnMapping {
  csvHeader: string;
  targetField: TargetField;
  sampleValues: string[];
}

interface ParsedRow {
  id: string;
  raw: Record<string, string>;
  student: Student;
  rawAffinitiesStr: string;
  rawAntiAffinitiesStr: string;
  affinityPriorityStr: string;
  affinityCategoryStr: string;
  antiAffinitySeverityStr: string;
  antiAffinityCategoryStr: string;
  isValid: boolean;
  validationMessages: string[];
  selected: boolean;
}

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  onImportStudents,
  existingStudents = [],
  existingCount,
  classroom,
  institution,
  onOpenTeacherSpreadsheetModal,
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Flow steps: 'upload' -> 'mapping' -> 'preview'
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState<string>('');
  const [delimiter, setDelimiter] = useState<string>(',');
  const [hasHeaders, setHasHeaders] = useState(true);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  // CSV parsing state
  const [rawMatrix, setRawMatrix] = useState<string[][]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [searchFilter, setSearchFilter] = useState('');

  // Robust CSV Parser supporting commas, semicolons, tabs, and quotes
  const parseCSVString = (text: string, delim?: string): string[][] => {
    let cleanText = fixMojibake(text.trim());
    if (!cleanText) return [];

    // Auto-detect delimiter if not forced
    let detectedDelim = delim;
    if (!detectedDelim) {
      const firstLine = cleanText.split('\n')[0];
      const semiCount = (firstLine.match(/;/g) || []).length;
      const commaCount = (firstLine.match(/,/g) || []).length;
      const tabCount = (firstLine.match(/\t/g) || []).length;
      if (semiCount > commaCount && semiCount > tabCount) detectedDelim = ';';
      else if (tabCount > commaCount && tabCount > semiCount) detectedDelim = '\t';
      else detectedDelim = ',';
    }
    setDelimiter(detectedDelim);

    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === detectedDelim && !inQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some(c => c !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += char;
      }
    }

    if (currentField !== '' || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some(c => c !== '')) {
        rows.push(currentRow);
      }
    }

    return rows;
  };

  // Heuristic column target detection with accent-insensitive matching
  const detectFieldFromHeader = (header: string): TargetField => {
    const h = normalizeForSearch(header);
    if (/^(nome|aluno|estudante|nome completo|name|student)$/.test(h) || h.includes('nome completo') || h.includes('nome do aluno')) {
      return 'name';
    }
    if (h.includes('apelido') || h.includes('social') || h.includes('nickname') || h.includes('chamado')) {
      return 'nickname';
    }
    if (/^(numero|num|nº|chamada|roll|ordem|id)$/.test(h) || h.includes('chamada') || h.includes('numero')) {
      return 'rollNumber';
    }
    if (/^(genero|sexo|gender|sex)$/.test(h) || h.includes('genero') || h.includes('sexo')) {
      return 'gender';
    }
    if (/^(comportamento|behavior|perfil|conduta)$/.test(h) || h.includes('comportamento') || h.includes('perfil')) {
      return 'behavior';
    }
    if (/^(nivel|academico|desempenho|academic|nivel academico)$/.test(h) || h.includes('academico') || h.includes('desempenho')) {
      return 'academicLevel';
    }
    if (/^(visao|visual|oculos|vision|miopia)$/.test(h) || h.includes('visao') || h.includes('oculo') || h.includes('visual')) {
      return 'visionNeeds';
    }
    if (/^(audicao|auditivo|hearing|aparelho auditivo)$/.test(h) || h.includes('audicao') || h.includes('ouvido') || h.includes('auditivo')) {
      return 'hearingNeeds';
    }
    if (/^(mobilidade|cadeirante|acessibilidade|mobility)$/.test(h) || h.includes('mobilidade') || h.includes('cadeir')) {
      return 'reducedMobility';
    }
    if (h.includes('fileira') || h.includes('posicao') || h.includes('frente ou fundo') || h.includes('preferencia de fileira')) {
      return 'preferredRow';
    }
    if (h.includes('detalhes') || h.includes('observacoes medicas') || h.includes('laudo / recomendacoes') || (h.includes('laudo') && h.includes('detalhes'))) {
      return 'specialNeedsNotes';
    }
    if (/^(necessidades|inclusao|apoio|pcd|tdah|tea|special|laudo)$/.test(h) || h.includes('inclusao') || h.includes('especial') || h.includes('condicao')) {
      return 'specialNeeds';
    }
    // Proximity priority and category detection
    if ((h.includes('prioridade') || h.includes('grau')) && (h.includes('parceria') || h.includes('afinidade') || h.includes('perto') || h.includes('proximidade'))) {
      return 'affinityPriority';
    }
    if (h.includes('motivo') && (h.includes('proximidade') || h.includes('afinidade') || h.includes('perto') || h.includes('parceria'))) {
      return 'affinityCategory';
    }
    if ((h.includes('separacao') || h.includes('severidade') || h.includes('grau')) && (h.includes('distanciamento') || h.includes('desafinidade') || h.includes('separ') || h.includes('afast'))) {
      return 'antiAffinitySeverity';
    }
    if (h.includes('motivo') && (h.includes('distanciamento') || h.includes('separ') || h.includes('desafin') || h.includes('afast'))) {
      return 'antiAffinityCategory';
    }
    // Who can / cannot be near
    if (h.includes('nao podem') || h.includes('nao pode') || h.includes('desafinidade') || h.includes('afastar') || h.includes('separar') || h.includes('conflito') || h.includes('distanciamento')) {
      return 'antiAffinities';
    }
    if (h.includes('podem') || h.includes('pode') || h.includes('afinidade') || h.includes('amigo') || h.includes('juntos') || h.includes('parceria')) {
      return 'affinities';
    }
    if (/^(observacoes|obs|notas|comentarios|notes)$/.test(h) || h.includes('obs') || h.includes('nota') || h.includes('comentario')) {
      return 'notes';
    }
    return 'none';
  };

  // Handle file selection with binary array buffer decoding (supporting XLSX, XLS, CSV, TXT)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        const text = decodeFileBuffer(buffer, file.name);
        if (text) {
          setRawText(text);
          processRawText(text);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processRawText = (text: string) => {
    const normalizedText = fixMojibake(text);
    const matrix = parseCSVString(normalizedText);
    if (matrix.length === 0) return;

    setRawMatrix(matrix);

    const headers = hasHeaders 
      ? matrix[0] 
      : matrix[0].map((_, i) => `Coluna ${i + 1}`);

    const dataRows = hasHeaders ? matrix.slice(1) : matrix;

    const initialMappings: ColumnMapping[] = headers.map((header, colIdx) => {
      const sampleVals = dataRows.slice(0, 4).map(r => r[colIdx] || '').filter(Boolean);
      const target = detectFieldFromHeader(header);
      return {
        csvHeader: header || `Coluna ${colIdx + 1}`,
        targetField: target,
        sampleValues: sampleVals,
      };
    });

    // If no name column was mapped, map the first non-numeric column to name
    const hasNameMapped = initialMappings.some(m => m.targetField === 'name');
    if (!hasNameMapped && initialMappings.length > 0) {
      initialMappings[0].targetField = 'name';
    }

    setColumnMappings(initialMappings);
    setStep('mapping');
  };

  // Process rows from mapping to preview
  const generatePreviewFromMapping = () => {
    const dataRows = hasHeaders ? rawMatrix.slice(1) : rawMatrix;
    let baseRoll = importMode === 'append' ? existingCount + 1 : 1;

    const preliminaryRows: ParsedRow[] = dataRows.map((row, rowIdx) => {
      const rowData: Record<TargetField, string> = {
        none: '',
        name: '',
        nickname: '',
        rollNumber: '',
        gender: '',
        behavior: '',
        academicLevel: '',
        visionNeeds: '',
        hearingNeeds: '',
        reducedMobility: '',
        specialNeeds: '',
        specialNeedsNotes: '',
        preferredRow: '',
        affinities: '',
        affinityPriority: '',
        affinityCategory: '',
        antiAffinities: '',
        antiAffinitySeverity: '',
        antiAffinityCategory: '',
        notes: '',
      };

      columnMappings.forEach((mapping, colIdx) => {
        if (mapping.targetField !== 'none' && row[colIdx] !== undefined) {
          rowData[mapping.targetField] = fixMojibake(row[colIdx]);
        }
      });

      // Parse fields
      let cleanName = rowData.name.replace(/^[\d]+[\.\-\)\s]+/, '').trim();
      let roll = parseInt(rowData.rollNumber, 10);
      if (isNaN(roll) || roll <= 0) {
        roll = baseRoll + rowIdx;
      }

      // Gender
      let gender: Student['gender'] = 'M';
      const gStr = normalizeForSearch(rowData.gender);
      if (gStr.startsWith('f') || gStr.includes('fem') || gStr.includes('mulher')) {
        gender = 'F';
      }

      // Behavior
      let behavior: Student['behavior'] = 'calm';
      const bStr = normalizeForSearch(rowData.behavior);
      if (bStr.includes('fal') || bStr.includes('conv') || bStr.includes('agit') || bStr.includes('talk')) {
        behavior = 'talkative';
      } else if (bStr.includes('mod') || bStr.includes('inter')) {
        behavior = 'moderate';
      }

      // Academic level
      let academicLevel: Student['academicLevel'] = 'regular';
      const aStr = normalizeForSearch(rowData.academicLevel);
      if (aStr.includes('avan') || aStr.includes('alt') || aStr.includes('dest')) {
        academicLevel = 'advanced';
      } else if (aStr.includes('apoi') || aStr.includes('refor') || aStr.includes('dif') || aStr.includes('help')) {
        academicLevel = 'needs_help';
      }

      // Special needs
      const specialNeeds: SpecialNeedType[] = [];
      if (rowData.specialNeeds) {
        const rawTokens = rowData.specialNeeds.split(/[,;\/]/).map(s => normalizeForSearch(s)).filter(Boolean);
        for (const token of rawTokens) {
          if (token.includes('visa') || token.includes('oculo') || token.includes('mio')) {
            if (!specialNeeds.includes('low_vision')) specialNeeds.push('low_vision');
          } else if (token.includes('audit') || token.includes('ouvid') || token.includes('surd')) {
            if (!specialNeeds.includes('hearing_impairment')) specialNeeds.push('hearing_impairment');
          } else if (token.includes('tdah') || token.includes('adhd') || token.includes('foco') || token.includes('atenc')) {
            if (!specialNeeds.includes('adhd_focus')) specialNeeds.push('adhd_focus');
          } else if (token.includes('cadeir') || token.includes('mobilid') || token.includes('locomo')) {
            if (!specialNeeds.includes('wheelchair_mobility')) specialNeeds.push('wheelchair_mobility');
          } else if (token.includes('alto') || token.includes('estat') || token.includes('tall')) {
            if (!specialNeeds.includes('tall_student')) specialNeeds.push('tall_student');
          } else if (token.length > 0 && !token.includes('nenhum')) {
            if (!specialNeeds.includes('custom')) specialNeeds.push('custom');
          }
        }
      }

      // Preferred row
      let preferredRow: Student['preferredRow'] = 'any';
      const pStr = normalizeForSearch(rowData.preferredRow);
      if (pStr.includes('frent') || pStr.includes('primeir')) {
        preferredRow = 'front';
      } else if (pStr.includes('fund') || pStr.includes('tras') || pStr.includes('ultim')) {
        preferredRow = 'back';
      } else if (pStr.includes('meio') || pStr.includes('centr')) {
        preferredRow = 'middle';
      }

      // Vision / Hearing / Mobility
      let visionNeeds: Student['visionNeeds'] = 'standard';
      const vStr = normalizeForSearch(rowData.visionNeeds);
      if (vStr.includes('frente') || vStr.includes('sim') || vStr.includes('oculo') || vStr.includes('mio') || specialNeeds.includes('low_vision')) {
        visionNeeds = 'needs_front';
      }

      let hearingNeeds: Student['hearingNeeds'] = 'standard';
      const hStr = normalizeForSearch(rowData.hearingNeeds);
      if (hStr.includes('frente') || hStr.includes('sim') || hStr.includes('audit') || specialNeeds.includes('hearing_impairment')) {
        hearingNeeds = 'needs_front';
      }

      let reducedMobility = false;
      const mStr = normalizeForSearch(rowData.reducedMobility);
      if (mStr.includes('sim') || mStr.includes('cadeir') || mStr.includes('true') || specialNeeds.includes('wheelchair_mobility')) {
        reducedMobility = true;
      }

      const validationMessages: string[] = [];
      const isValid = cleanName.length > 0;
      if (!isValid) {
        validationMessages.push('Nome em branco na linha');
      }

      const newStudent: Student = {
        id: `std-csv-${Date.now()}-${rowIdx}-${Math.random().toString(36).substring(2, 6)}`,
        rollNumber: roll,
        name: cleanName || `Aluno Linha ${rowIdx + 1}`,
        nickname: rowData.nickname?.trim() || undefined,
        gender,
        avatarColor: AVATAR_COLORS[rowIdx % AVATAR_COLORS.length],
        behavior,
        academicLevel,
        specialNeeds,
        specialNeedsNotes: rowData.specialNeedsNotes?.trim() || undefined,
        visionNeeds,
        hearingNeeds,
        reducedMobility,
        affinities: [],
        antiAffinities: [],
        affinityDetails: [],
        antiAffinityDetails: [],
        preferredRow,
        notes: rowData.notes || undefined,
      };

      return {
        id: newStudent.id,
        raw: rowData,
        student: newStudent,
        rawAffinitiesStr: rowData.affinities || '',
        rawAntiAffinitiesStr: rowData.antiAffinities || '',
        affinityPriorityStr: rowData.affinityPriority || '',
        affinityCategoryStr: rowData.affinityCategory || '',
        antiAffinitySeverityStr: rowData.antiAffinitySeverity || '',
        antiAffinityCategoryStr: rowData.antiAffinityCategory || '',
        isValid,
        validationMessages,
        selected: isValid,
      };
    });

    // Cross-link affinities and anti-affinities between students with accent-tolerant matching!
    const allStudentsPool = [
      ...(importMode === 'append' ? existingStudents : []),
      ...preliminaryRows.map(r => r.student),
    ];

    preliminaryRows.forEach(row => {
      const affNames = row.rawAffinitiesStr.split(/[,;\/]/).map(s => normalizeForSearch(s)).filter(Boolean);
      const antiNames = row.rawAntiAffinitiesStr.split(/[,;\/]/).map(s => normalizeForSearch(s)).filter(Boolean);

      // Determine level and category for affinities from teacher spreadsheet
      let affLevel: CanBeNearLevel = 'high';
      const apStr = normalizeForSearch(row.affinityPriorityStr);
      if (apStr.includes('3') || apStr.includes('alta') || apStr.includes('essencial') || apStr.includes('max')) {
        affLevel = 'high';
      } else if (apStr.includes('1') || apStr.includes('baixa') || apStr.includes('leve')) {
        affLevel = 'low';
      } else if (apStr.includes('2') || apStr.includes('med')) {
        affLevel = 'medium';
      }
      const affCategory = row.affinityCategoryStr || 'Apoio Pedagógico & Monitoria';

      // Determine level and category for anti-affinities from teacher spreadsheet
      let antiLevel: CannotBeNearLevel = 'critical';
      const asStr = normalizeForSearch(row.antiAffinitySeverityStr);
      if (asStr.includes('3') || asStr.includes('crit') || asStr.includes('obrig') || asStr.includes('sever')) {
        antiLevel = 'critical';
      } else if (asStr.includes('1') || asStr.includes('leve') || asStr.includes('afast') || asStr.includes('recom')) {
        antiLevel = 'mild';
      } else if (asStr.includes('2') || asStr.includes('med') || asStr.includes('evit')) {
        antiLevel = 'moderate';
      }
      const antiCategory = row.antiAffinityCategoryStr || 'Conversa Excessiva / Dispersão';

      const resolvedAffIds: string[] = [];
      const resolvedAffDetails: StudentRelation[] = [];

      affNames.forEach(targetStr => {
        const match = allStudentsPool.find(s => {
          if (s.id === row.student.id) return false;
          const sNameNorm = normalizeForSearch(s.name);
          return sNameNorm.includes(targetStr) || s.rollNumber.toString() === targetStr;
        });

        if (match && !resolvedAffIds.includes(match.id)) {
          resolvedAffIds.push(match.id);
          resolvedAffDetails.push({
            targetStudentId: match.id,
            level: affLevel,
            category: affCategory,
          });
        }
      });

      const resolvedAntiIds: string[] = [];
      const resolvedAntiDetails: StudentRelation[] = [];

      antiNames.forEach(targetStr => {
        const match = allStudentsPool.find(s => {
          if (s.id === row.student.id) return false;
          const sNameNorm = normalizeForSearch(s.name);
          return sNameNorm.includes(targetStr) || s.rollNumber.toString() === targetStr;
        });

        if (match && !resolvedAntiIds.includes(match.id) && !resolvedAffIds.includes(match.id)) {
          resolvedAntiIds.push(match.id);
          resolvedAntiDetails.push({
            targetStudentId: match.id,
            level: antiLevel,
            category: antiCategory,
          });
        }
      });

      row.student.affinities = resolvedAffIds;
      row.student.affinityDetails = resolvedAffDetails;
      row.student.antiAffinities = resolvedAntiIds;
      row.student.antiAffinityDetails = resolvedAntiDetails;
    });

    setParsedRows(preliminaryRows);
    setStep('preview');
  };

  const handleDownloadTemplate = (format: 'xlsx' | 'csv' = 'xlsx') => {
    if (format === 'xlsx') {
      downloadTeacherSpreadsheetExcel(classroom, institution);
    } else {
      downloadTeacherSpreadsheetCSV(classroom, institution);
    }
  };

  const handleConfirmImport = () => {
    const selectedStudents = parsedRows.filter(r => r.selected && r.isValid).map(r => r.student);
    if (selectedStudents.length === 0) return;

    onImportStudents(selectedStudents, importMode);
    onClose();
  };

  const filteredPreviewRows = parsedRows.filter(r => 
    normalizeForSearch(r.student.name).includes(normalizeForSearch(searchFilter)) ||
    r.student.rollNumber.toString().includes(searchFilter)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121216] text-slate-900 dark:text-zinc-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/90 dark:bg-[#16161c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base font-display">
                  Importação de Alunos via Planilha
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800/60">
                  Excel & CSV
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                {step === 'upload' && 'Carregue seu arquivo Excel (.xlsx, .xls) ou CSV com suporte total a acentuação'}
                {step === 'mapping' && 'Mapeie as colunas da sua planilha para os atributos correspondentes'}
                {step === 'preview' && 'Confira os alunos, afinidades e acentos detectados antes de confirmar'}
              </p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 dark:bg-[#1a1a22] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-zinc-800 text-xs">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                step === 'upload' ? 'bg-emerald-600 text-white' : 'bg-slate-300 dark:bg-zinc-800 text-slate-700 dark:text-zinc-400'
              }`}>1</span>
              <span className={step === 'upload' ? 'text-slate-900 dark:text-zinc-200 font-bold' : 'text-slate-500 dark:text-zinc-400'}>Arquivo</span>
              
              <span className="text-slate-400 dark:text-zinc-600">→</span>

              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                step === 'mapping' ? 'bg-emerald-600 text-white' : 'bg-slate-300 dark:bg-zinc-800 text-slate-700 dark:text-zinc-400'
              }`}>2</span>
              <span className={step === 'mapping' ? 'text-slate-900 dark:text-zinc-200 font-bold' : 'text-slate-500 dark:text-zinc-400'}>Mapeamento</span>

              <span className="text-slate-400 dark:text-zinc-600">→</span>

              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                step === 'preview' ? 'bg-emerald-600 text-white' : 'bg-slate-300 dark:bg-zinc-800 text-slate-700 dark:text-zinc-400'
              }`}>3</span>
              <span className={step === 'preview' ? 'text-slate-900 dark:text-zinc-200 font-bold' : 'text-slate-500 dark:text-zinc-400'}>Confirmação</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body based on Step */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-800 dark:text-zinc-200">
          
          {/* STEP 1: UPLOAD / PASTE */}
          {step === 'upload' && (
            <div className="space-y-5">
              
              {/* Official Teacher Spreadsheet Banner */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-emerald-50/80 dark:bg-[#18231c] p-4 rounded-2xl border border-emerald-300/80 dark:border-emerald-800 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider">
                        Planilha Oficial do Professor Regente
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300 text-[10px] font-bold">
                        Padrão Institucional
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900/80 dark:text-zinc-300 mt-1">
                      Modelo pré-formatado com 3 abas, cores institucionais, validações e colunas para proximidade e necessidades especiais.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
                  {onOpenTeacherSpreadsheetModal && (
                    <button
                      type="button"
                      onClick={onOpenTeacherSpreadsheetModal}
                      className="px-3 py-2 bg-white hover:bg-slate-100 dark:bg-[#141419] dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-300 dark:border-zinc-700 shadow-xs transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Instruções da Planilha
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('xlsx')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Modelo .XLSX
                  </button>
                </div>
              </div>

              {/* Upload Drop Zone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-600 dark:border-zinc-700 dark:hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 dark:bg-[#16161e]/60 dark:hover:bg-emerald-950/20 rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group shadow-xs"
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .ods, .csv, .tsv, .txt" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 group-hover:scale-110 flex items-center justify-center transition-all shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                    {fileName ? `Arquivo selecionado: ${fileName}` : 'Clique para selecionar ou arraste sua Planilha (Excel .xlsx, .xls ou .csv)'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                    Decodificação automática para UTF-8 e Windows-1252 / ISO-8859-1 com preservação de acentos (João, Vitória, Luís, etc.)
                  </p>
                </div>
              </div>

              {/* Direct Paste Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Ou Cole os Dados da Tabela Aqui:
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Copie as linhas do Excel / Google Sheets e cole abaixo
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Exemplo de dados:\nNome;Numero;Genero;Comportamento;Afinidades;Desafinidades\nJoão Gabriel;1;M;Calmo;Vitória Silva;André Santos\nVitória Silva;2;F;Moderado;João Gabriel;Caio Fernandes\nAndré Santos;3;M;Conversador;;Vitória Silva`}
                  className="w-full p-3.5 bg-white dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/70 rounded-2xl text-xs font-mono text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed shadow-inner"
                />
              </div>

              {/* Options */}
              <div className="bg-slate-100 dark:bg-[#18181f] p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-800 dark:text-zinc-200 font-semibold">
                  <input
                    type="checkbox"
                    checked={hasHeaders}
                    onChange={(e) => setHasHeaders(e.target.checked)}
                    className="rounded border-slate-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-zinc-800"
                  />
                  <span>A primeira linha contém os cabeçalhos das colunas</span>
                </label>

                <div className="flex items-center gap-3">
                  <span className="text-slate-600 dark:text-zinc-400 font-bold">Modo:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-800 dark:text-zinc-200 font-medium">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Adicionar à turma (+{existingCount} existentes)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-amber-700 dark:text-amber-400 font-bold">Substituir todos</span>
                  </label>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-3 rounded-2xl text-xs text-emerald-950 dark:text-emerald-300">
                <span className="flex items-center gap-2 font-bold">
                  <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  Mapeie as {columnMappings.length} colunas encontradas no arquivo para os atributos do aluno:
                </span>
                <span className="text-[11px] text-emerald-800 dark:text-emerald-400/80 font-bold">
                  {rawMatrix.length - (hasHeaders ? 1 : 0)} linhas detectadas
                </span>
              </div>

              <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-[#16161d] shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-[#181822] text-slate-800 dark:text-zinc-300 border-b border-slate-200 dark:border-zinc-800 font-bold">
                    <tr>
                      <th className="py-3 px-4 w-1/3">Coluna no Arquivo</th>
                      <th className="py-3 px-4 w-1/3">Mapear para Atributo</th>
                      <th className="py-3 px-4 w-1/3">Exemplos de Valores</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                    {columnMappings.map((mapping, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-zinc-200">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                            {mapping.csvHeader}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <select
                            value={mapping.targetField}
                            onChange={(e) => {
                              const updated = [...columnMappings];
                              updated[idx].targetField = e.target.value as TargetField;
                              setColumnMappings(updated);
                            }}
                            className={`w-full py-2 px-3 rounded-xl border text-xs font-bold focus:outline-none transition-all cursor-pointer ${
                              mapping.targetField !== 'none'
                                ? 'bg-emerald-50 dark:bg-[#18241c] border-emerald-500 text-emerald-950 dark:text-emerald-300 ring-1 ring-emerald-500/30'
                                : 'bg-white dark:bg-[#141419] border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-400'
                            }`}
                          >
                            <option value="none">-- Ignorar Coluna --</option>
                            <optgroup label="Dados Principais">
                              <option value="name">★ Nome Completo (Obrigatório)</option>
                              <option value="nickname">Apelido / Nome Social</option>
                              <option value="rollNumber">Número de Chamada</option>
                              <option value="gender">Gênero (M / F)</option>
                              <option value="behavior">Comportamento (Calmo / Moderado / Conversador)</option>
                              <option value="academicLevel">Nível Acadêmico (Regular / Avançado / Apoio)</option>
                            </optgroup>
                            <optgroup label="Inclusão e Acessibilidade">
                              <option value="visionNeeds">Necessidade de Visão (Frente)</option>
                              <option value="hearingNeeds">Necessidade Auditiva (Frente)</option>
                              <option value="reducedMobility">Mobilidade Reduzida (Cadeirante)</option>
                              <option value="specialNeeds">Necessidades / Inclusão (TDAH, TEA, etc.)</option>
                              <option value="specialNeedsNotes">Detalhes do Laudo / Observações Médicas</option>
                              <option value="preferredRow">Preferência de Fileira (Frente / Meio / Fundo)</option>
                            </optgroup>
                            <optgroup label="Mapeamento de Proximidade (Afinidades)">
                              <option value="affinities">Afinidades (Colegas recomendados juntos)</option>
                              <option value="affinityPriority">Nível Prioridade da Parceria (+3, +2, +1)</option>
                              <option value="affinityCategory">Motivo da Proximidade / Parceria</option>
                            </optgroup>
                            <optgroup label="Mapeamento de Distanciamento (Desafinidades)">
                              <option value="antiAffinities">Desafinidades (Colegas a afastar)</option>
                              <option value="antiAffinitySeverity">Nível de Separação (-3, -2, -1)</option>
                              <option value="antiAffinityCategory">Motivo do Distanciamento</option>
                            </optgroup>
                            <optgroup label="Outros">
                              <option value="notes">Observações Pedagógicas</option>
                            </optgroup>
                          </select>
                        </td>

                        <td className="py-3 px-4 text-slate-700 dark:text-zinc-400 truncate max-w-xs text-[11px] font-mono">
                          {mapping.sampleValues.length > 0 ? (
                            mapping.sampleValues.join(', ')
                          ) : (
                            <span className="text-slate-400 dark:text-zinc-600 italic">(vazio)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!columnMappings.some(m => m.targetField === 'name') && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-3 rounded-xl flex items-center gap-2 text-xs text-rose-900 dark:text-rose-300 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>Selecione ao menos uma coluna mapeada para <strong>Nome Completo</strong> para prosseguir.</span>
                </div>
              )}

            </div>
          )}

          {/* STEP 3: PREVIEW & VALIDATION */}
          {step === 'preview' && (
            <div className="space-y-4">
              
              {/* Summary Stats */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-[#181822] p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {parsedRows.filter(r => r.selected && r.isValid).length}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      Alunos Prontos para Cadastramento
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-400">
                      {parsedRows.reduce((acc, r) => acc + (r.student.affinityDetails?.length || 0), 0)} relações de afinidade e {parsedRows.reduce((acc, r) => acc + (r.student.antiAffinityDetails?.length || 0), 0)} desafinidades identificadas automaticamente.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Filtrar aluno..."
                      className="pl-8 pr-3 py-1.5 bg-white dark:bg-[#121216] border border-slate-300 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Parsed Students Table */}
              <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden max-h-[44vh] overflow-y-auto bg-white dark:bg-[#14141a] shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-[#181820] text-slate-800 dark:text-zinc-300 sticky top-0 font-bold border-b border-slate-200 dark:border-zinc-800 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={parsedRows.length > 0 && parsedRows.every(r => r.selected)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setParsedRows(prev => prev.map(r => ({ ...r, selected: checked })));
                          }}
                          className="rounded border-slate-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-zinc-800"
                        />
                      </th>
                      <th className="py-2.5 px-3 w-14">Nº</th>
                      <th className="py-2.5 px-3">Nome do Aluno</th>
                      <th className="py-2.5 px-3">Perfil & Gênero</th>
                      <th className="py-2.5 px-3">Afinidades Mapeadas</th>
                      <th className="py-2.5 px-3">Desafinidades</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                    {filteredPreviewRows.map((row) => (
                      <tr key={row.id} className={`hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors ${!row.isValid ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''}`}>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            disabled={!row.isValid}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setParsedRows(prev => prev.map(r => r.id === row.id ? { ...r, selected: checked } : r));
                            }}
                            className="rounded border-slate-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-zinc-800"
                          />
                        </td>

                        <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-zinc-300">
                          <span 
                            className="w-6 h-6 rounded-lg text-white font-bold text-[10px] flex items-center justify-center shadow-xs"
                            style={{ backgroundColor: row.student.avatarColor }}
                          >
                            {row.student.rollNumber}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-zinc-100">
                          {row.student.name}
                          {row.student.specialNeeds.length > 0 && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60 font-semibold">
                              {row.student.specialNeeds.join(', ')}
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400 text-[11px]">
                          {row.student.gender === 'M' ? 'Masc' : 'Fem'} • {row.student.behavior === 'talkative' ? 'Conversador' : row.student.behavior === 'moderate' ? 'Moderado' : 'Calmo'}
                        </td>

                        <td className="py-2.5 px-3">
                          {row.student.affinities.length > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800/60 text-[10px] font-bold">
                              +{row.student.affinities.length} colegas
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-zinc-600 text-[11px]">—</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          {row.student.antiAffinities.length > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800/60 text-[10px] font-bold">
                              -{row.student.antiAffinities.length} colegas
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-zinc-600 text-[11px]">—</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          {row.isValid ? (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Pronto
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-rose-700 dark:text-rose-400 font-bold">
                              <AlertCircle className="w-3.5 h-3.5" /> {row.validationMessages[0]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

        {/* Footer Navigation Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#16161c]">
          
          {step === 'upload' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              
              <button
                type="button"
                onClick={() => processRawText(rawText)}
                disabled={!rawText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <span>Avançar para Mapeamento</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 'mapping' && (
            <>
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Arquivo</span>
              </button>

              <button
                type="button"
                onClick={generatePreviewFromMapping}
                disabled={!columnMappings.some(m => m.targetField === 'name')}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <span>Processar e Pré-visualizar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button
                type="button"
                onClick={() => setStep('mapping')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Ajustar Mapeamento</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={parsedRows.filter(r => r.selected && r.isValid).length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar e Importar {parsedRows.filter(r => r.selected && r.isValid).length} Alunos</span>
              </button>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
