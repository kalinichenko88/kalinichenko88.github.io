export function onScreen(rect: Pick<DOMRect, 'top' | 'bottom'>, viewportHeight: number) {
  return rect.top < viewportHeight && rect.bottom > 0;
}

export class MotionController {
  private observer: IntersectionObserver | null = null;
  private started = false;

  start(): void {
    if (this.started) return this.initPage();

    this.started = true;
    document.addEventListener('astro:after-swap', () => this.initPage());
    this.initPage();
  }

  initPage(): void {
    this.observer?.disconnect();

    // data-motion-ready is owned by the inline head script in Layout.astro, so
    // the hidden state applies from the first paint instead of after a flash.
    const elements = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];

    if (
      matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    ) {
      elements.forEach((element) => element.classList.add('is-revealed'));
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          // A block taller than the viewport can never reach 0.18, so it would
          // stay at opacity 0 forever. Reveal those on first contact instead.
          if (entry.intersectionRatio < 0.18 && entry.boundingClientRect.height <= innerHeight) {
            return;
          }
          entry.target.classList.add('is-revealed');
          this.observer?.unobserve(entry.target);
        }),
      { threshold: [0, 0.18], rootMargin: '0px 0px -8% 0px' }
    );

    // The 18% rule is for blocks scrolled into view, so their reveal plays where
    // it is seen. A block already on screen when the page opens reveals now,
    // however little of it shows: a masonry card peeking in below its neighbours
    // otherwise stays a blank band until the first scroll.
    elements.forEach((element) => {
      if (onScreen(element.getBoundingClientRect(), innerHeight)) {
        element.classList.add('is-revealed');
      } else {
        this.observer?.observe(element);
      }
    });
  }
}
