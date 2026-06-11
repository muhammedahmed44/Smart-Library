const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-[3px]',
};

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <div
      className={`
        ${sizes[size]}
        rounded-full
        border-parchment-300 border-t-ink-600
        dark:border-ink-600 dark:border-t-parchment-400
        animate-spin
        ${className}
      `}
      role="status"
      aria-label="Loading"
    />
  );
}