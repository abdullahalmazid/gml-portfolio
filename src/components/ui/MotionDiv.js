'use client';
import { motion } from 'framer-motion';
export default function MotionDiv({ children, delay = 0, className = '' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.6, delay }} className={className}>
      {children}
    </motion.div>
  );
}
