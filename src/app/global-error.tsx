"use client";

import { useEffect } from "react";

/**
 * The last safety net: when even the root layout fails there are no styles, no fonts and no
 * language provider, so this page brings its own document, plain styles and both languages.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const english = typeof navigator !== "undefined" && !navigator.language.toLowerCase().startsWith("fr");
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;

  return (
    <html lang={english ? "en" : "fr"}>
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif", textAlign: "center", background: "#ffffff", color: "#1f2937" }}>
        <title>{english ? "Error 500 - TechniLium" : "Erreur 500 - TechniLium"}</title>
        <main style={{ maxWidth: 420 }}>
          <p style={{ margin: 0, fontSize: 80, fontWeight: 700, color: "#f68b1e" }}>500</p>
          <h1 style={{ fontSize: 24, margin: "8px 0" }}>{english ? "Server error" : "Erreur du serveur"}</h1>
          <p style={{ color: "#6b7280" }}>{english ? "Something went wrong on our side. Try again in a moment." : "Un problème est survenu de notre côté. Réessayez dans un instant."}</p>
          {digest ? (
            <p style={{ fontSize: 12, color: "#6b7280" }}>
              {english ? "Error reference:" : "Référence de l'erreur :"} <code>{digest}</code>
            </p>
          ) : null}
          <button type="button" onClick={retry} style={{ background: "#f68b1e", color: "#fff", border: 0, borderRadius: 4, padding: "12px 22px", fontSize: 16, cursor: "pointer" }}>
            {english ? "Try again" : "Réessayer"}
          </button>
        </main>
      </body>
    </html>
  );
}
