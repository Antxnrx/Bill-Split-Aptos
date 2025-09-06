import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StitchDesign } from "./screens/StitchDesign/StitchDesign";
import "../tailwind.css";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <StitchDesign />
  </StrictMode>,
);
