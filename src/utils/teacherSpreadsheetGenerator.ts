import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { Classroom, Institution, Student } from '../types';

export interface SpreadsheetExportOptions {
  includeCurrentStudents?: boolean;
  institutionName?: string;
  institutionCode?: string;
}

// Predefined option lists for Excel data validation dropdowns
export const DROPDOWN_OPTIONS = {
  gender: ['M', 'F', 'Outro'],
  behavior: ['Calmo / Focado', 'Moderado', 'Muito Conversador'],
  academicLevel: ['Regular', 'Avançado', 'Precisa de Ajuda'],
  visionNeeds: ['Normal', 'Precisa de Frente', 'Baixa Visão'],
  hearingNeeds: ['Normal', 'Precisa de Frente', 'Dificuldade Auditiva'],
  reducedMobility: ['Não', 'Sim'],
  specialNeeds: [
    'Nenhuma',
    'TDAH / Foco',
    'TEA / Autismo',
    'Baixa Visão',
    'Dificuldade Auditiva',
    'Cadeirante / Mobilidade',
    'Aluno Alto',
    'Canhoto',
    'Outro'
  ],
  preferredRow: ['Frente', 'Meio', 'Fundo', 'Indiferente'],
  affinityPriority: ['Alta (+3)', 'Média (+2)', 'Baixa (+1)'],
  affinityCategory: [
    'Apoio Pedagógico & Monitoria',
    'Trabalho em Dupla / Estudo',
    'Sinergia de Foco / Produtividade',
    'Inclusão & Acolhimento',
    'Proximidade Recomendada Geral'
  ],
  antiAffinitySeverity: [
    'Separação Obrigatória (-3)',
    'Evitar Vizinhança (-2)',
    'Afastamento Recomendado (-1)'
  ],
  antiAffinityCategory: [
    'Conversa Excessiva / Dispersão',
    'Conflito / Atrito Comportamental',
    'Distração Mútua',
    'Histórico de Indisciplina em Grupo',
    'Distanciamento Geral'
  ]
};

/**
 * Builds an ExcelJS Workbook with institutional styling and native data validation dropdowns
 * on every option column.
 */
