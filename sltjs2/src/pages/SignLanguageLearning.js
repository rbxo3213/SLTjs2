// src/pages/SignLanguageLearning.js

import React from "react";
import "./SignLanguageLearning.css"; // 스타일링을 위한 CSS 파일

function SignLanguageLearning() {
  return (
    <main className="sign-learning-content">
      <div className="sign-learning-container">
        <h2>수어 학습 페이지</h2>
        {/* 번역창 대신 이미지 표시 */}
        <div className="sign-learning-image-container">
          <img
            src="/image/signlangue_image.jpg"
            alt="수어 학습 이미지"
            className="sign-learning-image"
          />
        </div>
        {/* 추가적인 학습 자료, 비디오, 퀴즈 등을 여기에 추가할 수 있습니다 */}
      </div>
    </main>
  );
}

export default SignLanguageLearning;
