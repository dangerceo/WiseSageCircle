import { Feather } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Feather className="h-6 w-6 text-primary" />
      <span className="font-bold text-lg">Sage by My Side</span>
    </div>
  );
}