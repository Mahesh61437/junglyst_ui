import MockAdapter from 'axios-mock-adapter';

// Local Botanical Assets
import img1 from '../assets/botanical/img1.jpg';
import img2 from '../assets/botanical/img2.jpg';
import img3 from '../assets/botanical/img3.jpg';
import img4 from '../assets/botanical/img4.jpg';
import img5 from '../assets/botanical/img5.jpg';

// Local Storage Keys
const KEYS = {
  PRODUCTS: 'junglyst_mock_products_v7_pro_final',
  ORDERS: 'junglyst_mock_orders_v7_pro_final',
  REVIEWS: 'junglyst_mock_reviews_v7_pro_final',
  CART: 'junglyst_mock_cart_v7_pro_final',
  ONBOARDING_STATUS: 'junglyst_mock_onboarding_status_v7'
};

// Verified High-Fidelity Botanical Assets
const ASSETS = {
  MASTERPIECE: img1,
  SANCTUARY: img2,
  TERRARIUM: img3,
  ZEN_JAR: img4,
  BIOTOPE: img5,
  ANUBIAS: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&q=80&w=800',
  BUCE: 'https://images.unsplash.com/photo-1512428813833-df5d2a90f3b3?auto=format&fit=crop&q=80&w=800',
  FERN: 'https://images.unsplash.com/photo-1506450654316-f306ae0bc989?auto=format&fit=crop&q=80&w=800',
  ROTALA: 'https://images.unsplash.com/photo-1516567727245-ad8c68f3ec1c?auto=format&fit=crop&q=80&w=800',
  DRAGON: 'https://images.unsplash.com/photo-1590422285510-d01768652304?auto=format&fit=crop&q=80&w=800',
  SEIRYU: 'https://images.unsplash.com/photo-1588725121405-b16df8ca3666?auto=format&fit=crop&q=80&w=800'
};

