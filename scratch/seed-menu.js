const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error("Error: .env.local not found!");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: Missing Supabase URL or Service Role Key in .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const categoriesToInsert = [
  { name: 'drinks', icon: 'GlassWater', sort_order: 1 },
  { name: 'shakes', icon: 'IceCream', sort_order: 2 },
  { name: 'snacks', icon: 'Cookie', sort_order: 3 },
  { name: 'hot bevarages', icon: 'Coffee', sort_order: 0 }
];

const items = [
  // hot bevarages
  { name: 'Americano', file: 'amercano.png', category: 'hot bevarages', price: 3.50, desc: 'Rich espresso shots topped with hot water for a smooth, deep coffee flavor.', is_veg: true },
  { name: 'Black Tea', file: 'black tea.png', category: 'hot bevarages', price: 2.50, desc: 'Premium black tea leaves brewed to aromatic, stimulating perfection.', is_veg: true },
  { name: 'Black Coffee', file: 'black-coffie.png', category: 'hot bevarages', price: 3.00, desc: 'Pure freshly brewed premium dark roast coffee served hot and strong.', is_veg: true },
  { name: 'Cappuccino', file: 'cappuccino.png', category: 'hot bevarages', price: 4.00, desc: 'Classic espresso shot layered with rich steamed milk and a deep pillow of foam.', is_veg: true },
  { name: 'Chai', file: 'chai.png', category: 'hot bevarages', price: 3.00, desc: 'Spiced aromatic milk tea brewed with cardamom, ginger, and fine black tea.', is_veg: true },
  { name: 'Double Espresso', file: 'double-expresso.png', category: 'hot bevarages', price: 3.50, desc: 'Two concentrated shots of pure rich espresso for the ultimate coffee kick.', is_veg: true },
  { name: 'Filter Coffee', file: 'filter-coffe.webp', category: 'hot bevarages', price: 3.00, desc: 'Traditional South Indian filter coffee brewed slow and served frothy.', is_veg: true },
  { name: 'Hot Chocolate', file: 'hot-chocolate.webp', category: 'hot bevarages', price: 4.50, desc: 'Decadent melted premium chocolate steamed with creamy milk and topped with foam.', is_veg: true },
  { name: 'Latte', file: 'latte.webp', category: 'hot bevarages', price: 4.00, desc: 'Espresso combined with steamed milk and a light, velvety layer of microfoam.', is_veg: true },
  { name: 'Macchiato', file: 'machhato.webp', category: 'hot bevarages', price: 4.00, desc: 'Bold espresso marked with a delicate dollop of velvety steamed milk foam.', is_veg: true },
  { name: 'Mocha', file: 'mocah.webp', category: 'hot bevarages', price: 4.50, desc: 'Rich espresso combined with dark cocoa syrup, steamed milk, and whipped cream.', is_veg: true },

  // drinks
  { name: 'Berry Mojito', file: 'berry-moito.png', category: 'drinks', price: 4.50, desc: 'Refreshing muddled berries, fresh mint leaves, lime juice, and sparkling soda.', is_veg: true },
  { name: 'Iced Americano', file: 'ced-americano.png', category: 'drinks', price: 4.00, desc: 'Bold shots of espresso poured over ice and chilled filtered water.', is_veg: true },
  { name: 'Iced Tea', file: 'ced-tea.png', category: 'drinks', price: 3.50, desc: 'Chilled premium black tea with a splash of fresh lemon and raw cane syrup.', is_veg: true },
  { name: 'Cola', file: 'cola.webp', category: 'drinks', price: 2.50, desc: 'Ice cold carbonated cola served with a fresh lemon wedge.', is_veg: true },
  { name: 'Grape Juice', file: 'grape-juce.png', category: 'drinks', price: 3.50, desc: 'Sweet, chilled 100% natural red grape juice freshly pressed.', is_veg: true },
  { name: 'Lemon Mojito', file: 'lemon-moito.png', category: 'drinks', price: 4.50, desc: 'Classic Cuban style mocktail with muddled mint, fresh lime, and premium soda.', is_veg: true },
  { name: 'Orange Juice', file: 'orange-juce.webp', category: 'drinks', price: 3.50, desc: 'Freshly squeezed premium sweet oranges served chilled with pulp.', is_veg: true },
  { name: 'Pineapple Mojito', file: 'pin-mojito.png', category: 'drinks', price: 4.50, desc: 'Sweet pineapple juice muddled with refreshing mint, fresh lime, and club soda.', is_veg: true },
  { name: 'Watermelon Juice', file: 'watermelon-juce.webp', category: 'drinks', price: 3.50, desc: 'Freshly blended hydrating red watermelon juice served ice cold.', is_veg: true },

  // shakes
  { name: 'Blackcurrant Ice Cream', file: 'black-currentr-icecream.webp', category: 'shakes', price: 4.00, desc: 'Creamy scoop of blackcurrant ice cream loaded with real dark berry chunks.', is_veg: true },
  { name: 'Butterscotch Ice Cream', file: 'butter-scotch-cecream.png', category: 'shakes', price: 4.00, desc: 'Creamy gourmet butterscotch ice cream with crunchy caramelized cashew bits.', is_veg: true },
  { name: 'Coconut Ice Cream', file: 'coconut-icecream.png', category: 'shakes', price: 4.00, desc: 'Exotic creamy ice cream made from pure sweet coconut cream and toasted flakes.', is_veg: true },
  { name: 'Date Shake', file: 'date-shake.webp', category: 'shakes', price: 5.00, desc: 'Nutritious thick shake blended with organic sweet dates, milk, and vanilla.', is_veg: true },
  { name: 'Delight Ice Cream', file: 'delight-cecream.png', category: 'shakes', price: 4.50, desc: 'Chef special premium ice cream scoop layered with multi-flavor chocolate drizzles.', is_veg: true },
  { name: 'KitKat Shake', file: 'kt-kat-shake.png', category: 'shakes', price: 5.50, desc: 'Decadent chocolate thick shake blended with crunchy crumbled KitKat bars.', is_veg: true },
  { name: 'Oreo Shake', file: 'oero shake.png', category: 'shakes', price: 5.50, desc: 'All-time favorite vanilla thick shake blended with rich chocolatey Oreo cookies.', is_veg: true },
  { name: 'Snickers Shake', file: 'snickers-shake.png', category: 'shakes', price: 5.50, desc: 'Creamy peanut-chocolate thick shake blended with real chunks of Snickers candy.', is_veg: true },
  { name: 'Strawberry Ice Cream', file: 'strawberry-ice-cream.png', category: 'shakes', price: 4.00, desc: 'Smooth, creamy ice cream churned with ripe fresh strawberries.', is_veg: true },
  { name: 'Strawberry Shake', file: 'strawbery shake.webp', category: 'shakes', price: 5.00, desc: 'Thick creamy milkshake blended with fresh strawberries and vanilla ice cream.', is_veg: true },
  { name: 'Vanilla Ice Cream', file: 'vannlla-icecream.png', category: 'shakes', price: 4.00, desc: 'Classic double-bean vanilla rich ice cream served as a perfect scoop.', is_veg: true },

  // snacks
  { name: 'Chocolate Brownie', file: 'brownies.png', category: 'snacks', price: 3.50, desc: 'Fudgy, dense gourmet chocolate brownie baked with dark cocoa chunks.', is_veg: true },
  { name: 'Classic Burger', file: 'burger.png', category: 'snacks', price: 7.50, desc: 'Juicy vegetable or grilled patty layered with cheese, fresh lettuce, and house sauce.', is_veg: true },
  { name: 'Chicken Wrap', file: 'chicken-wrap.webp', category: 'snacks', price: 6.50, desc: 'Savory grilled spiced chicken breast wrapped with mixed veggies in a warm tortilla.', is_veg: false },
  { name: 'Butter Croissant', file: 'croissant.webp', category: 'snacks', price: 3.00, desc: 'Flaky, buttery baked croissant served warm with a golden crisp exterior.', is_veg: true },
  { name: 'Glazed Donut', file: 'donut.webp', category: 'snacks', price: 2.50, desc: 'Fluffy, soft ring donut glazed with sweet vanilla icing.', is_veg: true },
  { name: 'French Fries', file: 'fries.png', category: 'snacks', price: 3.50, desc: 'Crispy, golden-fried potato fingers tossed with sea salt and fresh herbs.', is_veg: true },
  { name: 'Chocolate Muffin', file: 'muffi.png', category: 'snacks', price: 3.00, desc: 'Soft and moist bakery-style muffin loaded with sweet dark chocolate chips.', is_veg: true },
  { name: 'Butter Pastry', file: 'pastry.webp', category: 'snacks', price: 3.50, desc: 'Light, layered delicate pastry filled with sweet cream and vanilla accents.', is_veg: true },
  { name: 'Personal Pizza', file: 'pizza.webp', category: 'snacks', price: 8.50, desc: 'Fired flatbread topped with rich marinara sauce, mozzarella cheese, and fresh basil.', is_veg: true },
  { name: 'Fresh Salad', file: 'salad.png', category: 'snacks', price: 5.50, desc: 'Healthy bowl of crisp mixed greens, cucumbers, cherry tomatoes, and olive oil dressing.', is_veg: true },
  { name: 'Club Sandwich', file: 'sandwich.png', category: 'snacks', price: 6.00, desc: 'Triple-decker toasted bread filled with fresh vegetables, cheese, and herb spread.', is_veg: true }
];

