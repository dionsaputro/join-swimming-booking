"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

type ToastType = "success" | "error" | "warning";

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} className="text-success" />,
  error: <XCircle size={18} className="text-danger" />,
  warning: <AlertCircle size={18} className="text-warning" />,
};

export default function Toast({ message, type = "success", isVisible }: ToastProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 left-4 right-4 z-50 flex justify-center"
        >
          <div className="bg-white rounded-xl shadow-lg border border-border px-4 py-3 flex items-center gap-3">
            {icons[type]}
            <span className="text-sm text-text-primary">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
