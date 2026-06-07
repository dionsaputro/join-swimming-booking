import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mb-4">
        <Icon size={28} className="text-primary" />
      </div>
      <h3 className="text-base font-medium text-text-primary mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted">{description}</p>
      )}
    </div>
  );
}
