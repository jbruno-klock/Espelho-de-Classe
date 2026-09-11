import jsPDF from 'jspdf';

/**
 * Normaliza e limpa o texto para garantir compatibilidade perfeita com fontes padrão do jsPDF.
 * Remove emojis e caracteres Unicode fora do padrão ASCII/Latin-1 para evitar qualquer sobreposição.
 */
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFC')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/[\u00A0\u2007\u202F]/g, ' ')
    // Remove emojis e caracteres pictográficos não suportados pelas fontes padrão do jsPDF
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .trim();
}

/**
 * Gera e realiza o download do Manual do Usuário Passo a Passo Ilustrado em formato PDF A4.
 */
export async function generateUserManualPdf(): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const totalPages = 5;
  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - (marginX * 2); // 182mm

  // Paleta de Cores Institucional
  const emeraldPrimary = [5, 150, 105];       // #059669
  const emeraldDark = [4, 120, 87];           // #047857
  const emeraldBg = [236, 253, 245];          // #ecfdf5
  const emeraldBorder = [167, 243, 208];      // #a7f3d0

  const slate900 = [15, 23, 42];              // #0f172a
  const slate800 = [30, 41, 59];              // #1e293b
  const slate700 = [51, 65, 85];              // #334155
  const slate600 = [71, 85, 105];             // #475569
  const slate500 = [100, 116, 139];           // #64748b
  const slate300 = [203, 213, 225];           // #cbd5e1
  const slate200 = [226, 232, 240];           // #e2e8f0
  const slate100 = [241, 245, 249];           // #f1f5f9
  const slate50 = [248, 250, 252];            // #f8fafc

  const amberDark = [180, 83, 9];             // #b45309
  const amberBg = [254, 243, 199];            // #fef3c7
  const amberBorder = [253, 230, 138];        // #fde68a

  const blueDark = [29, 78, 216];             // #1d4ed8
  const blueBg = [239, 246, 255];             // #eff6ff
  const blueBorder = [191, 219, 254];         // #bfdbfe

  const chalkboardGreen = [24, 74, 53];       // Verde lousa escolar
  const woodBorder = [160, 110, 60];          // Madeira da moldura

  // =========================================================================
  // FUNÇÕES AUXILIARES DE DESENHO VETORIAL (SEM CARACTERES SOBREPOSTOS)
  // =========================================================================

  const drawPageHeader = (pageNumber: number, title: string, subtitle: string) => {
    // Faixa superior decorativa
    doc.setFillColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
    doc.rect(0, 0, pageWidth, 4, 'F');

    // Identificação institucional
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.text('ESPELHO DE CLASSE  |  GUIA OFICIAL ILUSTRADO', marginX, 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slate500[0], slate500[1], slate500[2]);
    doc.text('MANUAL PASSO A PASSO PARA PROFESSORES E GESTORES', pageWidth - marginX, 11.5, { align: 'right' });

    // Divisória sutil
    doc.setDrawColor(slate200[0], slate200[1], slate200[2]);
    doc.setLineWidth(0.3);
    doc.line(marginX, 14, pageWidth - marginX, 14);

    // Título da página
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13.5);
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.text(cleanText(title), marginX, 21.5);

    // Subtítulo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(slate600[0], slate600[1], slate600[2]);
    doc.text(cleanText(subtitle), marginX, 26);

    // Acento visual sob título
    doc.setDrawColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
    doc.setLineWidth(0.8);
    doc.line(marginX, 28.5, marginX + 38, 28.5);
  };

  const drawPageFooter = (pageNumber: number) => {
    const footerY = pageHeight - 9;
    doc.setDrawColor(slate200[0], slate200[1], slate200[2]);
    doc.setLineWidth(0.3);
    doc.line(marginX, footerY - 2.5, pageWidth - marginX, footerY - 2.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slate500[0], slate500[1], slate500[2]);
    doc.text('Espelho de Classe - Sistema Inteligente de Mapeamento Pedagógico e Gestão de Carteiras', marginX, footerY + 1.5);

    doc.setFont('helvetica', 'bold');
    doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - marginX, footerY + 1.5, { align: 'right' });
  };

  const drawCard = (x: number, y: number, w: number, h: number, fill = slate50, border = slate200) => {
    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.setDrawColor(border[0], border[1], border[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 2, 2, 'FD');
  };

  const drawBadge = (x: number, y: number, text: string, type: 'green' | 'amber' | 'blue' | 'slate'): number => {
    let fill = slate100;
    let border = slate300;
    let textCol = slate700;

    if (type === 'green') {
      fill = emeraldBg;
      border = emeraldBorder;
      textCol = emeraldDark;
    } else if (type === 'amber') {
      fill = amberBg;
      border = amberBorder;
      textCol = amberDark;
    } else if (type === 'blue') {
      fill = blueBg;
      border = blueBorder;
      textCol = blueDark;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    const tw = doc.getTextWidth(text);
    const bw = tw + 4;
    const bh = 4.2;

    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.setDrawColor(border[0], border[1], border[2]);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, bw, bh, 1, 1, 'FD');

    doc.setTextColor(textCol[0], textCol[1], textCol[2]);
    doc.text(text, x + 2, y + 3);

    return bw;
  };

  // Helper para desenhar número do passo circular
  const drawStepBadge = (x: number, y: number, stepNumber: string) => {
    doc.setFillColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
    doc.circle(x + 3.5, y + 3.5, 3.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(stepNumber, x + 3.5, y + 4.7, { align: 'center' });
  };

  // Helper para desenhar item estruturado (evita QUALQUER sobreposição de texto)
  const drawStepItem = (
    x: number,
    y: number,
    w: number,
    num: string,
    title: string,
    desc: string
  ): number => {
    drawStepBadge(x, y, num);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.text(cleanText(title), x + 9, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(slate600[0], slate600[1], slate600[2]);
    const maxTextW = w - 10;
    const lines = doc.splitTextToSize(cleanText(desc), maxTextW);
    doc.text(lines, x + 9, y + 8.5);

    return y + 8.5 + (lines.length * 3.6) + 1.5;
  };

  // Desenhar Lousa/Quadro Escolar
  const drawMiniChalkboard = (x: number, y: number, w: number, h: number, text = 'QUADRO / LOUSA') => {
    // Moldura de madeira
    doc.setFillColor(woodBorder[0], woodBorder[1], woodBorder[2]);
    doc.roundedRect(x, y, w, h, 1.5, 1.5, 'F');

    // Fundo verde da lousa
    doc.setFillColor(chalkboardGreen[0], chalkboardGreen[1], chalkboardGreen[2]);
    doc.roundedRect(x + 1, y + 1, w - 2, h - 2, 1, 1, 'F');

    // Texto de giz
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(text, x + (w / 2), y + (h / 2) + 1, { align: 'center' });
  };

  // Desenhar Carteira Escolar Vetorial
  const drawDeskGraphic = (
    x: number,
    y: number,
    w: number,
    h: number,
    studentName: string,
    seatNum: string,
    status: 'normal' | 'inclusao' | 'bloqueada' | 'vazia'
  ) => {
    let fill = [255, 255, 255];
    let border = slate300;
    let textColor = slate800;

    if (status === 'inclusao') {
      fill = [238, 242, 255]; // lilás/azul claro
      border = [165, 180, 252];
      textColor = [67, 56, 202];
    } else if (status === 'bloqueada') {
      fill = amberBg;
      border = amberBorder;
      textColor = amberDark;
    } else if (status === 'vazia') {
      fill = slate100;
      border = slate200;
      textColor = slate500;
    }

    // Tampo da carteira
    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.setDrawColor(border[0], border[1], border[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');

    // Encosto da cadeira sutil atrás
    doc.setFillColor(border[0], border[1], border[2]);
    doc.roundedRect(x + (w * 0.2), y + h, w * 0.6, 1.5, 0.5, 0.5, 'F');

    // Conteúdo da carteira
    if (status === 'vazia') {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(slate500[0], slate500[1], slate500[2]);
      doc.text('(Livre)', x + (w / 2), y + (h / 2) + 1, { align: 'center' });
    } else {
      // Número da carteira
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(seatNum, x + 2, y + 3.8);

      // Nome do estudante truncado seguro
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      const safeName = studentName.length > 11 ? studentName.substring(0, 10) + '.' : studentName;
      doc.text(cleanText(safeName), x + 2, y + 8);
    }
  };

  // =========================================================================
  // PÁGINA 1: CAPA INSTITUCIONAL & VISÃO GERAL VISUAL DO SISTEMA
  // =========================================================================
  {
    // Faixa verde de topo
    doc.setFillColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
    doc.rect(0, 0, pageWidth, 5, 'F');

    // Banner da Capa
    doc.setFillColor(slate50[0], slate50[1], slate50[2]);
    doc.setDrawColor(slate200[0], slate200[1], slate200[2]);
    doc.roundedRect(marginX, 12, contentWidth, 34, 3, 3, 'FD');

    // Barra lateral de destaque
    doc.setFillColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
    doc.roundedRect(marginX, 12, 4, 34, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.text('GUIA OPERACIONAL ILUSTRADO', marginX + 8, 19.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16.5);
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.text('ESPELHO DE CLASSE INTELIGENTE', marginX + 8, 26.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(slate600[0], slate600[1], slate600[2]);
    doc.text('Manual Passo a Passo para Gestores Escolares, Coordenadores e Professores', marginX + 8, 32.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.text('[1] Turmas & Layout  |  [2] Inclusão & Alunos  |  [3] Gerador Inteligente  |  [4] Visão do Professor (PDF)', marginX + 8, 40);

    // ================= ESQUEMA VISUAL 1: FLUXO EM 4 ETAPAS =================
    let currentY = 51;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.text('FLUXO RÁPIDO: DO CADASTRO À IMPRESSÃO EM 4 ETAPAS', marginX, currentY);

    currentY += 4;
    const boxW = (contentWidth - 9) / 4; // 43.25mm cada
    const boxH = 26;

    const steps = [
      { num: '1', title: 'CRIAR TURMA', desc: 'Defina nome, série e turno na barra de seleção.', color: emeraldBg, border: emeraldBorder, textCol: emeraldDark },
      { num: '2', title: 'LAYOUT FÍSICO', desc: 'Ajuste linhas, colunas e corredores reais da sala.', color: blueBg, border: blueBorder, textCol: blueDark },
      { num: '3', title: 'ALUNOS & REGRAS', desc: 'Importe a planilha e marque baixa visão ou foco.', color: amberBg, border: amberBorder, textCol: amberDark },
      { num: '4', title: 'GERAR & IMPRIMIR', desc: 'Otimize em 1 clique e baixe o PDF oficial.', color: emeraldBg, border: emeraldBorder, textCol: emeraldDark },
    ];

    steps.forEach((st, idx) => {
      const bx = marginX + (idx * (boxW + 3));
      doc.setFillColor(st.color[0], st.color[1], st.color[2]);
      doc.setDrawColor(st.border[0], st.border[1], st.border[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(bx, currentY, boxW, boxH, 2, 2, 'FD');

      // Número do passo
      doc.setFillColor(st.textCol[0], st.textCol[1], st.textCol[2]);
      doc.circle(bx + 5, currentY + 5.5, 3.2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text(st.num, bx + 5, currentY + 6.6, { align: 'center' });

      // Título
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(st.textCol[0], st.textCol[1], st.textCol[2]);
      doc.text(st.title, bx + 10.5, currentY + 6.5);

      // Descrição
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(slate700[0], slate700[1], slate700[2]);
      const descLines = doc.splitTextToSize(st.desc, boxW - 6);
      doc.text(descLines, bx + 3.5, currentY + 12.5);

      // Seta indicativa para o próximo (exceto o último)
      if (idx < 3) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(slate500[0], slate500[1], slate500[2]);
        doc.text('>', bx + boxW + 0.8, currentY + (boxH / 2) + 1);
      }
    });

    currentY += boxH + 8;

    // ================= ESQUEMA VISUAL 2: MAPA DA INTERFACE PRINCIPAL =================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.text('PASSO 1: ACESSO E CONHECENDO A BARRA PRINCIPAL', marginX, currentY);

    currentY += 4.5;
    // Moldura representando a barra superior do sistema
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(slate300[0], slate300[1], slate300[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(marginX, currentY, contentWidth, 23, 2, 2, 'FD');

    // Simulação da Navbar
    doc.setFillColor(slate900[0], slate900[1], slate900[2]);
    doc.roundedRect(marginX, currentY, contentWidth, 8, 2, 2, 'F');
    // Corrigir cantos inferiores retos da barra preta
    doc.rect(marginX, currentY + 5, contentWidth, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('ESPELHO DE CLASSE', marginX + 4, currentY + 5.5);

    // Seletor simulado de turma
    doc.setFillColor(slate800[0], slate800[1], slate800[2]);
    doc.roundedRect(marginX + 45, currentY + 1.5, 36, 5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(emeraldBorder[0], emeraldBorder[1], emeraldBorder[2]);
    doc.text('Turma: [ 9º Ano A ] v', marginX + 47, currentY + 4.8);

    // 3 Abas simuladas
    const tabsX = marginX + 86;
    doc.setFillColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.roundedRect(tabsX, currentY + 1.5, 26, 5, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6.5);
    doc.text('1. Mapa da Sala', tabsX + 2, currentY + 4.8);

    doc.setFillColor(slate800[0], slate800[1], slate800[2]);
    doc.roundedRect(tabsX + 28, currentY + 1.5, 25, 5, 1, 1, 'F');
    doc.setTextColor(slate300[0], slate300[1], slate300[2]);
    doc.text('2. Base Alunos', tabsX + 30, currentY + 4.8);

    doc.roundedRect(tabsX + 55, currentY + 1.5, 27, 5, 1, 1, 'F');
    doc.text('3. Impressão / PDF', tabsX + 57, currentY + 4.8);

    // Explicativo das regiões abaixo da navbar simulada
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slate600[0], slate600[1], slate600[2]);
    doc.text('^ Selecione a turma ativa aqui', marginX + 45, currentY + 13.5);
    doc.text('^ Alterne facilmente entre o Mapa de Carteiras, Alunos e PDF', tabsX, currentY + 13.5);

    currentY += 29;

    // Detalhes instrucionais em cartão
    drawCard(marginX, currentY, contentWidth, 76, slate50, slate200);

    let itemY = currentY + 4;
    itemY = drawStepItem(
      marginX + 3,
      itemY,
      contentWidth - 6,
      'A',
      'Como Fazer o Login Seguro',
      'Acesse a plataforma pelo navegador em qualquer computador ou tablet da escola. Digite seu e-mail institucional e a senha cadastrada pela coordenação. Cada escola possui dados isolados e seguros.'
    );

    itemY = drawStepItem(
      marginX + 3,
      itemY,
      contentWidth - 6,
      'B',
      'Alternando entre Turmas e Turnos',
      'Basta clicar no seletor de turmas no topo da tela para trocar instantaneamente entre as salas que você leciona. O mapa de carteiras e a lista de chamada são carregados na hora.'
    );

    itemY = drawStepItem(
      marginX + 3,
      itemY,
      contentWidth - 6,
      'C',
      'As 3 Abas de Trabalho',
      'Navegue entre [Mapa da Sala] (onde você visualiza, arrasta e gera carteiras), [Base de Alunos] (cadastro de perfis e importação de planilhas) e [Impressão / PDF] (geração do documento oficial em papel).'
    );

    itemY = drawStepItem(
      marginX + 3,
      itemY,
      contentWidth - 6,
      'D',
      'Sincronização Instantânea na Nuvem',
      'Todas as alterações nas carteiras, trocas manuais, regras pedagógicas e cadastros são salvos automaticamente na nuvem em tempo real, garantindo total segurança e acesso imediato para a equipe escolar.'
    );

    drawPageFooter(1);
  }

  // =========================================================================
  // PÁGINA 2: LAYOUT DA SALA & ESQUEMA VISUAL DE CORREDORES
  // =========================================================================
  doc.addPage();
  {
    drawPageHeader(
      2,
      'PASSO 2: Layout Físico da Sala e Configuração de Corredores',
      'Replique com fidelidade o tamanho da sala, colunas de carteiras e corredores de passagem.'
    );

    let currentY = 32;

    // ================= ESQUEMA VISUAL: PLANTA BAIXA DA SALA =================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.text('DEMONSTRAÇÃO VISUAL: COMO O SISTEMA ESPELHA A SUA SALA REAL', marginX, currentY);

    currentY += 4;
    const roomW = contentWidth;
    const roomH = 78;

    // Moldura da sala de aula (Paredes)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(slate300[0], slate300[1], slate300[2]);
    doc.setLineWidth(0.6);
    doc.roundedRect(marginX, currentY, roomW, roomH, 2.5, 2.5, 'FD');

    // Topo da Sala: Quadro / Lousa
    const boardW = 88;
    const boardH = 8;
    const boardX = marginX + (roomW / 2) - (boardW / 2);
    drawMiniChalkboard(boardX, currentY + 3, boardW, boardH, 'QUADRO / LOUSA DA SALA DE AULA');

    // Mesa do Professor ao lado da lousa
    const deskTeacherX = marginX + roomW - 36;
    doc.setFillColor(woodBorder[0], woodBorder[1], woodBorder[2]);
    doc.roundedRect(deskTeacherX, currentY + 3, 28, boardH, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Mesa do Professor', deskTeacherX + 14, currentY + 8, { align: 'center' });

    // Carteiras organizadas em 2 Blocos com um CORREDOR no meio
    const startDesksY = currentY + 16;
    const dW = 24;
    const dH = 11;
    const gapX = 4;
    const gapY = 5;

    // Bloco Esquerdo (Colunas 1 e 2)
    const block1X = marginX + 10;
    // Fileira 1 (Frente)
    drawDeskGraphic(block1X, startDesksY, dW, dH, 'Lucas (Baixa Visão)', '1', 'inclusao');
    drawDeskGraphic(block1X + dW + gapX, startDesksY, dW, dH, 'Beatriz Lima', '2', 'normal');
    // Fileira 2 (Meio)
    drawDeskGraphic(block1X, startDesksY + dH + gapY, dW, dH, 'Carlos Silva', '5', 'normal');
    drawDeskGraphic(block1X + dW + gapX, startDesksY + dH + gapY, dW, dH, 'Fernanda Costa', '6', 'normal');
    // Fileira 3 (Fundo)
    drawDeskGraphic(block1X, startDesksY + ((dH + gapY) * 2), dW, dH, 'Gabriel Alves', '9', 'normal');
    drawDeskGraphic(block1X + dW + gapX, startDesksY + ((dH + gapY) * 2), dW, dH, 'Helena Souza', '10', 'bloqueada');

    // Faixa Central: CORREDOR DE PASSAGEM
    const hallwayX = block1X + (dW * 2) + gapX + 6;
    const hallwayW = 20;
    const hallwayH = ((dH + gapY) * 3) + 2;
    doc.setFillColor(slate100[0], slate100[1], slate100[2]);
    doc.setDrawColor(slate200[0], slate200[1], slate200[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(hallwayX, startDesksY - 2, hallwayW, hallwayH, 1, 1, 'FD');

    // Linha tracejada e texto vertical no corredor
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(slate500[0], slate500[1], slate500[2]);
    doc.text('CORREDOR', hallwayX + (hallwayW / 2), startDesksY + 16, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.text('(Livre)', hallwayX + (hallwayW / 2), startDesksY + 21, { align: 'center' });

    // Bloco Direito (Colunas 3 e 4)
    const block2X = hallwayX + hallwayW + 6;
    // Fileira 1 (Frente)
    drawDeskGraphic(block2X, startDesksY, dW, dH, 'Mariana Rios', '3', 'normal');
    drawDeskGraphic(block2X + dW + gapX, startDesksY, dW, dH, 'Pedro Santos', '4', 'normal');
    // Fileira 2 (Meio)
    drawDeskGraphic(block2X, startDesksY + dH + gapY, dW, dH, 'Thiago Rocha', '7', 'normal');
    drawDeskGraphic(block2X + dW + gapX, startDesksY + dH + gapY, dW, dH, 'Larissa Mendes', '8', 'normal');
    // Fileira 3 (Fundo)
    drawDeskGraphic(block2X, startDesksY + ((dH + gapY) * 2), dW, dH, 'Vitor Hugo', '11', 'normal');
    drawDeskGraphic(block2X + dW + gapX, startDesksY + ((dH + gapY) * 2), dW, dH, '', '', 'vazia');

    // Legenda do Esquema Visual no Rodapé da sala
    const legY = currentY + roomH - 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(slate700[0], slate700[1], slate700[2]);
    doc.text('Legenda do Mapa:', marginX + 6, legY + 2);

    let legX = marginX + 32;
    legX += drawBadge(legX, legY, 'Comum', 'slate') + 3;
    legX += drawBadge(legX, legY, 'Inclusão (Frente)', 'blue') + 3;
    legX += drawBadge(legX, legY, 'Fixado (Cadeado)', 'amber') + 3;
    legX += drawBadge(legX, legY, 'Carteira Livre', 'slate') + 3;

    currentY += roomH + 7;

    // ================= INSTRUÇÕES PASSO A PASSO =================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.text('COMO CONFIGURAR O LAYOUT NA PRÁTICA', marginX, currentY);

    currentY += 4;
    drawCard(marginX, currentY, contentWidth, 76, slate50, slate200);

    let stepY = currentY + 4;
    stepY = drawStepItem(
      marginX + 3,
      stepY,
      contentWidth - 6,
      '1',
      'Botão "Layout da Sala" (Ícone de Planta Baixa)',
      'Na barra superior do Mapa Interativo, clique no botão "Layout da Sala". Uma janela com a configuração física da turma se abrirá instantaneamente.'
    );

    stepY = drawStepItem(
      marginX + 3,
      stepY,
      contentWidth - 6,
      '2',
      'Defina o Número de Fileiras (Linhas) e Colunas',
      'Indique quantas fileiras existem da frente até o fundo da sala (ex: 5 a 8 linhas) e quantas carteiras existem por fileira (ex: 5 a 8 colunas). O sistema calcula a capacidade total na hora.'
    );

    stepY = drawStepItem(
      marginX + 3,
      stepY,
      contentWidth - 6,
      '3',
      'Como Ativar os Corredores de Passagem',
      'Desmarque as carteiras que não existem na sala, deixando como corredores livres: no editor de layout, basta clicar diretamente sobre as carteiras que correspondem a corredores ou cantos vazios para desativá-las. Elas ficam invisíveis no mapa e na impressão, replicando fielmente a circulação real da sua sala.'
    );

    stepY = drawStepItem(
      marginX + 3,
      stepY,
      contentWidth - 6,
      '4',
      'Múltiplos Planos de Espelho (Bimestres e Provas)',
      'Uma mesma turma pode ter vários planos! Utilize a barra de planos para alternar entre "Padrão 1º Bimestre", "Dia de Prova" ou "Trabalho em Duplas", sem perder a configuração anterior.'
    );

    drawPageFooter(2);
  }

  // =========================================================================
  // PÁGINA 3: BASE DE ALUNOS, CRITÉRIOS DE INCLUSÃO & PLANILHA
  // =========================================================================
  doc.addPage();
  {
    drawPageHeader(
      3,
      'PASSO 3: Alunos, Critérios Pedagógicos e Importação',
      'Cadastre alunos, configure regras de inclusão e importe planilhas de forma rápida e segura.'
    );

    let currentY = 31;

    // ================= ESQUEMA VISUAL: FICHA PEDAGÓGICA DO ALUNO =================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.text('CRITÉRIOS PEDAGÓGICOS: COMO O ALGORITMO DECIDE OS ASSENTOS', marginX, currentY);

    currentY += 4;
    const cardW = (contentWidth - 6) / 2; // 88mm cada
    const cardH = 37;

    // Cartão 1: Aluno com Inclusão (Frente Prioritária)
    drawCard(marginX, currentY, cardW, cardH, blueBg, blueBorder);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(blueDark[0], blueDark[1], blueDark[2]);
    doc.text('EXEMPLO A: ALUNO COM INCLUSÃO', marginX + 4, currentY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.text('Lucas Mendes  |  Número: 05', marginX + 4, currentY + 11);

    drawBadge(marginX + 4, currentY + 14, 'Baixa Visão', 'blue');
    drawBadge(marginX + 28, currentY + 14, 'Focado', 'green');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(slate700[0], slate700[1], slate700[2]);
    const linesA = doc.splitTextToSize('Ação do Algoritmo: Garante automaticamente assento na 1ª ou 2ª fileira central em frente à lousa para facilitar a leitura.', cardW - 8);
    doc.text(linesA, marginX + 4, currentY + 22.5);

    // Cartão 2: Alunos Conversadores (Separação Estratégica)
    const card2X = marginX + cardW + 6;
    drawCard(card2X, currentY, cardW, cardH, amberBg, amberBorder);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(amberDark[0], amberDark[1], amberDark[2]);
    doc.text('EXEMPLO B: SEPARAÇÃO DE DISPERSORES', card2X + 4, currentY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.text('Gabriel e Felipe  |  Perfil: Dispersores', card2X + 4, currentY + 11);

    drawBadge(card2X + 4, currentY + 14, 'Conversador', 'amber');
    drawBadge(card2X + 31, currentY + 14, 'Regra: Separar_De', 'amber');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(slate700[0], slate700[1], slate700[2]);
    const linesB = doc.splitTextToSize('Ação do Algoritmo: Aplica penalidade severa caso fiquem adjacentes, posicionando-os em blocos separados da sala.', cardW - 8);
    doc.text(linesB, card2X + 4, currentY + 22.5);

    currentY += cardH + 6;

    // ================= ESQUEMA VISUAL: PLANILHA DO PROFESSOR =================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.text('A PLANILHA OFICIAL DO PROFESSOR REGENTE (.XLSX COM MENUS SUSPENSOS)', marginX, currentY);

    currentY += 4;

    // Card explicativo dos recursos da planilha do professor
    const spreadInfoH = 22;
    drawCard(marginX, currentY, contentWidth, spreadInfoH, emeraldBg, emeraldBorder);
    
    // Coluna 1 do card
    const colHalfW = (contentWidth - 10) / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.text('1. Como Baixar e Opções de Preenchimento:', marginX + 4, currentY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(slate800[0], slate800[1], slate800[2]);
    const spreadDesc1 = 'Baixe no botão "Planilha do Professor". Você pode escolher: [Modelo em Branco] para novas turmas ou [Pré-preencher com Alunos Atuais] (já exporta nomes e números da classe prontos para preenchimento).';
    doc.text(doc.splitTextToSize(spreadDesc1, colHalfW), marginX + 4, currentY + 10.5);

    // Coluna 2 do card
    const col2X = marginX + colHalfW + 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.text('2. Menus Suspensos e Integração Automática:', col2X, currentY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(slate800[0], slate800[1], slate800[2]);
    const spreadDesc2 = 'O arquivo em Excel (.xlsx) possui listas suspensas padronizadas (Baixa Visão, TDAH, Cadeirante, Focado, Conversador e Nível de Separação -3 a -1). Ao salvar e importar, o sistema organiza o mapa na hora!';
    doc.text(doc.splitTextToSize(spreadDesc2, colHalfW), col2X, currentY + 10.5);

    currentY += spreadInfoH + 5;

    // Tabela estilo Excel ilustrada
    const tableW = contentWidth;
    const tableH = 32;
    drawCard(marginX, currentY, tableW, tableH, [255, 255, 255], slate300);

    // Cabeçalho verde da tabela
    doc.setFillColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.roundedRect(marginX, currentY, tableW, 6.5, 1.5, 1.5, 'F');
    doc.rect(marginX, currentY + 4, tableW, 2.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(255, 255, 255);

    const cols = [
      { name: 'Nome do Aluno', w: 42 },
      { name: 'Nº', w: 12 },
      { name: 'Gênero', w: 16 },
      { name: 'Necessidades (Menu)', w: 36 },
      { name: 'Comportamento (Menu)', w: 36 },
      { name: 'Nível Separação (Menu)', w: 40 },
    ];

    let cx = marginX + 3;
    cols.forEach(c => {
      doc.text(c.name, cx, currentY + 4.5);
      cx += c.w;
    });

    // Linha 1 da Tabela
    let rowY = currentY + 11;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(slate800[0], slate800[1], slate800[2]);
    cx = marginX + 3;
    doc.text('Ana Beatriz Silva', cx, rowY); cx += cols[0].w;
    doc.text('01', cx, rowY); cx += cols[1].w;
    doc.text('F', cx, rowY); cx += cols[2].w;
    doc.text('[ Baixa Visão v ]', cx, rowY); cx += cols[3].w;
    doc.text('[ Focada / Calma v ]', cx, rowY); cx += cols[4].w;
    doc.text('[ Nenhuma v ]', cx, rowY);

    // Linha divisória
    doc.setDrawColor(slate200[0], slate200[1], slate200[2]);
    doc.line(marginX, rowY + 3.2, marginX + tableW, rowY + 3.2);

    // Linha 2 da Tabela (Zebra)
    rowY += 7.2;
    doc.setFillColor(slate50[0], slate50[1], slate50[2]);
    doc.rect(marginX + 0.5, rowY - 4, tableW - 1, 6.5, 'F');
    cx = marginX + 3;
    doc.setTextColor(slate800[0], slate800[1], slate800[2]);
    doc.text('Carlos Eduardo Rocha', cx, rowY); cx += cols[0].w;
    doc.text('02', cx, rowY); cx += cols[1].w;
    doc.text('M', cx, rowY); cx += cols[2].w;
    doc.text('[ Nenhuma v ]', cx, rowY); cx += cols[3].w;
    doc.text('[ Conversador v ]', cx, rowY); cx += cols[4].w;
    doc.text('[ (-3) Separação v ]', cx, rowY);

    // Linha de dica sob a tabela
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.text('* Baixe a planilha pelo botão "Planilha do Professor" na aba "Base de Alunos" ou na barra superior.', marginX + 3, currentY + tableH - 2);

    currentY += tableH + 6;

    // ================= COMPARATIVO: INCLUIR VS SUBSTITUIR =================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.text('MUITO IMPORTANTE: QUAL MODO DE IMPORTAÇÃO ESCOLHER?', marginX, currentY);

    currentY += 4;
    const modeW = (contentWidth - 6) / 2;
    const modeH = 33;

    // Modo 1: Incluir
    drawCard(marginX, currentY, modeW, modeH, emeraldBg, emeraldBorder);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.text('MODO 1: INCLUIR NA TURMA (Recomendado)', marginX + 4, currentY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(slate800[0], slate800[1], slate800[2]);
    const incText = 'Mantém os alunos que já estão na turma e adiciona somente os novos que vierem na planilha. Ideal para alunos transferidos no meio do ano ou atualizações incrementais.';
    doc.text(doc.splitTextToSize(incText, modeW - 8), marginX + 4, currentY + 10.5);

    // Modo 2: Substituir
    drawCard(marginX + modeW + 6, currentY, modeW, modeH, amberBg, amberBorder);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(amberDark[0], amberDark[1], amberDark[2]);
    doc.text('MODO 2: SUBSTITUIR ANTIGOS', marginX + modeW + 10, currentY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(slate800[0], slate800[1], slate800[2]);
    const subText = 'Apaga a lista anterior da turma e cadastra exclusivamente a nova relação importada. Use na virada de ano letivo ou reformulação total da classe pelo professor.';
    doc.text(doc.splitTextToSize(subText, modeW - 8), marginX + modeW + 10, currentY + 10.5);

    drawPageFooter(3);
  }

  // =========================================================================
  // PÁGINA 4: GERAÇÃO INTELIGENTE, CADEADOS & RESOLUÇÃO DE CONFLITOS
  // =========================================================================
  doc.addPage();
  {
    drawPageHeader(
      4,
      'PASSO 4: Otimização Algorítmica, Ajustes e Conflitos',
      'Entenda como o algoritmo distribui as carteiras, como travar alunos e corrigir conflitos.'
    );

    let currentY = 32;

    // ================= ESQUEMA VISUAL: INTERAÇÃO COM AS CARTEIRAS =================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.text('COMO INTERAGIR COM AS CARTEIRAS NO MAPA (3 RECURSOS-CHAVE)', marginX, currentY);

    currentY += 4;
    const featW = (contentWidth - 8) / 3; // ~58mm cada
    const featH = 48;

    // Recurso 1: Cadeado (Fixar Aluno)
    drawCard(marginX, currentY, featW, featH, amberBg, amberBorder);
    doc.setFillColor(amberDark[0], amberDark[1], amberDark[2]);
    doc.circle(marginX + 8, currentY + 8, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('1', marginX + 8, currentY + 9.5, { align: 'center' });

    doc.setTextColor(amberDark[0], amberDark[1], amberDark[2]);
    doc.text('CADEADO (TRAVAR)', marginX + 15, currentY + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slate800[0], slate800[1], slate800[2]);
    const lockDesc = 'Clique no ícone de cadeado sobre a carteira. Alunos travados NÃO são movidos pelo algoritmo ao gerar novo espelho, garantindo assentos fixos.';
    doc.text(doc.splitTextToSize(lockDesc, featW - 8), marginX + 4, currentY + 16);

    // Recurso 2: Troca Manual Direta
    const feat2X = marginX + featW + 4;
    drawCard(feat2X, currentY, featW, featH, blueBg, blueBorder);
    doc.setFillColor(blueDark[0], blueDark[1], blueDark[2]);
    doc.circle(feat2X + 8, currentY + 8, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('2', marginX + featW + 12, currentY + 9.5, { align: 'center' });

    doc.setTextColor(blueDark[0], blueDark[1], blueDark[2]);
    doc.text('TROCA MANUAL', feat2X + 15, currentY + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slate800[0], slate800[1], slate800[2]);
    const swapDesc = 'Para permutar dois estudantes, clique no Aluno A e depois no Aluno B. Eles trocam de assento instantaneamente. Também funciona arrastando.';
    doc.text(doc.splitTextToSize(swapDesc, featW - 8), feat2X + 4, currentY + 16);

    // Recurso 3: Alertas e Sugestões
    const feat3X = feat2X + featW + 4;
    drawCard(feat3X, currentY, featW, featH, emeraldBg, emeraldBorder);
    doc.setFillColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.circle(feat3X + 8, currentY + 8, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('3', feat3X + 8, currentY + 9.5, { align: 'center' });

    doc.setTextColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.text('SUGESTÃO RÁPIDA', feat3X + 15, currentY + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slate800[0], slate800[1], slate800[2]);
    const sugDesc = 'Carteiras com conflito mostram alerta. Ao clicar, o mapa destaca em verde a melhor troca sugerida com o ganho estimado (+15% harmonia).';
    doc.text(doc.splitTextToSize(sugDesc, featW - 8), feat3X + 4, currentY + 16);

    currentY += featH + 7;

    // ================= OS 4 MODOS DO ALGORITMO =================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.text('OS 4 MODOS DE GERAÇÃO AUTOMÁTICA', marginX, currentY);

    currentY += 4;
    const modeBoxW = (contentWidth - 6) / 2;
    const modeBoxH = 33;

    // Modo 1: Harmônico
    drawCard(marginX, currentY, modeBoxW, modeBoxH, slate50, slate200);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.text('A) HARMÔNICO & EQUILIBRADO (Padrão)', marginX + 4, currentY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slate700[0], slate700[1], slate700[2]);
    doc.text(doc.splitTextToSize('Recomendado para o dia a dia. Equilibra a sala dispersando conversadores, atendendo necessidades de inclusão e respeitando afinidades com harmonia máxima.', modeBoxW - 8), marginX + 4, currentY + 10.5);

    // Modo 2: Duplas
    drawCard(marginX + modeBoxW + 6, currentY, modeBoxW, modeBoxH, slate50, slate200);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(blueDark[0], blueDark[1], blueDark[2]);
    doc.text('B) DUPLAS PRODUTIVAS (Cooperação)', marginX + modeBoxW + 10, currentY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slate700[0], slate700[1], slate700[2]);
    doc.text(doc.splitTextToSize('Prioriza aproximar colegas com afinidades positivas para trabalhos em grupo, duplas de monitoria e exercícios cooperativos.', modeBoxW - 8), marginX + modeBoxW + 10, currentY + 10.5);

    currentY += modeBoxH + 4;

    // Modo 3: Inclusão
    drawCard(marginX, currentY, modeBoxW, modeBoxH, slate50, slate200);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.text('C) FOCO EM INCLUSÃO (Frente)', marginX + 4, currentY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slate700[0], slate700[1], slate700[2]);
    doc.text(doc.splitTextToSize('Garante prioridade absoluta para que qualquer estudante com baixa visão, déficit auditivo ou TDAH ocupe a 1ª fileira central da classe.', modeBoxW - 8), marginX + 4, currentY + 10.5);

    // Modo 4: Provas
    drawCard(marginX + modeBoxW + 6, currentY, modeBoxW, modeBoxH, slate50, slate200);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(amberDark[0], amberDark[1], amberDark[2]);
    doc.text('D) DIA DE PROVA / AVALIAÇÕES', marginX + modeBoxW + 10, currentY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slate700[0], slate700[1], slate700[2]);
    doc.text(doc.splitTextToSize('Maximiza o distanciamento entre estudantes com alta afinidade e dispersa a turma para assegurar silêncio absoluto e idoneidade.', modeBoxW - 8), marginX + modeBoxW + 10, currentY + 10.5);

    currentY += modeBoxH + 6;

    // Painel de Auto-Resolução em 1 Clique e Sugestões Isoladas
    const resBoxH = 24;
    drawCard(marginX, currentY, contentWidth, resBoxH, emeraldBg, emeraldBorder);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.text('DICA DE OURO: BOTÃO "RESOLVER TODOS AUTOMATICAMENTE" & SUGESTÕES ISOLADAS', marginX + 4, currentY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(slate800[0], slate800[1], slate800[2]);
    const resText = 'Sempre que restarem conflitos no mapa (ex: conversadores próximos ou alunos fora da frente), utilize o botão verde "Resolver Todos Automaticamente" disponível no aviso superior do mapa e na janela de diagnóstico para zerar os problemas em 1 clique. Se preferir análise manual, mantenha e aplique as sugestões isoladas de cada conflito.';
    doc.text(doc.splitTextToSize(resText, contentWidth - 8), marginX + 4, currentY + 10.5);

    drawPageFooter(4);
  }

  // =========================================================================
  // PÁGINA 5: VISÃO ALUNO VS VISÃO PROFESSOR & IMPRESSÃO OFICIAL
  // =========================================================================
  doc.addPage();
  {
    drawPageHeader(
      5,
      'PASSO 5: Visão Aluno vs Visão Professor e Impressão PDF',
      'Domine a inversão pedagógica da folha de chamada e as melhores práticas de gestão.'
    );

    let currentY = 32;

    // ================= GRANDE ESQUEMA VISUAL COMPARATIVO =================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.text('COMPARATIVO VISUAL: VISÃO DO ALUNO VS VISTA DO PROFESSOR', marginX, currentY);

    currentY += 4;
    const compW = (contentWidth - 8) / 2; // 87mm cada
    const compH = 82;

    // LADO ESQUERDO: VISÃO ALUNO / SALA (PADRÃO)
    drawCard(marginX, currentY, compW, compH, [255, 255, 255], slate300);

    // Faixa título
    doc.setFillColor(slate800[0], slate800[1], slate800[2]);
    doc.roundedRect(marginX, currentY, compW, 6.5, 1.5, 1.5, 'F');
    doc.rect(marginX, currentY + 4, compW, 2.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('MODO 1: VISÃO ALUNO / SALA', marginX + (compW / 2), currentY + 4.5, { align: 'center' });

    // Lousa no TOPO da folha
    drawMiniChalkboard(marginX + 8, currentY + 10, compW - 16, 6, 'LOUSA NO TOPO DA FOLHA');

    // Carteiras descendo
    const m1Y = currentY + 20;
    drawDeskGraphic(marginX + 8, m1Y, 16, 8, 'Ana', '1', 'normal');
    drawDeskGraphic(marginX + 28, m1Y, 16, 8, 'Bruno', '2', 'normal');
    drawDeskGraphic(marginX + 48, m1Y, 16, 8, 'Carla', '3', 'normal');
    drawDeskGraphic(marginX + 66, m1Y, 14, 8, 'Diego', '4', 'normal');

    drawDeskGraphic(marginX + 8, m1Y + 12, 16, 8, 'Edu', '5', 'normal');
    drawDeskGraphic(marginX + 28, m1Y + 12, 16, 8, 'Fernanda', '6', 'normal');
    drawDeskGraphic(marginX + 48, m1Y + 12, 16, 8, 'Gabriel', '7', 'normal');
    drawDeskGraphic(marginX + 66, m1Y + 12, 14, 8, 'Helena', '8', 'normal');

    // Seta orientativa
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(slate500[0], slate500[1], slate500[2]);
    doc.text('| v Alunos olhando para frente', marginX + 8, m1Y + 26);

    // Texto descritivo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(slate700[0], slate700[1], slate700[2]);
    const m1Desc = 'Perspectiva clássica de quem entra pela porta da sala. Ideal para colar na porta ou mural da sala para os estudantes localizarem seus lugares.';
    doc.text(doc.splitTextToSize(m1Desc, compW - 10), marginX + 5, currentY + 54);

    // LADO DIREITO: VISTA DO PROFESSOR (INVERTIDA PEDAGÓGICA)
    const pX = marginX + compW + 8;
    drawCard(pX, currentY, compW, compH, emeraldBg, emeraldBorder);

    // Faixa título destaque verde
    doc.setFillColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.roundedRect(pX, currentY, compW, 6.5, 1.5, 1.5, 'F');
    doc.rect(pX, currentY + 4, compW, 2.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('MODO 2: VISTA DO PROFESSOR (INVERTIDA)', pX + (compW / 2), currentY + 4.5, { align: 'center' });

    // Carteiras no topo
    const m2Y = currentY + 11;
    drawDeskGraphic(pX + 8, m2Y, 16, 8, 'Edu', '5', 'normal');
    drawDeskGraphic(pX + 28, m2Y, 16, 8, 'Fernanda', '6', 'normal');
    drawDeskGraphic(pX + 48, m2Y, 16, 8, 'Gabriel', '7', 'normal');
    drawDeskGraphic(pX + 66, m2Y, 14, 8, 'Helena', '8', 'normal');

    drawDeskGraphic(pX + 8, m2Y + 12, 16, 8, 'Ana', '1', 'normal');
    drawDeskGraphic(pX + 28, m2Y + 12, 16, 8, 'Bruno', '2', 'normal');
    drawDeskGraphic(pX + 48, m2Y + 12, 16, 8, 'Carla', '3', 'normal');
    drawDeskGraphic(pX + 66, m2Y + 12, 14, 8, 'Diego', '4', 'normal');

    // Lousa e Professor na BASE da folha
    drawMiniChalkboard(pX + 8, currentY + 39, compW - 16, 6, 'LOUSA E PROFESSOR EMBAIXO');

    // Destaque do benefício pedagógico
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.text('BENEFÍCIO PEDAGÓGICO:', pX + 5, currentY + 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(slate800[0], slate800[1], slate800[2]);
    const m2Desc = 'O aluno que senta à sua direita física aparece exatamente à sua direita na folha impressa. Elimina o esforço de espelhamento mental durante a chamada!';
    doc.text(doc.splitTextToSize(m2Desc, compW - 10), pX + 5, currentY + 55);

    currentY += compH + 7;

    // ================= CHECKLIST DE IMPRESSÃO & BACKUP =================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.text('CHECKLIST DE IMPRESSÃO & BOAS PRÁTICAS DE GESTÃO', marginX, currentY);

    currentY += 4;
    drawCard(marginX, currentY, contentWidth, 54, slate50, slate200);

    let checkY = currentY + 4.5;
    checkY = drawStepItem(
      marginX + 3,
      checkY,
      contentWidth - 6,
      'A',
      'Personalização da Folha de Impressão',
      'Ative ou desative nos interruptores: Fotos dos Alunos (para rápido reconhecimento visual), Números de Chamada, Destaques de Inclusão e Resumo Estatístico.'
    );

    checkY = drawStepItem(
      marginX + 3,
      checkY,
      contentWidth - 6,
      'B',
      'Duplicação Bimestral de Planos',
      'Ao iniciar um novo bimestre letivo, duplique o plano antigo em vez de apagar. Isso mantém o histórico de disposição da turma arquivado para consultas pedagógicas.'
    );

    checkY = drawStepItem(
      marginX + 3,
      checkY,
      contentWidth - 6,
      'C',
      'Planilha Oficial do Professor Regente (.xlsx)',
      'Baixe a planilha modelo na aba Base de Alunos (em branco ou pré-preenchida com os alunos matriculados). Os professores preenchem necessidades, comportamento e separações usando menus suspensos no Excel para carregar tudo no sistema de uma só vez.'
    );

    currentY += 58;

    // Caixa de suporte final
    drawCard(marginX, currentY, contentWidth, 18, emeraldBg, emeraldBorder);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.text('SUPORTE INSTITUCIONAL E ATENDIMENTO', marginX + 4, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slate800[0], slate800[1], slate800[2]);
    doc.text('Em caso de dúvidas no cadastro de turmas ou criação de layout, contate a coordenação pedagógica da sua unidade.', marginX + 4, currentY + 10);
    doc.setFont('helvetica', 'bold');
    doc.text('Espelho de Classe - Tecnologia a serviço da aprendizagem e organização escolar.', marginX + 4, currentY + 14.5);

    drawPageFooter(5);
  }

  // Download oficial do documento em PDF
  doc.save('Manual_Espelho_de_Classe_Passo_a_Passo.pdf');
}
