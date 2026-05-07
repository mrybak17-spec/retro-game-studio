// Bot player helpers - generates colored avatars for bots
export const BOT_COLORS = ['#1e88e5', '#e53935', '#43a047', '#fdd835']; // blue, red, green, yellow
export const BOT_COLOR_NAMES = ['Blue', 'Red', 'Green', 'Yellow'];

export const generateBotAvatar = (color: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="${color}"/><circle cx="32" cy="24" r="10" fill="rgba(255,255,255,0.9)"/><rect x="14" y="38" width="36" height="22" rx="4" fill="rgba(255,255,255,0.9)"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const getBotByIndex = (index: number) => ({
  color: BOT_COLORS[index % BOT_COLORS.length],
  name: `Bot ${BOT_COLOR_NAMES[index % BOT_COLOR_NAMES.length]}`,
  drawing: generateBotAvatar(BOT_COLORS[index % BOT_COLORS.length]),
});
