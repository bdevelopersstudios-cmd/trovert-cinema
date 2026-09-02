import Image from "next/image";
import Link from "next/link";

/**
 * The Trovert Cinema lockup: the circular mark (same split-disc construction
 * as Trovert Space / Trovert Travellers, with a projector throwing light over
 * a row of recliners) beside the italic wordmark.
 */
export function Logo({
  size = 44,
  href = "/",
  stacked = false,
  className = "",
}: {
  size?: number;
  href?: string | null;
  stacked?: boolean;
  className?: string;
}) {
  const content = (
    <span
      className={`flex items-center gap-3 ${stacked ? "flex-col gap-2" : ""} ${className}`}
    >
      <Image
        src="/brand/icon.svg"
        alt=""
        width={size}
        height={size}
        priority
        className="rounded-full ring-1 ring-tan/25"
      />
      <span className={`leading-none ${stacked ? "text-center" : ""}`}>
        <span className="block font-display text-[1.05rem] italic font-bold tracking-wide text-cream">
          Trovert
        </span>
        <span className="block font-display text-[1.05rem] italic font-bold tracking-wide text-red-bright">
          Cinema
        </span>
      </span>
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} aria-label="Trovert Cinema home" className="inline-flex">
      {content}
    </Link>
  );
}
