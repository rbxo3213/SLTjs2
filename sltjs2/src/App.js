// src/App.js

import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { auth } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import Login from "./Login";
import Signup from "./Signup";
import ResetPassword from "./ResetPassword";
import MainContent from "./MainContent";
import "./App.css";

function App() {
  const [user, setUser] = React.useState(null);
  const navigate = useNavigate();

  // 로그인 상태 모니터링
  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="project-title" onClick={() => navigate("/")}>
          Sign Language Translator
        </div>
        <div className="auth-buttons">
          {user ? (
            <>
              <span>{user.email}</span>
              <button onClick={handleLogout}>로그아웃</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate("/login")}>로그인</button>
              <button onClick={() => navigate("/signup")}>회원가입</button>
            </>
          )}
        </div>
      </header>

      <Routes>
        <Route path="/" element={<MainContent />} />
        <Route
          path="/login"
          element={<Login onSuccess={() => navigate("/")} />}
        />
        <Route
          path="/signup"
          element={<Signup onSuccess={() => navigate("/")} />}
        />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </div>
  );
}

export default App;