async function seed() {
  try {
    console.log("🧼 1. Clearing existing menu items and categories...");
    await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log("🌱 2. Seeding categories...");
    const { data: insertedCats, error: catError } = await supabase
      .from('categories')
      .insert(categoriesToInsert)
      .select();

    if (catError) throw catError;
    console.log(`✅ Seeded ${insertedCats.length} categories successfully.`);

    // Build category mapping: name -> id
    const catMap = {};
    insertedCats.forEach(c => {
      catMap[c.name] = c.id;
    });

    console.log("🍔 3. Preparing 42 premium menu items...");
    const menuItemsToInsert = items.map(item => {
      const categoryId = catMap[item.category];
      if (!categoryId) {
        throw new Error(`Category matching "${item.category}" not found in mapping!`);
      }
      return {
        category_id: categoryId,
        name: item.name,
        description: item.desc,
        price: item.price,
        image_url: `/images/${item.file}`,
        is_available: true,
        is_veg: item.is_veg,
        is_featured: Math.random() > 0.8 // 20% random featured items
      };
    });

    console.log("🚀 4. Seeding menu items to database...");
    const { data: insertedItems, error: itemsError } = await supabase
      .from('menu_items')
      .insert(menuItemsToInsert)
      .select();

    if (itemsError) throw itemsError;
    console.log(`🎉 Success! Seeded ${insertedItems.length} menu items successfully! Database is fully loaded.`);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seed();
