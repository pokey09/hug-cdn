import { Cloud, ArrowLeft, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function CodeBlock({ children, lang }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg bg-muted/50 border border-border/30">
      <Button
        variant="ghost"
        size="icon"
        onClick={copy}
        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </Button>
      {lang && (
        <div className="px-4 py-1.5 text-xs text-muted-foreground border-b border-border/30">
          {lang}
        </div>
      )}
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm text-foreground">{children}</code>
      </pre>
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-green-500/10 text-green-400 border-green-500/20",
    POST: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    PATCH: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span
      className={cn(
        "px-2 py-0.5 text-xs font-mono font-semibold rounded border",
        colors[method] || "bg-muted text-foreground"
      )}
    >
      {method}
    </span>
  );
}

interface Endpoint {
  method: string;
  path: string;
  description: string;
  auth: boolean;
  requestBody?: string;
  responseBody: string;
  curl: string;
}

const BASE_URL = "https://cdn.theboyshost.site";

const endpoints: Endpoint[] = [
  {
    method: "POST",
    path: "/api/upload",
    description: "Upload one or more files to the CDN. Files are sent as multipart form data under the 'files' field.",
    auth: true,
    responseBody: `[
  {
    "id": "a1b2c3d4-...",
    "name": "photo.jpg",
    "size": 204800,
    "type": "image/jpeg",
    "uploadedAt": "2026-02-02T12:00:00.000Z",
    "cdnUrl": "/cdn/a1b2c3d4-.../photo.jpg"
  }
]`,
    curl: `curl -X POST ${BASE_URL}/api/upload \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -F "files=@photo.jpg" \\
  -F "files=@document.pdf"`,
  },
  {
    method: "GET",
    path: "/api/files",
    description: "List all files currently stored on the CDN with their metadata and download URLs.",
    auth: true,
    responseBody: `[
  {
    "id": "a1b2c3d4-...",
    "name": "photo.jpg",
    "size": 204800,
    "type": "image/jpeg",
    "uploadedAt": "2026-02-02T12:00:00.000Z",
    "cdnUrl": "/cdn/a1b2c3d4-.../photo.jpg"
  }
]`,
    curl: `curl ${BASE_URL}/api/files \\
  -H "X-API-Key: YOUR_API_KEY"`,
  },
  {
    method: "PATCH",
    path: "/api/files/:id",
    description: "Rename a file. Updates the file's display name and CDN URL. The stored file on disk is unchanged.",
    auth: true,
    requestBody: `{ "name": "new-filename.jpg" }`,
    responseBody: `{
  "success": true,
  "name": "new-filename.jpg",
  "cdnUrl": "/cdn/a1b2c3d4-.../new-filename.jpg"
}`,
    curl: `curl -X PATCH ${BASE_URL}/api/files/a1b2c3d4-... \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "new-filename.jpg"}'`,
  },
  {
    method: "DELETE",
    path: "/api/files/:id",
    description: "Delete a file from the CDN by its ID. This removes both the file from storage and its metadata.",
    auth: true,
    responseBody: `{ "success": true }`,
    curl: `curl -X DELETE ${BASE_URL}/api/files/a1b2c3d4-... \\
  -H "X-API-Key: YOUR_API_KEY"`,
  },
  {
    method: "POST",
    path: "/api/keys-regenerate/:id",
    description: "Regenerate an API key. Replaces the existing key value with a new one. The old key immediately stops working.",
    auth: true,
    responseBody: `{
  "id": "a1b2c3d4-...",
  "key": "cdn_new_generated_key_here",
  "name": "Production"
}`,
    curl: `curl -X POST ${BASE_URL}/api/keys-regenerate/a1b2c3d4-... \\
  -H "X-API-Key: YOUR_API_KEY"`,
  },
  {
    method: "GET",
    path: "/api/stats",
    description: "Get CDN statistics including total files, storage used, bandwidth served, and request count.",
    auth: true,
    responseBody: `{
  "totalFiles": 42,
  "totalSize": 1073741824,
  "totalBandwidth": 5368709120,
  "totalRequests": 1250,
  "uptime": 86400000,
  "status": "Active"
}`,
    curl: `curl ${BASE_URL}/api/stats \\
  -H "X-API-Key: YOUR_API_KEY"`,
  },
  {
    method: "GET",
    path: "/cdn/:id/:filename",
    description: "Download or view a file. This is the public CDN endpoint — no authentication required. Use the cdnUrl from the upload or list response.",
    auth: false,
    responseBody: "(raw file contents with appropriate Content-Type header)",
    curl: `curl ${BASE_URL}/cdn/a1b2c3d4-.../photo.jpg -o photo.jpg`,
  },
];

