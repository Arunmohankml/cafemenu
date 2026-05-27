"use client";

import { useEffect, useState } from "react";
import { createBrowserClient, Database } from "@/lib/supabase";
import { Coffee, CheckCircle2, IndianRupee, Users, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";


type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];

export default function AdminDashboard() {
  const [orders, setOrders] = useState<(Order & { order_items: OrderItem[] })[]>([]);
  const supabase = createBrowserClient();

  useEffect(() => {
    fetchOrders();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders() // Simple re-fetch for safety, can be optimized later
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
    
    if (data) setOrders(data);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
  };

  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const todaysOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
  const todaysRevenue = todaysOrders.reduce((acc, o) => acc + o.total, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <header>
        <h1 className="text-xl md:text-3xl font-light tracking-widest text-gradient mb-1">LIVE OPERATIONS</h1>
        <p className="text-white/40 uppercase tracking-widest text-[9px] md:text-sm">Realtime Cafe Status</p>
      </header>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <div className="stat-card p-3 md:p-6 rounded-2xl border border-white/5 bg-[#080808]">
          <div className="flex items-center justify-between">
            <span className="text-white/40 uppercase tracking-widest text-[9px] md:text-xs">Active Tickets</span>
            <AlertCircle size={14} className="text-blue-400" />
          </div>
          <div className="text-2xl md:text-4xl font-mono mt-1 md:mt-2">{activeOrders.length}</div>
        </div>
        
        <div className="stat-card p-3 md:p-6 rounded-2xl border border-white/5 bg-[#080808]">
          <div className="flex items-center justify-between">
            <span className="text-white/40 uppercase tracking-widest text-[9px] md:text-xs">Today's Revenue</span>
            <IndianRupee size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl md:text-4xl font-mono mt-1 md:mt-2">₹{todaysRevenue.toFixed(0)}</div>
        </div>

        <div className="stat-card p-3 md:p-6 rounded-2xl border border-white/5 bg-[#080808]">
          <div className="flex items-center justify-between">
            <span className="text-white/40 uppercase tracking-widest text-[9px] md:text-xs">Total Orders</span>
            <CheckCircle2 size={14} className="text-purple-400" />
          </div>
          <div className="text-2xl md:text-4xl font-mono mt-1 md:mt-2">{todaysOrders.length}</div>
        </div>

        <div className="stat-card p-3 md:p-6 rounded-2xl border border-white/5 bg-[#080808]">
          <div className="flex items-center justify-between">
            <span className="text-white/40 uppercase tracking-widest text-[9px] md:text-xs">Active Tables</span>
            <Users size={14} className="text-amber-400" />
          </div>
          <div className="text-2xl md:text-4xl font-mono mt-1 md:mt-2">
            {new Set(activeOrders.map(o => o.table_id)).size}
          </div>
        </div>
      </div>

      {/* Active Orders Grid */}
      <div>
        <h2 className="text-xs uppercase tracking-widest text-white/50 mb-4">Action Needed</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activeOrders.map((order) => (
            <div key={order.id} className="glass-md rounded-2xl p-4 md:p-6 border-l-2 border-l-blue-500 transition-all duration-300">
              <div className="flex justify-between items-start mb-3 border-b border-white/5 pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="bg-white text-black px-1.5 py-0.5 rounded text-[11px] font-bold font-mono">
                      T{order.table_id}
                    </span>
                    <span className="text-white/40 text-xs font-mono truncate max-w-[80px] sm:max-w-[150px]">
                      {order.id.split('-')[0]}
                    </span>
                  </div>
                  <div className="text-[10px] text-white/50 flex items-center gap-1.5">
                    <Clock size={10} />
                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`badge badge-${order.status} text-[9px] px-2 py-0.5`}>{order.status}</span>
                </div>
              </div>

              {/* High-density inline list for items, reducing vertical detail waste */}
              <div className="mb-4">
                <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold block mb-1">Items</span>
                <div className="text-xs text-white/80 line-clamp-2 md:line-clamp-none leading-relaxed font-light">
                  {order.order_items.map((item, idx) => (
                    <span key={item.id}>
                      {idx > 0 && <span className="text-white/20 px-1.5">•</span>}
                      <span className="font-mono font-semibold text-amber-200/80">{item.quantity}x</span> {item.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 w-full">
                {order.status === 'received' ? (
                  <>
                    <button
                      onClick={() => updateStatus(order.id, 'preparing')}
                      className="flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg bg-white text-black hover:bg-white/95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    >
                      ✔️ Accept
                    </button>
                    <button
                      onClick={() => updateStatus(order.id, 'cancelled')}
                      className="flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                    >
                      ❌ Decline
                    </button>
                  </>
                ) : (
                  <div className="flex gap-1.5 w-full overflow-x-auto pb-1 scrollbar-none">
                    {['preparing', 'ready', 'served', 'completed'].map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(order.id, s)}
                        className={`flex-1 py-1.5 px-2 text-[9px] uppercase font-bold tracking-wider rounded-lg transition-all min-w-[70px] ${
                          order.status === s 
                            ? 'bg-white text-black font-semibold' 
                            : 'glass text-white/40 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {activeOrders.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center glass-md rounded-3xl text-white/40 border-dashed">
              <CheckCircle2 size={36} className="mb-3 opacity-50 text-emerald-400 animate-pulse" />
              <p className="uppercase tracking-widest text-[10px] font-bold">All caught up</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
