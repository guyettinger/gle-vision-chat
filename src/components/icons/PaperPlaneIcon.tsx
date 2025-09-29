import type { SVGProps } from 'react';
import type { IconProps as BaseIconProps } from './TrayArrowDownIcon';

export type IconProps = BaseIconProps;

export function PaperPlaneIcon({ size = 18, className, ...props }: IconProps) {
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
      <path d="M22 2L11 13" className="stroke-current" strokeWidth={2} strokeLinecap="round" />
      <path
        d="M22 2l-7 20-4-9-9-4 20-7z"
        className="stroke-current"
        strokeWidth={2}
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.15"
      />
    </svg>
  );
}

export default PaperPlaneIcon;
