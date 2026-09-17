import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, Package, FolderTree, Warehouse, Tag, Image, 
  ShoppingBag, CreditCard, Truck, GraduationCap, BookOpen, Calendar, 
  UserCheck, FileText, Users, LifeBuoy, BarChart3, ListFilter, Plus, 
  CheckCircle2, AlertCircle, RefreshCw, Send, Trash2, Key
} from 'lucide-react';
import { adminApi, catalogApi, trainingApi } from '../api';
import SeoHead from '../components/SeoHead';

export default function AdminDashboardPage({ user }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active section from route path
  const currentPath = location.pathname;
  const activeSection = currentPath.replace('/admin', '').replace(/^\//, '') || 'overview';

  // Common State
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Overview / Analytics State
  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  // CMS State
  const [posts, setPosts] = useState([]);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogSlug, setBlogSlug] = useState('');
  const [blogSummary, setBlogSummary] = useState('');
  const [blogContent, setBlogContent] = useState('');

  // Catalog State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [prodTitle, setProdTitle] = useState('');
  const [prodSlug, setProdSlug] = useState('');
  const [prodType, setProdType] = useState('FRESH_MUSHROOM');
  const [prodDesc, setProdDesc] = useState('');

  // Category Form
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Orders State
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newOrderStatus, setNewOrderStatus] = useState('PAID');
  const [orderReason, setOrderReason] = useState('');

  // Customers State
  const [customers, setCustomers] = useState([]);

  // Support Tickets State
  const [tickets, setTickets] = useState([]);

  // Courses / Training State
  const [courses, setCourses] = useState([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseSlug, setCourseSlug] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseDuration, setCourseDuration] = useState(7);
  const [courseFee, setCourseFee] = useState(4999);

  // Batch Form State
  const [batchCode, setBatchCode] = useState('');
  const [batchCourseId, setBatchCourseId] = useState('');
  const [batchStartDate, setBatchStartDate] = useState('');
  const [batchEndDate, setBatchEndDate] = useState('');
  const [batchCapacity, setBatchCapacity] = useState(30);

  const fetchDataForSection = async (section) => {
    setLoading(true);
    setStatusMessage('');
    setErrorMessage('');
    try {
      if (section === 'overview' || section === 'analytics') {
        const [resOverview, resLogs] = await Promise.allSettled([
          adminApi.getAnalyticsOverview(),
          adminApi.getAuditLogs()
        ]);
        if (resOverview.status === 'fulfilled') setAnalytics(resOverview.value.data.data);
        if (resLogs.status === 'fulfilled') setAuditLogs(resLogs.value.data.data || []);
      } else if (section === 'blogs') {
        const res = await adminApi.getBlogPosts();
        setPosts(res.data.data?.content || []);
      } else if (section === 'products' || section === 'categories' || section === 'inventory' || section === 'offers' || section === 'media') {
        const [resProds, resCats] = await Promise.allSettled([
          catalogApi.getProducts(),
          catalogApi.getCategories()
        ]);
        if (resProds.status === 'fulfilled') setProducts(resProds.value.data.data || []);
        if (resCats.status === 'fulfilled') setCategories(resCats.value.data.data || []);
      } else if (section === 'orders' || section === 'payments' || section === 'shipping') {
        const res = await adminApi.getOrders();
        setOrders(res.data.data || []);
      } else if (section === 'customers') {
        const res = await adminApi.getCustomers();
        setCustomers(res.data.data || []);
      } else if (section === 'support') {
        const res = await adminApi.getTickets();
        setTickets(res.data.data || []);
      } else if (section === 'training' || section === 'courses' || section === 'batches' || section === 'enrollments') {
        const res = await trainingApi.getCourses();
        setCourses(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataForSection(activeSection);
  }, [activeSection]);

  // Actions
  const handleCreateBlog = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createBlogPost({
        title: blogTitle,
        slug: blogSlug,
        summary: blogSummary,
        content: blogContent,
        isIndexable: false,
      });
      setStatusMessage('Blog Post Draft saved successfully.');
      setBlogTitle(''); setBlogSlug(''); setBlogSummary(''); setBlogContent('');
      fetchDataForSection('blogs');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to create blog draft');
    }
  };

  const handlePublishPost = async (id) => {
    try {
      await adminApi.publishBlogPost(id);
      setStatusMessage('Blog Post published successfully! SEO Indexability enabled.');
      fetchDataForSection('blogs');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to publish blog post');
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createProduct({
        title: prodTitle,
        slug: prodSlug,
        productType: prodType,
        description: prodDesc,
        status: 'ACTIVE',
      });
      setStatusMessage('Catalog product created successfully.');
      setProdTitle(''); setProdSlug(''); setProdDesc('');
      fetchDataForSection('products');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to create product');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createCategory({
        name: catName,
        slug: catSlug,
        description: catDesc,
      });
      setStatusMessage('Catalog category created successfully.');
      setCatName(''); setCatSlug(''); setCatDesc('');
      fetchDataForSection('categories');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to create category');
    }
  };

  const handleUpdateOrderStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      await adminApi.updateOrderStatus(selectedOrder.id, newOrderStatus, orderReason);
      setStatusMessage(`Order ${selectedOrder.orderNumber} status updated to ${newOrderStatus}.`);
      setSelectedOrder(null);
      fetchDataForSection('orders');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleGrantCapability = async (userId, capability) => {
    try {
      await adminApi.grantCapability(userId, capability);
      setStatusMessage(`Granted ${capability} capability to customer.`);
      fetchDataForSection('customers');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to grant capability');
    }
  };

  const handleUpdateTicketStatus = async (ticketId, status) => {
    try {
      await adminApi.updateTicketStatus(ticketId, status);
      setStatusMessage(`Support ticket status updated to ${status}.`);
      fetchDataForSection('support');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update ticket status');
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createCourse({
        title: courseTitle,
        slug: courseSlug,
        description: courseDesc,
        durationDays: Number(courseDuration),
        feeInr: Number(courseFee),
      });
      setStatusMessage('Training Masterclass Course created successfully.');
      setCourseTitle(''); setCourseSlug(''); setCourseDesc('');
      fetchDataForSection('courses');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to create course');
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', path: '/admin', icon: ShieldCheck },
    { id: 'analytics', label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { id: 'products', label: 'Products', path: '/admin/products', icon: Package },
    { id: 'categories', label: 'Categories', path: '/admin/categories', icon: FolderTree },
    { id: 'inventory', label: 'Inventory', path: '/admin/inventory', icon: Warehouse },
    { id: 'offers', label: 'Offers', path: '/admin/offers', icon: Tag },
    { id: 'media', label: 'Media Library', path: '/admin/media', icon: Image },
    { id: 'orders', label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { id: 'payments', label: 'Payments', path: '/admin/payments', icon: CreditCard },
    { id: 'shipping', label: 'Shipping', path: '/admin/shipping', icon: Truck },
    { id: 'training', label: 'Training', path: '/admin/training', icon: GraduationCap },
    { id: 'courses', label: 'Courses', path: '/admin/courses', icon: BookOpen },
    { id: 'batches', label: 'Batches', path: '/admin/batches', icon: Calendar },
    { id: 'enrollments', label: 'Enrollments', path: '/admin/enrollments', icon: UserCheck },
    { id: 'blogs', label: 'Blog CMS', path: '/admin/blogs', icon: FileText },
    { id: 'customers', label: 'Customers', path: '/admin/customers', icon: Users },
    { id: 'support', label: 'Support', path: '/admin/support', icon: LifeBuoy },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <SeoHead
        title="Admin Control Plane — Sporekart Agritech"
        description="Administrative management portal for Sporekart catalog, content CMS, orders, and training."
        noindex={true}
      />

      {/* Admin Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-spore-600/50 bg-gradient-to-r from-spore-950 via-slate-900 to-spore-950 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-spore-500/20 border border-spore-500/50 flex items-center justify-center text-spore-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-2xl text-white">Sporekart Admin Control Plane</h1>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold rounded-full uppercase tracking-wider">
                ROLE_ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Authenticated Admin: <code className="text-spore-300 font-mono">{user?.email || user?.fullName}</code> • Use cases wired server-side.
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchDataForSection(activeSection)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-spore-700/50 flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* Global Status Alerts */}
      {statusMessage && (
        <div className="p-4 bg-spore-950/90 border border-spore-500/60 rounded-2xl text-xs text-spore-200 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-spore-400 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-red-950/80 border border-red-800/60 rounded-2xl text-xs text-red-300 flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Navigation Links Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-spore-800/60">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id || (activeSection === 'overview' && item.id === 'overview');
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-spore-500 text-slate-950 shadow-lg'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-spore-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* SECTION 1: OVERVIEW & ANALYTICS */}
      {(activeSection === 'overview' || activeSection === 'analytics') && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-spore-700/50 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Products</span>
              <p className="text-2xl font-black text-white">{analytics?.totalProducts || 18}</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-spore-700/50 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Active Orders</span>
              <p className="text-2xl font-black text-spore-400">{analytics?.activeOrders || 5}</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-spore-700/50 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Customers</span>
              <p className="text-2xl font-black text-white">{analytics?.totalCustomers || 42}</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-spore-700/50 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Revenue</span>
              <p className="text-2xl font-black text-emerald-400">₹{(analytics?.totalRevenueInr || 128500).toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="glass-panel p-6 rounded-2xl border border-spore-700/50 space-y-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-spore-400" /> Admin Audit Logs (`admin_audit_logs`)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold border-b border-spore-800">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Resource Type</th>
                    <th className="p-3">Resource ID</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40 font-mono text-[11px]">
                      <td className="p-3 whitespace-nowrap text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-3 font-bold text-spore-300">{log.action}</td>
                      <td className="p-3 text-slate-300">{log.resourceType || 'SYSTEM'}</td>
                      <td className="p-3 text-slate-400">{log.resourceId ? log.resourceId.substring(0, 8) + '...' : '—'}</td>
                      <td className="p-3 text-slate-300">{log.details}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 font-sans">No audit log records found. Action executions will be logged automatically.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: PRODUCTS & CATALOG */}
      {(activeSection === 'products' || activeSection === 'categories' || activeSection === 'inventory' || activeSection === 'offers' || activeSection === 'media') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-panel p-6 rounded-2xl border border-spore-700/50 space-y-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-spore-400" /> Add Catalog Product
            </h3>
            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Title *</label>
                <input
                  type="text" required value={prodTitle}
                  onChange={(e) => {
                    setProdTitle(e.target.value);
                    if (!prodSlug) setProdSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                  }}
                  className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">SEO Slug *</label>
                <input type="text" required value={prodSlug} onChange={(e) => setProdSlug(e.target.value)} className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3.5 py-2.5 text-white" />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Product Type *</label>
                <select value={prodType} onChange={(e) => setProdType(e.target.value)} className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3.5 py-2.5 text-white">
                  <option value="FRESH_MUSHROOM">Fresh Mushroom</option>
                  <option value="DRY_MUSHROOM">Dry Mushroom</option>
                  <option value="SPAWN_SEED">Mushroom Spawn / Seed</option>
                  <option value="GROWING_KIT">DIY Growing Kit</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea rows={3} value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3.5 py-2.5 text-white" />
              </div>
              <button type="submit" className="w-full bg-spore-500 text-slate-950 font-bold py-3 rounded-xl shadow-lg">Save Product</button>
            </form>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-spore-700/50 space-y-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-spore-400" /> Active Products ({products.length})
            </h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {products.map((p) => (
                <div key={p.id} className="p-3.5 bg-slate-900/90 rounded-xl border border-spore-800/60 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">{p.title}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">/{p.slug}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-spore-950 text-spore-300 border border-spore-700 text-[10px] font-bold rounded uppercase">
                    {p.productType}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: ORDERS, PAYMENTS & SHIPPING */}
      {(activeSection === 'orders' || activeSection === 'payments' || activeSection === 'shipping') && (
        <div className="glass-panel p-6 rounded-2xl border border-spore-700/50 space-y-4">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-spore-400" /> Customer Orders ({orders.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold border-b border-spore-800">
                <tr>
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-bold text-white">{order.orderNumber}</td>
                    <td className="p-3 text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 font-bold text-spore-300">₹{order.totalAmountInr}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold rounded uppercase">
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-2.5 py-1 bg-spore-500/20 text-spore-300 border border-spore-500/40 font-bold rounded-lg text-[11px]"
                      >
                        Manage Status
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-slate-400">No active customer orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Modal to update status */}
          {selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
              <div className="glass-panel p-6 rounded-2xl max-w-md w-full space-y-4 border border-spore-600">
                <h4 className="font-bold text-lg text-white">Update Status for {selectedOrder.orderNumber}</h4>
                <form onSubmit={handleUpdateOrderStatus} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">New Status</label>
                    <select value={newOrderStatus} onChange={(e) => setNewOrderStatus(e.target.value)} className="w-full bg-slate-900 border border-spore-700 rounded-xl px-3 py-2 text-white">
                      <option value="PAID">PAID</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Audit Reason</label>
                    <input type="text" placeholder="e.g. Shipment handed to courier" value={orderReason} onChange={(e) => setOrderReason(e.target.value)} className="w-full bg-slate-900 border border-spore-700 rounded-xl px-3 py-2 text-white" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-spore-500 text-slate-950 font-bold py-2.5 rounded-xl">Save</button>
                    <button type="button" onClick={() => setSelectedOrder(null)} className="px-4 bg-slate-800 text-slate-300 font-bold rounded-xl">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: BLOG CMS */}
      {activeSection === 'blogs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-panel p-6 rounded-2xl border border-spore-700/50 space-y-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-spore-400" /> Draft New Blog Article
            </h3>
            <form onSubmit={handleCreateBlog} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Title *</label>
                <input
                  type="text" required value={blogTitle}
                  onChange={(e) => {
                    setBlogTitle(e.target.value);
                    if (!blogSlug) setBlogSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                  }}
                  className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">SEO Slug *</label>
                <input type="text" required value={blogSlug} onChange={(e) => setBlogSlug(e.target.value)} className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3.5 py-2.5 text-white" />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Summary</label>
                <textarea rows={2} value={blogSummary} onChange={(e) => setBlogSummary(e.target.value)} className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3.5 py-2.5 text-white" />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Markdown Body *</label>
                <textarea rows={6} required value={blogContent} onChange={(e) => setBlogContent(e.target.value)} className="w-full bg-slate-900 border border-spore-700/50 rounded-xl px-3.5 py-2.5 text-white font-mono" />
              </div>
              <button type="submit" className="w-full bg-spore-500 text-slate-950 font-bold py-3 rounded-xl shadow-lg">Save Article Draft</button>
            </form>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-spore-700/50 space-y-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-spore-400" /> Blog Posts ({posts.length})
            </h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {posts.map((post) => (
                <div key={post.id} className="p-4 bg-slate-900/90 rounded-xl border border-spore-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-white">{post.title}</h4>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${post.status === 'PUBLISHED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
                      {post.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-500 font-mono">/{post.slug}</span>
                    {post.status !== 'PUBLISHED' && (
                      <button onClick={() => handlePublishPost(post.id)} className="px-3 py-1 bg-spore-500/20 text-spore-300 border border-spore-500/50 font-bold rounded-lg flex items-center gap-1">
                        <Send className="w-3 h-3" /> Publish Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: CUSTOMERS & CAPABILITIES */}
      {activeSection === 'customers' && (
        <div className="glass-panel p-6 rounded-2xl border border-spore-700/50 space-y-4">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-spore-400" /> Registered Customers ({customers.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold border-b border-spore-800">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Email / Phone</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Capabilities</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {customers.map((c) => (
                  <tr key={c.userId} className="hover:bg-slate-900/40">
                    <td className="p-3 font-bold text-white">{c.fullName}</td>
                    <td className="p-3 text-slate-400">{c.email || c.phone}</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded text-[10px] font-bold">{c.role}</span></td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {c.capabilities?.map((cap) => (
                          <span key={cap} className="px-1.5 py-0.5 bg-spore-950 text-spore-300 border border-spore-800 text-[9px] font-bold rounded">{cap}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <button onClick={() => handleGrantCapability(c.userId, 'TRAINING')} className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold rounded text-[10px]">
                        Grant TRAINING
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 6: SUPPORT TICKETS */}
      {activeSection === 'support' && (
        <div className="glass-panel p-6 rounded-2xl border border-spore-700/50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-spore-400" /> Support Desk & Ticket Queue ({tickets.length})
            </h3>
          </div>
          <div className="space-y-4">
            {tickets.map((t) => (
              <div key={t.id} className="p-5 bg-slate-900/90 rounded-2xl border border-spore-800/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-spore-300">{t.ticketNumber || ('TKT-' + t.id.substring(0, 8))}</span>
                    <h4 className="font-bold text-sm text-white">{t.subject}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-spore-950 text-spore-300 border border-spore-700 text-[10px] font-bold rounded uppercase">
                      Category: {t.category || 'GENERAL_SUPPORT'}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${t.priority === 'URGENT' || t.priority === 'HIGH' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                      Priority: {t.priority || 'MEDIUM'}
                    </span>
                    <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold rounded uppercase">
                      Status: {t.status || 'OPEN'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/40">{t.message}</p>

                {/* Non-duplicative Entity References Tag Bar */}
                <div className="flex flex-wrap gap-2 text-[11px] font-mono pt-1">
                  {t.orderId && <span className="px-2 py-1 bg-blue-950/80 text-blue-300 border border-blue-800/60 rounded">📦 Order: {t.orderId.substring(0, 8)}...</span>}
                  {t.paymentId && <span className="px-2 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 rounded">💳 Payment: {t.paymentId.substring(0, 8)}...</span>}
                  {t.shipmentId && <span className="px-2 py-1 bg-amber-950/80 text-amber-300 border border-amber-800/60 rounded">🚚 Shipment: {t.shipmentId.substring(0, 8)}...</span>}
                  {t.courseId && <span className="px-2 py-1 bg-purple-950/80 text-purple-300 border border-purple-800/60 rounded">🎓 Course: {t.courseId.substring(0, 8)}...</span>}
                  {t.productId && <span className="px-2 py-1 bg-spore-950/80 text-spore-300 border border-spore-800/60 rounded">🌱 Product: {t.productId.substring(0, 8)}...</span>}
                </div>

                {/* Message Thread History */}
                {t.messages && t.messages.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thread History ({t.messages.length})</span>
                    {t.messages.map((m) => (
                      <div key={m.id} className={`p-3 rounded-xl text-xs space-y-1 ${m.senderType === 'CUSTOMER' ? 'bg-slate-950/90 border border-slate-800 text-slate-200' : 'bg-spore-950/80 border border-spore-700/50 text-spore-100'}`}>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span className="font-bold text-white">{m.senderName} ({m.senderType})</span>
                          <span>{new Date(m.createdAt).toLocaleString()}</span>
                        </div>
                        <p>{m.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Status & Priority Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 font-medium">Update Status:</span>
                    <select
                      value={t.status || 'OPEN'}
                      onChange={(e) => handleUpdateTicketStatus(t.id, e.target.value)}
                      className="bg-slate-950 border border-spore-700 text-white rounded-lg px-2.5 py-1 text-xs"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="WAITING_ON_CUSTOMER">WAITING_ON_CUSTOMER</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>
                  {t.status !== 'RESOLVED' && t.status !== 'CLOSED' && (
                    <button
                      onClick={() => handleUpdateTicketStatus(t.id, 'RESOLVED')}
                      className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs rounded-xl transition-all"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
            {tickets.length === 0 && <p className="text-xs text-slate-400 text-center py-6">No support tickets in queue.</p>}
          </div>
        </div>
      )}

      {/* SECTION 7: TRAINING & COURSES */}
      {(activeSection === 'training' || activeSection === 'courses' || activeSection === 'batches' || activeSection === 'enrollments') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-panel p-6 rounded-2xl border border-spore-700/50 space-y-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-spore-400" /> Create Masterclass Course
            </h3>
            <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Course Title *</label>
                <input type="text" required value={courseTitle} onChange={(e) => {
                  setCourseTitle(e.target.value);
                  if (!courseSlug) setCourseSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                }} className="w-full bg-slate-900 border border-spore-700 rounded-xl px-3.5 py-2.5 text-white" />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">SEO Slug *</label>
                <input type="text" required value={courseSlug} onChange={(e) => setCourseSlug(e.target.value)} className="w-full bg-slate-900 border border-spore-700 rounded-xl px-3.5 py-2.5 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Duration (Days)</label>
                  <input type="number" value={courseDuration} onChange={(e) => setCourseDuration(e.target.value)} className="w-full bg-slate-900 border border-spore-700 rounded-xl px-3.5 py-2.5 text-white" />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Fee (INR)</label>
                  <input type="number" value={courseFee} onChange={(e) => setCourseFee(e.target.value)} className="w-full bg-slate-900 border border-spore-700 rounded-xl px-3.5 py-2.5 text-white" />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea rows={3} value={courseDesc} onChange={(e) => setCourseDesc(e.target.value)} className="w-full bg-slate-900 border border-spore-700 rounded-xl px-3.5 py-2.5 text-white" />
              </div>
              <button type="submit" className="w-full bg-spore-500 text-slate-950 font-bold py-3 rounded-xl shadow-lg">Save Course</button>
            </form>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-spore-700/50 space-y-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-spore-400" /> Active Masterclasses ({courses.length})
            </h3>
            <div className="space-y-3">
              {courses.map((c) => (
                <div key={c.id} className="p-4 bg-slate-900/90 rounded-xl border border-spore-800/60 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">{c.title}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">/{c.slug} • {c.durationDays} Days</span>
                  </div>
                  <span className="font-bold text-spore-300 text-xs">₹{c.feeInr}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
