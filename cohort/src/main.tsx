import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/geist";
import "./styles.css";
import App from "./App";
import MarketPanel from "./MarketPanel";
import "./light-theme.css";

// #panel shows the live Cohort Master (Grok Bot) market panel.
function Root() {
  const [panel, setPanel] = useState(window.location.hash === "#panel");
  useEffect(() => {
    const onHash = () => setPanel(window.location.hash === "#panel");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return panel ? <MarketPanel /> : <App />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
