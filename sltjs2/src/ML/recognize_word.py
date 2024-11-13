import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
from PIL import ImageFont, ImageDraw, Image

# Mediapipe 초기화
mp_holistic = mp.solutions.holistic
mp_drawing = mp.solutions.drawing_utils

# 한글 폰트 설정
fontpath = "fonts/NanumGothic.ttf"  # 폰트 파일 경로 (환경에 맞게 변경)
try:
    font = ImageFont.truetype(fontpath, 32)
except IOError:
    print(f"폰트 파일을 찾을 수 없습니다: {fontpath}")
    exit()

# 액션(단어) 리스트 정의 (한국어 수어 단어)
actions = np.array(['감사','미안','보다','알다','서울'])

# 모델 로드
model_path = 'sltjs2/src/ML/five_words_sign_language_model.h5'
try:
    model = tf.keras.models.load_model(model_path)
    print(f"모델 로드 성공: {model_path}")
except Exception as e:
    print(f"모델 로드 실패: {e}")
    exit()

# 시퀀스 설정
sequence_length = 30  # 시퀀스 길이
sequence = []
sentence = []
threshold = 0.8 # 예측 확률 임계값

# 웹캠 초기화
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("웹캠을 열 수 없습니다.")
    exit()

def mediapipe_detection(image, model):
    """
    Mediapipe를 사용하여 이미지에서 랜드마크를 검출합니다.
    """
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image.flags.writeable = False  # 이미지 수정 불가
    results = model.process(image)  # 모델 예측 수행
    image.flags.writeable = True  # 이미지 수정 가능
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    return image, results

def extract_keypoints(results):
    """
    Mediapipe 결과에서 포즈, 왼손, 오른손의 키포인트를 추출하여 하나의 배열로 결합합니다.
    """
    if results.pose_landmarks:
        pose = np.array([[res.x, res.y, res.z, res.visibility] for res in results.pose_landmarks.landmark]).flatten()
    else:
        pose = np.zeros(33 * 4)

    if results.left_hand_landmarks:
        lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]).flatten()
    else:
        lh = np.zeros(21 * 3)

    if results.right_hand_landmarks:
        rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]).flatten()
    else:
        rh = np.zeros(21 * 3)

    return np.concatenate([pose, lh, rh])

def visualize_result(image, results, sentence):
    """
    검출된 랜드마크와 예측된 문장을 이미지에 시각화합니다.
    """
    # 얼굴 랜드마크는 표시하지 않음
    if results.pose_landmarks:
        mp_drawing.draw_landmarks(
            image, results.pose_landmarks, mp_holistic.POSE_CONNECTIONS,
            mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=4)  # 초록색으로 포즈 랜드마크 표시
        )
    if results.left_hand_landmarks:
        mp_drawing.draw_landmarks(
            image, results.left_hand_landmarks, mp_holistic.HAND_CONNECTIONS,
            mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=4)  # 초록색으로 왼손 랜드마크 표시
        )
    if results.right_hand_landmarks:
        mp_drawing.draw_landmarks(
            image, results.right_hand_landmarks, mp_holistic.HAND_CONNECTIONS,
            mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=4)  # 초록색으로 오른손 랜드마크 표시
        )

    # 한글 텍스트 표시를 위해 PIL.Image 사용
    img_pil = Image.fromarray(image)
    draw = ImageDraw.Draw(img_pil)
    text = ' '.join(sentence)
    if text:
        # 텍스트 크기 측정
        bbox = draw.textbbox((0, 0), text, font=font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        # 텍스트 배경 사각형 그리기
        draw.rectangle([(0, 0), (w + 20, h + 10)], fill=(0, 0, 0))
        # 텍스트 그리기
        draw.text((10, 5), text, font=font, fill=(255, 255, 255))
    image = np.array(img_pil)

    return image

print("수어 인식 프로그램을 시작합니다. 'q' 키를 눌러 종료하세요.")

# Mediapipe 모델 초기화
with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("프레임을 읽어올 수 없습니다.")
            continue

        # 이미지 좌우 반전 제거 (상대방 시점으로 변경)
        # frame = cv2.flip(frame, 1)  # 좌우 반전 코드를 주석 처리하여 제거

        # Mediapipe 검출
        image, results = mediapipe_detection(frame, holistic)

        # 키포인트 추출
        keypoints = extract_keypoints(results)
        sequence.append(keypoints)
        sequence = sequence[-sequence_length:]

        # 시퀀스 길이가 충분할 때 예측 수행
        if len(sequence) == sequence_length:
            res = model.predict(np.expand_dims(sequence, axis=0))[0]
            predicted_index = np.argmax(res)
            confidence = res[predicted_index]

            if confidence > threshold:
                action = actions[predicted_index]

                # 중복된 액션을 방지하고, 일정 길이를 유지
                if len(sentence) > 0:
                    if action != sentence[-1]:
                        sentence.append(action)
                else:
                    sentence.append(action)

                if len(sentence) > 5:
                    sentence = sentence[-5:]

                # 결과 출력 (콘솔)
                print(f"예측 결과: {action} (신뢰도: {confidence:.2f})")

        # 화면에 결과 표시
        image = visualize_result(image, results, sentence)

        # 화면에 이미지 표시
        cv2.imshow('Sign Language Recognizer', image)

        # 종료 조건
        if cv2.waitKey(10) & 0xFF == ord('q'):
            break

# 리소스 해제
cap.release()
cv2.destroyAllWindows()
