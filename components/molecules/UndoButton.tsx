"use client";

import { forwardRef } from "react";
import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UndoButtonProps extends React.ComponentProps<typeof Button> {
  count?: number;
  canUndo?: boolean;
}

const UndoButton = forwardRef<HTMLButtonElement, UndoButtonProps>(
  ({ className, count = 0, canUndo = true, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="outline"
        size="sm"
        disabled={!canUndo}
        className={cn("relative gap-2", className)}
        {...props}
      >
        <Undo2 className="size-4" />
        <span>Undo</span>
        {count > 0 && (
          <span className="absolute -top-2 -right-2 size-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Button>
    );
  }
);

UndoButton.displayName = "UndoButton";

export { UndoButton };
export type { UndoButtonProps };
