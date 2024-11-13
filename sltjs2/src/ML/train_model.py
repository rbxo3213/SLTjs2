# 필요한 라이브러리 임포트
import numpy as np
import os
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv1D, MaxPooling1D, Flatten, Dense
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.utils import to_categorical
from sklearn.model_selection import train_test_split

# 액션(단어) 리스트 정의 (5개의 한국어 수어 단어)
actions = np.array(['감사', '괜찮다', '나', '너', '사랑'])

# 단어와 인덱스 매핑을 위한 딕셔너리 생성
label_map = {label: num for num, label in enumerate(actions)}
print("레이블 맵핑:", label_map)

# 데이터 로드 경로 설정
DATA_PATH = os.path.join('MP_Data')

# 시퀀스 및 레이블 저장을 위한 리스트 초기화
sequences, labels = [], []

# 각 액션별로 데이터를 로드
for action in actions:
    for sequence in range(30):  # 각 액션당 30개의 시퀀스
        window = []
        for frame_num in range(30):  # 각 시퀀스당 30프레임
            try:
                # 각 프레임의 .npy 파일 경로 생성
                file_path = os.path.join(DATA_PATH, action, str(sequence), f"{frame_num}.npy")
                # .npy 파일 로드
                res = np.load(file_path)
                window.append(res)
            except FileNotFoundError:
                print(f"파일을 찾을 수 없습니다: {file_path}")
                continue
            except Exception as e:
                print(f"파일 로드 중 오류 발생: {file_path}, 오류: {e}")
                continue
        # 시퀀스 길이가 30프레임인 경우만 저장
        if len(window) == 30:
            sequences.append(window)
            labels.append(label_map[action])
        else:
            print(f"시퀀스 길이 부족: 액션={action}, 시퀀스={sequence}, 수집된 프레임 수={len(window)}")

# 데이터 배열로 변환
X = np.array(sequences)
y = to_categorical(labels).astype(int)

print("데이터 셰이프:")
print("X:", X.shape)  # (총 시퀀스 수, 30, 258)
print("y:", y.shape)  # (총 시퀀스 수, 5)

# 학습 데이터와 테스트 데이터로 분할
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

print("학습 데이터 셰이프:")
print("X_train:", X_train.shape)
print("y_train:", y_train.shape)
print("테스트 데이터 셰이프:")
print("X_test:", X_test.shape)
print("y_test:", y_test.shape)

# 모델 구성 (1D-CNN)
model = Sequential()

# 첫 번째 Conv1D 레이어
model.add(Conv1D(64, 3, activation='relu', input_shape=(30, 258)))
model.add(MaxPooling1D(2))

# 두 번째 Conv1D 레이어
model.add(Conv1D(128, 3, activation='relu'))
model.add(MaxPooling1D(2))

# 세 번째 Conv1D 레이어
model.add(Conv1D(64, 3, activation='relu'))
model.add(MaxPooling1D(2))

# Flatten 레이어
model.add(Flatten())

# Dense 레이어
model.add(Dense(64, activation='relu'))
model.add(Dense(32, activation='relu'))

# 출력 레이어 (softmax 활성화 함수 사용)
model.add(Dense(actions.shape[0], activation='softmax'))

# 모델 요약 출력
model.summary()

# 옵티마이저 정의
optimizer = Adam(learning_rate=0.001)

# 모델 컴파일
model.compile(optimizer=optimizer, loss='categorical_crossentropy', metrics=['categorical_accuracy'])

# EarlyStopping 콜백 설정 (손실 함수가 1 에포크 동안 개선되지 않으면 학습 중단)
early_stopping = EarlyStopping(monitor='loss', patience=10, verbose=1, restore_best_weights=True)

# 모델 학습
history = model.fit(
    X_train, y_train,
    epochs=2000,
    callbacks=[early_stopping],
    validation_data=(X_test, y_test),
    verbose=1
)

# 모델 저장
model.save('5_words_sign_language_model.h5')
print("모델이 저장되었습니다: 5_words_sign_language_model.h5")