const SEED_PRODUCTS = [
  { id: 101, title: 'Masterpiece Coral Specimen', price: 2499, weight: 500, stock: 5, image_url: ASSETS.MASTERPIECE, care_level: 'Advanced', category: 'Marine Specimens', status: 'Active', seller: { name: 'Aquatic Exotica' } },
  { id: 102, title: 'Botanical Nano Sanctuary', price: 8500, weight: 2000, stock: 2, image_url: ASSETS.SANCTUARY, care_level: 'Medium', category: 'Terrarium Plants', status: 'Active', seller: { name: 'Botanical Sanctuary' } },
  { id: 103, title: 'Zen Jar Biosphere', price: 1250, weight: 800, stock: 10, image_url: ASSETS.ZEN_JAR, care_level: 'Easy', category: 'Terrarium Plants', status: 'Active', seller: { name: 'Aquatic Exotica' } },
  { id: 104, title: 'The Amazonian Biotope', price: 15000, weight: 10000, stock: 1, image_url: ASSETS.BIOTOPE, care_level: 'Advanced', category: 'Aquatic Plants', status: 'Active', seller: { name: 'Aquatic Exotica' } },
  { id: 105, title: 'Minimalist Fern Studio', price: 1800, weight: 1200, stock: 5, image_url: ASSETS.TERRARIUM, care_level: 'Easy', category: 'Terrarium Plants', status: 'Active', seller: { name: 'Botanical Sanctuary' } },
  { 
    id: 34, 
    title: 'Bucephalandra Helena 2014 (3 Rhizomes)', 
    price: 400.00, 
    compare_at_price: 900.00,
    stock: 0, 
    image_url: "https://firebasestorage.googleapis.com/v0/b/aqua-india-61437.firebasestorage.app/o/Helena2014%2Fhelena2014.jpeg?alt=media&token=168c0e0b-1949-45b1-b8c5-9545674e7687", 
    care_level: 'Advanced', 
    category: 'Aquatic Plants', 
    status: 'Out of Stock', 
    is_trending: true,
    seller: { name: 'Aquatic Exotica' } 
  },
  { 
    id: 58, 
    title: 'Bucephalandra "Dark Catherine" (Rare, 3 Rhizomes)', 
    price: 450.00, 
    compare_at_price: 900.00,
    stock: 0, 
    image_url: "https://firebasestorage.googleapis.com/v0/b/aqua-india-61437.firebasestorage.app/o/DarkCatherine%2Fdarkcatherine001.jpg?alt=media&token=dce5923f-90ac-46d0-ac28-7923fbf196ad", 
    care_level: 'Medium', 
    category: 'Aquatic Plants', 
    status: 'Out of Stock', 
    is_trending: true,
    seller: { name: 'Aquatic Exotica' } 
  },
  { 
    id: 33, 
    title: 'Bucephalandra Galileo (Rare, 3 Rhizomes)', 
    price: 450.00, 
    compare_at_price: 999.00,
    stock: 0, 
    image_url: "https://firebasestorage.googleapis.com/v0/b/aqua-india-61437.firebasestorage.app/o/Galileo%2Fgalileo1.jpeg?alt=media&token=e7846f1f-adad-42b5-bd13-9cfa9540d297", 
    care_level: 'Medium', 
    category: 'Aquatic Plants', 
    status: 'Out of Stock', 
    is_trending: true,
    seller: { name: 'Aquatic Exotica' } 
  },
  { 
    id: 12, 
    title: 'Bucephalandra Pygmea (3 Rhizomes)', 
    price: 350.00, 
    compare_at_price: 900.00,
    stock: 1, 
    image_url: "https://firebasestorage.googleapis.com/v0/b/aqua-india-61437.firebasestorage.app/o/pygmea%2Fpygmea01.jpeg?alt=media&token=2906af07-bdce-4df8-b044-a47c90dd51b0", 
    care_level: 'Easy', 
    category: 'Aquatic Plants', 
    status: 'In Stock', 
    seller: { name: 'Aquatic Exotica' } 
  },
  { 
    id: 36, 
    title: 'String of Frogs', 
    price: 700.00, 
    compare_at_price: 2000.00,
    stock: 0, 
    image_url: "https://firebasestorage.googleapis.com/v0/b/aqua-india-61437.firebasestorage.app/o/StringOfFrogs%2FStringofFrogs.jpeg?alt=media&token=cd14c230-6457-4861-8da5-7a9b4735e377", 
    care_level: 'Easy', 
    category: 'Terrarium Plants', 
    status: 'Out of Stock', 
    is_trending: true,
    seller: { name: 'Botanical Sanctuary' } 
  },
  { 
    id: 35, 
    title: 'Bucephalandra Red Chilli ( 3 Rhizomes)', 
    price: 400.00, 
    compare_at_price: 1200.00,
    stock: 0, 
    image_url: "https://firebasestorage.googleapis.com/v0/b/aqua-india-61437.firebasestorage.app/o/RedChilli%2Fredchilli1.jpeg?alt=media&token=ad024d88-eaa9-4b43-ad15-7ac8fc9c8c11", 
    care_level: 'Medium', 
    category: 'Aquatic Plants', 
    status: 'Out of Stock', 
    is_trending: true,
    seller: { name: 'Aquatic Exotica' } 
  },
  { 
    id: 59, 
    title: 'Bucephalandra "Blue Curly" (Super rare, 1 Rhizome)', 
    price: 500.00, 
    compare_at_price: 700.00,
    stock: 3, 
    image_url: "https://firebasestorage.googleapis.com/v0/b/aqua-india-61437.firebasestorage.app/o/BlueCurly%2Fbluecurly001.jpg?alt=media&token=f9cce0e1-294c-4e6e-bb0c-3d4922ff5c0a", 
    care_level: 'Medium', 
    category: 'Aquatic Plants', 
    status: 'In Stock', 
    is_trending: true,
    seller: { name: 'Aquatic Exotica' } 
  },
  { 
    id: 68, 
    title: 'Bucephalandra "Neo" (1 Rhizome)', 
    price: 450.00, 
    compare_at_price: 900.00,
    stock: 5, 
    image_url: "https://firebasestorage.googleapis.com/v0/b/aqua-india-61437.firebasestorage.app/o/Bucephalandra%2FNeo%2Fneo.jpg?alt=media&token=0f0cb4a3-4ce8-4eb8-9f71-85193e7f9ff0", 
    care_level: 'Advanced', 
    category: 'Premium', 
    status: 'In Stock', 
    is_trending: true,
    seller: { name: 'Aquatic Exotica' } 
  },
  { 
    id: 69, 
    title: 'Bucephalandra "Mukok" (1 Rhizome)', 
    price: 450.00, 
    compare_at_price: 900.00,
    stock: 5, 
    image_url: "https://firebasestorage.googleapis.com/v0/b/aqua-india-61437.firebasestorage.app/o/Bucephalandra%2FMukok%2Fmukok.jpg?alt=media&token=f695397d-e744-407c-8d4c-ca234b523696", 
    care_level: 'Advanced', 
    category: 'Premium', 
    status: 'In Stock', 
    is_trending: true,
    seller: { name: 'Aquatic Exotica' } 
  },
  { 
    id: 67, 
    title: 'Bucephalandra "Red Theia" (1 Rhizome)', 
    price: 450.00, 
    compare_at_price: 900.00,
    stock: 5, 
    image_url: "https://firebasestorage.googleapis.com/v0/b/aqua-india-61437.firebasestorage.app/o/Bucephalandra%2FRedThiea%2Fredthiea02.jpg?alt=media&token=5870a75e-ae57-47ca-bcc6-531210169c21", 
    care_level: 'Advanced', 
    category: 'Premium', 
    status: 'In Stock', 
    is_trending: true,
    seller: { name: 'Aquatic Exotica' } 
  },
  { 
    id: 70, 
    title: 'Bucephalandra "Moonlight" (1 Rhizome)', 
    price: 450.00, 
    compare_at_price: 900.00,
    stock: 5, 
    image_url: "https://firebasestorage.googleapis.com/v0/b/aqua-india-61437.firebasestorage.app/o/Bucephalandra%2FMoonlight%2Fmoonlight.jpg?alt=media&token=adc4184b-6122-457b-9d05-7c857bc90f74", 
    care_level: 'Advanced', 
    category: 'Premium', 
    status: 'In Stock', 
    is_trending: true,
    seller: { name: 'Aquatic Exotica' } 
  },
  { 
    id: 72, 
    title: 'Bucephalandra "Jade" (1 Rhizome)', 
    price: 450.00, 
    compare_at_price: 900.00,
    stock: 5, 
    image_url: "https://firebasestorage.googleapis.com/v0/b/aqua-india-61437.firebasestorage.app/o/Bucephalandra%2FJade%2Fjade.jpg?alt=media&token=4b36b005-851b-4b1e-93cd-028d271c23b4", 
    care_level: 'Advanced', 
    category: 'Premium', 
    status: 'In Stock', 
    is_trending: true,
    seller: { name: 'Aquatic Exotica' } 
  }
];

