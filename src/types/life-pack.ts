export type LifePack = {
  id: string;
  name: string;
  persona: {
    voice: string;
    traits: string[];
    relationship: string;
    taboos?: string[];
    systemPrompt: string;
  };
  avatarUrl: string;
  memoryPolicy: {
    remember: string[];
    forget: string[];
    decayDays?: number;
  };
  opening: string;
  facts: { id: string; text: string; salience?: number; createdAt: string }[];
  diary: { id: string; date: string; text: string }[];
  createdAt: string;
  updatedAt: string;
};
