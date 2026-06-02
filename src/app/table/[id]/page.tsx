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
  
  // Active user session/order tracking - supports up to 2 orders per table
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [lastNotificationStatus, setLastNotificationStatus] = useState<Map<string, string>>(new Map());
  
  const supabase = createBrowserClient();
  const tableId = parseInt(params.id);

  const { setItems, setEditingOrderId } = useCartStore();

  const addOrUpdateOrder = (order: Order) => {
    setActiveOrders(prev => {
      const exists = prev.find(o => o.id === order.id);
      if (exists) {
        return prev.map(o => o.id === order.id ? order : o);
      }
      return [...prev, order];
    });
  };

  const removeOrder = (orderId: string) => {
    setActiveOrders(prev => prev.filter(o => o.id !== orderId));
  };

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
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `table_id=eq.${tableId}` }, (payload: any) => {
        if (payload.new.status === 'completed' || payload.new.status === 'cancelled') {
          removeOrder(payload.new.id);
        } else {
          addOrUpdateOrder(payload.new as Order);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tableId]);

  // Handle active realtime staff acceptance notifications
  useEffect(() => {
    activeOrders.forEach(order => {
      const prevStatus = lastNotificationStatus.get(order.id);
      if (prevStatus !== undefined && order.status !== prevStatus) {
        if (order.status === 'preparing') {
          toast.success(`✨ Order #${order.id.split('-')[0].toUpperCase()} has been ACCEPTED and is now preparing!`, { duration: 6000 });
        } else if (order.status === 'cancelled') {
          toast.error(`⚠️ Order #${order.id.split('-')[0].toUpperCase()} has been DECLINED.`, { duration: 8000 });
          removeOrder(order.id);
        } else if (order.status === 'ready') {
          toast.success(`🚀 Order #${order.id.split('-')[0].toUpperCase()} is READY!`, { duration: 6000 });
        } else if (order.status === 'served') {
          toast.success(`🍽️ Order #${order.id.split('-')[0].toUpperCase()} has been SERVED!`, { duration: 6000 });
        }
      }
    });
    setLastNotificationStatus(new Map(activeOrders.map(o => [o.id, o.status])));
  }, [activeOrders]);

  const fetchMenu = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*, categories(name)')
      .eq('is_available', true);
    
    if (data) {
      setMenuItems(data as MenuItem[]);
      const cats = Array.from(new Set(data.map((item: any) => item.categories?.name).filter(Boolean))) as string[];
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
        .in('status', ['received', 'preparing', 'ready', 'served']);
      if (data && data.length > 0) {
        setActiveOrders(data as Order[]);
        setLastNotificationStatus(new Map(data.map((o: Order) => [o.id, o.status])));
      }
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const catMatch = activeCategory === "All" || item.categories?.name === activeCategory;
    const searchMatch = item.name.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  const cancelOrder = async (orderId: string) => {
    const order = activeOrders.find(o => o.id === orderId);
    if (!order || order.status !== 'received') return;
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    if (!error) {
      removeOrder(orderId);
      toast.success("Order cancelled successfully");
    }
  };

  const handleEditOrder = async (orderId: string) => {
    const order = activeOrders.find(o => o.id === orderId);
    if (!order) return;
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*, menu_items(image_url)')
        .eq('order_id', orderId);
      
      if (error) throw error;
      if (data) {
        const cartItems = data.map((item: any) => ({
          id: item.menu_item_id,
          name: item.name,
          price: Number(item.price),
          quantity: item.quantity,
          image_url: item.menu_items?.image_url
        }));
        setItems(cartItems);
        setEditingOrderId(orderId);
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
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
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

      {/* Active Orders Section - supports up to 2 orders */}
      <AnimatePresence>
        {activeOrders.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pt-6 space-y-3"
          >
            {activeOrders.map(order => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`glass-md p-4 rounded-2xl border-l-2 ${
                  order.status === 'received' ? 'border-blue-500' :
                  order.status === 'preparing' ? 'border-amber-500' : 'border-emerald-500'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xs font-medium uppercase tracking-widest mb-0.5 flex items-center gap-2">
                      Order <span className="text-gradient">{order.id.split('-')[0].toUpperCase()}</span>
                    </h3>
                    <p className="text-[9px] text-white/40 font-mono uppercase tracking-widest">
                      Status: {order.status === 'received' ? 'Pending Acceptance' : order.status}
                    </p>
                  </div>
                  
                  {order.status === 'received' ? (
                    <div className="flex items-center gap-1 text-[9px] uppercase font-bold tracking-widest bg-blue-500/10 text-blue-400 px-2 py-1 rounded-lg border border-blue-500/20">
                      <Clock size={10} className="animate-spin" />
                      <span>Awaiting</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[9px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg border border-emerald-500/20">
                      <CheckCircle2 size={10} />
                      <span>Accepted</span>
                    </div>
                  )}
                </div>

                {order.status === 'received' ? (
                  <div className="flex gap-2">
                    <button className="flex-1 btn-glass text-[10px] py-2 flex items-center justify-center gap-1 font-bold tracking-wider" onClick={() => handleEditOrder(order.id)}>
                      <Edit2 size={10} /> EDIT
                    </button>
                    <button onClick={() => cancelOrder(order.id)} className="btn-glass border-red-500/30 hover:bg-red-500/10 text-red-400 flex-1 text-[10px] py-2 flex items-center justify-center gap-1 font-bold tracking-wider">
                      <X size={10} /> CANCEL
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[9px] bg-white/5 p-2 rounded-xl border border-white/5 text-white/60">
                    <AlertCircle size={10} className="text-emerald-400 shrink-0" />
                    <span>Being prepared by the chef.</span>
                  </div>
                )}
              </motion.div>
            ))}
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

      <div className="px-2 md:px-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 md:gap-0">
        {filteredItems.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>

      <CustomerCart tableId={tableId} setActiveOrder={addOrUpdateOrder} />
    </div>
  );
}
