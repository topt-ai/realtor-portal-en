const MAP: Array<[RegExp, string]> = [
  [/invalid login credentials/i, 'Incorrect email or password'],
  [/email not confirmed/i, 'Please confirm your email before continuing'],
  [/too many requests|rate limit/i, 'Too many attempts. Wait a few minutes'],
  [/user not found/i, 'No account found with that email'],
  [/expired/i, 'Token expired'],
  [/password should be at least/i, 'Password must be at least 8 characters'],
  [/new password should be different/i, 'New password must be different from the current one'],
];

export function translateAuthError(message: string | undefined | null): string {
  if (!message) return 'An unexpected error occurred';
  for (const [re, en] of MAP) if (re.test(message)) return en;
  return message;
}
