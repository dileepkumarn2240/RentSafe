function loadRecaptchaScript(siteKey: string): Promise<void> {
  if (document.querySelector('script[data-recaptcha-v3]')) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    s.async = true;
    s.dataset.recaptchaV3 = '1';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('reCAPTCHA script failed to load'));
    document.head.appendChild(s);
  });
}

/** Returns a v3 token when `VITE_RECAPTCHA_SITE_KEY` is set; otherwise undefined. */
export async function getSignInCaptchaToken(): Promise<string | undefined> {
  const key = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
  if (!key) return undefined;
  await loadRecaptchaScript(key);
  if (!window.grecaptcha) return undefined;
  return new Promise((resolve) => {
    window.grecaptcha!.ready(() => {
      window
        .grecaptcha!.execute(key, { action: 'login' })
        .then(resolve)
        .catch(() => resolve(undefined));
    });
  });
}
