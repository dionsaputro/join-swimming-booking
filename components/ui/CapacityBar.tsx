"use client";

import { motion } from "framer-motion";

interface CapacityBarProps {
  current: number;
  max: number;
  className?: string;
}

export default function CapacityBar({ current, max, className = "" }: CapacityBarProps) {
  const percentage = (current / max) * 100;

  let barColor = "bg-primary"; // kosong–setengah
  if (percentage >= 85) {
    barColor = "bg-danger"; // penuh
  } else if (percentage >= 60) {
    barColor = "bg-warning"; // hampir penuh
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between text-xs text-text-muted">
        <span>{current}/{max}</span>
        {percentage >= 100 && (
          <span className="text-danger font-medium">Penuh</span>
        )}
      </div>
      <div className="h-2 bg-primary-light rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
    </div>
  );
}
