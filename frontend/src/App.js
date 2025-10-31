import React from "react";
import { AuthProvider } from "./contexts/AuthContext";
import OnlineJudge from "./components/OnlineJudge";

function App() {
  return (
    <AuthProvider>
      <OnlineJudge />
    </AuthProvider>
  );
}

export default App;
