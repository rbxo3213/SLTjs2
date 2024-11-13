// src/pages/QuizType1.js

import React, { useState, useEffect } from "react";
import { letters } from "../data/letters";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { saveScore } from "../utils/scoreUtils";
import "./Quiz.css";

function QuizType1() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [isCorrect, setIsCorrect] = useState(null); // 정답 여부 상태 추가
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      alert("로그인이 필요합니다.");
      navigate("/login");
    } else {
      // spacing, backspace를 제외한 문자들로 문제 생성
      const filteredLetters = letters.filter(
        (letter) => letter !== "spacing" && letter !== "backspace"
      );
      const shuffledLetters = filteredLetters.sort(() => 0.5 - Math.random());
      setQuestions(shuffledLetters.slice(0, 10));
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userAnswer.trim() === questions[currentQuestion]) {
      setScore(score + 1);
      setIsCorrect(true); // 정답
    } else {
      setIsCorrect(false); // 오답
    }
    setShowAnswer(true);
  };

  const handleNext = () => {
    setUserAnswer("");
    setShowAnswer(false);
    setIsCorrect(null); // 정답 여부 초기화
    if (currentQuestion + 1 < 10) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // 퀴즈 종료 시 점수 저장
      saveScore(score, "QuizType1");
      navigate("/quiz-result", { state: { score, type: "QuizType1" } });
    }
  };

  if (questions.length === 0) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="quiz-container">
      <h2>지문자 이미지 퀴즈</h2>
      <p>문제 {currentQuestion + 1} / 10</p>
      <img
        src={`${process.env.PUBLIC_URL}/image/${questions[currentQuestion]}.png`}
        alt="지문자 이미지"
        className="quiz-image"
      />
      {showAnswer ? (
        <div>
          {isCorrect ? (
            <div className="answer-feedback correct">
              <div className="icon">⭕</div>
              <p>정답입니다!</p>
            </div>
          ) : (
            <div className="answer-feedback incorrect">
              <div className="icon">❌</div>
              <p>오답입니다!</p>
            </div>
          )}
          <p>
            당신의 답변: {userAnswer} / 정답: {questions[currentQuestion]}
          </p>
          <button onClick={handleNext} className="quiz-button">
            다음 문제
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            maxLength={1}
            className="quiz-input"
          />
          <button type="submit" className="quiz-button">
            제출
          </button>
        </form>
      )}
    </div>
  );
}

export default QuizType1;
