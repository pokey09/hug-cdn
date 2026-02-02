import { Cloud } from "lucide-react";
import { UploadZone } from "@/components/cdn/UploadZone";
import { FileList } from "@/components/cdn/FileList";
import { StatsBar } from "@/components/cdn/StatsBar";
import { useFileUpload } from "@/hooks/useFileUpload";

const Index = () => {
  const { files, uploadFiles, deleteFile, totalSize, completedFiles } = useFileUpload();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 glow-sm">
              <Cloud className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">CloudHost CDN</h1>
              <p className="text-xs text-muted-foreground">Fast, reliable file hosting</p>
            </div>
            <div className="ml-auto">
              <span className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20">
                Demo Mode
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Stats */}
        <section className="mb-8">
          <StatsBar totalFiles={completedFiles} totalSize={totalSize} />
        </section>

        {/* Upload Zone */}
        <section className="mb-8">
          <UploadZone onFilesSelected={uploadFiles} />
        </section>

        {/* File List */}
        <section>
          <FileList files={files} onDelete={deleteFile} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-auto">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            This is a demo. Files are not actually stored.{" "}
            <span className="text-primary">Enable Lovable Cloud</span> for real file hosting.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
