import { create } from 'zustand'

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
};

interface CartState {
  items: CartItem[];
  tipPercentage: number;
  customTip: number | null;
  editingOrderId: string | null;
  addItem: (item: any) => void;
  setItems: (items: CartItem[]) => void;
  setEditingOrderId: (id: string | null) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setTipPercentage: (percentage: number) => void;
  setCustomTip: (amount: number | null) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTipAmount: () => number;
  getTaxAmount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  tipPercentage: 0,
  customTip: null,
  editingOrderId: null,

  setItems: (items) => set({ items }),
  setEditingOrderId: (editingOrderId) => set({ editingOrderId }),

  addItem: (item) => set((state) => {
    const existing = state.items.find((i) => i.id === item.id);
    if (existing) {
      return { items: state.items.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) };
    }
    return { items: [...state.items, { id: item.id, name: item.name, price: item.price, quantity: 1, image_url: item.image_url }] };
  }),

  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  updateQuantity: (id, quantity) => set((state) => ({
    items: quantity <= 0 ? state.items.filter((i) => i.id !== id) : state.items.map((i) => i.id === id ? { ...i, quantity } : i)
  })),

  setTipPercentage: (percentage) => set({ tipPercentage: percentage, customTip: null }),
  setCustomTip: (amount) => set({ customTip: amount, tipPercentage: 0 }),
  clearCart: () => set({ items: [], tipPercentage: 0, customTip: null, editingOrderId: null }),

  getSubtotal: () => get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
  getTaxAmount: () => get().getSubtotal() * 0.05, // 5% mock tax
  getTipAmount: () => {
    const { tipPercentage, customTip, getSubtotal } = get();
    return customTip !== null ? customTip : (getSubtotal() * tipPercentage) / 100;
  },
  getTotal: () => get().getSubtotal() + get().getTaxAmount() + get().getTipAmount()
}));
