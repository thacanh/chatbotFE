import React from "react";
import { Toaster } from "react-hot-toast";
import MainLayout from "./components/Layout/MainLayout";

function App() {
  return (
    <>
      <MainLayout />
      <Toaster position="top-center" />
    </>
  );
}

export default App;