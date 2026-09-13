import { forwardRef } from "react";
import { Button as UIButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Fundamental } from "@/src/types/volleyball";

interface ButtonProps extends React.ComponentProps<typeof UIButton> {
  fundamental?: Fundamental;
}

const fundamentalColors: Record<Fundamental, string> = {
  serve: "bg-blue-500 hover:bg-blue-600 text-white",
  reception: "bg-green-500 hover:bg-green-600 text-white",
  attack: "bg-red-500 hover:bg-red-600 text-white",
  block: "bg-purple-500 hover:bg-purple-600 text-white",
  set: "bg-orange-500 hover:bg-orange-600 text-white",
  defense: "bg-teal-500 hover:bg-teal-600 text-white",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, fundamental, variant, ...props }, ref) => {
    if (fundamental) {
      return (
        <UIButton
          ref={ref}
          className={cn(fundamentalColors[fundamental], className)}
          {...props}
        />
      );
    }

    return (
      <UIButton ref={ref} variant={variant} className={className} {...props} />
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };
