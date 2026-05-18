import React, { useState, useEffect } from 'react';

/**
 * Typewriter component - animates text character by character
 * @param {string} text - The text to animate
 * @param {number} speed - Milliseconds per character (default: 30)
 * @param {number} delay - Initial delay before starting (default: 0)
 * @param {boolean} showCursor - Whether to show the blinking cursor
 * @param {boolean} skipAnimation - If true, displays full text immediately without animation
 */
const Typewriter = ({ text = '', speed = 30, delay = 0, showCursor = false, skipAnimation = false }) => {
    const [displayedText, setDisplayedText] = useState(skipAnimation ? text : '');
    const [isComplete, setIsComplete] = useState(skipAnimation);

    useEffect(() => {
        if (skipAnimation) {
            setDisplayedText(text);
            setIsComplete(true);
            return;
        }

        // Reset if text changes
        setDisplayedText('');
        setIsComplete(false);

        const startTimeout = setTimeout(() => {
            let currentIndex = 0;
            const interval = setInterval(() => {
                if (currentIndex < text.length) {
                    setDisplayedText(text.substring(0, currentIndex + 1));
                    currentIndex++;
                } else {
                    clearInterval(interval);
                    setIsComplete(true);
                }
            }, speed);

            return () => clearInterval(interval);
        }, delay);

        return () => clearTimeout(startTimeout);
    }, [text, speed, delay, skipAnimation]);

    return (
        <span>
            {displayedText}
            {showCursor && !isComplete && <span className="typewriter-cursor" />}
            {/* If the user wants the cursor to keep blinking after completion, we can remove !isComplete */}
            {showCursor && isComplete && <span className="typewriter-cursor" />}
        </span>
    );
};

export default Typewriter;
