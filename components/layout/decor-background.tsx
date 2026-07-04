export function DecorBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-[#ddd6fe]/40 blur-3xl" />
      <div className="absolute bottom-20 left-1/3 h-56 w-56 rounded-full bg-[#fbcfe8]/30 blur-3xl" />
    </div>
  );
}
