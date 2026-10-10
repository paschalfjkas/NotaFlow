import Image from "next/image";
import { cn } from "cn";

/**
 * The NotaFlow wordmark. The mark gets a slow, continuous glow pulse (the
 * "flow") plus a quicker scale-up on hover — see `.animate-logo-pulse` in
 * globals.css. Respects prefers-reduced-motion.
 */
export function Logo({
  size = 28,
  showWordmark = true,
  className,
  textClassName,
}: {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/images/logo.webp"
        alt="NotaFlow"
        width={size}
        height={size}
        priority
        className="animate-logo-pulse shrink-0 transition-transform duration-300 ease-out hover:scale-110"
      />
      {showWordmark && (
        <span
          className={cn(
            "text-base font-semibold tracking-tight text-indigo-700 dark:text-indigo-400",
            textClassName
          )}
        >
          NotaFlow
        </span>
      )}
    </span>
  );
}
