export function ShortcutBadge({ keys }: { keys: string }) {
  return (
    <kbd className="ml-1.5 inline-flex shrink-0 items-center rounded border border-slate-200/90 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-medium leading-none text-brand-primary-muted">
      {keys}
    </kbd>
  );
}
