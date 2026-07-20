import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

const MoedimApp = lazy(() => import("../components/MoedimApp.jsx"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Moedim — Calendário Bíblico Hebraico" },
      {
        name: "description",
        content:
          "Moedim: calendário bíblico hebraico com festas, parashot, Shabat, Rosh Chodesh, conversor de datas e versículo do dia.",
      },
      { property: "og:title", content: "Moedim — Calendário Bíblico Hebraico" },
      {
        property: "og:description",
        content:
          "Encontros marcados pelo Eterno. Festas, parashot, Shabat, Rosh Chodesh e mais.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#060f2a",
          color: "#d4af37",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        Carregando Moedim…
      </div>
    );
  }
  return (
    <Suspense fallback={null}>
      <MoedimApp />
    </Suspense>
  );
}
