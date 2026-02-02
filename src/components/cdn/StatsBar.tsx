import { HardDrive, FileUp, Globe, Activity } from "lucide-react";
import type { CdnStats } from "@/hooks/useFileUpload";

interface StatsBarProps {
  stats: CdnStats;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function StatsBar({ stats }: StatsBarProps) {
  const statItems = [
    {
      icon: FileUp,
      label: "Files Hosted",
      value: stats.totalFiles.toString(),
    },
    {
      icon: HardDrive,
      label: "Storage Used",
      value: formatFileSize(stats.totalSize),
    },
    {
      icon: Activity,
      label: "Bandwidth Served",
      value: formatFileSize(stats.totalBandwidth),
    },
    {
      icon: Globe,
      label: "Total Requests",
      value: stats.totalRequests.toLocaleString(),
      valueColor: stats.totalRequests > 0 ? "text-green-400" : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((stat) => (
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