const ApiDocs = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <div className="p-2 rounded-lg bg-primary/10 glow-sm">
              <Cloud className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">API Documentation</h1>
              <p className="text-xs text-muted-foreground">CloudHost CDN REST API</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Intro */}
        <section className="mb-10">
          <p className="text-muted-foreground leading-relaxed">
            The CloudHost CDN API lets you upload, manage, and serve files programmatically.
            All API requests use JSON and standard HTTP methods.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Base URL: <code className="px-2 py-0.5 rounded bg-muted/50 text-foreground">{BASE_URL}</code>
          </p>
        </section>

        {/* Authentication */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4">Authentication</h2>
          <div className="glass rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-4">
              All API endpoints (except file serving) require authentication via an API key.
              Include your key in the <code className="px-1.5 py-0.5 rounded bg-muted/50 text-foreground">X-API-Key</code> header.
            </p>
            <CodeBlock lang="bash">{`curl ${BASE_URL}/api/files \\
  -H "X-API-Key: cdn_your_api_key_here"`}</CodeBlock>
            <p className="text-xs text-muted-foreground mt-4">
              Create API keys from the dashboard. Keys are shown only once on creation — store them securely.
            </p>
          </div>
        </section>

        {/* Endpoints */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4">Endpoints</h2>
          <div className="space-y-6">
            {endpoints.map((ep, i) => (
              <div key={i} className="glass rounded-lg overflow-hidden">
                {/* Endpoint header */}
                <div className="px-6 py-4 border-b border-border/30 flex items-center gap-3">
                  <MethodBadge method={ep.method} />
                  <code className="text-sm font-medium text-foreground">{ep.path}</code>
                  {!ep.auth && (
                    <span className="px-2 py-0.5 text-xs rounded bg-green-500/10 text-green-400 border border-green-500/20">
                      Public
                    </span>
                  )}
                  {ep.auth && (
                    <span className="px-2 py-0.5 text-xs rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                      Auth Required
                    </span>
                  )}
                </div>

                <div className="px-6 py-4 space-y-4">
                  <p className="text-sm text-muted-foreground">{ep.description}</p>

                  {/* Request body */}
                  {ep.requestBody && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Request Body</p>
                      <CodeBlock lang="json">{ep.requestBody}</CodeBlock>
                    </div>
                  )}

                  {/* curl example */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Example</p>
                    <CodeBlock lang="bash">{ep.curl}</CodeBlock>
                  </div>

                  {/* Response */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Response</p>
                    <CodeBlock lang="json">{ep.responseBody}</CodeBlock>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Error Responses */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4">Error Responses</h2>
          <div className="glass rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Errors return a JSON object with an <code className="px-1.5 py-0.5 rounded bg-muted/50 text-foreground">error</code> field.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex gap-4">
                <code className="text-red-400 shrink-0">401</code>
                <span className="text-muted-foreground">Missing or invalid API key</span>
              </div>
              <div className="flex gap-4">
                <code className="text-red-400 shrink-0">404</code>
                <span className="text-muted-foreground">File or resource not found</span>
              </div>
              <div className="flex gap-4">
                <code className="text-red-400 shrink-0">400</code>
                <span className="text-muted-foreground">Invalid request (e.g. missing required fields)</span>
              </div>
            </div>
            <CodeBlock lang="json">{`{ "error": "Unauthorized" }`}</CodeBlock>
          </div>
        </section>

        {/* Rate Limits */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4">Limits</h2>
          <div className="glass rounded-lg p-6">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Max file size</span>
                <span className="text-foreground font-medium">100 MB</span>
              </div>
              <div className="flex justify-between">
                <span>Max files per upload</span>
                <span className="text-foreground font-medium">20</span>
              </div>
              <div className="flex justify-between">
                <span>Supported file types</span>
                <span className="text-foreground font-medium">Any</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ApiDocs;
