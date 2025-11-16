import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import OnlineJudge from "./components/OnlineJudge";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/*" element={<OnlineJudge />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
