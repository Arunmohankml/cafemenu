export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
};

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'c1',
    name: 'Aura Signature Espresso',
    description: 'Double shot espresso pulled from single-origin Ethiopian beans with notes of jasmine and dark chocolate.',
    price: 4.5,
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0fd24?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'c2',
    name: 'Nebula Latte',
    description: 'Smooth flat white with oat milk, infused with subtle vanilla bean and topped with silver leaf.',
    price: 6.5,
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 't1',
    name: 'Quantum Matcha',
    description: 'Ceremonial grade matcha whisked to perfection with a touch of agave.',
    price: 7.0,
    category: 'Tea',
    image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'd1',
    name: 'Void Chocolate Tart',
    description: 'Decadent dark chocolate ganache in a charcoal pastry shell, sprinkled with sea salt.',
    price: 8.5,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1511381939415-e440c9c368d4?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 's1',
    name: 'Truffle Edamame',
    description: 'Warm edamame tossed in white truffle oil and smoked salt.',
    price: 5.5,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600',
  },
];
