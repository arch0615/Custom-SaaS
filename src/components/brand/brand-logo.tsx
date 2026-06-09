type Size = "sm" | "md" | "lg";

const SIZE_PX: Record<Size, number> = {
  sm: 24,
  md: 32,
  lg: 40,
};

export function BrandLogo({
  size = "md",
  className,
}: {
  size?: Size;
  className?: string;
}) {
  const px = SIZE_PX[size];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={px}
      height={px}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path d="M32 6 L8 58 L18 58 L32 26 Z" fill="#0F5BFF" />
      <path d="M32 6 L56 58 L46 58 L32 26 Z" fill="#071B46" />
      <path d="M32 6 L24 22 L32 22 Z" fill="#0F5BFF" />
      <path d="M32 6 L40 22 L32 22 Z" fill="#071B46" />
      <path d="M14 38 Q 24 30 32 38 L 30 44 Q 24 38 18 44 Z" fill="#071B46" />
      <path d="M32 38 Q 40 46 50 38 L 48 44 Q 40 50 30 44 Z" fill="#0F5BFF" />
    </svg>
  );
}
