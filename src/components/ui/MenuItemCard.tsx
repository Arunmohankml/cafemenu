"use client";

import { useCartStore } from "@/lib/store";
import { Plus, Minus } from "lucide-react";
import { motion } from "framer-motion";

export function MenuItemCard({ item }: { item: any }) {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const addItem = useCartStore((state) => state.addItem);

  const cartItem = items.find((i) => i.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const triggerFlyAnimation = (e: React.MouseEvent) => {
    // 1. Starting coordinates (top of button)
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top;

    // 2. Create a rising elegant "+1" floating text indicator
    const floatingText = document.createElement('div');
    floatingText.style.position = 'fixed';
    floatingText.style.zIndex = '99999';
    floatingText.style.left = `${startX}px`;
    floatingText.style.top = `${startY}px`;
    floatingText.style.transform = 'translate(-50%, -50%)';
    floatingText.style.color = '#ffffff';
    floatingText.style.fontSize = '12px';
    floatingText.style.fontWeight = '700';
    floatingText.style.fontFamily = 'var(--font-mono)';
    floatingText.style.pointerEvents = 'none';
    floatingText.style.opacity = '1';
    floatingText.style.transition = 'all 0.65s cubic-bezier(0.16, 1, 0.3, 1)';
    floatingText.innerText = '+1';
    floatingText.style.textShadow = '0 0 8px rgba(255,255,255,0.8)';
    
    document.body.appendChild(floatingText);

    // Force a reflow and start the transition (drifts up and fades out)
    requestAnimationFrame(() => {
      floatingText.style.top = `${startY - 40}px`;
      floatingText.style.opacity = '0';
    });

    // 3. Trigger a sleek ripple glow effect on the card itself
    const cardEl = e.currentTarget.closest('.menu-item-card') as HTMLElement;
    if (cardEl) {
      cardEl.classList.remove('animate-card-glow');
      void cardEl.offsetWidth; // Force reflow
      cardEl.classList.add('animate-card-glow');
      setTimeout(() => {
        cardEl.classList.remove('animate-card-glow');
      }, 550);
    }

    // 4. Trigger a sleek magnetic pulse & expanding ring on the bottom-right cart icon
    const cartBtn = document.querySelector('.customer-cart-btn');
    if (cartBtn) {
      cartBtn.classList.remove('animate-cart-pulse');
      void (cartBtn as HTMLElement).offsetWidth; // Force reflow
      cartBtn.classList.add('animate-cart-pulse');
      setTimeout(() => {
        cartBtn.classList.remove('animate-cart-pulse');
      }, 450);
    }

    // Cleanup floating text
    setTimeout(() => {
      floatingText.remove();
    }, 650);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
     className={`menu-item-card h-[205px] md:h-[240px] relative rounded-[22px] overflow-hidden group cursor-pointer border border-white/10 bg-black/60 backdrop-blur-md hover:border-white/15 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex flex-col p-2.5 ${
        item.is_veg 
          ? 'hover:shadow-[0_8px_30px_rgba(16,185,129,0.06)]' 
          : 'hover:shadow-[0_8px_30px_rgba(239,68,68,0.06)]'
      }`}
    >
      {/* Framed Image Container (Decreased Size!) */}
      <div className="w-full h-[120px] md:h-[135px] rounded-[14px] overflow-hidden bg-white/5 relative shrink-0 border border-white/10">
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.name} 
            className="w-full h-full object-contain p-1.5 transition-transform duration-700 group-hover:scale-105" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/5 uppercase tracking-widest text-[9px]">☕</div>
        )}
        
        {/* Authentic Restaurant Food Dot Indicator inside the image frame */}
        <div className="absolute top-2 left-2 z-20 backdrop-blur-md bg-black/60 rounded-md p-1 border border-white/10">
          {item.is_veg ? (
            <div className="w-3.5 h-3.5 border-2 border-emerald-500 flex items-center justify-center rounded-[3px] bg-emerald-500/10">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            </div>
          ) : (
            <div className="w-3.5 h-3.5 border-2 border-red-500 flex items-center justify-center rounded-[3px] bg-red-500/10">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Details & Info Section (Sits cleanly below the image) */}
      <div className="flex-1 flex flex-col justify-between pt-2 select-none">
        <div>
          <h3 className="text-[12px] font-bold text-white tracking-wide truncate group-hover:text-amber-200 transition-colors">{item.name}</h3>
          <p className="hidden sm:block text-[9px] text-white/40 font-light leading-relaxed line-clamp-1 mt-0.5">
            {item.description}
          </p>
        </div>

        <div className="flex justify-between items-center pt-1.5 border-t border-white/5 mt-1">
          <span className="text-[11px] font-mono font-bold text-white/90">₹{item.price.toFixed(2)}</span>
          
          {quantity > 0 ? (
            <div className="flex items-center gap-1 bg-white/5 rounded-md px-1 py-0.5 border border-white/10 backdrop-blur-md transition-all duration-300">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  updateQuantity(item.id, quantity - 1);
                }}
                className="w-4 h-4 rounded-md hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <Minus size={8} />
              </button>
              
              <span className="text-[9px] font-mono font-bold w-3 text-center text-white">{quantity}</span>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFlyAnimation(e);
                  updateQuantity(item.id, quantity + 1);
                }}
                className="w-4 h-4 rounded-md hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <Plus size={8} />
              </button>
            </div>
          ) : (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                triggerFlyAnimation(e);
                addItem(item);
              }}
              className="w-6 h-6 rounded-md glass-md hover:bg-white hover:text-black flex items-center justify-center transition-all duration-300 shrink-0 text-white animate-fade-in"
            >
              <Plus size={12} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
