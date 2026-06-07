interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "w-9 h-9 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  return (
    <div
      className={`
        inline-flex items-center justify-center rounded-2xl
        bg-brand-50 text-brand-700 font-bold
        ${sizeStyles[size]} ${className}
      `}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
