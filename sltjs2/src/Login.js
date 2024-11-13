// src/Login.js

import React, { useState } from "react";
import { auth } from "./firebaseConfig";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { useNavigate } from "react-router-dom"; // 추가
import { FaGoogle, FaGithub } from "react-icons/fa";

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

function Login({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // 추가

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