export async function buildTeacherSpreadsheetExcelJS(
  classroom: Classroom,
  institution?: Institution,
  options: SpreadsheetExportOptions = {}
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sistema de Gestão Fleming';
  wb.lastModifiedBy = 'Professor Regente';
  wb.created = new Date();
  wb.modified = new Date();

  const instName = options.institutionName || institution?.name || classroom.schoolName || 'FLEMING FLORIPA';
  const instCode = options.institutionCode || institution?.code || 'FLEMING-EDU';
  const className = classroom.name || 'Turma Regente';
  const teacherName = classroom.teacherName || 'Professor Regente';
  const academicYear = classroom.academicYear || new Date().getFullYear().toString();
  const roomNumber = classroom.roomNumber || 'Sala Regular';

  // -------------------------------------------------------------
  // WORKSHEET 1: MAPEAMENTO DA TURMA
  // -------------------------------------------------------------
  const wsMain = wb.addWorksheet('Mapeamento_Turma', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 6 }]
  });

  // Header banner info
  wsMain.addRow([`${instName.toUpperCase()} — SISTEMA DE ENSINO & GESTÃO PEDAGÓGICA (${instCode})`]);
  wsMain.addRow(['PLANILHA OFICIAL DO PROFESSOR REGENTE: CADASTRO DE ALUNOS & MAPEAMENTO DE ESPELHO']);
  wsMain.addRow([
    `Turma: ${className}`,
    `Regente: ${teacherName}`,
    `Ano Letivo: ${academicYear}`,
    `Espaço: ${roomNumber}`,
    `Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`
  ]);
  wsMain.addRow([
    'INSTRUÇÕES: Preencha cada linha com os dados do aluno. As colunas coloridas possuem LISTAS SUSPENSAS com opções prontas para você clicar e selecionar.'
  ]);
  wsMain.addRow([]); // Blank separator row

  // Table Header (Row 6)
  const headers = [
    'Nº Chamada',
    'Nome Completo do Aluno',
    'Apelido / Nome Social',
    'Gênero',
    'Perfil Comportamental',
    'Nível Acadêmico',
    'Necessidade Visual',
    'Necessidade Auditiva',
    'Mobilidade Reduzida',
    'Condição Especial / Laudo',
    'Detalhes do Laudo / Recomendações',
    'Preferência de Fileira',
    'PODEM FICAR PERTO (Afinidades)',
    'Nível Prioridade da Parceria',
    'Motivo da Proximidade',
    'NÃO PODEM FICAR PERTO (Desafinidades)',
    'Nível de Separação',
    'Motivo do Distanciamento',
    'Observações do Professor Regente'
  ];
  const headerRow = wsMain.addRow(headers);
  headerRow.height = 32;

  // Format header row
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF047857' } // Emerald 700
    };
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF065F46' } },
      left: { style: 'thin', color: { argb: 'FF065F46' } },
      bottom: { style: 'medium', color: { argb: 'FF064E3B' } },
      right: { style: 'thin', color: { argb: 'FF065F46' } }
    };
  });

  // Top banner formatting
  const titleRow1 = wsMain.getRow(1);
  titleRow1.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF065F46' } };
  const titleRow2 = wsMain.getRow(2);
  titleRow2.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } };
  const titleRow3 = wsMain.getRow(3);
  titleRow3.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
  const titleRow4 = wsMain.getRow(4);
  titleRow4.font = { name: 'Calibri', size: 10, color: { argb: 'FF047857' }, bold: true };

  // Populate Data Rows
  const studentRowsData: (string | number)[][] = [];

  if (options.includeCurrentStudents && classroom.students && classroom.students.length > 0) {
    const studentMap = new Map<string, Student>();
    classroom.students.forEach(s => studentMap.set(s.id, s));

    classroom.students
      .slice()
      .sort((a, b) => a.rollNumber - b.rollNumber)
      .forEach(s => {
        const affNames = (s.affinityDetails && s.affinityDetails.length > 0)
          ? s.affinityDetails.map(d => {
              const target = studentMap.get(d.targetStudentId);
              return target ? `${target.name} (Nº ${target.rollNumber})` : d.targetStudentId;
            }).join('; ')
          : (s.affinities || []).map(id => {
              const target = studentMap.get(id);
              return target ? `${target.name} (Nº ${target.rollNumber})` : id;
            }).join('; ');

        const topAff = s.affinityDetails?.[0];
        const affLevelStr = topAff?.level === 'high' ? 'Alta (+3)' : topAff?.level === 'low' ? 'Baixa (+1)' : topAff ? 'Média (+2)' : '';
        const affCatStr = topAff?.category || '';

        const antiNames = (s.antiAffinityDetails && s.antiAffinityDetails.length > 0)
          ? s.antiAffinityDetails.map(d => {
              const target = studentMap.get(d.targetStudentId);
              return target ? `${target.name} (Nº ${target.rollNumber})` : d.targetStudentId;
            }).join('; ')
          : (s.antiAffinities || []).map(id => {
              const target = studentMap.get(id);
              return target ? `${target.name} (Nº ${target.rollNumber})` : id;
            }).join('; ');

        const topAnti = s.antiAffinityDetails?.[0];
        const antiLevelStr = topAnti?.level === 'critical' ? 'Separação Obrigatória (-3)' : topAnti?.level === 'mild' ? 'Afastamento Recomendado (-1)' : topAnti ? 'Evitar Vizinhança (-2)' : '';
        const antiCatStr = topAnti?.category || '';

        const specialNeedsLabels: Record<string, string> = {
          low_vision: 'Baixa Visão',
          hearing_impairment: 'Dificuldade Auditiva',
          adhd_focus: 'TDAH / Foco',
          wheelchair_mobility: 'Cadeirante / Mobilidade',
          tall_student: 'Aluno Alto',
          custom: 'Outro'
        };
        const condStr = (s.specialNeeds || []).map(n => specialNeedsLabels[n] || n).join(', ') || 'Nenhuma';

        studentRowsData.push([
          s.rollNumber,
          s.name,
          s.nickname || '',
          s.gender || 'M',
          s.behavior === 'talkative' ? 'Muito Conversador' : s.behavior === 'moderate' ? 'Moderado' : 'Calmo / Focado',
          s.academicLevel === 'advanced' ? 'Avançado' : s.academicLevel === 'needs_help' ? 'Precisa de Ajuda' : 'Regular',
          s.visionNeeds === 'needs_front' ? 'Precisa de Frente' : 'Normal',
          s.hearingNeeds === 'needs_front' ? 'Precisa de Frente' : 'Normal',
          s.reducedMobility ? 'Sim' : 'Não',
          condStr,
          s.specialNeedsNotes || '',
          s.preferredRow === 'front' ? 'Frente' : s.preferredRow === 'back' ? 'Fundo' : s.preferredRow === 'middle' ? 'Meio' : 'Indiferente',
          affNames,
          affLevelStr,
          affCatStr,
          antiNames,
          antiLevelStr,
          antiCatStr,
          s.notes || ''
        ]);
      });

    // Add extra empty rows for new students
    const currentCount = classroom.students.length;
    for (let r = currentCount + 1; r <= Math.max(currentCount + 15, 35); r++) {
      studentRowsData.push([r, '', '', '', 'Moderado', 'Regular', 'Normal', 'Normal', 'Não', 'Nenhuma', '', 'Indiferente', '', '', '', '', '', '', '']);
    }
  } else {
    // Standard realistic pedagogical samples
    studentRowsData.push(
      [1, 'Alice Monteiro', 'Lili', 'F', 'Calmo / Focado', 'Avançado', 'Normal', 'Normal', 'Não', 'Nenhuma', '-', 'Frente', 'Bernardo Silva; Caio Fernandes', 'Alta (+3)', 'Apoio Pedagógico & Monitoria', 'Gabriel Santos', 'Separação Obrigatória (-3)', 'Conversa Excessiva / Dispersão', 'Excelente liderança, ótima para atuar como monitora'],
      [2, 'Bernardo Silva', 'Bê', 'M', 'Moderado', 'Regular', 'Precisa de Frente', 'Normal', 'Não', 'TDAH / Foco', 'Laudo TDAH e miopia 3.5 graus. Necessita sentar nas fileiras 1 ou 2 longe de janelas', 'Frente', 'Alice Monteiro', 'Alta (+3)', 'Apoio Pedagógico & Monitoria', 'Gabriel Santos', 'Separação Obrigatória (-3)', 'Conversa Excessiva / Dispersão', 'Rendimento dobra quando posicionado próximo de colegas focados'],
      [3, 'Gabriel Santos', 'Biel', 'M', 'Muito Conversador', 'Regular', 'Normal', 'Normal', 'Não', 'Nenhuma', '-', 'Meio', '', '', '', 'Bernardo Silva; Alice Monteiro', 'Separação Obrigatória (-3)', 'Conversa Excessiva / Dispersão', 'Dispersa com muita facilidade em grupos de amigos'],
      [4, 'Helena Castro', 'Lena', 'F', 'Calmo / Focado', 'Avançado', 'Normal', 'Normal', 'Sim', 'Cadeirante / Mobilidade', 'Utiliza cadeira de rodas. Requer carteira ampla no corredor lateral ou primeira fileira', 'Frente', 'Letícia Souza', 'Média (+2)', 'Trabalho em Dupla / Estudo', '', '', '', 'Acesso desimpedido à saída e ao quadro'],
      [5, 'Lucas Ferreira', 'Luquinhas', 'M', 'Moderado', 'Regular', 'Normal', 'Normal', 'Não', 'Aluno Alto', 'Aluno com 1,91m de altura. Se sentar na frente, obstrui a visão dos colegas', 'Fundo', '', '', '', '', '', '', 'Preferencialmente fileiras do fundo para manter visão limpa da sala'],
      [6, 'Mariana Ramos', 'Mari', 'F', 'Calmo / Focado', 'Precisa de Ajuda', 'Normal', 'Precisa de Frente', 'Não', 'Dificuldade Auditiva', 'Leve perda auditiva no ouvido esquerdo. Precisa sentar nas fileiras da frente pelo lado direito', 'Frente', 'Alice Monteiro', 'Alta (+3)', 'Inclusão & Acolhimento', 'Gabriel Santos', 'Evitar Vizinhança (-2)', 'Distração Mútua', 'Necessita boa proximidade vocal do professor']
    );

    // 25 blank lines ready for input with dropdowns
    for (let r = 7; r <= 35; r++) {
      studentRowsData.push([r, '', '', '', 'Moderado', 'Regular', 'Normal', 'Normal', 'Não', 'Nenhuma', '', 'Indiferente', '', '', '', '', '', '', '']);
    }
  }

  // Append data rows to worksheet
  studentRowsData.forEach((rowData, index) => {
    const row = wsMain.addRow(rowData);
    row.height = 22;

    const isEven = index % 2 === 0;
    const bgArgb = isEven ? 'FFFFFFFF' : 'FFF8FAFC'; // Soft zebra striping

    row.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgArgb }
      };
      cell.font = { name: 'Calibri', size: 10 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      // Alignment rules
      if (colNumber === 1 || colNumber === 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    });
  });

  // -------------------------------------------------------------
  // APPLY DROPDOWN DATA VALIDATIONS ACROSS DATA ROWS (Rows 7 to 80)
  // -------------------------------------------------------------
  const maxRowToValidate = Math.max(studentRowsData.length + 6, 80);

  // Column letters mapping:
  // D (4): Gender
  // E (5): Behavior
  // F (6): Academic Level
  // G (7): Vision Needs
  // H (8): Hearing Needs
  // I (9): Reduced Mobility
  // J (10): Special Needs / Condition
  // L (12): Preferred Row
  // N (14): Affinity Priority
  // O (15): Affinity Category
  // Q (17): Anti-Affinity Severity
  // R (18): Anti-Affinity Category

  const validationsConfig: { colLetter: string; options: string[]; title: string; prompt: string }[] = [
    {
      colLetter: 'D',
      options: DROPDOWN_OPTIONS.gender,
      title: 'Gênero',
      prompt: 'Selecione M, F ou Outro'
    },
    {
      colLetter: 'E',
      options: DROPDOWN_OPTIONS.behavior,
      title: 'Perfil Comportamental',
      prompt: 'Selecione o perfil do aluno'
    },
    {
      colLetter: 'F',
      options: DROPDOWN_OPTIONS.academicLevel,
      title: 'Nível Acadêmico',
      prompt: 'Selecione o rendimento pedagógico'
    },
    {
      colLetter: 'G',
      options: DROPDOWN_OPTIONS.visionNeeds,
      title: 'Necessidade Visual',
      prompt: 'Selecione se precisa de frente por visão'
    },
    {
      colLetter: 'H',
      options: DROPDOWN_OPTIONS.hearingNeeds,
      title: 'Necessidade Auditiva',
      prompt: 'Selecione se precisa de frente por audição'
    },
    {
      colLetter: 'I',
      options: DROPDOWN_OPTIONS.reducedMobility,
      title: 'Mobilidade Reduzida',
      prompt: 'Selecione Sim se for cadeirante ou mobilidade'
    },
    {
      colLetter: 'J',
      options: DROPDOWN_OPTIONS.specialNeeds,
      title: 'Condição Especial / Laudo',
      prompt: 'Selecione o tipo de inclusão ou laudo'
    },
    {
      colLetter: 'L',
      options: DROPDOWN_OPTIONS.preferredRow,
      title: 'Preferência de Fileira',
      prompt: 'Selecione Frente, Meio, Fundo ou Indiferente'
    },
    {
      colLetter: 'N',
      options: DROPDOWN_OPTIONS.affinityPriority,
      title: 'Prioridade da Parceria',
      prompt: 'Selecione Alta (+3), Média (+2) ou Baixa (+1)'
    },
    {
      colLetter: 'O',
      options: DROPDOWN_OPTIONS.affinityCategory,
      title: 'Motivo da Proximidade',
      prompt: 'Selecione o motivo pedagógico da parceria'
    },
    {
      colLetter: 'Q',
      options: DROPDOWN_OPTIONS.antiAffinitySeverity,
      title: 'Nível de Separação',
      prompt: 'Selecione o nível de afastamento necessário'
    },
    {
      colLetter: 'R',
      options: DROPDOWN_OPTIONS.antiAffinityCategory,
      title: 'Motivo do Distanciamento',
      prompt: 'Selecione o motivo disciplinar ou pedagógico'
    }
  ];

  for (let r = 7; r <= maxRowToValidate; r++) {
    const row = wsMain.getRow(r);
    validationsConfig.forEach(cfg => {
      const cell = row.getCell(cfg.colLetter);
      const formulaStr = `"${cfg.options.join(',')}"`;
      cell.dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [formulaStr],
        showErrorMessage: true,
        errorTitle: `${cfg.title} Inválido`,
        error: `Por favor, selecione uma das opções disponíveis na lista suspensa desta célula.`,
        showInputMessage: true,
        promptTitle: cfg.title,
        prompt: cfg.prompt
      };
    });
  }

  // Column widths
  wsMain.columns = [
    { key: 'roll', width: 12 },
    { key: 'name', width: 32 },
    { key: 'nick', width: 18 },
    { key: 'gender', width: 14 },
    { key: 'behavior', width: 22 },
    { key: 'academic', width: 18 },
    { key: 'vision', width: 20 },
    { key: 'hearing', width: 20 },
    { key: 'mobility', width: 18 },
    { key: 'special', width: 26 },
    { key: 'notes_laudo', width: 44 },
    { key: 'row_pref', width: 20 },
    { key: 'aff_names', width: 36 },
    { key: 'aff_priority', width: 24 },
    { key: 'aff_reason', width: 30 },
    { key: 'anti_names', width: 36 },
    { key: 'anti_severity', width: 30 },
    { key: 'anti_reason', width: 30 },
    { key: 'teacher_notes', width: 36 }
  ];

  // -------------------------------------------------------------
  // WORKSHEET 2: INSTRUÇÕES E GUIA
  // -------------------------------------------------------------
  const wsInst = wb.addWorksheet('Instrucoes_e_Guia');
  wsInst.views = [{ showGridLines: true }];

  const guideRows = [
    [`GUIA DO PROFESSOR REGENTE — ${instName.toUpperCase()}`],
    ['INSTRUÇÕES PARA PREENCHIMENTO DO MAPEAMENTO DE ALUNOS & GERAÇÃO DO ESPELHO'],
    [],
    ['★ NOVIDADE: LISTAS SUSPENSAS (DROPDOWNS) NATIVAS'],
    ['Todas as colunas padronizadas da planilha agora possuem listas suspensas automáticas:'],
    ['- Basta clicar na célula e escolher uma das opções prontas na setinha que aparece.'],
    ['- Isso evita erros de digitação e garante que o gerador de espelhos compreenda 100% dos dados informados.'],
    [],
    ['1. OBJETIVO DESTA PLANILHA'],
    ['Esta planilha é a ferramenta oficial do professor regente para diagnosticar as características pedagógicas, comportamentais e sociais de cada estudante.'],
    ['As informações cadastradas alimentam diretamente o algoritmo inteligente do gerador de espelhos de classe, garantindo harmonia, foco nas aulas e respeito às necessidades de inclusão.'],
    [],
    ['2. EXPLICAÇÃO DETALHADA DAS COLUNAS COM LISTA SUSPENSA'],
    ['Coluna', 'Nome do Campo', 'Opções da Lista Suspensa', 'Impacto no Espelho de Carteiras'],
    ['A', 'Nº Chamada', 'Número inteiro (1, 2, 3...)', 'Utilizado para identificação e ordenação da turma.'],
    ['B', 'Nome Completo', 'Texto obrigatório', 'Nome oficial do aluno impresso no espelho e nos relatórios.'],
    ['C', 'Apelido / Nome Social', 'Texto opcional', 'Facilita a identificação rápida pelo regente no mapa visual.'],
    ['D', 'Gênero', 'M | F | Outro (Lista Suspensa)', 'Auxilia no equilíbrio visual da distribuição na sala.'],
    ['E', 'Perfil Comportamental', 'Calmo / Focado | Moderado | Muito Conversador (Lista Suspensa)', 'Alunos "Muito Conversadores" NUNCA são colocados lado a lado pelo gerador.'],
    ['F', 'Nível Acadêmico', 'Regular | Avançado | Precisa de Ajuda (Lista Suspensa)', 'Usado para formar duplas cooperativas e monitorias pedagógicas.'],
    ['G', 'Necessidade Visual', 'Normal | Precisa de Frente | Baixa Visão (Lista Suspensa)', 'Alunos que precisam de frente são alocados nas fileiras 1 ou 2 com prioridade máxima.'],
    ['H', 'Necessidade Auditiva', 'Normal | Precisa de Frente | Dificuldade Auditiva (Lista Suspensa)', 'Garante proximidade do professor e acústica favorável nas primeiras fileiras.'],
    ['I', 'Mobilidade Reduzida', 'Não | Sim (Lista Suspensa)', 'Aloca o estudante em carteiras laterais ou corredores de fácil circulação.'],
    ['J', 'Condição / Laudo', 'Nenhuma | TDAH / Foco | TEA / Autismo | Baixa Visão | Dificuldade Auditiva | Cadeirante | Aluno Alto | Canhoto | Outro', 'Ativa as regras específicas de inclusão escolar e adequação ergonômica.'],
    ['K', 'Detalhes do Laudo', 'Texto livre', 'Exemplo: "Miopia 4 graus", "TDAH precisa longe da janela". Fica registrado no prontuário do aluno.'],
    ['L', 'Preferência de Fileira', 'Frente | Meio | Fundo | Indiferente (Lista Suspensa)', 'Respeita o conforto postural do aluno. Alunos altos devem ir para o "Fundo".'],
    ['M', 'PODEM FICAR PERTO', 'Nomes ou números dos colegas separados por ";" ou ","', 'Colegas que trabalham bem juntos. O algoritmo atrai esses alunos para carteiras vizinhas.'],
    ['N', 'Nível Prioridade Parceria', 'Alta (+3) | Média (+2) | Baixa (+1) (Lista Suspensa)', 'Peso da atração matemática. Alta (+3) busca carteiras adjacentes imediatas.'],
    ['O', 'Motivo da Proximidade', 'Apoio Pedagógico & Monitoria | Trabalho em Dupla | Sinergia de Foco | Inclusão (Lista Suspensa)', 'Categoriza pedagogicamente a razão da aliança entre os colegas.'],
    ['P', 'NÃO PODEM FICAR PERTO', 'Nomes ou números dos colegas separados por ";" ou ","', 'Desafetos ou duplas que conversam demais. O algoritmo REPELE esses alunos para longe.'],
    ['Q', 'Nível de Separação', 'Separação Obrigatória (-3) | Evitar Vizinhança (-2) | Afastamento Recomendado (-1) (Lista Suspensa)', '(-3) gera alerta crítico de conflito se ficarem perto e impõe penalidade máxima no algoritmo.'],
    ['R', 'Motivo do Distanciamento', 'Conversa Excessiva / Dispersão | Conflito / Atrito | Distração Mútua (Lista Suspensa)', 'Explica a necessidade disciplinar da separação.'],
    ['S', 'Observações Gerais', 'Texto livre do professor', 'Informações complementares sobre a rotina pedagógica do aluno.'],
    [],
    ['3. DICAS PRÁTICAS'],
    ['- Para afinidades ou desafinidades, digite os nomes completos ou apenas os números de chamada dos colegas separados por ";" (ex: "Bernardo Silva; Caio Fernandes" ou "2; 3").'],
    ['- Após salvar a planilha preenchida, acesse o sistema e clique em "Importar Planilha / CSV". O mapa e os cadastros serão atualizados na hora!']
  ];

  guideRows.forEach((r, idx) => {
    const row = wsInst.addRow(r);
    if (idx === 0) {
      row.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF047857' } };
    } else if (idx === 1 || idx === 3 || idx === 8 || idx === 12 || idx === 32) {
      row.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    } else if (idx === 13) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      });
    }
  });

  wsInst.columns = [
    { width: 10 },
    { width: 28 },
    { width: 38 },
    { width: 62 }
  ];

  // -------------------------------------------------------------
  // WORKSHEET 3: VALORES PERMITIDOS (REFERÊNCIA)
  // -------------------------------------------------------------
  const wsRef = wb.addWorksheet('Valores_Permitidos');
  wsRef.views = [{ showGridLines: true }];

  wsRef.addRow(['TABELA DE OPÇÕES PADRONIZADAS PARA CONSULTA']);
  wsRef.addRow([]);
  const refHeader1 = wsRef.addRow(['Gênero', 'Perfil Comportamental', 'Nível Acadêmico', 'Necessidades Visuais / Auditivas', 'Preferência de Fileira']);
  refHeader1.eachCell(c => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };
    c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  });

  const maxItems1 = Math.max(
    DROPDOWN_OPTIONS.gender.length,
    DROPDOWN_OPTIONS.behavior.length,
    DROPDOWN_OPTIONS.academicLevel.length,
    DROPDOWN_OPTIONS.visionNeeds.length,
    DROPDOWN_OPTIONS.preferredRow.length
  );

  for (let i = 0; i < maxItems1; i++) {
    wsRef.addRow([
      DROPDOWN_OPTIONS.gender[i] || '',
      DROPDOWN_OPTIONS.behavior[i] || '',
      DROPDOWN_OPTIONS.academicLevel[i] || '',
      DROPDOWN_OPTIONS.visionNeeds[i] || '',
      DROPDOWN_OPTIONS.preferredRow[i] || ''
    ]);
  }

  wsRef.addRow([]);
  const refHeader2 = wsRef.addRow(['Condição Especial / Laudo', 'Nível Parceria (+)', 'Motivos Proximidade', 'Nível Separação (-)', 'Motivos Distanciamento']);
  refHeader2.eachCell(c => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };
    c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  });

  const maxItems2 = Math.max(
    DROPDOWN_OPTIONS.specialNeeds.length,
    DROPDOWN_OPTIONS.affinityPriority.length,
    DROPDOWN_OPTIONS.affinityCategory.length,
    DROPDOWN_OPTIONS.antiAffinitySeverity.length,
    DROPDOWN_OPTIONS.antiAffinityCategory.length
  );

  for (let i = 0; i < maxItems2; i++) {
    wsRef.addRow([
      DROPDOWN_OPTIONS.specialNeeds[i] || '',
      DROPDOWN_OPTIONS.affinityPriority[i] || '',
      DROPDOWN_OPTIONS.affinityCategory[i] || '',
      DROPDOWN_OPTIONS.antiAffinitySeverity[i] || '',
      DROPDOWN_OPTIONS.antiAffinityCategory[i] || ''
    ]);
  }

  wsRef.columns = [
    { width: 28 },
    { width: 28 },
    { width: 34 },
    { width: 34 },
    { width: 36 }
  ];

  return wb;
}

