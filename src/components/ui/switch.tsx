import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-border/30 transition-all duration-300",
      "data-[state=checked]:bg-beige/90 data-[state=unchecked]:bg-foreground/10",
      "data-[state=checked]:shadow-[0_0_12px_hsl(60,56%,91%,0.3),inset_0_1px_1px_hsl(60,56%,91%,0.2)]",
      "data-[state=unchecked]:shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]",
      "backdrop-blur-xl",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:cursor-not-allowed disabled:opacity-40",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-all duration-300",
        "bg-gradient-to-b from-white/95 to-white/70",
        "shadow-[0_2px_8px_rgba(0,0,0,0.25),0_1px_2px_rgba(0,0,0,0.15)]",
        "data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-[3px]",
        "data-[state=checked]:shadow-[0_2px_8px_rgba(0,0,0,0.3),0_0_6px_hsl(60,56%,91%,0.2)]",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
