import type { SVGProps } from 'react';
import type { IconProps as BaseIconProps } from './TrayArrowDownIcon';

export type IconProps = BaseIconProps;

export function TrashIcon({ size = 18, className, ...props }: IconProps) {
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
      <path d="M3 6h18" className="stroke-current" strokeWidth={2} strokeLinecap="round" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" className="stroke-current" strokeWidth={2} strokeLinecap="round" />
      <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" className="stroke-current" strokeWidth={2} />
      <path d="M10 11v6M14 11v6" className="stroke-current" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export default TrashIcon;
