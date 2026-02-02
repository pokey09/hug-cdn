import { Cloud, LogOut, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { UploadZone } from "@/components/cdn/UploadZone";
import { FileList } from "@/components/cdn/FileList";
import { StatsBar } from "@/components/cdn/StatsBar";
import { ApiKeys } from "@/components/cdn/ApiKeys";
import { LoginPage } from "@/components/cdn/LoginPage";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useApiKeys } from "@/hooks/useApiKeys";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { token, isAuthenticated, checking, login, logout } = useAuth();
  const { files, uploadFiles, deleteFile, renameFile, stats } = useFileUpload(token);
  const { keys, newlyCreatedKey, createKey, deleteKey, regenerateKey, dismissNewKey } = useApiKeys(token);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 glow-sm">
                <Cloud className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">CloudHost CDN</h1>
                <p className="text-xs text-muted-foreground">Fast, reliable file hosting</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-muted-foreground hover:text-foreground gap-1.5"
              >
                <Link to="/docs">
                  <BookOpen className="w-4 h-4" />
                  API Docs
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Stats */}
        <section className="mb-8">
          <StatsBar stats={stats} />
        </section>

        {/* Upload Zone */}
        <section className="mb-8">
          <UploadZone onFilesSelected={uploadFiles} />
        </section>

        {/* File List */}
        <section className="mb-8">
          <FileList files={files} onDelete={deleteFile} onRename={renameFile} />
        </section>

        {/* API Keys */}
        <section>
          <ApiKeys
            keys={keys}
            newlyCreatedKey={newlyCreatedKey}
            onCreateKey={createKey}
            onDeleteKey={deleteKey}
            onRegenerateKey={regenerateKey}
            onDismissNewKey={dismissNewKey}
          />
        </section>
      </main>
    </div>
  );
};

export default Index;
