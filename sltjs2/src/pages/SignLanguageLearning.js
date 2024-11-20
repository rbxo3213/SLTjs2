// src/pages/SignLanguageLearning.js

import React, { useState } from "react";
import "./SignLanguageLearning.css"; // 스타일링을 위한 CSS 파일

function SignLanguageLearning() {
  const learningMaterials = [
    {
      type: "image",
      src: "/image/signlangue_image.jpg",
      alt: "수어 학습 이미지 1",
      name: "수어 지문자 모음",
    },
    {
      type: "video",
      src: "/videos/감사합니다.mp4",
      alt: "수어 학습 영상 1",
      name: "수어 단어 : 감사합니다",
    },
    {
      type: "video",
      src: "/videos/보다.mp4",
      alt: "수어 학습 영상 2",
      name: "수어 단어 : 보다",
    },
    {
      type: "video",
      src: "/videos/안녕하세요.mp4",
      alt: "수어 학습 영상 3",
      name: "수어 단어 : 안녕하세요",
    },
    {
      type: "video",
      src: "/videos/알다.mp4",
      alt: "수어 학습 영상 4",
      name: "수어 단어 : 알다",
    },
    {
      type: "video",
      src: "/videos/죄송합니다.mp4",
      alt: "수어 학습 영상 5",
      name: "수어 단어 : 죄송합니다",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? learningMaterials.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === learningMaterials.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <main className="sign-learning-content">
      <div className="sign-learning-container">
        <h2>수어 학습 페이지</h2>
        {/* 학습 자료 슬라이더 */}
        <div className="sign-learning-slider">
          <button className="nav-button prev-button" onClick={handlePrev}>
            &lt;
          </button>
          <div className="learning-material">
            {/* 현재 학습 중인 수어 이름 표시 */}
            <h3 className="current-sign-name">
              {learningMaterials[currentIndex].name}
            </h3>
            {learningMaterials[currentIndex].type === "image" ? (
              <img
                src={learningMaterials[currentIndex].src}
                alt={learningMaterials[currentIndex].alt}
                className="sign-learning-media"
              />
            ) : (
              <video
                src={learningMaterials[currentIndex].src}
                controls
                className="sign-learning-media"
              >
                {learningMaterials[currentIndex].alt}
              </video>
            )}
          </div>
          <button className="nav-button next-button" onClick={handleNext}>
            &gt;
          </button>
        </div>
        {/* 페이지 네비게이션 인디케이터 */}
        <div className="slider-indicators">
          {learningMaterials.map((_, index) => (
            <span
              key={index}
              className={`indicator ${index === currentIndex ? "active" : ""}`}
              onClick={() => setCurrentIndex(index)}
            ></span>
          ))}
        </div>
      </div>
    </main>
  );
}

export default SignLanguageLearning;
