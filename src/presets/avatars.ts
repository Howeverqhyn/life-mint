import presets from "../../assets/avatars/presets.json";

export type PresetAvatar = {
  id: string;
  name: string;
  url: string;
};

export const PRESET_AVATARS: PresetAvatar[] = presets.map((preset) => ({
  id: preset.id,
  name: preset.name,
  url: `https://api.dicebear.com/9.x/notionists/png?seed=${encodeURIComponent(preset.seed)}&backgroundColor=${preset.backgroundColor}&radius=50&size=160`,
}));
