import { useState, useCallback, useEffect } from "react";

export interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface NewApiKey {
  id: string;
  key: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useApiKeys(token: string | null) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<NewApiKey | null>(null);

  const loadKeys = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/keys", { headers: authHeaders(token) });
      if (res.ok) {
        setKeys(await res.json());
      }
    } catch (err) {
      console.error("Failed to load API keys:", err);
    }
  }, [token]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const createKey = useCallback(
    async (name: string): Promise<NewApiKey | null> => {
      if (!token) return null;
      try {
        const res = await fetch("/api/keys", {
          method: "POST",
          headers: { ...authHeaders(token), "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (res.ok) {
          const created: NewApiKey = await res.json();
          setNewlyCreatedKey(created);
          await loadKeys();
          return created;
        }
      } catch (err) {
        console.error("Failed to create API key:", err);
      }
      return null;
    },
    [token, loadKeys]
  );

  const deleteKey = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        const res = await fetch(`/api/keys/${id}`, {
          method: "DELETE",
          headers: authHeaders(token),
        });
        if (res.ok) {
          setKeys((prev) => prev.filter((k) => k.id !== id));
        }
      } catch (err) {
        console.error("Failed to delete API key:", err);
      }
    },
    [token]
  );

  const regenerateKey = useCallback(
    async (id: string): Promise<NewApiKey | null> => {
      if (!token) return null;
      try {
        const res = await fetch(`/api/keys/${id}/regenerate`, {
          method: "POST",
          headers: authHeaders(token),
        });
        if (res.ok) {
          const regenerated: NewApiKey = await res.json();
          setNewlyCreatedKey(regenerated);
          await loadKeys();
          return regenerated;
        }
      } catch (err) {
        console.error("Failed to regenerate API key:", err);
      }
      return null;
    },
    [token, loadKeys]
  );

  const dismissNewKey = useCallback(() => {
    setNewlyCreatedKey(null);
  }, []);

  return {
    keys,
    newlyCreatedKey,
    createKey,
    deleteKey,
    regenerateKey,
    dismissNewKey,
  };
}
