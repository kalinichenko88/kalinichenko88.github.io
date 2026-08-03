import { MOTION_CHANGED_EVENT } from '../config/motion.ts';

type PointerRect = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;
type PointerCaps = { translation: number; rotation: number };

export function pointerMotion(
  clientX: number,
  clientY: number,
  rect: PointerRect,
  caps: PointerCaps
) {
  const nx = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width) * 2 - 1));
  const ny = Math.max(-1, Math.min(1, ((clientY - rect.top) / rect.height) * 2 - 1));

  return {
    x: nx * caps.translation,
    y: ny * caps.translation,
    rx: ny === 0 ? 0 : ny * -caps.rotation,
    ry: nx * caps.rotation,
  };
}

export class MotionController {
  private observer: IntersectionObserver | null = null;
  private frame = 0;
  private activeReactive: HTMLElement | null = null;
  private started = false;

  start(): void {
    if (this.started) return this.initPage();

    this.started = true;
    document.addEventListener('astro:after-swap', () => this.initPage());
    document.addEventListener('pointermove', (event) => this.onPointerMove(event), {
      passive: true,
    });
    document.addEventListener('pointerleave', () => this.resetReactive());
    window.addEventListener(MOTION_CHANGED_EVENT, () => this.replayVisible());
    this.initPage();
  }

  initPage(): void {
    this.observer?.disconnect();
    this.resetReactive();

    const elements = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
    document.documentElement.dataset.motionReady = '';

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
          entry.target.classList.add('is-revealed');
          this.observer?.unobserve(entry.target);
        }),
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
    );

    elements.forEach((element) => this.observer?.observe(element));
  }

  private onPointerMove(event: PointerEvent): void {
    if (
      event.pointerType === 'touch' ||
      matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset.motion === 'calm'
    ) {
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

    const rect = target.getBoundingClientRect();
    const styles = getComputedStyle(document.documentElement);
    const caps = {
      translation: Number.parseFloat(styles.getPropertyValue('--motion-pointer-translation')) || 0,
      rotation: Number.parseFloat(styles.getPropertyValue('--motion-pointer-rotation')) || 0,
    };
    const values = pointerMotion(event.clientX, event.clientY, rect, caps);

    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      target.style.setProperty('--motion-pointer-x', `${values.x}px`);
      target.style.setProperty('--motion-pointer-y', `${values.y}px`);
      target.style.setProperty('--motion-pointer-rx', `${values.rx}deg`);
      target.style.setProperty('--motion-pointer-ry', `${values.ry}deg`);
    });
  }

  private resetReactive(): void {
    cancelAnimationFrame(this.frame);
    for (const name of [
      '--motion-pointer-x',
      '--motion-pointer-y',
      '--motion-pointer-rx',
      '--motion-pointer-ry',
    ]) {
      this.activeReactive?.style.removeProperty(name);
    }
    this.activeReactive = null;
  }

  private replayVisible(): void {
    this.resetReactive();
    const visible = [...document.querySelectorAll<HTMLElement>('[data-reveal].is-revealed')].filter(
      (element) => {
        const rect = element.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < innerHeight;
      }
    );

    visible.forEach((element) => element.classList.remove('is-revealed'));
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        visible.forEach((element) => element.classList.add('is-revealed'));
      })
    );
  }
}
