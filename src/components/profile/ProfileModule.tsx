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
  CloudUpload,
  Link as LinkIcon,
  RefreshCw,
} from 'lucide-react';
import { generateStrongPassword } from '../../utils/security';
import { syncUserToSupabase } from '../../services/supabaseClient';

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
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Credentials form
  const [username, setUsername] = useState(currentUser.username);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status alerts & sync state
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [isSavingData, setIsSavingData] = useState(false);

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
    }, 4000);
  };

  // Image file upload handler (compresses to lightweight 160x160 JPEG for instant Supabase & localStorage save)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSavingPhoto(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const rawBase64 = event.target?.result as string;
      const img = new Image();

      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 180;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          let finalImage = rawBase64;
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            finalImage = canvas.toDataURL('image/jpeg', 0.75);
          }

          setAvatarUrl(finalImage);

          const updated: UserAccount = {
            ...currentUser,
            avatarUrl: finalImage,
          };

          // 1. Update in local storage & app state
          onUpdateProfile(updated);

          // 2. Explicitly sync with Supabase and report result
          const res = await syncUserToSupabase(updated);
          setIsSavingPhoto(false);

          if (res.success) {
            showNotification('✓ Foto de perfil guardada y sincronizada en Supabase con éxito.');
          } else {
            showNotification(`Foto guardada localmente (${res.error || 'Verifica tu conexión a Supabase'}).`, true);
          }
        } catch (err: unknown) {
          setIsSavingPhoto(false);
          setAvatarUrl(rawBase64);
          const updated = { ...currentUser, avatarUrl: rawBase64 };
          onUpdateProfile(updated);
          syncUserToSupabase(updated).catch(() => {});
          showNotification('✓ Foto de perfil actualizada localmente.');
        }
      };

      img.onerror = () => {
        setIsSavingPhoto(false);
        showNotification('No se pudo procesar la imagen seleccionada.', true);
      };

      img.src = rawBase64;
    };

    reader.readAsDataURL(file);
  };

  // Set avatar by URL
  const handleApplyPhotoUrl = async () => {
    if (!photoUrlInput.trim()) return;
    setIsSavingPhoto(true);

    const updated: UserAccount = {
      ...currentUser,
      avatarUrl: photoUrlInput.trim(),
    };

    setAvatarUrl(photoUrlInput.trim());
    onUpdateProfile(updated);

    const res = await syncUserToSupabase(updated);
    setIsSavingPhoto(false);
    setShowUrlInput(false);
    setPhotoUrlInput('');

    if (res.success) {
      showNotification('✓ Foto de perfil guardada y sincronizada en Supabase.');
    } else {
      showNotification(`Foto guardada localmente (${res.error || 'Verifica Supabase'}).`, true);
    }
  };

  // Save Personal Info
  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      showNotification('Nombre completo y correo son obligatorios.', true);
      return;
    }

    setIsSavingData(true);

    const updated: UserAccount = {
      ...currentUser,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      identification: identification.trim() || undefined,
      avatarUrl: avatarUrl.trim() || undefined,
    };

    onUpdateProfile(updated);
    const res = await syncUserToSupabase(updated);
    setIsSavingData(false);

    if (res.success) {
      showNotification('✓ Datos personales guardados y sincronizados en Supabase.');
    } else {
      showNotification(`Datos guardados localmente (${res.error || 'Verifica Supabase'}).`, true);
    }
  };

  // Save Credentials (Username & Password)
  const handleSaveCredentials = async (e: React.FormEvent) => {
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

    setIsSavingData(true);

    const updated: UserAccount = {
      ...currentUser,
      username: username.trim(),
      password: newPassword ? newPassword : currentUser.password,
    };

    onUpdateProfile(updated);
    const res = await syncUserToSupabase(updated);
    setIsSavingData(false);

    setNewPassword('');
    setConfirmPassword('');

    if (res.success) {
      showNotification('✓ Credenciales y contraseña guardadas en Supabase.');
    } else {
      showNotification(`Credenciales guardadas localmente (${res.error || 'Verifica Supabase'}).`, true);
    }
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1F4461] tracking-tight">
              Mi Perfil • {currentUser.role}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
              Administración de fotografía, datos personales y credenciales de acceso seguras
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1F4461] text-white flex items-center gap-1.5 shadow-xs">
              <Shield className="w-3.5 h-3.5 text-[#9CC55B]" />
              <span>Rol: {currentUser.role}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full">
        {/* Alerts */}
        {successNotice && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-xs">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}
        {errorNotice && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-xs">
            <Shield className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* PROFILE PHOTO & IDENTITY HEADER CARD */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar with Camera upload button */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-gray-100 border-2 border-[#1F4461] shadow-md flex items-center justify-center relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-[#1F4461]" />
              )}

              {isSavingPhoto && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-white animate-spin" />
                </div>
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
                disabled={isSavingPhoto}
              />
            </label>
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
              <h2 className="text-2xl sm:text-3xl font-black text-[#1F4461]">{currentUser.fullName}</h2>
              <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-black bg-[#1F4461] text-white flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#9CC55B]" />
                {currentUser.role}
              </span>
            </div>
            <p className="text-sm sm:text-base text-gray-500 font-mono font-medium">Usuario: @{currentUser.username}</p>
            <p className="text-sm sm:text-base text-gray-600 mt-2 font-medium">
              Haz clic en el ícono de la cámara para subir tu foto o ingresa un enlace web. Se guarda automáticamente en Supabase y localmente.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <label
                htmlFor="photo-upload"
                className="px-4 py-2.5 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white text-sm sm:text-base font-bold transition cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <CloudUpload className="w-4.5 h-4.5 text-[#9CC55B]" />
                <span>{isSavingPhoto ? 'Guardando en Supabase...' : 'Subir Imagen'}</span>
              </label>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 text-sm sm:text-base font-bold transition cursor-pointer flex items-center gap-2"
              >
                <LinkIcon className="w-4.5 h-4.5 text-gray-500" />
                <span>Ingresar URL de Foto</span>
              </button>
            </div>

            {/* URL photo input field */}
            {showUrlInput && (
              <div className="mt-3 flex items-center gap-2 max-w-md">
                <input
                  type="url"
                  placeholder="https://ejemplo.com/mifoto.jpg"
                  value={photoUrlInput}
                  onChange={(e) => setPhotoUrlInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-gray-300 text-xs outline-none focus:border-[#1F4461]"
                />
                <button
                  type="button"
                  onClick={handleApplyPhotoUrl}
                  disabled={!photoUrlInput.trim() || isSavingPhoto}
                  className="px-3 py-1.5 rounded-xl bg-[#9CC55B] hover:bg-[#8bb44c] text-[#1F4461] text-xs font-bold transition cursor-pointer shrink-0 disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* TWO COLUMNS: PERSONAL DATA vs CREDENTIALS & PASSWORD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PERSONAL DATA FORM */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-7 space-y-5">
            <div className="flex items-center gap-2.5 pb-3.5 border-b border-gray-100">
              <User className="w-5 h-5 text-[#1F4461]" />
              <h3 className="font-black text-lg sm:text-xl text-[#1F4461]">Datos Personales</h3>
            </div>

            <form onSubmit={handleSavePersonalInfo} className="space-y-4">
              <div>
                <label className="block text-sm sm:text-base font-bold text-gray-800 mb-1.5">Nombre Completo:</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#1F4461] text-base font-medium outline-none"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-bold text-gray-800 mb-1.5">Correo Electrónico:</label>
                <div className="relative">
                  <Mail className="w-4.5 h-4.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-[#1F4461] text-base font-medium outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm sm:text-base font-bold text-gray-800 mb-1.5">Teléfono / WhatsApp:</label>
                <div className="relative">
                  <Phone className="w-4.5 h-4.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. 55 1234 5678"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-[#1F4461] text-base font-medium outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm sm:text-base font-bold text-gray-800 mb-1.5">RFC o Identificación:</label>
                <div className="relative">
                  <CreditCard className="w-4.5 h-4.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={identification}
                    onChange={(e) => setIdentification(e.target.value)}
                    placeholder="Ej. CAJ-2026-01"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-[#1F4461] text-base font-mono outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingData}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white font-black text-base shadow-md transition cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isSavingData ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Save className="w-4 h-4 text-[#9CC55B]" />
                  )}
                  <span>Guardar en Supabase y Local</span>
                </button>
              </div>
            </form>
          </div>

          {/* CREDENTIALS & PASSWORD SECURITY FORM */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-[#1F4461]" />
                <h3 className="font-black text-lg sm:text-xl text-[#1F4461]">Seguridad y Credenciales</h3>
              </div>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#9CC55B]/20 hover:bg-[#9CC55B]/40 text-[#1F4461] text-xs sm:text-sm font-black border border-[#9CC55B]/40 transition cursor-pointer"
                title="Generar contraseña aleatoria de alta seguridad"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#9CC55B]" />
                <span>Generar Segura</span>
              </button>
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div>
                <label className="block text-sm sm:text-base font-bold text-gray-800 mb-1.5">Nombre de Usuario:</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#1F4461] text-base font-mono font-bold outline-none"
                />
              </div>

              {/* Password with Eye Toggle */}
              <div>
                <label className="block text-sm sm:text-base font-bold text-gray-800 mb-1.5">Nueva Contraseña:</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Dejar vacío para mantener la actual"
                    className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-300 focus:border-[#1F4461] text-base font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password with Eye Toggle */}
              <div>
                <label className="block text-sm sm:text-base font-bold text-gray-800 mb-1.5">Confirmar Nueva Contraseña:</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-300 focus:border-[#1F4461] text-base font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                    title={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingData}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-[#9CC55B] hover:bg-[#8bb44c] text-[#1F4461] font-black text-base shadow-md transition cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
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
