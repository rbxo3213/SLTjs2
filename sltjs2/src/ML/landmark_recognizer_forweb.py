# landmark_recognizer_forweb.py

import os
import sys
import json
import numpy as np
import cv2

# 스크립트 파일의 디렉토리 경로를 가져옵니다.
script_dir = os.path.dirname(os.path.abspath(__file__))
# gesture_dataset.txt의 전체 경로를 설정합니다.
dataset_path = os.path.join(script_dir, 'gesture_dataset.txt')

# 데이터셋 로드 및 KNN 학습
file = np.genfromtxt(dataset_path, delimiter=',')
angleFile = file[:, :-1]
labelFile = file[:, -1]
angles_dataset = angleFile.astype(np.float32)
labels_dataset = labelFile.astype(np.float32)

# KNN 분류기 학습
knn = cv2.ml.KNearest_create()
knn.train(angles_dataset, cv2.ml.ROW_SAMPLE, labels_dataset)

# 제스처 라벨 매핑
gesture_mapping = {
    0: 'ㄱ', 1: 'ㄴ', 2: 'ㄷ', 3: 'ㄹ', 4: 'ㅁ', 5: 'ㅂ', 6: 'ㅅ', 7: 'ㅇ',
    8: 'ㅈ', 9: 'ㅊ', 10: 'ㅋ', 11: 'ㅌ', 12: 'ㅍ', 13: 'ㅎ',
    14: 'ㅏ', 15: 'ㅓ', 16: 'ㅗ', 17: 'ㅜ', 18: 'ㅡ', 19: 'ㅣ',
    20: 'ㅐ', 21: 'ㅔ', 22: 'ㅚ', 23: 'ㅟ', 24: 'ㅢ', 25: 'ㅑ',
    26: 'ㅕ', 27: 'ㅛ', 28: 'ㅠ', 29: 'ㅒ', 30: 'ㅖ',
    31: 'spacing', 32: 'backspace'
}

# 표준 출력 인코딩 설정
sys.stdout.reconfigure(encoding='utf-8')

def calculate_angles(landmarks):
    joint = np.array([[lm["x"], lm["y"], lm["z"]] for lm in landmarks], dtype=np.float32)

    # 랜드마크 수 검증
    if joint.shape[0] != 21:
        raise ValueError(f"Expected 21 landmarks, got {joint.shape[0]}")

    # 벡터 계산
    v1 = joint[[0, 1, 2, 3, 0, 5, 6, 7, 0,
               9, 10, 11, 0, 13, 14, 15, 0, 17, 18, 19], :]
    v2 = joint[[1, 2, 3, 4, 5, 6, 7, 8, 9,
               10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], :]
    v = v2 - v1
    v = v / np.linalg.norm(v, axis=1)[:, np.newaxis]

    # 각도 계산을 위한 벡터 선택
    compareV1 = v[[0, 1, 2, 4, 5, 6, 7, 8, 9,
                   10, 12, 13, 14, 16, 17], :]
    compareV2 = v[[1, 2, 3, 5, 6, 7, 9, 10, 11,
                   13, 14, 15, 17, 18, 19], :]
    angles = np.arccos(np.einsum('nt,nt->n', compareV1, compareV2))
    angles = np.degrees(angles)

    return angles

def main():
    buffer = ""
    while True:
        try:
            chunk = sys.stdin.read(1)
            if not chunk:
                break  # 입력 스트림이 끝났을 때
            if chunk == "\n":
                if buffer:
                    # 완전한 JSON 문자열을 받았을 때 처리
                    try:
                        landmarks = json.loads(buffer)
                        angles = calculate_angles(landmarks)
                        data = angles.reshape(1, -1).astype(np.float32)
                        ret, results, neighbours, dist = knn.findNearest(data, 3)
                        predicted_idx = int(results[0][0])
                        predicted_gesture = gesture_mapping.get(predicted_idx, "Unknown Gesture")
                        result_json = json.dumps({'result': predicted_gesture}, ensure_ascii=False)
                        print(result_json)
                        sys.stdout.flush()
                    except json.JSONDecodeError as e:
                        error_msg = json.dumps({'error': f"JSON decode error: {e}"}, ensure_ascii=False)
                        print(error_msg)
                        sys.stdout.flush()
                    except Exception as e:
                        error_msg = json.dumps({'error': str(e)}, ensure_ascii=False)
                        print(error_msg)
                        sys.stdout.flush()
                    buffer = ""
            else:
                buffer += chunk
        except Exception as e:
            error_msg = json.dumps({'error': str(e)}, ensure_ascii=False)
            print(error_msg)
            sys.stdout.flush()

if __name__ == "__main__":
    main()
