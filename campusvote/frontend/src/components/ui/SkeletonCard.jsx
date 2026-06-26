export default function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="shimmer h-3 w-16 rounded mb-4" />
      <div className="shimmer h-5 w-3/4 rounded mb-2" />
      <div className="shimmer h-4 w-1/2 rounded mb-6" />
      <div className="shimmer h-3 w-2/3 rounded" />
    </div>
  );
}