const SEED_ORDERS = [
  { id: '#ORD-9932', customer: 'Sarah Jenkins', date: 'Oct 24, 2026', total: '₹1450', status: 'Pending', items: 3 },
  { id: '#ORD-9931', customer: 'Michael Chen', date: 'Oct 24, 2026', total: '₹890', status: 'Processing', items: 1 },
  { id: '#ORD-9930', customer: 'Priya Sharma', date: 'Oct 23, 2026', total: '₹2200', status: 'Completed', items: 2 },
];

const SEED_REVIEWS = [
  { id: 1, productId: 2, author: "Rahul M.", date: "Oct 12, 2026", plants: 5, packaging: 5, responsiveness: 5, comment: "Absolutely pristine condition upon arrival." }
];

const safeParse = (data) => { if (!data) return null; if (typeof data === 'object') return data; try { return JSON.parse(data); } catch (e) { return null; } };
const loadData = (key, seed) => { try { const data = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null; if (data) return JSON.parse(data); if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(seed)); return seed; } catch (e) { return seed; } };
const saveData = (key, data) => { try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(data)); } catch (e) {} };

export function setupMockApi(api) {
  const mock = new MockAdapter(api, { delayResponse: 400 });

  let mockProducts = loadData(KEYS.PRODUCTS, SEED_PRODUCTS);
  let mockOrders = loadData(KEYS.ORDERS, SEED_ORDERS);
  let mockReviews = loadData(KEYS.REVIEWS, SEED_REVIEWS);
  let mockCart = loadData(KEYS.CART, { id: 1, items: [], total_items: 0, total_price: 0 });
  let onboardingStatus = loadData(KEYS.ONBOARDING_STATUS, { completed: true, data: { storeName: 'Aquatic Exotica', tagline: 'Rare Western Ghats Plants' } });

  // Onboarding
  mock.onGet('/onboarding/status/').reply(200, onboardingStatus);
  mock.onPost('/onboarding/complete/').reply((config) => {
    const data = safeParse(config.data);
    onboardingStatus = { completed: true, data };
    saveData(KEYS.ONBOARDING_STATUS, onboardingStatus);
    return [200, onboardingStatus];
  });

  // Products CRUD
  mock.onGet('/products/').reply(() => [200, { results: mockProducts, count: mockProducts.length }]);
  mock.onGet(/\/products\/\d+\//).reply((config) => {
    const id = parseInt(config.url.split('/').filter(s => s !== '').pop(), 10);
    const product = mockProducts.find((p) => p.id === id);
    return product ? [200, product] : [404, { message: 'Specimen not found' }];
  });

  mock.onPost('/products/').reply((config) => {
    const data = safeParse(config.data);
    const newProduct = { ...data, id: Date.now(), sales: 0, rating: 4.5, reviewsCount: 0, stock: data.stock || 10, status: 'Active' };
    mockProducts.unshift(newProduct);
    saveData(KEYS.PRODUCTS, mockProducts);
    return [201, newProduct];
  });

  mock.onPut(/\/products\/\d+\//).reply((config) => {
    const id = parseInt(config.url.split('/').filter(s => s !== '').pop(), 10);
    const data = safeParse(config.data);
    const index = mockProducts.findIndex(p => p.id === id);
    if (index !== -1) {
      mockProducts[index] = { ...mockProducts[index], ...data };
      saveData(KEYS.PRODUCTS, mockProducts);
      return [200, mockProducts[index]];
    }
    return [404, { message: 'Specimen not found' }];
  });

  mock.onPatch(/\/products\/\d+\//).reply((config) => {
    const id = parseInt(config.url.split('/').filter(s => s !== '').pop(), 10);
    const data = safeParse(config.data);
    const index = mockProducts.findIndex(p => p.id === id);
    if (index !== -1) {
      mockProducts[index] = { ...mockProducts[index], ...data };
      saveData(KEYS.PRODUCTS, mockProducts);
      return [200, mockProducts[index]];
    }
    return [404, { message: 'Specimen not found' }];
  });

  mock.onDelete(/\/products\/\d+\//).reply((config) => {
    const id = parseInt(config.url.split('/').filter(s => s !== '').pop(), 10);
    mockProducts = mockProducts.filter(p => p.id !== id);
    saveData(KEYS.PRODUCTS, mockProducts);
    return [200, { success: true }];
  });

  // Cart
  mock.onGet('/cart/').reply(200, mockCart);
  mock.onPost('/cart/').reply((config) => {
    const { productId, quantity } = safeParse(config.data);
    const product = mockProducts.find((p) => p.id === productId);
    const existingItem = mockCart.items.find((item) => item.product.id === productId);
    if (existingItem) { existingItem.quantity += quantity; } else { mockCart.items.push({ id: Date.now(), product, quantity, total_price: quantity * product.price }); }
    mockCart.total_items = mockCart.items.reduce((sum, item) => sum + item.quantity, 0);
    mockCart.total_price = mockCart.items.reduce((sum, item) => sum + item.total_price, 0);
    saveData(KEYS.CART, mockCart);
    return [200, mockCart];
  });

  // Orders
  mock.onGet('/orders/').reply(200, { results: mockOrders });
  mock.onPatch(/\/orders\/\d+\//).reply((config) => {
    const id = config.url.split('/').filter(s => s !== '').pop();
    const { status } = safeParse(config.data);
    const index = mockOrders.findIndex(o => o.id === id);
    if (index !== -1) {
      mockOrders[index].status = status;
      saveData(KEYS.ORDERS, mockOrders);
      return [200, mockOrders[index]];
    }
    return [404];
  });

  mock.onGet(/\/reviews/).reply(() => [200, { results: mockReviews }]);

  return mock;
}
