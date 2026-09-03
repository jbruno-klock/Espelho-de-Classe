import React, { useState } from 'react';
import {
  Building2, Users, Shield, Plus, Edit2, Trash2, CheckCircle2,
  AlertCircle, Search, Filter, Lock, Unlock, Eye, ArrowRight,
  School, UserPlus, Sparkles, LogOut, Check
} from 'lucide-react';
import { Institution, AppUser, Classroom } from '../types';
import { DeleteInstitutionModal } from './DeleteInstitutionModal';
import { DeleteUserModal } from './DeleteUserModal';

interface MasterAdminDashboardProps {
  currentUser: AppUser;
  institutions: Institution[];
  users: AppUser[];
  classrooms: Classroom[];
  onAddInstitution: () => void;
  onEditInstitution: (inst: Institution) => void;
  onDeleteInstitution: (id: string) => void;
  onAddUser: () => void;
  onEditUser: (user: AppUser) => void;
  onDeleteUser: (id: string) => void;
  onSwitchSimulatedUser: (user: AppUser) => void;
  onEnterInstitutionAsMaster: (institutionId: string) => void;
}

export const MasterAdminDashboard: React.FC<MasterAdminDashboardProps> = ({
  currentUser,
  institutions,
  users,
  classrooms,
  onAddInstitution,
  onEditInstitution,
  onDeleteInstitution,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onSwitchSimulatedUser,
  onEnterInstitutionAsMaster,
}) => {
  const [activeTab, setActiveTab] = useState<'institutions' | 'users' | 'overview'>('institutions');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Deletion Modals State
  const [institutionToDelete, setInstitutionToDelete] = useState<Institution | null>(null);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);

  const filteredInstitutions = institutions.filter(inst => {
    const matchesSearch = inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inst.city && inst.city.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || inst.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Calculate statistics
  const totalInstitutions = institutions.length;
  const totalManagers = users.filter(u => u.role === 'manager').length;
  const totalClassrooms = classrooms.length;
  const totalStudents = classrooms.reduce((acc, c) => acc + (c.students?.length || 0), 0);

  return (
    <div id="master-admin-dashboard" className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner: Master Identity and Global Metrics */}
      <div className="bg-gradient-to-r from-purple-50 via-slate-50 to-purple-50 dark:from-[#121216] dark:via-[#16161f] dark:to-[#121216] p-6 rounded-3xl border border-purple-200 dark:border-purple-500/30 shadow-xl relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center shadow-inner shrink-0">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 uppercase tracking-wide">
                  Super Admin • Master
                </span>
                <span className="text-xs text-slate-600 dark:text-zinc-400">Controle Multi-Tenant</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-zinc-100 font-display mt-0.5">
                Painel Master de Instituições & Gestores
              </h1>
              <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-2xl mt-1">
                Você tem permissão total para gerenciar instituições parceiras, credenciar gestores escolares e auditar turmas de todas as unidades com isolamento rigoroso.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="master-new-institution-btn"
              onClick={onAddInstitution}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/20 transition-all cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              Nova Instituição
            </button>
            <button
              id="master-new-user-btn"
              onClick={onAddUser}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-[#1f1f28] hover:bg-slate-100 dark:hover:bg-[#282834] text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Criar Gestor
            </button>
          </div>
        </div>

        {/* Global Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-zinc-800/80">
          <div className="p-3.5 bg-white dark:bg-[#18181f] rounded-2xl border border-slate-200 dark:border-zinc-700/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-300 block mb-1">Instituições Ativas</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-zinc-100">{totalInstitutions}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Unidades</span>
            </div>
          </div>

          <div className="p-3.5 bg-white dark:bg-[#18181f] rounded-2xl border border-slate-200 dark:border-zinc-700/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-300 block mb-1">Gestores Credenciados</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-purple-700 dark:text-purple-300">{totalManagers}</span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold">Admins</span>
            </div>
          </div>

          <div className="p-3.5 bg-white dark:bg-[#18181f] rounded-2xl border border-slate-200 dark:border-zinc-700/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-300 block mb-1">Total de Turmas</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{totalClassrooms}</span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold">Salas</span>
            </div>
          </div>

          <div className="p-3.5 bg-white dark:bg-[#18181f] rounded-2xl border border-slate-200 dark:border-zinc-700/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-300 block mb-1">Total de Alunos</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-300">{totalStudents}</span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold">Cadastrados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            id="tab-institutions-btn"
            onClick={() => setActiveTab('institutions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'institutions'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#18181f] hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Instituições ({institutions.length})
          </button>

          <button
            id="tab-users-btn"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#18181f] hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80'
            }`}
          >
            <Users className="w-4 h-4" />
            Usuários & Gestores ({users.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-64 hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 dark:text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Buscar em ${activeTab === 'institutions' ? 'instituições' : 'usuários'}...`}
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-[#18181f] border border-slate-300 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
          />
        </div>
      </div>

      {/* TAB 1: INSTITUTIONS LIST */}
      {activeTab === 'institutions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInstitutions.map((inst) => {
              const instManagers = users.filter(u => u.institutionId === inst.id);
              const instClassrooms = classrooms.filter(c => c.institutionId === inst.id);
              const instStudents = instClassrooms.reduce((acc, c) => acc + (c.students?.length || 0), 0);

              return (
                <div
                  key={inst.id}
                  id={`inst-card-${inst.id}`}
                  className="bg-white dark:bg-[#121216] border border-slate-200 dark:border-zinc-700/80 hover:border-purple-400 dark:hover:border-purple-500/60 rounded-3xl p-5 flex flex-col justify-between transition-all group relative overflow-hidden shadow-sm"
                >
                  <div>
                    {/* Header Card */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center shrink-0 shadow-xs">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                            {inst.code}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors line-clamp-1">
                            {inst.name}
                          </h3>
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                        inst.status === 'active'
                          ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40'
                          : 'bg-rose-50 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/40'
                      }`}>
                        {inst.status === 'active' ? 'Ativa' : inst.status}
                      </span>
                    </div>

                    {/* Location & Contact */}
                    {(inst.city || inst.contactEmail) && (
                      <div className="space-y-1 mb-4 text-xs text-slate-700 dark:text-zinc-300">
                        {inst.city && (
                          <p className="flex items-center gap-1.5 text-[11px]">
                            <span className="text-slate-500 dark:text-zinc-400 font-bold">Local:</span> {inst.city}{inst.state ? ` - ${inst.state}` : ''}
                          </p>
                        )}
                        {inst.contactEmail && (
                          <p className="flex items-center gap-1.5 text-[11px] truncate">
                            <span className="text-slate-500 dark:text-zinc-400 font-bold">Contato:</span> {inst.contactEmail}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Sub-Metrics */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 dark:bg-[#18181f] rounded-2xl border border-slate-200 dark:border-zinc-700/80 mb-4 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold block">Gestores</span>
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-300">{instManagers.length}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold block">Turmas</span>
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{instClassrooms.length}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold block">Alunos</span>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-300">{instStudents}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-zinc-700/80 gap-2">
                    <button
                      onClick={() => onEnterInstitutionAsMaster(inst.id)}
                      title="Entrar no painel desta instituição como Master"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/80 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Acessar Turmas
                    </button>

                    <button
                      onClick={() => onEditInstitution(inst)}
                      title="Editar dados da instituição"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setInstitutionToDelete(inst)}
                      title="Excluir instituição"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 dark:bg-zinc-800 dark:hover:bg-rose-950/60 text-slate-700 hover:text-rose-700 dark:text-zinc-300 dark:hover:text-rose-300 border border-slate-300 hover:border-rose-300 dark:border-zinc-700 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: USERS & MANAGERS LIST */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#121216] rounded-3xl border border-slate-200 dark:border-zinc-700/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-zinc-200">
                <thead className="bg-slate-50 dark:bg-[#181822] text-slate-700 dark:text-zinc-200 font-bold border-b border-slate-200 dark:border-zinc-700 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Usuário / Nome</th>
                    <th className="px-5 py-3.5">E-mail de Acesso</th>
                    <th className="px-5 py-3.5">Papel (RBAC)</th>
                    <th className="px-5 py-3.5">Instituição Vinculada</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Ações & Simulação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {filteredUsers.map((user) => {
                    const linkedInst = institutions.find(i => i.id === user.institutionId);
                    const isMaster = user.role === 'master';

                    return (
                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-[#18181f] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs"
                              style={{ backgroundColor: user.avatarColor || '#6366f1' }}
                            >
                              {user.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-900 dark:text-zinc-100 text-xs">
                              {user.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 font-mono text-slate-700 dark:text-zinc-300 font-bold">
                          {user.email}
                        </td>

                        <td className="px-5 py-3.5">
                          {isMaster ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-400/50 uppercase tracking-wide shadow-xs">
                              <Shield className="w-3 h-3 text-purple-600 dark:text-purple-300 shrink-0" />
                              Super Admin (Master)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-400/50 uppercase tracking-wide shadow-xs">
                              <Building2 className="w-3 h-3 text-emerald-600 dark:text-emerald-300 shrink-0" />
                              Gestor de Unidade
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          {isMaster ? (
                            <span className="text-slate-500 dark:text-zinc-400 italic font-medium">Global (Todas as Unidades)</span>
                          ) : linkedInst ? (
                            <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 shrink-0" />
                              {linkedInst.name}
                            </span>
                          ) : (
                            <span className="text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" /> Sem Vínculo!
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            user.isActive
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-300 dark:border-zinc-700'
                          }`}>
                            {user.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {/* Test / Simulate as this user */}
                          <button
                            onClick={() => onSwitchSimulatedUser(user)}
                            title={`Simular login e testar isolamento de dados como ${user.name}`}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-zinc-800 dark:hover:bg-emerald-950/80 dark:hover:text-emerald-300 text-slate-800 dark:text-zinc-200 border border-slate-300 hover:border-emerald-400 dark:border-zinc-700 dark:hover:border-emerald-600 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs"
                          >
                            <ArrowRight className="w-3 h-3" />
                            Simular Login
                          </button>

                          <button
                            onClick={() => onEditUser(user)}
                            title="Editar usuário"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 transition-colors cursor-pointer inline-flex shadow-xs"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setUserToDelete(user)}
                            title="Excluir usuário"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 dark:bg-zinc-800 dark:hover:bg-rose-950/60 text-slate-700 hover:text-rose-700 dark:text-zinc-300 dark:hover:text-rose-300 border border-slate-300 hover:border-rose-300 dark:border-zinc-700 transition-colors cursor-pointer inline-flex shadow-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Institution Confirmation Modal */}
      {institutionToDelete && (
        <DeleteInstitutionModal
          isOpen={!!institutionToDelete}
          onClose={() => setInstitutionToDelete(null)}
          institution={institutionToDelete}
          managersCount={users.filter(u => u.institutionId === institutionToDelete.id).length}
          classroomsCount={classrooms.filter(c => c.institutionId === institutionToDelete.id).length}
          studentsCount={classrooms
            .filter(c => c.institutionId === institutionToDelete.id)
            .reduce((acc, c) => acc + (c.students?.length || 0), 0)}
          onConfirmDelete={(id) => {
            onDeleteInstitution(id);
            setInstitutionToDelete(null);
          }}
        />
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <DeleteUserModal
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          user={userToDelete}
          isCurrentUser={currentUser.id === userToDelete.id}
          institutionName={institutions.find(i => i.id === userToDelete.institutionId)?.name}
          onConfirmDelete={(id) => {
            onDeleteUser(id);
            setUserToDelete(null);
          }}
        />
      )}

    </div>
  );
};
