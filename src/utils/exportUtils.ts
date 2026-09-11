import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Classroom, Institution, Student } from '../types';

/**
 * Loads an image from a URL or Data URL and converts it to a base64 Data URL.
 * Bypasses CORS issues where possible and caches the image in memory.
 */
async function getBase64Image(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:image/')) return url;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 200;
        canvas.height = img.naturalHeight || img.height || 200;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (err) {
        console.warn('Canvas conversion failed for logo:', err);
        resolve(null);
      }
    };
    img.onerror = () => {
      console.warn('Could not load image for PDF export:', url);
      resolve(null);
    };
    // Timeout safeguard
    setTimeout(() => resolve(null), 3500);
    img.src = url;
  });
}

/**
 * Cleans text for PDF output, normalizing quotes, unicode diacritics, and dashes.
 */
function cleanPdfText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFC')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // single curly/smart quotes
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"') // double curly/smart quotes
    .replace(/[\u2013\u2014\u2212]/g, '-')       // en-dash, em-dash, minus
    .replace(/[\u2022\u25CF\u2023]/g, '-')       // bullet points
    .replace(/[\u00A0\u2007\u202F]/g, ' ')       // non-breaking spaces
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')   // zero-width chars
    .trim();
}

/**
 * Fallback string transliterator for pure 7-bit ASCII/Latin fallback in jsPDF standard fonts.
 * Ensures letters like Í, Ç, Á, Õ never produce 'ÿÿ' or corrupted glyphs.
 */
function safeLatinText(text: string): string {
  if (!text) return '';
  const cleaned = cleanPdfText(text);
  // Ensure non-ASCII Latin characters are preserved or safely mapped
  return cleaned
    .replace(/[\u00C0-\u00C5]/g, 'A')
    .replace(/[\u00C8-\u00CB]/g, 'E')
    .replace(/[\u00CC-\u00CF]/g, 'I')
    .replace(/[\u00D2-\u00D6\u00D8]/g, 'O')
    .replace(/[\u00D9-\u00DC]/g, 'U')
    .replace(/[\u00C7]/g, 'C')
    .replace(/[\u00D1]/g, 'N')
    .replace(/[\u00E0-\u00E5]/g, 'a')
    .replace(/[\u00E8-\u00EB]/g, 'e')
    .replace(/[\u00EC-\u00EF]/g, 'i')
    .replace(/[\u00F2-\u00F6\u00F8]/g, 'o')
    .replace(/[\u00F9-\u00FC]/g, 'u')
    .replace(/[\u00E7]/g, 'c')
    .replace(/[\u00F1]/g, 'n');
}

export interface PdfExportOptions {
  showRollNumber?: boolean;
  viewPerspective?: 'student' | 'teacher';
}

/**
 * Generates and downloads a clean, standardized A4 Landscape PDF of the classroom seating map.
 * Uses html2canvas capture with an automatic high-fidelity native vector fallback in jsPDF.
 */
