import assert from 'node:assert';
import { describe, it } from 'node:test';
import { containsOnlyEmoji } from '../src/common';

describe('emoji detection', () => {
  it('empty', () => {
    assert(!containsOnlyEmoji(''));
  })
  it('text', () => {
    assert(!containsOnlyEmoji('hello'));
  })
  it('heart unqualified', () => {
    assert(!containsOnlyEmoji('❤')); // U+2764
  })
  it('heart qualified', () => {
    assert(containsOnlyEmoji('❤️')); // U+2764 U+FE0F
  })
  it('face unqualified', () => {
    assert(containsOnlyEmoji('🙂')); // U+1F642
  })
  it('face overqualified', () => {
    assert(containsOnlyEmoji('🙂️')); // U+1F642 U+FE0F
  })
  it('multiple emoji', () => {
    assert(containsOnlyEmoji('❤️🙂'));
  })
  it('multiple emoji with spaces', () => {
    assert(containsOnlyEmoji('❤️ 🙂'));
  })
  it('female sign', () => {
    assert(!containsOnlyEmoji('♀'));
  })
  // it('woman construction worker unqualified', () => {
  //   assert(containsOnlyEmoji('👷‍♀')); // U+1F477 U+200D U+2640
  // })
  it('woman construction worker qualified', () => {
    assert(containsOnlyEmoji('👷‍♀️')); // U+1F477 U+200D U+2640 U+FE0F
  })
  it('woman construction worker light skin qualified', () => {
    assert(containsOnlyEmoji('👷🏻‍♀️')); // U+1F477 U+1F3FB U+200D U+2640 U+FE0F
  })
  it('combination emoji', () => {
    assert(containsOnlyEmoji('🧑🏻‍💻'));
  })
  it('with text', () => {
    assert(!containsOnlyEmoji('ok👍🏻'));
  })
})
