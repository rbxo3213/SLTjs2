// src/pages/Ranking.js

import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import "./Ranking.css";

function Ranking() {
  const [quizType1Ranks, setQuizType1Ranks] = useState([]);
  const [quizType2Ranks, setQuizType2Ranks] = useState([]);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        // 지문자 이미지 퀴즈 점수 가져오기
        const scoresRef1 = collection(db, "scores");
        const q1 = query(scoresRef1, where("type", "==", "QuizType1"));
        const querySnapshot1 = await getDocs(q1);
        const scores1 = querySnapshot1.docs.map((doc) => doc.data());

        // 수어 동작 퀴즈 점수 가져오기
        const scoresRef2 = collection(db, "scores");
        const q2 = query(scoresRef2, where("type", "==", "QuizType2"));
        const querySnapshot2 = await getDocs(q2);
        const scores2 = querySnapshot2.docs.map((doc) => doc.data());

        // 사용자 정보 가져오기
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        const usersData = usersSnapshot.docs.map((doc) => doc.data());

        // uid를 키로 닉네임을 값으로 하는 맵 생성
        const uidToNickname = {};
        usersData.forEach((user) => {
          uidToNickname[user.uid] = user.nickname || "익명 사용자";
        });

        // 각 퀴즈 유형별로 계정별 평균 점수와 판수 계산
        const calculateRanks = (scores) => {
          const userScores = {};

          scores.forEach((score) => {
            const uid = score.uid || "guest"; // uid 사용
            if (!userScores[uid]) {
              userScores[uid] = { totalScore: 0, attempts: 0 };
            }
            userScores[uid].totalScore += score.score;
            userScores[uid].attempts += 1;
          });

          const ranks = Object.keys(userScores).map((uid) => {
            const { totalScore, attempts } = userScores[uid];
            const averageScore = totalScore / attempts;
            const nickname = uidToNickname[uid] || "익명 사용자";
            return { nickname, averageScore, attempts };
          });

          // 정렬: 평균 점수 내림차순, 평균 점수가 같으면 판수 오름차순
          ranks.sort((a, b) => {
            if (b.averageScore !== a.averageScore) {
              return b.averageScore - a.averageScore; // 평균 점수 내림차순
            } else {
              return a.attempts - b.attempts; // 판수 오름차순
            }
          });

          return ranks.slice(0, 10); // 상위 10명만 반환
        };

        const quiz1Ranks = calculateRanks(scores1);
        const quiz2Ranks = calculateRanks(scores2);

        setQuizType1Ranks(quiz1Ranks);
        setQuizType2Ranks(quiz2Ranks);
      } catch (error) {
        console.error("Error fetching scores:", error);
      }
    };

    fetchScores();
  }, []);

  return (
    <div className="ranking-container">
      <h2>랭킹</h2>
      <div className="ranking-tables">
        <div className="ranking-table-container">
          <h3>지문자 이미지 퀴즈</h3>
          <table className="ranking-table">
            <thead>
              <tr>
                <th>순위</th>
                <th>닉네임</th>
                <th>평균 점수</th>
                <th>판수</th>
              </tr>
            </thead>
            <tbody>
              {quizType1Ranks.map((rank, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{rank.nickname}</td>
                  <td>{rank.averageScore.toFixed(2)}</td>
                  <td>{rank.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ranking-table-container">
          <h3>수어 동작 퀴즈</h3>
          <table className="ranking-table">
            <thead>
              <tr>
                <th>순위</th>
                <th>닉네임</th>
                <th>평균 점수</th>
                <th>판수</th>
              </tr>
            </thead>
            <tbody>
              {quizType2Ranks.map((rank, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{rank.nickname}</td>
                  <td>{rank.averageScore.toFixed(2)}</td>
                  <td>{rank.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Ranking;
