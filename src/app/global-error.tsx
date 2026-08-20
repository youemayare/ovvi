"use client";

/**
 * Global error boundary — catches errors in the ROOT layout (including ClerkProvider).
 * Without this file, any root-level crash results in a blank white screen.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#fafaf9",
          color: "#1c1917",
          padding: "1rem",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
          Something went wrong!
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#78716c",
            maxWidth: "32rem",
            marginBottom: "1.5rem",
          }}
        >
          {error.message || "An unexpected error occurred."}
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.5rem 1.25rem",
              backgroundColor: "#f97316",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Try again
          </button>
          <a
            href="/marketplace"
            style={{
              padding: "0.5rem 1.25rem",
              backgroundColor: "#e7e5e4",
              color: "#1c1917",
              border: "none",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Go to Marketplace
          </a>
        </div>
      </body>
    </html>
  );
}
