import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

// Make sure the DOM is fully loaded before trying to access the root element
const rootElement = document.getElementById("root")

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} else {
  console.error("Could not find root element to mount React application")
}

