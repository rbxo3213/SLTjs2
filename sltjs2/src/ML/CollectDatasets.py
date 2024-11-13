import cv2
import mediapipe as mp
import numpy as np

# 한글 자음, 모음, 숫자, 스페이스, 백스페이스에 대응하는 매핑 테이블
label_mapping = {
    'ㄱ': 0, 'ㄴ': 1, 'ㄷ': 2, 'ㄹ': 3, 'ㅁ': 4, 'ㅂ': 5, 'ㅅ': 6, 'ㅇ': 7, 'ㅈ': 8, 'ㅊ': 9, 'ㅋ': 10, 'ㅌ': 11, 'ㅍ': 12, 'ㅎ': 13,
    'ㅏ': 14, 'ㅓ': 15, 'ㅗ': 16, 'ㅜ': 17, 'ㅡ': 18, 'ㅣ': 19, 'ㅐ': 20, 'ㅔ': 21, 'ㅚ': 22, 'ㅟ': 23, 'ㅢ': 24, 'ㅑ': 25, 'ㅕ': 26, 
    'ㅛ': 27, 'ㅠ': 28, 'ㅒ': 29, 'ㅖ': 30,
    'spacing': 31, 'backspace': 32
}


# 관절 좌표 사이의 벡터 각도를 계산하는 함수
def calculate_angle(joint):
    v1 = joint[[0, 1, 2, 3, 0, 5, 6, 7, 0, 9, 10, 11, 0, 13, 14, 15, 0, 17, 18, 19], :]
    v2 = joint[[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], :]
    v = v2 - v1
    v = v / np.linalg.norm(v, axis=1)[:, np.newaxis]

    compareV1 = v[[0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 16, 17], :]
    compareV2 = v[[1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15, 17, 18, 19], :]
    angle = np.arccos(np.einsum('nt,nt->n', compareV1, compareV2))
    angle = np.degrees(angle)  # radian값을 degree로 변환

    return angle

cap = cv2.VideoCapture(0)

mp_drawing = mp.solutions.drawing_utils
mp_hands = mp.solutions.hands

# 모든 라벨을 대상으로 20번씩 데이터를 수집하도록 설정
for label, label_number in label_mapping.items():
    input_count = 0  # 라벨마다 횟수 카운트 초기화
    max_count = 20  # 라벨당 20번 입력

    print(f"'{label}'에 대한 데이터 수집을 시작합니다.")

    with mp_hands.Hands(
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5) as hands:

        while cap.isOpened():
            success, image = cap.read()
            if not success:
                print("Ignoring empty camera frame.")
                continue

            image = cv2.cvtColor(cv2.flip(image, 1), cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            results = hands.process(image)

            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            if results.multi_hand_landmarks:
                for res in results.multi_hand_landmarks:
                    joint = np.zeros((21, 3))
                    for j, lm in enumerate(res.landmark):
                        joint[j] = [lm.x, lm.y, lm.z]

                    angle = calculate_angle(joint)

                    mp_drawing.draw_landmarks(
                        image, res, mp_hands.HAND_CONNECTIONS)

            cv2.imshow('MediaPipe Hands', image)

            key = cv2.waitKey(1)
            if key == ord('.'):
                if results.multi_hand_landmarks:
                    # 각도 값을 소숫점 6자리로 포맷하여 저장
                    with open('update.txt', 'a') as file:
                        file.write(f"{','.join(f'{a:.6f}' for a in angle)},{label_number:.6f}\n")

                    input_count += 1  # 입력 횟수 증가
                    print(f"{label} {input_count}번째 입력 완료.")

                    if input_count >= max_count:
                        print(f"'{label}'에 대한 20번 입력이 완료되었습니다.")
                        break

            elif key == 27:  # ESC 키를 누르면 프로그램 종료
                cap.release()
                cv2.destroyAllWindows()
                break

print("모든 라벨에 대한 데이터 수집이 완료되었습니다.")

cap.release()
cv2.destroyAllWindows()
