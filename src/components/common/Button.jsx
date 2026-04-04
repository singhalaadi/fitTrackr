import React from "react";

const variants = {
  primary: "bg-gradient-to-br from-primary to-primary-container text-on-primary hover:opacity-90",
  secondary: "bg-surface-variant/40 text-on-background border border-outline-variant hover:bg-surface-variant/60",
  ghost: "bg-transparent text-on-background hover:bg-white/5",
};

export default function Button({ children, onClick, variant = "primary", className = "", size = "md", ...props }) {
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg font-bold",
  };

  return (
    <button
      onClick={onClick}
      className={`
        relative inline-flex items-center justify-center rounded-full transition-all duration-200 
        active:scale-95 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} 
        ${sizeClasses[size]} 
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
