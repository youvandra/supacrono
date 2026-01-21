"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export type ToastType = "success" | "error" | "info"

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = "info", duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type, duration }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.9 }}
              layout
              className={`pointer-events-auto flex min-w-[300px] max-w-sm items-center gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm ${
                t.type === "success"
                  ? "border-emerald-200 bg-emerald-50/90 text-emerald-900"
                  : t.type === "error"
                  ? "border-rose-200 bg-rose-50/90 text-rose-900"
                  : "border-slate-200 bg-white/90 text-slate-900"
              }`}
            >
              {t.type === "success" && <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />}
              {t.type === "error" && <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />}
              {t.type === "info" && <Info className="h-5 w-5 text-slate-600 shrink-0" />}
              
              <p className="flex-1 text-sm font-medium">{t.message}</p>
              
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    console.warn("useToast was called outside of ToastProvider. Returning dummy toast.")
    return { 
      toast: (message: string, type?: ToastType, duration?: number) => {
        console.log(`[Toast Fallback] ${type}: ${message}`)
      }
    }
  }
  return context
}
