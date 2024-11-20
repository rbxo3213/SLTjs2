// src/pages/QuizType1.js

import React, { useState, useEffect, useRef } from "react"; // useRef 추가
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
  const [error, setError] = useState(""); // 에러 상태 추가

  const inputRef = useRef(null); // 입력 필드 참조 생성

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

  // Enter 키 이벤트 핸들러 추가
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        if (showAnswer) {
          // 피드백이 표시 중일 때 Enter 키를 누르면 다음 문제로 이동
          handleNext();
        }
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener("keydown", handleKeyDown);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showAnswer, currentQuestion, score, userAnswer]);

  // 새로운 질문이 시작될 때 입력 필드에 포커스 맞추기
  useEffect(() => {
    if (!showAnswer && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentQuestion, showAnswer]);

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
          <p className="instruction">Enter 키를 눌러 다음 문제로 넘어갑니다.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef} // ref 할당
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            maxLength={1}
            className="quiz-input"
            required
            aria-label="답변 입력"
          />
          <button type="submit" className="quiz-button">
            제출
          </button>
        </form>
      )}
      {error && <p className="error-message">{error}</p>}{" "}
      {/* 에러 메시지 표시 */}
    </div>
  );
}

export default QuizType1;
