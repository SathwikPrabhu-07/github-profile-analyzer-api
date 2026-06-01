// Direct regex check matching routes regex rules for GitHub usernames
const usernameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

describe('Username Validation Regex Tests', () => {
  const check = (username) => usernameRegex.test(username);

  test('valid username patterns', () => {
    expect(check('torvalds')).toBe(true);
    expect(check('octocat')).toBe(true);
    expect(check('my-cool-username')).toBe(true);
    expect(check('user123')).toBe(true);
    expect(check('a-b-c-d')).toBe(true);
    expect(check('A')).toBe(true); // single char allowed
  });

  test('invalid username patterns', () => {
    expect(check('')).toBe(false); // empty
    expect(check('-start-with-hyphen')).toBe(false);
    expect(check('end-with-hyphen-')).toBe(false);
    expect(check('double--hyphen')).toBe(false);
    expect(check('invalid_char')).toBe(false); // underscore not allowed
    expect(check('invalid.char')).toBe(false); // dot not allowed
    expect(check('a'.repeat(40))).toBe(false); // exceeding 39 chars
    expect(check('my cool username')).toBe(false); // space not allowed
  });
});
