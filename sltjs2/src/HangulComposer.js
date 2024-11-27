// HangulComposer.js

class HangulComposer {
  constructor() {
    this.result = "";
    this.currentSyllable = { cho: "", jung: "", jong: "" };
    this.CHO = [
      "ㄱ",
      "ㄲ",
      "ㄴ",
      "ㄷ",
      "ㄸ",
      "ㄹ",
      "ㅁ",
      "ㅂ",
      "ㅃ",
      "ㅅ",
      "ㅆ",
      "ㅇ",
      "ㅈ",
      "ㅉ",
      "ㅊ",
      "ㅋ",
      "ㅌ",
      "ㅍ",
      "ㅎ",
    ];
    this.JUNG = [
      "ㅏ",
      "ㅐ",
      "ㅑ",
      "ㅒ",
      "ㅓ",
      "ㅔ",
      "ㅕ",
      "ㅖ",
      "ㅗ",
      "ㅘ",
      "ㅙ",
      "ㅚ",
      "ㅛ",
      "ㅜ",
      "ㅝ",
      "ㅞ",
      "ㅟ",
      "ㅠ",
      "ㅡ",
      "ㅢ",
      "ㅣ",
    ];
    this.JONG = [
      "",
      "ㄱ",
      "ㄲ",
      "ㄳ",
      "ㄴ",
      "ㄵ",
      "ㄶ",
      "ㄷ",
      "ㄹ",
      "ㄺ",
      "ㄻ",
      "ㄼ",
      "ㄽ",
      "ㄾ",
      "ㄿ",
      "ㅀ",
      "ㅁ",
      "ㅂ",
      "ㅄ",
      "ㅅ",
      "ㅆ",
      "ㅇ",
      "ㅈ",
      "ㅊ",
      "ㅋ",
      "ㅌ",
      "ㅍ",
      "ㅎ",
    ];

    this.CHO_MAP = {};
    this.JUNG_MAP = {};
    this.JONG_MAP = {};

    this.CHO.forEach((char, index) => {
      this.CHO_MAP[char] = index;
    });

    this.JUNG.forEach((char, index) => {
      this.JUNG_MAP[char] = index;
    });

    this.JONG.forEach((char, index) => {
      this.JONG_MAP[char] = index;
    });
  }

  // 마지막 글자 삭제
  deleteLast() {
    if (this.currentSyllable.jong !== "") {
      if (this.currentSyllable.jong.length > 1) {
        // 겹받침인 경우 마지막 자음만 제거
        this.currentSyllable.jong = this.currentSyllable.jong.slice(0, -1);
      } else {
        // 종성이 단일 자음인 경우 종성 삭제
        this.currentSyllable.jong = "";
      }
    } else if (this.currentSyllable.jung !== "") {
      if (this.currentSyllable.jung.length > 1) {
        // 이중 모음인 경우 마지막 모음만 제거
        this.currentSyllable.jung = this.currentSyllable.jung.slice(0, -1);
      } else {
        // 중성이 단일 모음인 경우 중성 삭제
        this.currentSyllable.jung = "";
      }
    } else if (this.currentSyllable.cho !== "") {
      // 초성만 있는 경우 초성 삭제
      this.currentSyllable.cho = "";
    } else if (this.result.length > 0) {
      // 이미 조합된 문자가 있을 때, 마지막 글자 삭제
      this.result = this.result.slice(0, -1);
    }
  }

