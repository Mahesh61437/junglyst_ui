import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '../components/ProductCard';
import { ProductService } from '../services/ProductService';
import { Search, X, Filter, Leaf } from 'lucide-react';

export default function Shop() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('Featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  const [categories, setCategories] = useState({
    'Aquatic Plants': false,
    'Hardscape': false,
    'Substrate': false,
    'Terrarium Plants': false,
    'Equipment': false,
    'Indoor Plants': false
  });
  
  const [difficulties, setDifficulties] = useState({
    'Easy': false,
    'Medium': false,
    'Advanced': false
  });

  const [page, setPage] = useState(1);
  
  // Use TanStack Query for caching and speed
  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', page],
    queryFn: async () => {
      const res = await ProductService.getProducts({ page });
      return res;
    }
  });

  const products = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / 20);

  useEffect(() => {
    if (category) {
      setCategories(prev => ({
        ...Object.keys(prev).reduce((acc, k) => ({ ...acc, [k]: false }), {}),
        [category]: true
      }));
    }
  }, [category]);

  const handleCategoryChange = (cat) => {
    setCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    setPage(1); // Reset to first page on filter change
  };

  const handleDifficultyChange = (diff) => {
    setDifficulties(prev => ({ ...prev, [diff]: !prev[diff] }));
    setPage(1);
  };

  const clearAllFilters = () => {
    setCategories(Object.keys(categories).reduce((acc, k) => ({ ...acc, [k]: false }), {}));
    setDifficulties(Object.keys(difficulties).reduce((acc, k) => ({ ...acc, [k]: false }), {}));
    setSearchTerm('');
    setPage(1);
    if (category) navigate('/shop');
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesName = (product.name || product.title || '').toLowerCase().includes(query);
        if (!matchesName) return false;
      }
      const activeCats = Object.keys(categories).filter(cat => categories[cat]);
      if (activeCats.length > 0 && !activeCats.includes(product.category)) return false;
      const activeDiffs = Object.keys(difficulties).filter(k => difficulties[k]);
      if (activeDiffs.length > 0 && (!product.care_level || !activeDiffs.includes(product.care_level))) return false;
      return true;
    });
  }, [products, categories, difficulties, searchTerm]);

  const displayedProducts = useMemo(() => {
    let sorted = [...filteredProducts];
    if (sortBy === 'Price: Low to High') sorted.sort((a, b) => a.price - b.price);
    else if (sortBy === 'Price: High to Low') sorted.sort((a, b) => b.price - a.price);
    else sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return sorted;
  }, [filteredProducts, sortBy]);

  const hasActiveFilters = Object.values(categories).some(v => v) || Object.values(difficulties).some(v => v) || searchTerm;

  const FilterContent = () => (
    <div style={{ padding: '1rem' }}>
      {hasActiveFilters && (
        <button onClick={clearAllFilters} style={{ width: '100%', padding: '0.75rem', marginBottom: '2rem', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <X size={14} /> Reset Collections
        </button>
      )}
      <div style={{ marginBottom: '3.5rem' }}>
        <h4 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E5C48B', marginBottom: '1.5rem' }}>Specimen Categories</h4>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', listStyle: 'none', padding: 0 }}>
          {Object.keys(categories).map(cat => (
            <li key={cat} onClick={() => handleCategoryChange(cat)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', color: categories[cat] ? '#0A3029' : '#6b7280', fontWeight: categories[cat] ? 700 : 400 }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '1.5px solid', borderColor: categories[cat] ? '#10b981' : '#e2e8f0', backgroundColor: categories[cat] ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {categories[cat] && <div style={{ width: '6px', height: '6px', backgroundColor: 'white', borderRadius: '50%' }} />}
              </div>
              <span style={{ fontSize: '0.9rem' }}>{cat === 'Aquatic Plants' ? 'Plants' : cat}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '4rem 1rem', minHeight: '80vh', fontFamily: 'Inter, sans-serif' }}>
      
      <div style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', fontFamily: 'serif' }}>The Collection</h1>
            <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>Discover {totalCount} high-fidelity specimens</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', flexGrow: 1, justifyContent: 'flex-end', maxWidth: '600px' }}>
            <div style={{ position: 'relative', flexGrow: 1, maxWidth: '350px' }}>
              <input 
                type="text" placeholder="Find a specimen..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '100px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', backgroundColor: 'white' }}
              />
              <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4rem' }}>
        <aside style={{ width: '260px', flexShrink: 0, position: 'sticky', top: '8rem', height: 'fit-content', display: window.innerWidth > 1024 ? 'block' : 'none' }}>
          <FilterContent />
        </aside>

        <div style={{ flexGrow: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
             <p style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 700 }}>Analysis: {totalCount} total results</p>
             <select 
               value={sortBy} onChange={(e) => setSortBy(e.target.value)} 
               style={{ padding: '0.6rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '100px', fontSize: '0.8rem', backgroundColor: 'white', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
             >
               <option>Featured</option>
               <option>Price: Low to High</option>
               <option>Price: High to Low</option>
             </select>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '8rem 0' }}>Assembling catalog...</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
                {displayedProducts.map(product => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
              
              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '6rem' }}>
                  <button 
                    disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    style={{ padding: '0.75rem 1.5rem', borderRadius: '100px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '0.8rem', fontWeight: 700, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
                  >
                    Previous
                  </button>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[...Array(totalPages)].map((_, i) => (
                      <button 
                        key={i} onClick={() => setPage(i + 1)}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: page === i + 1 ? '#0A3029' : 'transparent', color: page === i + 1 ? 'white' : '#64748b', fontWeight: 700, cursor: 'pointer' }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button 
                    disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                    style={{ padding: '0.75rem 1.5rem', borderRadius: '100px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '0.8rem', fontWeight: 700, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
                  >
                    Next
                  </button>
                </div>
              )}

              {displayedProducts.length === 0 && (
                <div style={{ padding: '8rem 0', textAlign: 'center', backgroundColor: '#fcfdfc', borderRadius: '32px', border: '1px dashed #e2e8f0' }}>
                  <Leaf size={48} style={{ color: '#e2e8f0', marginBottom: '1.5rem' }} />
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No specimens found</h3>
                  <button onClick={clearAllFilters} style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 800, textDecoration: 'underline', cursor: 'pointer' }}>Clear all filters</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
