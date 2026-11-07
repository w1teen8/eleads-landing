// 14 Фінальний CTA: мягкий параллакс фото и свечения (только мышь).
import { $ } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { parallax } from '../core/motion.js';

export function init(root) {
  accentTitles(root);
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const photo = $('[data-cta-photo]', root);
  const glow = $('[data-cta-glow]', root);
  if (photo) parallax(photo, 0.05);
  if (glow) parallax(glow, 0.1);
}
