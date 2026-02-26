import App from "./components/App";
import {createRoot} from "react-dom/client";
import "vite/modulepreload-polyfill";

const appDiv = createRoot(document.getElementById("root"));
appDiv.render(<App />);