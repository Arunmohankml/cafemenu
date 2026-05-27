"use client";

import { useCartStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, Minus, Plus, CreditCard } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CartDrawer({ tableId }: { tableId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const router = useRouter();
  
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    getTotal, 
    tipPercentage, 
    setTipPercentage,
    getTipAmount,
    clearCart
  } = useCartStore();

  const total = getTotal();
  const tipAmount = getTipAmount();
  const finalTotal = total + tipAmount;

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId,
          items,
          total: finalTotal,
          tip: tipAmount,
        }),
      });
      if (res.ok) {
        clearCart();
        setIsOpen(false);
        router.refresh(); // Or handle tracking state
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      {/* Floating Cart Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 glass-button rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] z-40 group"
      >
        <ShoppingBag className="w-6 h-6 text-white/80 group-hover:text-white transition-colors" />
        {items.length > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-white text-black text-xs font-bold rounded-full flex items-center justify-center">
            {items.reduce((acc, item) => acc + item.quantity, 0)}
          </span>
        )}
      </motion.button>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md glass-panel z-50 flex flex-col border-l border-white/10"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-light tracking-widest text-gradient">YOUR ORDER</h2>
                <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {items.length === 0 ? (
                  <div className="text-center text-white/40 mt-20 font-light">
                    Your cart is empty.
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden glass-panel shrink-0 border-white/5">
                        <img src={item.image_url || ''} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-medium text-white/90">{item.name}</h4>
                            <span className="text-sm font-mono text-white/70">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                          <p className="text-xs text-white/40 font-mono mt-1">₹{item.price.toFixed(2)} each</p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3 bg-white/5 rounded-lg px-2 py-1 border border-white/10">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-white/50 hover:text-white">
                              <Minus size={14} />
                            </button>
                            <span className="text-sm font-mono w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-white/50 hover:text-white">
                              <Plus size={14} />
                            </button>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="text-xs text-white/30 hover:text-white uppercase tracking-wider">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {items.length > 0 && (
                <div className="p-6 border-t border-white/10 bg-black/40 space-y-6">
                  <div>
                    <p className="text-xs text-white/50 mb-3 uppercase tracking-wider">Add a Tip</p>
                    <div className="flex gap-2">
                      {[0, 10, 15, 20].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => setTipPercentage(pct)}
                          className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                            tipPercentage === pct 
                              ? 'bg-white text-black border-white' 
                              : 'glass-button text-white/60 border-white/10 hover:text-white'
                          }`}
                        >
                          {pct === 0 ? 'None' : `${pct}%`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-white/60">
                      <span>Subtotal</span>
                      <span className="font-mono">₹{total.toFixed(2)}</span>
                    </div>
                    {tipAmount > 0 && (
                      <div className="flex justify-between text-white/60">
                        <span>Tip</span>
                        <span className="font-mono">₹{tipAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-medium text-white pt-2 border-t border-white/10 mt-2">
                      <span>Total</span>
                      <span className="font-mono">₹{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full glass-button bg-white text-black py-4 rounded-xl font-medium tracking-widest flex items-center justify-center gap-2 hover:bg-white/90 disabled:opacity-50"
                  >
                    {isCheckingOut ? (
                      <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        <CreditCard size={18} />
                        CHECKOUT
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
