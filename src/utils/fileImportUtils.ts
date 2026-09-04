import * as XLSX from 'xlsx';

/**
 * Fixes common UTF-8 / Windows-1252 double-encoding (mojibake) artifacts.
 * E.g., 'JoÃ£o' -> 'João', 'VitÃ³ria' -> 'Vitória', 'AndrÃ©' -> 'André', 'GonÃ§alves' -> 'Gonçalves'.
 */
export function fixMojibake(text: string): string {
  if (!text) return '';

  // Common Portuguese double-encoded sequences
  const replacements: [RegExp, string][] = [
    [/Ã¡/g, 'á'],
    [/Ã©/g, 'é'],
    [/Ã­/g, 'í'],
    [/Ã³/g, 'ó'],
    [/Ãº/g, 'ú'],
    [/Ã£/g, 'ã'],
    [/Ãµ/g, 'õ'],
    [/Ã¢/g, 'â'],
    [/Ãª/g, 'ê'],
    [/Ã®/g, 'î'],
    [/Ã´/g, 'ô'],
    [/Ã»/g, 'û'],
    [/Ã§/g, 'ç'],
    [/Ã€/g, 'À'],
    [/Ã /g, 'à'],
    [/Ã/g, 'Á'],
    [/Ã‰/g, 'É'],
    [/Ã/g, 'Í'],
    [/Ã“/g, 'Ó'],
    [/Ãš/g, 'Ú'],
    [/Ãƒ/g, 'Ã'],
    [/Ã•/g, 'Õ'],
    [/Ã‚/g, 'Â'],
    [/ÃŠ/g, 'Ê'],
    [/Ã”/g, 'Ô'],
    [/Ã‡/g, 'Ç'],
    [/Âº/g, 'º'],
    [/Âª/g, 'ª'],
    [/Â°/g, '°'],
    [/â€“/g, '-'],
    [/â€”/g, '-'],
    [/â€™/g, "'"],
    [/â€œ/g, '"'],
    [/â€/g, '"'],
    [/\uFFFD/g, ''], // Remove invalid replacement characters
  ];

  let result = text;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }

  return result.normalize('NFC');
}

/**
 * Normalizes text for comparison (removes accents, trims, lowercases).
 * E.g., 'João Pedro' -> 'joao pedro'.
 */
export function normalizeForSearch(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Parses an ArrayBuffer from a file (.xlsx, .xls, .csv, .tsv, .txt)
 * with robust encoding detection (UTF-8, Windows-1252 / ISO-8859-1, UTF-16).
 */
export function decodeFileBuffer(buffer: ArrayBuffer, fileName: string): string {
  const lowerName = fileName.toLowerCase();

  // 1. Handle native Excel spreadsheet files (.xlsx, .xls, .ods, .csv)
  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.ods')) {
    try {
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      let targetSheetName = workbook.SheetNames[0];
      // If there are multiple sheets, prioritize one named 'mapeamento', 'turma' or 'aluno'
      const matchName = workbook.SheetNames.find(name => {
        const n = normalizeForSearch(name);
        return n.includes('mapeamento') || n.includes('turma') || n.includes('aluno');
      });
      if (matchName) {
        targetSheetName = matchName;
      }
      if (!targetSheetName) return '';
      const worksheet = workbook.Sheets[targetSheetName];
      // Convert worksheet to semicolon-delimited CSV with UTF-8 support
      const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ';', blankrows: false });
      return fixMojibake(csv.normalize('NFC'));
    } catch (err) {
      console.error('Error parsing Excel spreadsheet with XLSX:', err);
    }
  }

  // 2. Handle Text / CSV / TSV with intelligent encoding detection
  const bytes = new Uint8Array(buffer);

  // Check UTF-8 BOM
  let text = '';
  if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    const decoder = new TextDecoder('utf-8');
    text = decoder.decode(bytes.subarray(3));
  } else if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
    // UTF-16 LE
    const decoder = new TextDecoder('utf-16le');
    text = decoder.decode(bytes.subarray(2));
  } else if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
    // UTF-16 BE
    const decoder = new TextDecoder('utf-16be');
    text = decoder.decode(bytes.subarray(2));
  } else {
    // Try strict UTF-8 first
    try {
      const strictUtf8Decoder = new TextDecoder('utf-8', { fatal: true });
      text = strictUtf8Decoder.decode(bytes);
    } catch {
      // If fatal error occurred (e.g. Windows-1252 Latin bytes in Brazilian Excel export)
      try {
        const win1252Decoder = new TextDecoder('windows-1252');
        text = win1252Decoder.decode(bytes);
      } catch {
        const isoDecoder = new TextDecoder('iso-8859-1');
        text = isoDecoder.decode(bytes);
      }
    }
  }

  return fixMojibake(text.normalize('NFC'));
}

/**
 * Automatically detects the true header row in a spreadsheet matrix.
 * Skips institutional header banners, instruction texts, or empty metadata rows.
 */
export function findHeaderRowIndex(matrix: string[][]): number {
  if (!matrix || matrix.length === 0) return 0;

  const keywords = [
    'nome', 'aluno', 'estudante', 'chamada', 'numero', 'num', 'nº', 'matricula', 'ra',
    'genero', 'sexo', 'comportamento', 'perfil', 'conduta', 'nivel', 'academico', 'desempenho',
    'visao', 'visual', 'audicao', 'auditivo', 'auditiva', 'mobilidade', 'cadeirante',
    'laudo', 'inclusao', 'fileira', 'afinidade', 'perto', 'desafinidade', 'afastar',
    'separacao', 'distanciamento', 'observacao', 'apelido', 'notas', 'parceria'
  ];

  let bestIndex = 0;
  let maxScore = -1;
  const maxRowsToCheck = Math.min(matrix.length, 15);

  for (let r = 0; r < maxRowsToCheck; r++) {
    const row = matrix[r];
    if (!row || row.length === 0) continue;

    const nonEmptyCells = row.filter(c => c && c.trim().length > 0);
    // If only 1 cell has content in a table with several columns, it is likely a title banner
    if (nonEmptyCells.length <= 1 && matrix.length > r + 1) {
      continue;
    }

    let keywordMatches = 0;
    for (const cell of nonEmptyCells) {
      const norm = normalizeForSearch(cell);
      if (keywords.some(k => norm.includes(k))) {
        keywordMatches++;
      }
    }

    // A true header row has keyword matches and multiple columns
    const score = (keywordMatches * 15) + nonEmptyCells.length;
    if (score > maxScore && keywordMatches >= 1) {
      maxScore = score;
      bestIndex = r;
    }
  }

  return bestIndex;
}

