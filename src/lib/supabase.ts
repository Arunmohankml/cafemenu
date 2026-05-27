import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'

const isMockEnabled = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') || 
                      process.env.NEXT_PUBLIC_SUPABASE_URL === '';

// ============================================================================
// MOCK DATABASE & CLIENT FOR OFFLINE / LOCAL DEVELOPMENT
// ============================================================================

const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Coffee', icon: '☕', sort_order: 1, created_at: new Date().toISOString() },
  { id: 'cat-2', name: 'Tea', icon: '🍵', sort_order: 2, created_at: new Date().toISOString() },
  { id: 'cat-3', name: 'Desserts', icon: '🍰', sort_order: 3, created_at: new Date().toISOString() },
  { id: 'cat-4', name: 'Snacks', icon: '🥪', sort_order: 4, created_at: new Date().toISOString() },
  { id: 'cat-5', name: 'Beverages', icon: '🥤', sort_order: 5, created_at: new Date().toISOString() }
];

const DEFAULT_MENU_ITEMS = [
  {
    id: 'item-1',
    category_id: 'cat-1',
    name: 'Aura Signature Espresso',
    description: 'Double shot pulled from single-origin Ethiopian beans with notes of jasmine and dark chocolate.',
    price: 370,
    image_url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0fd24?w=600&q=80',
    is_available: true,
    is_veg: true,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'item-2',
    category_id: 'cat-1',
    name: 'Nebula Latte',
    description: 'Smooth flat white with oat milk, infused with subtle vanilla bean and topped with silver leaf.',
    price: 530,
    image_url: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=600&q=80',
    is_available: true,
    is_veg: true,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'item-3',
    category_id: 'cat-2',
    name: 'Quantum Matcha',
    description: 'Ceremonial grade matcha whisked to perfection with a touch of agave nectar.',
    price: 580,
    image_url: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=600&q=80',
    is_available: true,
    is_veg: true,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'item-4',
    category_id: 'cat-3',
    name: 'Void Chocolate Tart',
    description: 'Decadent dark chocolate ganache in a charcoal pastry shell, sprinkled with Himalayan sea salt.',
    price: 700,
    image_url: 'https://images.unsplash.com/photo-1511381939415-e440c9c368d4?w=600&q=80',
    is_available: true,
    is_veg: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'item-5',
    category_id: 'cat-4',
    name: 'Truffle Edamame',
    description: 'Warm edamame tossed in white truffle oil and smoked salt. A perfect premium snack.',
    price: 450,
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
    is_available: true,
    is_veg: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'item-6',
    category_id: 'cat-1',
    name: 'Cold Brew Noir',
    description: '18-hour cold brewed single-origin coffee served over obsidian ice. Smooth and powerful.',
    price: 620,
    image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80',
    is_available: true,
    is_veg: true,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'item-7',
    category_id: 'cat-5',
    name: 'Yuzu Lemonade',
    description: 'Japanese yuzu citrus blended with spring water and a hint of white mint. Refreshingly elegant.',
    price: 410,
    image_url: 'https://images.unsplash.com/photo-1587016819369-ef8124fb44f0?w=600&q=80',
    is_available: true,
    is_veg: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'item-8',
    category_id: 'cat-4',
    name: 'Truffle Avocado Toast',
    description: 'Sourdough toast with whipped ricotta, avocado, microgreens and black truffle shavings.',
    price: 1150,
    image_url: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=600&q=80',
    is_available: true,
    is_veg: true,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Memory-based fallback database for server-side environments (where window/localStorage are undefined)
const memoryDb: Record<string, any> = {
  mock_categories: DEFAULT_CATEGORIES,
  mock_menu_items: DEFAULT_MENU_ITEMS,
  mock_orders: [],
  mock_order_items: [],
  mock_profiles: [
    { id: 'mock-user-1', email: 'admin@auracafe.com', full_name: 'Admin User', role: 'admin', avatar_url: null, created_at: new Date().toISOString() },
    { id: 'mock-user-2', email: 'staff@auracafe.com', full_name: 'Staff User', role: 'staff', avatar_url: null, created_at: new Date().toISOString() }
  ]
};

const getLocalStorageData = (key: string, defaultVal: any) => {
  if (typeof window === 'undefined') {
    return memoryDb[key] || defaultVal;
  }
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return defaultVal;
  }
};

const saveLocalStorageData = (key: string, data: any) => {
  if (typeof window === 'undefined') {
    memoryDb[key] = data;
    return;
  }
  localStorage.setItem(key, JSON.stringify(data));
  // Dispatch custom storage event for other components and windows/tabs to synchronize
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new CustomEvent('supabase-realtime-update', { detail: { key } }));
};

