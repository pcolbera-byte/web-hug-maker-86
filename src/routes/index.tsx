import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

const MoedimApp = lazy(() => import("../components/MoedimApp.jsx"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Moedim360 Calendário Bíblico Hebraico" },
      {
        name: "description",
        content:
          "Moedim: calendário bíblico hebraico com festas, parashot, Shabat, Rosh Chodesh, conversor de datas e versículo do dia.",
      },
      { property: "og:title", content: "Moedim360 Calendário Bíblico Hebraico" },
      {
        property: "og:description",
        content:
          "Moedim: calendário bíblico hebraico com festas, parashot, Shabat, Rosh Chodesh, conversor de datas e versículo do dia.",
      },
      { property: "og:url", content: "https://moedim.website/" },
    ],
    links: [{ rel: "canonical", href: "https://moedim.website/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://moedim.website/#website",
              name: "Moedim360 Calendário Bíblico Hebraico",
              url: "https://moedim.website/",
              inLanguage: "pt-BR",
              description:
                "Moedim: calendário bíblico hebraico com festas, parashot, Shabat, Rosh Chodesh, conversor de datas e versículo do dia.",
              publisher: { "@id": "https://moedim.website/#organization" },
            },
            {
              "@type": "Organization",
              "@id": "https://moedim.website/#organization",
              name: "Moedim360",
              url: "https://moedim.website/",
              logo: "https://moedim.website/moedim-logo.png",
            },
          ],
        }),
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
