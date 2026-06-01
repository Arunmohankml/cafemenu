"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // Bypass login and go straight to admin panel
    router.push("/admin");
  }, [router, mounted]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-black">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 text-center"
      >
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/40 tracking-[0.2em] text-xs uppercase">Entering Admin Panel...</p>
      </motion.div>
    </div>
  );
}