class MockQueryBuilder {
  private tableName: string;
  private filters: Array<(item: any) => boolean> = [];
  private orderByField: string | null = null;
  private orderAscending: boolean = true;
  private isSingle: boolean = false;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: any = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  private getTableData() {
    if (this.tableName === 'categories') {
      return getLocalStorageData('mock_categories', DEFAULT_CATEGORIES);
    }
    if (this.tableName === 'menu_items') {
      return getLocalStorageData('mock_menu_items', DEFAULT_MENU_ITEMS);
    }
    if (this.tableName === 'orders') {
      return getLocalStorageData('mock_orders', []);
    }
    if (this.tableName === 'order_items') {
      return getLocalStorageData('mock_order_items', []);
    }
    if (this.tableName === 'profiles') {
      return getLocalStorageData('mock_profiles', [
        { id: 'mock-user-1', email: 'admin@auracafe.com', full_name: 'Admin User', role: 'admin', avatar_url: null, created_at: new Date().toISOString() },
        { id: 'mock-user-2', email: 'staff@auracafe.com', full_name: 'Staff User', role: 'staff', avatar_url: null, created_at: new Date().toISOString() }
      ]);
    }
    return [];
  }

  private saveTableData(data: any[]) {
    if (this.tableName === 'categories') saveLocalStorageData('mock_categories', data);
    if (this.tableName === 'menu_items') saveLocalStorageData('mock_menu_items', data);
    if (this.tableName === 'orders') saveLocalStorageData('mock_orders', data);
    if (this.tableName === 'order_items') saveLocalStorageData('mock_order_items', data);
    if (this.tableName === 'profiles') saveLocalStorageData('mock_profiles', data);
  }

  select(fields?: string) {
    this.action = 'select';
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push((item: any) => item[field] === value);
    return this;
  }

  neq(field: string, value: any) {
    this.filters.push((item: any) => item[field] !== value);
    return this;
  }

