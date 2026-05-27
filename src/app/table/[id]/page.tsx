"use client";

import { useEffect, useState } from "react";
import { createBrowserClient, Database } from "@/lib/supabase";
import { Coffee, Search, Clock, CheckCircle2, Edit2, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MenuItemCard } from "@/components/ui/MenuItemCard";
import { CustomerCart } from "@/components/ui/CustomerCart";
import { useCartStore } from "@/lib/store";
import toast from "react-hot-toast";

type MenuItem = Database['public']['Tables']['menu_items']['Row'] & {
  categories: { name: string } | null;
};
type Order = Database['public']['Tables']['orders']['Row'];

export default function TablePage({ params }: { params: { id: string } }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [connected, setConnected] = useState(false);
  
  // Active user session/order tracking
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [lastNotificationStatus, setLastNotificationStatus] = useState<string | null>(null);
  
  const supabase = createBrowserClient();
  const tableId = parseInt(params.id);

  const { setItems, setEditingOrderId } = useCartStore();

  useEffect(() => {
    // Premium loading simulation + data fetch
    const init = async () => {
      await fetchMenu();
      checkActiveSession();
      setTimeout(() => setConnected(true), 1500);
    };
    init();

    const channel = supabase
      .channel(`table-${tableId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `table_id=eq.${tableId}` }, (payload) => {
        if (payload.new.status === 'completed') {
          setActiveOrder(null);
          localStorage.removeItem(`active_order_${tableId}`);
        } else {
          setActiveOrder(payload.new as Order);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tableId]);

  // Handle active realtime staff acceptance notifications
  useEffect(() => {
    if (!activeOrder) return;
    
    if (lastNotificationStatus !== null && activeOrder.status !== lastNotificationStatus) {
      if (activeOrder.status === 'preparing') {
        toast.success("✨ Great news! Your order has been ACCEPTED by staff and is now preparing in the kitchen!", { duration: 6000 });
      } else if (activeOrder.status === 'cancelled') {
        toast.error("⚠️ Your order has been DECLINED by our staff. Please verify or contact support.", { duration: 8000 });
        setActiveOrder(null);
        localStorage.removeItem(`customer_session_t${tableId}`);
      } else if (activeOrder.status === 'ready') {
        toast.success("🚀 Your order is READY! The waiter is serving it shortly.", { duration: 6000 });
      } else if (activeOrder.status === 'served') {
        toast.success("🍽️ Your order has been SERVED! Enjoy your meal!", { duration: 6000 });
      }
    }
    setLastNotificationStatus(activeOrder.status);
  }, [activeOrder?.status]);

  const fetchMenu = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*, categories(name)')
      .eq('is_available', true);
    
    if (data) {
      setMenuItems(data as MenuItem[]);
      const cats = Array.from(new Set(data.map(item => item.categories?.name).filter(Boolean))) as string[];
      setCategories(['All', ...cats]);
    }
  };

  const checkActiveSession = async () => {
    const sessionId = localStorage.getItem(`customer_session_t${tableId}`);
    if (sessionId) {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_session', sessionId)
        .in('status', ['received', 'preparing', 'ready', 'served'])
        .single();
      if (data) {
        setActiveOrder(data);
        setLastNotificationStatus(data.status);
      }
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const catMatch = activeCategory === "All" || item.categories?.name === activeCategory;
    const searchMatch = item.name.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  const cancelOrder = async () => {
    if (!activeOrder || activeOrder.status !== 'received') return;
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', activeOrder.id);
    if (!error) {
      setActiveOrder(null);
      localStorage.removeItem(`customer_session_t${tableId}`);
      toast.success("Order cancelled successfully");
    }
  };

  const handleEditOrder = async () => {
    if (!activeOrder) return;
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*, menu_items(image_url)')
        .eq('order_id', activeOrder.id);
      
      if (error) throw error;
      if (data) {
        const cartItems = data.map(item => ({
          id: item.menu_item_id,
          name: item.name,
          price: Number(item.price),
          quantity: item.quantity,
          image_url: item.menu_items?.image_url
        }));
        setItems(cartItems);
        setEditingOrderId(activeOrder.id);
        toast.success("🛒 Order items loaded! Open your cart on the bottom right to make changes.", { duration: 5000 });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load order for editing");
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-3xl glass-md flex items-center justify-center relative">
            <div className="absolute inset-0 border-2 border-white/20 rounded-3xl animate-ping opacity-20" />
            <Coffee className="w-10 h-10 text-white animate-pulse" />
          </div>
          <div className="flex flex-col items-center">
            <p className="text-white/50 text-sm tracking-widest uppercase mb-2">Syncing with</p>
            <h1 className="text-2xl font-light tracking-wider">Table {tableId}</h1>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 animate-fade-in">
      <header className="sticky top-0 z-30 glass-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center">
            <Coffee size={20} />
          </div>
          <div>
            <h1 className="font-semibold tracking-widest text-sm text-white">AURA CAFE</h1>
            <p className="text-[10px] text-emerald-400 uppercase tracking-widest">Table {tableId} Connected</p>
          </div>
        </div>
      </header>

      {/* Active Order Banner with Acceptance State */}
      <AnimatePresence>
        {activeOrder && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pt-6 overflow-hidden"
          >
            <div className={`glass-md p-5 rounded-2xl border-l-2 ${
              activeOrder.status === 'received' ? 'border-blue-500' :
              activeOrder.status === 'preparing' ? 'border-amber-500' : 'border-emerald-500'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-widest mb-1 flex items-center gap-2">
                    Order Status: <span className="text-gradient">
                      {activeOrder.status === 'received' ? 'Pending Acceptance' : activeOrder.status}
                    </span>
                  </h3>
                  <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">ID: {activeOrder.id.split('-')[0].toUpperCase()}</p>
                </div>
                
                {activeOrder.status === 'received' ? (
                  <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20">
                    <Clock size={12} className="animate-spin" />
                    <span>Awaiting Staff</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 size={12} />
                    <span>Accepted & Locked</span>
                  </div>
                )}
              </div>

              {activeOrder.status === 'received' ? (
                <div className="space-y-3">
                  <p className="text-[10.5px] text-white/50 leading-relaxed uppercase tracking-wider">You can modify items or cancel this order until the kitchen accepts it.</p>
                  <div className="flex gap-2">
                    <button className="flex-1 btn-glass text-xs py-2.5 flex items-center justify-center gap-1.5 font-bold tracking-wider" onClick={handleEditOrder}>
                      <Edit2 size={12} /> EDIT ITEMS
                    </button>
                    <button onClick={cancelOrder} className="btn-glass border-red-500/30 hover:bg-red-500/10 text-red-400 flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5 font-bold tracking-wider">
                      <X size={12} /> CANCEL ORDER
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs bg-white/5 p-3 rounded-xl border border-white/5 text-white/60">
                  <AlertCircle size={14} className="text-emerald-400 shrink-0" />
                  <span>The chef has accepted your order and is preparing it. It can no longer be edited.</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-6 pt-8 pb-4 space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
          <input
            type="text"
            placeholder="Search our luxury menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-glass !pl-12"
          />
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeCategory === cat ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "glass hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {filteredItems.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>

      <CustomerCart tableId={tableId} setActiveOrder={setActiveOrder} />
    </div>
  );
}
