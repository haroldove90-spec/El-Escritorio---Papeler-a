import React, { useState } from 'react';
import { UserAccount } from '../../types';
import {
  User,
  Camera,
  KeyRound,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle,
  Save,
  Mail,
  Phone,
  CreditCard,
  Calendar,
} from 'lucide-react';
import { generateStrongPassword } from '../../utils/security';

interface ProfileModuleProps {
  currentUser: UserAccount;
  onUpdateProfile: (updatedUser: UserAccount) => void;
}

export const ProfileModule: React.FC<ProfileModuleProps> = ({
  currentUser,
  onUpdateProfile,
}) => {
  // Personal Info form
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [identification, setIdentification] = useState(currentUser.identification || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');

  // Credentials form
  const [username, setUsername] = useState(currentUser.username);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status alerts
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorNotice(msg);
      setSuccessNotice(null);
    } else {
      setSuccessNotice(msg);
      setErrorNotice(null);
    }
    setTimeout(() => {
      setSuccessNotice(null);
      setErrorNotice(null);
    }, 3500);
  };

  // Image file upload handler (converts image to Base64 data URL)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen seleccionada supera los 2MB. Por favor elige una imagen más ligera.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatarUrl(base64);
      // Auto-save avatar
      const updated = {
        ...currentUser,
        avatarUrl: base64,
      };
      onUpdateProfile(updated);
      showNotification('✓ Foto de perfil actualizada con éxito.');
    };
    reader.readAsDataURL(file);
  };

  // Save Personal Info
  const handleSavePersonalInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      showNotification('Nombre completo y correo son obligatorios.', true);
      return;
    }

    const updated: UserAccount = {
      ...currentUser,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      identification: identification.trim() || undefined,
      avatarUrl: avatarUrl.trim() || undefined,
    };

    onUpdateProfile(updated);
    showNotification('✓ Datos personales guardados exitosamente.');
  };

  // Save Credentials (Username & Password)
  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      showNotification('El nombre de usuario no puede estar vacío.', true);
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      showNotification('Las contraseñas no coinciden. Por favor verifícalas.', true);
      return;
    }

    if (newPassword && newPassword.length < 6) {
      showNotification('La contraseña debe tener al menos 6 caracteres.', true);
      return;
    }

    const updated: UserAccount = {
      ...currentUser,
      username: username.trim(),
      password: newPassword ? newPassword : currentUser.password,
    };

    onUpdateProfile(updated);
    setNewPassword('');
    setConfirmPassword('');
    showNotification('✓ Credenciales y contraseña actualizadas exitosamente.');
  };

  // Generate strong password
  const handleGeneratePassword = () => {
    const generated = generateStrongPassword(12);
    setNewPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
    showNotification('✓ Contraseña segura generada automáticamente.');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 pb-16 md:pb-0">
      {/* Top Header */}
      <div className="p-4 sm:p-6 bg-white border-b border-gray-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1F4461] tracking-tight">
            Perfil de Administrador
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Administración de tu fotografía, datos personales, nombre de usuario y contraseña segura
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full">
        {/* Alerts */}
        {successNotice && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}
        {errorNotice && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Shield className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* PROFILE PHOTO & IDENTITY HEADER CARD */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar with Camera upload button */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-[#1F4461]/10 border-2 border-[#1F4461] shadow-md flex items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-[#1F4461]" />
              )}
            </div>

            {/* Hidden file input */}
            <label
              htmlFor="photo-upload"
              className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white shadow-lg cursor-pointer transition transform active:scale-95 border-2 border-white"
              title="Subir foto desde tu dispositivo"
            >
              <Camera className="w-4 h-4 text-[#9CC55B]" />
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-lg sm:text-xl font-black text-[#1F4461]">{currentUser.fullName}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1F4461] text-white flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#9CC55B]" />
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono">@{currentUser.username}</p>
            <p className="text-xs text-gray-600 mt-2">
              Haz clic en el ícono de la cámara para subir una foto desde tu computadora o teléfono.
            </p>
          </div>
        </div>

        {/* TWO COLUMNS: PERSONAL DATA vs CREDENTIALS & PASSWORD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PERSONAL DATA FORM */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <User className="w-4 h-4 text-[#1F4461]" />
              <h3 className="font-extrabold text-sm text-[#1F4461]">Datos Personales</h3>
            </div>

            <form onSubmit={handleSavePersonalInfo} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#1F4461] text-xs font-medium outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico:</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-300 focus:border-[#1F4461] text-xs font-medium outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono / WhatsApp:</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. 55 1234 5678"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-300 focus:border-[#1F4461] text-xs font-medium outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">RFC o Identificación:</label>
                <div className="relative">
                  <CreditCard className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={identification}
                    onChange={(e) => setIdentification(e.target.value)}
                    placeholder="Ej. ADM-2026-01"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-300 focus:border-[#1F4461] text-xs font-mono outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white font-bold text-xs shadow-md transition cursor-pointer active:scale-98"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Datos Personales</span>
                </button>
              </div>
            </form>
          </div>

          {/* CREDENTIALS & PASSWORD SECURITY FORM */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#1F4461]" />
                <h3 className="font-extrabold text-sm text-[#1F4461]">Seguridad y Credenciales</h3>
              </div>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#9CC55B]/20 hover:bg-[#9CC55B]/40 text-[#1F4461] text-[11px] font-bold border border-[#9CC55B]/40 transition cursor-pointer"
                title="Generar contraseña aleatoria de alta seguridad"
              >
                <Sparkles className="w-3 h-3 text-[#9CC55B]" />
                <span>Generar Segura</span>
              </button>
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nombre de Usuario:</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#1F4461] text-xs font-mono font-bold outline-none"
                />
              </div>

              {/* Password with Eye Toggle */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nueva Contraseña:</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Dejar vacío para no modificar"
                    className="w-full pr-10 pl-3 py-2 rounded-xl border border-gray-300 focus:border-[#1F4461] text-xs font-mono outline-none"
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

              {/* Confirm Password with Eye Toggle */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Confirmar Nueva Contraseña:</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    className="w-full pr-10 pl-3 py-2 rounded-xl border border-gray-300 focus:border-[#1F4461] text-xs font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                    title={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#9CC55B] hover:bg-[#8bb44c] text-[#1F4461] font-bold text-xs shadow-md transition cursor-pointer active:scale-98"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Actualizar Contraseña y Usuario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
