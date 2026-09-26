import React from 'react';
import { X, Printer, School, Calendar, Users, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Institution } from '../../types';

interface NfcPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  institution?: Institution;
  dateOrMonthLabel: string;
  classroomName: string;
  metrics: {
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount?: number;
    percentage: number;
  };
  headers: string[];
  rows: (string | number)[][];
}

export const NfcPrintModal: React.FC<NfcPrintModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  institution,
  dateOrMonthLabel,
  classroomName,
  metrics,
  headers,
  rows,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121418] text-slate-900 dark:text-zinc-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* Actions Bar (No Print) */}
        <div className="p-4 bg-slate-100 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">Visualização de Impressão e Relatório PDF</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Layout limpo e padronizado para assinatura da secretaria</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900 space-y-6 print:p-0 print:m-0 print:overflow-visible" id="nfc-print-area">
          
          {/* Institution Official Header */}
          <div className="border-b-2 border-slate-800 pb-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <School className="w-6 h-6 text-emerald-700" />
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  {institution?.name || 'Instituição de Ensino'}
                </h1>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                {institution?.code ? `Código / Registro: ${institution.code}` : 'Sistema de Gestão Escolar • Frequência Digital e Portaria NFC'}
              </p>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">
              <p>Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
              <p className="font-bold text-slate-800">{dateOrMonthLabel}</p>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center space-y-0.5">
            <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900">{title}</h2>
            <p className="text-xs text-slate-600">{subtitle} • Turma(s): <strong>{classroomName}</strong></p>
          </div>

          {/* KPIs Box */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl">
            <div className="border-r border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total de Alunos</span>
              <span className="text-base font-black text-slate-900">{metrics.totalStudents}</span>
            </div>
            <div className="border-r border-slate-200">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Presentes ({metrics.percentage}%)</span>
              <span className="text-base font-black text-emerald-700">{metrics.presentCount}</span>
            </div>
            <div className="border-r border-slate-200">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Ausentes</span>
              <span className="text-base font-black text-amber-700">{metrics.absentCount}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-yellow-700 block">Atrasos</span>
              <span className="text-base font-black text-yellow-700">{metrics.lateCount ?? 0}</span>
            </div>
          </div>

          {/* Records Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[10px] border-b border-slate-300">
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} className="py-2 px-3 border-r border-slate-200 last:border-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={headers.length} className="text-center py-6 text-slate-500 italic">
                      Nenhum registro encontrado para esta seleção.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="py-1.5 px-3 border-r border-slate-200 last:border-0 text-slate-800">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer & Signature lines */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-600">
            <div className="space-y-1">
              <div className="border-b border-slate-400 w-3/4 mx-auto mb-1"></div>
              <p className="font-semibold text-slate-800">Professor(a) / Coordenador(a)</p>
              <p className="text-[10px] text-slate-500">Responsável pela Chamada</p>
            </div>
            <div className="space-y-1">
              <div className="border-b border-slate-400 w-3/4 mx-auto mb-1"></div>
              <p className="font-semibold text-slate-800">Secretaria Escolar / Direção</p>
              <p className="text-[10px] text-slate-500">Visto da Instituição</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
