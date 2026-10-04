import React, { useState } from 'react';
import { UserAccount } from '../../types';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  Share2,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Check,
  Send,
  ExternalLink,
  X,
  Lock,
  MessageCircle,
} from 'lucide-react';
import { generateStrongPassword, buildShareCredentialsMessage } from '../../utils/security';

interface EmployeesModuleProps {
  users: UserAccount[];
  onSaveUser: (user: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
  onDeleteMultipleUsers?: (userIds: string[]) => void;
  onToggleUserStatus: (userId: string) => void;
}

export const EmployeesModule: React.FC<EmployeesModuleProps> = ({
  users,
  onSaveUser,
  onDeleteUser,
  onDeleteMultipleUsers,
  onToggleUserStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'todos' | 'Admin' | 'Cajero'>('todos');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Modal Create/Edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form Fields
  const [formFullName, setFormFullName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<'Admin' | 'Cajero'>('Cajero');
  const [formPassword, setFormPassword] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Share Credentials Modal state
  const [shareModalUser, setShareModalUser] = useState<UserAccount | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  // Filtered employees
  const cleanSearch = searchTerm.toLowerCase().trim();
  const filteredUsers = users.filter((u) => {
    const nameMatch = (u.fullName || '').toLowerCase().includes(cleanSearch);
    const userMatch = (u.username || '').toLowerCase().includes(cleanSearch);
    const emailMatch = (u.email || '').toLowerCase().includes(cleanSearch);
    const matchesSearch = !cleanSearch || nameMatch || userMatch || emailMatch;

    const matchesRole = roleFilter === 'todos' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setFormFullName('');
    setFormUsername('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('Cajero');
    const securePass = generateStrongPassword(10);
    setFormPassword(securePass);
    setFormIsActive(true);
    setShowPassword(true);
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormFullName(user.fullName);
    setFormUsername(user.username);
    setFormEmail(user.email);
    setFormPhone(user.phone || '');
    setFormRole(user.role);
    setFormPassword(user.password || '');
    setFormIsActive(user.isActive);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword(10);
    setFormPassword(generated);
    setShowPassword(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim() || !formUsername.trim()) {
      alert('Nombre completo y nombre de usuario son obligatorios.');
      return;
    }

    const updatedUser: UserAccount = {
      id: editingUser ? editingUser.id : `usr-${Date.now()}`,
      fullName: formFullName.trim(),
      username: formUsername.trim().toLowerCase(),
      email: formEmail.trim() || `${formUsername.trim().toLowerCase()}@elescritorio.mx`,
      phone: formPhone.trim() || undefined,
      role: formRole,
      password: formPassword,
      isActive: formIsActive,
      avatarUrl: editingUser?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString(),
    };

    onSaveUser(updatedUser);
    setIsModalOpen(false);

    // Offer to share credentials immediately if creating new user
    if (!editingUser) {
      setShareModalUser(updatedUser);
    }
  };

  const handleCopyCredentials = (user: UserAccount) => {
    const text = buildShareCredentialsMessage({
      fullName: user.fullName,
      username: user.username,
      password: user.password,
      role: user.role,
      appUrl: 'https://el-escritorio-pos.ai.studio/',
    });
    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  const handleWhatsAppShare = (user: UserAccount) => {
    const text = buildShareCredentialsMessage({
      fullName: user.fullName,
      username: user.username,
      password: user.password,
      role: user.role,
      appUrl: 'https://el-escritorio-pos.ai.studio/',
    });
    const phoneClean = user.phone ? user.phone.replace(/\D/g, '') : '';
    const url = phoneClean
      ? `https://api.whatsapp.com/send?phone=${phoneClean}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Selection handlers
  const allUsersSelected =
    filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.includes(u.id));

  const handleToggleSelectAllUsers = () => {
    if (allUsersSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    }
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uId) => uId !== id) : [...prev, id]
    );
  };

  const handleDeleteSelectedUsers = () => {
    if (selectedUserIds.length === 0) return;
    if (
      confirm(
        `¿Eliminar las ${selectedUserIds.length} credenciales de empleados seleccionadas?`
      )
    ) {
      if (onDeleteMultipleUsers) {
        onDeleteMultipleUsers(selectedUserIds);
      } else {
        selectedUserIds.forEach((id) => onDeleteUser(id));
      }
      setSelectedUserIds([]);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 pb-16 md:pb-0">
      {/* Top Header */}
      <div className="p-4 sm:p-6 bg-white border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1F4461] tracking-tight">
              Gestión de Empleados & Credenciales
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
              Crea cajeros y administradores, asigna roles, genera contraseñas seguras y comparte accesos
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white font-bold text-sm sm:text-base shadow-xs transition cursor-pointer active:scale-98"
            >
              <UserPlus className="w-4.5 h-4.5 text-[#9CC55B]" />
              <span>Nuevo Empleado</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, usuario o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#1F4461] text-sm font-medium outline-none transition"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(['todos', 'Admin', 'Cajero'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
                  roleFilter === r
                    ? 'bg-[#1F4461] text-white shadow-xs font-bold'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {r === 'todos' ? 'Todos los Roles' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {/* Bulk Action Bar */}
        {selectedUserIds.length > 0 && (
          <div className="mb-4 p-3 rounded-2xl bg-[#1F4461] text-white flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-[#9CC55B] text-[#1F4461] font-black text-xs flex items-center justify-center shadow-xs">
                {selectedUserIds.length}
              </span>
              <span className="text-xs font-bold">
                {selectedUserIds.length === 1
                  ? '1 empleado seleccionado'
                  : `${selectedUserIds.length} empleados seleccionados`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDeleteSelectedUsers}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition cursor-pointer shadow-sm active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Borrar Seleccionados</span>
              </button>
              <button
                onClick={() => setSelectedUserIds([])}
                className="px-3 py-1.5 rounded-xl hover:bg-white/10 text-xs text-gray-300 cursor-pointer transition"
              >
                Deseleccionar
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={allUsersSelected && filteredUsers.length > 0}
                      onChange={handleToggleSelectAllUsers}
                      className="w-4 h-4 rounded text-[#1F4461] cursor-pointer"
                      title="Seleccionar todos los empleados"
                    />
                  </th>
                  <th className="py-3 px-4">Empleado / Usuario</th>
                  <th className="py-3 px-4">Contacto</th>
                  <th className="py-3 px-4 text-center">Rol Asignado</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4">Contraseña Asignada</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No se encontraron empleados registrados.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelected = selectedUserIds.includes(user.id);
                    return (
                      <tr
                        key={user.id}
                        className={`transition ${isSelected ? 'bg-[#1F4461]/5' : 'hover:bg-gray-50/80'}`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectUser(user.id)}
                            className="w-4 h-4 rounded text-[#1F4461] cursor-pointer"
                            title={`Seleccionar ${user.fullName}`}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{user.fullName}</p>
                            <span className="text-[11px] font-mono text-gray-400">@{user.username}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-gray-800 block">{user.email}</span>
                        <span className="text-[11px] text-gray-500 font-mono">{user.phone || 'Sin teléfono'}</span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            user.role === 'Admin'
                              ? 'bg-[#1F4461] text-white'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{user.role}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onToggleUserStatus(user.id)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer flex items-center gap-1 mx-auto ${
                            user.isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                          title="Haz clic para activar o desactivar empleado"
                        >
                          {user.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          <span>{user.isActive ? 'Activo' : 'Inactivo'}</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-bold border border-gray-200">
                          {user.password || '••••••••'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Share Credentials Button */}
                          <button
                            onClick={() => setShareModalUser(user)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                            title="Compartir credenciales de acceso"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          {/* Edit User Button */}
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#1F4461] hover:bg-gray-100 transition cursor-pointer"
                            title="Editar datos y contraseña"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete User Button (Cannot delete primary admin accounts) */}
                          <button
                            disabled={
                              (user.username || '').toLowerCase() === 'admin1' ||
                              (user.username || '').toLowerCase() === 'haroldo90'
                            }
                            onClick={() => {
                              if (confirm(`¿Eliminar al empleado ${user.fullName}?`)) {
                                onDeleteUser(user.id);
                              }
                            }}
                            className={`p-1.5 rounded-lg transition ${
                              (user.username || '').toLowerCase() === 'admin1' ||
                              (user.username || '').toLowerCase() === 'haroldo90'
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer'
                            }`}
                            title={
                              (user.username || '').toLowerCase() === 'admin1' ||
                              (user.username || '').toLowerCase() === 'haroldo90'
                                ? 'No se puede eliminar una cuenta de Administrador Principal'
                                : 'Eliminar empleado'
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT EMPLOYEE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            <div className="bg-[#1F4461] text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editingUser ? 'Editar Empleado' : 'Crear Nuevo Empleado'}
                </h3>
                <p className="text-xs text-gray-300">Asigna credenciales, rol y estado de acceso</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-gray-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="Ej. Roberto Martínez García"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#1F4461] text-xs font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nombre de Usuario:</label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value.toLowerCase())}
                    placeholder="Ej. roberto1"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#1F4461] text-xs font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Rol en el Sistema:</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as 'Admin' | 'Cajero')}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#1F4461] text-xs font-semibold outline-none"
                  >
                    <option value="Cajero">Cajero (Punto de Venta)</option>
                    <option value="Admin">Admin (Control Total)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono / WhatsApp:</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Ej. 55 1234 5678"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico:</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="empleado@elescritorio.mx"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Password field with EYE toggle and GENERATE STRONG PASSWORD button */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800">Contraseña de Acceso:</label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#1F4461] hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#9CC55B]" />
                    <span>Generar Contraseña Segura</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-gray-300 focus:border-[#1F4461] text-xs font-mono font-bold outline-none bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Toggle Active status */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Estado de la Cuenta</span>
                  <span className="text-[11px] text-gray-500">¿Puede iniciar sesión en el sistema?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                    formIsActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {formIsActive ? 'Activo' : 'Desactivado'}
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#9CC55B] hover:bg-[#8bb44c] text-[#1F4461] font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Guardar Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE CREDENTIALS MODAL */}
      {shareModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100">
            <div className="bg-[#1F4461] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#9CC55B]" />
                <h3 className="font-bold text-sm">Compartir Credenciales</h3>
              </div>
              <button
                onClick={() => setShareModalUser(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-gray-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                Comparte este mensaje con el nuevo empleado para que pueda acceder directamente al sistema:
              </p>

              {/* Message preview box */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs font-mono whitespace-pre-wrap text-gray-800 leading-relaxed max-h-56 overflow-y-auto">
                {buildShareCredentialsMessage({
                  fullName: shareModalUser.fullName,
                  username: shareModalUser.username,
                  password: shareModalUser.password,
                  role: shareModalUser.role,
                  appUrl: 'https://el-escritorio-pos.ai.studio/',
                })}
              </div>

              {/* Share Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => handleCopyCredentials(shareModalUser)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {copiedNotice ? <Check className="w-4 h-4 text-[#9CC55B]" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedNotice ? '¡Mensaje Copiado al Portapapeles!' : 'Copiar Credenciales'}</span>
                </button>

                <button
                  onClick={() => handleWhatsAppShare(shareModalUser)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar por WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
