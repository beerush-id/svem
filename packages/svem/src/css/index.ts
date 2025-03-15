export function svemScript() {
  const subscriptions = new Map<Element, () => void>();

  const subscribe = () => {
    document.querySelectorAll('[role="tablist"]').forEach((tablist) => {
      const id = tablist.getAttribute('id') ?? '';
      const buttons = tablist.querySelectorAll(`[role="tab"][data-tab="${id}"]`);
      const contents = tablist.querySelectorAll(`[role="tabpanel"][data-tab="${id}"]`);

      setTimeout(() => {
        const previewHeight = (contents[0] as HTMLElement)?.offsetHeight ?? 0;
        const codeHeight = previewHeight > 500 && previewHeight;
        (tablist as HTMLElement).style.setProperty('--tab-first-height', codeHeight ? `${codeHeight}px` : 'auto');
      }, 100);

      buttons.forEach((btn) => {
        const id = btn.getAttribute('id') ?? '';

        const handleClick = () => {
          buttons.forEach((b) => {
            if (b.getAttribute('id') === id) {
              b.setAttribute('aria-selected', 'true');
              b.setAttribute('data-tab-active', '');
            } else {
              b.setAttribute('aria-selected', 'false');
              b.removeAttribute('data-tab-active');
            }
          });

          contents.forEach((c) => {
            if (c.getAttribute('aria-labelledby') === id) {
              c.classList.remove('hidden');
              c.setAttribute('aria-hidden', 'false');
              c.setAttribute('data-tab-active', '');
            } else {
              c.classList.add('hidden');
              c.setAttribute('aria-hidden', 'true');
              c.removeAttribute('data-tab-active');
            }
          });
        };

        btn.addEventListener('click', handleClick);
        subscriptions.set(btn, handleClick);
      });
    });

    document.querySelectorAll('[data-raw-code-copy]').forEach((btn) => {
      const id = btn.getAttribute('data-raw-code-copy') ?? '';

      if (id) {
        const rawCode = document.querySelector(`[data-raw-code="${id}"]`);

        if (rawCode) {
          const handleClick = () => {
            try {
              const decoded = rawCode.textContent?.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code));
              navigator.clipboard.writeText(decoded ?? '');

              btn.classList.remove('error');
              btn.classList.add('success');
            } catch (err) {
              console.error(err);
              btn.classList.remove('success');
              btn.classList.add('error');
            }

            setTimeout(() => {
              btn.classList.remove('success', 'error');
            }, 2000);
          };

          btn.addEventListener('click', handleClick);
          subscriptions.set(btn, handleClick);
        }
      }
    });
  };

  const unsubscribe = () => {
    for (const [el, fn] of subscriptions) {
      el.removeEventListener('click', fn);
      subscriptions.delete(el);
    }
  };

  return {
    subscribe,
    unsubscribe,
  };
}
