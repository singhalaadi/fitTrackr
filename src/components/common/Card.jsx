export default function Card({ children, className = "", noPadding = false, ...props }) {
  return (
    <div
      className={`
        bg-surface-container-low/50 rounded-2xl transition-all duration-300
        hover:bg-surface-container-high/60
        ${noPadding ? "" : "p-6"}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>  
  );
}
