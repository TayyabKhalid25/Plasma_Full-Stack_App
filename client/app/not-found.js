import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-plasma-bg text-center px-6 selection:bg-plasma-primary selection:text-white">
      {/* Glow effect */}
      <div className="absolute w-[400px] h-[400px] bg-plasma-primary/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Large 404 */}
      <h1 className="relative font-display font-bold text-[120px] md:text-[180px] leading-none bg-primary-gradient bg-clip-text text-transparent tracking-tight">
        404
      </h1>

      <h2 className="font-display font-bold text-2xl md:text-3xl text-plasma-text-primary mt-4">
        Lost in the Void
      </h2>

      <p className="font-sans text-plasma-text-secondary text-base md:text-lg max-w-md mt-3 leading-relaxed">
        This page doesn&apos;t exist, or it was consumed by the void between gaming sessions.
      </p>

      <div className="flex gap-4 mt-10">
        <Link
          href="/"
          className="px-8 py-3 rounded-full bg-primary-gradient text-white font-sans font-bold text-sm shadow-card-glow hover:scale-[1.05] transition-transform"
        >
          Go Home
        </Link>

      </div>
    </div>
  );
}