/**
 * Generates and triggers download of the official teacher spreadsheet as an .xlsx Excel file
 * featuring native Excel dropdown lists (Data Validation).
 */
export async function downloadTeacherSpreadsheetExcel(
  classroom: Classroom,
  institution?: Institution,
  options: SpreadsheetExportOptions = {}
): Promise<void> {
  const wb = await buildTeacherSpreadsheetExcelJS(classroom, institution, options);

  const cleanName = classroom.name
    ? classroom.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')
    : 'turma';
  const instPrefix = (institution?.code || 'fleming').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const typeSuffix = options.includeCurrentStudents ? 'alunos_atual' : 'modelo_regente';
  const fileName = `planilha_${instPrefix}_${cleanName}_${typeSuffix}.xlsx`;

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a clean CSV file with Windows/Excel Brazil standard (UTF-8 BOM + semicolon).
 */
export function downloadTeacherSpreadsheetCSV(
  classroom: Classroom,
  institution?: Institution,
  options: SpreadsheetExportOptions = {}
): void {
  // Use XLSX for fast CSV serialization
  const instName = options.institutionName || institution?.name || classroom.schoolName || 'FLEMING FLORIPA';
  const instCode = options.institutionCode || institution?.code || 'FLEMING-EDU';
  const className = classroom.name || 'Turma Regente';

  const rows: (string | number)[][] = [
    [`${instName.toUpperCase()} — SISTEMA DE ENSINO (${instCode})`],
    [`Turma: ${className}`],
    [],
    [
      'Nº Chamada',
      'Nome Completo do Aluno',
      'Apelido / Nome Social',
      'Gênero',
      'Perfil Comportamental',
      'Nível Acadêmico',
      'Necessidade Visual',
      'Necessidade Auditiva',
      'Mobilidade Reduzida',
      'Condição Especial / Laudo',
      'Detalhes do Laudo / Recomendações',
      'Preferência de Fileira',
      'PODEM FICAR PERTO (Afinidades)',
      'Nível Prioridade da Parceria',
      'Motivo da Proximidade',
      'NÃO PODEM FICAR PERTO (Desafinidades)',
      'Nível de Separação',
      'Motivo do Distanciamento',
      'Observações do Professor Regente'
    ]
  ];

  if (options.includeCurrentStudents && classroom.students && classroom.students.length > 0) {
    classroom.students.forEach(s => {
      rows.push([
        s.rollNumber,
        s.name,
        s.nickname || '',
        s.gender || 'M',
        s.behavior === 'talkative' ? 'Muito Conversador' : s.behavior === 'moderate' ? 'Moderado' : 'Calmo / Focado',
        s.academicLevel === 'advanced' ? 'Avançado' : s.academicLevel === 'needs_help' ? 'Precisa de Ajuda' : 'Regular',
        s.visionNeeds === 'needs_front' ? 'Precisa de Frente' : 'Normal',
        s.hearingNeeds === 'needs_front' ? 'Precisa de Frente' : 'Normal',
        s.reducedMobility ? 'Sim' : 'Não',
        (s.specialNeeds || []).join(', ') || 'Nenhuma',
        s.specialNeedsNotes || '',
        s.preferredRow === 'front' ? 'Frente' : s.preferredRow === 'back' ? 'Fundo' : s.preferredRow === 'middle' ? 'Meio' : 'Indiferente',
        (s.affinities || []).join('; '),
        '',
        '',
        (s.antiAffinities || []).join('; '),
        '',
        '',
        s.notes || ''
      ]);
    });
  } else {
    rows.push([
      1, 'Alice Monteiro', 'Lili', 'F', 'Calmo / Focado', 'Avançado', 'Normal', 'Normal', 'Não', 'Nenhuma', '-', 'Frente', 'Bernardo Silva; Caio Fernandes', 'Alta (+3)', 'Apoio Pedagógico & Monitoria', 'Gabriel Santos', 'Separação Obrigatória (-3)', 'Conversa Excessiva / Dispersão', 'Excelente aluna'
    ]);
    rows.push([
      2, 'Bernardo Silva', 'Bê', 'M', 'Moderado', 'Regular', 'Precisa de Frente', 'Normal', 'Não', 'TDAH / Foco', 'Laudo TDAH', 'Frente', 'Alice Monteiro', 'Alta (+3)', 'Apoio Pedagógico & Monitoria', 'Gabriel Santos', 'Separação Obrigatória (-3)', 'Conversa Excessiva / Dispersão', 'Precisa de foco'
    ]);
  }

  const csvBody = rows.map(r => r.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csvBody], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const cleanName = classroom.name
    ? classroom.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')
    : 'turma';
  const instPrefix = (institution?.code || 'fleming').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const typeSuffix = options.includeCurrentStudents ? 'alunos_atual' : 'modelo_regente';

  link.setAttribute('href', url);
  link.setAttribute('download', `planilha_${instPrefix}_${cleanName}_${typeSuffix}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Backward-compatibility function returning SheetJS WorkBook if needed.
 */
export function generateTeacherSpreadsheetWorkbook(
  classroom: Classroom,
  institution?: Institution,
  options: SpreadsheetExportOptions = {}
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([['Planilha do Professor Regente']]);
  XLSX.utils.book_append_sheet(wb, ws, 'Mapeamento_Turma');
  return wb;
}