export async function exportToPdf(
  elementId: string, 
  fileName: string, 
  classroom?: Classroom, 
  institution?: Institution,
  options?: PdfExportOptions
): Promise<void> {
  const cleanName = (fileName || 'espelho_de_classe')
    .replace(/[\\/:*?"<>|\s]+/g, '_')
    .replace(/^_+|_+$/g, '');

  let canvasSuccess = false;

  // Pre-fetch logo as base64 if present to ensure it renders in both html2canvas and native vector
  const logoRawUrl = institution?.logoUrl;
  let logoBase64: string | null = null;
  if (logoRawUrl) {
    try {
      logoBase64 = await getBase64Image(logoRawUrl);
    } catch (e) {
      console.warn('Logo preload error:', e);
    }
  }

  // A4 Landscape dimensions in mm: 297 x 210
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Try to locate element with a brief retry to allow React tab transition to complete
  let element = document.getElementById(elementId);
  if (!element) {
    for (let retry = 0; retry < 5; retry++) {
      await new Promise((r) => setTimeout(r, 100));
      element = document.getElementById(elementId);
      if (element) break;
    }
  }

  if (element) {
    try {
      // If logoBase64 is available, temporarily swap any remote img inside element to base64 to avoid taint
      const imgElements = Array.from(element.querySelectorAll('img'));
      const originalSrcs: string[] = [];
      imgElements.forEach((img, idx) => {
        originalSrcs[idx] = img.src;
        if (logoBase64 && (img.alt?.toLowerCase().includes('logo') || img.src.includes('logo') || img.src === logoRawUrl)) {
          img.src = logoBase64;
        }
        img.crossOrigin = 'anonymous';
      });

      // Preload all images inside element
      await Promise.all(
        imgElements.map((img) => {
          if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 1500);
          });
        })
      );

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth || 1200,
        imageTimeout: 10000,
        ignoreElements: (el) => el.classList?.contains('no-print'),
      });

      // Restore original img srcs if needed
      imgElements.forEach((img, idx) => {
        if (originalSrcs[idx] && originalSrcs[idx] !== img.src) {
          img.src = originalSrcs[idx];
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const ratio = imgProps.width / imgProps.height;
      
      let renderWidth = pdfWidth - 14; // 7mm margin each side
      let renderHeight = renderWidth / ratio;

      if (renderHeight > pdfHeight - 14) {
        renderHeight = pdfHeight - 14;
        renderWidth = renderHeight * ratio;
      }

      const posX = (pdfWidth - renderWidth) / 2;
      const posY = (pdfHeight - renderHeight) / 2;

      pdf.addImage(imgData, 'PNG', posX, posY, renderWidth, renderHeight, undefined, 'FAST');
      canvasSuccess = true;
    } catch (canvasErr) {
      console.warn('html2canvas capture issue, generating native vector PDF:', canvasErr);
      canvasSuccess = false;
    }
  }

  // If html2canvas was not available or failed, generate native vector layout with logo
  if (!canvasSuccess && classroom) {
    generateNativeVectorPDF(pdf, classroom, institution, logoBase64, options);
  }

  // Trigger download with multi-browser reliability
  try {
    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `${cleanName}.pdf`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    }, 2000);
  } catch (downloadErr) {
    pdf.save(`${cleanName}.pdf`);
  }
}

/**
 * Splits text into lines fitting within a max width, with word breaking fallback
 */
function wrapStudentName(pdf: jsPDF, rawText: string, maxWidth: number, maxLines = 2): string[] {
  const text = safeLatinText(rawText);
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = pdf.getTextWidth(testLine);

    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Single word exceeds width: slice it
        let partial = '';
        for (let c = 0; c < word.length; c++) {
          if (pdf.getTextWidth(partial + word[c]) <= maxWidth) {
            partial += word[c];
          } else {
            lines.push(partial);
            partial = word[c];
          }
        }
        currentLine = partial;
      }
    }

    if (lines.length >= maxLines) break;
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines.slice(0, maxLines);
}

/**
 * Native Vector PDF Generator: Draws crisp, standardized A4 Landscape seating map
 * Uses standard Latin-1 strings without unicode symbols so accents and characters render properly.
 * Excludes all sensitive student specifications (special needs, inclusion, affinities, conflicts).
 */
