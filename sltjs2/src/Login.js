// src/Login.js

import React, { useState, useEffect } from "react";
import { auth } from "./firebaseConfig";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { SiKakaotalk } from "react-icons/si";

// 카카오 JavaScript SDK 사용
// window.Kakao 객체를 사용하기 위해 SDK가 로드되었는지 확인

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

function Login({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // 카카오 SDK 초기화
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init("YOUR_KAKAO_JAVASCRIPT_KEY"); // 실제 앱 키로 교체하세요
      console.log("Kakao SDK initialized");
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (error) {
      console.error("로그인 에러:", error);
      alert(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess();
    } catch (error) {
      console.error("Google 로그인 에러:", error);
      alert(error.message);
    }
  };

  const handleGithubLogin = async () => {
    try {
      await signInWithPopup(auth, githubProvider);
      onSuccess();
    } catch (error) {
      console.error("GitHub 로그인 에러:", error);
      alert(error.message);
    }
  };

  const handleKakaoLogin = () => {
    if (!window.Kakao) {
      alert("카카오 SDK 로딩 중입니다.");
      return;
    }

    window.Kakao.Auth.login({
      scope: "profile_nickname, account_email, talk_message",
      success: function (authObj) {
        console.log("카카오 로그인 성공", authObj);

        window.Kakao.API.request({
          url: "/v2/user/me",
          success: function (res) {
            console.log("카카오 사용자 정보", res);
            // Firebase Authentication과 연동하려면 추가 작업 필요
            onSuccess();
          },
          fail: function (error) {
            console.log("카카오 사용자 정보 요청 실패", error);
            alert("카카오 사용자 정보 요청 실패");
          },
        });
      },
      fail: function (err) {
        console.error("카카오 로그인 실패", err);
        alert("카카오 로그인 실패");
      },
    });
  };

  return (
    <div className="auth-container">
      <h2>로그인</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">로그인</button>
      </form>
      <div className="social-login-buttons">
        <button className="social-button" onClick={handleGoogleLogin}>
          <FaGoogle className="icon" /> Google 로그인
        </button>
        <button className="social-button" onClick={handleGithubLogin}>
          <FaGithub className="icon" /> GitHub 로그인
        </button>
        <button className="social-button" onClick={handleKakaoLogin}>
          <SiKakaotalk className="icon" /> 카카오 로그인
        </button>
      </div>
      <div className="forgot-password">
        <span
          onClick={() => navigate("/reset-password")}
          className="forgot-password-text"
        >
          비밀번호를 잊으셨나요?
        </span>
      </div>
    </div>
  );
}

export default Login;
