import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

const BUNDLED_IMAGES = import.meta.glob<string>(
  '/src/assets/images/*.{jpg,jpeg,png,webp}',
  { eager: true, import: 'default' }
);

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function SafeImage({ src, alt, className = '' }: SafeImageProps) {
  const resolvedSrc = BUNDLED_IMAGES[src] ?? src;
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [resolvedSrc]);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-teal-50/60 to-slate-100 text-teal-800 p-4 text-center ${className}`}
      >
        <Activity className="w-8 h-8 mb-2 text-teal-700" aria-hidden="true" />
        <span className="text-xs font-medium text-slate-600 max-w-[22ch]">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