  input(char) {
    const { CHO_MAP, JUNG_MAP, JONG_MAP } = this;

    if (CHO_MAP[char] !== undefined) {
      // 자음 처리
      if (this.currentSyllable.jung === "") {
        // 중성이 없으면 초성에 추가 또는 교체
        if (this.currentSyllable.cho !== "") {
          // 기존 초성을 결과에 추가하고 새로운 초성 시작
          this.result += this.currentSyllable.cho;
        }
        this.currentSyllable.cho = char;
      } else {
        // 종성 처리
        if (this.currentSyllable.jong === "") {
          // 종성이 없으면 종성에 추가
          this.currentSyllable.jong = char;
        } else {
          // 기존 종성이 있는 경우 겹받침 시도
          const combinedJong = this.currentSyllable.jong + char;
          if (this.JONG.includes(combinedJong)) {
            // 겹받침 가능
            this.currentSyllable.jong = combinedJong;
          } else {
            // 겹받침 불가한 경우
            // 현재 종성의 마지막 자음을 분리하여 다음 초성으로 이동
            const lastJongChar = this.currentSyllable.jong.slice(-1);
            const remainingJong = this.currentSyllable.jong.slice(0, -1);

            if (remainingJong && JONG_MAP[remainingJong] !== undefined) {
              // 남은 종성이 유효한 경우
              this.currentSyllable.jong = remainingJong;
              this.result += this.composeSyllable(this.currentSyllable);
              // 다음 음절 시작
              this.currentSyllable = {
                cho: lastJongChar + char,
                jung: "",
                jong: "",
              };
            } else {
              // 남은 종성이 없거나 유효하지 않은 경우
              this.result += this.composeSyllable(this.currentSyllable);
              this.currentSyllable = { cho: char, jung: "", jong: "" };
            }
          }
        }
      }
    } else if (JUNG_MAP[char] !== undefined) {
      // 모음 처리
      if (this.currentSyllable.jung === "") {
        if (this.currentSyllable.cho === "") {
          // 초성과 중성이 모두 없으면 모음 자체를 결과에 추가
          this.result += char;
        } else {
          // 중성에 추가
          this.currentSyllable.jung = char;
        }
      } else {
        // 이중 모음 시도
        const combinedJung = this.currentSyllable.jung + char;
        if (this.JUNG.includes(combinedJung)) {
          // 이중 모음 가능
          this.currentSyllable.jung = combinedJung;
        } else {
          // 이중 모음 불가한 경우
          // 현재 음절을 완성하고 새로운 음절 시작
          if (this.currentSyllable.jong !== "") {
            // 종성이 있으면 종성의 마지막 자음을 다음 초성으로 이동
            const lastJongChar = this.currentSyllable.jong.slice(-1);
            const remainingJong = this.currentSyllable.jong.slice(0, -1);

            if (remainingJong && JONG_MAP[remainingJong] !== undefined) {
              // 남은 종성이 유효한 경우
              this.currentSyllable.jong = remainingJong;
              this.result += this.composeSyllable(this.currentSyllable);
              this.currentSyllable = {
                cho: lastJongChar,
                jung: char,
                jong: "",
              };
            } else {
              // 남은 종성이 없거나 유효하지 않은 경우
              this.result += this.composeSyllable({
                cho: this.currentSyllable.cho,
                jung: this.currentSyllable.jung,
                jong: "",
              });
              this.currentSyllable = {
                cho: this.currentSyllable.jong + "",
                jung: char,
                jong: "",
              };
            }
          } else {
            this.result += this.composeSyllable(this.currentSyllable);
            this.currentSyllable = { cho: "", jung: char, jong: "" };
          }
        }
      }
    } else {
      // 기타 문자 처리
      if (
        this.currentSyllable.cho !== "" ||
        this.currentSyllable.jung !== "" ||
        this.currentSyllable.jong !== ""
      ) {
        this.result += this.composeSyllable(this.currentSyllable);
        this.currentSyllable = { cho: "", jung: "", jong: "" };
      }
      this.result += char;
    }
  }

  composeSyllable(syllable) {
    const { CHO_MAP, JUNG_MAP, JONG_MAP } = this;
    if (syllable.jung === "") {
      // 중성이 없으면 조합 불가
      return syllable.cho;
    } else if (syllable.cho === "") {
      // 초성이 없으면 중성(모음) 자체를 반환
      return syllable.jung;
    } else {
      const choIndex = CHO_MAP[syllable.cho];
      const jungIndex = JUNG_MAP[syllable.jung];
      const jongIndex = syllable.jong !== "" ? JONG_MAP[syllable.jong] : 0;

      const unicode = 0xac00 + (choIndex * 21 + jungIndex) * 28 + jongIndex;
      return String.fromCharCode(unicode);
    }
  }

  getResult() {
    if (
      this.currentSyllable.cho !== "" ||
      this.currentSyllable.jung !== "" ||
      this.currentSyllable.jong !== ""
    ) {
      return this.result + this.composeSyllable(this.currentSyllable);
    } else {
      return this.result;
    }
  }

  reset() {
    this.result = "";
    this.currentSyllable = { cho: "", jung: "", jong: "" };
  }
}

export default HangulComposer;
