import { cn } from "@/lib/utils";

interface DashboardSubheaderProps {
  heading: string;
  text?: string;
  children?: React.ReactNode;
  className?: string;
}

export function DashboardSubheader({
  heading,
  text,
  children,
  className,
}: DashboardSubheaderProps) {
  return (
    <div className={cn("flex flex-col items-start gap-2 px-2 mb-4 mt-6", className)}>
      <div className="grid gap-1">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          {heading}
        </h2>
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
      {children}
    </div>
  );
}