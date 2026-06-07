/**
 * ═══════════════════════════════════════════════════════════════
 *  APEX — GSAP Animation Setup
 *  src/lib/gsap.js
 *
 *  Import this file ONCE at the top of main.jsx (or App.jsx).
 *  Never register plugins more than once across the codebase.
 *  All components import gsap and useGSAP directly from their
 *  own imports — this file only handles registration.
 *
 *  Usage in components:
 *  import { useGSAP } from '@gsap/react'
 *  import gsap from 'gsap'
 *
 *  Aura UI v1.0
 * ═══════════════════════════════════════════════════════════════
 */

import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import ScrollTrigger from 'gsap/ScrollTrigger'
import TextPlugin from 'gsap/TextPlugin'

// Register all plugins once, globally.
// ScrollTrigger — scroll-based reveals (dashboard sections, book list)
// TextPlugin    — typing effect for exam day message, hero headings
gsap.registerPlugin(ScrollTrigger, TextPlugin, useGSAP)

// ── Default GSAP config ──
// Matches Apex's Apple-grade feel.
// Components can override per-animation but should respect these defaults.
gsap.defaults({
  ease:     'back.out(1.2)',  // elastic arrival — the Apex signature
  duration: 0.8,              // standard entrance duration
})

export { gsap, ScrollTrigger, TextPlugin, useGSAP }

/**
 * ═══════════════════════════════════════════════════════════════
 *  STANDARD COMPONENT PATTERN
 *  Copy this into any component that needs entrance animations.
 *
 *  Rules (do not deviate):
 *  1. Always use useGSAP — never useEffect for GSAP animations.
 *     useGSAP handles cleanup automatically on unmount.
 *  2. Always set immediateRender: false on fromTo animations
 *     that are scroll-triggered. Prevents flash of end state.
 *  3. Always set clearProps: 'all' if the element has hover
 *     states defined in CSS — prevents GSAP overriding them.
 *  4. Always use hardware-accelerated properties:
 *     x, y, scale, rotation, opacity — never left/top/width.
 *  5. Stagger values: 0.1s standard, 0.06s for dense lists.
 *  6. Ease: back.out(1.2) standard, back.out(1.4) for dramatic
 *     moments only (level-up, rank-up, exam day message).
 *  7. PDF reader is a zero-animation zone — no GSAP inside
 *     the reader component or its children.
 *
 * ─────────────────────────────────────────────────────────────
 *
 *  // At top of component file:
 *  import { useGSAP } from '@gsap/react'
 *  import { gsap, ScrollTrigger } from '@/lib/gsap'
 *
 *  // Standard scroll-triggered card entrance:
 *  const containerRef = useRef(null)
 *
 *  useGSAP(() => {
 *    gsap.fromTo(
 *      '.aura-card',
 *      {
 *        y:       20,
 *        opacity: 0,
 *      },
 *      {
 *        scrollTrigger: {
 *          trigger:       containerRef.current,
 *          start:         'top 85%',
 *          toggleActions: 'play none none reverse',
 *        },
 *        y:               0,
 *        opacity:         1,
 *        duration:        0.8,
 *        stagger:         0.1,
 *        ease:            'back.out(1.2)',
 *        immediateRender: false,
 *        clearProps:      'all',
 *      }
 *    )
 *  }, { scope: containerRef })
 *
 *  // Alternating side-entry (for lists — quests, books):
 *  useGSAP(() => {
 *    gsap.fromTo(
 *      '.list-item',
 *      {
 *        x:       (i) => (i % 2 === 0 ? -60 : 60),
 *        opacity: 0,
 *        y:       10,
 *      },
 *      {
 *        x:               0,
 *        y:               0,
 *        opacity:         1,
 *        duration:        0.8,
 *        stagger:         0.1,
 *        ease:            'back.out(1.2)',
 *        immediateRender: false,
 *        clearProps:      'all',
 *      }
 *    )
 *  }, { scope: containerRef })
 *
 *  // Dramatic moment (level-up, rank-up — use sparingly):
 *  useGSAP(() => {
 *    gsap.fromTo(
 *      '.rank-badge',
 *      { scale: 0.6, opacity: 0 },
 *      {
 *        scale:    1,
 *        opacity:  1,
 *        duration: 1.2,
 *        ease:     'back.out(1.4)',
 *      }
 *    )
 *  }, { scope: containerRef })
 *
 * ═══════════════════════════════════════════════════════════════
 */
