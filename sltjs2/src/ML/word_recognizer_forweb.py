# word_recognizer_forweb.py
import os
import sys
import json
import numpy as np
import tensorflow as tf

# 표준 출력 인코딩 설정
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# 모델 로드
model_path = os.path.join(os.path.dirname(__file__), 'six_words_sign_language_model.h5')
try:
    model = tf.keras.models.load_model(model_path)
    print(f"모델 로드 성공: {model_path}", file=sys.stderr)
except Exception as e:
    print(f"모델 로드 실패: {e}", file=sys.stderr)
    exit()

# 액션(단어) 리스트 정의 (한국어 수어 단어)
actions = np.array(['감사합니다', '죄송합니다', '보다', '알다', '안녕하세요', '무동작'])

# 시퀀스 설정
sequence_length = 30  # 시퀀스 길이
sequence = []
threshold = 0.8  # 예측 확률 임계값

def extract_keypoints(landmarks):
    # 랜드마크에서 키포인트 추출
    if landmarks.get('poseLandmarks'):
        pose = np.array([[lm['x'], lm['y'], lm['z'], lm['visibility']] for lm in landmarks['poseLandmarks']]).flatten()
    else:
        pose = np.zeros(33 * 4)

    if landmarks.get('leftHandLandmarks'):
        lh = np.array([[lm['x'], lm['y'], lm['z']] for lm in landmarks['leftHandLandmarks']]).flatten()
    else:
        lh = np.zeros(21 * 3)

    if landmarks.get('rightHandLandmarks'):
        rh = np.array([[lm['x'], lm['y'], lm['z']] for lm in landmarks['rightHandLandmarks']]).flatten()
    else:
        rh = np.zeros(21 * 3)

    return np.concatenate([pose, lh, rh])

def main():
    buffer = ""
    while True:
        try:
            chunk = sys.stdin.readline()
            if not chunk:
                break  # 입력 스트림이 끝났을 때

            if chunk:
                # JSON 문자열을 받았을 때 처리
                try:
                    landmarks = json.loads(chunk)
                    keypoints = extract_keypoints(landmarks)
                    sequence.append(keypoints)
                    sequence[:] = sequence[-sequence_length:]

                    if len(sequence) == sequence_length:
                        res = model.predict(np.expand_dims(sequence, axis=0), verbose=0)[0]
                        predicted_index = np.argmax(res)
                        confidence = res[predicted_index]

                        if confidence > threshold and actions[predicted_index] != '무동작':
                            action = actions[predicted_index]
                            # 결과 출력 (JSON)
                            result_json = json.dumps({'result': action}, ensure_ascii=False)
                            print(result_json)
                            sys.stdout.flush()
                        else:
                            print(json.dumps({'result': ''}), flush=True)
                    else:
                        print(json.dumps({'result': ''}), flush=True)

                except json.JSONDecodeError as e:
                    error_msg = json.dumps({'error': f"JSON decode error: {e}"}, ensure_ascii=False)
                    print(error_msg)
                    sys.stdout.flush()
                except Exception as e:
                    error_msg = json.dumps({'error': str(e)}, ensure_ascii=False)
                    print(error_msg)
                    sys.stdout.flush()
        except Exception as e:
            error_msg = json.dumps({'error': str(e)}, ensure_ascii=False)
            print(error_msg)
            sys.stdout.flush()

if __name__ == "__main__":
    main()
