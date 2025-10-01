import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn, type EmotionalContext } from "@/lib/utils"

const cardVariants = cva(
  "rounded-2xl border bg-card text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-warmth-cream border-warmth-gold/20 shadow-soft",
        memorial: "bg-memorial-background border-memorial-secondary/30 shadow-memorial",
        celebration: "bg-celebration-background border-celebration-secondary/30 shadow-celebration",
        nostalgic: "bg-nostalgic-background border-nostalgic-secondary/30 shadow-nostalgic",
        everyday: "bg-everyday-background border-everyday-secondary/30 shadow-everyday",
        discovery: "bg-warmth-cream border-warmth-gold/20 shadow-soft",
        memory: "bg-white border-warmth-gold/30 shadow-memory hover:shadow-warm hover:scale-[1.02]",
      },
      padding: {
        none: "",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
      interactive: {
        none: "",
        hover: "hover:shadow-lg cursor-pointer",
        gentle: "hover:shadow-lg cursor-pointer transition-slow",
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      interactive: "none",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  context?: EmotionalContext
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, context, ...props }, ref) => {
    // Auto-select variant based on context
    const contextualVariant = context && !variant ? context : variant
    
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ 
          variant: contextualVariant, 
          padding, 
          interactive, 
          className 
        }))}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & { context?: EmotionalContext }
>(({ className, context, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-serif leading-none tracking-tight",
      context === 'memorial' && "text-memorial-text",
      context === 'celebration' && "text-celebration-text",
      context === 'nostalgic' && "text-nostalgic-text",
      context === 'everyday' && "text-everyday-text",
      !context && "text-depth-navy",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & { context?: EmotionalContext }
>(({ className, context, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm font-story leading-relaxed",
      context === 'memorial' && "text-memorial-secondary",
      context === 'celebration' && "text-celebration-text/80",
      context === 'nostalgic' && "text-nostalgic-text/80",
      context === 'everyday' && "text-everyday-text/80",
      !context && "text-depth-navy/70",
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }