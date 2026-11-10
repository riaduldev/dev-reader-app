export function CurrentDate({ className }: { className?: string }) {
  const label = new Intl.DateTimeFormat("bn-BD", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <span className={className} suppressHydrationWarning>
      {label}
    </span>
  );
}
