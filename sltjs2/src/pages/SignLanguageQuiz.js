// src/pages/SignLanguageQuiz.js

import React from "react";
import { useNavigate } from "react-router-dom";
import "./SignLanguageQuiz.css"; // 스타일을 위한 CSS 파일

function SignLanguageQuiz() {
  const navigate = useNavigate();

  return (
    <div className="quiz-selection-container">
      <h2>수어 퀴즈를 선택하세요</h2>
      <div className="quiz-buttons">
        <button
          className="quiz-select-button"
          onClick={() => navigate("/quiz-type1")}
        >
          지문자 이미지 퀴즈
        </button>
        <button
          className="quiz-select-button"
          onClick={() => navigate("/quiz-type2")}
        >
          수어 동작 퀴즈
        </button>
      </div>
    </div>
  );
}

export default SignLanguageQuiz;
