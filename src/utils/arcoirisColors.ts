// Rainbow / Arcoíris Pantone Palette System
// Primary: #FA2400
// Secondary / Rainbow: #FFB100, #FFF300, #00D700, #2AB3FE, #008CEB, #9949E8, #282829

export const ARCOIRIS_PALETTE = {
  primary: '#FA2400',
  orange: '#FFB100',
  yellow: '#FFF300',
  green: '#00D700',
  cyan: '#2AB3FE',
  blue: '#008CEB',
  purple: '#9949E8',
  dark: '#282829',
} as const;

export const RAINBOW_COLORS = [
  { hex: '#FA2400', name: 'Rojo Arcoíris', text: 'text-white', bg: 'bg-[#FA2400]', border: 'border-[#FA2400]', lightBg: 'bg-[#FA2400]/10', hoverBg: 'hover:bg-[#d81f00]' },
  { hex: '#FFB100', name: 'Naranja Dorado', text: 'text-gray-900', bg: 'bg-[#FFB100]', border: 'border-[#FFB100]', lightBg: 'bg-[#FFB100]/15', hoverBg: 'hover:bg-[#e69f00]' },
  { hex: '#00D700', name: 'Verde Vibrante', text: 'text-gray-950', bg: 'bg-[#00D700]', border: 'border-[#00D700]', lightBg: 'bg-[#00D700]/15', hoverBg: 'hover:bg-[#00be00]' },
  { hex: '#2AB3FE', name: 'Cyan Eléctrico', text: 'text-gray-950', bg: 'bg-[#2AB3FE]', border: 'border-[#2AB3FE]', lightBg: 'bg-[#2AB3FE]/15', hoverBg: 'hover:bg-[#159de8]' },
  { hex: '#008CEB', name: 'Azul Real', text: 'text-white', bg: 'bg-[#008CEB]', border: 'border-[#008CEB]', lightBg: 'bg-[#008CEB]/15', hoverBg: 'hover:bg-[#007acc]' },
  { hex: '#9949E8', name: 'Morado Real', text: 'text-white', bg: 'bg-[#9949E8]', border: 'border-[#9949E8]', lightBg: 'bg-[#9949E8]/15', hoverBg: 'hover:bg-[#8338d1]' },
];

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; hex: string }> = {
  todos: { bg: 'bg-[#FA2400]', text: 'text-white', border: 'border-[#FA2400]', hex: '#FA2400' },
  escolares: { bg: 'bg-[#FFB100]', text: 'text-gray-950', border: 'border-[#FFB100]', hex: '#FFB100' },
  papelería: { bg: 'bg-[#008CEB]', text: 'text-white', border: 'border-[#008CEB]', hex: '#008CEB' },
  papeleria: { bg: 'bg-[#008CEB]', text: 'text-white', border: 'border-[#008CEB]', hex: '#008CEB' },
  oficina: { bg: 'bg-[#9949E8]', text: 'text-white', border: 'border-[#9949E8]', hex: '#9949E8' },
  'arte y dibujo': { bg: 'bg-[#00D700]', text: 'text-gray-950', border: 'border-[#00D700]', hex: '#00D700' },
  arte: { bg: 'bg-[#00D700]', text: 'text-gray-950', border: 'border-[#00D700]', hex: '#00D700' },
  tecnología: { bg: 'bg-[#2AB3FE]', text: 'text-gray-950', border: 'border-[#2AB3FE]', hex: '#2AB3FE' },
  tecnologia: { bg: 'bg-[#2AB3FE]', text: 'text-gray-950', border: 'border-[#2AB3FE]', hex: '#2AB3FE' },
  servicios: { bg: 'bg-[#FA2400]', text: 'text-white', border: 'border-[#FA2400]', hex: '#FA2400' },
  default: { bg: 'bg-[#008CEB]', text: 'text-white', border: 'border-[#008CEB]', hex: '#008CEB' },
};

export function getCategoryColor(category?: string) {
  if (!category) return CATEGORY_COLORS.default;
  const key = category.toLowerCase().trim();
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
}

// Deterministic vibrant color for any item based on its ID or index
export function getProductColorTheme(id: string, index?: number) {
  let hash = 0;
  if (typeof index === 'number') {
    hash = index;
  } else {
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
  }
  const colorIndex = Math.abs(hash) % RAINBOW_COLORS.length;
  return RAINBOW_COLORS[colorIndex];
}
