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
      // 종성이 있는 경우 종성만 삭제
      this.currentSyllable.jong = "";
    } else if (this.currentSyllable.jung !== "") {
      // 중성이 있는 경우 중성만 삭제
      this.currentSyllable.jung = "";
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
      } else if (this.currentSyllable.jong === "") {
        // 종성에 추가
        this.currentSyllable.jong = char;
      } else {
        // 복합 받침 시도
        const combinedJong = this.currentSyllable.jong + char;
        if (JONG_MAP[combinedJong] !== undefined) {
          // 복합 받침 가능
          this.currentSyllable.jong = combinedJong;
        } else {
          // 현재 음절 완성하고 새로운 음절 시작
          this.result += this.composeSyllable(this.currentSyllable);
          this.currentSyllable = { cho: char, jung: "", jong: "" };
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
        if (JUNG_MAP[combinedJung] !== undefined) {
          // 이중 모음 가능
          this.currentSyllable.jung = combinedJung;
        } else {
          // 받침이 있으면 받침을 다음 음절의 초성으로 이동
          if (this.currentSyllable.jong !== "") {
            const jong = this.currentSyllable.jong;
            // 현재 음절 완성
            this.result += this.composeSyllable({
              cho: this.currentSyllable.cho,
              jung: this.currentSyllable.jung,
              jong: "",
            });
            // 새로운 음절 시작
            this.currentSyllable = {
              cho: jong,
              jung: char,
              jong: "",
            };
          } else {
            // 현재 음절 완성하고 새로운 음절 시작
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
