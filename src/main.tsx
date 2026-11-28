import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { TravelApp } from "./mobile/TravelApp";
import "./index.css";
import "./mobile/travel.css";

const demo =
  import.meta.env.MODE === "showcase" ||
  (import.meta.env.DEV && new URLSearchParams(location.search).has("showcase"));
const Showcase = demo
  ? lazy(async () => {
      return { default: (await import("./Root")).Root };
    })
  : null;
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {Showcase ? (
      <Suspense>
        <Showcase />
      </Suspense>
    ) : (
      <TravelApp />
    )}
  </React.StrictMode>,
);
