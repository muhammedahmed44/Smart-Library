export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-parchment-100 dark:bg-ink-800 flex items-center justify-center text-parchment-400 dark:text-ink-500">
          {icon}
        </div>
      )}
      <div>
        <h3 className="font-serif text-lg text-ink-700 dark:text-parchment-200 mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-ink-400 dark:text-ink-500 max-w-xs">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}