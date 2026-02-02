import { Cloud } from "lucide-react";
import { UploadZone } from "@/components/cdn/UploadZone";
import { FileList } from "@/components/cdn/FileList";
import { StatsBar } from "@/components/cdn/StatsBar";
import { useFileUpload } from "@/hooks/useFileUpload";

const Index = () => {
  const { files, uploadFiles, deleteFile, stats } = useFileUpload();

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
        <section>
          <FileList files={files} onDelete={deleteFile} />
        </section>
      </main>

    </div>
  );
};

export default Index;
