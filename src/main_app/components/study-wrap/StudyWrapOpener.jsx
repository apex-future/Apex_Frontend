import React from 'react';
import { motion } from 'framer-motion';
import DepthText from '../ui/DepthText';

const imageVariants = {
  hidden: {
    y: 30,
    opacity: 0,
    scale: 0.96
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 24,
      mass: 0.8,
      delay: 0.15
    }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.4,
      ease: "easeOut"
    }
  })
};

export default function StudyWrapOpener({ userName, examName, image }) {
  return (
    <div className="w-full min-h-full flex flex-col items-center justify-center px-4 py-4 study-wrap-card-enter relative z-10 select-none">
      {/* Ambient Glow */}
      <div className="study-wrap-glow-orb bg-indigo-500/40" />

      {/* Transparent Content Container */}
      <div className="relative z-10 w-full flex flex-col items-center text-center gap-2">
        {/* Large Hero Image (Fills 98% of container width) */}
        <div className="relative w-full flex items-center justify-center my-0.5">
          <motion.img
            key={image}
            src={image}
            alt="Study Wrap Opener"
            initial="hidden"
            animate="visible"
            variants={imageVariants}
            className="w-[98%] mx-auto max-h-[210px] md:max-h-[240px] object-cover rounded-[20px] drop-shadow-[0_16px_36px_rgba(0,0,0,0.45)] transition-transform duration-500 hover:scale-105"
            style={{
              willChange: "transform",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transformStyle: "preserve-3d"
            }}
          />
        </div>

        {/* Non-Image Content Wrapper */}
        <div className="w-full px-4 pb-1 md:px-5 flex flex-col items-center text-center gap-2">
          <motion.div
            custom={0.5}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="w-full"
          >
            <DepthText
              text={`You put in the work, ${userName}.`}
              layers={18}
              depth={2}
              faceColor="#FFFFFF"
              depthColor="#7C3AED"
              fontSize="clamp(1.5rem, 5.5vw, 2.25rem)"
              fontWeight={900}
              shadow
            />
          </motion.div>

          <motion.p
            custom={0.7}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-sm md:text-base text-purple-100/90 font-medium tracking-wide"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Here&apos;s a look back at your journey.
          </motion.p>

          {/* Exam Pill */}
          <motion.div
            custom={0.9}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="px-5 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-extrabold text-white uppercase tracking-widest shadow-xl"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {examName}
          </motion.div>
        </div>
      </div>

    </div>
  );
}





