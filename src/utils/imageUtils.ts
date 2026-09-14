/**
 * Utility functions for student photo processing, framing (crop), compression,
 * and bulk filename matching.
 */
import { Student } from '../types';

export interface CropOptions {
  width?: number;
  height?: number;
  verticalOffset?: number; // 0 (top/head) to 1 (bottom/chin). Default: 0.15 (safe head framing)
  zoom?: number; // 1.0 (fit) to 2.5 (zoom in)
  quality?: number; // 0.82
}

/**
 * Normalizes text for matching by removing accents and lowercasing
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Crops and compresses an image into a vertical portrait rectangle (3:4 ratio)
 * with adjustable vertical offset and zoom, preventing head cutoff.
 */
export function cropPortraitImage(
  img: HTMLImageElement,
  options: CropOptions = {}
): string {
  const targetW = options.width || 240;
  const targetH = options.height || 320; // 3:4 aspect ratio
  const verticalOffset = options.verticalOffset !== undefined ? options.verticalOffset : 0.15;
  const zoom = Math.max(1.0, options.zoom || 1.0);
  const quality = options.quality || 0.82;

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return img.src;

  const targetRatio = targetW / targetH; // 0.75
  const imgRatio = img.width / img.height;

  let cropW: number;
  let cropH: number;

  if (imgRatio > targetRatio) {
    // Image is wider than 3:4
    cropH = img.height / zoom;
    cropW = cropH * targetRatio;
  } else {
    // Image is taller than 3:4
    cropW = img.width / zoom;
    cropH = cropW / targetRatio;
  }

  // Ensure crop box doesn't exceed image bounds
  cropW = Math.min(cropW, img.width);
  cropH = Math.min(cropH, img.height);

  // Center horizontally
  const startX = Math.max(0, (img.width - cropW) / 2);

  // Vertical position guided by verticalOffset:
  // verticalOffset = 0.0 -> top of the image (prioritizes head/hair)
  // verticalOffset = 0.5 -> center
  // verticalOffset = 1.0 -> bottom
  const maxStartY = Math.max(0, img.height - cropH);
  const clampedOffset = Math.max(0, Math.min(1, verticalOffset));
  const startY = maxStartY * clampedOffset;

  // Render on white background in case of transparent PNG
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetW, targetH);

  // Enable high quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(img, startX, startY, cropW, cropH, 0, 0, targetW, targetH);
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Loads an image from a URL or base64 string and crops it with custom options
 */
export function processImageFileOrUrl(
  source: File | string,
  options: CropOptions = {}
): Promise<{ dataUrl: string; rawSrc: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    const handleLoadedUrl = (url: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const dataUrl = cropPortraitImage(img, options);
          resolve({ dataUrl, rawSrc: url });
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Falha ao decodificar imagem.'));
      img.src = url;
    };

    if (typeof source === 'string') {
      handleLoadedUrl(source);
    } else {
      reader.onload = (e) => {
        if (e.target?.result) {
          handleLoadedUrl(e.target.result as string);
        } else {
          reject(new Error('Erro ao ler arquivo.'));
        }
      };
      reader.onerror = () => reject(new Error('Falha na leitura do arquivo.'));
      reader.readAsDataURL(source);
    }
  });
}

export interface MatchResult {
  student: Student | null;
  matchType: 'roll_number' | 'exact_name' | 'partial_name' | 'none';
  confidence: number;
}

/**
 * Matches a filename to a student by roll number or name
 * Examples:
 * - "01.jpg" -> Roll 1
 * - "01_Alice_Monteiro.png" -> Roll 1 or Alice Monteiro
 * - "bernardo-silva.jpeg" -> Bernardo Silva
 * - "aluno 5.webp" -> Roll 5
 */
export function matchStudentFromFilename(
  filename: string,
  students: Student[]
): MatchResult {
  // Strip extension
  const baseName = filename.replace(/\.[a-zA-Z0-9]+$/, '').trim();
  const cleanBase = baseName.replace(/[-_]+/g, ' ').trim();
  const normalizedBase = normalizeText(cleanBase);

  // 1. Try to extract roll number directly (e.g., "01", "1", "1 Alice", "Aluno 3", "#12")
  const leadingNumMatch = cleanBase.match(/^(?:aluno|n|nº|#)?\s*0*([1-9]\d*)\b/i);
  if (leadingNumMatch) {
    const num = parseInt(leadingNumMatch[1], 10);
    const byRoll = students.find((s) => s.rollNumber === num);
    if (byRoll) {
      return { student: byRoll, matchType: 'roll_number', confidence: 0.98 };
    }
  }

  // Also check if any standalone number in the filename matches a student's roll number
  const allNumbers = cleanBase.match(/\b\d+\b/g);
  if (allNumbers && allNumbers.length === 1) {
    const num = parseInt(allNumbers[0], 10);
    const byRoll = students.find((s) => s.rollNumber === num);
    if (byRoll) {
      return { student: byRoll, matchType: 'roll_number', confidence: 0.9 };
    }
  }

  // 2. Try exact name match
  for (const s of students) {
    const sNameNorm = normalizeText(s.name);
    if (normalizedBase === sNameNorm) {
      return { student: s, matchType: 'exact_name', confidence: 0.99 };
    }
  }

  // 3. Try partial name match (e.g. filename contains student's full first and last name)
  for (const s of students) {
    const sNameNorm = normalizeText(s.name);
    if (normalizedBase.includes(sNameNorm) || sNameNorm.includes(normalizedBase)) {
      return { student: s, matchType: 'partial_name', confidence: 0.85 };
    }
  }

  // 4. Try first name + nickname
  for (const s of students) {
    const firstName = normalizeText(s.name.split(' ')[0]);
    if (firstName.length >= 3 && normalizedBase === firstName) {
      return { student: s, matchType: 'partial_name', confidence: 0.75 };
    }
    if (s.nickname) {
      const nickNorm = normalizeText(s.nickname);
      if (nickNorm.length >= 3 && normalizedBase === nickNorm) {
        return { student: s, matchType: 'partial_name', confidence: 0.75 };
      }
    }
  }

  return { student: null, matchType: 'none', confidence: 0 };
}
