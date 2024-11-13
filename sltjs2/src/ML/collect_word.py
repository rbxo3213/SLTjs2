import cv2
import numpy as np
import os
import time
import mediapipe as mp
from PIL import ImageFont, ImageDraw, Image

# 사용자 설정 부분
ACTIONS = ['괜찮다', '보다']  # 수어 단어 리스트
DATA_PATH = 'MP_Data'  # 데이터 저장 경로
SEQ_LENGTH = 30        # 각 시퀀스당 프레임 수
NUM_SEQUENCES = 30     # 각 단어당 시퀀스 수

# 폰트 설정 (한글 지원 폰트 파일 경로)
FONT_PATH = "fonts/gulim.ttc"  # 시스템에 해당 폰트가 설치되어 있어야 합니다.
FONT_SIZE = 20

# MediaPipe 설정
mp_holistic = mp.solutions.holistic  # MediaPipe Holistic 모델
mp_drawing = mp.solutions.drawing_utils  # 랜드마크 그리기 유틸리티

def create_data_folders(actions):
    for action in actions:
        dir_max = 0
        if os.path.exists(os.path.join(DATA_PATH, action)):
            existing_sequences = os.listdir(os.path.join(DATA_PATH, action))
            if existing_sequences:
                dir_max = max([int(seq) for seq in existing_sequences if seq.isdigit()]) + 1
        else:
            os.makedirs(os.path.join(DATA_PATH, action))
            dir_max = 0
        for sequence in range(dir_max, dir_max + NUM_SEQUENCES):
            os.makedirs(os.path.join(DATA_PATH, action, str(sequence)), exist_ok=True)

def mediapipe_detection(image, model):
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image.flags.writeable = False
    results = model.process(image)  # 모델로 이미지 처리
    image.flags.writeable = True
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    return image, results

def draw_landmarks(image, results):
    # 얼굴, 포즈, 손 랜드마크 그리기
    mp_drawing.draw_landmarks(image, results.face_landmarks, mp_holistic.FACEMESH_CONTOURS)
    mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_holistic.POSE_CONNECTIONS)
    mp_drawing.draw_landmarks(image, results.left_hand_landmarks, mp_holistic.HAND_CONNECTIONS)
    mp_drawing.draw_landmarks(image, results.right_hand_landmarks, mp_holistic.HAND_CONNECTIONS)

def extract_keypoints(results):
    # 랜드마크 추출 및 결합
    pose = np.array([[res.x, res.y, res.z] for res in
                     results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33 * 3)
    face = np.array([[res.x, res.y, res.z] for res in
                     results.face_landmarks.landmark]).flatten() if results.face_landmarks else np.zeros(468 * 3)
    lh = np.array([[res.x, res.y, res.z] for res in
                   results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21 * 3)
    rh = np.array([[res.x, res.y, res.z] for res in
                   results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21 * 3)
    return np.concatenate([pose, face, lh, rh])

def put_text_pil(image, text, position, font, color=(255, 255, 255)):
    # OpenCV 이미지를 PIL 이미지로 변환
    image_pil = Image.fromarray(image)
    draw = ImageDraw.Draw(image_pil)
    draw.text(position, text, font=font, fill=color)
    # PIL 이미지를 OpenCV 이미지로 변환하여 반환
    return np.array(image_pil)

def main():
    # 폰트 로드
    try:
        font = ImageFont.truetype(FONT_PATH, FONT_SIZE)
    except IOError:
        print(f"폰트를 찾을 수 없습니다. FONT_PATH를 확인해주세요: {FONT_PATH}")
        return

    # 데이터 저장 폴더 생성
    create_data_folders(ACTIONS)

    # 웹캠 설정
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("카메라를 열 수 없습니다.")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    # MediaPipe 모델 로드
    with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
        for action in ACTIONS:
            print(f'현재 수집 중인 단어: {action}')
            for sequence in range(NUM_SEQUENCES):
                print(f'  - 시퀀스 번호: {sequence + 1}/{NUM_SEQUENCES}')
                # 카운트다운
                for countdown in range(3, 0, -1):
                    ret, frame = cap.read()
                    if not ret:
                        print("카메라로부터 프레임을 가져올 수 없습니다.")
                        break
                    message = f'{action} 동작을 준비하세요: {countdown}'
                    frame = put_text_pil(frame, message, (10, 30), font)
                    cv2.imshow('Data Collection', frame)
                    if cv2.waitKey(1000) & 0xFF == ord('q'):
                        return

                # 데이터 수집
                keypoints_sequence = []
                for frame_num in range(SEQ_LENGTH):
                    ret, frame = cap.read()
                    if not ret:
                        print("카메라로부터 프레임을 가져올 수 없습니다.")
                        break

                    # 모델로 랜드마크 검출
                    image, results = mediapipe_detection(frame, holistic)
                    # 랜드마크 그리기
                    draw_landmarks(image, results)
                    # 랜드마크 추출
                    keypoints = extract_keypoints(results)
                    keypoints_sequence.append(keypoints)
                    # 진행 상황 표시
                    message = f'{action} - 시퀀스 {sequence + 1}/{NUM_SEQUENCES} - 프레임 {frame_num + 1}/{SEQ_LENGTH}'
                    image = put_text_pil(image, message, (10, 30), font)
                    cv2.imshow('Data Collection', image)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        return

                # 시퀀스 저장
                keypoints_sequence = np.array(keypoints_sequence)
                seq_path = os.path.join(DATA_PATH, action, str(sequence))
                np.save(os.path.join(seq_path, 'keypoints.npy'), keypoints_sequence)

    cap.release()
    cv2.destroyAllWindows()
    print("데이터 수집이 완료되었습니다.")

if __name__ == '__main__':
    main()
