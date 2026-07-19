import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-obsidian px-6 text-center">
      <p className="eyebrow mb-4">404</p>
      <h1 className="display-xl text-gradient">Off the program</h1>
      <p className="mt-5 max-w-md text-steel">
        This page doesn&rsquo;t exist — but your next phase still does. Let&rsquo;s
        get you back on track.
      </p>
      <Link href="/" className="btn btn-primary mt-8">
        Back to Home
      </Link>
    </main>
  );
}
