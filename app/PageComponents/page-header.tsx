type PageHeaderProps = {
  title: string;
  description?: string;
  className?: string;
};
export const PageHeader = ({
  title,
  description,
  className = "",
}: PageHeaderProps) => {
  return (
    <div className={`space-y-2 pb-4 ${className}`}>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {description && (
        <p className="text-lg text-muted-foreground">{description}</p>
      )}
    </div>
  );
};
