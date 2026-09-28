import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Package, FolderTree, Warehouse, Tag, Image, 
  ShoppingBag, CreditCard, Truck, GraduationCap, BookOpen, Calendar, 
  UserCheck, FileText, Users, LifeBuoy, BarChart3, Plus, 
  CheckCircle2, AlertCircle, RefreshCw, Send, ChevronDown
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
  const [prodHsn, setProdHsn] = useState('07095900');
  const [prodGst, setProdGst] = useState('5.00');
  const [prodCatId, setProdCatId] = useState('');
  const [formTab, setFormTab] = useState('basic');

  // Product Information & Compliance State
  const [brandName, setBrandName] = useState('Sporekart Agritech');
  const [countryOrigin, setCountryOrigin] = useState('India');
  const [netQty, setNetQty] = useState('200');
  const [uom, setUom] = useState('g');
  const [fssaiLic, setFssaiLic] = useState('10020011000123');
  const [isVeg, setIsVeg] = useState(true);
  const [ingredients, setIngredients] = useState('');
  const [allergenInfo, setAllergenInfo] = useState('');
  const [species, setSpecies] = useState('Agaricus bisporus');
  const [strain, setStrain] = useState('A15 Premium');
  const [substrate, setSubstrate] = useState('Pasteurized Wheat Straw');
  const [kitContents, setKitContents] = useState('');
  const [storageInst, setStorageInst] = useState('Refrigerate between 2°C - 4°C');
  const [tempGuidance, setTempGuidance] = useState('2°C - 4°C');
  const [shelfLife, setShelfLife] = useState('30 Days from dispatch');
  const [mfrDetails, setMfrDetails] = useState('Sporekart Agritech, Solan, HP');
  const [custCareDetails, setCustCareDetails] = useState('care@sporekart.in | +91-9876543210');

  // Multi-Image Gallery State
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaRoleInput, setMediaRoleInput] = useState('PRIMARY');
  const [mediaList, setMediaList] = useState([]);

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

  const fetchDataForSection = async (section) => {
    setLoading(true);
    setStatusMessage('');
    setErrorMessage('');
    try {
      if (section === 'overview' || section === 'analytics') {
        const [anRes, logRes] = await Promise.all([
          adminApi.getAnalyticsOverview(),
          adminApi.getAuditLogs()
        ]);
        if (anRes.data?.success) setAnalytics(anRes.data.data);
        if (logRes.data?.success) {
          const logsData = logRes.data.data;
          setAuditLogs(Array.isArray(logsData) ? logsData : (logsData?.content || []));
        }
      } else if (section === 'blogs') {
        const res = await adminApi.getBlogPosts();
        if (res.data?.success) {
          const data = res.data.data;
          setPosts(Array.isArray(data) ? data : (data?.content || []));
        }
      } else if (section === 'products' || section === 'categories' || section === 'inventory' || section === 'offers' || section === 'media') {
        const [prodRes, catRes] = await Promise.all([
          catalogApi.getProducts(),
          catalogApi.getCategories()
        ]);
        if (prodRes.data?.success) {
          const data = prodRes.data.data;
          setProducts(Array.isArray(data) ? data : (data?.content || []));
        }
        if (catRes.data?.success) {
          const data = catRes.data.data;
          setCategories(Array.isArray(data) ? data : (data?.content || []));
        }
      } else if (section === 'orders' || section === 'payments' || section === 'shipping') {
        const res = await adminApi.getOrders();
        if (res.data?.success) {
          const data = res.data.data;
          setOrders(Array.isArray(data) ? data : (data?.content || []));
        }
      } else if (section === 'customers') {
        const res = await adminApi.getCustomers();
        if (res.data?.success) {
          const data = res.data.data;
          setCustomers(Array.isArray(data) ? data : (data?.content || []));
        }
      } else if (section === 'support') {
        const res = await adminApi.getTickets();
        if (res.data?.success) {
          const data = res.data.data;
          setTickets(Array.isArray(data) ? data : (data?.content || []));
        }
      } else if (section === 'training' || section === 'courses' || section === 'batches' || section === 'enrollments') {
        const res = await trainingApi.getCourses();
        if (res.data?.success) {
          const data = res.data.data;
          setCourses(Array.isArray(data) ? data : (data?.content || []));
        }
      }
    } catch (err) {
      console.error('Failed loading admin data:', err);
      setErrorMessage(err.response?.data?.message || 'Failed loading administrative section data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataForSection(activeSection);
  }, [activeSection]);

  // Handlers
  const handleCreateBlog = async (e) => {
    e.preventDefault();
    setStatusMessage(''); setErrorMessage('');
    try {
      await adminApi.createBlogPost({
        title: blogTitle,
        slug: blogSlug,
        summary: blogSummary,
        content: blogContent
      });
      setStatusMessage('Blog draft successfully created.');
      setBlogTitle(''); setBlogSlug(''); setBlogSummary(''); setBlogContent('');
      fetchDataForSection('blogs');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to create blog post.');
    }
  };

  const handlePublishPost = async (id) => {
    setStatusMessage(''); setErrorMessage('');
    try {
      await adminApi.publishBlogPost(id);
      setStatusMessage('Blog post published successfully.');
      fetchDataForSection('blogs');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to publish post.');
    }
  };

  const handleAddMedia = () => {
    if (!mediaUrlInput || !mediaUrlInput.trim()) return;
    const newMedia = {
      id: 'temp_' + Date.now(),
      url: mediaUrlInput.trim(),
      role: mediaRoleInput,
      isPrimary: mediaRoleInput === 'PRIMARY' || mediaList.length === 0,
      displayOrder: mediaList.length
    };
    setMediaList([...mediaList, newMedia]);
    setMediaUrlInput('');
  };

  const handleRemoveMedia = (id) => {
    setMediaList(mediaList.filter(m => m.id !== id));
  };

  const handleSetPrimaryMedia = (id) => {
    setMediaList(mediaList.map(m => ({
      ...m,
      isPrimary: m.id === id,
      role: m.id === id ? 'PRIMARY' : (m.role === 'PRIMARY' ? 'GALLERY' : m.role)
    })));
  };

  const handleCreateProduct = async (e, publishImmediately = false) => {
    if (e) e.preventDefault();
    setStatusMessage(''); setErrorMessage('');
    try {
      const payload = {
        title: prodTitle,
        slug: prodSlug,
        productType: prodType,
        description: prodDesc,
        hsnCode: prodHsn,
        gstRate: parseFloat(prodGst),
        categoryId: prodCatId || null,
        information: {
          brandName, countryOfOrigin: countryOrigin, netQuantity: netQty, unitOfMeasure: uom,
          fssaiLicenseNumber: fssaiLic, isVegetarian: isVeg, ingredients, allergenInformation: allergenInfo,
          scientificName: species, strainName: strain, recommendedSubstrate: substrate, kitContents,
          storageInstructions: storageInst, temperatureGuidance: tempGuidance, shelfLifeGuidance: shelfLife,
          manufacturerDetails: mfrDetails, customerCareDetails: custCareDetails
        }
      };

      const res = await adminApi.createProduct(payload);
      const createdProd = res.data.data;

      if (mediaList.length > 0) {
        for (const m of mediaList) {
          await adminApi.addMedia({
            productId: createdProd.id,
            mediaUrl: m.url,
            mediaRole: m.role,
            isPrimary: m.isPrimary,
            displayOrder: m.displayOrder
          });
        }
      }

      if (publishImmediately) {
        await adminApi.publishProduct(createdProd.id);
        setStatusMessage(`Product "${prodTitle}" validated & published successfully.`);
      } else {
        setStatusMessage(`Product "${prodTitle}" saved as draft.`);
      }

      setProdTitle(''); setProdSlug(''); setProdDesc(''); setMediaList([]);
      fetchDataForSection('products');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed creating product. Ensure FSSAI license & fields are valid.');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setStatusMessage(''); setErrorMessage('');
    try {
      await adminApi.createCategory({ name: catName, slug: catSlug, description: catDesc });
      setStatusMessage('Category created successfully.');
      setCatName(''); setCatSlug(''); setCatDesc('');
      fetchDataForSection('categories');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed creating category.');
    }
  };

  const handleUpdateOrderStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setStatusMessage(''); setErrorMessage('');
    try {
      await adminApi.updateOrderStatus(selectedOrder.id, newOrderStatus, orderReason);
      setStatusMessage(`Order ${selectedOrder.orderNumber} updated to ${newOrderStatus}.`);
      setSelectedOrder(null); setOrderReason('');
      fetchDataForSection('orders');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed updating order status.');
    }
  };

  const handleGrantCapability = async (userId, capability) => {
    setStatusMessage(''); setErrorMessage('');
    try {
      await adminApi.grantCapability(userId, capability);
      setStatusMessage(`Capability ${capability} granted to customer.`);
      fetchDataForSection('customers');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed granting capability.');
    }
  };

  const handleUpdateTicketStatus = async (ticketId, status) => {
    setStatusMessage(''); setErrorMessage('');
    try {
      await adminApi.updateTicketStatus(ticketId, status);
      setStatusMessage(`Ticket status updated to ${status}.`);
      fetchDataForSection('support');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed updating ticket status.');
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setStatusMessage(''); setErrorMessage('');
    try {
      await adminApi.createCourse({
        title: courseTitle, slug: courseSlug, description: courseDesc,
        durationDays: parseInt(courseDuration), feeInr: parseFloat(courseFee)
      });
      setStatusMessage('Masterclass course created successfully.');
      setCourseTitle(''); setCourseSlug(''); setCourseDesc('');
      fetchDataForSection('courses');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed creating course.');
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
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 animate-fade-in overflow-hidden text-typography-primary">
      <SeoHead
        title="Admin Control Plane — Sporekart Agritech"
        description="Administrative management portal for Sporekart catalog, content CMS, orders, and training."
        noindex={true}
      />

      {/* Admin Header Card */}
      <div className="bg-surface-white p-4 sm:p-6 lg:p-8 rounded-card border border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 shadow-level-2 overflow-hidden w-full max-w-full">
        <div className="flex items-center gap-3 sm:gap-4 max-w-full overflow-hidden">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-forest-900/10 border border-forest-900/20 flex items-center justify-center text-forest-800 shadow-level-1 shrink-0">
            <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="min-w-0 max-w-full">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display font-extrabold text-lg sm:text-2xl text-typography-primary truncate max-w-full">
                Sporekart Admin Control Plane
              </h1>
              <span className="px-2.5 py-0.5 bg-gold/15 text-forest-900 border border-gold/30 text-[10px] sm:text-[11px] font-bold rounded-full uppercase tracking-wider shrink-0">
                ROLE_ADMIN
              </span>
            </div>
            <p className="text-xs text-typography-secondary mt-1 truncate max-w-full">
              Authenticated Admin: <code className="text-forest-700 font-mono break-all font-semibold">{user?.email || user?.fullName}</code>
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchDataForSection(activeSection)}
          className="w-full sm:w-auto btn-secondary px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-forest-700 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* Global Status Alerts */}
      {statusMessage && (
        <div className="p-4 bg-green-600/10 border border-green-600/20 rounded-2xl text-xs text-forest-900 flex items-center gap-2 animate-fade-in shadow-level-1 break-words font-medium">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span className="break-words">{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-2xl text-xs text-red-700 flex items-center gap-2 animate-fade-in shadow-level-1 break-words font-medium">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="break-words">{errorMessage}</span>
        </div>
      )}

      {/* Navigation Links - Mobile Dropdown & Desktop Scroll Bar */}
      <div className="w-full max-w-full space-y-2">
        {/* Mobile Section Dropdown Select */}
        <div className="md:hidden w-full">
          <label className="block text-[11px] font-bold text-typography-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <span>Admin Section Selector:</span>
          </label>
          <div className="relative w-full">
            <select
              value={activeSection}
              onChange={(e) => {
                const target = navItems.find(i => i.id === e.target.value);
                if (target) navigate(target.path);
              }}
              className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-3 text-typography-primary text-xs font-bold appearance-none focus:outline-none focus:border-green-600 pr-10 shadow-level-1"
            >
              {navItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-forest-700 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Desktop / Tablet Horizontal Scroll Bar */}
        <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin border-b border-surface-border max-w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id || (activeSection === 'overview' && item.id === 'overview');
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                  isActive
                    ? 'btn-primary text-white shadow-level-1'
                    : 'bg-surface-white text-typography-secondary hover:text-typography-primary border border-surface-border'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: OVERVIEW & ANALYTICS */}
      {(activeSection === 'overview' || activeSection === 'analytics') && (
        <div className="space-y-6 sm:space-y-8 w-full max-w-full">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-surface-white p-4 sm:p-5 rounded-card border border-surface-border shadow-level-1 space-y-1 hover-lift">
              <span className="text-[10px] sm:text-[11px] text-typography-muted font-semibold uppercase">Total Products</span>
              <p className="text-xl sm:text-2xl font-black text-typography-primary font-display">{analytics?.totalProducts || 18}</p>
            </div>
            <div className="bg-surface-white p-4 sm:p-5 rounded-card border border-surface-border shadow-level-1 space-y-1 hover-lift">
              <span className="text-[10px] sm:text-[11px] text-typography-muted font-semibold uppercase">Active Orders</span>
              <p className="text-xl sm:text-2xl font-black text-forest-700 font-display">{analytics?.activeOrders || 5}</p>
            </div>
            <div className="bg-surface-white p-4 sm:p-5 rounded-card border border-surface-border shadow-level-1 space-y-1 hover-lift">
              <span className="text-[10px] sm:text-[11px] text-typography-muted font-semibold uppercase">Customers</span>
              <p className="text-xl sm:text-2xl font-black text-typography-primary font-display">{analytics?.totalCustomers || 42}</p>
            </div>
            <div className="bg-surface-white p-4 sm:p-5 rounded-card border border-surface-border shadow-level-1 space-y-1 hover-lift">
              <span className="text-[10px] sm:text-[11px] text-typography-muted font-semibold uppercase">Total Revenue</span>
              <p className="text-xl sm:text-2xl font-black text-green-600 font-display">₹{(analytics?.totalRevenueInr || 128500).toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-surface-white p-4 sm:p-6 lg:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1 w-full max-w-full overflow-hidden">
            <h3 className="font-display font-bold text-base sm:text-lg text-typography-primary flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-forest-700 shrink-0" /> Admin Audit Logs (`admin_audit_logs`)
            </h3>
            <div className="w-full overflow-x-auto max-w-full rounded-2xl border border-surface-border scrollbar-thin">
              <table className="w-full text-left text-xs text-typography-secondary min-w-[650px]">
                <thead className="bg-surface-cream text-typography-primary uppercase font-semibold border-b border-surface-border">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Resource Type</th>
                    <th className="p-3">Resource ID</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {(Array.isArray(auditLogs) ? auditLogs : []).map((log) => (
                    <tr key={log.id} className="hover:bg-surface-cream/50 font-mono text-[11px]">
                      <td className="p-3 whitespace-nowrap text-typography-muted">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-3 font-bold text-forest-800 whitespace-nowrap">{log.action}</td>
                      <td className="p-3 text-typography-secondary whitespace-nowrap">{log.resourceType || 'SYSTEM'}</td>
                      <td className="p-3 text-typography-muted font-mono">{log.resourceId ? log.resourceId.substring(0, 8) + '...' : '—'}</td>
                      <td className="p-3 text-typography-secondary break-words max-w-xs">{log.details}</td>
                    </tr>
                  ))}
                  {(!Array.isArray(auditLogs) || auditLogs.length === 0) && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-typography-muted font-sans">No audit log records found. Action executions will be logged automatically.</td>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 w-full max-w-full">
          
          {/* Structured Product Creation & Edit Form */}
          <div className="lg:col-span-7 bg-surface-white p-4 sm:p-6 lg:p-8 rounded-card border border-surface-border space-y-5 shadow-level-1 w-full max-w-full overflow-hidden" data-testid="product-information-form">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-display font-bold text-base sm:text-lg text-typography-primary flex items-center gap-2">
                <Plus className="w-5 h-5 text-forest-700 shrink-0" /> Catalog Product Setup & Compliance
              </h3>
              <span className="text-[11px] text-forest-800 font-bold bg-surface-cream px-3 py-1 rounded-xl border border-surface-border">
                Type: {prodType}
              </span>
            </div>

            {/* Logical Form Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 border-b border-surface-border text-xs scrollbar-thin max-w-full">
              <button
                type="button"
                onClick={() => setFormTab('basic')}
                className={`px-3 py-2 rounded-t-xl font-bold transition-all whitespace-nowrap ${
                  formTab === 'basic' ? 'bg-forest-900/10 text-forest-800 border-b-2 border-forest-700' : 'text-typography-muted hover:text-typography-primary'
                }`}
              >
                1. Basic & SEO
              </button>
              <button
                type="button"
                onClick={() => setFormTab('compliance')}
                className={`px-3 py-2 rounded-t-xl font-bold transition-all whitespace-nowrap ${
                  formTab === 'compliance' ? 'bg-forest-900/10 text-forest-800 border-b-2 border-forest-700' : 'text-typography-muted hover:text-typography-primary'
                }`}
              >
                2. FSSAI / Food
              </button>
              <button
                type="button"
                onClick={() => setFormTab('agri')}
                className={`px-3 py-2 rounded-t-xl font-bold transition-all whitespace-nowrap ${
                  formTab === 'agri' ? 'bg-forest-900/10 text-forest-800 border-b-2 border-forest-700' : 'text-typography-muted hover:text-typography-primary'
                }`}
              >
                3. Mushroom / Agri
              </button>
              <button
                type="button"
                onClick={() => setFormTab('storage')}
                className={`px-3 py-2 rounded-t-xl font-bold transition-all whitespace-nowrap ${
                  formTab === 'storage' ? 'bg-forest-900/10 text-forest-800 border-b-2 border-forest-700' : 'text-typography-muted hover:text-typography-primary'
                }`}
              >
                4. Storage & Care
              </button>
              <button
                type="button"
                onClick={() => setFormTab('media')}
                className={`px-3 py-2 rounded-t-xl font-bold transition-all whitespace-nowrap ${
                  formTab === 'media' ? 'bg-forest-900/10 text-forest-800 border-b-2 border-forest-700' : 'text-typography-muted hover:text-typography-primary'
                }`}
              >
                5. Multi-Image Gallery
              </button>
            </div>

            <form className="space-y-4 text-xs w-full max-w-full">
              
              {/* TAB 1: BASIC & SEO */}
              {formTab === 'basic' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-typography-primary font-medium mb-1">Product Title *</label>
                    <input
                      type="text" required value={prodTitle}
                      onChange={(e) => {
                        setProdTitle(e.target.value);
                        if (!prodSlug) setProdSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }}
                      placeholder="e.g. Button Mushroom 200g Pack"
                      className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-green-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-typography-primary font-medium mb-1">SEO Slug *</label>
                      <input type="text" required value={prodSlug} onChange={(e) => setProdSlug(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-green-600" />
                    </div>
                    <div>
                      <label className="block text-typography-primary font-medium mb-1">Product Type *</label>
                      <select value={prodType} onChange={(e) => setProdType(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-green-600">
                        <option value="FRESH_MUSHROOM">Fresh Mushroom</option>
                        <option value="DRY_MUSHROOM">Dry Mushroom</option>
                        <option value="SPAWN_SEED">Mushroom Spawn / Seed</option>
                        <option value="GROWING_KIT">DIY Growing Kit</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-typography-primary font-medium mb-1">HSN Classification</label>
                      <input type="text" value={prodHsn} onChange={(e) => setProdHsn(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-green-600" />
                    </div>
                    <div>
                      <label className="block text-typography-primary font-medium mb-1">GST Rate (%)</label>
                      <input type="number" step="0.01" value={prodGst} onChange={(e) => setProdGst(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-green-600" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-typography-primary font-medium mb-1">Category</label>
                    <select value={prodCatId} onChange={(e) => setProdCatId(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-green-600">
                      <option value="">Select Category (Optional)</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-typography-primary font-medium mb-1">Detailed Description</label>
                    <textarea rows={3} value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} placeholder="Full product summary and features..." className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-green-600" />
                  </div>
                </div>
              )}

              {/* TAB 2: FSSAI & COMPLIANCE */}
              {formTab === 'compliance' && (
                <div className="space-y-4" data-testid="product-compliance-form">
                  <div className="p-3.5 bg-surface-cream rounded-2xl border border-surface-border text-[11px] text-typography-secondary leading-relaxed font-medium">
                    ℹ FSSAI License Number is mandatory for food products (`FRESH_MUSHROOM` & `DRY_MUSHROOM`) before publishing.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-typography-primary font-medium mb-1">FSSAI Lic. No. (14 Digits)</label>
                      <input type="text" value={fssaiLic} onChange={(e) => setFssaiLic(e.target.value)} placeholder="10020011000123" className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary font-mono focus:outline-none focus:border-green-600" />
                    </div>
                    <div>
                      <label className="block text-typography-primary font-medium mb-1">Dietary Declaration</label>
                      <select value={isVeg ? 'VEG' : 'NON_VEG'} onChange={(e) => setIsVeg(e.target.value === 'VEG')} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-green-600">
                        <option value="VEG">100% Vegetarian (Green Symbol)</option>
                        <option value="NON_VEG">Non-Vegetarian</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-typography-primary font-medium mb-1">Net Quantity</label>
                      <input type="text" value={netQty} onChange={(e) => setNetQty(e.target.value)} placeholder="200" className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-green-600" />
                    </div>
                    <div>
                      <label className="block text-typography-primary font-medium mb-1">Unit of Measure</label>
                      <select value={uom} onChange={(e) => setUom(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-green-600">
                        <option value="g">Grams (g)</option>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="pcs">Pieces / Bags (pcs)</option>
                        <option value="ml">Milliliters (ml)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-typography-primary font-medium mb-1">Ingredients List (If Applicable)</label>
                    <textarea rows={2} value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="e.g. 100% Organically Cultivated Dried Oyster Mushrooms" className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-green-600" />
                  </div>

                  <div>
                    <label className="block text-typography-primary font-medium mb-1">Allergen Information (If Any)</label>
                    <input type="text" value={allergenInfo} onChange={(e) => setAllergenInfo(e.target.value)} placeholder="e.g. Contains mushroom spores" className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-green-600" />
                  </div>
                </div>
              )}

              {/* TAB 3: MUSHROOM & AGRITECH */}
              {formTab === 'agri' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-typography-primary font-medium mb-1">Mushroom Species / Scientific Name</label>
                      <input type="text" value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="e.g. Pleurotus ostreatus" className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-green-600" />
                    </div>
                    <div>
                      <label className="block text-typography-primary font-medium mb-1">Strain / Variety Name</label>
                      <input type="text" value={strain} onChange={(e) => setStrain(e.target.value)} placeholder="e.g. Florida Strain" className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-green-600" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-typography-primary font-medium mb-1">Recommended Substrate</label>
                    <input type="text" value={substrate} onChange={(e) => setSubstrate(e.target.value)} placeholder="e.g. Wheat Straw / Paddy Straw / Sawdust" className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-green-600" />
                  </div>

                  {prodType === 'GROWING_KIT' && (
                    <div>
                      <label className="block text-typography-primary font-medium mb-1">DIY Kit Contents *</label>
                      <textarea rows={2} value={kitContents} onChange={(e) => setKitContents(e.target.value)} placeholder="e.g. Substrate block, spray bottle, cultivation bag, instruction manual" className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-green-600" />
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: STORAGE & PRODUCER */}
              {formTab === 'storage' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-typography-primary font-medium mb-1">Temperature Guidance</label>
                      <input type="text" value={tempGuidance} onChange={(e) => setTempGuidance(e.target.value)} placeholder="2°C - 4°C" className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-green-600" />
                    </div>
                    <div>
                      <label className="block text-typography-primary font-medium mb-1">Shelf Life Guidance</label>
                      <input type="text" value={shelfLife} onChange={(e) => setShelfLife(e.target.value)} placeholder="30 Days" className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-green-600" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-typography-primary font-medium mb-1">Storage Instructions</label>
                    <input type="text" value={storageInst} onChange={(e) => setStorageInst(e.target.value)} placeholder="Keep refrigerated between 2°C and 4°C" className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-green-600" />
                  </div>

                  <div>
                    <label className="block text-typography-primary font-medium mb-1">Manufacturer & Packer Details</label>
                    <input type="text" value={mfrDetails} onChange={(e) => setMfrDetails(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-green-600" />
                  </div>

                  <div>
                    <label className="block text-typography-primary font-medium mb-1">Customer Care Contact</label>
                    <input type="text" value={custCareDetails} onChange={(e) => setCustCareDetails(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-green-600" />
                  </div>
                </div>
              )}

              {/* TAB 5: MULTI-IMAGE GALLERY MANAGER */}
              {formTab === 'media' && (
                <div className="space-y-4">
                  <div className="p-4 bg-surface-cream rounded-2xl border border-surface-border space-y-3">
                    <span className="font-bold text-typography-primary block">Add Product Image URL</span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={mediaUrlInput}
                        onChange={(e) => setMediaUrlInput(e.target.value)}
                        data-testid="product-image-upload"
                        className="flex-1 bg-surface-white border border-surface-border rounded-xl px-3 py-2 text-typography-primary text-xs focus:outline-none focus:border-green-600"
                      />
                      <select
                        value={mediaRoleInput}
                        onChange={(e) => setMediaRoleInput(e.target.value)}
                        className="bg-surface-white border border-surface-border rounded-xl px-3 py-2 text-typography-primary text-xs focus:outline-none focus:border-green-600"
                      >
                        <option value="PRIMARY">PRIMARY</option>
                        <option value="GALLERY">GALLERY</option>
                        <option value="PACKAGING">PACKAGING</option>
                        <option value="LIFESTYLE">LIFESTYLE</option>
                        <option value="INSTRUCTION">INSTRUCTION</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleAddMedia}
                        className="btn-primary text-xs font-bold px-4 py-2 shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* List of uploaded preview images */}
                  <div className="space-y-2">
                    {mediaList.map((m) => (
                      <div key={m.id} className="p-3 bg-surface-cream rounded-xl border border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3 overflow-hidden max-w-full">
                          <img src={m.url} alt="preview" className="w-10 h-10 object-cover rounded-lg border border-surface-border shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[11px] text-typography-primary font-mono block truncate max-w-xs">{m.url}</span>
                            <span className="text-[10px] text-forest-700 font-bold uppercase">{m.role} {m.isPrimary && '• PRIMARY'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryMedia(m.id)}
                            data-testid="product-set-primary"
                            className="px-2.5 py-1 btn-secondary text-[10px] font-bold"
                          >
                            Set Primary
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(m.id)}
                            data-testid="product-image-remove"
                            className="px-2.5 py-1 bg-red-600/10 text-red-700 border border-red-600/20 text-[10px] font-bold rounded-lg"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    {mediaList.length === 0 && (
                      <p className="text-typography-muted text-xs text-center py-4">No gallery images added yet. Add image URLs above.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons: Save Draft vs Publish */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-surface-border">
                <button
                  type="button"
                  onClick={(e) => handleCreateProduct(e, false)}
                  data-testid="product-save"
                  className="flex-1 btn-secondary font-bold py-3.5 rounded-2xl"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={(e) => handleCreateProduct(e, true)}
                  data-testid="product-publish"
                  className="flex-1 btn-primary font-extrabold py-3.5 rounded-2xl"
                >
                  Validate & Publish Product ➔
                </button>
              </div>
            </form>
          </div>

          {/* Active Products List Sidebar */}
          <div className="lg:col-span-5 bg-surface-white p-4 sm:p-6 lg:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1 w-full max-w-full overflow-hidden">
            <h3 className="font-display font-bold text-base sm:text-lg text-typography-primary flex items-center gap-2">
              <Package className="w-5 h-5 text-forest-700 shrink-0" /> Active Catalog ({products.length})
            </h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
              {products.map((p) => (
                <div key={p.id} className="p-4 bg-surface-cream rounded-2xl border border-surface-border flex items-center justify-between gap-2 hover-lift">
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-typography-primary font-display truncate">{p.title}</h4>
                    <span className="text-[11px] text-typography-muted font-mono block truncate">/{p.slug}</span>
                    {p.productInformation?.fssaiLicenseNumber && (
                      <span className="block text-[10px] text-green-700 font-mono mt-0.5 truncate font-semibold">FSSAI: {p.productInformation.fssaiLicenseNumber}</span>
                    )}
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <span className="px-2.5 py-0.5 bg-forest-900/10 text-forest-800 border border-forest-900/20 text-[10px] font-bold rounded-lg uppercase block">
                      {p.productType}
                    </span>
                    <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-lg uppercase inline-block ${
                      p.status === 'ACTIVE' ? 'bg-green-600/10 text-green-700 border border-green-600/20' : 'bg-surface-neutral text-typography-muted'
                    }`}>
                      {p.status || 'ACTIVE'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: ORDERS, PAYMENTS & SHIPPING */}
      {(activeSection === 'orders' || activeSection === 'payments' || activeSection === 'shipping') && (
        <div className="bg-surface-white p-4 sm:p-6 lg:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1 w-full max-w-full overflow-hidden">
          <h3 className="font-display font-bold text-base sm:text-lg text-typography-primary flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-forest-700 shrink-0" /> Customer Orders ({orders.length})
          </h3>
          <div className="w-full overflow-x-auto max-w-full rounded-2xl border border-surface-border scrollbar-thin">
            <table className="w-full text-left text-xs text-typography-secondary min-w-[650px]">
              <thead className="bg-surface-cream text-typography-primary uppercase font-semibold border-b border-surface-border">
                <tr>
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-cream/50">
                    <td className="p-3 font-mono font-bold text-typography-primary whitespace-nowrap">{order.orderNumber}</td>
                    <td className="p-3 text-typography-muted whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 font-bold text-forest-800 font-display whitespace-nowrap">₹{order.totalAmountInr}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-gold/15 text-forest-900 border border-gold/30 text-[10px] font-bold rounded-lg uppercase">
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1.5 btn-primary font-bold text-[11px]"
                      >
                        Manage Status
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-typography-muted">No active customer orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Modal to update status */}
          {selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-typography-primary/45 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-surface-white p-6 rounded-card max-w-md w-full space-y-4 border border-surface-border shadow-level-3 animate-scale-in max-h-[90vh] overflow-y-auto">
                <h4 className="font-bold text-lg text-typography-primary font-display">Update Status for {selectedOrder.orderNumber}</h4>
                <form onSubmit={handleUpdateOrderStatus} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-typography-primary font-medium mb-1">New Status</label>
                    <select value={newOrderStatus} onChange={(e) => setNewOrderStatus(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-green-600">
                      <option value="PAID">PAID</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-typography-primary font-medium mb-1">Audit Reason</label>
                    <input type="text" placeholder="e.g. Shipment handed to courier" value={orderReason} onChange={(e) => setOrderReason(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-green-600" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 btn-primary py-3 font-bold">Save</button>
                    <button type="button" onClick={() => setSelectedOrder(null)} className="px-4 btn-secondary font-bold">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: BLOG CMS */}
      {activeSection === 'blogs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 w-full max-w-full">
          <div className="bg-surface-white p-4 sm:p-6 lg:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1 w-full max-w-full overflow-hidden">
            <h3 className="font-display font-bold text-base sm:text-lg text-typography-primary flex items-center gap-2">
              <Plus className="w-5 h-5 text-forest-700 shrink-0" /> Draft New Blog Article
            </h3>
            <form onSubmit={handleCreateBlog} className="space-y-4 text-xs">
              <div>
                <label className="block text-typography-primary font-medium mb-1">Title *</label>
                <input
                  type="text" required value={blogTitle}
                  onChange={(e) => {
                    setBlogTitle(e.target.value);
                    if (!blogSlug) setBlogSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                  }}
                  className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-green-600"
                />
              </div>
              <div>
                <label className="block text-typography-primary font-medium mb-1">SEO Slug *</label>
                <input type="text" required value={blogSlug} onChange={(e) => setBlogSlug(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-green-600" />
              </div>
              <div>
                <label className="block text-typography-primary font-medium mb-1">Summary</label>
                <textarea rows={2} value={blogSummary} onChange={(e) => setBlogSummary(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-green-600" />
              </div>
              <div>
                <label className="block text-typography-primary font-medium mb-1">Markdown Body *</label>
                <textarea rows={6} required value={blogContent} onChange={(e) => setBlogContent(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-green-600 font-mono" />
              </div>
              <button type="submit" className="w-full btn-primary py-3.5 rounded-2xl font-bold">
                Save Draft Blog Article
              </button>
            </form>
          </div>

          <div className="bg-surface-white p-4 sm:p-6 lg:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1 w-full max-w-full overflow-hidden">
            <h3 className="font-display font-bold text-base sm:text-lg text-typography-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-forest-700 shrink-0" /> Article CMS Registry ({posts.length})
            </h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
              {posts.map((post) => (
                <div key={post.id} className="p-4 bg-surface-cream rounded-2xl border border-surface-border space-y-2 hover-lift">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-sm text-typography-primary font-display truncate">{post.title}</h4>
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg shrink-0 ${post.status === 'PUBLISHED' ? 'bg-green-600/10 text-green-700 border border-green-600/20' : 'bg-gold/15 text-forest-900 border border-gold/30'}`}>
                      {post.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between text-[11px] gap-2 pt-1">
                    <span className="text-typography-muted font-mono truncate max-w-xs">/{post.slug}</span>
                    {post.status !== 'PUBLISHED' && (
                      <button onClick={() => handlePublishPost(post.id)} className="px-3 py-1.5 btn-primary text-xs font-bold flex items-center gap-1">
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
        <div className="bg-surface-white p-4 sm:p-6 lg:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1 w-full max-w-full overflow-hidden">
          <h3 className="font-display font-bold text-base sm:text-lg text-typography-primary flex items-center gap-2">
            <Users className="w-5 h-5 text-forest-700 shrink-0" /> Registered Customers ({customers.length})
          </h3>
          <div className="w-full overflow-x-auto max-w-full rounded-2xl border border-surface-border scrollbar-thin">
            <table className="w-full text-left text-xs text-typography-secondary min-w-[650px]">
              <thead className="bg-surface-cream text-typography-primary uppercase font-semibold border-b border-surface-border">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Email / Phone</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Capabilities</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {customers.map((c) => (
                  <tr key={c.userId} className="hover:bg-surface-cream/50">
                    <td className="p-3 font-bold text-typography-primary whitespace-nowrap">{c.fullName}</td>
                    <td className="p-3 text-typography-muted whitespace-nowrap font-mono">{c.email || c.phone}</td>
                    <td className="p-3 whitespace-nowrap"><span className="px-2 py-0.5 bg-surface-neutral text-typography-primary border border-surface-border rounded-lg text-[10px] font-bold">{c.role}</span></td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {c.capabilities?.map((cap) => (
                          <span key={cap} className="px-2 py-0.5 bg-forest-900/10 text-forest-800 border border-forest-900/20 text-[9px] font-bold rounded-lg">{cap}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <button onClick={() => handleGrantCapability(c.userId, 'TRAINING')} className="px-2.5 py-1 btn-secondary text-[10px] font-bold">
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
        <div className="bg-surface-white p-4 sm:p-6 lg:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1 w-full max-w-full overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base sm:text-lg text-typography-primary flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-forest-700 shrink-0" /> Support Desk & Ticket Queue ({tickets.length})
            </h3>
          </div>
          <div className="space-y-4">
            {tickets.map((t) => (
              <div key={t.id} className="p-4 sm:p-5 bg-surface-cream rounded-2xl border border-surface-border space-y-3 hover-lift">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-forest-700">{t.ticketNumber || ('TKT-' + t.id.substring(0, 8))}</span>
                    <h4 className="font-bold text-sm text-typography-primary font-display break-words">{t.subject}</h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 bg-forest-900/10 text-forest-800 border border-forest-900/20 text-[10px] font-bold rounded-lg uppercase">
                      Category: {t.category || 'GENERAL_SUPPORT'}
                    </span>
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg uppercase ${t.priority === 'URGENT' || t.priority === 'HIGH' ? 'bg-red-600/10 text-red-700 border border-red-600/20' : 'bg-surface-neutral text-typography-primary border border-surface-border'}`}>
                      Priority: {t.priority || 'MEDIUM'}
                    </span>
                    <span className="px-2.5 py-0.5 bg-gold/15 text-forest-900 border border-gold/30 text-[10px] font-bold rounded-lg uppercase">
                      Status: {t.status || 'OPEN'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-typography-secondary leading-relaxed bg-surface-white p-3.5 rounded-2xl border border-surface-border break-words">{t.message}</p>

                {/* Non-duplicative Entity References Tag Bar */}
                <div className="flex flex-wrap gap-2 text-[11px] font-mono pt-1">
                  {t.orderId && <span className="px-2.5 py-1 bg-surface-white text-forest-800 border border-surface-border rounded-lg">📦 Order: {t.orderId.substring(0, 8)}...</span>}
                  {t.paymentId && <span className="px-2.5 py-1 bg-surface-white text-green-700 border border-surface-border rounded-lg">💳 Payment: {t.paymentId.substring(0, 8)}...</span>}
                  {t.shipmentId && <span className="px-2.5 py-1 bg-surface-white text-forest-800 border border-surface-border rounded-lg">🚚 Shipment: {t.shipmentId.substring(0, 8)}...</span>}
                  {t.courseId && <span className="px-2.5 py-1 bg-surface-white text-forest-800 border border-surface-border rounded-lg">🎓 Course: {t.courseId.substring(0, 8)}...</span>}
                  {t.productId && <span className="px-2.5 py-1 bg-surface-white text-forest-800 border border-surface-border rounded-lg">🌱 Product: {t.productId.substring(0, 8)}...</span>}
                </div>

                {/* Message Thread History */}
                {t.messages && t.messages.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-surface-border">
                    <span className="text-[10px] font-bold text-typography-muted uppercase tracking-wider">Thread History ({t.messages.length})</span>
                    {t.messages.map((m) => (
                      <div key={m.id} className={`p-3 rounded-xl text-xs space-y-1 ${m.senderType === 'CUSTOMER' ? 'bg-surface-white border border-surface-border text-typography-secondary' : 'bg-forest-900/10 border border-forest-700/20 text-forest-900'}`}>
                        <div className="flex items-center justify-between text-[10px] text-typography-muted font-mono">
                          <span className="font-bold text-typography-primary">{m.senderName} ({m.senderType})</span>
                          <span>{new Date(m.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="break-words">{m.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Status & Priority Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-typography-muted font-medium">Update Status:</span>
                    <select
                      value={t.status || 'OPEN'}
                      onChange={(e) => handleUpdateTicketStatus(t.id, e.target.value)}
                      className="bg-surface-white border border-surface-border text-typography-primary rounded-xl px-3 py-1.5 text-xs focus:outline-none"
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
                      className="px-3.5 py-1.5 btn-primary font-bold text-xs"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
            {tickets.length === 0 && <p className="text-xs text-typography-muted text-center py-6">No support tickets in queue.</p>}
          </div>
        </div>
      )}

      {/* SECTION 7: TRAINING & COURSES */}
      {(activeSection === 'training' || activeSection === 'courses' || activeSection === 'batches' || activeSection === 'enrollments') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 w-full max-w-full">
          <div className="bg-surface-white p-4 sm:p-6 lg:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1 w-full max-w-full overflow-hidden">
            <h3 className="font-display font-bold text-base sm:text-lg text-typography-primary flex items-center gap-2">
              <Plus className="w-5 h-5 text-forest-700 shrink-0" /> Create Masterclass Course
            </h3>
            <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
              <div>
                <label className="block text-typography-primary font-medium mb-1">Course Title *</label>
                <input type="text" required value={courseTitle} onChange={(e) => {
                  setCourseTitle(e.target.value);
                  if (!courseSlug) setCourseSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                }} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-green-600" />
              </div>
              <div>
                <label className="block text-typography-primary font-medium mb-1">SEO Slug *</label>
                <input type="text" required value={courseSlug} onChange={(e) => setCourseSlug(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-green-600" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-typography-primary font-medium mb-1">Duration (Days)</label>
                  <input type="number" value={courseDuration} onChange={(e) => setCourseDuration(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-green-600" />
                </div>
                <div>
                  <label className="block text-typography-primary font-medium mb-1">Fee (INR)</label>
                  <input type="number" value={courseFee} onChange={(e) => setCourseFee(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-green-600" />
                </div>
              </div>
              <div>
                <label className="block text-typography-primary font-medium mb-1">Description</label>
                <textarea rows={3} value={courseDesc} onChange={(e) => setCourseDesc(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-green-600" />
              </div>
              <button type="submit" className="w-full btn-primary py-3.5 font-bold">Save Course</button>
            </form>
          </div>

          <div className="bg-surface-white p-4 sm:p-6 lg:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1 w-full max-w-full overflow-hidden">
            <h3 className="font-display font-bold text-base sm:text-lg text-typography-primary flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-forest-700 shrink-0" /> Active Masterclasses ({courses.length})
            </h3>
            <div className="space-y-3">
              {courses.map((c) => (
                <div key={c.id} className="p-4 bg-surface-cream rounded-2xl border border-surface-border flex items-center justify-between gap-2 hover-lift">
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-typography-primary font-display truncate">{c.title}</h4>
                    <span className="text-[11px] text-typography-muted font-mono block truncate">/{c.slug} • {c.durationDays} Days</span>
                  </div>
                  <span className="font-bold text-forest-800 text-xs font-display shrink-0">₹{c.feeInr}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
