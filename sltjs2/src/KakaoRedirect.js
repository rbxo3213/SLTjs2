// src/KakaoRedirect.js

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "./firebaseConfig"; // Firebase Auth 및 Firestore 객체 가져오기
import { signInWithCustomToken, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

function KakaoRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get("code");
    if (code) {
      // 서버로 인가 코드를 보내서 토큰을 발급받고 Firebase에 로그인
      fetch(`http://localhost:5000/kakaoLogin?code=${code}`, {
        method: "GET",
      })
        .then((response) => response.json())
        .then(async (data) => {
          // Firebase Custom Token을 받아서 로그인
          if (data.firebaseToken) {
            try {
              const userCredential = await signInWithCustomToken(
                auth,
                data.firebaseToken
              );

              // 로그인 후 사용자 프로필 업데이트
              const user = userCredential.user;

              // 추가 클레임에서 닉네임 가져오기
              const decodedToken = await auth.currentUser.getIdTokenResult();
              const nickname = decodedToken.claims.nickname;

              if (nickname) {
                await updateProfile(user, {
                  displayName: nickname,
                });
              }

              // Firestore에 사용자 정보 저장
              await setDoc(
                doc(db, "users", user.uid),
                {
                  uid: user.uid,
                  nickname: nickname || "익명 사용자",
                  provider: "kakao",
                  lastLogin: new Date(),
                },
                { merge: true }
              );

              navigate("/");
            } catch (error) {
              console.error("Firebase 로그인 에러:", error);
              alert("Firebase 로그인 에러");
            }
          } else {
            alert("Firebase 토큰이 없습니다.");
          }
        })
        .catch((error) => {
          console.error("카카오 로그인 에러:", error);
          alert("카카오 로그인 에러");
        });
    } else {
      alert("인가 코드가 없습니다.");
    }
  }, [navigate]);

  return <div>카카오 로그인 처리 중...</div>;
}

export default KakaoRedirect;
