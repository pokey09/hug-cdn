import { HardDrive, FileUp, Globe, Zap } from "lucide-react";

interface StatsBarProps {
  totalFiles: number;
  totalSize: number;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function StatsBar({ totalFiles, totalSize }: StatsBarProps) {
  const stats = [
    {
      icon: FileUp,
      label: "Files Hosted",
      value: totalFiles.toString(),
    },
    {
      icon: HardDrive,
      label: "Storage Used",
      value: formatFileSize(totalSize),
    },
    {
      icon: Globe,
      label: "CDN Status",
      value: "Active",
      valueColor: "text-green-400",
    },
    {
      icon: Zap,
      label: "Edge Locations",
      value: "150+",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="glass rounded-lg p-4 flex items-center gap-3"
        >
          <div className="p-2 rounded-lg bg-primary/10">
            <stat.icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={`text-lg font-semibold ${stat.valueColor || 'text-foreground'}`}>
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
