import { useState, useEffect } from 'react';
import './VendingScreen.css';
import { ArrowLeft, TrendingUp, Package, Zap, AlertTriangle, RefreshCw, ShoppingCart, Activity, Cpu, Thermometer } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  emoji: string;
  price: number;
  stock: number;
  maxStock: number;
  sold: number;
  category: string;
  color: string;
  trend: number;
}

interface VendingScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Cola Zero', emoji: '🥤', price: 1.50, stock: 8, maxStock: 12, sold: 47, category: 'Drinks', color: '#ef4444', trend: 12 },
  { id: 'p2', name: 'Sparkling Water', emoji: '💧', price: 1.20, stock: 3, maxStock: 12, sold: 29, category: 'Drinks', color: '#3b82f6', trend: 5 },
  { id: 'p3', name: 'Energy Boost', emoji: '⚡', price: 2.50, stock: 11, maxStock: 12, sold: 63, category: 'Drinks', color: '#f59e0b', trend: 28 },
  { id: 'p4', name: 'Protein Bar', emoji: '🍫', price: 2.00, stock: 5, maxStock: 10, sold: 34, category: 'Snacks', color: '#8b5cf6', trend: -3 },
  { id: 'p5', name: 'Salted Chips', emoji: '🥨', price: 1.80, stock: 1, maxStock: 10, sold: 55, category: 'Snacks', color: '#f97316', trend: 18 },
  { id: 'p6', name: 'Mixed Nuts', emoji: '🥜', price: 2.20, stock: 9, maxStock: 10, sold: 21, category: 'Snacks', color: '#10b981', trend: 7 },
  { id: 'p7', name: 'Matcha Latte', emoji: '🍵', price: 3.00, stock: 4, maxStock: 8, sold: 18, category: 'Drinks', color: '#22c55e', trend: 42 },
  { id: 'p8', name: 'Gummy Bears', emoji: '🐻', price: 1.50, stock: 0, maxStock: 10, sold: 72, category: 'Snacks', color: '#ec4899', trend: -8 },
];

function MiniBarChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="mini-chart">
      {data.map((v, i) => (
        <div key={i} className="mini-bar" style={{ height: `${(v / max) * 100}%` }}></div>
      ))}
    </div>
  );
}

