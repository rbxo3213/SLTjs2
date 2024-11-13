# KNN_recognizer.py

import cv2
import mediapipe as mp
import numpy as np
import json
import time
from PIL import ImageFont, ImageDraw, Image  # PIL 라이브러리 임포트

max_num_hands = 1

# 라벨 번호를 한글 문자로 매핑하기 위해 딕셔너리를 수정합니다.
gesture = {
    'ㄱ': 0, 'ㄴ': 1, 'ㄷ': 2, 'ㄹ': 3, 'ㅁ': 4, 'ㅂ': 5, 'ㅅ': 6, 'ㅇ': 7,
    'ㅈ': 8, 'ㅊ': 9, 'ㅋ': 10, 'ㅌ': 11, 'ㅍ': 12, 'ㅎ': 13,
    'ㅏ': 14, 'ㅓ': 15, 'ㅗ': 16, 'ㅜ': 17, 'ㅡ': 18, 'ㅣ': 19,
    'ㅐ': 20, 'ㅔ': 21, 'ㅚ': 22, 'ㅟ': 23, 'ㅢ': 24, 'ㅑ': 25,
    'ㅕ': 26, 'ㅛ': 27, 'ㅠ': 28, 'ㅒ': 29, 'ㅖ': 30,
    'spacing': 31, 'backspace': 32
}

# 라벨 번호를 키로, 한글 문자를 값으로 하는 역매핑 딕셔너리를 생성합니다.
gesture_inv = {v: k for k, v in gesture.items()}

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(
    max_num_hands=max_num_hands,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# 한글 폰트 경로 설정 (시스템에 설치된 폰트 경로를 사용하거나, 프로젝트 폴더에 폰트 파일을 추가하세요)
fontpath = "fonts/NanumGothic.ttf"  # 폰트 파일 경로
font = ImageFont.truetype(fontpath, 32)  # 폰트 크기 설정

# 데이터셋 로드
file = np.genfromtxt('sltjs/src/ML/gesture_dataset.txt', delimiter=',')
angleFile = file[:, :-1]
labelFile = file[:, -1]
angle = angleFile.astype(np.float32)
label = labelFile.astype(np.float32)

# KNN 분류기 학습
knn = cv2.ml.KNearest_create()
knn.train(angle, cv2.ml.ROW_SAMPLE, label)

cap = cv2.VideoCapture(0)

startTime = time.time()
prev_index = -1  # 초기값을 -1로 설정하여 첫 번째 인식 시 문제가 없도록 합니다.
sentence = ''
recognizeDelay = 1  # 인식 딜레이 설정

output_data = {'gestures': [], 'text': ''}

while True:
    ret, img = cap.read()
    if not ret:
        continue
    img = cv2.flip(img, 1)  # 이미지를 좌우 반전하여 거울 모드로 표시

    # 이미지를 RGB로 변환
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # 손 검출 수행
    result = hands.process(img_rgb)

    if result.multi_hand_landmarks is not None:
        for res in result.multi_hand_landmarks:
            joint = np.zeros((21, 3))
            for j, lm in enumerate(res.landmark):
                joint[j] = [lm.x, lm.y, lm.z]

            # 각도 계산
            v1 = joint[[0, 1, 2, 3, 0, 5, 6, 7, 0,
                        9, 10, 11, 0, 13, 14, 15, 0, 17, 18, 19], :]
            v2 = joint[[1, 2, 3, 4, 5, 6, 7, 8, 9,
                        10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], :]
            v = v2 - v1
            v = v / np.linalg.norm(v, axis=1)[:, np.newaxis]

            compareV1 = v[[0, 1, 2, 4, 5, 6, 7, 8, 9,
                           10, 12, 13, 14, 16, 17], :]
            compareV2 = v[[1, 2, 3, 5, 6, 7, 9, 10, 11,
                           13, 14, 15, 17, 18, 19], :]
            angle = np.arccos(np.einsum('nt,nt->n', compareV1, compareV2))
            angle = np.degrees(angle)

            data = np.array([angle], dtype=np.float32)
            ret, results, neighbours, dist = knn.findNearest(data, 3)
            idx = int(results[0][0])

            # 인식된 라벨 번호가 gesture_inv에 있는지 확인
            if idx in gesture_inv:
                current_gesture = gesture_inv[idx]

                if idx != prev_index:
                    startTime = time.time()
                    prev_index = idx
                else:
                    if time.time() - startTime > recognizeDelay:
                        if current_gesture == 'spacing':
                            sentence += ' '
                        elif current_gesture == 'backspace':
                            if len(sentence) > 0:
                                sentence = sentence[:-1]  # 마지막 문자 제거
                        else:
                            sentence += current_gesture
                        startTime = time.time()

                        # 인식된 수어를 터미널에 출력
                        print(f"인식된 수어: {current_gesture}")

                # 손 랜드마크를 이미지에 그리기
                mp_drawing.draw_landmarks(img, res, mp_hands.HAND_CONNECTIONS)

                # 이미지에 텍스트를 그리기 위해 PIL로 변환
                img_pil = Image.fromarray(img)
                draw = ImageDraw.Draw(img_pil)

                # 인식된 수어를 이미지에 표시
                position = (int(res.landmark[0].x * img.shape[1] - 10),
                            int(res.landmark[0].y * img.shape[0] + 40))
                draw.text(position, current_gesture, font=font, fill=(255, 255, 255))

                # 현재까지 인식된 문장 표시
                draw.text((20, 440), sentence, font=font, fill=(255, 255, 255))

                # 다시 OpenCV 이미지로 변환
                img = np.array(img_pil)
            else:
                # 수어가 인식되지 않음
                print("수어를 인식하지 못했습니다.")
                prev_index = -1  # 이전 인덱스 초기화

    else:
        # 손이 인식되지 않음
        print("손을 감지하지 못했습니다.")
        prev_index = -1  # 이전 인덱스 초기화

    cv2.imshow('HandTracking', img)

    key = cv2.waitKey(1)
    if key == ord('.'):
        output_data['text'] = sentence
        json_filename = 'output_data.json'
        # 한국어를 저장하기 위해 UTF-8 인코딩 설정
        with open(json_filename, 'w', encoding='utf-8') as json_file:
            json.dump(output_data, json_file, indent=4, ensure_ascii=False)
        break

cap.release()
cv2.destroyAllWindows()
