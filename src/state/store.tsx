import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { DEFAULT_BASE_URL } from "@/config";
import type { ChatMessage } from "@/types/chat";
import type { LifePack } from "@/types/life-pack";

const STORAGE_KEY = "life-mint.v1";

type Settings = {
  baseUrl: string;
};

type Persisted = {
  lifePack: LifePack | null;
  settings: Settings;
  messages: ChatMessage[];
};

type LifeStoreValue = {
  ready: boolean;
  lifePack: LifePack | null;
  settings: Settings;
  messages: ChatMessage[];
  setBaseUrl: (baseUrl: string) => Promise<void>;
  saveLifePack: (lifePack: LifePack) => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  appendMessages: (messages: ChatMessage[]) => Promise<void>;
  clearMessages: () => Promise<void>;
  resetLocal: () => Promise<void>;
};

const initial: Persisted = {
  lifePack: null,
  settings: { baseUrl: DEFAULT_BASE_URL },
  messages: [],
};

const LifeStoreContext = createContext<LifeStoreValue | null>(null);

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as ChatMessage;
  return (
    typeof message.id === "string" &&
    (message.role === "user" || message.role === "life") &&
    typeof message.text === "string" &&
    typeof message.createdAt === "string"
  );
}

function isLifePack(value: unknown): value is LifePack {
  if (!value || typeof value !== "object") return false;
  const pack = value as LifePack;
  return (
    typeof pack.id === "string" &&
    typeof pack.name === "string" &&
    typeof pack.avatarUrl === "string" &&
    typeof pack.opening === "string" &&
    Boolean(pack.persona) &&
    typeof pack.persona.systemPrompt === "string" &&
    typeof pack.persona.relationship === "string" &&
    Array.isArray(pack.facts) &&
    Array.isArray(pack.diary)
  );
}

function readPersisted(raw: string): Persisted {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") return initial;
  const data = parsed as Partial<Persisted>;
  const baseUrl = data.settings?.baseUrl?.trim();
  return {
    lifePack: isLifePack(data.lifePack) ? data.lifePack : null,
    settings: { baseUrl: baseUrl || DEFAULT_BASE_URL },
    messages: Array.isArray(data.messages) ? data.messages.filter(isChatMessage) : [],
  };
}

export function LifeStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(initial);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(initial);

  const persist = useCallback(async (next: Persisted) => {
    stateRef.current = next;
    setState(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw) {
          const next = readPersisted(raw);
          stateRef.current = next;
          setState(next);
        }
      } catch (error) {
        console.warn("life-mint: failed to read local store", error);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setBaseUrl = useCallback(
    async (baseUrl: string) => {
      const current = stateRef.current;
      await persist({
        ...current,
        settings: { baseUrl: baseUrl.trim().replace(/\/$/, "") || DEFAULT_BASE_URL },
      });
    },
    [persist],
  );

  const saveLifePack = useCallback(
    async (lifePack: LifePack) => {
      await persist({ ...stateRef.current, lifePack, messages: [] });
    },
    [persist],
  );

  const updateAvatar = useCallback(
    async (avatarUrl: string) => {
      const current = stateRef.current;
      if (!current.lifePack) return;
      await persist({
        ...current,
        lifePack: {
          ...current.lifePack,
          avatarUrl,
          updatedAt: new Date().toISOString(),
        },
      });
    },
    [persist],
  );

  const appendMessages = useCallback(
    async (messages: ChatMessage[]) => {
      const current = stateRef.current;
      await persist({ ...current, messages: [...current.messages, ...messages] });
    },
    [persist],
  );

  const clearMessages = useCallback(async () => {
    await persist({ ...stateRef.current, messages: [] });
  }, [persist]);

  const resetLocal = useCallback(async () => {
    await persist({
      lifePack: null,
      messages: [],
      settings: stateRef.current.settings,
    });
  }, [persist]);

  const value = useMemo<LifeStoreValue>(
    () => ({
      ready,
      lifePack: state.lifePack,
      settings: state.settings,
      messages: state.messages,
      setBaseUrl,
      saveLifePack,
      updateAvatar,
      appendMessages,
      clearMessages,
      resetLocal,
    }),
    [
      ready,
      state,
      setBaseUrl,
      saveLifePack,
      updateAvatar,
      appendMessages,
      clearMessages,
      resetLocal,
    ],
  );

  return <LifeStoreContext.Provider value={value}>{children}</LifeStoreContext.Provider>;
}

export function useLifeStore(): LifeStoreValue {
  const value = useContext(LifeStoreContext);
  if (!value) {
    throw new Error("useLifeStore must be used within LifeStoreProvider");
  }
  return value;
}
