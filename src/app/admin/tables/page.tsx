"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient, Database } from "@/lib/supabase";
import { Users, CheckCircle2, UserX, Clock, HelpCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

type Table = Database['public']['Tables']['cafe_tables']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];

export default function AdminTablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();
  const router = useRouter();

  useEffect(() => {
    fetchData();

    // Subscribe to realtime changes on cafe_tables
    const tableChannel = supabase
      .channel('table-live-status')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cafe_tables' },
        () => fetchTables()
      )
      .subscribe();

    // Subscribe to realtime changes on orders to keep occupied statuses fresh
    const orderChannel = supabase
      .channel('order-live-tables')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchActiveOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tableChannel);
      supabase.removeChannel(orderChannel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchTables(), fetchActiveOrders()]);
    setLoading(false);
  };

  const fetchTables = async () => {
    const { data } = await supabase
      .from('cafe_tables')
      .select('*')
      .order('id', { ascending: true });
    if (data) setTables(data);
  };

  const fetchActiveOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['received', 'preparing', 'ready', 'served']);
    if (data) setActiveOrders(data);
  };

  const updateTableStatus = async (tableId: number, status: 'available' | 'occupied' | 'reserved') => {
    try {
      const { error } = await supabase
        .from('cafe_tables')
        .update({ status })
        .eq('id', tableId);

      if (error) throw error;
      
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t));
      toast.success(`Table ${tableId} is now ${status}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update table status");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <header>
        <h1 className="text-xl md:text-3xl font-light tracking-widest text-gradient mb-1">TABLE MANAGEMENT</h1>
        <p className="text-white/40 uppercase tracking-widest text-[9px] md:text-sm">Realtime Seating Operations</p>
      </header>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-white/30" /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
          {tables.map((table) => {
            const tableOrders = activeOrders.filter(o => o.table_id === table.id);
            const hasActiveOrders = tableOrders.length > 0;

            return (
              <motion.div
                key={table.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`glass-md rounded-2xl p-4 md:p-6 border-t-4 flex flex-col justify-between ${
                  table.status === 'occupied' ? 'border-t-red-500' :
                  table.status === 'reserved' ? 'border-t-amber-500' : 'border-t-emerald-500'
                }`}
              >
                <div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1.5 mb-3">
                    <div>
                      <h2 className="text-sm md:text-lg font-bold text-white tracking-wide">{table.name}</h2>
                      <div className="flex items-center gap-1 text-[10px] md:text-xs text-white/40 mt-0.5">
                        <Users size={10} />
                        <span>Cap: {table.capacity}</span>
                      </div>
                    </div>
                    <span className={`text-[8px] md:text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full w-fit ${
                      table.status === 'occupied' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      table.status === 'reserved' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {table.status}
                    </span>
                  </div>

                  {/* Active orders section - highly compressed to fit screen */}
                  <div className="my-2.5 p-2.5 rounded-xl glass space-y-1.5 flex-1">
                    <span className="text-[9px] text-white/40 uppercase tracking-widest font-semibold block">Active Tickets</span>
                    {hasActiveOrders ? (
                      <div className="space-y-1.5 max-h-[80px] overflow-y-auto scrollbar-none">
                        {tableOrders.map(o => (
                          <div 
                            key={o.id} 
                            onClick={() => router.push(`/admin/orders?open=${o.id}`)}
                            className="flex justify-between items-center text-[10px] cursor-pointer hover:bg-white/10 p-1.5 rounded-lg transition-all border border-white/5 hover:border-white/20"
                            title="Click to view and update order status"
                          >
                            <span className="font-mono text-white/80 shrink-0">#{o.id.split('-')[0].substring(0, 4).toUpperCase()}</span>
                            <span className={`badge badge-${o.status} text-[7px] md:text-[8px] py-0.5 px-1.5 shrink-0`}>{o.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-white/30 flex items-center gap-1.5 py-0.5">
                        <CheckCircle2 size={10} className="text-emerald-500/60" />
                        <span>Clean</span>
                      </div>
                    )}
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
