"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store";
import { createBrowserClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, Minus, Plus, CreditCard, Receipt, Edit2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export function CustomerCart({ tableId, setActiveOrder }: { tableId: number, setActiveOrder: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  const { 
    items, updateQuantity, removeItem, clearCart,
    getSubtotal, getTaxAmount, getTipAmount, getTotal,
    tipPercentage, setTipPercentage, editingOrderId, setEditingOrderId
  } = useCartStore();

  const supabase = createBrowserClient();

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setIsCheckingOut(true);

    try {
      if (editingOrderId) {
        // Updating existing active order!
        // 1. Update the order row totals
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            subtotal: getSubtotal(),
            tax_amount: getTaxAmount(),
            tip_amount: getTipAmount(),
            total: getTotal(),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingOrderId);

        if (orderError) throw orderError;

        // 2. Delete old order items
        const { error: deleteError } = await supabase
          .from('order_items')
          .delete()
          .eq('order_id', editingOrderId);

        if (deleteError) throw deleteError;

        // 3. Insert new order items
        const orderItems = items.map(item => ({
          order_id: editingOrderId,
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw itemsError;

        toast.success("Order updated successfully!");
        
        // Fetch fresh order details from database to update customer layout
        const { data: updatedOrder } = await supabase
          .from('orders')
          .select('*')
          .eq('id', editingOrderId)
          .single();

        if (updatedOrder) setActiveOrder(updatedOrder);
        
        clearCart();
        setIsOpen(false);
      } else {
        // Placing a new order!
        // 1. Generate session ID and edit deadline
        const sessionId = crypto.randomUUID();
        localStorage.setItem(`customer_session_t${tableId}`, sessionId);
        
        const editDeadline = new Date();
        editDeadline.setSeconds(editDeadline.getSeconds() + 60);

        // 2. Insert Order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            table_id: tableId,
            customer_session: sessionId,
            subtotal: getSubtotal(),
            tax_amount: getTaxAmount(),
            tip_amount: getTipAmount(),
            total: getTotal(),
            payment_method: 'pay_at_reception',
            is_editable: true,
            edit_deadline: editDeadline.toISOString()
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // 3. Insert Order Items
        const orderItems = items.map(item => ({
          order_id: orderData.id,
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw itemsError;

        toast.success("Order placed successfully!");
        setActiveOrder(orderData);
        clearCart();
        setIsOpen(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit order");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] z-40 group customer-cart-btn"
      >
        <ShoppingBag className="w-6 h-6 text-black" />
        {items.length > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-black animate-pulse">
            {items.reduce((acc, item) => acc + item.quantity, 0)}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md glass-dark z-50 flex flex-col border-l border-white/10"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-light tracking-widest text-gradient">
                  {editingOrderId ? "EDITING ORDER" : "YOUR ORDER"}
                </h2>
                <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Editing warning banner */}
              {editingOrderId && items.length > 0 && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center gap-2.5 text-xs text-amber-300 font-medium">
                  <AlertCircle size={14} className="shrink-0 animate-pulse" />
                  <span>You are editing an active order. Saving will update your current kitchen ticket.</span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {items.length === 0 ? (
                  <div className="text-center text-white/30 mt-20 font-light flex flex-col items-center gap-4">
                    <Receipt size={48} className="opacity-50" />
                    <p className="tracking-widest uppercase text-sm">Cart is empty</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      {item.image_url ? (
                        <div className="w-20 h-20 rounded-xl overflow-hidden glass-md shrink-0">
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-xl glass-md shrink-0 flex items-center justify-center text-white/20 text-xs">No Img</div>
                      )}
                      
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-medium text-white/90 leading-tight pr-2">{item.name}</h4>
                            <span className="text-sm font-mono text-white/70">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3 bg-white/5 rounded-lg px-2 py-1 border border-white/10">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-white/50 hover:text-white"><Minus size={14} /></button>
                            <span className="text-sm font-mono w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-white/50 hover:text-white"><Plus size={14} /></button>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="text-xs text-red-400 hover:text-red-300 uppercase tracking-wider">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {items.length > 0 && (
                <div className="p-6 border-t border-white/10 bg-black/60 space-y-6">
                  <div>
                    <p className="text-xs text-white/50 mb-3 uppercase tracking-widest">Add Tip (Support Staff)</p>
                    <div className="flex gap-2">
                      {[0, 50, 100, 150].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setTipPercentage(amt === 0 ? 0 : (amt / getSubtotal()) * 100)}
                          className={`flex-1 py-2 rounded-lg text-xs font-mono border transition-colors ${
                            (amt === 0 && tipPercentage === 0) || (amt > 0 && Math.round((getSubtotal() * tipPercentage) / 100) === amt)
                              ? 'bg-white text-black border-white' 
                              : 'glass-md text-white/60 hover:text-white'
                          }`}
                        >
                          {amt === 0 ? 'None' : `₹${amt}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-white/60">
                      <span>Subtotal</span>
                      <span className="font-mono">₹{getSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>Tax (5%)</span>
                      <span className="font-mono">₹{getTaxAmount().toFixed(2)}</span>
                    </div>
                    {getTipAmount() > 0 && (
                      <div className="flex justify-between text-emerald-400/80">
                        <span>Tip</span>
                        <span className="font-mono">₹{getTipAmount().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-medium text-white pt-3 border-t border-white/10 mt-3">
                      <span>Total</span>
                      <span className="font-mono">₹{getTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full btn-primary py-4 text-sm tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isCheckingOut ? (
                      <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        <CreditCard size={18} />
                        {editingOrderId ? "SAVE CHANGES & UPDATE" : "PLACE ORDER"}
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
