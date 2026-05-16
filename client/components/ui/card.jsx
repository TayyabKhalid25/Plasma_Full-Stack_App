import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Card Component
 * @component
 * @param {object} props
 */
const Card = React.forwardRef(({ className, wrapperClassName, ...props }, ref) => (
  <div className={cn("relative group w-full h-full transition-all duration-700", wrapperClassName)}>
    {/* The glow effect matching the Pulse Dashboard */}
    <div className="absolute -inset-8 bg-[#ff2a7a00] rounded-[3rem] blur-[40px] opacity-0 group-hover:opacity-100 group-hover:bg-[#ff2a7a22] transition-all duration-700 pointer-events-none z-0" />
    
    <div
      ref={ref}
      className={cn(
        "relative z-10 h-full rounded-xl border bg-card text-card-foreground shadow transition-all duration-700",
        className
      )}
      {...props}
    />
  </div>
));
Card.displayName = "Card";

/**
 * CardHeader Component
 * @component
 * @param {object} props
 */
const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/**
 * CardTitle Component
 * @component
 * @param {object} props
 */
const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

/**
 * CardDescription Component
 * @component
 * @param {object} props
 */
const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/**
 * CardContent Component
 * @component
 * @param {object} props
 */
const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

/**
 * CardFooter Component
 * @component
 * @param {object} props
 */
const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