export default function VendingScreen({ onBack, onLogout }: VendingScreenProps) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(384.50);
  const [totalSales, setTotalSales] = useState(339);
  const [uptime, setUptime] = useState(99.7);
  const [temp, setTemp] = useState(4.2);
  const [dispensing, setDispensing] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>(['[09:12] System boot complete', '[09:13] Inventory sync OK', '[09:41] Sale: Cola Zero x1']);
  const [, setTick] = useState(0);

  // Simulate live data flicker every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setTemp(prev => parseFloat((prev + (Math.random() - 0.5) * 0.3).toFixed(1)));
      setUptime(prev => Math.min(100, parseFloat((prev + 0.01).toFixed(2))));
      setTick(t => t + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDispense = (product: Product) => {
    if (product.stock === 0 || dispensing) return;
    setDispensing(product.id);
    setTimeout(() => {
      setProducts(prev => prev.map(p =>
        p.id === product.id ? { ...p, stock: p.stock - 1, sold: p.sold + 1 } : p
      ));
      setTotalRevenue(prev => parseFloat((prev + product.price).toFixed(2)));
      setTotalSales(prev => prev + 1);
      setLog(prev => [`[NOW] Dispensed: ${product.name} — $${product.price.toFixed(2)}`, ...prev.slice(0, 9)]);
      setDispensing(null);
    }, 1200);
  };

  const handleRestock = (productId: string) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, stock: p.maxStock } : p
    ));
    const p = products.find(x => x.id === productId);
    if (p) setLog(prev => [`[NOW] Restocked: ${p.name} to ${p.maxStock}`, ...prev.slice(0, 9)]);
  };

  const lowStock = products.filter(p => p.stock <= 2);
  const totalItems = products.reduce((a, p) => a + p.stock, 0);
  const weekSales = [42, 55, 37, 68, 72, 58, totalSales % 80 + 10];

  return (
    <div className="vending-container">
      {/* Sidebar */}
      <aside className="vending-sidebar">
        <div className="vending-sidebar-header">
          <div className="vending-logo">
            <span className="vending-logo-icon">🏪</span>
            <div>
              <div className="vending-logo-title">SmartVend</div>
              <div className="vending-logo-sub">Agent v2.4</div>
            </div>
          </div>
        </div>

        <div className="vending-status-card">
          <div className="status-row"><Cpu size={14} /><span>Machine Status</span><span className="badge-online">ONLINE</span></div>
          <div className="status-row"><Thermometer size={14} /><span>Temperature</span><span className="badge-temp">{temp}°C</span></div>
          <div className="status-row"><Activity size={14} /><span>Uptime</span><span className="badge-uptime">{uptime}%</span></div>
          <div className="status-row"><Zap size={14} /><span>Power Draw</span><span className="badge-power">142W</span></div>
        </div>

        {lowStock.length > 0 && (
          <div className="alert-panel">
            <div className="alert-title"><AlertTriangle size={13} /> Low Stock Alerts</div>
            {lowStock.map(p => (
              <div key={p.id} className="alert-row">
                <span>{p.emoji} {p.name}</span>
                <button className="restock-btn" onClick={() => handleRestock(p.id)}><RefreshCw size={11} /> Restock</button>
              </div>
            ))}
          </div>
        )}

        <div className="vending-log">
          <div className="log-title"><Activity size={12} /> Live Log</div>
          {log.map((entry, i) => (
            <div key={i} className="log-entry" style={{ opacity: 1 - i * 0.1 }}>{entry}</div>
          ))}
        </div>

        <div className="vending-sidebar-footer">
          <button className="sidebar-nav-btn" onClick={onBack}><ArrowLeft size={14} /> Back to Studio</button>
          <button className="sidebar-nav-btn danger" onClick={onLogout}>Log Out</button>
        </div>
      </aside>

      {/* Main */}
      <main className="vending-main">
        <div className="vending-topbar">
          <div>
            <h1>Inventory Dashboard</h1>
            <p>Real-time smart vending analytics — <span className="live-dot-label"><span className="live-dot"></span>LIVE</span></p>
          </div>
          <div className="topbar-kpis">
            <div className="kpi-chip"><TrendingUp size={14} /><span>${totalRevenue.toFixed(2)}</span><label>Revenue</label></div>
            <div className="kpi-chip"><ShoppingCart size={14} /><span>{totalSales}</span><label>Total Sales</label></div>
            <div className="kpi-chip"><Package size={14} /><span>{totalItems}</span><label>Items Left</label></div>
          </div>
        </div>

        {/* Weekly chart */}
        <div className="weekly-chart-card">
          <div className="card-header"><TrendingUp size={15} /> Weekly Sales Volume</div>
          <div className="weekly-bars">
            {['M','T','W','T','F','S','Today'].map((day, i) => (
              <div key={i} className="weekly-col">
                <div className="weekly-bar-wrap">
                  <div className="weekly-bar" style={{ height: `${(weekSales[i] / 80) * 100}%`, background: i === 6 ? '#f59e0b' : 'rgba(21,94,239,0.7)' }}></div>
                </div>
                <span className="weekly-label">{day}</span>
                <span className="weekly-val">{weekSales[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="products-grid">
          {products.map(product => {
            const stockPct = (product.stock / product.maxStock) * 100;
            const isLow = product.stock <= 2;
            const isEmpty = product.stock === 0;
            const isDispensing = dispensing === product.id;
            return (
              <div
                key={product.id}
                className={`product-card ${isLow ? 'low-stock' : ''} ${isEmpty ? 'empty-stock' : ''} ${selectedProduct?.id === product.id ? 'selected' : ''}`}
                onClick={() => setSelectedProduct(selectedProduct?.id === product.id ? null : product)}
                style={{ '--accent': product.color } as React.CSSProperties}
              >
                <div className="product-emoji">{product.emoji}</div>
                <div className="product-info">
                  <div className="product-name">{product.name}</div>
                  <div className="product-category">{product.category}</div>
                  <div className="product-price">${product.price.toFixed(2)}</div>
                </div>
                <div className="product-stats">
                  <div className="stock-bar-wrap">
                    <div className="stock-bar" style={{ width: `${stockPct}%`, background: isLow ? '#ef4444' : product.color }}></div>
                  </div>
                  <div className="stock-numbers">
                    <span className={isEmpty ? 'stock-empty' : isLow ? 'stock-low' : ''}>{product.stock}/{product.maxStock}</span>
                    <span className={`trend ${product.trend >= 0 ? 'up' : 'down'}`}>{product.trend >= 0 ? '▲' : '▼'} {Math.abs(product.trend)}%</span>
                  </div>
                  <MiniBarChart data={[product.sold * 0.4, product.sold * 0.6, product.sold * 0.5, product.sold * 0.8, product.sold * 0.7, product.sold * 0.9, product.sold].map(Math.round)} />
                </div>
                <div className="product-actions">
                  <button
                    className={`dispense-btn ${isEmpty ? 'disabled' : ''} ${isDispensing ? 'dispensing' : ''}`}
                    onClick={e => { e.stopPropagation(); handleDispense(product); }}
                    disabled={isEmpty || !!dispensing}
                  >
                    {isDispensing ? '⚙ Dispensing...' : isEmpty ? 'Out of Stock' : '⬇ Dispense'}
                  </button>
                  {isLow && !isEmpty && (
                    <button className="restock-mini" onClick={e => { e.stopPropagation(); handleRestock(product.id); }}><RefreshCw size={11} /></button>
                  )}
                </div>
                <div className="sold-tag">{product.sold} sold</div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}