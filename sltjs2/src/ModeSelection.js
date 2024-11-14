// src/ModeSelection.js

import React from "react";
import { useNavigate } from "react-router-dom";
import "./ModeSelection.css";

function ModeSelection() {
  const navigate = useNavigate();

  return (
    <div className="mode-selection-container">
      <h2>수어 번역 모드를 선택하세요</h2>
      <div className="mode-buttons">
        <button
          className="mode-select-button"
          onClick={() => navigate("/finger-spelling")}
        >
          지문자 모드
        </button>
        <button
          className="mode-select-button"
          onClick={() => navigate("/word-translation")}
        >
          단어번역(Beta)모드
        </button>
      </div>
    </div>
  );
}

export default ModeSelection;
