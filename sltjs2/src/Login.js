// src/Login.js

import React, { useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig"; // Firestore 객체 임포트
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Firestore 함수 임포트
import { useNavigate } from "react-router-dom";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { SiKakaotalk } from "react-icons/si";

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

function Login({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // 에러 상태 추가
  const navigate = useNavigate();

  useEffect(() => {
    // 카카오 SDK 초기화
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init("1e157e9fb7ac775d68ced205ece37f1f"); // 실제 JavaScript 키로 교체하세요
      console.log("Kakao SDK initialized");
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // 기존 에러 초기화
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Firestore에 사용자 정보 저장
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email,
          nickname: user.displayName || user.email.split("@")[0],
          provider: "email",
          lastLogin: new Date(),
        },
        { merge: true }
      );

      onSuccess();
    } catch (error) {
      console.error("로그인 에러:", error);
      setError(error.message); // 에러 메시지 상태 업데이트
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // 이메일에서 사용자명 추출하여 닉네임 설정
      const nickname = user.email.split("@")[0];
      await updateProfile(user, {
        displayName: nickname,
      });

      // Firestore에 사용자 정보 저장
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email,
          nickname: nickname,
          provider: "google",
          lastLogin: new Date(),
        },
        { merge: true }
      );

      onSuccess();
    } catch (error) {
      console.error("Google 로그인 에러:", error);
      setError(error.message); // 에러 메시지 상태 업데이트
    }
  };

  const handleGithubLogin = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const user = result.user;

      // 이메일에서 사용자명 추출하여 닉네임 설정
      const nickname = user.email.split("@")[0];
      await updateProfile(user, {
        displayName: nickname,
      });

      // Firestore에 사용자 정보 저장
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email,
          nickname: nickname,
          provider: "github",
          lastLogin: new Date(),
        },
        { merge: true }
      );

      onSuccess();
    } catch (error) {
      console.error("GitHub 로그인 에러:", error);
      setError(error.message); // 에러 메시지 상태 업데이트
    }
  };

  const handleKakaoLogin = () => {
    if (!window.Kakao) {
      alert("카카오 SDK 로딩 중입니다.");
      return;
    }

    window.Kakao.Auth.authorize({
      redirectUri: "http://localhost:3000/kakaoRedirect",
      scope: "profile_nickname",
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
          required
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error-message">{error}</p>}{" "}
        {/* 에러 메시지 표시 */}
        <button type="submit">로그인</button>
      </form>
      <div className="social-login-buttons">
        <button className="social-button" onClick={handleGoogleLogin}>
          <FaGoogle className="icon" /> Google 로그인
        </button>
        <button className="social-button" onClick={handleGithubLogin}>
          <FaGithub className="icon" /> GitHub 로그인
        </button>
        <button className="social-button kakao" onClick={handleKakaoLogin}>
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
