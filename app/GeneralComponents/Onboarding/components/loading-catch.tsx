import { Loader2, LucideIcon } from "lucide-react";

interface LoadingCatchProps {
  message?: string;
  secondaryMessage?: string;
  icon?: LucideIcon;
  className?: string;
}

const LoadingCatch = ({
  message,
  secondaryMessage,
  icon,
  className = "",
}: LoadingCatchProps) => {
  const Icon = icon;
  return (
    <div className="space-y-2">
      {icon ? (
        <Icon />
      ) : (
        <Loader2
          className={`animate-spin cursor-wait h-12 w-12 ${className}`}
        />
      )}
      {message && <p className="p-2 bg-muted/50">{message}</p>}
      {message && <p className="p-2 bg-muted/50 italic">{secondaryMessage}</p>}
    </div>
  );
};

export default LoadingCatch;
