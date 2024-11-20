// src/App.js

import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { auth } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import Login from "./Login";
import Signup from "./Signup";
import ResetPassword from "./ResetPassword";
import MainContent from "./MainContent"; // 지문자 모드 컴포넌트
import WordTranslation from "./WordTranslation"; // 단어 번역 모드 컴포넌트
import QuizType1 from "./pages/QuizType1";
import QuizType2 from "./pages/QuizType2";
import Ranking from "./pages/Ranking";
import QuizResult from "./pages/QuizResult";
import SignLanguageQuiz from "./pages/SignLanguageQuiz";
import SignLanguageLearning from "./pages/SignLanguageLearning"; // SignLanguageLearning 컴포넌트 임포트
import "./App.css";
import KakaoRedirect from "./KakaoRedirect";
import NotFound from "./NotFound"; // 존재하지 않는 경로 처리 컴포넌트 추가

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
        {/* 수어 퀴즈와 랭킹 버튼만 제거 */}
        <nav className="nav-links">
          <div className="nav-buttons">
            {/* 아래 두 버튼을 삭제하거나 주석 처리하여 제거 */}
            {/* <button
              onClick={() => navigate("/sign-language-quiz")}
              className="nav-button"
            >
              수어 퀴즈
            </button>
            <button onClick={() => navigate("/ranking")} className="nav-button">
              랭킹
            </button> */}
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
        <Route path="/" element={<MainContent />} /> {/* 지문자 모드 */}
        <Route path="/finger-spelling" element={<MainContent />} />{" "}
        {/* 지문자 모드 */}
        <Route path="/word-translation" element={<WordTranslation />} />{" "}
        {/* 단어 번역 모드 */}
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
        <Route
          path="/sign-language-learning"
          element={<SignLanguageLearning />}
        />{" "}
        {/* SignLanguageLearning 라우트 추가 */}
        <Route path="/kakaoRedirect" element={<KakaoRedirect />} />
        {/* 존재하지 않는 경로 처리 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