function generateNativeVectorPDF(
  pdf: jsPDF, 
  classroom: Classroom, 
  institution?: Institution,
  preloadedLogo?: string | null,
  options?: PdfExportOptions
): void {
  const showRollNumber = options?.showRollNumber !== false;
  const pageWidth = 297;
  const pageHeight = 210;
  const marginX = 12;
  const usableWidth = pageWidth - (marginX * 2); // 273mm

  const rawSchoolName = institution?.name || classroom.schoolName || 'FLEMING FLORIPA';
  const schoolName = cleanPdfText(rawSchoolName);
  const schoolLogo = preloadedLogo || institution?.logoUrl;
  const { rows, cols, activeDesks, teacherDeskPosition } = classroom.roomConfig;
  const seatingMap = classroom.seatingMap || {};
  const studentMap = new Map<string, Student>();
  classroom.students.forEach(s => studentMap.set(s.id, s));

  // --- 1. CABEÇALHO MINIMALISTA PREMIUM ---
  let curY = 11;

  // School Title in Display Bold Sans-Serif
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13.5);
  pdf.setTextColor(15, 23, 42); // slate-900
  pdf.text(safeLatinText(schoolName).toUpperCase(), marginX, curY);

  // Subtitle
  curY += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105); // slate-600
  pdf.text('ESPELHO DE CLASSE - MAPA OFICIAL DE SALA DE AULA', marginX, curY);

  // Draw Logo in Vector PDF if available (Top Right isolated box)
  const logoHeight = 12;
  const logoWidth = 35;
  const logoY = 7;
  if (schoolLogo) {
    try {
      const format = schoolLogo.startsWith('data:image/jpeg') || schoolLogo.startsWith('data:image/jpg') ? 'JPEG' : 'PNG';
      pdf.addImage(schoolLogo, format, marginX + usableWidth - logoWidth, logoY, logoWidth, logoHeight, undefined, 'FAST');
    } catch (imgErr) {
      try {
        pdf.addImage(schoolLogo, 'PNG', marginX + usableWidth - logoWidth, logoY, logoWidth, logoHeight, undefined, 'FAST');
      } catch (e2) {
        console.warn('Could not add logo to vector PDF:', e2);
      }
    }
  }

  // Metadata Grid in Dark Slate/Gray - strictly positioned below logo with generous margin-bottom
  curY = Math.max(curY + 5, logoY + logoHeight + 4);
  pdf.setDrawColor(226, 232, 240); // slate-200
  pdf.setLineWidth(0.2);
  pdf.line(marginX, curY, marginX + usableWidth, curY);

  curY += 4;
  pdf.setFontSize(7.5);
  pdf.setTextColor(51, 65, 85); // slate-700
  const colW = usableWidth / 6;

  pdf.setFont('helvetica', 'bold');
  pdf.text(`Turma: `, marginX, curY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(safeLatinText(classroom.name), marginX + 11, curY);

  pdf.setFont('helvetica', 'bold');
  pdf.text(`Nivel: `, marginX + colW, curY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(safeLatinText(classroom.grade), marginX + colW + 9, curY);

  pdf.setFont('helvetica', 'bold');
  pdf.text(`Professor(a): `, marginX + (colW * 2), curY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(safeLatinText(classroom.teacherName), marginX + (colW * 2) + 18, curY);

  pdf.setFont('helvetica', 'bold');
  pdf.text(`Sala: `, marginX + (colW * 3.3), curY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(safeLatinText(classroom.roomNumber || 'Padrao'), marginX + (colW * 3.3) + 8, curY);

  pdf.setFont('helvetica', 'bold');
  pdf.text(`Ano Letivo: `, marginX + (colW * 4.3), curY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(safeLatinText(classroom.academicYear), marginX + (colW * 4.3) + 16, curY);

  pdf.setFont('helvetica', 'bold');
  pdf.text(`Total Alunos: `, marginX + (colW * 5.2), curY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${classroom.students.length}`, marginX + (colW * 5.2) + 18, curY);

  curY += 2.5;
  pdf.line(marginX, curY, marginX + usableWidth, curY);

  const isTeacherView = options?.viewPerspective === 'teacher';

  // --- 2. ESPAÇO DA SALA COM TONS INSTITUCIONAIS SUAVES ---
  curY += 3;

  if (isTeacherView) {
    // Na Vista Professor, o FUNDO DA SALA fica no topo da folha
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text('FUNDO DA SALA DE AULA (ULTIMAS FILEIRAS)', marginX + (usableWidth / 2), curY + 2.5, { align: 'center' });
    curY += 5;
  } else {
    // Na Vista Padrão, o QUADRO NEGRO fica no topo
    pdf.setFillColor(51, 65, 85); // slate-700
    pdf.roundedRect(marginX, curY, usableWidth, 5.5, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(248, 250, 252); // slate-50
    pdf.text('QUADRO NEGRO / LOUSA (FRENTE DA SALA)', marginX + (usableWidth / 2), curY + 3.8, { align: 'center' });
    curY += 7.5;

    // Teacher desk if present (soft institutional)
    if (teacherDeskPosition && teacherDeskPosition !== 'none') {
      const tWidth = 44;
      const tHeight = 5;
      let tX = marginX + (usableWidth / 2) - (tWidth / 2);
      if (teacherDeskPosition === 'front_left') tX = marginX + 2;
      if (teacherDeskPosition === 'front_right') tX = marginX + usableWidth - tWidth - 2;

      pdf.setFillColor(241, 245, 249); // slate-100
      pdf.setDrawColor(203, 213, 225); // slate-300
      pdf.setLineWidth(0.2);
      pdf.roundedRect(tX, curY, tWidth, tHeight, 1, 1, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(51, 65, 85);
      pdf.text(`Mesa do Professor`, tX + (tWidth / 2), curY + 3.4, { align: 'center' });

      curY += 7;
    }
  }

  // --- 3. LAYOUT DAS MESAS: MINIMALISTA PREMIUM ---
  const gridAvailableHeight = pageHeight - curY - 24; // space for bottom elements & footer
  const gap = cols >= 16 ? 0.8 : cols >= 12 ? 1.2 : cols >= 8 ? 1.8 : 2.5;
  const deskWidth = (usableWidth - (gap * (cols - 1))) / cols;
  const deskHeight = Math.min(18, (gridAvailableHeight - (gap * (rows - 1))) / rows);
  const isCompact = deskWidth < 22 || deskHeight < 11;
  const isUltraCompact = deskWidth < 14 || deskHeight < 8;

  for (let rIdx = 0; rIdx < rows; rIdx++) {
    for (let cIdx = 0; cIdx < cols; cIdx++) {
      const r = isTeacherView ? (rows - 1 - rIdx) : rIdx;
      const c = isTeacherView ? (cols - 1 - cIdx) : cIdx;
      const deskId = `r${r}_c${c}`;
      const isActive = activeDesks[deskId] !== false;
      const dX = marginX + (cIdx * (deskWidth + gap));
      const dY = curY + (rIdx * (deskHeight + gap));

      // CORREDORES: Ocultos (apenas espaçamento invisível)
      if (!isActive) {
        continue;
      }

      const studentId = seatingMap[deskId];
      const student = studentId ? studentMap.get(studentId) : null;

      if (student) {
        // ALUNOS: Cartões brancos com cantos arredondados, sombra/borda sutil, SEM código de grade, número e nome centralizados
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(203, 213, 225); // slate-300
        pdf.setLineWidth(0.22);
        pdf.roundedRect(dX, dY, deskWidth, deskHeight, 1, 1, 'FD');

        // Roll number badge (Top Center)
        let rollBadgeH = 0;
        if (showRollNumber) {
          const rollBadgeW = isUltraCompact ? 5.5 : isCompact ? 7.5 : 10;
          rollBadgeH = isUltraCompact ? 2.0 : isCompact ? 2.5 : 3.5;
          const rollBadgeX = dX + (deskWidth / 2) - (rollBadgeW / 2);
          const rollBadgeY = dY + (isUltraCompact ? 0.5 : isCompact ? 0.8 : 1.3);

          pdf.setFillColor(241, 245, 249); // slate-100
          pdf.setDrawColor(226, 232, 240);
          pdf.setLineWidth(0.15);
          pdf.roundedRect(rollBadgeX, rollBadgeY, rollBadgeW, rollBadgeH, 0.6, 0.6, 'FD');

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(isUltraCompact ? 3.4 : isCompact ? 4.2 : 5.5);
          pdf.setTextColor(71, 85, 105); // slate-600
          pdf.text(`N ${student.rollNumber}`, dX + (deskWidth / 2), rollBadgeY + (isUltraCompact ? 1.4 : isCompact ? 1.8 : 2.5), { align: 'center' });
        }

        // Student Name (Prominently Center)
        const maxTextWidth = deskWidth - (isUltraCompact ? 1 : 2);
        const fontSize = showRollNumber 
          ? (deskWidth < 12 ? 3.2 : deskWidth < 18 ? 4.2 : deskWidth < 26 ? 5.2 : deskWidth < 34 ? 6.5 : 7.5)
          : (deskWidth < 12 ? 3.6 : deskWidth < 18 ? 4.8 : deskWidth < 26 ? 5.8 : deskWidth < 34 ? 7.2 : 8.2);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(fontSize);
        pdf.setTextColor(15, 23, 42); // slate-900
        
        // Smart name wrapping: 1 line if desk is very short, else 2 lines
        const maxLines = deskHeight < 10 ? 1 : 2;
        const displayLines = wrapStudentName(pdf, student.name, maxTextWidth, maxLines);

        const lineHeight = fontSize * 0.4;
        const totalTextHeight = (displayLines.length - 1) * lineHeight;
        const startY = showRollNumber
          ? (isCompact 
              ? dY + rollBadgeH + (isCompact ? 2.2 : 3) 
              : dY + (deskHeight / 2) + 1.5 - (totalTextHeight / 2))
          : dY + (deskHeight / 2) + 0.8 - (totalTextHeight / 2);

        displayLines.forEach((lineText: string, lineIndex: number) => {
          pdf.text(lineText, dX + (deskWidth / 2), startY + (lineIndex * lineHeight), { align: 'center' });
        });
      } else {
        // CARTEIRAS VAZIAS: Cartões inativos visíveis com fundo levemente acinzentado e texto em cinza claro
        pdf.setFillColor(248, 250, 252); // slate-50
        pdf.setDrawColor(226, 232, 240); // slate-200
        pdf.setLineWidth(0.2);
        pdf.roundedRect(dX, dY, deskWidth, deskHeight, 1, 1, 'FD');

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(isCompact ? 4.5 : 6);
        pdf.setTextColor(148, 163, 184); // slate-400
        pdf.text('Vazia', dX + (deskWidth / 2), dY + (deskHeight / 2) + (isCompact ? 0.7 : 1), { align: 'center' });
      }
    }
  }

  curY += (rows * (deskHeight + gap));

  if (isTeacherView) {
    curY += 2;
    // Mesa do professor na base (se houver, com orientação invertida em relação ao observador)
    if (teacherDeskPosition && teacherDeskPosition !== 'none') {
      const tWidth = 44;
      const tHeight = 5;
      let tX = marginX + (usableWidth / 2) - (tWidth / 2);
      if (teacherDeskPosition === 'front_left') tX = marginX + usableWidth - tWidth - 2;
      if (teacherDeskPosition === 'front_right') tX = marginX + 2;

      pdf.setFillColor(241, 245, 249); // slate-100
      pdf.setDrawColor(203, 213, 225); // slate-300
      pdf.setLineWidth(0.2);
      pdf.roundedRect(tX, curY, tWidth, tHeight, 1, 1, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(51, 65, 85);
      pdf.text(`Mesa do Professor`, tX + (tWidth / 2), curY + 3.4, { align: 'center' });
      curY += 6.5;
    }

    // QUADRO NEGRO / LOUSA NA PARTE DE BAIXO
    pdf.setFillColor(51, 65, 85); // slate-700
    pdf.roundedRect(marginX, curY, usableWidth, 5.5, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(248, 250, 252);
    pdf.text('QUADRO NEGRO / LOUSA (POSICAO DO PROFESSOR - FRENTE DA SALA)', marginX + (usableWidth / 2), curY + 3.8, { align: 'center' });
  } else {
    // --- FUNDO DA SALA ---
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text('FUNDO DA SALA DE AULA', marginX + (usableWidth / 2), curY + 3.5, { align: 'center' });
  }

  // --- RODAPÉ INSTITUCIONAL ---
  const footerY = pageHeight - 8;
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.2);
  pdf.line(marginX, footerY - 3, marginX + usableWidth, footerY - 3);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Plataforma de Gestao Pedagogica - ${schoolName}`, marginX, footerY);
  pdf.text('Assinatura do(a) Professor(a): ___________________________________________', marginX + usableWidth, footerY, { align: 'right' });
}

export function exportClassroomToCSV(classroom: Classroom): void {
  const headers = ['Numero_Chamada', 'Nome_Aluno', 'Linha_Fileira', 'Coluna', 'Posicao_Carteira', 'Necessidades_Especiais', 'Comportamento'];
  const rows: string[][] = [headers];

  const deskToStudent = classroom.seatingMap || {};

  // Sort students by rollNumber
  const sortedStudents = [...classroom.students].sort((a, b) => a.rollNumber - b.rollNumber);

  sortedStudents.forEach(s => {
    let deskId = '';
    let rowStr = 'N/A';
    let colStr = 'N/A';

    Object.entries(deskToStudent).forEach(([dId, sId]) => {
      if (sId === s.id) {
        deskId = dId;
        const match = dId.match(/r(\d+)_c(\d+)/);
        if (match) {
          rowStr = `Fileira ${parseInt(match[1]) + 1}`;
          colStr = `Coluna ${parseInt(match[2]) + 1}`;
        }
      }
    });

    rows.push([
      s.rollNumber.toString(),
      `"${s.name.replace(/"/g, '""')}"`,
      rowStr,
      colStr,
      deskId || 'Nao alocado',
      `"${s.specialNeeds.join(', ')}"`,
      s.behavior
    ]);
  });

  const csvContent = '\uFEFF' + rows.map(r => r.join(';')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `espelho_classe_${classroom.name.replace(/[\s/]/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportBackupJSON(classrooms: Classroom[]): void {
  const dataStr = JSON.stringify(classrooms, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `backup_espelhos_classe_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
