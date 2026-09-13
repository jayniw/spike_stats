import { forwardRef } from "react";
import { type LucideIcon, type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconProps extends LucideProps {
  icon: LucideIcon;
  size?: "xs" | "sm" | "md" | "lg";
}

const sizeClasses = {
  xs: "size-3",
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
};

const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ icon: LucideIcon, size = "md", className, ...props }, ref) => {
    return (
      <LucideIcon
        ref={ref}
        className={cn(sizeClasses[size], className)}
        {...props}
      />
    );
  }
);

Icon.displayName = "Icon";

export { Icon };
export type { IconProps };
