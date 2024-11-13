// src/App.js

import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { auth } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import Login from "./Login";
import Signup from "./Signup";
import ResetPassword from "./ResetPassword";
import MainContent from "./MainContent";
import QuizType1 from "./pages/QuizType1";
import QuizType2 from "./pages/QuizType2";
import Ranking from "./pages/Ranking";
import QuizResult from "./pages/QuizResult";
import SignLanguageQuiz from "./pages/SignLanguageQuiz";
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
        <nav className="nav-links">
          {/* 네비게이션 링크를 버튼으로 변경하고, 'auth-buttons' 클래스 적용 */}
          <div className="nav-buttons">
            <button
              onClick={() => navigate("/sign-language-quiz")}
              className="nav-button"
            >
              수어 퀴즈
            </button>
            <button onClick={() => navigate("/ranking")} className="nav-button">
              랭킹
            </button>
          </div>
        </nav>
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
        <Route path="/sign-language-quiz" element={<SignLanguageQuiz />} />
        <Route path="/quiz-type1" element={<QuizType1 />} />
        <Route path="/quiz-type2" element={<QuizType2 />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/quiz-result" element={<QuizResult />} />
      </Routes>
    </div>
  );
}

export default App;
