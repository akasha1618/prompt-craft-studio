import * as React from "react"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className = "", variant = "default", children, ...props }: BadgeProps) {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
  
  const variantClasses = {
    default: "bg-blue-100 text-blue-800 border border-blue-200",
    secondary: "bg-gray-100 text-gray-800 border border-gray-200", 
    destructive: "bg-red-100 text-red-800 border border-red-200",
    outline: "bg-transparent text-gray-700 border border-gray-300"
  }
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

export { Badge } 