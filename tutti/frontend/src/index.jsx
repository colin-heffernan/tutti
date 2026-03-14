import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import App from "./App";
import "vite/modulepreload-polyfill";
// FIXME: import reportWebVitals from "./reportWebVitals";

const appDiv = createRoot(document.getElementById("root"));
appDiv.render(
    <StrictMode>
        <App />
    </StrictMode>
);

// FIXME: reportWebVitals();