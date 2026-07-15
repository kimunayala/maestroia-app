export default function LoadingSkeleton() {
  return (
    <div className="mt-8 space-y-3 animate-fade-in-up">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-12 rounded-lg bg-charcoal border border-white/5 overflow-hidden relative"
        >
          <div className="absolute inset-0 shimmer" />
        </div>
      ))}
    </div>
  );
}
