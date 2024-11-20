// src/components/CardSection.js

import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./CardSection.css"; // 스타일링을 위한 CSS 파일

function CardSection() {
  const navigate = useNavigate();

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="card-section-container">
      {/* 수어 학습 카드 */}
      <motion.div
        className="card"
        onClick={() => navigate("/sign-language-learning")}
        role="button"
        aria-label="수어 학습 페이지로 이동"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === "Enter") navigate("/sign-language-learning");
        }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        variants={cardVariants}
      >
        <img src="/image/learning.png" alt="수어 학습" className="card-image" />
        <div className="card-overlay">
          <h3 className="card-title">수어 학습</h3>
        </div>
      </motion.div>

      {/* 수어 퀴즈 카드 */}
      <motion.div
        className="card"
        onClick={() => navigate("/sign-language-quiz")}
        role="button"
        aria-label="수어 퀴즈 페이지로 이동"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === "Enter") navigate("/sign-language-quiz");
        }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.4 }}
        variants={cardVariants}
      >
        <img src="/image/quiz.png" alt="수어 퀴즈" className="card-image" />
        <div className="card-overlay">
          <h3 className="card-title">수어 퀴즈</h3>
        </div>
      </motion.div>

      {/* 랭킹 카드 */}
      <motion.div
        className="card"
        onClick={() => navigate("/ranking")}
        role="button"
        aria-label="랭킹 페이지로 이동"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === "Enter") navigate("/ranking");
        }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.6 }}
        variants={cardVariants}
      >
        <img src="/image/ranking.png" alt="랭킹" className="card-image" />
        <div className="card-overlay">
          <h3 className="card-title">랭킹</h3>
        </div>
      </motion.div>
    </div>
  );
}

export default CardSection;
