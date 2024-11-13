// src/pages/QuizResult.js

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

function QuizResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { score, type } = location.state || { score: 0, type: "Quiz" };

  return (
    <div className="quiz-container">
      <h2>퀴즈 완료!</h2>
      <p>당신의 점수는 {score}점입니다.</p>
      <button onClick={() => navigate("/ranking")} className="quiz-button">
        랭킹 보기
      </button>
      <button onClick={() => navigate("/")} className="quiz-button">
        홈으로
      </button>
    </div>
  );
}

export default QuizResult;
