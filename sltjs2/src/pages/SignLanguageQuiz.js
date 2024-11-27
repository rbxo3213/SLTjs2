// src/pages/SignLanguageQuiz.js

import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // 애니메이션을 위한 framer-motion 추가
import "./SignLanguageQuiz.css"; // 스타일을 위한 CSS 파일

function SignLanguageQuiz() {
  const navigate = useNavigate();

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="quiz-selection-container">
      <h2 className="quiz-header">수어 퀴즈를 선택하세요</h2>
      <div className="quiz-cards">
        {/* 지문자 이미지 퀴즈 카드 */}
        <motion.div
          className="quiz-card"
          onClick={() => navigate("/quiz-type1")}
          role="button"
          aria-label="지문자 이미지 퀴즈 선택"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === "Enter") navigate("/quiz-type1");
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          variants={cardVariants}
        >
          <img
            src="/image/지문자.png"
            alt="지문자 이미지 퀴즈"
            className="quiz-card-image"
          />
          <div className="quiz-card-overlay">
            <h3 className="quiz-card-title">지문자 이미지 퀴즈</h3>
          </div>
        </motion.div>

        {/* 수어 동작 퀴즈 카드 */}
        <motion.div
          className="quiz-card"
          onClick={() => navigate("/quiz-type2")}
          role="button"
          aria-label="지문자 동작 퀴즈 선택"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === "Enter") navigate("/quiz-type2");
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          variants={cardVariants}
        >
          <img
            src="/image/단어.png"
            alt="지문자 동작 퀴즈"
            className="quiz-card-image"
          />
          <div className="quiz-card-overlay">
            <h3 className="quiz-card-title">지문자 동작 퀴즈</h3>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default SignLanguageQuiz;
