"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold text-red-500">500</h1>
          <h2 className="text-xl text-neutral-300">Something went wrong</h2>
          <p className="text-neutral-500 max-w-md">
            An unexpected error occurred. Our team has been notified.
          </p>
          <button
            onClick={reset}
            className="mt-4 px-6 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
// byte.dns-parking.com

// pixel.dns-parking.com
