interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: {
    frame: "h-9 w-[168px]",
    scale: 3.45,
    sizes: "168px",
    title: "text-base",
    subtitle: "text-[10px]",
  },
  md: {
    frame: "h-11 w-[208px]",
    scale: 3.5,
    sizes: "208px",
    title: "text-lg",
    subtitle: "text-[11px]",
  },
  lg: {
    frame: "h-14 w-[286px]",
    scale: 3.55,
    sizes: "286px",
    title: "text-xl",
    subtitle: "text-xs",
  },
} as const;

export default function BrandLogo({
  size = "md",
  showText = false,
  className = "",
}: BrandLogoProps) {
  const selected = sizeMap[size];

  return (
    <div
      className={`inline-flex shrink-0 items-center ${showText ? "gap-2" : "gap-0"} ${className}`}
      aria-label="HisabBadi"
    >
      <span
        className={`relative overflow-hidden ${selected.frame}`}
        aria-hidden
      >
        <img
          src="/hisabbadilogo.png"
          alt="HisabBadi"
          className={`brand-logo-img brand-logo-img-${size} h-full w-full object-contain object-center`}
          sizes={selected.sizes}
          decoding="async"
          loading={size === "lg" ? "eager" : "lazy"}
          crossOrigin="anonymous"
        />
      </span>
      {showText ? (
        <span className="leading-tight">
          <span
            className={`block font-extrabold text-slate-900 ${selected.title}`}
          >
            HisabBadi
          </span>
          <span
            className={`block font-medium text-slate-500 ${selected.subtitle}`}
          >
            Mandi Receipt
          </span>
        </span>
      ) : null}
    </div>
  );
}
