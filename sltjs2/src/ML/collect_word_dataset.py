# 수어 단어 데이터 수집
import cv2
import numpy as np
import os
import time
import mediapipe as mp
from PIL import ImageFont, ImageDraw, Image  # PIL 라이브러리 임포트

# 액션(단어) 리스트
actions = np.array(['감사합니다', '죄송합니다', '보다', '알다', '안녕하세요', '무동작'])
# 데이터 저장 경로
DATA_PATH = os.path.join('MP_Data')

# 각 단어별로 30개의 시퀀스(동영상)를 저장할 예정
no_sequences = 30

# 각 시퀀스는 30 프레임으로 구성
sequence_length = 30

# 디렉토리 생성
for action in actions:
    for sequence in range(no_sequences):
        try:
            os.makedirs(os.path.join(DATA_PATH, action, str(sequence)))
        except:
            pass

mp_holistic = mp.solutions.holistic  # MediaPipe Holistic 모델
mp_drawing = mp.solutions.drawing_utils  # 관절 좌표 시각화 유틸리티

def mediapipe_detection(image, model):
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)  # BGR에서 RGB로 변환
    image.flags.writeable = False  # 이미지 쓰기 불가능으로 설정
    results = model.process(image)  # 모델로 이미지 처리
    image.flags.writeable = True  # 이미지 쓰기 가능으로 재설정
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)  # RGB에서 BGR로 변환
    return image, results

def extract_keypoints(results):
    # 포즈 랜드마크 추출
    pose = np.array([[res.x, res.y, res.z, res.visibility] for res in 
                     results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33*4)
    # 왼손 랜드마크 추출
    lh = np.array([[res.x, res.y, res.z] for res in 
                   results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21*3)
    # 오른손 랜드마크 추출
    rh = np.array([[res.x, res.y, res.z] for res in 
                   results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21*3)
    return np.concatenate([pose, lh, rh])

cap = cv2.VideoCapture(0)
# 웹캠 해상도 설정 (화면 크기를 줄임)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

# 폰트 설정 (한글 지원 폰트 파일 경로)
fontpath = "fonts/gulim.ttc"  # 시스템에 해당 폰트가 설치되어 있어야 합니다.
font = ImageFont.truetype(fontpath, 20)

# MediaPipe 모델 설정
with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
    # 각 단어별로 데이터 수집
    for action_idx, action in enumerate(actions):
        print(f'현재 수집 중인 단어: {action} ({action_idx + 1}/{len(actions)})')

        # 5초 카운트다운 표시
        for countdown in range(10, 0, -1):
            ret, frame = cap.read()
            # 이미지를 PIL 형식으로 변환 (한글 텍스트 표시를 위해)
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image_pil = Image.fromarray(image)
            draw = ImageDraw.Draw(image_pil)

            # 텍스트 내용 설정
            countdown_text = f"{action} 동작을 준비하세요: {countdown}초"
            # 텍스트 위치 설정
            draw.rectangle([(0, 0), (640, 50)], fill=(0, 0, 0))  # 상단에 검은색 배경 바 생성
            draw.text((10, 15), countdown_text, font=font, fill=(255, 255, 255))
            # 이미지를 다시 OpenCV 형식으로 변환
            image = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2BGR)
            # 이미지 표시
            cv2.imshow('OpenCV Feed', image)
            if cv2.waitKey(1000) & 0xFF == ord('q'):
                break

        # 각 시퀀스(동영상)마다 데이터 수집
        for sequence in range(no_sequences):
            print(f'  - 시퀀스 번호: {sequence + 1}/{no_sequences}')
            time.sleep(2)  # 녹화 간 1초 텀

            # 각 프레임마다 데이터 수집
            for frame_num in range(sequence_length):
                # 웹캠에서 프레임 읽기
                ret, frame = cap.read()
                
                # MediaPipe 검출
                image, results = mediapipe_detection(frame, holistic)
                
                # 랜드마크 그리기
                mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_holistic.POSE_CONNECTIONS)
                mp_drawing.draw_landmarks(image, results.left_hand_landmarks, mp_holistic.HAND_CONNECTIONS)
                mp_drawing.draw_landmarks(image, results.right_hand_landmarks, mp_holistic.HAND_CONNECTIONS)
                
                # 이미지를 PIL 형식으로 변환 (한글 텍스트 표시를 위해)
                image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                image_pil = Image.fromarray(image)
                draw = ImageDraw.Draw(image_pil)
                
                # 수집 시작 신호 표시
                if frame_num == 0:
                    # 텍스트 내용 설정
                    start_text = "데이터 수집 시작"
                    action_text = f"동작: {action} (시퀀스 {sequence + 1}/{no_sequences})"
                    # 텍스트 위치 설정
                    draw.rectangle([(0, 0), (640, 50)], fill=(0, 0, 0))  # 상단에 검은색 배경 바 생성
                    draw.text((10, 10), start_text, font=font, fill=(255, 255, 255))
                    draw.text((10, 30), action_text, font=font, fill=(255, 255, 255))
                    # 이미지를 다시 OpenCV 형식으로 변환
                    image = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2BGR)
                    # 이미지 표시
                    cv2.imshow('OpenCV Feed', image)
                    cv2.waitKey(2000)  # 2초 대기
                else:
                    # 텍스트 내용 설정
                    action_text = f"동작: {action} (시퀀스 {sequence + 1}/{no_sequences})"
                    # 텍스트 위치 설정
                    draw.rectangle([(0, 0), (640, 30)], fill=(0, 0, 0))  # 상단에 검은색 배경 바 생성
                    draw.text((10, 5), action_text, font=font, fill=(255, 255, 255))
                    # 이미지를 다시 OpenCV 형식으로 변환
                    image = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2BGR)
                    # 이미지 표시
                    cv2.imshow('OpenCV Feed', image)
                
                # 관절 좌표 추출
                keypoints = extract_keypoints(results)
                # 관절 좌표 저장
                npy_path = os.path.join(DATA_PATH, action, str(sequence), str(frame_num))
                np.save(npy_path, keypoints)
                
                # 종료 조건
                if cv2.waitKey(10) & 0xFF == ord('q'):
                    break
            # 프레임 루프 종료 조건
            if cv2.waitKey(10) & 0xFF == ord('q'):
                break
        # 시퀀스 루프 종료 조건
        if cv2.waitKey(10) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()
