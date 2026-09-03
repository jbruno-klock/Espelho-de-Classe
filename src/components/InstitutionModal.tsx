import React, { useState, useRef } from 'react';
import {
  Building2, Plus, Edit2, Trash2, Check, X, ShieldAlert,
  Search, Users, GraduationCap, MapPin, Phone, Mail, FileText, CheckCircle2, AlertCircle,
  Image as ImageIcon, Upload, Eye
} from 'lucide-react';
import { Institution, AppUser, Classroom } from '../types';

interface InstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (institution: Institution) => void;
  onDelete?: (institutionId: string) => void;
  initialData?: Institution | null;
}

export const InstitutionModal: React.FC<InstitutionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialData?.name || '');
  const [code, setCode] = useState(initialData?.code || '');
  const [cnpj, setCnpj] = useState(initialData?.cnpj || '');
  const [status, setStatus] = useState<Institution['status']>(initialData?.status || 'active');
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail || '');
  const [contactPhone, setContactPhone] = useState(initialData?.contactPhone || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [state, setState] = useState(initialData?.state || '');
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [error, setError] = useState('');

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('A imagem do logotipo deve ter no máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoUrl(result);
        setError('');
      }
    };
    reader.onerror = () => {
      setError('Erro ao processar imagem.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome da instituição é obrigatório.');
      return;
    }
    if (!code.trim()) {
      setError('O código de identificação da instituição é obrigatório.');
      return;
    }

    const formattedCode = code.trim().toUpperCase().replace(/\s+/g, '-');

    const institutionToSave: Institution = {
      id: initialData?.id || `inst-${Date.now()}`,
      name: name.trim(),
      code: formattedCode,
      cnpj: cnpj.trim() || undefined,
      status,
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: initialData?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(institutionToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="institution-modal-dialog"
        className="bg-white dark:bg-[#121216] rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-zinc-100 transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#16161c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base font-display">
                {initialData ? 'Editar Instituição de Ensino' : 'Nova Instituição de Ensino'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Gerenciamento Multi-tenant exclusivo Master
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-slate-800 dark:text-zinc-300">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              Nome da Instituição / Escola *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Fleming Medicina - Unidade Ponta Verde"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-sm font-medium text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Código Único (Slug/Tag) *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: FLEMING-PV"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400 placeholder-slate-400 dark:placeholder-zinc-500 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
              <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-1">Identificador exclusivo para isolamento de dados.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Status da Instituição
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-sm text-slate-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
              >
                <option value="active" className="bg-white dark:bg-[#18181f] text-emerald-700 dark:text-emerald-400">Ativa (Acesso Liberado)</option>
                <option value="inactive" className="bg-white dark:bg-[#18181f] text-slate-600 dark:text-zinc-400">Inativa (Pausada)</option>
                <option value="suspended" className="bg-white dark:bg-[#18181f] text-rose-700 dark:text-rose-400">Suspensa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                CNPJ (Opcional)
              </label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-sm text-slate-900 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                E-mail Institucional
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="direcao@escola.com.br"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-sm text-slate-900 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="(82) 3333-0000"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-sm text-slate-900 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Cidade
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Maceió"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-sm text-slate-900 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Estado (UF)
              </label>
              <input
                type="text"
                maxLength={2}
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                placeholder="AL"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-sm uppercase text-slate-900 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>
          </div>

          {/* Logotipo da Instituição para Espelho e Documentos */}
          <div className="p-4 bg-slate-50 dark:bg-[#18181f] rounded-2xl border border-slate-200 dark:border-zinc-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Logotipo da Instituição (para Espelho de Classe e PDF)
              </label>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="text-[11px] text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors font-bold cursor-pointer"
                >
                  Remover Logo
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Preview Box */}
              <div className="w-32 h-20 bg-white rounded-xl border border-slate-300 dark:border-zinc-700 flex items-center justify-center p-2 shrink-0 shadow-inner overflow-hidden">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-6 h-6 text-slate-400 dark:text-zinc-400 mx-auto mb-1" />
                    <span className="text-[9px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider block">
                      Sem Logo
                    </span>
                  </div>
                )}
              </div>

              {/* Upload & URL Controls */}
              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#202028] hover:bg-slate-100 dark:hover:bg-[#282834] text-slate-800 dark:text-zinc-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 transition-all cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Selecionar Arquivo do Computador
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Ou cole a URL da imagem (https://...)"
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#121216] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-xs text-slate-900 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                  />
                </div>
                <p className="text-[10px] text-slate-600 dark:text-zinc-400">
                  O logotipo será exibido automaticamente no canto superior direito do PDF do espelho de classe. (PNG, JPG, SVG até 2MB)
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              Observações Administrativas / Contrato
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações de contrato, planos e diretrizes da unidade..."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700/60 rounded-xl text-xs text-slate-900 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
            {initialData && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(initialData.id);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/30 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Instituição
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {initialData ? 'Salvar Alterações' : 'Cadastrar Instituição'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
