"use client";

import { useEffect, useState } from "react";
import { createBrowserClient, Database } from "@/lib/supabase";
import { Plus, Image as ImageIcon, Trash2, Edit2, Loader2, X, UploadCloud, Link as LinkIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  // Image Mode Toggle State
  const [imageInputMode, setImageInputMode] = useState<'url' | 'upload'>('url');
  
  const supabase = createBrowserClient();

  // Form State
  const [formData, setFormData] = useState({
    name: "", 
    description: "", 
    price: "", 
    category_id: "", 
    image_url: "", 
    is_available: true, 
    is_veg: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isAdding) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isAdding]);

  const fetchData = async () => {
    const [menuRes, catRes] = await Promise.all([
      supabase.from('menu_items').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order')
    ]);
    if (menuRes.data) setItems(menuRes.data);
    if (catRes.data) setCategories(catRes.data);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
      toast.success("Image uploaded to gallery successfully!");
    } catch (error: any) {
      toast.error(error.message || "Error uploading image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      category_id: "",
      image_url: "",
      is_available: true,
      is_veg: true
    });
  };

  const handleEditSelect = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      category_id: item.category_id || "",
      image_url: item.image_url || "",
      is_available: item.is_available ?? true,
      is_veg: item.is_veg ?? true
    });
    // Check if image_url exists and looks like a Supabase storage URL to pre-set tab selection
    if (item.image_url && item.image_url.includes('supabase.co')) {
      setImageInputMode('upload');
    } else {
      setImageInputMode('url');
    }
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this menu item? This action cannot be undone.")) return;
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success("Menu item deleted successfully");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete item");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category_id: formData.category_id || null,
        image_url: formData.image_url,
        is_available: formData.is_available,
        is_veg: formData.is_veg
      };

      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(payload)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        toast.success("Item updated successfully");
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert([payload]);
        
        if (error) throw error;
        toast.success("Item added successfully");
      }
      
      handleCancel();
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    const { error } = await supabase.from('menu_items').update({ is_available: !current }).eq('id', id);
    if (!error) {
      setItems(items.map(i => i.id === id ? { ...i, is_available: !current } : i));
      toast.success("Status updated");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <header className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-light tracking-widest text-gradient mb-1">MENU MANAGEMENT</h1>
          <p className="text-white/40 uppercase tracking-widest text-[9px] md:text-sm">Update Cafe Offerings</p>
        </div>
        <button 
          onClick={() => {
            if (isAdding) handleCancel();
            else setIsAdding(true);
          }} 
          className="btn-primary flex items-center gap-1.5 py-2 px-3 text-xs shrink-0"
        >
          {isAdding ? <X size={14} /> : <Plus size={14} />}
          <span>{isAdding ? "CANCEL" : "ADD"}</span>
        </button>
      </header>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="fixed inset-0 bg-black/90 backdrop-blur-md"
            />

              {/* Modal Body Container - Full screen on mobile */}
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="relative w-full h-full md:max-w-4xl md:max-h-[92vh] md:rounded-3xl md:m-4 p-3 md:p-8 border-0 md:border border-white/10 bg-[#060606] md:bg-[#060606]/98 backdrop-blur-xl shadow-[0_0_80px_rgba(0,0,0,0.95)] z-10 overflow-y-auto flex flex-col"
            >
              <form onSubmit={handleSubmit} className="flex flex-col space-y-3 md:space-y-4 min-h-0">
                <div className="flex justify-between items-center shrink-0">
                  <div>
                    <h2 className="text-[11px] md:text-sm uppercase tracking-widest text-gradient font-bold">
                      {editingItem ? `Editing: ${editingItem.name}` : "Create New Menu Item"}
                    </h2>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleCancel} 
                    className="w-7 h-7 rounded-full glass hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Single flow layout on mobile, two columns on desktop */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-8 min-h-0">
                  {/* Left Column: Form Info details */}
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <label className="block text-[10px] md:text-xs uppercase tracking-widest text-white/40 mb-1 font-bold">Item Name</label>
                      <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-glass text-xs md:text-sm py-2 px-3" placeholder="e.g. Quantum Matcha" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] md:text-xs uppercase tracking-widest text-white/40 mb-1 font-bold">Price (₹)</label>
                        <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="input-glass text-xs md:text-sm py-2 px-3" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-[10px] md:text-xs uppercase tracking-widest text-white/40 mb-1 font-bold">Item Type</label>
                        <select required value={formData.is_veg ? "veg" : "non-veg"} onChange={e => setFormData({...formData, is_veg: e.target.value === "veg"})} className="input-glass text-xs md:text-sm py-2 px-3 bg-[#111] text-white">
                          <option value="veg" className="bg-[#181818]">Vegetarian</option>
                          <option value="non-veg" className="bg-[#181818]">Non-Vegetarian</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] md:text-xs uppercase tracking-widest text-white/40 mb-1 font-bold">Category</label>
                      <select required value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="input-glass text-xs md:text-sm py-2 px-3 bg-[#111] text-white">
                        <option value="" className="bg-[#181818]">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id} className="bg-[#181818]">{c.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] md:text-xs uppercase tracking-widest text-white/40 mb-1 font-bold">Description</label>
                      <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-glass text-xs md:text-sm py-2 px-3 w-full resize-none leading-relaxed" rows={2} placeholder="Brief elegant description..." />
                    </div>

                    {/* Image section moved inline on mobile */}
                    <div className="md:hidden border border-white/5 bg-white/[0.01] rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Image</span>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => setImageInputMode('url')} className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] uppercase font-bold tracking-wider transition-all border ${imageInputMode === 'url' ? 'bg-white text-black border-white' : 'glass border-transparent text-white/40'}`}><LinkIcon size={7} /> URL</button>
                          <button type="button" onClick={() => setImageInputMode('upload')} className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] uppercase font-bold tracking-wider transition-all border ${imageInputMode === 'upload' ? 'bg-white text-black border-white' : 'glass border-transparent text-white/40'}`}><UploadCloud size={7} /> Upload</button>
                        </div>
                      </div>
                      {imageInputMode === 'url' ? (
                        <input value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="input-glass text-xs py-1.5 px-3 w-full" placeholder="Paste path e.g. /images/mojito.png" />
                      ) : (
                        <label className="flex items-center justify-center border border-dashed border-white/10 rounded-lg p-2 hover:bg-white/5 cursor-pointer">
                          {uploadingImage ? (
                            <div className="flex items-center gap-2 py-1"><Loader2 className="w-4 h-4 animate-spin text-white/50" /><span className="text-[8px] text-white/50">Uploading...</span></div>
                          ) : (
                            <div className="flex items-center gap-2"><UploadCloud size={14} className="text-white/40" /><span className="text-[9px] text-white/80">Select file</span></div>
                          )}
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                        </label>
                      )}
                      {formData.image_url && (
                        <div className="flex items-center gap-2 bg-black/40 rounded-lg p-2">
                          <img src={formData.image_url} alt="" className="w-8 h-8 rounded-lg object-contain bg-white/5" />
                          <span className="text-[8px] font-mono text-white/60 truncate flex-1">{formData.image_url}</span>
                          <button type="button" onClick={() => setFormData({...formData, image_url: ""})} className="w-4 h-4 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center shrink-0"><X size={8} /></button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Desktop only */}
                  <div className="hidden md:flex flex-col overflow-hidden">
                    <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-4 flex-1 flex flex-col justify-between overflow-hidden min-h-0">
                      <div className="space-y-3 shrink-0">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <label className="block text-xs uppercase tracking-widest text-white/40 font-bold">Image</label>
                          <div className="flex gap-1.5">
                            <button type="button" onClick={() => setImageInputMode('url')} className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] uppercase font-bold tracking-wider transition-all border ${imageInputMode === 'url' ? 'bg-white text-black border-white' : 'glass border-transparent text-white/40 hover:text-white'}`}><LinkIcon size={8} /> Link URL</button>
                            <button type="button" onClick={() => setImageInputMode('upload')} className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] uppercase font-bold tracking-wider transition-all border ${imageInputMode === 'upload' ? 'bg-white text-black border-white' : 'glass border-transparent text-white/40 hover:text-white'}`}><UploadCloud size={8} /> Upload</button>
                          </div>
                        </div>
                        {imageInputMode === 'url' ? (
                          <div className="space-y-1">
                            <input value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="input-glass text-sm py-2 px-3.5" placeholder="Paste path e.g. /images/mojito.png" />
                            <p className="text-[8px] text-white/20 uppercase tracking-widest font-mono">Paste link or static folder paths</p>
                          </div>
                        ) : (
                          <div>
                            <label className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl p-3.5 hover:bg-white/5 cursor-pointer transition-all relative">
                              {uploadingImage ? (
                                <div className="flex flex-col items-center gap-1 py-1.5"><Loader2 className="w-4 h-4 animate-spin text-white/50" /><span className="text-[8px] text-white/50 uppercase tracking-widest">Uploading to Cloud Storage...</span></div>
                              ) : (
                                <div className="flex flex-col items-center gap-0.5"><UploadCloud size={16} className="text-white/40 mb-0.5" /><span className="text-[10px] text-white/80 font-medium">Select image file</span><span className="text-[8px] text-white/40 uppercase tracking-wider font-mono">PNG, JPG, WEBP</span></div>
                              )}
                              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                            </label>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex items-center justify-center bg-black/40 border border-white/5 rounded-xl p-3 mt-3 min-h-[90px] overflow-hidden relative">
                        {formData.image_url ? (
                          <div className="flex items-center gap-3.5 w-full">
                            <img src={formData.image_url} alt="Preview" className="w-16 h-16 rounded-xl object-contain bg-white/5 border border-white/10 shrink-0" />
                            <div className="text-left overflow-hidden flex-1">
                              <span className="text-[8px] text-white/40 uppercase tracking-widest font-bold block">Preview Thumbnail</span>
                              <span className="text-[9px] font-mono text-white/70 truncate block">{formData.image_url}</span>
                            </div>
                            <button type="button" onClick={() => setFormData({...formData, image_url: ""})} className="w-6 h-6 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors shrink-0"><X size={10} /></button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-white/20 uppercase tracking-widest font-mono text-[8px]"><ImageIcon size={16} className="opacity-40" /><span>No Image Selected</span></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-3 border-t border-white/5 flex justify-end gap-3 shrink-0">
                  <button type="button" onClick={handleCancel} className="btn-glass text-[10px] md:text-xs py-2 px-4">CANCEL</button>
                  <button type="submit" className="btn-primary text-[10px] md:text-xs py-2 px-4">{editingItem ? "UPDATE MENU ITEM" : "SAVE MENU ITEM"}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-white/30" /></div>
      ) : (
        <>
          <div className="hidden md:block glass-md rounded-3xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/40 uppercase tracking-widest text-xs">
              <tr>
                <th className="p-6">Item</th>
                <th className="p-6">Price</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={`table-row ${!item.is_available ? 'opacity-50' : ''}`}>
                  <td className="p-6 flex items-center gap-4">
                    {item.image_url ? (
                       <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"><ImageIcon size={16} /></div>
                    )}
                    <div>
                      <span className="font-medium text-white/90 block">{item.name}</span>
                      <span className="text-[10px] text-white/40 font-mono tracking-wider uppercase">
                        {categories.find(c => c.id === item.category_id)?.name || "Uncategorized"}
                      </span>
                    </div>
                  </td>
                  <td className="p-6 font-mono">₹{item.price.toFixed(2)}</td>
                  <td className="p-6">
                    <button 
                      onClick={() => toggleAvailability(item.id, item.is_available ?? true)}
                      className={`text-xs px-3 py-1 rounded-full uppercase tracking-widest transition-colors ${
                        item.is_available ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {item.is_available ? 'Available' : 'Out of Stock'}
                    </button>
                  </td>
                  <td className="p-6 text-right space-x-2">
                    <button 
                      onClick={() => handleEditSelect(item)}
                      className="p-2 glass rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                      title="Edit Item"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 glass rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile High-Density Card List View (Hidden on desktop) */}
        <div className="md:hidden space-y-2.5">
          {items.map((item) => (
            <div 
              key={item.id} 
              className={`glass-md p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3 bg-[#080808]/40 transition-all ${
                !item.is_available ? 'opacity-40' : ''
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0" 
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                    <Plus size={14} className="text-white/20" />
                  </div>
                )}
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-bold text-white/90 truncate">{item.name}</span>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.is_veg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  </div>
                  <div className="text-[10px] text-white/40 flex items-center gap-1.5 uppercase tracking-wider font-semibold">
                    <span className="truncate max-w-[80px]">
                      {categories.find(c => c.id === item.category_id)?.name || "Uncategorized"}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-amber-200">₹{item.price.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => toggleAvailability(item.id, item.is_available ?? true)}
                  className={`text-[8px] uppercase tracking-widest font-bold px-2 py-1 rounded-lg border transition-all ${
                    item.is_available 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}
                >
                  {item.is_available ? 'In' : 'Out'}
                </button>
                <button
                  onClick={() => handleEditSelect(item)}
                  className="p-2 text-white/60 hover:text-white glass rounded-xl transition-colors"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-red-400 hover:text-red-300 glass hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="p-12 text-center text-white/40 font-light flex flex-col items-center gap-3 glass-md rounded-2xl">
              <ImageIcon size={24} className="opacity-50" />
              <span className="text-xs uppercase tracking-widest font-semibold">No items found</span>
            </div>
          )}
        </div>
      </>
      )}
    </div>
  );
}
