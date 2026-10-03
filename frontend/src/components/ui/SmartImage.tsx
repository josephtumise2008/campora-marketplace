import { useState, type ImgHTMLAttributes } from "react";
import { cx, initials } from "../../utils/format";
import { assetUrl } from "../../services/api";

interface SmartImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  alt: string;
  /** Text used to build an initials placeholder when the image is missing. */
  fallbackLabel?: string;
  ratio?: "square" | "card" | "wide" | "hero";
  className?: string;
}

/**
 * Image with a graceful fallback. Seeded records can reference artwork that
 * does not exist (some stores ship without a logo), so we never render a
 * broken image — we swap in an initials tile instead.
 */
export function SmartImage({
  src,
  alt,
  fallbackLabel,
  ratio,
  className,
  loading = "lazy",
  ...rest
}: SmartImageProps) {
  const [failed, setFailed] = useState(false);
  const [lastSrc, setLastSrc] = useState(src);

  // A new `src` deserves a fresh attempt, so clear the error flag during render
  // rather than in an effect.
  if (lastSrc !== src) {
    setLastSrc(src);
    if (failed) setFailed(false);
  }

  // Seller uploads are served by the API, bundled artwork by the app itself.
  const resolved = assetUrl(src);
  const showPlaceholder = !resolved || failed;

  return (
    <span className={cx("smart-image", ratio && `smart-image--${ratio}`, className)}>
      {showPlaceholder ? (
        <span className="smart-image__placeholder" aria-hidden="true">
          {initials(fallbackLabel || alt)}
        </span>
      ) : (
        <img
          src={resolved}
          alt={alt}
          loading={loading}
          decoding="async"
          onError={() => setFailed(true)}
          {...rest}
        />
      )}
    </span>
  );
}

interface StoreLogoProps {
  logo?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  rounded?: boolean;
}

export function StoreLogo({ logo, name, size = "md", className, rounded }: StoreLogoProps) {
  return (
    <SmartImage
      src={logo || undefined}
      alt={`${name} logo`}
      fallbackLabel={name}
      loading="lazy"
      className={cx("store-logo", `store-logo--${size}`, rounded && "store-logo--round", className)}
    />
  );
}

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, name, size = 36, className }: AvatarProps) {
  return (
    <span
      className={cx("avatar", className)}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.38) }}
    >
      <SmartImage src={src || undefined} alt={`${name} avatar`} fallbackLabel={name} />
    </span>
  );
}
