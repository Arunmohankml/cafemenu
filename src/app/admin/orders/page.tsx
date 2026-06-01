"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserClient, Database } from "@/lib/supabase";
import { Receipt, Download, Search, X, Clock, Calendar, Hash, User, Coffee, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];
type OrderWithItems = Order & { 
  order_items: (OrderItem & { 
    menu_items: { image_url: string | null } | null 
  })[] 
};

// Wrapper Component for Suspense Boundary
export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-white/30" /></div>}>
      <AdminOrdersContent />
    </Suspense>
  );
}

function AdminOrdersContent() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const supabase = useMemo(() => createBrowserClient(), []);
  const searchParams = useSearchParams();
  const router = useRouter();

  const openId = searchParams.get('open');

  useEffect(() => {
    fetchOrders();
  }, []);

  // Handle deep-link parameters for auto-expanding orders
  useEffect(() => {
    if (openId && orders.length > 0) {
      const matched = orders.find(o => o.id === openId || o.id.startsWith(openId));
      if (matched) {
        setSelectedOrder(matched);
      }
    }
  }, [openId, orders]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, menu_items(image_url))')
      .order('created_at', { ascending: false });
    if (data) setOrders(data as any);
  };

  const handleUpdateStatus = async (orderId: string, status: any) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Update state dynamically
      setOrders(prev => prev.map(o => o.id === orderId ? ({ ...o, status }) : o));
      setSelectedOrder(prev => prev && prev.id === orderId ? ({ ...prev, status }) : prev);
      toast.success(`Order status updated to ${status}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update order status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled', notes: '[DELETED]' })
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Update local states dynamically
      setOrders(prev => prev.map(o => o.id === orderId ? ({ ...o, status: 'cancelled', notes: '[DELETED]' }) : o));
      setSelectedOrder(prev => prev && prev.id === orderId ? ({ ...prev, status: 'cancelled', notes: '[DELETED]' }) : prev);
      toast.success("Order has been deleted & blacked out!");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete order");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const generatePDF = (order: OrderWithItems) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('AURA CAFE', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Premium Futuristic Dining', 105, 28, { align: 'center' });
    
    // Order Info
    doc.setFontSize(11);
    doc.text(`Receipt #: ${order.id.split('-')[0].toUpperCase()}`, 14, 45);
    doc.text(`Table: ${order.table_id}`, 14, 52);
    doc.text(`Date: ${new Date(order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`, 14, 59);

    // Items Table
    const tableData = order.order_items.map(item => [
      item.quantity.toString(),
      item.name,
      `Rs.${item.price.toFixed(2)}`,
      `Rs.${(item.price * item.quantity).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Qty', 'Item', 'Price', 'Total']],
      body: tableData,
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240] },
      columnStyles: { 0: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 70;

    // Totals
    doc.text(`Subtotal:`, 140, finalY + 10);
    doc.text(`Rs.${order.subtotal.toFixed(2)}`, 180, finalY + 10, { align: 'right' });
    
    doc.text(`Tax (5%):`, 140, finalY + 17);
    doc.text(`Rs.${order.tax_amount.toFixed(2)}`, 180, finalY + 17, { align: 'right' });
    
    doc.text(`Tip:`, 140, finalY + 24);
    doc.text(`Rs.${order.tip_amount.toFixed(2)}`, 180, finalY + 24, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total:`, 140, finalY + 33);
    doc.text(`Rs.${order.total.toFixed(2)}`, 180, finalY + 33, { align: 'right' });

    // Footer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('Thank you for dining with Aura.', 105, finalY + 50, { align: 'center' });

    doc.save(`aura-receipt-${order.id.split('-')[0]}.pdf`);
  };

  const filtered = orders.filter(o => 
    o.id.includes(search) || o.table_id.toString().includes(search)
  );

  return (
    <div className="space-y-8 animate-fade-in relative min-h-[85vh]">
      <header>
        <h1 className="text-3xl font-light tracking-widest text-gradient mb-2">ORDER HISTORY</h1>
        <p className="text-white/40 uppercase tracking-widest text-sm">Review & Receipts</p>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by Order ID or Table..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-glass !pl-12"
        />
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block glass-md rounded-3xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-white/40 uppercase tracking-widest text-xs">
            <tr>
              <th className="p-6">Order ID</th>
              <th className="p-6">Table & Time</th>
              <th className="p-6">Status</th>
              <th className="p-6">Total</th>
              <th className="p-6 text-right">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => {
              const isDeleted = order.notes === '[DELETED]';
              const isCancelled = order.status === 'cancelled' && !isDeleted;
              return (
                <tr 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  className={`table-row cursor-pointer transition-all ${
                    isDeleted 
                      ? 'bg-red-950/5 opacity-25 grayscale hover:opacity-45 hover:bg-red-950/10' 
                      : isCancelled
                      ? 'bg-neutral-900/10 opacity-40 hover:opacity-60'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <td className="p-6 font-mono text-white/80">{order.id.split('-')[0].toUpperCase()}</td>
                  <td className="p-6">
                    <div className="font-medium text-white/90 flex items-center gap-2">
                      Table {order.table_id}
                      {isDeleted && <span className="bg-red-500/20 text-red-400 text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded font-bold">Deleted</span>}
                      {isCancelled && <span className="bg-neutral-500/20 text-neutral-400 text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded font-bold">Cancelled</span>}
                    </div>
                  <div className="text-xs text-white/40">
                    {new Date(order.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </div>
                </td>
                <td className="p-6" onClick={(e) => e.stopPropagation()}>
                  {order.status === 'received' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded bg-white text-black hover:bg-white/95 transition-all shadow-[0_0_10px_rgba(255,255,255,0.15)]"
                      >
                        ✔️ Accept
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                        className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                      >
                        ❌ Decline
                      </button>
                    </div>
                  ) : (
                    <span className={`badge badge-${order.status}`}>{order.status}</span>
                  )}
                </td>
                <td className="p-6 font-mono">₹{order.total.toFixed(2)}</td>
                <td className="p-6 text-right" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => generatePDF(order)}
                    disabled={order.status === 'received'}
                    className="p-2 glass rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title={order.status === 'received' ? "Order pending approval" : "Download Receipt PDF"}
                  >
                    <Download size={18} />
                  </button>
                </td>
              </tr>
            );})}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-20 text-center text-white/40 font-light flex flex-col items-center gap-4">
            <Receipt size={32} className="opacity-50" />
            No orders found.
          </div>
        )}
      </div>

      {/* Mobile High-Density Card List View (Hidden on desktop) */}
      <div className="md:hidden space-y-2.5">
        {filtered.map((order) => {
          const isDeleted = order.notes === '[DELETED]';
          const isCancelled = order.status === 'cancelled' && !isDeleted;
          return (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={`glass-md p-3.5 rounded-2xl border border-white/5 active:scale-[0.98] transition-all flex flex-col gap-2 cursor-pointer bg-[#080808]/40 ${
                isDeleted 
                  ? 'opacity-30 grayscale' 
                  : isCancelled
                  ? 'opacity-55'
                  : 'hover:border-white/10'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="bg-white text-black px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                    T{order.table_id}
                  </span>
                  <span className="font-mono text-xs text-white/80 font-bold">
                    #{order.id.split('-')[0].toUpperCase()}
                  </span>
                </div>
                <span className={`badge badge-${order.status} text-[9px] px-2 py-0.5`}>{order.status}</span>
              </div>

              <div className="flex justify-between items-center text-[11px] text-white/40 font-light pt-0.5">
                <div>
                  {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isDeleted && <span className="bg-red-500/20 text-red-400 text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded font-bold ml-1.5">Deleted</span>}
                  {isCancelled && <span className="bg-neutral-500/20 text-neutral-400 text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded font-bold ml-1.5">Cancelled</span>}
                </div>
                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  <span className="font-mono font-bold text-white/90 text-xs">₹{order.total.toFixed(0)}</span>
                  <button
                    onClick={() => generatePDF(order)}
                    disabled={order.status === 'received'}
                    className="p-1.5 glass rounded-lg text-white/80 hover:text-white disabled:opacity-30"
                  >
                    <Download size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="p-12 text-center text-white/40 font-light flex flex-col items-center gap-3 glass-md rounded-2xl">
            <Receipt size={24} className="opacity-50" />
            <span className="text-xs uppercase tracking-widest font-semibold">No orders found</span>
          </div>
        )}
      </div>

      {/* Expandable Right Side Drawer Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            {/* Dark glass background backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedOrder(null);
                // Clear query parameter on close to prevent reload loop
                router.replace('/admin/orders');
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Side Drawer Content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.35, ease: "easeOut" }}
              className="fixed top-0 right-0 h-screen w-full sm:w-[480px] bg-[#050505] border-l border-white/10 z-50 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white text-black flex items-center justify-center shrink-0">
                    <Receipt size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold tracking-wider text-white">ORDER DETAILS</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">ID: {selectedOrder.id.split('-')[0].toUpperCase()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedOrder(null);
                    router.replace('/admin/orders');
                  }}
                  className="w-8 h-8 rounded-full glass hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                
                {/* Status Update / Acceptance Section */}
                {selectedOrder.notes === '[DELETED]' ? (
                  <div className="glass-strong p-5 rounded-2xl border border-red-500/20 bg-red-500/5 text-center py-6 animate-pulse-subtle">
                    <span className="text-sm text-red-400 uppercase tracking-widest font-bold flex items-center justify-center gap-2">
                      ⚠️ Order Deleted & Blacked Out
                    </span>
                    <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest">This ticket is inactive</p>
                  </div>
                ) : selectedOrder.status === 'received' ? (
                  <div className="glass-strong p-5 rounded-2xl space-y-4 border border-blue-500/20 bg-blue-500/5 animate-pulse-subtle">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-blue-400 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                        <Clock size={12} className="animate-pulse" /> New Order Pending Approval
                      </span>
                      {updatingStatus && <Loader2 size={12} className="animate-spin text-white/40" />}
                    </div>
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'preparing')}
                        className="flex-1 py-3 text-xs uppercase tracking-widest font-bold rounded-xl bg-white text-black hover:bg-white/95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                      >
                        ✔️ Accept
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                        className="flex-1 py-3 text-xs uppercase tracking-widest font-bold rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all"
                      >
                        ❌ Decline
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="glass p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-white/40 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                        <Clock size={10} /> Update Status
                      </span>
                      {updatingStatus && <Loader2 size={12} className="animate-spin text-white/40" />}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['preparing', 'ready', 'served', 'completed', 'cancelled'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleUpdateStatus(selectedOrder.id, st as any)}
                          className={`py-1.5 text-[9px] uppercase font-bold tracking-wider rounded-lg border transition-all ${
                            selectedOrder.status === st
                              ? 'bg-white text-black border-white'
                              : 'glass border-transparent text-white/40 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass p-4 rounded-2xl space-y-1">
                    <div className="text-[9px] text-white/40 uppercase tracking-widest flex items-center gap-1.5"><Hash size={10} /> Table</div>
                    <div className="text-xl font-bold font-mono text-white">T{selectedOrder.table_id}</div>
                  </div>
                  <div className="glass p-4 rounded-2xl space-y-1">
                    <div className="text-[9px] text-white/40 uppercase tracking-widest flex items-center gap-1.5"><Clock size={10} /> Live Status</div>
                    <div className="pt-1"><span className={`badge badge-${selectedOrder.status}`}>{selectedOrder.status}</span></div>
                  </div>
                </div>

                <div className="glass p-4 rounded-2xl space-y-3">
                  <div className="text-[9px] text-white/40 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={10} /> Order Info</div>
                  <div className="text-xs space-y-2 text-white/70">
                    <div className="flex justify-between">
                      <span>Placed On</span>
                      <span className="font-mono text-white">{new Date(selectedOrder.created_at).toLocaleDateString([], { dateStyle: 'medium' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Placed Time</span>
                      <span className="font-mono text-white">{new Date(selectedOrder.created_at).toLocaleTimeString([], { timeStyle: 'short' })}</span>
                    </div>
                  </div>
                </div>

                {/* Itemized list (Showing Image Thumbnails) */}
                <div className="space-y-3">
                  <h4 className="text-[10px] text-white/40 uppercase tracking-widest font-semibold pl-1">Itemized Order Summary</h4>
                  <div className="space-y-2">
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="glass p-4 rounded-2xl flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3">
                          {/* Image Thumbnail Display */}
                          {item.menu_items?.image_url ? (
                            <img 
                              src={item.menu_items.image_url} 
                              alt={item.name} 
                              className="w-10 h-10 rounded-lg object-cover border border-white/5" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                              <Coffee size={14} className="text-white/40" />
                            </div>
                          )}
                          <div>
                            <span className="text-white/90 font-medium block">{item.name}</span>
                            <span className="text-[9px] text-white/40 font-mono tracking-widest uppercase">Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <span className="text-white/80 font-mono text-xs">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grand Total breakdown */}
                <div className="glass-strong p-5 rounded-2xl space-y-3 border border-white/10">
                  <h4 className="text-[10px] text-white/40 uppercase tracking-widest font-semibold border-b border-white/5 pb-2">Financial Breakdown</h4>
                  <div className="text-xs space-y-2 text-white/70">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono">₹{selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (5%)</span>
                      <span className="font-mono">₹{selectedOrder.tax_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tip</span>
                      <span className="font-mono">₹{selectedOrder.tip_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/5 text-sm font-semibold text-white">
                      <span className="text-gradient">GRAND TOTAL</span>
                      <span className="font-mono text-amber-200">₹{selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-white/5 bg-white/5 backdrop-blur-lg flex gap-3">
                <button
                  onClick={() => generatePDF(selectedOrder)}
                  disabled={selectedOrder.status === 'received' || selectedOrder.notes === '[DELETED]'}
                  className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={14} /> {selectedOrder.notes === '[DELETED]' ? 'Deleted' : selectedOrder.status === 'received' ? 'Pending Approval' : 'Download PDF'}
                </button>
                
                {selectedOrder.notes !== '[DELETED]' && (
                  <button
                    onClick={() => setDeleteConfirmId(selectedOrder.id)}
                    className="px-4 py-3 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl transition-all flex items-center justify-center"
                    title="Delete Order"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    router.replace('/admin/orders');
                  }}
                  className="btn-glass px-5 py-3 text-xs uppercase tracking-widest"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            
            {/* Confirmation Box container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative glass-strong max-w-sm w-full rounded-3xl p-8 border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.15)] text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500 animate-pulse">
                <Trash2 size={26} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold tracking-wider text-white">Delete Order?</h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  Are you sure you want to delete this order? It will be blacked out in the order history list.
                </p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-3 text-xs uppercase tracking-widest font-bold rounded-xl glass hover:bg-white/5 text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDeleteOrder(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                  className="flex-1 py-3 text-xs uppercase tracking-widest font-bold rounded-xl bg-red-500 text-white hover:bg-red-400 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
