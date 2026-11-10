// 다른 사람에게 보일 글의 욕설 규칙 (spec content-moderation "욕설 규칙 거절"). AI 전에 명백한 욕설만 결정적으로 거절한다.
// 비방·조롱처럼 문맥이 필요한 판정은 AI에 맡긴다. 사전은 서버 전용 코드라 앱 번들에 실리지 않는다.

// NFKC는 호환 자모(ㅅ)를 첫소리 자모(U+1109)로 바꾸므로 사전과 맞도록 호환 자모로 되돌린다.
const Choseong = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const Jungseong = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';

function toCompatibilityJamo(text: string) {
  return text.replace(/[ᄀ-ᄒᄡᅡ-ᅵ]/g, (c) => {
    const code = c.charCodeAt(0);
    if (code === 0x1121) return 'ㅂㅅ';
    return code <= 0x1112 ? Choseong[code - 0x1100] : Jungseong[code - 0x1161];
  });
}

/**
 * 전각·호환 문자를 통일하고 한글 외 문자(숫자·특수문자·영문)를 지운 뒤, 한 글자짜리 토큰이 이어지면 붙인다.
 * "시1발"·"시.발" → "시발", "씨 발"·"ㅅ ㅂ" → "씨발"·"ㅅㅂ". "다시 발견"처럼 여러 글자 단어 사이는 붙이지 않는다.
 */
export function normalizeForProfanity(text: string) {
  const tokens = toCompatibilityJamo(text.normalize('NFKC'))
    .replace(/[^가-힣ㄱ-ㅣ\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  const words: string[] = [];
  let run = '';
  for (const token of tokens) {
    if ([...token].length === 1) {
      run += token;
      continue;
    }
    if (run) words.push(run);
    run = '';
    words.push(token);
  }
  if (run) words.push(run);
  return words.join(' ');
}

// 욕설과 글자가 겹치는 일상어. 이 부분만 지우고 다시 검사하므로 "시발점 시발"은 그대로 걸린다.
const AllowedWords = [
  '시발점',
  '시발역',
  '시발택시',
  '시발자동차',
  '시발차',
  '질병신',
  '투병신',
  '등신대',
  '씨발라',
  '씨발려',
  // 띄어쓰기 없이 쓴 일상어(출시발표·다시발견·개시발령 등)
  '출시발',
  '다시발',
  '개시발',
  '시팔십',
  '보존나',
  '공존나',
  '등신불',
];

// 개같이·개소리·닥쳐처럼 일상어와 겹치거나 욕설 강도가 약한 말은 AI 판정에 맡긴다.
const ProfanityPatterns = [
  /[시씨쒸씌쉬싀쓰][발빨벌뻘팔펄]/,
  /개[새세쌔섀][끼키기]|개색[기히]|개같[은네다]/,
  /[병븅빙]신|병딱/,
  /좆|존나|좃같/,
  /지랄|염병/,
  /씹[새세쌔창년놈]/,
  /[썅쌍][년놈]|썅/,
  /니[애에]미|느금|엠창|애미뒤/,
  /미친(?:놈|년|넘|새끼)/,
  /등신|병자새/,
  /틀딱|맘충|한남충|김치녀|된장녀|급식충|짱깨|쪽바리/,
  /ㅅㅂ|ㅆㅂ|ㅂㅅ|ㅈㄹ|ㄱㅅㄲ|ㅅㄲ|ㅆㄹㄱ/,
];

const EnglishProfanity = /\b(?:f+u+c+k+\w*|sh[i1]t\w*|b[i1]tch\w*|assholes?|motherf\w*)\b/i;

export function hasProfanity(text: string) {
  if (EnglishProfanity.test(text.normalize('NFKC'))) return true;
  let normalized = normalizeForProfanity(text);
  for (const word of AllowedWords) normalized = normalized.split(word).join(' ');
  return ProfanityPatterns.some((pattern) => pattern.test(normalized));
}

// 위기 판정은 AI가 한다. 이 검사는 AI를 쓸 수 없을 때 욕설 규칙 거절을 보류할지만 정하므로 넓게 잡는다.
const CrisisHints =
  /죽고싶|죽고파|죽어버리|죽어야|죽을래|죽을까|죽고말|죽을것같|자살(?!골)|자해|극단적선택|끝내고싶|끝낼래|끝내버리|인생끝|사라지고싶|없어지고싶|살기싫|살고싶지않|그만살|살이유|깨어나지않|안깨어났|뛰어내리|목숨을끊/;

export function hasCrisisHint(text: string) {
  return CrisisHints.test(text.normalize('NFKC').replace(/[^가-힣]/g, ''));
}
