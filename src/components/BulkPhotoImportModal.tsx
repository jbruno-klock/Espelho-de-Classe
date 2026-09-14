import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  Sliders, 
  User, 
  RotateCcw,
  Sparkles,
  Search,
  Info
} from 'lucide-react';
import { Classroom, Student } from '../types';
import { 
  cropPortraitImage, 
  matchStudentFromFilename, 
  CropOptions 
} from '../utils/imageUtils';

interface BulkPhotoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: Classroom;
  onSaveBulkPhotos: (photoUpdates: Record<string, string>) => void;
}

interface ProcessedFileItem {
  id: string;
  file: File;
  rawSrc: string;
  dataUrl: string;
  filename: string;
  matchedStudentId: string | null;
  matchType: 'roll_number' | 'exact_name' | 'partial_name' | 'none';
  verticalOffset: number; // 0.0 to 1.0
  zoom: number;
}

export const BulkPhotoImportModal: React.FC<BulkPhotoImportModalProps> = ({
  isOpen,
  onClose,
  classroom,
  onSaveBulkPhotos,
}) => {
  const [items, setItems] = useState<ProcessedFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [globalOffset, setGlobalOffset] = useState<number>(0.15); // Default 15% from top to prevent cutting heads
  const [globalZoom, setGlobalZoom] = useState<number>(1.0);
  const [searchFilter, setSearchFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const students = classroom.students;

  // Process incoming files
  const processFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    setIsProcessing(true);

    const newItems: ProcessedFileItem[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const rawSrc = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Match student
        const matchResult = matchStudentFromFilename(file.name, students);

        // Crop with current global offset
        const img = new Image();
        const dataUrl = await new Promise<string>((resolve) => {
          img.onload = () => {
            const cropped = cropPortraitImage(img, {
              width: 240,
              height: 320, // 3:4 portrait
              verticalOffset: globalOffset,
              zoom: globalZoom,
              quality: 0.84,
            });
            resolve(cropped);
          };
          img.onerror = () => resolve(rawSrc);
          img.src = rawSrc;
        });

        newItems.push({
          id: `bulk-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
          file,
          rawSrc,
          dataUrl,
          filename: file.name,
          matchedStudentId: matchResult.student ? matchResult.student.id : null,
          matchType: matchResult.matchType,
          verticalOffset: globalOffset,
          zoom: globalZoom,
        });
      } catch (err) {
        console.warn(`Error processing ${file.name}:`, err);
      }
    }

    setItems(prev => [...prev, ...newItems]);
    setIsProcessing(false);
  };

  // Re-crop individual item
  const updateItemFraming = (id: string, offset: number, zoomLevel: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const img = new Image();
        img.src = item.rawSrc;
        const newCropped = cropPortraitImage(img, {
          width: 240,
          height: 320,
          verticalOffset: offset,
          zoom: zoomLevel,
          quality: 0.84,
        });
        return {
          ...item,
          verticalOffset: offset,
          zoom: zoomLevel,
          dataUrl: newCropped,
        };
      })
    );
  };

  // Apply global framing to all loaded photos
  const handleApplyGlobalFraming = (offset: number, zoomLevel: number) => {
    setGlobalOffset(offset);
    setGlobalZoom(zoomLevel);
    setItems(prev =>
      prev.map(item => {
        const img = new Image();
        img.src = item.rawSrc;
        const newCropped = cropPortraitImage(img, {
          width: 240,
          height: 320,
          verticalOffset: offset,
          zoom: zoomLevel,
          quality: 0.84,
        });
        return {
          ...item,
          verticalOffset: offset,
          zoom: zoomLevel,
          dataUrl: newCropped,
        };
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSelectStudent = (itemId: string, studentId: string | null) => {
    setItems(prev =>
      prev.map(item => (item.id === itemId ? { ...item, matchedStudentId: studentId } : item))
    );
  };

  const handleConfirmImport = () => {
    const updates: Record<string, string> = {};
    items.forEach(item => {
      if (item.matchedStudentId && item.dataUrl) {
        updates[item.matchedStudentId] = item.dataUrl;
      }
    });

    onSaveBulkPhotos(updates);
    onClose();
  };

  const matchedCount = items.filter(it => it.matchedStudentId !== null).length;
  const unassignedCount = items.filter(it => it.matchedStudentId === null).length;

  // Filter items if searching
  const filteredItems = items.filter(it => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    const matchedStudent = students.find(s => s.id === it.matchedStudentId);
    return (
      it.filename.toLowerCase().includes(term) ||
      (matchedStudent && (
        matchedStudent.name.toLowerCase().includes(term) ||
        matchedStudent.rollNumber.toString().includes(term)
      ))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121418] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#161a20]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 shadow-xs border border-purple-200 dark:border-purple-800/40">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base font-display flex items-center gap-2">
                Importar Fotos em Lote
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {classroom.name}
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Fotos em formato retangular vertical 3:4 com enquadramento inteligente para não cortar cabeças
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-slate-800 dark:text-zinc-300">
          
          {/* Instructions Box */}
          <div className="bg-purple-50/60 dark:bg-purple-950/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-800/50 flex items-start gap-3 text-xs">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-purple-900 dark:text-purple-200">
                Vinculação Automática Inteligente
              </p>
              <p className="text-purple-800/90 dark:text-purple-300/80 leading-relaxed text-[11.5px]">
                O sistema lê os nomes dos arquivos e vincula automaticamente pelo <strong>número da chamada</strong> (ex: <code className="bg-white/80 dark:bg-zinc-800 px-1 py-0.5 rounded text-purple-900 dark:text-purple-200 font-mono">01.jpg</code>, <code className="bg-white/80 dark:bg-zinc-800 px-1 py-0.5 rounded text-purple-900 dark:text-purple-200 font-mono">1.png</code>, <code className="bg-white/80 dark:bg-zinc-800 px-1 py-0.5 rounded text-purple-900 dark:text-purple-200 font-mono">aluno_03.jpg</code>) ou pelo <strong>nome do aluno</strong> (ex: <code className="bg-white/80 dark:bg-zinc-800 px-1 py-0.5 rounded text-purple-900 dark:text-purple-200 font-mono">alice.jpg</code>, <code className="bg-white/80 dark:bg-zinc-800 px-1 py-0.5 rounded text-purple-900 dark:text-purple-200 font-mono">bernardo.png</code>). Você também pode ajustar manualmente a qualquer momento.
              </p>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging 
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30' 
                : 'border-slate-300 dark:border-zinc-700 hover:border-purple-500 hover:bg-purple-50/30 dark:hover:bg-zinc-800/40 bg-slate-50/40 dark:bg-[#15171c]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) processFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-3 shadow-xs">
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">
              Arraste e solte as fotos aqui ou <span className="text-purple-600 dark:text-purple-400 underline">clique para selecionar múltiplos arquivos</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Formatos aceitos: JPG, PNG, WEBP. Selecione quantos arquivos desejar de uma vez só.
            </p>
          </div>

          {/* Master Global Framing Controls */}
          {items.length > 0 && (
            <div className="bg-slate-100/70 dark:bg-[#181b22] p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                    Enquadramento Vertical Padrão para Todas as Fotos
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Garante que o rosto e a cabeça fiquem bem visíveis em todo o lote
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleApplyGlobalFraming(0.04, 1.0)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    Math.abs(globalOffset - 0.04) < 0.03
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-300 dark:border-zinc-700 hover:bg-purple-50'
                  }`}
                >
                  Topo (Foco no Rosto/Cabelo)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyGlobalFraming(0.18, 1.0)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    Math.abs(globalOffset - 0.18) < 0.05
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-300 dark:border-zinc-700 hover:bg-purple-50'
                  }`}
                >
                  Padrão Escolar 3×4 (Recomendado)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyGlobalFraming(0.5, 1.0)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    Math.abs(globalOffset - 0.5) < 0.05
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-300 dark:border-zinc-700 hover:bg-purple-50'
                  }`}
                >
                  Centro
                </button>
              </div>
            </div>
          )}

          {/* Stats Bar & Search */}
          {items.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                  {items.length} {items.length === 1 ? 'foto carregada' : 'fotos carregadas'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {matchedCount} identificadas
                </span>
                {unassignedCount > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {unassignedCount} pendentes de escolha
                  </span>
                )}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filtrar fotos..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

          {/* Photos Review Grid / List */}
          {items.length > 0 && (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredItems.map((item) => {
                const matchedStudent = students.find(s => s.id === item.matchedStudentId);

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-white dark:bg-[#16181f] rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
                      {/* 3:4 Vertical Rectangle Thumbnail with rounded corners */}
                      <div className="w-12 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 shrink-0 shadow-2xs relative flex items-center justify-center">
                        <img
                          src={item.dataUrl}
                          alt={item.filename}
                          className="w-full h-full object-cover block"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate font-mono">
                          {item.filename}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-1">
                          {item.matchType === 'roll_number' && (
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Detectado por Nº de chamada
                            </span>
                          )}
                          {(item.matchType === 'exact_name' || item.matchType === 'partial_name') && (
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Detectado por Nome
                            </span>
                          )}
                          {item.matchType === 'none' && (
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              Aguardando seleção
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Selector & Actions */}
                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                      <div className="flex-1 sm:flex-initial">
                        <select
                          value={item.matchedStudentId || ''}
                          onChange={(e) => handleSelectStudent(item.id, e.target.value || null)}
                          className={`w-full sm:w-60 text-xs font-bold px-3 py-2 rounded-xl border appearance-none cursor-pointer transition-colors ${
                            item.matchedStudentId 
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' 
                              : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-700'
                          }`}
                        >
                          <option value="">-- Não vincular / Ignorar --</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>
                              Nº {s.rollNumber} - {s.name} {s.nickname ? `(${s.nickname})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                        title="Remover arquivo da lista"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-[#161a20] flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-zinc-400">
            {items.length > 0 ? (
              <span><strong>{matchedCount}</strong> de <strong>{items.length}</strong> fotos prontas para importação</span>
            ) : (
              <span>Nenhuma foto adicionada ainda</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={matchedCount === 0}
              onClick={handleConfirmImport}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                matchedCount > 0
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-slate-200 dark:bg-zinc-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              Aplicar {matchedCount} {matchedCount === 1 ? 'Foto' : 'Fotos'} aos Alunos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
