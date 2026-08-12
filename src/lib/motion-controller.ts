type PointerRect = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;
type PendingPointer = {
  target: HTMLElement;
  clientX: number;
  clientY: number;
};

export function pointerMotion(
  clientX: number,
  clientY: number,
  rect: PointerRect,
  translation: number
) {
  const nx = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width) * 2 - 1));
  const ny = Math.max(-1, Math.min(1, ((clientY - rect.top) / rect.height) * 2 - 1));

  return { x: nx * translation, y: ny * translation };
}

export class MotionController {
  private observer: IntersectionObserver | null = null;
  private frame = 0;
  private activeReactive: HTMLElement | null = null;
  private pendingPointer: PendingPointer | null = null;
  private started = false;

  start(): void {
    if (this.started) return this.initPage();

    this.started = true;
    document.addEventListener('astro:after-swap', () => this.initPage());
    document.addEventListener('pointermove', (event) => this.onPointerMove(event), {
      passive: true,
    });
    document.addEventListener('pointerleave', () => this.resetReactive());
    this.initPage();
  }

  initPage(): void {
    this.observer?.disconnect();
    this.resetReactive();

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

    // Nodes swapped in by ClientRouter come from an unstyled document, so the
    // browser starts a 1 -> 0 transition on insert and the reveal never plays.
    // Snap them to the hidden state with transitions off first.
    elements.forEach((element) => element.classList.add('is-motion-reset'));
    void document.body.offsetHeight;
    elements.forEach((element) => element.classList.remove('is-motion-reset'));

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

    elements.forEach((element) => this.observer?.observe(element));
  }

  private onPointerMove(event: PointerEvent): void {
    if (event.pointerType === 'touch' || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.resetReactive();
      return;
    }

    const target = (event.target as Element | null)?.closest<HTMLElement>('[data-reactive]');
    if (!target) {
      this.resetReactive();
      return;
    }

    if (this.activeReactive !== target) this.resetReactive();
    this.activeReactive = target;
    this.pendingPointer = {
      target,
      clientX: event.clientX,
      clientY: event.clientY,
    };

    if (this.frame) return;

    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      const pending = this.pendingPointer;
      this.pendingPointer = null;
      if (!pending || this.activeReactive !== pending.target) return;

      const rect = pending.target.getBoundingClientRect();
      // Read from the target, not the root, so [data-motion-limit] can quiet
      // a subtree the way it quiets reveals.
      const styles = getComputedStyle(pending.target);
      const translation =
        Number.parseFloat(styles.getPropertyValue('--motion-pointer-translation')) || 0;
      const values = pointerMotion(pending.clientX, pending.clientY, rect, translation);

      pending.target.style.setProperty('--motion-pointer-x', `${values.x}px`);
      pending.target.style.setProperty('--motion-pointer-y', `${values.y}px`);
    });
  }

  private resetReactive(): void {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.pendingPointer = null;
    for (const name of ['--motion-pointer-x', '--motion-pointer-y']) {
      this.activeReactive?.style.removeProperty(name);
    }
    this.activeReactive = null;
  }
}
