import type { SVGProps } from 'react';

export type IconProps = {
  size?: number;
  className?: string;
} & Omit<SVGProps<SVGSVGElement>, 'width' | 'height'>;

export function TrayArrowDownIcon({ size = 18, className, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...props}
    >
      <path d="M12 3v10" className="stroke-current" strokeWidth={2} strokeLinecap="round" />
      <path d="M8 9l4 4 4-4" className="stroke-current" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 21h16v-4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4z" className="stroke-current" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

export default TrayArrowDownIcon;
