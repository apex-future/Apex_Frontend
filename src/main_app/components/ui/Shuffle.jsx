import React, { useRef, useEffect, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import './Shuffle.css';

const Shuffle = ({
  text = '',
  className = '',
  style = {},
  shuffleDirection = 'right',
  duration = 0.8,
  delay = 0,
  maxDelay = 0,
  ease = 'power3.out',
  tag = 'p',
  textAlign = 'center',
  onShuffleComplete,
  shuffleTimes = 2,
  animationMode = 'evenodd',
  loop = false,
  loopDelay = 0,
  stagger = 0.04,
  scrambleCharset = '',
  colorFrom,
  colorTo,
  respectReducedMotion = true,
}) => {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const tlRef = useRef(null);

  const delaySec = delay > 10 ? delay / 1000 : (delay || 0);
  const durationSec = duration > 10 ? duration / 1000 : (duration || 0.8);

  useEffect(() => {
    if (!containerRef.current || !text) return;

    if (respectReducedMotion && typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setReady(true);
      if (containerRef.current) containerRef.current.textContent = text;
      onShuffleComplete?.();
      return;
    }

    const container = containerRef.current;
    const rolls = Math.max(1, Math.floor(shuffleTimes));
    const isVertical = shuffleDirection === 'up' || shuffleDirection === 'down';
    const rand = (set) => set.charAt(Math.floor(Math.random() * set.length)) || '';

    // Initially show text so it is never blank or scrambled prematurely
    container.textContent = text;

    let timer = null;

    timer = setTimeout(() => {
      if (!container) return;

      // Build character wrappers
      container.innerHTML = '';
      const words = String(text).split(' ');
      const strips = [];

      words.forEach((word, wIdx) => {
        const wordSpan = document.createElement('span');
        wordSpan.style.display = 'inline-block';
        wordSpan.style.whiteSpace = 'nowrap';

        const chars = Array.from(word);
        chars.forEach((char) => {
          const charWrap = document.createElement('span');
          charWrap.className = 'shuffle-char-wrapper';
          Object.assign(charWrap.style, {
            display: 'inline-block',
            overflow: 'hidden',
            verticalAlign: 'bottom',
            position: 'relative'
          });

          const strip = document.createElement('span');
          Object.assign(strip.style, {
            display: 'inline-flex',
            flexDirection: isVertical ? 'column' : 'row',
            willChange: 'transform'
          });

          // Items array: real character cloned `rolls` times (or scrambled if charset provided)
          const items = [];
          for (let k = 0; k < rolls; k++) {
            items.push(scrambleCharset ? rand(scrambleCharset) : char);
          }
          items.push(char);

          if (shuffleDirection === 'right' || shuffleDirection === 'down') {
            items.reverse();
          }

          items.forEach((c) => {
            const itemSpan = document.createElement('span');
            itemSpan.className = 'shuffle-char';
            itemSpan.textContent = c;
            itemSpan.style.display = 'inline-block';
            strip.appendChild(itemSpan);
          });

          charWrap.appendChild(strip);
          wordSpan.appendChild(charWrap);
          strips.push({ strip, charWrap, char });
        });

        container.appendChild(wordSpan);
        if (wIdx < words.length - 1) {
          container.appendChild(document.createTextNode(' '));
        }
      });

      // Calculate translation distances based on natural character width
      const stripElements = [];
      strips.forEach(({ strip, charWrap }) => {
        const firstChild = strip.firstElementChild;
        const charW = firstChild ? firstChild.getBoundingClientRect().width : 12;
        const charH = firstChild ? firstChild.getBoundingClientRect().height : 20;

        charWrap.style.width = `${charW}px`;
        if (isVertical) charWrap.style.height = `${charH}px`;

        const steps = rolls;
        let startX = 0;
        let finalX = 0;
        let startY = 0;
        let finalY = 0;

        if (shuffleDirection === 'right') {
          startX = -steps * charW;
          finalX = 0;
        } else if (shuffleDirection === 'left') {
          startX = 0;
          finalX = -steps * charW;
        } else if (shuffleDirection === 'down') {
          startY = -steps * charH;
          finalY = 0;
        } else if (shuffleDirection === 'up') {
          startY = 0;
          finalY = -steps * charH;
        }

        if (isVertical) {
          gsap.set(strip, { y: startY, x: 0, force3D: true });
          strip.setAttribute('data-target-y', String(finalY));
        } else {
          gsap.set(strip, { x: startX, y: 0, force3D: true });
          strip.setAttribute('data-target-x', String(finalX));
        }

        if (colorFrom) strip.style.color = colorFrom;
        stripElements.push(strip);
      });

      setReady(true);

      const tl = gsap.timeline({
        smoothChildTiming: true,
        repeat: loop ? -1 : 0,
        repeatDelay: loop ? loopDelay : 0,
        onComplete: () => {
          if (!loop) {
            // Restore clean static text so characters are NEVER scrambled or cut off
            if (container) {
              container.textContent = text;
            }
            if (colorTo && container) container.style.color = colorTo;
            onShuffleComplete?.();
          }
        }
      });

      const addTween = (targets, at) => {
        const vars = {
          duration: durationSec,
          ease,
          force3D: true,
          stagger: animationMode === 'evenodd' ? stagger : 0
        };
        if (isVertical) {
          vars.y = (i, t) => parseFloat(t.getAttribute('data-target-y') || '0');
        } else {
          vars.x = (i, t) => parseFloat(t.getAttribute('data-target-x') || '0');
        }
        tl.to(targets, vars, at);
      };

      if (animationMode === 'evenodd') {
        const odd = stripElements.filter((_, i) => i % 2 === 1);
        const even = stripElements.filter((_, i) => i % 2 === 0);
        const oddTotal = durationSec + Math.max(0, odd.length - 1) * stagger;
        const evenStart = odd.length ? oddTotal * 0.35 : 0;
        if (odd.length) addTween(odd, 0);
        if (even.length) addTween(even, evenStart);
      } else {
        stripElements.forEach((strip) => {
          const d = Math.random() * maxDelay;
          const vars = {
            duration: durationSec,
            ease,
            force3D: true
          };
          if (isVertical) {
            vars.y = parseFloat(strip.getAttribute('data-target-y') || '0');
          } else {
            vars.x = parseFloat(strip.getAttribute('data-target-x') || '0');
          }
          tl.to(strip, vars, d);
        });
      }

      tlRef.current = tl;
    }, delaySec * 1000);

    return () => {
      if (timer) clearTimeout(timer);
      if (tlRef.current) tlRef.current.kill();
    };
  }, [
    text,
    durationSec,
    delaySec,
    shuffleDirection,
    shuffleTimes,
    animationMode,
    ease,
    stagger,
    scrambleCharset,
    loop,
    loopDelay,
    respectReducedMotion
  ]);

  const Tag = tag || 'p';
  const commonStyle = useMemo(() => ({ textAlign, ...style }), [textAlign, style]);
  const classes = `shuffle-parent ${ready ? 'is-ready' : ''} ${className}`.trim();

  return <Tag ref={containerRef} className={classes} style={commonStyle}>{text}</Tag>;
};

export default Shuffle;
