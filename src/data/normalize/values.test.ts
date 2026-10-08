import { describe, expect, it } from 'vitest';
import { MAX_AGE, parseAge, parseSex } from './values.ts';

describe('parseAge', () => {
  it.each([
    [0, 0],
    [7, 7],
    [110, 110],
    [MAX_AGE, MAX_AGE],
    ['34', 34],
    [' 34 ', 34],
    ['034', 34],
    ['0', 0],
  ])('parses %j as %j', (value, expected) => {
    expect(parseAge(value)).toBe(expected);
  });

  it('treats 0 as a real age, and -0 as plain 0', () => {
    expect(parseAge(0)).toBe(0);
    expect(Object.is(parseAge(-0), 0)).toBe(true);
  });

  it.each([
    ['null', null],
    ['undefined (missing)', undefined],
    ['an empty string', ''],
    ['a whitespace string', '  '],
    ['a negative number', -1],
    ['a negative string', '-1'],
    ['a fraction', 34.5],
    ['a fractional string', '0.5'],
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['an age above MAX_AGE', MAX_AGE + 1],
    ['a string above MAX_AGE', String(MAX_AGE + 1)],
    ['a non-numeric string', 'abc'],
    ['a number with a unit', '34 years'],
    ['exponent notation', '1e2'],
    ['a boolean', true],
    ['an object', {}],
    ['an empty array', []],
    ['an array with a number', [34]],
  ])('maps %s to null', (_label, value) => {
    expect(parseAge(value)).toBeNull();
  });
});

describe('parseSex', () => {
  it.each(['m', 'M', ' m ', 'male', 'Male', ' MALE '])('maps %j to male', (value) => {
    expect(parseSex(value)).toBe('male');
  });

  it.each(['f', 'F', ' f ', 'female', 'Female', ' FEMALE '])('maps %j to female', (value) => {
    expect(parseSex(value)).toBe('female');
  });

  it.each([
    ['null', null],
    ['undefined (missing)', undefined],
    ['an empty string', ''],
    ['another letter', 'x'],
    ['the word unknown', 'unknown'],
    ['both letters', 'mf'],
    ['a number', 1],
    ['a boolean', true],
    ['an object', {}],
  ])('maps %s to unknown', (_label, value) => {
    expect(parseSex(value)).toBe('unknown');
  });
});
