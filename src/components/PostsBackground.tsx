export default function PostsBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 hidden md:block"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-white" />

      {/* Sidebar accent only on the left */}
      <div className="absolute top-0 bottom-0 left-0 w-[10%] bg-slate-200 opacity-45" />
      <div className="absolute left-0 w-[10%] bottom-0 h-[10%] bg-slate-300 opacity-26" />
    </div>
  )
}