  in(field: string, values: any[]) {
    this.filters.push((item: any) => values.includes(item[field]));
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderByField = field;
    this.orderAscending = options?.ascending !== false;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  insert(rows: any | any[]) {
    this.action = 'insert';
    this.payload = rows;
    return this;
  }

  update(changes: any) {
    this.action = 'update';
    this.payload = changes;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  async then(onfulfilled?: (value: any) => any) {
    const result = this.execute();
    if (onfulfilled) {
      return onfulfilled(result);
    }
    return result;
  }

  private execute() {
    const data = this.getTableData();

    if (this.action === 'select') {
      let filtered = [...data];
      for (const filterFn of this.filters) {
        filtered = filtered.filter(filterFn);
      }

      // Populate joins:
      // menu_items -> categories
      if (this.tableName === 'menu_items') {
        const cats = getLocalStorageData('mock_categories', DEFAULT_CATEGORIES);
        filtered = filtered.map((item: any) => {
          const category = cats.find((c: any) => c.id === item.category_id);
          return {
            ...item,
            categories: category ? { name: category.name } : null
          };
        });
      }

      // orders -> order_items
      if (this.tableName === 'orders') {
        const allOrderItems = getLocalStorageData('mock_order_items', []);
        filtered = filtered.map((order: any) => {
          const items = allOrderItems.filter((oi: any) => oi.order_id === order.id);
          return {
            ...order,
            order_items: items
          };
        });
      }

      // order_items -> menu_items
      if (this.tableName === 'order_items') {
        const allMenuItems = getLocalStorageData('mock_menu_items', DEFAULT_MENU_ITEMS);
        filtered = filtered.map((oi: any) => {
          const item = allMenuItems.find((m: any) => m.id === oi.menu_item_id);
          return {
            ...oi,
            menu_items: item ? { image_url: item.image_url } : null
          };
        });
      }

      if (this.orderByField) {
        const field = this.orderByField;
        const asc = this.orderAscending;
        filtered.sort((a, b) => {
          const valA = a[field];
          const valB = b[field];
          if (valA < valB) return asc ? -1 : 1;
          if (valA > valB) return asc ? 1 : -1;
          return 0;
        });
      }

      return {
        data: this.isSingle ? (filtered[0] || null) : filtered,
        error: null
      };
    }

    if (this.action === 'insert') {
      const rowsToInsert = Array.isArray(this.payload) ? this.payload : [this.payload];
      const insertedRows = rowsToInsert.map((row: any) => {
        return {
          id: row.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...row
        };
      });

      const updatedData = [...data, ...insertedRows];
      this.saveTableData(updatedData);

      const returnedData = Array.isArray(this.payload) ? insertedRows : insertedRows[0];
      return {
        data: this.isSingle ? (insertedRows[0] || null) : returnedData,
        error: null
      };
    }

    if (this.action === 'update') {
      let updatedCount = 0;
      const updatedData = data.map((item: any) => {
        let isMatch = true;
        for (const filterFn of this.filters) {
          if (!filterFn(item)) {
            isMatch = false;
            break;
          }
        }

        if (isMatch) {
          updatedCount++;
          return {
            ...item,
            ...this.payload,
            updated_at: new Date().toISOString()
          };
        }
        return item;
      });

      if (updatedCount > 0) {
        this.saveTableData(updatedData);
      }

      let filtered = [...updatedData];
      for (const filterFn of this.filters) {
        filtered = filtered.filter(filterFn);
      }

      return {
        data: this.isSingle ? (filtered[0] || null) : filtered,
        error: null
      };
    }

    if (this.action === 'delete') {
      const remainingData = data.filter((item: any) => {
        let isMatch = true;
        for (const filterFn of this.filters) {
          if (!filterFn(item)) {
            isMatch = false;
            break;
          }
        }
        return !isMatch;
      });

      this.saveTableData(remainingData);

      return {
        data: null,
        error: null
      };
    }

    return { data: null, error: null };
  }
}

class MockChannel {
  private channelName: string;
  private listeners: Array<{ event: string; filter: string | null; callback: (payload: any) => void }> = [];
  private eventHandler: (() => void) | null = null;

  constructor(channelName: string) {
    this.channelName = channelName;
  }

  on(event: string, filter: any, callback: (payload: any) => void) {
    this.listeners.push({
      event: filter.event || '*',
      filter: filter.filter || null,
      callback
    });
    return this;
  }

  subscribe() {
    if (typeof window !== 'undefined') {
      this.eventHandler = () => {
        const orders = getLocalStorageData('mock_orders', []);
        
        for (const listener of this.listeners) {
          let filterTableId: number | null = null;
          if (listener.filter && listener.filter.includes('table_id=eq.')) {
            const matches = listener.filter.match(/table_id=eq\.(\d+)/);
            if (matches) filterTableId = parseInt(matches[1]);
          }

          if (filterTableId !== null) {
            const tableOrders = orders.filter((o: any) => o.table_id === filterTableId);
            const activeOrder = tableOrders.find((o: any) => ['received', 'preparing', 'ready', 'served'].includes(o.status));
            if (activeOrder) {
              listener.callback({ new: activeOrder });
            }
          } else {
            // General reload notification for admin
            listener.callback({ new: null });
          }
        }
      };

      window.addEventListener('storage', this.eventHandler);
      window.addEventListener('supabase-realtime-update', this.eventHandler);
    }
    return this;
  }

  unsubscribe() {
    if (typeof window !== 'undefined' && this.eventHandler) {
      window.removeEventListener('storage', this.eventHandler);
      window.removeEventListener('supabase-realtime-update', this.eventHandler);
    }
  }
}

class MockSupabaseClient {
  from(tableName: string) {
    return new MockQueryBuilder(tableName);
  }

  channel(channelName: string) {
    return new MockChannel(channelName);
  }

  removeChannel(channel: MockChannel) {
    channel.unsubscribe();
  }
}

export const mockSupabase = new MockSupabaseClient();

// ============================================================================
// CLIENT RESOLUTION
// ============================================================================

// Browser client (for client components)
export const createBrowserClient = () => {
  if (isMockEnabled) {
    return mockSupabase as any;
  }
  return createClientComponentClient()
}

// Simple anon client for public operations
export const supabase = isMockEnabled 
  ? (mockSupabase as any) 
  : createClient(supabaseUrl, supabaseAnonKey)

// ============================================================================
// TYPES
// ============================================================================

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'customer' | 'staff' | 'admin'
          avatar_url: string | null
          created_at: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          icon: string | null
          sort_order: number
          created_at: string
        }
      }
      menu_items: {
        Row: {
          id: string
          category_id: string | null
          name: string
          description: string | null
          price: number
          image_url: string | null
          is_available: boolean
          is_veg: boolean
          is_featured: boolean
          quantity_available: number | null
          created_at: string
          updated_at: string
        }
      }
      cafe_tables: {
        Row: {
          id: number
          name: string
          status: 'available' | 'occupied' | 'reserved'
          capacity: number
        }
      }
      orders: {
        Row: {
          id: string
          table_id: number
          customer_session: string | null
          status: 'received' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'
          subtotal: number
          tip_amount: number
          tax_amount: number
          total: number
          payment_method: 'online' | 'pay_at_reception'
          payment_status: 'pending' | 'paid' | 'failed'
          notes: string | null
          is_editable: boolean
          edit_deadline: string | null
          created_at: string
          updated_at: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string | null
          name: string
          price: number
          quantity: number
          instructions: string | null
          created_at: string
        }
      }
    }
  }
}
