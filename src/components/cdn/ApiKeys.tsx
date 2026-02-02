import { useState } from "react";
import { Key, Plus, Trash2, Copy, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ApiKey, NewApiKey } from "@/hooks/useApiKeys";

interface ApiKeysProps {
  keys: ApiKey[];
  newlyCreatedKey: NewApiKey | null;
  onCreateKey: (name: string) => Promise<NewApiKey | null>;
  onDeleteKey: (id: string) => void;
  onDismissNewKey: () => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function ApiKeys({
  keys,
  newlyCreatedKey,
  onCreateKey,
  onDeleteKey,
  onDismissNewKey,
}: ApiKeysProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!keyName.trim()) return;
    setCreating(true);
    await onCreateKey(keyName.trim());
    setKeyName("");
    setShowCreate(false);
    setCreating(false);
  };

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">API Keys</h2>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreate(!showCreate)}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Create Key
        </Button>
      </div>

      {/* Create key form */}
      {showCreate && (
        <div className="glass rounded-lg p-4 mb-4">
          <div className="flex gap-2">
            <Input
              placeholder="Key name (e.g. Production, CI/CD)"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="bg-muted/50 border-border/50"
              autoFocus
            />
            <Button onClick={handleCreate} disabled={creating || !keyName.trim()}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      )}

      {/* Newly created key warning */}
      {newlyCreatedKey && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-yellow-400 mb-1">
                Save your API key now — it won't be shown again
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Key: <strong>{newlyCreatedKey.name}</strong>
              </p>
              <div className="flex gap-2">
                <code className="flex-1 px-3 py-2 rounded-md bg-muted/50 text-sm text-foreground break-all">
                  {newlyCreatedKey.key}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyKey(newlyCreatedKey.key)}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismissNewKey}
                className="mt-3 text-muted-foreground"
              >
                I've saved it, dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Key list */}
      {keys.length === 0 ? (
        <div className="glass rounded-lg p-8 text-center">
          <Key className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No API keys yet. Create one to access the CDN programmatically.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((k) => (
            <div
              key={k.id}
              className="glass rounded-lg p-4 flex items-center gap-4 group"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <Key className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{k.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <code className="text-xs text-muted-foreground">
                    {k.keyPreview}
                  </code>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-xs text-muted-foreground">
                    Created {formatDate(k.createdAt)}
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                  <span
                    className={cn(
                      "text-xs",
                      k.lastUsedAt
                        ? "text-green-400"
                        : "text-muted-foreground"
                    )}
                  >
                    {k.lastUsedAt
                      ? `Last used ${formatDate(k.lastUsedAt)}`
                      : "Never used"}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteKey(k.id)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
