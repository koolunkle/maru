import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadSource } from './helpers/load-source.mjs';

const { hasProfanity, hasCrisisHint, normalizeForProfanity } = await loadSource(
  '../supabase/functions/_shared/moderation-profanity.ts',
);

test('그대로 쓴 욕설과 변형 욕설을 찾는다', () => {
  for (const value of [
    '시발 진짜',
    '씨발',
    '아씨발 뭐야',
    'ㅅㅂ 이게 뭐야',
    'ㅆㅂ',
    'ㅄ같네',
    '시1발',
    '씨 발',
    '시.발',
    '시 1 발',
    'ㅅ ㅂ',
    '시８발',
    'ㅅㅣ발',
    '개새끼',
    '개 새 끼',
    '병신아',
    '지랄하네',
    '존나 별로',
    '미친놈',
    '틀딱들',
    'what the fuck',
  ]) {
    assert.equal(hasProfanity(value), true, value);
  }
});

test('욕설과 겹치는 일상어와 일상 문장은 욕설로 보지 않는다', () => {
  for (const value of [
    '오늘이 새 루틴의 시발점이에요',
    '어제 축구 보다가 자살골 나왔어요',
    '수박씨 발라 먹었어요',
    '수박씨발라 먹었어요',
    '사부님께 인사했어요',
    '다시 발견한 산책길이에요',
    '오늘 시 발표가 있었어요',
    '질병신고 하고 왔어요',
    '등신대 앞에서 사진 찍었어요',
    '새끼 고양이가 귀여웠어요',
    '미친 듯이 좋았어요',
    '마음이 무거워요',
    '호수 공원 하늘이 정말 맑았어요',
    '오늘 하루도 버틴 당신, 정말 잘했어요',
    '이번주는 정말 힘들었어요',
    '선생님 감사합니다',
    '서울둘레길 1구간 걸었어요',
    '오늘 저도 걸었어요, 같이 힘내요',
    'ㅋㅋㅋ 좋아요',
  ]) {
    assert.equal(hasProfanity(value), false, value);
  }
});

test('허용어 부분만 빼고 다시 검사한다', () => {
  assert.equal(hasProfanity('시발점 시발'), true);
  assert.equal(hasProfanity('자살골 병신'), true);
});

test('한 글자 토큰만 붙이고 여러 글자 단어 사이는 붙이지 않는다', () => {
  assert.equal(normalizeForProfanity('씨 발 놈'), '씨발놈');
  assert.equal(normalizeForProfanity('다시 발견'), '다시 발견');
  assert.equal(normalizeForProfanity('ㅅ ㅂ'), 'ㅅㅂ');
});

test('위기 표현 힌트를 넓게 찾고 자살골은 제외한다', () => {
  for (const value of ['죽고 싶다', '자해했어요', '사라지고 싶어', '살기 싫어', '자살하고 싶어요'])
    assert.equal(hasCrisisHint(value), true, value);
  for (const value of ['자살골 나왔어요', '오늘 산책했어요', '시발 짜증나'])
    assert.equal(hasCrisisHint(value), false, value);
});
