// src/pages/QuizType1.js

import React, { useState, useEffect, useRef } from "react";
import { letters } from "../data/letters";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { saveScore } from "../utils/scoreUtils";
import { motion, AnimatePresence } from "framer-motion"; // 애니메이션을 위한 framer-motion 추가
import "./Quiz.css";

function QuizType1() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [isCorrect, setIsCorrect] = useState(null);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!auth.currentUser) {
      alert("로그인이 필요합니다.");
      navigate("/login");
    } else {
      const filteredLetters = letters.filter(
        (letter) => letter !== "spacing" && letter !== "backspace"
      );
      const shuffledLetters = filteredLetters.sort(() => 0.5 - Math.random());
      setQuestions(shuffledLetters.slice(0, 10));
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      userAnswer.trim().toLowerCase() ===
      questions[currentQuestion].toLowerCase()
    ) {
      setScore(score + 1);
      setIsCorrect(true);
    } else {
      setIsCorrect(false);
    }
    setShowAnswer(true);
  };

  const handleNext = () => {
    setUserAnswer("");
    setShowAnswer(false);
    setIsCorrect(null);
    if (currentQuestion + 1 < 10) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      saveScore(score, "QuizType1");
      navigate("/quiz-result", { state: { score, type: "QuizType1" } });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        if (showAnswer) {
          handleNext();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showAnswer, currentQuestion, score, userAnswer]);

  useEffect(() => {
    if (!showAnswer && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentQuestion, showAnswer]);

  if (questions.length === 0) {
    return <div className="quiz-container">로딩 중...</div>;
  }

  return (
    <div className="quiz-container">
      <h2 className="quiz-header">지문자 이미지 퀴즈</h2>
      <div className="progress-bar">
        <div
          className="progress"
          style={{ width: `${((currentQuestion + 1) / 10) * 100}%` }}
        ></div>
      </div>
      <p className="quiz-subheader">문제 {currentQuestion + 1} / 10</p>
      <img
        src={`${process.env.PUBLIC_URL}/image/${questions[currentQuestion]}.png`}
        alt="지문자 이미지"
        className="quiz-image"
      />
      <AnimatePresence>
        {showAnswer ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
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
            <p className="answer-details">
              당신의 답변: <strong>{userAnswer}</strong> / 정답:{" "}
              <strong>{questions[currentQuestion]}</strong>
            </p>
            <button onClick={handleNext} className="quiz-button">
              다음 문제
            </button>
            <p className="instruction">
              Enter 키를 눌러 다음 문제로 넘어갑니다.
            </p>
          </motion.div>
        ) : (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <input
              ref={inputRef}
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
          </motion.form>
        )}
      </AnimatePresence>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default QuizType1;
