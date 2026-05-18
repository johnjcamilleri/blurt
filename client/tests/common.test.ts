import assert from 'node:assert';
import { describe, it } from 'node:test';
import { containsOnlyEmoji } from '../src/common';

describe('emoji detection', () => {
  it('plain heart', () => {
    assert(!containsOnlyEmoji('❤'));
  })
  it('emoji heart', () => {
    assert(containsOnlyEmoji('❤️'));
  })
  it('multiple emoji', () => {
    assert(containsOnlyEmoji('❤️☺️⭐️'));
  })
  it('combination emoji', () => {
    assert(containsOnlyEmoji('🧑🏻‍💻'));
  })
  it('with text', () => {
    assert(!containsOnlyEmoji('ok 👍🏻'));
  })
})
