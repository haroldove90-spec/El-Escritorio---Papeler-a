export function generateStrongPassword(length = 12): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*';

  // Ensure at least one of each category
  let password = '';
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  const allChars = upper + lower + digits + symbols;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle characters
  return password
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');
}

export function buildShareCredentialsMessage({
  fullName,
  username,
  password,
  role,
  appUrl = 'https://el-escritorio-pos.ai.studio/',
}: {
  fullName: string;
  username: string;
  password?: string;
  role: string;
  appUrl?: string;
}): string {
  return `👋 ¡Hola ${fullName}!
Se han generado tus credenciales de acceso para el sistema Punto de Venta de Papelería El Escritorio:

🔗 Enlace de acceso: ${appUrl}
👤 Usuario: ${username}
🔑 Contraseña: ${password || '(Contraseña confidencial asignada)'}
🛡️ Rol asignado: ${role}

📌 Recuerda cambiar tu contraseña periódicamente y mantener tus credenciales en confidencialidad.`;
}
