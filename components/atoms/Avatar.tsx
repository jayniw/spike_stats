import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  jerseyNumber?: number;
  name?: string;
  size?: "sm" | "md" | "lg";
  isServing?: boolean;
}

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
};

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, jerseyNumber, name, size = "md", isServing, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-center justify-center rounded-full bg-muted font-medium",
          sizeClasses[size],
          isServing && "ring-2 ring-primary ring-offset-2",
          className
        )}
        title={name}
        {...props}
      >
        {jerseyNumber ?? "?"}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export { Avatar };
export type { AvatarProps };
