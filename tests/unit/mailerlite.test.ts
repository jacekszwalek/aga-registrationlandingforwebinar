import { describe, expect, it } from 'vitest';
import { mailerLiteBody, mailerLiteEndpoint } from '../../src/lib/mailerlite';

describe('MailerLite', () => {
  it('buduje publiczny endpoint formularza', () => {
    expect(mailerLiteEndpoint({ accountId: '1427944', formId: '123456789' })).toBe(
      'https://assets.mailerlite.com/jsonp/1427944/forms/123456789/subscribe',
    );
  });
  it('odrzuca ID spoza cyfr (np. wstrzyknięcie ścieżki)', () => {
    expect(() => mailerLiteEndpoint({ accountId: '1427944', formId: '../x' })).toThrow();
  });
  it('wysyła e-mail, imię, źródło i grupę newslettera tylko przy zgodzie', () => {
    const withConsent = mailerLiteBody({ email: 'a@b.pl', name: 'Anna', webinarSource: 'utm_source=facebook', newsletterGroupId: '42' });
    expect(withConsent.get('fields[email]')).toBe('a@b.pl');
    expect(withConsent.get('fields[name]')).toBe('Anna');
    expect(withConsent.get('fields[webinar_source]')).toBe('utm_source=facebook');
    expect(withConsent.getAll('groups[]')).toEqual(['42']);
    const without = mailerLiteBody({ email: 'a@b.pl', name: '', webinarSource: '', newsletterGroupId: null });
    expect(without.has('groups[]')).toBe(false);
    expect(without.has('fields[name]')).toBe(false);
  });
});
