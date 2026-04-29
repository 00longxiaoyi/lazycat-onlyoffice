type SvgIconProps = {
  svg: string;
  className?: string;
  title?: string;
};

export function SvgIcon({ svg, className = '', title }: SvgIconProps) {
  return (
    <span
      className={`svg-icon${className ? ` ${className}` : ''}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
