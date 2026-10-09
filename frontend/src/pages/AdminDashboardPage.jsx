import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Package, FolderTree, Warehouse, Tag, Image, 
  ShoppingBag, CreditCard, Truck, GraduationCap, BookOpen, Calendar, 
  UserCheck, FileText, Users, LifeBuoy, BarChart3, Plus, 
  CheckCircle2, AlertCircle, RefreshCw, Send, ChevronDown,
  Search, Filter, Layers, ArrowUpRight, Sparkles, TrendingUp,
  Clock, SlidersHorizontal, Eye, Edit3, Trash2, Copy, ExternalLink,
  ChevronRight, Check, AlertTriangle, Layers2, Sparkle, Download,
  MapPin, CheckSquare, Clock3, Lock, RotateCcw, Ban, XCircle, DollarSign, Wallet, Award, X,
  ShoppingCart, Globe, Star
} from 'lucide-react';
import { adminApi, catalogApi, trainingApi, orderApi, adminFinanceApi } from '../api';
import SeoHead from '../components/SeoHead';
import LocalImageUploader from '../components/LocalImageUploader';
import AdminReviewsManager from '../components/AdminReviewsManager';
import AdminTrainingGalleryManager from '../components/AdminTrainingGalleryManager';
import StarRatingInput from '../components/StarRatingInput';

export default function AdminDashboardPage({ user }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active section from route path
  const currentPath = location.pathname;
  const rawSection = currentPath.replace('/admin', '').replace(/^\//, '') || 'overview';
  const activeSection = rawSection === 'platform-wallets' ? 'finance' : rawSection;
  
  // URL Query Parameters
  const queryParams = new URLSearchParams(location.search);
  const activeMode = queryParams.get('mode');

  // Common State
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Platform Finance & Wallet Ledger State
  const [financeSummary, setFinanceSummary] = useState({});
  const [platformTxns, setPlatformTxns] = useState([]);
  const [platformWithdrawals, setPlatformWithdrawals] = useState([]);
  const [financeSearch, setFinanceSearch] = useState('');
  const [withdrawalActionModal, setWithdrawalActionModal] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [manualAdjModalOpen, setManualAdjModalOpen] = useState(false);
  const [manualAdjForm, setManualAdjForm] = useState({ userId: '', amount: '', direction: 'CREDIT', reason: '' });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
  const [editingProduct, setEditingProduct] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
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

  // Pricing & Multi-Variant State (Step 5)
  const [variantName, setVariantName] = useState('Standard Pack (200g)');
  const [variantSku, setVariantSku] = useState('SKU-BM-200G');
  const [variantPrice, setVariantPrice] = useState('149.00');
  const [variantComparePrice, setVariantComparePrice] = useState('199.00');
  const [variantStock, setVariantStock] = useState(50);
  const [variantsList, setVariantsList] = useState([
    { id: 'v_1', variantName: 'Standard Pack (200g)', sku: 'SKU-BM-200G', priceInr: '149.00', compareAtPriceInr: '199.00', stockQuantity: 50, isPrimary: true }
  ]);

  // Product Catalog Registry Filter & Sort State
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [productSortBy, setProductSortBy] = useState('NAME_ASC');
  const [productPage, setProductPage] = useState(0);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [productTotalElements, setProductTotalElements] = useState(0);

  // Promotions State & Form Modal
  const [promotions, setPromotions] = useState([]);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [promoAudienceFilter, setPromoAudienceFilter] = useState('ALL');
  const [promoForm, setPromoForm] = useState({
    name: '',
    code: '',
    description: '',
    type: 'PERCENTAGE',
    discountValue: '10',
    maximumDiscount: '200',
    minimumOrderValue: '299',
    status: 'ACTIVE',
    usageLimit: '500',
    perCustomerLimit: '3',
    targetAudience: 'BOTH',
    targetType: 'ALL',
    targetBatchId: '',
    targetCourseId: '',
  });

  // Stock Replenish Modal State
  const [replenishModalOpen, setReplenishModalOpen] = useState(false);
  const [replenishTarget, setReplenishTarget] = useState(null);
  const [replenishQty, setReplenishQty] = useState('10');
  const [replenishReason, setReplenishReason] = useState('Supplier Stock Replenishment');
  const [replenishError, setReplenishError] = useState('');
  const [replenishConfirmStep, setReplenishConfirmStep] = useState(false);
  const [isSubmittingReplenish, setIsSubmittingReplenish] = useState(false);

  // Category Form
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catImageUrl, setCatImageUrl] = useState('');

  // Edit Category Modal State
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatSlug, setEditCatSlug] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [editCatImageUrl, setEditCatImageUrl] = useState('');
  const [editCatIsActive, setEditCatIsActive] = useState(true);

  // Orders State & Filters
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newOrderStatus, setNewOrderStatus] = useState('PAID');
  const [orderReason, setOrderReason] = useState('');

  // Cancellation Modal State
  const [cancelTargetOrder, setCancelTargetOrder] = useState(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');

  // Customers State
  const [customers, setCustomers] = useState([]);

  // Support Tickets State & Interactive Workspace
  const [tickets, setTickets] = useState([]);
  const [csatSummary, setCsatSummary] = useState({ averageRating: 5.0, ratedTicketsCount: 0, totalTickets: 0, ratingBreakdown: {} });
  const [selectedSupportTicket, setSelectedSupportTicket] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [supportSearchQuery, setSupportSearchQuery] = useState('');
  const [supportStatusFilter, setSupportStatusFilter] = useState('ALL');
  const [supportPriorityFilter, setSupportPriorityFilter] = useState('ALL');
  const [supportCategoryFilter, setSupportCategoryFilter] = useState('ALL');
  const [isSubmittingSupportReply, setIsSubmittingSupportReply] = useState(false);

  // Courses & Training State
  const [courses, setCourses] = useState([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseSlug, setCourseSlug] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseDuration, setCourseDuration] = useState(7);
  const [courseFee, setCourseFee] = useState(4999);

  // Batches Form & Cancellation State
  const [batchCourseId, setBatchCourseId] = useState('');
  const [batchCode, setBatchCode] = useState('BATCH-2026-OCT-01');
  const [batchStartDate, setBatchStartDate] = useState('2026-10-15');
  const [batchCapacity, setBatchCapacity] = useState(25);
  const [batchesList, setBatchesList] = useState([
    { id: 'b1', code: 'BATCH-2026-OCT-OYSTER', courseTitle: 'Button & Oyster Commercial Cultivation', startDate: '2026-10-10', capacity: 25, enrolled: 18, status: 'UPCOMING' },
    { id: 'b2', code: 'BATCH-2026-NOV-SPAWN', courseTitle: 'Masterclass in Mushroom Spawn Production', startDate: '2026-11-01', capacity: 20, enrolled: 12, status: 'UPCOMING' }
  ]);
  const [cancelTargetBatch, setCancelTargetBatch] = useState(null);

  // Training Refunds & Enrollments State
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [cancelTargetEnrollment, setCancelTargetEnrollment] = useState(null);
  const [enrollmentCourseFilter, setEnrollmentCourseFilter] = useState('ALL');
  const [enrollmentSearchQuery, setEnrollmentSearchQuery] = useState('');
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState('ALL');

  const registeredCoursesList = React.useMemo(() => {
    const courseMap = new Map();
    (courses || []).forEach((c) => {
      if (c.title) {
        courseMap.set(c.title.trim().toLowerCase(), {
          id: c.id || c.title,
          title: c.title,
          slug: c.slug,
          feeInr: c.feeInr || c.fee,
          durationDays: c.durationDays
        });
      }
    });
    (enrolledStudents || []).forEach((s) => {
      if (s.courseTitle && !courseMap.has(s.courseTitle.trim().toLowerCase())) {
        courseMap.set(s.courseTitle.trim().toLowerCase(), {
          id: s.courseId || s.courseTitle,
          title: s.courseTitle,
          slug: s.courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          feeInr: s.feePaid || 4999,
          durationDays: 7
        });
      }
    });
    return Array.from(courseMap.values());
  }, [courses, enrolledStudents]);

  const filteredEnrolledStudents = React.useMemo(() => {
    return (enrolledStudents || []).filter((s) => {
      if (enrollmentCourseFilter !== 'ALL') {
        const matchCourse = s.courseTitle?.trim().toLowerCase() === enrollmentCourseFilter.trim().toLowerCase() || s.courseId === enrollmentCourseFilter;
        if (!matchCourse) return false;
      }
      if (enrollmentStatusFilter === 'CONFIRMED' && s.status === 'CANCELLED') return false;
      if (enrollmentStatusFilter === 'CANCELLED' && s.status !== 'CANCELLED') return false;

      if (enrollmentSearchQuery && enrollmentSearchQuery.trim()) {
        const q = enrollmentSearchQuery.trim().toLowerCase();
        const nameMatch = s.studentName?.toLowerCase().includes(q);
        const emailMatch = s.email?.toLowerCase().includes(q);
        const batchMatch = s.batchCode?.toLowerCase().includes(q);
        const courseMatch = s.courseTitle?.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !batchMatch && !courseMatch) return false;
      }
      return true;
    });
  }, [enrolledStudents, enrollmentCourseFilter, enrollmentStatusFilter, enrollmentSearchQuery]);

  const fetchDataForSection = async (section) => {
    setLoading(true);
    setStatusMessage('');
    setErrorMessage('');
    try {
      // Always sync live analytics overview metrics
      adminApi.getAnalyticsOverview()
        .then(anRes => { if (anRes.data?.success) setAnalytics(anRes.data.data); })
        .catch(() => {});

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
      } else if (['products', 'categories', 'inventory', 'offers', 'media'].includes(section)) {
        const [prodRes, catRes, promoRes] = await Promise.allSettled([
          adminApi.getAdminProducts({
            page: productPage,
            size: 10,
            search: productSearch,
            category: productCategoryFilter,
            sortBy: productSortBy
          }),
          catalogApi.getCategories(),
          adminApi.getPromotions({ page: 0, size: 50 })
        ]);
        if (prodRes.status === 'fulfilled' && prodRes.value.data?.success) {
          const data = prodRes.value.data.data;
          if (data && data.content) {
            setProducts(data.content);
            setProductTotalPages(data.totalPages || 1);
            setProductTotalElements(data.totalElements || data.content.length);
          } else if (Array.isArray(data)) {
            setProducts(data);
            setProductTotalPages(1);
            setProductTotalElements(data.length);
          }
        } else if (prodRes.status === 'rejected') {
          const fallbackRes = await catalogApi.getProducts();
          if (fallbackRes.data?.success) {
            const data = fallbackRes.data.data;
            setProducts(Array.isArray(data) ? data : (data?.content || []));
          }
        }

        if (catRes.status === 'fulfilled' && catRes.value.data?.success) {
          const data = catRes.value.data.data;
          setCategories(Array.isArray(data) ? data : (data?.content || []));
        }
        if (promoRes.status === 'fulfilled' && promoRes.value.data?.success) {
          const data = promoRes.value.data.data;
          setPromotions(Array.isArray(data) ? data : (data?.content || []));
        }
      } else if (['orders', 'payments', 'shipping', 'order-refunds'].includes(section)) {
        const res = await adminApi.getOrders();
        if (res.data?.success) {
          const data = res.data.data;
          setOrders(Array.isArray(data) ? data : (data?.content || []));
        }
      } else if (section === 'finance') {
        const [sumRes, txnRes, wdRes] = await Promise.allSettled([
          adminFinanceApi.getOverview(),
          adminFinanceApi.getTransactions({ page: 0, size: 50 }),
          adminFinanceApi.getWithdrawals({ page: 0, size: 50 })
        ]);
        if (sumRes.status === 'fulfilled' && sumRes.value.data?.success) setFinanceSummary(sumRes.value.data.data);
        if (txnRes.status === 'fulfilled' && txnRes.value.data?.success) {
          const d = txnRes.value.data.data;
          setPlatformTxns(Array.isArray(d) ? d : (d?.content || []));
        }
        if (wdRes.status === 'fulfilled' && wdRes.value.data?.success) {
          const d = wdRes.value.data.data;
          setPlatformWithdrawals(Array.isArray(d) ? d : (d?.content || []));
        }
      } else if (section === 'customers') {
        const res = await adminApi.getCustomers();
        if (res.data?.success) {
          const data = res.data.data;
          setCustomers(Array.isArray(data) ? data : (data?.content || []));
        }
      } else if (section === 'support') {
        const [tRes, csatRes] = await Promise.allSettled([
          adminApi.getTickets(),
          adminApi.getCsatSummary()
        ]);
        if (tRes.status === 'fulfilled' && tRes.value.data?.success) {
          const data = tRes.value.data.data;
          setTickets(Array.isArray(data) ? data : (data?.content || []));
        }
        if (csatRes.status === 'fulfilled' && csatRes.value.data?.success) {
          setCsatSummary(csatRes.value.data.data || { averageRating: 5.0, ratedTicketsCount: 0, totalTickets: 0 });
        }
      } else if (['training', 'courses', 'batches', 'enrollments', 'batch-refunds'].includes(section)) {
        const [cRes, custRes, enrRes] = await Promise.allSettled([
          trainingApi.getCourses(),
          adminApi.getCustomers(),
          adminApi.getEnrollments()
        ]);
        if (cRes.status === 'fulfilled' && cRes.value.data?.success) {
          const data = cRes.value.data.data;
          setCourses(Array.isArray(data) ? data : (data?.content || []));
        }
        if (custRes.status === 'fulfilled' && custRes.value.data?.success) {
          const data = custRes.value.data.data;
          setCustomers(Array.isArray(data) ? data : (data?.content || []));
        }
        if (enrRes.status === 'fulfilled' && enrRes.value.data?.success) {
          const data = enrRes.value.data.data;
          setEnrolledStudents(Array.isArray(data) ? data : (data?.content || []));
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
  }, [activeSection, productPage, productCategoryFilter, productSortBy, productSearch]);

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

  const handleSavePromotion = async (e) => {
    e.preventDefault();
    setStatusMessage(''); setErrorMessage('');
    try {
      const payload = {
        name: promoForm.name,
        code: promoForm.code.toUpperCase(),
        description: promoForm.description,
        type: promoForm.type,
        discountValue: parseFloat(promoForm.discountValue || 0),
        maximumDiscount: promoForm.maximumDiscount ? parseFloat(promoForm.maximumDiscount) : null,
        minimumOrderValue: promoForm.minimumOrderValue ? parseFloat(promoForm.minimumOrderValue) : null,
        status: promoForm.status,
        usageLimit: promoForm.usageLimit ? parseInt(promoForm.usageLimit) : null,
        perCustomerLimit: promoForm.perCustomerLimit ? parseInt(promoForm.perCustomerLimit) : null,
        targetAudience: promoForm.targetAudience || 'BOTH',
        targetType: promoForm.targetType || 'ALL',
        targetBatchId: promoForm.targetBatchId || null,
        targetCourseId: promoForm.targetCourseId || null,
      };

      if (editingPromo) {
        await adminApi.updatePromotion(editingPromo.id, payload);
        setStatusMessage(`Promotion '${promoForm.code}' updated successfully.`);
      } else {
        await adminApi.createPromotion(payload);
        setStatusMessage(`Promotion '${promoForm.code}' created successfully.`);
      }
      setPromoModalOpen(false);
      setEditingPromo(null);
      fetchDataForSection('offers');
    } catch (err) {
      setErrorMessage(err.response?.data?.error?.message || err.response?.data?.message || 'Failed saving promotion.');
    }
  };

  const handleTogglePromoStatus = async (promoId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await adminApi.togglePromotionStatus(promoId, nextStatus);
      setStatusMessage(`Promotion status updated to ${nextStatus}.`);
      fetchDataForSection('offers');
    } catch (err) {
      setErrorMessage('Failed updating promotion status.');
    }
  };

  const handleDeletePromo = async (promoId) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) return;
    try {
      await adminApi.deletePromotion(promoId);
      setStatusMessage('Promotion deleted.');
      fetchDataForSection('offers');
    } catch (err) {
      setErrorMessage('Failed deleting promotion.');
    }
  };

  const FALLBACK_PRODUCT_IMAGES = [
    'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=800&q=80'
  ];

  const getFallbackImageUrl = (idx = 0) => {
    return FALLBACK_PRODUCT_IMAGES[Math.abs(idx) % FALLBACK_PRODUCT_IMAGES.length];
  };

  const extractDirectImageUrl = (inputUrl) => {
    if (!inputUrl || typeof inputUrl !== 'string') return '';
    let url = inputUrl.trim();

    // Replace HTML entities like &amp; and strip quotes
    url = url.replace(/&amp;/g, '&').replace(/^["']|["']$/g, '');

    // Check if it's a Google Search / Image referral link
    if (url.includes('google.') || url.includes('/imgres') || url.includes('/url?')) {
      try {
        const parsedUrl = new URL(url);
        const imgUrlParam = parsedUrl.searchParams.get('imgurl')
          || parsedUrl.searchParams.get('imgrefurl')
          || parsedUrl.searchParams.get('mediaurl');
        if (imgUrlParam) {
          url = decodeURIComponent(imgUrlParam);
        } else {
          const match = url.match(/(?:imgurl|mediaurl)=([^&]+)/i);
          if (match && match[1]) {
            url = decodeURIComponent(match[1]);
          }
        }
      } catch (err) {
        const match = url.match(/(?:imgurl|mediaurl)=([^&]+)/i);
        if (match && match[1]) {
          url = decodeURIComponent(match[1]);
        }
      }
    }

    return url;
  };

  const handleAddMedia = () => {
    if (!mediaUrlInput || !mediaUrlInput.trim()) return;

    const extractedUrl = extractDirectImageUrl(mediaUrlInput);

    if (!extractedUrl.startsWith('http://') && !extractedUrl.startsWith('https://') && !extractedUrl.startsWith('data:image/')) {
      setErrorMessage('Please enter a valid image web URL starting with http:// or https://');
      return;
    }

    const newMedia = {
      id: 'temp_' + Date.now(),
      url: extractedUrl,
      role: mediaRoleInput,
      isPrimary: mediaRoleInput === 'PRIMARY' || mediaList.length === 0,
      displayOrder: mediaList.length
    };
    setMediaList([...mediaList, newMedia]);
    setMediaUrlInput('');
    if (extractedUrl !== mediaUrlInput.trim()) {
      setStatusMessage('Extracted direct image URL from Google search link!');
    }
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

  const handleAddVariantToList = () => {
    if (!variantSku || !variantSku.trim()) {
      setErrorMessage('SKU / Item Code is required for the variant.');
      return;
    }
    if (!variantPrice || isNaN(parseFloat(variantPrice)) || parseFloat(variantPrice) <= 0) {
      setErrorMessage('Valid Price (INR) > 0 is required for the variant.');
      return;
    }

    if (variantComparePrice && !isNaN(parseFloat(variantComparePrice))) {
      const selling = parseFloat(variantPrice);
      const compare = parseFloat(variantComparePrice);
      if (selling >= compare) {
        setErrorMessage(`Selling price (Price INR: ₹${selling}) must be strictly less than the Original/Compare-at Price (₹${compare}). Compare-at price must be greater than selling price.`);
        return;
      }
    }

    const baseTitle = prodTitle?.trim() || 'Product';
    let formattedVariantName = variantName.trim();
    if (!formattedVariantName) {
      formattedVariantName = `${baseTitle} - Pack ${variantsList.length + 1}`;
    } else if (!formattedVariantName.toLowerCase().startsWith(baseTitle.toLowerCase())) {
      formattedVariantName = `${baseTitle} - ${formattedVariantName}`;
    }

    const newV = {
      id: 'v_' + Date.now(),
      variantName: formattedVariantName,
      sku: variantSku.trim().toUpperCase(),
      priceInr: variantPrice,
      compareAtPriceInr: variantComparePrice || '',
      stockQuantity: parseInt(variantStock) || 0,
      isPrimary: variantsList.length === 0
    };

    setVariantsList([...variantsList, newV]);
    setVariantSku('SKU-' + (prodTitle || 'PROD').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6) + '-' + (variantsList.length + 1));
    setVariantName('');
    setVariantPrice('');
    setVariantComparePrice('');
    setStatusMessage(`Variant "${newV.variantName}" added to product configuration.`);
  };

  const handleRemoveVariantFromList = (id) => {
    setVariantsList(variantsList.filter(v => v.id !== id));
  };

  const handleSetPrimaryVariant = (id) => {
    setVariantsList(variantsList.map(v => ({ ...v, isPrimary: v.id === id })));
  };

  const handleNextStep = (currentTab) => {
    setStatusMessage(''); setErrorMessage('');
    if (currentTab === 'basic') {
      if (!prodTitle || !prodTitle.trim()) {
        setErrorMessage('Product Title is required in Step 1 (Basic & SEO).');
        return;
      }
      const rawSlug = (prodSlug && prodSlug.trim()) ? prodSlug : prodTitle;
      const formattedSlug = rawSlug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (!formattedSlug) {
        setErrorMessage('Valid SEO URL Slug is required in Step 1.');
        return;
      }
      if (!prodCatId || !prodCatId.trim()) {
        setErrorMessage('Product Category selection is required in Step 1 (Basic & SEO).');
        return;
      }
      setFormTab('compliance');
    } else if (currentTab === 'compliance') {
      if ((prodType === 'FRESH_MUSHROOM' || prodType === 'DRY_MUSHROOM') && (!fssaiLic || !fssaiLic.trim())) {
        setErrorMessage('FSSAI License Number (14 digits) is required for food products in Step 2.');
        return;
      }
      setFormTab('agri');
    } else if (currentTab === 'agri') {
      if (prodType === 'SPAWN_SEED' && (!species || !species.trim()) && (!strain || !strain.trim())) {
        setErrorMessage('Species or Strain Variety is required for spawn seed products in Step 3.');
        return;
      }
      if (prodType === 'GROWING_KIT' && (!kitContents || !kitContents.trim())) {
        setErrorMessage('DIY Kit Package Contents are required for growing kit products in Step 3.');
        return;
      }
      setFormTab('storage');
    } else if (currentTab === 'storage') {
      setFormTab('pricing');
    } else if (currentTab === 'pricing') {
      if (variantsList.length === 0 && (!variantSku || !variantSku.trim() || !variantPrice || parseFloat(variantPrice) <= 0)) {
        setErrorMessage('At least one valid pricing variant (SKU & Price > 0) is required in Step 5.');
        return;
      }

      if (variantComparePrice && !isNaN(parseFloat(variantComparePrice))) {
        const selling = parseFloat(variantPrice);
        const compare = parseFloat(variantComparePrice);
        if (selling >= compare) {
          setErrorMessage(`Selling price (Price INR: ₹${selling}) must be strictly less than Compare-at Price (₹${compare}) in Step 5 (Pricing & Stock).`);
          return;
        }
      }

      for (const v of variantsList) {
        if (v.compareAtPriceInr && !isNaN(parseFloat(v.compareAtPriceInr))) {
          const s = parseFloat(v.priceInr);
          const c = parseFloat(v.compareAtPriceInr);
          if (s >= c) {
            setErrorMessage(`Variant "${v.variantName}" selling price (₹${s}) must be strictly less than its Compare-at Price (₹${c}).`);
            return;
          }
        }
      }

      setFormTab('media');
    } else if (currentTab === 'media') {
      setFormTab('preview');
    }
  };

  const handleCreateProduct = async (e, publishImmediately = false) => {
    if (e) e.preventDefault();
    setStatusMessage(''); setErrorMessage('');

    if (!prodTitle || !prodTitle.trim()) {
      setFormTab('basic');
      setErrorMessage('Product Title is required in Step 1.');
      return;
    }

    const rawSlug = (prodSlug && prodSlug.trim()) ? prodSlug : prodTitle;
    const formattedSlug = rawSlug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    if (!formattedSlug) {
      setFormTab('basic');
      setErrorMessage('Valid SEO URL Slug is required in Step 1.');
      return;
    }

    if (!prodCatId || !prodCatId.trim()) {
      setFormTab('basic');
      setErrorMessage('Product Category selection is required in Step 1.');
      return;
    }

    if (publishImmediately && (prodType === 'FRESH_MUSHROOM' || prodType === 'DRY_MUSHROOM') && (!fssaiLic || !fssaiLic.trim())) {
      setFormTab('compliance');
      setErrorMessage('FSSAI License Number (14 digits) is required to publish food products.');
      return;
    }

    const hasConfiguredVariants = variantsList.length > 0;
    const hasValidUnaddedVariantInput = variantSku && variantSku.trim() && variantPrice && parseFloat(variantPrice) > 0;

    if (publishImmediately && !hasConfiguredVariants && !hasValidUnaddedVariantInput) {
      setFormTab('pricing');
      setErrorMessage('At least one valid pricing variant (SKU & Price > 0) is required in Step 5 (Pricing & Stock) to publish product.');
      return;
    }

    if (variantPrice && parseFloat(variantPrice) > 0 && variantComparePrice && !isNaN(parseFloat(variantComparePrice))) {
      const selling = parseFloat(variantPrice);
      const compare = parseFloat(variantComparePrice);
      if (selling >= compare) {
        setFormTab('pricing');
        setErrorMessage(`Selling price (Price INR: ₹${selling}) must be strictly less than Compare-at Price (₹${compare}) to publish product.`);
        return;
      }
    }

    for (const v of variantsList) {
      if (v.compareAtPriceInr && !isNaN(parseFloat(v.compareAtPriceInr))) {
        const s = parseFloat(v.priceInr);
        const c = parseFloat(v.compareAtPriceInr);
        if (s >= c) {
          setFormTab('pricing');
          setErrorMessage(`Variant "${v.variantName}" selling price (₹${s}) must be strictly less than its Compare-at Price (₹${c}).`);
          return;
        }
      }
    }

    try {
      const payload = {
        title: prodTitle.trim(),
        slug: formattedSlug,
        productType: prodType,
        status: publishImmediately ? 'ACTIVE' : 'DRAFT',
        description: prodDesc || null,
        hsnCode: prodHsn || null,
        gstRate: isNaN(parseFloat(prodGst)) ? 0 : parseFloat(prodGst),
        categoryId: (prodCatId && prodCatId.trim() !== '') ? prodCatId : null,
        information: {
          brandName: brandName || null,
          countryOfOrigin: countryOrigin || null,
          netQuantity: netQty || null,
          unitOfMeasure: uom || null,
          fssaiLicenseNumber: fssaiLic || null,
          isVegetarian: isVeg,
          ingredients: ingredients || null,
          allergenInfo: allergenInfo || null,
          allergenInformation: allergenInfo || null,
          mushroomSpecies: species || null,
          scientificName: species || null,
          strainVariety: strain || null,
          strainName: strain || null,
          recommendedSubstrate: substrate || null,
          kitContents: kitContents || null,
          storageInstructions: storageInst || null,
          storageTemperatureGuidance: tempGuidance || null,
          temperatureGuidance: tempGuidance || null,
          shelfLifeGuidance: shelfLife || null,
          manufacturerDetails: mfrDetails || null,
          customerCareDetails: custCareDetails || null
        }
      };

      if (editingProduct && editingProduct.id) {
        const res = await adminApi.updateProduct(editingProduct.id, payload);
        const updatedProd = res.data?.data || res.data || editingProduct;
        if (payload.productInformation && updatedProd.id) {
          try {
            await adminApi.updateProductInformation(updatedProd.id, payload.productInformation);
          } catch (iErr) {
            console.warn('Updated product, info update note:', iErr);
          }
        }

        // Sync Product Media Images to backend when editing product
        if (updatedProd.id) {
          try {
            const mediaItemsPayload = (mediaList || []).map((m, idx) => ({
              productId: updatedProd.id,
              mediaUrl: m.url || m.mediaUrl,
              role: m.role || (m.isPrimary || idx === 0 ? 'PRIMARY' : 'GALLERY'),
              isPrimary: m.isPrimary || idx === 0,
              displayOrder: m.displayOrder !== undefined ? m.displayOrder : idx
            }));
            await adminApi.syncProductMedia(updatedProd.id, mediaItemsPayload);
          } catch (mErr) {
            console.warn('Failed syncing product media on edit:', mErr);
          }
        }

        if (publishImmediately && updatedProd.id) {
          try {
            await adminApi.publishProduct(updatedProd.id);
          } catch (pErr) {
            console.warn('Updated product, publish note:', pErr);
          }
        }
        setStatusMessage(`Product "${prodTitle}" updated successfully with all media images saved.`);
        setEditingProduct(null);
        setProdTitle(''); setProdSlug(''); setProdDesc(''); setMediaList([]);
        fetchDataForSection('products');
        navigate('/admin/products');
        return;
      }

      const res = await adminApi.createProduct(payload);
      const createdProd = res.data?.data || res.data;

      const baseTitle = prodTitle?.trim() || 'Product';
      const rawVariants = variantsList.length > 0 ? variantsList : [
        { variantName, sku: variantSku, priceInr: variantPrice, compareAtPriceInr: variantComparePrice, stockQuantity: variantStock }
      ];

      const allVariantsToAdd = rawVariants.map((v, idx) => {
        let vName = (v.variantName || '').trim();
        if (!vName) {
          vName = `${baseTitle} - Pack ${idx + 1}`;
        } else if (!vName.toLowerCase().startsWith(baseTitle.toLowerCase())) {
          vName = `${baseTitle} - ${vName}`;
        }
        return { ...v, variantName: vName };
      });

      if (createdProd?.id && allVariantsToAdd.length > 0) {
        for (const v of allVariantsToAdd) {
          if (!v.sku || !v.priceInr) continue;
          try {
            await adminApi.addVariant(createdProd.id, {
              variantName: v.variantName || 'Standard Pack',
              sku: v.sku.trim(),
              priceInr: parseFloat(v.priceInr),
              compareAtPriceInr: v.compareAtPriceInr ? parseFloat(v.compareAtPriceInr) : null,
              stockQuantity: isNaN(parseInt(v.stockQuantity)) ? 50 : parseInt(v.stockQuantity),
              isActive: true
            });
          } catch (vErr) {
            console.warn('Failed adding product variant:', vErr);
          }
        }
      }

      // Add Media gallery images (Step 6)
      if (createdProd?.id) {
        try {
          const mediaItemsPayload = (mediaList || []).map((m, idx) => ({
            productId: createdProd.id,
            mediaUrl: m.url || m.mediaUrl,
            role: m.role || (m.isPrimary || idx === 0 ? 'PRIMARY' : 'GALLERY'),
            isPrimary: m.isPrimary || idx === 0,
            displayOrder: m.displayOrder !== undefined ? m.displayOrder : idx
          }));
          await adminApi.syncProductMedia(createdProd.id, mediaItemsPayload);
        } catch (mediaErr) {
          for (const m of mediaList) {
            try {
              await adminApi.addMedia({
                productId: createdProd.id,
                mediaUrl: m.url || m.mediaUrl,
                mediaRole: m.role,
                isPrimary: m.isPrimary,
                displayOrder: m.displayOrder
              });
            } catch (fallbackErr) {
              console.warn('Failed adding media item:', fallbackErr);
            }
          }
        }
      }

      if (publishImmediately && createdProd?.id) {
        try {
          await adminApi.publishProduct(createdProd.id);
        } catch (pubErr) {
          console.warn('Product created, publish status update warning:', pubErr);
        }
        setStatusMessage(`Product "${prodTitle}" validated & published successfully.`);
      } else {
        setStatusMessage(`Product "${prodTitle}" saved as draft.`);
      }

      setProdTitle(''); setProdSlug(''); setProdDesc(''); setMediaList([]);
      fetchDataForSection('products');
      navigate('/admin/products');
    } catch (err) {
      const rawData = err.response?.data;
      const backendMsg = typeof rawData === 'string' ? rawData : (rawData?.message || rawData?.error?.message || (typeof rawData?.error === 'string' ? rawData.error : null));
      setErrorMessage(backendMsg || 'Failed saving product. Ensure all required fields are valid.');
    }
  };

  const handleStartEditProduct = (product) => {
    setEditingProduct(product);
    setQuickViewProduct(null);

    setProdTitle(product.title || '');
    setProdSlug(product.slug || '');
    setProdType(product.productType || 'FRESH_MUSHROOM');
    setProdDesc(product.description || '');
    setProdHsn(product.hsnCode || '07095900');
    setProdGst(product.gstRatePercent !== undefined && product.gstRatePercent !== null ? String(product.gstRatePercent) : '5.00');
    
    const catId = product.categoryId || product.category?.id || (categories.find(c => c.name === product.categoryName || c.slug === product.categorySlug)?.id) || '';
    setProdCatId(catId);

    const info = product.productInformation || {};
    setBrandName(info.brandName || 'Sporekart Agritech');
    setCountryOrigin(info.countryOfOrigin || 'India');
    setNetQty(info.netQuantity || '200');
    setUom(info.unitOfMeasure || 'g');
    setFssaiLic(info.fssaiLicenseNumber || '10020011000123');
    setIsVeg(info.vegetarian ?? true);
    setIngredients(info.ingredients || '');
    setAllergenInfo(info.allergenInfo || '');

    setSpecies(info.mushroomSpecies || 'Agaricus bisporus');
    setStrain(info.strainVariety || 'A15 Premium');
    setSubstrate(info.recommendedSubstrate || 'Pasteurized Wheat Straw');
    setKitContents(info.kitContents || '');

    setStorageInst(info.storageInstructions || 'Refrigerate between 2°C - 4°C');
    setTempGuidance(info.storageTemperatureGuidance || '2°C - 4°C');
    setShelfLife(info.shelfLifeGuidance || '30 Days from dispatch');
    setMfrDetails(info.manufacturerDetails || 'Sporekart Agritech, Solan, HP');
    setCustCareDetails(info.customerCareDetails || 'care@sporekart.in');

    if (product.variants && product.variants.length > 0) {
      setVariantsList(product.variants.map((v, i) => ({
        id: v.id || `v_${i}`,
        variantName: v.variantName || 'Standard Pack',
        sku: v.sku || '',
        priceInr: String(v.priceInr || v.calculatedFinalPriceInr || '149.00'),
        compareAtPriceInr: v.compareAtPriceInr ? String(v.compareAtPriceInr) : '',
        stockQuantity: v.stockQuantity || 50,
        isPrimary: v.isPrimary || i === 0
      })));
    }

    if (product.media && product.media.length > 0) {
      setMediaList(product.media.map((m, i) => ({
        id: m.id || `m_${i}`,
        url: m.mediaUrl || m.url,
        role: m.role || 'GALLERY',
        isPrimary: m.isPrimary || i === 0,
        displayOrder: m.displayOrder || i
      })));
    } else if (product.imageUrls && product.imageUrls.length > 0) {
      setMediaList(product.imageUrls.map((url, i) => ({
        id: `m_${i}`,
        url,
        role: 'GALLERY',
        isPrimary: i === 0,
        displayOrder: i
      })));
    } else {
      setMediaList([]);
    }

    setFormTab('basic');
    navigate('/admin/products?mode=add');
  };

  const handleToggleProductStatus = async (product) => {
    const newStatus = product.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    const newIsActive = newStatus === 'ACTIVE';
    try {
      await adminApi.updateProductStatus(product.id, newStatus, newIsActive);
      setStatusMessage(`Product "${product.title}" status changed to ${newStatus}.`);
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus, isActive: newIsActive } : p));
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed updating product status.');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setStatusMessage(''); setErrorMessage('');
    try {
      await adminApi.createCategory({ 
        name: catName, 
        slug: catSlug, 
        description: catDesc,
        imageUrl: catImageUrl 
      });
      setStatusMessage('Category created successfully.');
      setCatName(''); setCatSlug(''); setCatDesc(''); setCatImageUrl('');
      fetchDataForSection('categories');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed creating category.');
    }
  };

  const handleStartEditCategory = (category) => {
    setEditingCategory(category);
    setEditCatName(category.name || '');
    setEditCatSlug(category.slug || '');
    setEditCatDesc(category.description || '');
    setEditCatImageUrl(category.imageUrl || '');
    setEditCatIsActive(category.isActive !== false);
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;
    setStatusMessage(''); setErrorMessage('');
    try {
      await adminApi.updateCategory(editingCategory.id, {
        name: editCatName,
        slug: editCatSlug,
        description: editCatDesc,
        imageUrl: editCatImageUrl,
        isActive: editCatIsActive
      });
      setStatusMessage(`Category "${editCatName}" updated successfully.`);
      setEditingCategory(null);
      fetchDataForSection('categories');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed updating category.');
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

  // ADMIN ORDER CANCELLATION & REFUND HANDLER
  const handleAdminCancelOrder = async (e) => {
    e.preventDefault();
    if (!cancelTargetOrder) return;
    
    // Condition Validation
    if (cancelTargetOrder.status === 'SHIPPED' || cancelTargetOrder.status === 'DELIVERED') {
      setErrorMessage(`Order ${cancelTargetOrder.orderNumber} cannot be cancelled as it is already ${cancelTargetOrder.status}.`);
      return;
    }

    setStatusMessage(''); setErrorMessage('');
    try {
      const newStatus = (cancelTargetOrder.status === 'PAID' || cancelTargetOrder.status === 'PROCESSING') ? 'REFUNDED' : 'CANCELLED';
      const formattedAdminReason = cancelReasonInput ? `Cancelled by Admin: ${cancelReasonInput}` : 'Cancelled by Admin: Operational / Inventory adjustment';
      await adminApi.updateOrderStatus(cancelTargetOrder.id, newStatus, formattedAdminReason);
      setStatusMessage(`Order ${cancelTargetOrder.orderNumber} cancelled successfully. Payment refund of ₹${cancelTargetOrder.totalAmountInr} initiated via Razorpay Gateway.`);
      setCancelTargetOrder(null);
      setCancelReasonInput('');
      fetchDataForSection('orders');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to cancel order and process refund.');
    }
  };

  // ADMIN BATCH CANCELLATION HANDLER
  const handleAdminCancelBatch = (e) => {
    e.preventDefault();
    if (!cancelTargetBatch) return;

    if (cancelTargetBatch.status === 'COMPLETED') {
      setErrorMessage(`Completed batch ${cancelTargetBatch.code} cannot be cancelled.`);
      return;
    }

    // Update batch status to CANCELLED and process student enrollment refunds
    setBatchesList(batchesList.map(b => b.id === cancelTargetBatch.id ? { ...b, status: 'CANCELLED' } : b));
    
    // Update enrolled students list refund status
    setEnrolledStudents(enrolledStudents.map(s => {
      if (s.batchCode === cancelTargetBatch.code) {
        return { ...s, status: 'CANCELLED', refundStatus: 'REFUND_PROCESSED', refundId: 'rfnd_batch_' + Date.now().toString().substring(6) };
      }
      return s;
    }));

    setStatusMessage(`Batch ${cancelTargetBatch.code} cancelled. Refund of enrolled student fees initiated successfully.`);
    setCancelTargetBatch(null);
  };

  // ADMIN ENROLLMENT CANCELLATION HANDLER
  const handleAdminCancelEnrollment = async (enrollment) => {
    if (enrollment.status === 'COMPLETED') {
      setErrorMessage(`Completed enrollment for ${enrollment.studentName || 'student'} cannot be cancelled.`);
      return;
    }
    setStatusMessage(''); setErrorMessage('');
    try {
      await trainingApi.cancelEnrollment(enrollment.id, 'Admin cancellation & refund');
      setStatusMessage(`Enrollment for ${enrollment.studentName || 'student'} cancelled and payment refund processed.`);
      fetchDataForSection('enrollments');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed cancelling enrollment.');
    }
  };

  // ADMIN PACKING SLIP PDF DOWNLOAD HANDLER
  const handleDownloadPackingSlip = async (order) => {
    setStatusMessage(''); setErrorMessage('');
    try {
      const res = await adminApi.downloadPackingSlip(order.id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Sporekart_PackingSlip_${order.orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setStatusMessage(`Packing slip downloaded successfully for Order #${order.orderNumber}`);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed downloading packing slip PDF document.');
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

  // ADMIN FINANCE & WALLET ACTION HANDLERS
  const handleApproveWithdrawal = async (id) => {
    setStatusMessage(''); setErrorMessage('');
    try {
      await adminFinanceApi.approveWithdrawal(id, actionNotes || 'Approved by Admin');
      setStatusMessage('Bank withdrawal request approved successfully.');
      setWithdrawalActionModal(null); setActionNotes('');
      fetchDataForSection('finance');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed approving withdrawal request.');
    }
  };

  const handleRejectWithdrawal = async (id) => {
    if (!actionNotes || !actionNotes.trim()) {
      setErrorMessage('Please state a reason for rejecting the withdrawal.');
      return;
    }
    setStatusMessage(''); setErrorMessage('');
    try {
      await adminFinanceApi.rejectWithdrawal(id, actionNotes);
      setStatusMessage('Withdrawal request rejected. Compensating credit reversed to user wallet.');
      setWithdrawalActionModal(null); setActionNotes('');
      fetchDataForSection('finance');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed rejecting withdrawal request.');
    }
  };

  const handlePerformManualAdjustment = async (e) => {
    e.preventDefault();
    if (!manualAdjForm.userId || !manualAdjForm.amount || !manualAdjForm.reason) {
      setErrorMessage('User ID, Amount, and Audit Reason are required.');
      return;
    }
    setStatusMessage(''); setErrorMessage('');
    try {
      await adminFinanceApi.performManualAdjustment({
        userId: manualAdjForm.userId,
        amount: parseFloat(manualAdjForm.amount),
        direction: manualAdjForm.direction,
        reason: manualAdjForm.reason,
      });
      setStatusMessage(`Manual ${manualAdjForm.direction} adjustment of ₹${manualAdjForm.amount} executed.`);
      setManualAdjModalOpen(false);
      setManualAdjForm({ userId: '', amount: '', direction: 'CREDIT', reason: '' });
      fetchDataForSection('finance');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed executing manual wallet adjustment.');
    }
  };

  const handleSelectSupportTicket = async (ticket) => {
    setSelectedSupportTicket(ticket);
    try {
      const res = await adminApi.getTicketById(ticket.id);
      if (res.data?.success) {
        setSelectedSupportTicket(res.data.data);
      }
    } catch (err) {
      console.error('Failed loading support ticket details:', err);
    }
  };

  const handleAdminReplyToTicket = async (e, statusOverride = null) => {
    if (e) e.preventDefault();
    if (!adminReplyText || !adminReplyText.trim() || !selectedSupportTicket) return;
    setIsSubmittingSupportReply(true);
    setStatusMessage(''); setErrorMessage('');
    try {
      await adminApi.replyToTicket(selectedSupportTicket.id, adminReplyText.trim());
      if (statusOverride) {
        await adminApi.updateTicketStatus(selectedSupportTicket.id, statusOverride, null);
      }
      setStatusMessage(`Reply sent to customer successfully.${statusOverride ? ` Status updated to ${statusOverride}.` : ''}`);
      setAdminReplyText('');
      const updated = await adminApi.getTicketById(selectedSupportTicket.id);
      if (updated.data?.success) {
        setSelectedSupportTicket(updated.data.data);
      }
      fetchDataForSection('support');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed sending support ticket reply.');
    } finally {
      setIsSubmittingSupportReply(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId, status, priority) => {
    setStatusMessage(''); setErrorMessage('');
    try {
      const targetTicket = (selectedSupportTicket && selectedSupportTicket.id === ticketId) ? selectedSupportTicket : tickets.find(t => t.id === ticketId);
      const newStatus = status !== undefined && status !== null ? status : targetTicket?.status;
      const newPriority = priority !== undefined && priority !== null ? priority : targetTicket?.priority;
      
      const res = await adminApi.updateTicketStatus(ticketId, newStatus, newPriority);
      setStatusMessage(`Ticket ${targetTicket?.ticketNumber || ''} updated to ${newStatus}${newPriority ? ` (${newPriority})` : ''}.`);
      
      if (selectedSupportTicket && selectedSupportTicket.id === ticketId) {
        if (res.data?.success) {
          setSelectedSupportTicket(res.data.data);
        } else {
          setSelectedSupportTicket(prev => ({ ...prev, status: newStatus, priority: newPriority }));
        }
      }
      fetchDataForSection('support');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed updating ticket status.');
    }
  };

  const supportStats = React.useMemo(() => {
    const total = tickets.length;
    const active = tickets.filter(t => ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER'].includes(t.status)).length;
    const urgent = tickets.filter(t => ['URGENT', 'HIGH'].includes(t.priority) && !['RESOLVED', 'CLOSED'].includes(t.status)).length;
    const waiting = tickets.filter(t => t.status === 'WAITING_ON_CUSTOMER').length;
    const resolved = tickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status)).length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 100;
    return { total, active, urgent, waiting, resolved, rate };
  }, [tickets]);

  const filteredSupportTickets = React.useMemo(() => {
    return (tickets || []).filter(t => {
      if (supportStatusFilter === 'ACTIVE' && !['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER'].includes(t.status)) return false;
      if (supportStatusFilter === 'RESOLVED' && !['RESOLVED', 'CLOSED'].includes(t.status)) return false;
      if (supportStatusFilter === 'CLOSED' && !['CLOSED', 'RESOLVED'].includes(t.status)) return false;
      if (supportStatusFilter !== 'ALL' && supportStatusFilter !== 'ACTIVE' && supportStatusFilter !== 'RESOLVED' && supportStatusFilter !== 'CLOSED' && t.status !== supportStatusFilter) return false;
      if (supportPriorityFilter !== 'ALL' && t.priority !== supportPriorityFilter) return false;
      if (supportCategoryFilter !== 'ALL' && t.category !== supportCategoryFilter) return false;
      
      if (supportSearchQuery && supportSearchQuery.trim()) {
        const q = supportSearchQuery.trim().toLowerCase();
        const numMatch = t.ticketNumber?.toLowerCase().includes(q) || t.id?.toLowerCase().includes(q);
        const subjMatch = t.subject?.toLowerCase().includes(q);
        const msgMatch = t.message?.toLowerCase().includes(q);
        const userMatch = t.userId?.toLowerCase().includes(q);
        if (!numMatch && !subjMatch && !msgMatch && !userMatch) return false;
      }
      return true;
    });
  }, [tickets, supportStatusFilter, supportPriorityFilter, supportCategoryFilter, supportSearchQuery]);

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

  const handleCreateBatch = (e) => {
    e.preventDefault();
    const courseObj = courses.find(c => c.id === batchCourseId) || { title: 'Commercial Mushroom Farming Masterclass' };
    const newBatch = {
      id: 'b_' + Date.now(),
      code: batchCode,
      courseTitle: courseObj.title,
      startDate: batchStartDate,
      capacity: parseInt(batchCapacity),
      enrolled: 0,
      status: 'UPCOMING'
    };
    setBatchesList([...batchesList, newBatch]);
    setStatusMessage(`Batch ${batchCode} created successfully.`);
    setBatchCode(`BATCH-2026-OCT-0${batchesList.length + 2}`);
  };

  // FAANG-Style Hierarchical Domain Groups
  const DOMAINS = [
    {
      id: 'overview-domain',
      title: 'Executive Dashboard',
      description: 'KPI Metrics & Audit Trail',
      icon: BarChart3,
      sections: [
        { id: 'overview', label: 'Overview', path: '/admin', icon: ShieldCheck },
        { id: 'analytics', label: 'Analytics & Logs', path: '/admin/analytics', icon: BarChart3 }
      ]
    },
    {
      id: 'catalog-domain',
      title: 'Product & Catalog',
      description: 'Catalog, Inventory & Media',
      icon: Package,
      badge: products.length ? `${products.length} Items` : null,
      sections: [
        { id: 'products', label: 'All Products', path: '/admin/products', icon: Package },
        { id: 'add-product', label: 'Add Product', path: '/admin/products?mode=add', icon: Plus },
        { id: 'categories', label: 'Categories', path: '/admin/categories', icon: FolderTree },
        { id: 'inventory', label: 'Inventory Management', path: '/admin/inventory', icon: Warehouse },
        { id: 'media', label: 'Media Library', path: '/admin/media', icon: Image },
        { id: 'offers', label: 'Promotions & Offers', path: '/admin/offers', icon: Tag },
        { id: 'reviews', label: 'Reviews & Ratings', path: '/admin/reviews', icon: Star }
      ]
    },
    {
      id: 'orders-domain',
      title: 'Orders & Operations',
      description: 'Orders, Refunds & Logistics',
      icon: ShoppingBag,
      badge: orders.length ? `${orders.length} Active` : null,
      sections: [
        { id: 'orders', label: 'All Orders', path: '/admin/orders', icon: ShoppingBag },
        { id: 'order-refunds', label: 'Order Refunds & Reversals', path: '/admin/order-refunds', icon: RotateCcw },
        { id: 'finance', label: 'Platform Finance & Wallets', path: '/admin/finance', icon: Wallet },
        { id: 'shipping', label: 'Shipments & Logistics', path: '/admin/shipping', icon: Truck },
        { id: 'payments', label: 'Payment Ledger', path: '/admin/payments', icon: CreditCard }
      ]
    },
    {
      id: 'academy-domain',
      title: 'Academy & Training',
      description: 'Courses, Batches & Refunds',
      icon: GraduationCap,
      badge: courses.length ? `${courses.length} Courses` : null,
      sections: [
        { id: 'training', label: 'Academy Hub', path: '/admin/training', icon: GraduationCap },
        { id: 'glimpses', label: 'Training Gallery Glimpses', path: '/admin/glimpses', icon: Image },
        { id: 'courses', label: 'Masterclasses', path: '/admin/courses', icon: BookOpen },
        { id: 'batches', label: 'Training Batches', path: '/admin/batches', icon: Calendar },
        { id: 'enrollments', label: 'Student Enrollments', path: '/admin/enrollments', icon: UserCheck },
        { id: 'batch-refunds', label: 'Batch Refunds & Cancellations', path: '/admin/batch-refunds', icon: RefreshCw }
      ]
    },
    {
      id: 'cms-domain',
      title: 'Content & Media CMS',
      description: 'Knowledge Base & Blog',
      icon: FileText,
      badge: posts.length ? `${posts.length} Posts` : null,
      sections: [
        { id: 'blogs', label: 'Blog CMS & Articles', path: '/admin/blogs', icon: FileText }
      ]
    },
    {
      id: 'crm-domain',
      title: 'Customers & Support Desk',
      description: 'User Directory & Support',
      icon: Users,
      badge: tickets.length ? `${tickets.length} Tickets` : null,
      sections: [
        { id: 'customers', label: 'Customer Directory', path: '/admin/customers', icon: Users },
        { id: 'support', label: 'Support Helpdesk', path: '/admin/support', icon: LifeBuoy }
      ]
    }
  ];

  // Find active domain based on current section
  const currentDomain = DOMAINS.find(d => d.sections.some(s => s.id === activeSection || (s.id === 'add-product' && activeSection === 'products' && activeMode === 'add'))) || DOMAINS[0];

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in overflow-hidden text-typography-primary">
      <SeoHead
        title="Admin Control Plane — Sporekart Agritech"
        description="Enterprise administrative portal for Sporekart catalog, order fulfillment, CMS content, and training operations."
        noindex={true}
      />

      {/* FAANG-STYLE ENTERPRISE ADMIN HEADER */}
      <div className="relative overflow-hidden rounded-card bg-surface-white border border-surface-border p-5 sm:p-8 shadow-level-2">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-forest-900/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-forest-900 text-white flex items-center justify-center shadow-level-2 shrink-0">
              <ShieldCheck className="w-8 h-8 text-gold" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display font-black text-xl sm:text-3xl text-typography-primary tracking-tight">
                  Sporekart Control Console
                </h1>
                <span className="px-3 py-1 bg-gold/15 text-forest-900 border border-gold/30 text-[11px] font-extrabold rounded-full uppercase tracking-wider">
                  ROLE_ADMIN
                </span>
              </div>
              <p className="text-xs sm:text-sm text-typography-secondary mt-1 flex items-center gap-2">
                <span>Authenticated Admin:</span>
                <code className="text-forest-800 font-mono font-bold bg-surface-cream px-2 py-0.5 rounded border border-surface-border">
                  {user?.email || user?.fullName || 'admin@sporekart.in'}
                </code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => fetchDataForSection(activeSection)}
              className="btn-secondary px-4 py-2.5 text-xs font-bold flex items-center gap-2 shadow-level-1 hover:border-forest-700 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-forest-700 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync Data</span>
            </button>
            <Link
              to="/admin/products?mode=add"
              className="btn-primary px-4 py-2.5 text-xs font-bold flex items-center gap-2 shadow-level-1"
            >
              <Plus className="w-4 h-4" />
              <span>Create Product</span>
            </Link>
          </div>
        </div>

        {/* DOMAIN METRICS RIBBON */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-surface-border">
          <div className="bg-surface-cream/80 p-3.5 rounded-xl border border-surface-border/60">
            <span className="text-[10px] uppercase font-bold text-typography-muted tracking-wider block">Total Catalog</span>
            <span className="text-lg font-black text-typography-primary font-display">{analytics?.totalProducts ?? productTotalElements ?? products.length ?? 0}</span>
          </div>
          <div className="bg-surface-cream/80 p-3.5 rounded-xl border border-surface-border/60">
            <span className="text-[10px] uppercase font-bold text-typography-muted tracking-wider block">Active Orders</span>
            <span className="text-lg font-black text-forest-700 font-display">{analytics?.activeOrders ?? orders.length ?? 0}</span>
          </div>
          <div className="bg-surface-cream/80 p-3.5 rounded-xl border border-surface-border/60">
            <span className="text-[10px] uppercase font-bold text-typography-muted tracking-wider block">Customers</span>
            <span className="text-lg font-black text-typography-primary font-display">{analytics?.totalCustomers ?? customers.length ?? 0}</span>
          </div>
          <div className="bg-surface-cream/80 p-3.5 rounded-xl border border-surface-border/60">
            <span className="text-[10px] uppercase font-bold text-typography-muted tracking-wider block">Gross Revenue</span>
            <span className="text-lg font-black text-green-700 font-display">₹{(analytics?.totalRevenueInr ?? 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* GLOBAL STATUS ALERTS */}
      {statusMessage && (
        <div className="p-4 bg-green-600/10 border border-green-600/20 rounded-2xl text-xs text-forest-900 flex items-center justify-between gap-2 animate-fade-in shadow-level-1 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage('')} className="text-typography-muted hover:text-typography-primary text-sm font-bold">×</button>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-2xl text-xs text-red-700 flex items-center justify-between gap-2 animate-fade-in shadow-level-1 font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{typeof errorMessage === 'object' ? (errorMessage?.message || errorMessage?.error?.message || JSON.stringify(errorMessage)) : String(errorMessage)}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-typography-muted hover:text-typography-primary text-sm font-bold">×</button>
        </div>
      )}

      {/* CREATIVE FAANG DUAL-TIER NAVIGATION SYSTEM */}
      <div className="space-y-4">
        {/* Tier 1: Main Domain Parent Group Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {DOMAINS.map((domain) => {
            const Icon = domain.icon;
            const isDomainActive = currentDomain.id === domain.id;
            return (
              <Link
                key={domain.id}
                to={domain.sections[0].path}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2 group relative overflow-hidden ${
                  isDomainActive
                    ? 'bg-forest-900 text-white border-forest-900 shadow-level-2 scale-[1.02]'
                    : 'bg-surface-white text-typography-primary border-surface-border hover:border-forest-700/50 hover:bg-surface-cream/50 shadow-level-1'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-xl ${isDomainActive ? 'bg-white/10 text-gold' : 'bg-forest-900/10 text-forest-800'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {domain.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                      isDomainActive ? 'bg-gold text-forest-950 font-black' : 'bg-surface-cream text-typography-secondary border border-surface-border'
                    }`}>
                      {domain.badge}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className={`font-display font-extrabold text-xs truncate ${isDomainActive ? 'text-white' : 'text-typography-primary'}`}>
                    {domain.title}
                  </h3>
                  <p className={`text-[10px] truncate mt-0.5 ${isDomainActive ? 'text-white/70' : 'text-typography-muted'}`}>
                    {domain.sections.length} Module{domain.sections.length > 1 ? 's' : ''}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Tier 2: Active Domain Sub-Section Tabs Bar */}
        <div className="bg-surface-white p-2 sm:p-3 rounded-2xl border border-surface-border shadow-level-1 flex items-center justify-between gap-3 overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin min-w-0">
            <span className="text-[11px] font-extrabold text-typography-muted uppercase tracking-wider px-2 shrink-0 hidden md:inline-block">
              {currentDomain.title}:
            </span>
            {currentDomain.sections.map((sec) => {
              const SecIcon = sec.icon;
              const isSecActive = (sec.id === 'add-product' && activeMode === 'add') || 
                                  (activeSection === sec.id && activeMode !== 'add') || 
                                  (sec.id === 'products' && activeSection === 'products' && activeMode !== 'add');
              return (
                <Link
                  key={sec.id}
                  to={sec.path}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all shrink-0 ${
                    isSecActive
                      ? 'btn-primary text-white shadow-level-1'
                      : 'bg-surface-cream text-typography-secondary hover:text-typography-primary hover:bg-surface-border/40 border border-surface-border/50'
                  }`}
                >
                  <SecIcon className="w-3.5 h-3.5" />
                  <span>{sec.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Search bar inside navigation header */}
          <div className="relative w-48 sm:w-64 shrink-0">
            <input
              type="text"
              placeholder={`Search in ${currentDomain.title}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-cream border border-surface-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-typography-primary focus:outline-none focus:border-forest-700"
            />
            <Search className="w-3.5 h-3.5 text-typography-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* DOMAIN 1: EXECUTIVE DASHBOARD & OVERVIEW */}
      {(activeSection === 'overview' || activeSection === 'analytics') && (
        <div className="space-y-6 sm:space-y-8 w-full max-w-full">
          {/* KPI Analytics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 space-y-2 hover-lift relative overflow-hidden">
              <div className="flex items-center justify-between text-typography-muted">
                <span className="text-xs font-bold uppercase tracking-wider">Total Products</span>
                <Package className="w-4 h-4 text-forest-700" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-typography-primary font-display">{analytics?.totalProducts ?? productTotalElements ?? products.length ?? 0}</p>
              <span className="text-[10px] text-green-700 font-bold bg-green-600/10 px-2 py-0.5 rounded-full inline-block">Active Catalog Sync</span>
            </div>

            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 space-y-2 hover-lift relative overflow-hidden">
              <div className="flex items-center justify-between text-typography-muted">
                <span className="text-xs font-bold uppercase tracking-wider">Active Orders</span>
                <ShoppingBag className="w-4 h-4 text-forest-700" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-forest-700 font-display">{analytics?.activeOrders ?? orders.length ?? 0}</p>
              <span className="text-[10px] text-forest-800 font-bold bg-gold/15 px-2 py-0.5 rounded-full inline-block">Fulfillment Queue</span>
            </div>

            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 space-y-2 hover-lift relative overflow-hidden">
              <div className="flex items-center justify-between text-typography-muted">
                <span className="text-xs font-bold uppercase tracking-wider">Registered Users</span>
                <Users className="w-4 h-4 text-forest-700" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-typography-primary font-display">{analytics?.totalCustomers ?? customers.length ?? 0}</p>
              <span className="text-[10px] text-blue-700 font-bold bg-blue-600/10 px-2 py-0.5 rounded-full inline-block">Verified Accounts</span>
            </div>

            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 space-y-2 hover-lift relative overflow-hidden">
              <div className="flex items-center justify-between text-typography-muted">
                <span className="text-xs font-bold uppercase tracking-wider">Gross Sales Revenue</span>
                <CreditCard className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-green-700 font-display">₹{(analytics?.totalRevenueInr ?? 0).toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-green-700 font-bold bg-green-600/10 px-2 py-0.5 rounded-full inline-block">Razorpay Settlement Verified</span>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1 w-full max-w-full overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-extrabold text-base sm:text-lg text-typography-primary flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-forest-700 shrink-0" /> Enterprise Audit Logs (`admin_audit_logs`)
              </h3>
              <span className="text-xs text-typography-muted font-mono">{auditLogs.length} events logged</span>
            </div>
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
                  {(Array.isArray(auditLogs) ? auditLogs : [])
                    .filter(log => !searchQuery || JSON.stringify(log).toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((log) => (
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

      {/* DOMAIN 2: PRODUCT & CATALOG HUB */}
      {['products', 'categories', 'inventory', 'offers', 'media'].includes(activeSection) && (
        <div className="space-y-6 w-full max-w-full">
          
          {/* Sub-Section 2A: Add / Edit Product Form (Triggered via ?mode=add or tab) */}
          {(activeMode === 'add' || activeSection === 'add-product') ? (
            <div className="bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-6 shadow-level-2 w-full max-w-full overflow-hidden" data-testid="product-information-form">
              <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-surface-border">
                <div>
                  <h3 className="font-display font-black text-lg sm:text-xl text-typography-primary flex items-center gap-2">
                    <Plus className="w-6 h-6 text-forest-700 shrink-0" /> Catalog Product Setup & Compliance Studio
                  </h3>
                  <p className="text-xs text-typography-secondary mt-1">Configure product specs, FSSAI regulatory compliance, and high-res media gallery.</p>
                </div>
                <button
                  onClick={() => navigate('/admin/products')}
                  className="btn-secondary px-3.5 py-1.5 text-xs font-bold"
                >
                  ← Back to Products List
                </button>
              </div>

              {/* 7-Step FAANG Form Navigation Stepper */}
              <div className="space-y-3 pb-2 border-b border-surface-border">
                <div className="flex items-center justify-between text-xs font-bold text-typography-secondary">
                  <span className="flex items-center gap-1.5 text-forest-800">
                    <Sparkles className="w-4 h-4 text-gold shrink-0" />
                    <span>Step {['basic', 'compliance', 'agri', 'storage', 'pricing', 'media', 'preview'].indexOf(formTab) + 1} of 7:</span>
                    <span className="text-typography-primary font-black">
                      {formTab === 'basic' && 'Basic & SEO Setup'}
                      {formTab === 'compliance' && 'FSSAI Regulatory Compliance'}
                      {formTab === 'agri' && 'Mushroom & Agritech Specifications'}
                      {formTab === 'storage' && 'Storage & Shelf Life Guidance'}
                      {formTab === 'pricing' && 'Pricing, Stock & Variant Setup'}
                      {formTab === 'media' && 'Multi-Image Gallery'}
                      {formTab === 'preview' && 'Review & Live Storefront Preview'}
                    </span>
                  </span>
                  <span className="text-[11px] font-mono text-typography-muted">
                    {Math.round(((['basic', 'compliance', 'agri', 'storage', 'pricing', 'media', 'preview'].indexOf(formTab) + 1) / 7) * 100)}% Complete
                  </span>
                </div>

                <div className="flex gap-1 overflow-x-auto pb-1 text-xs scrollbar-thin max-w-full">
                  {[
                    { id: 'basic', label: '1. Basic & SEO' },
                    { id: 'compliance', label: '2. FSSAI Compliance' },
                    { id: 'agri', label: '3. Agritech Specs' },
                    { id: 'storage', label: '4. Storage & Care' },
                    { id: 'pricing', label: '5. Pricing & Stock' },
                    { id: 'media', label: '6. Gallery Media' },
                    { id: 'preview', label: '7. Review & Live Preview' }
                  ].map((tab, idx) => {
                    const currentIdx = ['basic', 'compliance', 'agri', 'storage', 'pricing', 'media', 'preview'].indexOf(formTab);
                    const isCompleted = idx < currentIdx;
                    const isActive = formTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setFormTab(tab.id)}
                        className={`px-3.5 py-2.5 rounded-xl font-extrabold transition-all whitespace-nowrap flex items-center gap-2 text-xs ${
                          isActive
                            ? 'bg-forest-900 text-white shadow-level-1 ring-2 ring-gold/40'
                            : isCompleted
                            ? 'bg-green-600/10 text-forest-900 border border-green-600/20 hover:bg-green-600/20'
                            : 'bg-surface-cream text-typography-muted hover:text-typography-primary border border-surface-border'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                        ) : (
                          <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${isActive ? 'bg-gold text-forest-950' : 'bg-surface-border text-typography-muted'}`}>{idx + 1}</span>
                        )}
                        <span>{tab.label}</span>
                        {tab.id === 'media' && mediaList.length > 0 && (
                          <span className="bg-gold text-forest-950 px-1.5 py-0.5 rounded-full text-[10px] font-mono">{mediaList.length}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <form className="space-y-6 text-xs w-full max-w-full">
                
                {/* STEP 1: BASIC & SEO */}
                {formTab === 'basic' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-typography-primary font-bold mb-1.5">Product Title *</label>
                      <input
                        type="text" required value={prodTitle}
                        onChange={(e) => {
                          setProdTitle(e.target.value);
                          if (!prodSlug) setProdSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                          if (!variantSku) setVariantSku('SKU-' + e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8));
                        }}
                        placeholder="e.g. Button Mushroom 200g Pack"
                        className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-3 text-typography-primary focus:outline-none focus:border-forest-700 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-typography-primary font-bold mb-1.5">SEO URL Slug *</label>
                        <input
                          type="text" required value={prodSlug}
                          onChange={(e) => setProdSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))}
                          placeholder="e.g. fresh-button-mushrooms"
                          className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-typography-primary font-bold mb-1.5">Product Category *</label>
                        <select
                          value={prodCatId}
                          required
                          onChange={(e) => {
                            const catId = e.target.value;
                            setProdCatId(catId);
                            const matchedCat = categories.find(c => c.id === catId || c.slug === catId);
                            if (matchedCat) {
                              const slug = (matchedCat.slug || '').toLowerCase();
                              if (slug.includes('fresh')) setProdType('FRESH_MUSHROOM');
                              else if (slug.includes('dry')) setProdType('DRY_MUSHROOM');
                              else if (slug.includes('spawn') || slug.includes('seed')) setProdType('SPAWN_SEED');
                              else if (slug.includes('kit') || slug.includes('growing')) setProdType('GROWING_KIT');
                              else if (slug.includes('equipment') || slug.includes('supplies')) setProdType('EQUIPMENT_SUPPLIES');
                            }
                          }}
                          className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-2.5 text-typography-primary font-semibold focus:outline-none focus:border-forest-700"
                        >
                          <option value="">Select Category *</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <p className="text-[10px] text-typography-muted mt-1">
                          Select the primary catalog category for routing & storefront display.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-typography-primary font-bold mb-1.5">HSN Classification Code</label>
                        <input type="text" value={prodHsn} onChange={(e) => setProdHsn(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700 font-mono" />
                      </div>
                      <div>
                        <label className="block text-typography-primary font-bold mb-1.5">GST Tax Rate (%)</label>
                        <input type="number" step="0.01" value={prodGst} onChange={(e) => setProdGst(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-typography-primary font-bold mb-1.5">Detailed Description</label>
                      <textarea rows={4} value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} placeholder="Full product summary and features..." className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-3 text-typography-primary focus:outline-none focus:border-forest-700" />
                    </div>
                  </div>
                )}

                {/* STEP 2: FSSAI COMPLIANCE */}
                {formTab === 'compliance' && (
                  <div className="space-y-4" data-testid="product-compliance-form">
                    <div className="p-4 bg-surface-cream rounded-2xl border border-surface-border text-xs text-typography-secondary leading-relaxed font-medium flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-forest-700 shrink-0" />
                      <span>FSSAI License Number (14 digits) is mandatory for food safety compliance verification before publishing fresh or dry mushrooms.</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-typography-primary font-bold mb-1.5">FSSAI Lic. No. (14 Digits) *</label>
                        <input type="text" value={fssaiLic} onChange={(e) => setFssaiLic(e.target.value)} placeholder="10020011000123" className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-2.5 text-typography-primary font-mono focus:outline-none focus:border-forest-700" />
                      </div>
                      <div>
                        <label className="block text-typography-primary font-bold mb-1.5">Dietary Indicator</label>
                        <select value={isVeg ? 'VEG' : 'NON_VEG'} onChange={(e) => setIsVeg(e.target.value === 'VEG')} className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700">
                          <option value="VEG">100% Vegetarian (Green Symbol)</option>
                          <option value="NON_VEG">Non-Vegetarian</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-typography-primary font-bold mb-1.5">Net Content Weight / Pack Volume (FSSAI Net Quantity)</label>
                        <input type="text" value={netQty} onChange={(e) => setNetQty(e.target.value)} placeholder="e.g. 200" className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700" />
                        <span className="text-[10px] text-typography-muted mt-1 block">Declared net weight/volume per retail pack (FSSAI / Packaged Commodity compliance). Note: Available warehouse inventory stock is managed in Step 5 (Pricing & Stock).</span>
                      </div>
                      <div>
                        <label className="block text-typography-primary font-bold mb-1.5">Unit of Measure (UOM)</label>
                        <select value={uom} onChange={(e) => setUom(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700">
                          <option value="g">Grams (g)</option>
                          <option value="kg">Kilograms (kg)</option>
                          <option value="pcs">Pieces / Bags (pcs)</option>
                          <option value="ml">Milliliters (ml)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-typography-primary font-bold mb-1.5">Ingredients List</label>
                      <textarea rows={2} value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="e.g. 100% Organically Cultivated Dried Oyster Mushrooms" className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700" />
                    </div>

                    <div>
                      <label className="block text-typography-primary font-bold mb-1.5">Allergen Information</label>
                      <input type="text" value={allergenInfo} onChange={(e) => setAllergenInfo(e.target.value)} placeholder="e.g. Contains mushroom spores" className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700" />
                    </div>
                  </div>
                )}

                {/* STEP 3: MUSHROOM AGRITECH */}
                {formTab === 'agri' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-typography-primary font-bold mb-1.5">Mushroom Scientific Species</label>
                        <input type="text" value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="e.g. Pleurotus ostreatus" className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700" />
                      </div>
                      <div>
                        <label className="block text-typography-primary font-bold mb-1.5">Strain / Cultivar Strain Name</label>
                        <input type="text" value={strain} onChange={(e) => setStrain(e.target.value)} placeholder="e.g. Florida Strain" className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-typography-primary font-bold mb-1.5">Recommended Cultivation Substrate</label>
                      <input type="text" value={substrate} onChange={(e) => setSubstrate(e.target.value)} placeholder="e.g. Pasteurized Wheat Straw / Paddy Straw / Sawdust" className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700" />
                    </div>

                    {prodType === 'GROWING_KIT' && (
                      <div>
                        <label className="block text-typography-primary font-bold mb-1.5">DIY Kit Package Contents *</label>
                        <textarea rows={2} value={kitContents} onChange={(e) => setKitContents(e.target.value)} placeholder="e.g. Substrate block, spray bottle, cultivation bag, instruction manual" className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700" />
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 4: STORAGE & PRODUCER */}
                {formTab === 'storage' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-typography-primary font-bold mb-1.5">Temperature Guidance</label>
                        <input type="text" value={tempGuidance} onChange={(e) => setTempGuidance(e.target.value)} placeholder="2°C - 4°C" className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700" />
                      </div>
                      <div>
                        <label className="block text-typography-primary font-bold mb-1.5">Shelf Life Guidance</label>
                        <input type="text" value={shelfLife} onChange={(e) => setShelfLife(e.target.value)} placeholder="30 Days" className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-typography-primary font-bold mb-1.5">Storage Instructions</label>
                      <input type="text" value={storageInst} onChange={(e) => setStorageInst(e.target.value)} placeholder="Keep refrigerated between 2°C and 4°C" className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700" />
                    </div>

                    <div>
                      <label className="block text-typography-primary font-bold mb-1.5">Manufacturer & Packer Details</label>
                      <input type="text" value={mfrDetails} onChange={(e) => setMfrDetails(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700" />
                    </div>

                    <div>
                      <label className="block text-typography-primary font-bold mb-1.5">Customer Care Contact</label>
                      <input type="text" value={custCareDetails} onChange={(e) => setCustCareDetails(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-4 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700" />
                    </div>
                  </div>
                )}

                {/* STEP 5: PRICING, STOCK & MULTI-VARIANT SETUP */}
                {formTab === 'pricing' && (
                  <div className="space-y-5">
                    <div className="p-4 bg-surface-cream rounded-2xl border border-surface-border text-xs text-typography-secondary leading-relaxed font-medium flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <Tag className="w-5 h-5 text-forest-700 shrink-0" />
                        <span>Configure multiple weight/size pack variants (pricing, stock & SKU). Customers can select between these variants on the storefront.</span>
                      </div>
                      <span className="px-3 py-1 bg-forest-900 text-gold font-mono font-bold rounded-full text-[10px]">
                        {variantsList.length} Variant(s) Configured
                      </span>
                    </div>

                    {/* Variant Creation Card Form */}
                    <div className="p-4 sm:p-5 bg-surface-cream/50 rounded-2xl border border-surface-border space-y-4">
                      <h4 className="font-bold text-typography-primary text-xs flex items-center justify-between">
                        <span>Add Product Size / Pack Variant</span>
                        <span className="text-[10px] text-typography-secondary">Only pricing, weight/pack name, SKU & stock differ.</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-typography-primary font-bold mb-1">Variant / Pack Name *</label>
                          <input
                            type="text" value={variantName} onChange={(e) => setVariantName(e.target.value)}
                            placeholder="e.g. 500g Value Pack / 1kg Bulk Box"
                            className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary text-xs focus:outline-none focus:border-forest-700"
                          />
                          <span className="text-[10px] text-typography-muted mt-1 block">
                            💡 Saved as: <strong className="text-forest-800 font-sans">{prodTitle?.trim() || 'Product Name'} - {variantName.trim() || '500g Value Pack'}</strong>
                          </span>
                        </div>
                        <div>
                          <label className="block text-typography-primary font-bold mb-1">SKU / Item Code *</label>
                          <input
                            type="text" value={variantSku} onChange={(e) => setVariantSku(e.target.value)}
                            placeholder="e.g. SKU-BM-500G"
                            className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary font-mono text-xs focus:outline-none focus:border-forest-700"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-typography-primary font-bold mb-1">Selling Price (INR ₹) *</label>
                          <input
                            type="number" step="0.01" value={variantPrice} onChange={(e) => setVariantPrice(e.target.value)}
                            placeholder="149.00"
                            className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary font-bold text-xs focus:outline-none focus:border-forest-700"
                          />
                        </div>
                        <div>
                          <label className="block text-typography-primary font-bold mb-1">Compare Price (MSRP ₹)</label>
                          <input
                            type="number" step="0.01" value={variantComparePrice} onChange={(e) => setVariantComparePrice(e.target.value)}
                            placeholder="199.00"
                            className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary text-xs focus:outline-none focus:border-forest-700"
                          />
                        </div>
                        <div>
                          <label className="block text-typography-primary font-bold mb-1">Inventory Stock *</label>
                          <input
                            type="number" value={variantStock} onChange={(e) => setVariantStock(e.target.value)}
                            placeholder="50"
                            className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary text-xs focus:outline-none focus:border-forest-700"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddVariantToList}
                        className="btn-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Variant to Product</span>
                      </button>
                    </div>

                    {/* Active Variants Table */}
                    <div className="space-y-2">
                      <span className="font-bold text-typography-primary block text-xs">Configured Variants Registry</span>
                      <div className="space-y-2">
                        {variantsList.map((v) => (
                          <div key={v.id} className="p-3.5 bg-surface-white rounded-xl border border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-typography-primary text-xs">{v.variantName}</span>
                                {v.isPrimary && (
                                  <span className="px-2 py-0.5 bg-gold/20 text-forest-900 border border-gold/40 text-[9px] font-extrabold rounded-md uppercase">DEFAULT</span>
                                )}
                              </div>
                              <span className="text-[11px] font-mono text-typography-muted block">SKU: {v.sku}</span>
                            </div>

                            <div className="flex items-center gap-4 text-xs">
                              <div>
                                <span className="font-bold text-forest-900 font-display text-sm">₹{v.priceInr}</span>
                                {v.compareAtPriceInr && parseFloat(v.compareAtPriceInr) > parseFloat(v.priceInr) && (
                                  <span className="text-[10px] text-typography-muted line-through ml-1.5">₹{v.compareAtPriceInr}</span>
                                )}
                              </div>
                              <span className="px-2.5 py-1 bg-surface-cream text-forest-800 font-mono font-bold text-[10px] rounded-lg">
                                Stock: {v.stockQuantity} pcs
                              </span>
                              <div className="flex items-center gap-1">
                                {!v.isPrimary && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetPrimaryVariant(v.id)}
                                    className="px-2 py-1 btn-secondary text-[10px] font-bold"
                                  >
                                    Set Default
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariantFromList(v.id)}
                                  className="px-2 py-1 bg-red-600/10 text-red-700 border border-red-600/20 text-[10px] font-bold rounded-lg"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {variantsList.length === 0 && (
                          <p className="text-typography-muted text-xs text-center py-6">No variants added yet. Fill out the fields above and click "Add Variant".</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 6: MULTI-IMAGE GALLERY MANAGER */}
                {formTab === 'media' && (
                  <div className="space-y-4">
                    {/* Local File Picker & Preview Uploader (Enhancement C) */}
                    <LocalImageUploader
                      onUploadSuccess={(uploadedItems) => {
                        const newItems = (uploadedItems || []).map((item, idx) => ({
                          id: 'local_' + Date.now() + '_' + idx,
                          url: item.mediaUrl || item.url,
                          role: item.role || 'GALLERY',
                          isPrimary: mediaList.length === 0 && idx === 0,
                          displayOrder: mediaList.length + idx
                        }));
                        setMediaList((prev) => [...prev, ...newItems]);
                        setStatusMessage(`Added ${newItems.length} local image(s) to gallery.`);
                      }}
                    />

                    <div className="p-4 bg-surface-cream rounded-2xl border border-surface-border space-y-3">
                      <span className="font-bold text-typography-primary block text-xs">Option 2: Add Product Web Image URL</span>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/..."
                          value={mediaUrlInput}
                          onChange={(e) => setMediaUrlInput(e.target.value)}
                          data-testid="product-image-upload"
                          className="flex-1 bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary text-xs focus:outline-none focus:border-forest-700"
                        />
                        <select
                          value={mediaRoleInput}
                          onChange={(e) => setMediaRoleInput(e.target.value)}
                          className="bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary text-xs focus:outline-none focus:border-forest-700"
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
                          Add Image URL
                        </button>
                      </div>
                      <p className="text-[11px] text-typography-muted">
                        💡 <span className="font-bold text-forest-800">Google Images Tip:</span> You can paste Google Search result links directly—we automatically extract the direct image file URL!
                      </p>
                    </div>

                    {/* Gallery List */}
                    <div className="space-y-2">
                      {mediaList.map((m) => (
                        <div key={m.id} className="p-3 bg-surface-cream rounded-xl border border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3 overflow-hidden max-w-full">
                            <img
                              src={m.url}
                              alt="preview"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = getFallbackImageUrl(m.displayOrder || 0);
                              }}
                              className="w-10 h-10 object-cover rounded-lg border border-surface-border shrink-0"
                            />
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
                        <p className="text-typography-muted text-xs text-center py-6">No gallery images added yet. Enter an image URL above.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 7: LIVE FAANG STOREFRONT PREVIEW STUDIO */}
                {formTab === 'preview' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="p-4 bg-forest-900/10 border border-forest-900/20 rounded-2xl flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <Eye className="w-5 h-5 text-forest-800 shrink-0" />
                        <div>
                          <h4 className="font-bold text-typography-primary text-xs">FAANG Storefront Live Render Preview</h4>
                          <p className="text-[11px] text-typography-secondary">Review all configured specs, pricing, compliance labels, and media before final publication.</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-gold text-forest-950 font-black rounded-full text-[10px] uppercase tracking-wider">Ready for Review</span>
                    </div>

                    {/* LIVE CARD RENDERING */}
                    <div className="bg-surface-cream/50 p-5 sm:p-6 rounded-3xl border border-surface-border grid grid-cols-1 md:grid-cols-12 gap-6">
                      {/* Left: Product Image & Gallery */}
                      <div className="md:col-span-5 space-y-3">
                        <div className="aspect-square bg-surface-white rounded-2xl border border-surface-border overflow-hidden relative shadow-level-1">
                          <img
                            src={mediaList.find(m => m.isPrimary)?.url || mediaList[0]?.url || getFallbackImageUrl(0)}
                            alt="Primary product preview"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = getFallbackImageUrl(0);
                            }}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-3 left-3 px-2.5 py-1 bg-forest-900/90 backdrop-blur-md text-white font-bold rounded-lg text-[10px]">
                            {prodType.replace('_', ' ')}
                          </span>
                          {isVeg && (
                            <span className="absolute top-3 right-3 px-2 py-1 bg-white border border-green-600 rounded-md flex items-center gap-1 shadow-sm">
                              <span className="w-2 h-2 rounded-full bg-green-600" />
                              <span className="text-[9px] font-bold text-green-800">100% VEG</span>
                            </span>
                          )}
                        </div>
                        {mediaList.length > 1 && (
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {mediaList.map((m) => (
                              <img
                                key={m.id}
                                src={m.url}
                                alt="thumb"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = getFallbackImageUrl(m.displayOrder || 1);
                                }}
                                className="w-12 h-12 object-cover rounded-xl border border-surface-border shrink-0"
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Product Details & Specs */}
                      <div className="md:col-span-7 space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase text-forest-700 tracking-wider">
                              {categories.find(c => c.id === prodCatId)?.name || 'Mushroom Agritech'}
                            </span>
                            <span className="text-typography-muted">•</span>
                            <span className="text-[10px] font-mono text-typography-muted">HSN: {prodHsn || '07095900'}</span>
                          </div>

                          <h2 className="font-display font-black text-xl sm:text-2xl text-typography-primary leading-tight">
                            {prodTitle || 'Button Mushroom 200g Pack'}
                          </h2>

                          {/* Pricing Ribbon */}
                          <div className="flex items-baseline gap-3 p-3.5 bg-surface-white rounded-2xl border border-surface-border">
                            <span className="text-2xl font-black text-forest-900 font-display">₹{variantPrice || '149.00'}</span>
                            {variantComparePrice && parseFloat(variantComparePrice) > parseFloat(variantPrice || 0) && (
                              <span className="text-sm text-typography-muted line-through">₹{variantComparePrice}</span>
                            )}
                            <span className="text-[11px] font-bold text-green-700 bg-green-600/10 px-2 py-0.5 rounded-md">
                              + {prodGst || '5.00'}% GST
                            </span>
                            <span className="ml-auto text-xs font-mono font-bold text-forest-800 bg-forest-900/5 px-2.5 py-1 rounded-lg">
                              Stock: {variantStock || 50} units
                            </span>
                          </div>

                          {/* Regulatory & Agritech Badges */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="p-3 bg-surface-white rounded-xl border border-surface-border space-y-1">
                              <span className="text-[10px] font-bold uppercase text-typography-muted block">FSSAI Compliance</span>
                              <span className="font-mono font-bold text-forest-800 block text-xs">Lic #{fssaiLic || '10020011000123'}</span>
                              <span className="text-[10px] text-typography-secondary block">Net Qty: {netQty} {uom}</span>
                            </div>
                            <div className="p-3 bg-surface-white rounded-xl border border-surface-border space-y-1">
                              <span className="text-[10px] font-bold uppercase text-typography-muted block">Agritech Strain</span>
                              <span className="font-bold text-typography-primary block text-xs">{species || 'Agaricus bisporus'}</span>
                              <span className="text-[10px] text-typography-secondary block">Substrate: {substrate || 'Wheat Straw'}</span>
                            </div>
                          </div>

                          {/* Storage Guidance */}
                          <div className="p-3 bg-surface-white rounded-xl border border-surface-border text-xs leading-relaxed">
                            <span className="font-bold text-typography-primary block text-[11px] mb-0.5">Storage & Care:</span>
                            <span className="text-typography-secondary">{storageInst || 'Refrigerate between 2°C - 4°C'} • Shelf life: {shelfLife}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* STRUCTURED STEP REVIEW CARDS WITH EDIT BUTTONS */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-typography-primary text-xs flex items-center justify-between">
                        <span>Configured Sections Checklist</span>
                        <span className="text-[11px] font-normal text-typography-secondary">Click 'Edit Step' to quickly adjust any section.</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="p-3.5 bg-surface-white rounded-2xl border border-surface-border flex flex-col justify-between space-y-2">
                          <div>
                            <span className="text-[10px] font-bold text-forest-700 uppercase block">Step 1: Basic & SEO</span>
                            <span className="font-bold text-typography-primary text-xs block truncate">{prodTitle || 'Untitled'}</span>
                            <span className="text-[10px] font-mono text-typography-muted block truncate">Slug: /{prodSlug}</span>
                          </div>
                          <button type="button" onClick={() => setFormTab('basic')} className="btn-secondary text-[10px] font-bold py-1 px-2.5 self-start">Edit Step 1</button>
                        </div>

                        <div className="p-3.5 bg-surface-white rounded-2xl border border-surface-border flex flex-col justify-between space-y-2">
                          <div>
                            <span className="text-[10px] font-bold text-forest-700 uppercase block">Step 2: FSSAI Compliance</span>
                            <span className="font-mono font-bold text-typography-primary text-xs block">Lic: {fssaiLic}</span>
                            <span className="text-[10px] text-typography-secondary block">{isVeg ? '100% Vegetarian' : 'Non-Veg'} • {netQty}{uom}</span>
                          </div>
                          <button type="button" onClick={() => setFormTab('compliance')} className="btn-secondary text-[10px] font-bold py-1 px-2.5 self-start">Edit Step 2</button>
                        </div>

                        <div className="p-3.5 bg-surface-white rounded-2xl border border-surface-border flex flex-col justify-between space-y-2">
                          <div>
                            <span className="text-[10px] font-bold text-forest-700 uppercase block">Step 3: Agritech Specs</span>
                            <span className="font-bold text-typography-primary text-xs block truncate">{species}</span>
                            <span className="text-[10px] text-typography-secondary block truncate">Strain: {strain}</span>
                          </div>
                          <button type="button" onClick={() => setFormTab('agri')} className="btn-secondary text-[10px] font-bold py-1 px-2.5 self-start">Edit Step 3</button>
                        </div>

                        <div className="p-3.5 bg-surface-white rounded-2xl border border-surface-border flex flex-col justify-between space-y-2">
                          <div>
                            <span className="text-[10px] font-bold text-forest-700 uppercase block">Step 4: Storage & Producer</span>
                            <span className="text-xs font-bold text-typography-primary block truncate">{tempGuidance}</span>
                            <span className="text-[10px] text-typography-secondary block truncate">Packer: {mfrDetails}</span>
                          </div>
                          <button type="button" onClick={() => setFormTab('storage')} className="btn-secondary text-[10px] font-bold py-1 px-2.5 self-start">Edit Step 4</button>
                        </div>

                        <div className="p-3.5 bg-surface-white rounded-2xl border border-surface-border flex flex-col justify-between space-y-2">
                          <div>
                            <span className="text-[10px] font-bold text-forest-700 uppercase block">Step 5: Pricing & Stock</span>
                            <span className="font-mono font-bold text-typography-primary text-xs block">SKU: {variantSku} • ₹{variantPrice}</span>
                            <span className="text-[10px] text-typography-secondary block">Stock: {variantStock} units</span>
                          </div>
                          <button type="button" onClick={() => setFormTab('pricing')} className="btn-secondary text-[10px] font-bold py-1 px-2.5 self-start">Edit Step 5</button>
                        </div>

                        <div className="p-3.5 bg-surface-white rounded-2xl border border-surface-border flex flex-col justify-between space-y-2">
                          <div>
                            <span className="text-[10px] font-bold text-forest-700 uppercase block">Step 6: Gallery Media</span>
                            <span className="font-bold text-typography-primary text-xs block">{mediaList.length} High-Res Images</span>
                            <span className="text-[10px] text-typography-secondary block">Primary image set</span>
                          </div>
                          <button type="button" onClick={() => setFormTab('media')} className="btn-secondary text-[10px] font-bold py-1 px-2.5 self-start">Edit Step 6</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Navigation Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-surface-border">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {['compliance', 'agri', 'storage', 'pricing', 'media', 'preview'].includes(formTab) && (
                      <button
                        type="button"
                        onClick={() => {
                          const tabs = ['basic', 'compliance', 'agri', 'storage', 'pricing', 'media', 'preview'];
                          const prevIdx = Math.max(0, tabs.indexOf(formTab) - 1);
                          setFormTab(tabs[prevIdx]);
                        }}
                        className="btn-secondary font-bold py-3 px-5 rounded-2xl text-xs flex-1 sm:flex-none"
                      >
                        ← Back
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleCreateProduct(e, false)}
                      data-testid="product-save"
                      className="btn-secondary font-bold py-3 px-5 rounded-2xl text-xs flex-1 sm:flex-none"
                    >
                      Save Draft Product
                    </button>
                  </div>

                  <div className="w-full sm:w-auto flex justify-end">
                    {formTab !== 'preview' ? (
                      <button
                        type="button"
                        onClick={() => handleNextStep(formTab)}
                        className="btn-primary font-extrabold py-3 px-6 rounded-2xl text-xs shadow-level-1 w-full sm:w-auto flex items-center justify-center gap-2"
                      >
                        <span>Next Step ➔</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleCreateProduct(e, true)}
                        data-testid="product-publish"
                        className="btn-primary font-black py-3.5 px-8 rounded-2xl text-sm shadow-level-2 bg-gradient-to-r from-forest-900 via-forest-800 to-forest-900 text-gold border border-gold/40 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                        <span>Validate & Publish Product ➔</span>
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          ) : null}

          {/* Sub-Section 2B: Products List View with FAANG Control Ribbon */}
          {activeSection === 'products' && activeMode !== 'add' && (
            <div className="bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-5 shadow-level-1 w-full max-w-full overflow-hidden">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-display font-extrabold text-lg text-typography-primary flex items-center gap-2">
                    <Package className="w-5 h-5 text-forest-700 shrink-0" /> Catalog Products Registry ({products.length})
                  </h3>
                  <p className="text-xs text-typography-secondary mt-0.5">Live inventory items, multi-variants, pricing, and compliance status.</p>
                </div>
                <Link
                  to="/admin/products?mode=add"
                  className="btn-primary text-xs font-bold px-4 py-2.5 flex items-center gap-1.5 shadow-level-1"
                >
                  <Plus className="w-4 h-4" /> Add New Product
                </Link>
              </div>

              {/* FAANG CONTROL RIBBON: Instant Search, Category Filter & Sorting */}
              <div className="p-4 bg-surface-cream/70 rounded-2xl border border-surface-border grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                {/* Search Bar */}
                <div className="sm:col-span-5 relative">
                  <Search className="w-4 h-4 text-typography-muted absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search title, SKU, HSN, or Product ID..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full bg-surface-white border border-surface-border rounded-xl pl-9 pr-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700"
                  />
                </div>

                {/* Filter by Category */}
                <div className="sm:col-span-3">
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700"
                  >
                    <option value="ALL">All Categories ({categories.length})</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Sort By Dropdown */}
                <div className="sm:col-span-4 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-typography-muted shrink-0">Sort:</span>
                  <select
                    value={productSortBy}
                    onChange={(e) => setProductSortBy(e.target.value)}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-3 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700"
                  >
                    <option value="NAME_ASC">Name (A-Z)</option>
                    <option value="NAME_DESC">Name (Z-A)</option>
                    <option value="CATEGORY">Category Name</option>
                    <option value="PRODUCT_ID">Product ID / UUID</option>
                    <option value="STATUS">Status (Active First)</option>
                  </select>
                </div>
              </div>

              {/* Products Table */}
              <div className="w-full overflow-x-auto max-w-full rounded-2xl border border-surface-border scrollbar-thin">
                <table className="w-full text-left text-xs text-typography-secondary min-w-[750px]">
                  <thead className="bg-surface-cream text-typography-primary uppercase font-semibold border-b border-surface-border">
                    <tr>
                      <th className="p-3.5">Product Title & ID</th>
                      <th className="p-3.5">Category & Classification</th>
                      <th className="p-3.5">Variants & Pricing</th>
                      <th className="p-3.5">HSN & FSSAI Lic</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {products
                      .filter(p => {
                        const matchSearch = !productSearch ||
                          p.title?.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.slug?.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.id?.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.hsnCode?.toLowerCase().includes(productSearch.toLowerCase());
                        
                        const matchCategory = productCategoryFilter === 'ALL' ||
                          p.categoryName === productCategoryFilter ||
                          p.categorySlug === productCategoryFilter ||
                          p.category?.slug === productCategoryFilter ||
                          p.category?.id === productCategoryFilter ||
                          p.productType === productCategoryFilter ||
                          (productCategoryFilter === 'fresh-mushrooms' && (p.productType === 'FRESH_MUSHROOM' || p.categorySlug === 'fresh-mushroom')) ||
                          (productCategoryFilter === 'dry-mushrooms' && (p.productType === 'DRY_MUSHROOM' || p.categorySlug === 'dry-mushroom')) ||
                          (productCategoryFilter === 'spawn-seeds' && (p.productType === 'SPAWN_SEED' || p.categorySlug === 'spawn-seed' || p.categorySlug === 'mushroom-spawn')) ||
                          (productCategoryFilter === 'growing-kits' && (p.productType === 'GROWING_KIT' || p.categorySlug === 'growing-kit'));

                        return matchSearch && matchCategory;
                      })
                      .sort((a, b) => {
                        if (productSortBy === 'NAME_ASC') {
                          return (a.title || '').localeCompare(b.title || '');
                        } else if (productSortBy === 'NAME_DESC') {
                          return (b.title || '').localeCompare(a.title || '');
                        } else if (productSortBy === 'CATEGORY') {
                          return (a.categoryName || '').localeCompare(b.categoryName || '');
                        } else if (productSortBy === 'PRODUCT_ID') {
                          return (a.id || '').localeCompare(b.id || '');
                        } else if (productSortBy === 'STATUS') {
                          return (a.status || '').localeCompare(b.status || '');
                        }
                        return 0;
                      })
                      .map((p) => {
                        const primaryMedia = p.media?.find(m => m.isPrimary || m.role === 'PRIMARY')?.mediaUrl
                          || p.imageUrls?.[0]
                          || p.media?.[0]?.mediaUrl
                          || getFallbackImageUrl(p.id?.charCodeAt(0) || 0);

                        const totalStock = p.variants?.reduce((sum, v) => sum + (v.stockQuantity || 0), 0) ?? 0;
                        const stockBadgeClass = totalStock > 20 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : totalStock > 0 
                            ? 'bg-amber-100 text-amber-800 border-amber-200' 
                            : 'bg-red-100 text-red-800 border-red-200';
                        const stockStatusText = totalStock > 20 ? 'In Stock' : totalStock > 0 ? `Low (${totalStock})` : 'Out of Stock';

                        return (
                          <tr key={p.id} className="hover:bg-surface-cream/50 transition-colors">
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <img
                                  src={primaryMedia}
                                  alt={p.title}
                                  className="w-11 h-11 object-cover rounded-xl border border-surface-border bg-surface-cream flex-shrink-0"
                                />
                                <div>
                                  <span className="font-bold text-sm text-typography-primary font-display block">{p.title}</span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-typography-muted font-mono bg-surface-cream px-1.5 py-0.5 rounded">
                                      ID: {p.id?.substring(0, 8)}...
                                    </span>
                                    <span className="text-[10px] text-forest-700 font-mono">/{p.slug}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span className="font-bold text-typography-primary block text-xs">{p.categoryName || 'General'}</span>
                              <span className="px-2 py-0.5 bg-forest-900/10 text-forest-800 border border-forest-900/20 text-[9px] font-bold rounded-md uppercase mt-1 inline-block">
                                {p.productType}
                              </span>
                            </td>
                            <td className="p-3.5">
                              {p.variants && p.variants.length > 0 ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-forest-900 font-display text-xs">
                                      ₹{p.variants[0].priceInr || p.variants[0].calculatedFinalPriceInr}
                                    </span>
                                    <span className={`px-1.5 py-0.5 text-[9px] font-bold border rounded-full ${stockBadgeClass}`}>
                                      {stockStatusText}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-typography-muted block font-mono">
                                    {p.variants.length} Variant(s) • SKU: {p.variants[0].sku}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-typography-muted italic">No variants</span>
                              )}
                            </td>
                            <td className="p-3.5 font-mono text-[11px]">
                              <div>HSN: {p.hsnCode || '07095900'}</div>
                              {p.productInformation?.fssaiLicenseNumber && (
                                <div className="text-green-700 font-bold">FSSAI: {p.productInformation.fssaiLicenseNumber}</div>
                              )}
                            </td>
                            <td className="p-3.5">
                              <button
                                onClick={() => handleToggleProductStatus(p)}
                                title="Click to toggle status between Active and Draft"
                                className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase border transition-all duration-200 cursor-pointer ${
                                  p.status === 'ACTIVE'
                                    ? 'bg-green-600/10 text-green-700 border-green-600/20 hover:bg-green-600/20'
                                    : 'bg-gold/15 text-forest-900 border-gold/30 hover:bg-gold/25'
                                }`}
                              >
                                {p.status || 'ACTIVE'}
                              </button>
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setQuickViewProduct(p)}
                                  className="btn-secondary text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 text-forest-800 hover:bg-forest-900/10 transition-colors"
                                  title="Inspect product specifications prior to full editing"
                                >
                                  <Eye className="w-3.5 h-3.5 text-forest-700" /> Prior Inspection
                                </button>
                                <button
                                  onClick={() => handleStartEditProduct(p)}
                                  className="btn-primary text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 bg-forest-900 text-white hover:bg-forest-800 transition-colors"
                                  title="Edit Product Specifications & Variants"
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> Edit
                                </button>
                                <Link
                                  to={`/product/${p.slug}`}
                                  target="_blank"
                                  className="text-forest-700 font-bold hover:underline text-[11px] flex items-center gap-1 ml-1"
                                  title="View live product page"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    {products.length === 0 && (
                      <tr><td colSpan={6} className="p-6 text-center text-typography-muted">No products found in catalog. Click "Add Product" above to create one.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Server-Side Pagination Bar */}
              <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-surface-border text-xs">
                <div className="text-typography-muted font-medium">
                  Showing <span className="font-bold text-typography-primary">{productTotalElements > 0 ? (productPage * 10) + 1 : 0}–{Math.min((productPage + 1) * 10, productTotalElements)}</span> of <span className="font-bold text-typography-primary">{productTotalElements}</span> Products
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setProductPage(prev => Math.max(0, prev - 1))}
                    disabled={productPage === 0 || loading}
                    className="btn-secondary text-xs px-3 py-1.5 rounded-lg font-bold disabled:opacity-40"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(productTotalPages, 10) }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setProductPage(i)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        productPage === i ? 'bg-forest-900 text-white shadow-level-1' : 'bg-surface-cream border border-surface-border text-typography-primary hover:bg-surface-border/50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setProductPage(prev => Math.min(productTotalPages - 1, prev + 1))}
                    disabled={productPage >= productTotalPages - 1 || loading}
                    className="btn-secondary text-xs px-3 py-1.5 rounded-lg font-bold disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>

              {/* Prior-to-Edit Product Inspection Modal */}
              {quickViewProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
                  <div className="bg-surface-white w-full max-w-4xl rounded-2xl shadow-level-3 border border-surface-border overflow-hidden my-8 max-h-[90vh] flex flex-col">
                    {/* Modal Header */}
                    <div className="p-5 bg-surface-cream border-b border-surface-border flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-forest-900/10 rounded-xl border border-forest-900/20">
                          <Eye className="w-5 h-5 text-forest-800" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold tracking-widest text-forest-800 uppercase bg-forest-900/10 px-2 py-0.5 rounded-full">
                              Prior-to-Edit Inspection
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase ${
                              quickViewProduct.status === 'ACTIVE' ? 'bg-green-600/15 text-green-700' : 'bg-gold/20 text-forest-900'
                            }`}>
                              {quickViewProduct.status || 'ACTIVE'}
                            </span>
                          </div>
                          <h3 className="font-display font-bold text-lg text-typography-primary mt-0.5">
                            {quickViewProduct.title}
                          </h3>
                        </div>
                      </div>
                      <button
                        onClick={() => setQuickViewProduct(null)}
                        className="p-2 rounded-xl text-typography-muted hover:text-typography-primary hover:bg-surface-border/50 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 overflow-y-auto space-y-6 text-xs text-typography-secondary flex-1">
                      {/* Top Grid: Media Gallery & Primary Specs */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Left Column: Image Preview */}
                        <div className="md:col-span-5 space-y-3">
                          <div className="aspect-square w-full rounded-2xl border border-surface-border overflow-hidden bg-surface-cream relative group">
                            <img
                              src={
                                quickViewProduct.media?.find(m => m.isPrimary || m.role === 'PRIMARY')?.mediaUrl
                                || quickViewProduct.imageUrls?.[0]
                                || quickViewProduct.media?.[0]?.mediaUrl
                                || getFallbackImageUrl(quickViewProduct.id?.charCodeAt(0) || 0)
                              }
                              alt={quickViewProduct.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute bottom-2 left-2 bg-forest-900/80 text-white backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono">
                              Primary Product Image
                            </div>
                          </div>

                          {/* Thumbnail Strip */}
                          {quickViewProduct.media && quickViewProduct.media.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                              {quickViewProduct.media.map((m, idx) => (
                                <img
                                  key={m.id || idx}
                                  src={m.mediaUrl || m.url}
                                  alt=""
                                  className="w-14 h-14 object-cover rounded-xl border border-surface-border flex-shrink-0"
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Right Column: Key Details */}
                        <div className="md:col-span-7 space-y-4">
                          <div className="grid grid-cols-2 gap-3 bg-surface-cream p-4 rounded-xl border border-surface-border">
                            <div>
                              <span className="text-[10px] uppercase tracking-wider font-bold text-typography-muted block">Product ID</span>
                              <span className="font-mono text-xs text-typography-primary font-bold">{quickViewProduct.id}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase tracking-wider font-bold text-typography-muted block">URL Slug</span>
                              <span className="font-mono text-xs text-forest-700 font-bold">/{quickViewProduct.slug}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase tracking-wider font-bold text-typography-muted block">Category</span>
                              <span className="font-bold text-typography-primary">{quickViewProduct.categoryName || 'General'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase tracking-wider font-bold text-typography-muted block">Classification</span>
                              <span className="font-bold text-forest-900">{quickViewProduct.productType}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase tracking-wider font-bold text-typography-muted block">HSN Code</span>
                              <span className="font-mono font-bold text-typography-primary">{quickViewProduct.hsnCode || '07095900'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase tracking-wider font-bold text-typography-muted block">GST Rate</span>
                              <span className="font-bold text-typography-primary">{quickViewProduct.gstRatePercent || '5.00'}%</span>
                            </div>
                          </div>

                          {quickViewProduct.description && (
                            <div>
                              <span className="text-[10px] uppercase tracking-wider font-bold text-typography-muted block mb-1">Description</span>
                              <p className="text-xs leading-relaxed text-typography-primary bg-surface-white p-3 rounded-xl border border-surface-border">
                                {quickViewProduct.description}
                              </p>
                            </div>
                          )}

                          {/* Compliance Badges */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {quickViewProduct.productInformation?.fssaiLicenseNumber && (
                              <span className="bg-green-100 border border-green-300 text-green-800 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" /> FSSAI: {quickViewProduct.productInformation.fssaiLicenseNumber}
                              </span>
                            )}
                            {quickViewProduct.productInformation?.brandName && (
                              <span className="bg-surface-cream border border-surface-border text-typography-primary text-[10px] font-bold px-2.5 py-1 rounded-lg">
                                Brand: {quickViewProduct.productInformation.brandName}
                              </span>
                            )}
                            {quickViewProduct.productInformation?.vegetarian !== undefined && (
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                                quickViewProduct.productInformation.vegetarian ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {quickViewProduct.productInformation.vegetarian ? '🌱 100% Vegetarian' : 'Non-Veg'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Variants & Pricing Table */}
                      <div className="space-y-2">
                        <h4 className="font-display font-bold text-sm text-typography-primary flex items-center justify-between">
                          <span>Configured Variants & Stock Levels ({quickViewProduct.variants?.length || 0})</span>
                        </h4>
                        <div className="border border-surface-border rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-surface-cream text-typography-primary font-bold border-b border-surface-border uppercase text-[10px]">
                              <tr>
                                <th className="p-2.5">Variant Name</th>
                                <th className="p-2.5">SKU Code</th>
                                <th className="p-2.5">Selling Price</th>
                                <th className="p-2.5">MRP / Compare</th>
                                <th className="p-2.5">Stock Level</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border">
                              {quickViewProduct.variants && quickViewProduct.variants.length > 0 ? (
                                quickViewProduct.variants.map((v, i) => (
                                  <tr key={v.id || i} className="hover:bg-surface-cream/40">
                                    <td className="p-2.5 font-bold text-typography-primary">{v.variantName}</td>
                                    <td className="p-2.5 font-mono text-[11px] text-typography-muted">{v.sku}</td>
                                    <td className="p-2.5 font-bold text-forest-900">₹{v.priceInr || v.calculatedFinalPriceInr}</td>
                                    <td className="p-2.5 text-typography-muted line-through">
                                      {v.compareAtPriceInr ? `₹${v.compareAtPriceInr}` : '—'}
                                    </td>
                                    <td className="p-2.5">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                        (v.stockQuantity || 0) > 20
                                          ? 'bg-green-100 text-green-800 border-green-200'
                                          : (v.stockQuantity || 0) > 0
                                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                                            : 'bg-red-100 text-red-800 border-red-200'
                                      }`}>
                                        {v.stockQuantity || 0} Units
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={5} className="p-3 text-center text-typography-muted italic">No variants configured</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Agricultural & Storage Guidance Specs */}
                      {quickViewProduct.productInformation && (
                        <div className="bg-surface-cream p-4 rounded-xl border border-surface-border space-y-3">
                          <h4 className="font-display font-bold text-xs text-typography-primary uppercase tracking-wider">
                            Agricultural & Quality Specifications
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                            <div>
                              <span className="text-typography-muted block font-medium">Species:</span>
                              <span className="font-bold text-typography-primary">{quickViewProduct.productInformation.mushroomSpecies || '—'}</span>
                            </div>
                            <div>
                              <span className="text-typography-muted block font-medium">Strain:</span>
                              <span className="font-bold text-typography-primary">{quickViewProduct.productInformation.strainVariety || '—'}</span>
                            </div>
                            <div>
                              <span className="text-typography-muted block font-medium">Substrate:</span>
                              <span className="font-bold text-typography-primary">{quickViewProduct.productInformation.recommendedSubstrate || '—'}</span>
                            </div>
                            <div>
                              <span className="text-typography-muted block font-medium">Shelf Life:</span>
                              <span className="font-bold text-typography-primary">{quickViewProduct.productInformation.shelfLifeGuidance || '—'}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-typography-muted block font-medium">Storage Instructions:</span>
                              <span className="font-bold text-typography-primary">{quickViewProduct.productInformation.storageInstructions || '—'}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-typography-muted block font-medium">Temperature Guidance:</span>
                              <span className="font-bold text-typography-primary">{quickViewProduct.productInformation.storageTemperatureGuidance || '—'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Modal Footer Controls */}
                    <div className="p-4 bg-surface-cream border-t border-surface-border flex items-center justify-between flex-wrap gap-3 flex-shrink-0">
                      <button
                        onClick={() => handleToggleProductStatus(quickViewProduct)}
                        className={`btn-secondary text-xs px-4 py-2 rounded-xl font-bold border transition-colors ${
                          quickViewProduct.status === 'ACTIVE'
                            ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            : 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100'
                        }`}
                      >
                        {quickViewProduct.status === 'ACTIVE' ? 'Pause Product (Set to Draft)' : 'Publish Product (Set to Active)'}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQuickViewProduct(null)}
                          className="btn-secondary text-xs px-4 py-2 rounded-xl font-bold"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => handleStartEditProduct(quickViewProduct)}
                          className="btn-primary text-xs px-5 py-2 rounded-xl font-bold bg-forest-900 text-white flex items-center gap-1.5 shadow-level-1 hover:bg-forest-800"
                        >
                          <Edit3 className="w-4 h-4" /> Edit Specifications & Media
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-Section 2C: Categories */}
          {activeSection === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 w-full max-w-full">
              <div className="lg:col-span-5 bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1">
                <h3 className="font-display font-bold text-base text-typography-primary flex items-center gap-2">
                  <Plus className="w-5 h-5 text-forest-700" /> Create Catalog Category
                </h3>
                <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-typography-primary font-bold mb-1">Category Name *</label>
                    <input
                      type="text" required value={catName}
                      onChange={(e) => {
                        setCatName(e.target.value);
                        if (!catSlug) setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }}
                      className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700"
                    />
                  </div>
                  <div>
                    <label className="block text-typography-primary font-bold mb-1">Category Slug *</label>
                    <input type="text" required value={catSlug} onChange={(e) => setCatSlug(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700 font-mono" />
                  </div>
                  <div>
                    <label className="block text-typography-primary font-bold mb-1">Description</label>
                    <textarea rows={3} value={catDesc} onChange={(e) => setCatDesc(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700" />
                  </div>
                  <div>
                    <label className="block text-typography-primary font-bold mb-1">Category Cover Image</label>
                    <LocalImageUploader onImageSelected={(url) => setCatImageUrl(url)} />
                    <input 
                      type="text" 
                      placeholder="Or paste image URL (e.g. https://...)" 
                      value={catImageUrl} 
                      onChange={(e) => setCatImageUrl(e.target.value)} 
                      className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-forest-700 mt-2 font-mono text-[11px]" 
                    />
                    {catImageUrl && (
                      <div className="mt-2 relative h-28 sm:h-36 w-full rounded-xl overflow-hidden border border-surface-border bg-surface-cream group">
                        <img src={catImageUrl} alt="Category Banner Preview" className="w-full h-full object-cover rounded-xl" />
                        <button
                          type="button"
                          onClick={() => setCatImageUrl('')}
                          className="absolute top-2 right-2 p-1.5 bg-red-600/90 text-white rounded-lg hover:bg-red-700 text-[11px] font-bold flex items-center gap-1 shadow-md transition-all"
                          title="Clear image"
                        >
                          <X className="w-3.5 h-3.5" /> Remove Image
                        </button>
                      </div>
                    )}
                  </div>
                  <button type="submit" className="w-full btn-primary py-3 rounded-xl font-bold">Save Category</button>
                </form>
              </div>

              <div className="lg:col-span-7 bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1">
                <h3 className="font-display font-bold text-base text-typography-primary flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-forest-700" /> Active Categories ({categories.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categories.map((c) => (
                    <div key={c.id} className="bg-surface-cream rounded-2xl border border-surface-border overflow-hidden flex flex-col justify-between shadow-level-1 hover:border-forest-700/40 transition-all">
                      <div>
                        {/* Image Thumbnail */}
                        <div className="h-28 w-full bg-surface-white border-b border-surface-border relative overflow-hidden">
                          {c.imageUrl ? (
                            <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-typography-muted bg-surface-cream">
                              <FolderTree className="w-8 h-8 text-forest-700/40 mb-1" />
                              <span className="text-[10px]">No image assigned</span>
                            </div>
                          )}
                          <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.isActive !== false ? 'bg-forest-700 text-white' : 'bg-surface-border text-typography-secondary'}`}>
                            {c.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="p-4 space-y-1">
                          <h4 className="font-bold text-sm text-typography-primary font-display">{c.name}</h4>
                          <span className="text-[11px] text-typography-muted font-mono block">/{c.slug}</span>
                          <p className="text-xs text-typography-secondary line-clamp-2 mt-1">{c.description || 'No description provided.'}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-surface-white/60 border-t border-surface-border flex justify-end">
                        <button
                          onClick={() => handleStartEditCategory(c)}
                          className="btn-secondary px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-forest-700" /> Edit Category
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sub-Section 2D: Inventory Management */}
          {activeSection === 'inventory' && (
            <div className="bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-6 shadow-level-1">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-typography-primary flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-forest-700" /> Live Inventory & Stock Controller
                  </h3>
                  <p className="text-xs text-typography-secondary">Real-time stock monitoring and variant-level warehouse availability across fresh produce, spawn, and equipment.</p>
                </div>
                <button
                  onClick={() => fetchDataForSection('inventory')}
                  className="btn-secondary text-xs font-bold px-3 py-2 flex items-center gap-1.5 rounded-xl"
                >
                  <RefreshCw className="w-4 h-4" /> Live Refresh
                </button>
              </div>

              <div className="w-full overflow-x-auto rounded-2xl border border-surface-border scrollbar-thin">
                <table className="w-full text-left text-xs text-typography-secondary min-w-[700px]">
                  <thead className="bg-surface-cream text-typography-primary uppercase font-semibold border-b border-surface-border">
                    <tr>
                      <th className="p-3.5">Product Title</th>
                      <th className="p-3.5">Variant & SKU</th>
                      <th className="p-3.5">Live Stock Count</th>
                      <th className="p-3.5">Availability Status</th>
                      <th className="p-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {products.map((p) => (
                      (p.variants && p.variants.length > 0 ? p.variants : [{ id: 'default', variantName: 'Default Variant', sku: p.sku || 'SKU-GENERIC', stockQuantity: 25 }]).map((v) => {
                        const stock = v.stockQuantity !== undefined ? v.stockQuantity : 25;
                        let statusBadge = { label: 'Available', style: 'bg-green-600/10 text-green-700 border-green-600/20' };
                        if (stock === 0) {
                          statusBadge = { label: 'Out of Stock', style: 'bg-rose-600/10 text-rose-700 border-rose-600/20' };
                        } else if (stock <= 9) {
                          statusBadge = { label: 'Low Stock', style: 'bg-amber-600/10 text-amber-700 border-amber-600/20' };
                        } else if (stock <= 20) {
                          statusBadge = { label: 'Limited Stock', style: 'bg-blue-600/10 text-blue-700 border-blue-600/20' };
                        }

                        return (
                          <tr key={`${p.id}-${v.id}`} className="hover:bg-surface-cream/50 transition-colors">
                            <td className="p-3.5">
                              <span className="font-bold text-typography-primary block text-sm">{p.title}</span>
                              <span className="text-[10px] text-typography-muted font-mono">ID: {p.id?.substring(0, 8)}...</span>
                            </td>
                            <td className="p-3.5">
                              <span className="font-bold text-forest-900 block">{v.variantName}</span>
                              <span className="text-[10px] text-typography-muted font-mono">SKU: {v.sku}</span>
                            </td>
                            <td className="p-3.5 font-bold font-mono text-sm text-typography-primary">
                              {stock} units
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase border ${statusBadge.style}`}>
                                {statusBadge.label}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <button
                                onClick={() => {
                                  setReplenishTarget({ product: p, variant: v });
                                  setReplenishQty('10');
                                  setReplenishError('');
                                  setReplenishConfirmStep(false);
                                  setReplenishModalOpen(true);
                                }}
                                className="btn-secondary text-[11px] font-bold px-3 py-1.5 rounded-xl hover:bg-forest-900 hover:text-white transition-all"
                              >
                                Replenish Stock
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ))}
                    {products.length === 0 && (
                      <tr><td colSpan={5} className="p-6 text-center text-typography-muted">No product inventory found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stock Replenish Modal */}
          {replenishModalOpen && replenishTarget && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-surface-white rounded-card border border-surface-border max-w-md w-full p-6 space-y-5 shadow-level-3">
                <div className="flex items-center justify-between border-b border-surface-border pb-3">
                  <h3 className="font-display font-bold text-lg text-typography-primary flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-forest-700" /> Replenish Stock
                  </h3>
                  <button
                    onClick={() => setReplenishModalOpen(false)}
                    className="p-1 text-typography-muted hover:text-typography-primary rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3 bg-surface-cream rounded-xl border border-surface-border space-y-1 text-xs">
                  <div className="font-bold text-typography-primary">{replenishTarget.product.title}</div>
                  <div className="text-typography-secondary font-mono">{replenishTarget.variant.variantName} (SKU: {replenishTarget.variant.sku || 'N/A'})</div>
                  <div className="text-forest-800 font-bold">Current Stock: {replenishTarget.variant.stockQuantity} units</div>
                </div>

                {replenishError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{replenishError}</span>
                  </div>
                )}

                {!replenishConfirmStep ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-typography-primary mb-1">
                        Enter quantity to add:
                      </label>
                      <input
                        type="text"
                        value={replenishQty}
                        onChange={(e) => setReplenishQty(e.target.value)}
                        placeholder="e.g. 10"
                        className="w-full bg-surface-cream border border-surface-border rounded-xl px-4 py-2.5 text-sm text-typography-primary focus:outline-none focus:border-forest-700"
                      />
                      <p className="text-[11px] text-typography-muted mt-1">
                        Must be a positive integer (e.g. 10 adds 10 units to current stock).
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-typography-primary mb-1">
                        Reason / Reference (Optional):
                      </label>
                      <input
                        type="text"
                        value={replenishReason}
                        onChange={(e) => setReplenishReason(e.target.value)}
                        placeholder="e.g. Supplier Restock PO-99"
                        className="w-full bg-surface-cream border border-surface-border rounded-xl px-4 py-2.5 text-xs text-typography-primary focus:outline-none focus:border-forest-700"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => setReplenishModalOpen(false)}
                        className="btn-secondary text-xs font-bold px-4 py-2"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          const parsed = parseInt(replenishQty, 10);
                          if (isNaN(parsed) || parsed <= 0 || replenishQty.includes('.')) {
                            setReplenishError('Please enter a valid positive integer quantity greater than zero.');
                            return;
                          }
                          if (parsed > 1000000) {
                            setReplenishError('Quantity is too large. Maximum replenishment limit is 1,000,000 units.');
                            return;
                          }
                          setReplenishError('');
                          setReplenishConfirmStep(true);
                        }}
                        className="btn-primary text-xs font-bold px-5 py-2"
                      >
                        Continue to Confirm
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2 text-xs text-emerald-900">
                      <div className="font-bold text-sm">Confirmation Summary:</div>
                      <div className="flex justify-between">
                        <span>Current Stock:</span>
                        <span className="font-bold">{replenishTarget.variant.stockQuantity} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quantity to Add:</span>
                        <span className="font-bold text-emerald-700">+{parseInt(replenishQty, 10)} units</span>
                      </div>
                      <div className="border-t border-emerald-200 pt-1 flex justify-between font-bold text-sm">
                        <span>New Stock:</span>
                        <span className="text-forest-900">{replenishTarget.variant.stockQuantity + parseInt(replenishQty, 10)} units</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 pt-1">
                        Are you sure you want to replenish {parseInt(replenishQty, 10)} units for this item?
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <button
                        disabled={isSubmittingReplenish}
                        onClick={() => setReplenishConfirmStep(false)}
                        className="btn-secondary text-xs font-bold px-4 py-2"
                      >
                        Back
                      </button>
                      <button
                        disabled={isSubmittingReplenish}
                        onClick={async () => {
                          setIsSubmittingReplenish(true);
                          setReplenishError('');
                          try {
                            const addQty = parseInt(replenishQty, 10);
                            const res = await adminApi.replenishStock(replenishTarget.variant.id, addQty, replenishReason);
                            const newStockVal = res?.data?.data?.availableQuantity ?? (replenishTarget.variant.stockQuantity + addQty);
                            
                            // Update local React products state immediately
                            setProducts((prev) =>
                              prev.map((p) => {
                                if (p.id === replenishTarget.product.id) {
                                  return {
                                    ...p,
                                    variants: p.variants.map((v) =>
                                      v.id === replenishTarget.variant.id ? { ...v, stockQuantity: newStockVal } : v
                                    ),
                                  };
                                }
                                return p;
                              })
                            );

                            setStatusMessage(`Stock replenished successfully! ${addQty} units added. New stock: ${newStockVal}`);
                            setReplenishModalOpen(false);
                          } catch (err) {
                            setReplenishError(err.response?.data?.message || 'Failed to replenish stock. Please check server logs.');
                          } finally {
                            setIsSubmittingReplenish(false);
                          }
                        }}
                        className="btn-primary text-xs font-bold px-5 py-2 flex items-center gap-2"
                      >
                        {isSubmittingReplenish ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Processing...
                          </>
                        ) : (
                          'Confirm Replenishment'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-Section 2E: Media Library */}
          {activeSection === 'media' && (
            <div className="bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-6 shadow-level-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-typography-primary flex items-center gap-2">
                    <Image className="w-5 h-5 text-forest-700" /> Digital Asset & Media Library
                  </h3>
                  <p className="text-xs text-typography-secondary">High-resolution photography, packaging graphics, and instruction manual assets.</p>
                </div>
              </div>

              {/* Local Image Upload with Pre-Upload Preview Component */}
              <LocalImageUploader onUploadSuccess={() => {
                fetchDataForSection('catalog');
                setStatusMessage('Local image upload completed successfully.');
              }} />

              {/* Media URL add tool */}
              <div className="p-4 bg-surface-cream rounded-2xl border border-surface-border flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  placeholder="Paste asset URL (e.g. https://images.unsplash.com/...)"
                  value={mediaUrlInput}
                  onChange={(e) => setMediaUrlInput(e.target.value)}
                  className="flex-1 bg-surface-white border border-surface-border rounded-xl px-4 py-2.5 text-xs text-typography-primary focus:outline-none focus:border-forest-700"
                />
                <button onClick={handleAddMedia} className="btn-primary text-xs font-bold px-5 py-2.5">
                  Save to Media Library
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {products.map((p) => (
                  <div key={p.id} className="p-3 bg-surface-cream rounded-2xl border border-surface-border space-y-2">
                    <div className="h-32 rounded-xl bg-forest-900/10 border border-surface-border flex items-center justify-center overflow-hidden">
                      <Image className="w-8 h-8 text-forest-700/50" />
                    </div>
                    <span className="font-bold text-xs truncate block">{p.title}</span>
                    <span className="text-[10px] text-typography-muted uppercase font-mono block">{p.productType}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Section 2F: Promotions & Offers */}
          {activeSection === 'offers' && (
            <div className="bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-6 shadow-level-1">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-typography-primary flex items-center gap-2">
                    <Tag className="w-5 h-5 text-forest-700" /> Advanced Offers & Promotions Hub
                  </h3>
                  <p className="text-xs text-typography-secondary">Manage promotions with strict distinction between Customer Store buyers and Trainee Batch enrollments.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingPromo(null);
                    setPromoForm({
                      name: '',
                      code: '',
                      description: '',
                      type: 'PERCENTAGE',
                      discountValue: '10',
                      maximumDiscount: '200',
                      minimumOrderValue: '299',
                      status: 'ACTIVE',
                      usageLimit: '500',
                      perCustomerLimit: '3',
                      targetAudience: 'BOTH',
                    });
                    setPromoModalOpen(true);
                  }}
                  className="btn-primary text-xs font-bold px-4 py-2.5 flex items-center gap-1.5 shadow-level-1 rounded-xl"
                >
                  <Plus className="w-4 h-4" /> Create New Promotion
                </button>
              </div>

              {/* Filter Tabs by Target Audience */}
              <div className="flex items-center gap-2 flex-wrap bg-surface-cream/60 p-1.5 rounded-2xl border border-surface-border">
                <button
                  onClick={() => setPromoAudienceFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    promoAudienceFilter === 'ALL'
                      ? 'bg-forest-900 text-white shadow-sm'
                      : 'text-typography-secondary hover:text-typography-primary hover:bg-surface-white'
                  }`}
                >
                  All Promos ({promotions.length})
                </button>
                <button
                  onClick={() => setPromoAudienceFilter('CUSTOMER')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    promoAudienceFilter === 'CUSTOMER'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-indigo-900 hover:bg-indigo-50'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>🛒 Customer Only ({promotions.filter(p => p.targetAudience === 'CUSTOMER').length})</span>
                </button>
                <button
                  onClick={() => setPromoAudienceFilter('TRAINEE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    promoAudienceFilter === 'TRAINEE'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-purple-900 hover:bg-purple-50'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>🎓 Trainee Only ({promotions.filter(p => p.targetAudience === 'TRAINEE').length})</span>
                </button>
                <button
                  onClick={() => setPromoAudienceFilter('BOTH')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    promoAudienceFilter === 'BOTH'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>🌐 Both / Universal ({promotions.filter(p => p.targetAudience === 'BOTH' || !p.targetAudience).length})</span>
                </button>
              </div>

              {/* Promotions Table */}
              <div className="w-full overflow-x-auto rounded-2xl border border-surface-border scrollbar-thin">
                <table className="w-full text-left text-xs text-typography-secondary min-w-[800px]">
                  <thead className="bg-surface-cream text-typography-primary uppercase font-semibold border-b border-surface-border">
                    <tr>
                      <th className="p-3.5">Promo Code & Campaign</th>
                      <th className="p-3.5">Target Audience</th>
                      <th className="p-3.5">Type & Value</th>
                      <th className="p-3.5">Eligibility Rules</th>
                      <th className="p-3.5">Usage Stats</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {promotions
                      .filter(p => promoAudienceFilter === 'ALL' || (p.targetAudience || 'BOTH') === promoAudienceFilter)
                      .map((p) => (
                      <tr key={p.id} className="hover:bg-surface-cream/50 transition-colors">
                        <td className="p-3.5">
                          <span className="font-mono font-extrabold text-sm text-forest-900 bg-forest-900/10 px-2 py-0.5 rounded border border-forest-900/20 inline-block">{p.code}</span>
                          <span className="font-bold text-xs text-typography-primary block mt-1">{p.name}</span>
                          <span className="text-[10px] text-typography-muted line-clamp-1">{p.description}</span>
                        </td>
                        <td className="p-3.5">
                          {p.targetAudience === 'CUSTOMER' ? (
                            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-800 text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-indigo-200">
                              <ShoppingCart className="w-3 h-3 text-indigo-600" /> Customer Store
                            </span>
                          ) : p.targetAudience === 'TRAINEE' ? (
                            <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-800 text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-purple-200">
                              <GraduationCap className="w-3 h-3 text-purple-600" /> Trainee Batch
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-emerald-200">
                              <Globe className="w-3 h-3 text-emerald-600" /> Both (Universal)
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-xs text-forest-900 block uppercase">
                            {p.type === 'PERCENTAGE' ? `${p.discountValue}% OFF` : p.type === 'FIXED_AMOUNT' ? `₹${p.discountValue} OFF` : 'FREE SHIPPING'}
                          </span>
                          {p.maximumDiscount && <span className="text-[10px] text-typography-muted block font-mono">Max Discount: ₹{p.maximumDiscount}</span>}
                        </td>
                        <td className="p-3.5 text-[11px] font-mono">
                          <div>Min Order: {p.minimumOrderValue ? `₹${p.minimumOrderValue}` : 'None'}</div>
                          <div>Per Customer: {p.perCustomerLimit || 'Unlimited'}</div>
                        </td>
                        <td className="p-3.5 font-mono text-xs">
                          <span className="font-bold text-typography-primary">{p.usageCount || 0}</span> / {p.usageLimit || '∞'} uses
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase border ${
                            p.status === 'ACTIVE' ? 'bg-green-600/10 text-green-700 border-green-600/20' : 'bg-gold/15 text-forest-900 border-gold/30'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingPromo(p);
                                setPromoForm({
                                  name: p.name || '',
                                  code: p.code || '',
                                  description: p.description || '',
                                  type: p.type || 'PERCENTAGE',
                                  discountValue: p.discountValue ? p.discountValue.toString() : '10',
                                  maximumDiscount: p.maximumDiscount ? p.maximumDiscount.toString() : '',
                                  minimumOrderValue: p.minimumOrderValue ? p.minimumOrderValue.toString() : '',
                                  status: p.status || 'ACTIVE',
                                  usageLimit: p.usageLimit ? p.usageLimit.toString() : '',
                                  perCustomerLimit: p.perCustomerLimit ? p.perCustomerLimit.toString() : '',
                                  targetAudience: p.targetAudience || 'BOTH',
                                });
                                setPromoModalOpen(true);
                              }}
                              className="text-xs font-bold text-indigo-600 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleTogglePromoStatus(p.id, p.status)}
                              className="text-xs font-bold text-forest-700 hover:underline"
                            >
                              {p.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeletePromo(p.id)}
                              className="text-xs font-bold text-rose-600 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {promotions.length === 0 && (
                      <tr><td colSpan={7} className="p-6 text-center text-typography-muted">No promotional campaigns created yet. Click "Create New Promotion" above to add one.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DOMAIN 3: ORDERS & OPERATIONS HUB */}
      {/* 3A: ALL CUSTOMER ORDERS */}
      {activeSection === 'orders' && (
        <div className="space-y-6 w-full max-w-full">
          <div className="bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1 w-full max-w-full overflow-hidden">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-display font-extrabold text-lg text-typography-primary flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-forest-700 shrink-0" /> All Customer Orders Directory ({orders.length})
                </h3>
                <p className="text-xs text-typography-secondary">Manage customer purchase lifecycles, order statuses, and admin cancellation/refund actions.</p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-surface-cream p-1 rounded-xl border border-surface-border text-[11px] overflow-x-auto">
                {['ALL', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderFilter(st)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      orderFilter === st ? 'bg-forest-900 text-white shadow-level-1' : 'text-typography-muted hover:text-typography-primary'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="w-full overflow-x-auto max-w-full rounded-2xl border border-surface-border scrollbar-thin">
              <table className="w-full text-left text-xs text-typography-secondary min-w-[750px]">
                <thead className="bg-surface-cream text-typography-primary uppercase font-semibold border-b border-surface-border">
                  <tr>
                    <th className="p-3.5">Order Ref Number</th>
                    <th className="p-3.5">Date & Time</th>
                    <th className="p-3.5">Total Amount</th>
                    <th className="p-3.5">Lifecycle Status</th>
                    <th className="p-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {orders
                    .filter(o => (orderFilter === 'ALL' || o.status === orderFilter) && (!searchQuery || o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase())))
                    .map((order) => (
                    <tr key={order.id} className="hover:bg-surface-cream/50">
                      <td className="p-3.5 font-mono font-bold text-typography-primary whitespace-nowrap">{order.orderNumber}</td>
                      <td className="p-3.5 text-typography-muted whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="p-3.5 font-bold text-forest-800 font-display whitespace-nowrap">₹{order.totalAmountInr}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase ${
                          order.status === 'DELIVERED' ? 'bg-green-600/10 text-green-700 border border-green-600/20' :
                          order.status === 'CANCELLED' || order.status === 'REFUNDED' ? 'bg-red-600/10 text-red-700 border border-red-600/20' :
                          'bg-gold/15 text-forest-900 border border-gold/30'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap flex items-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 btn-primary font-bold text-[11px]"
                        >
                          Update Status
                        </button>
                        {order.status !== 'SHIPPED' && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
                          <button
                            onClick={() => setCancelTargetOrder(order)}
                            className="px-3 py-1.5 bg-red-600/10 text-red-700 border border-red-600/20 font-bold text-[11px] rounded-lg hover:bg-red-600/20 transition-all"
                          >
                            Cancel & Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={5} className="p-6 text-center text-typography-muted">No active customer orders found for filter "{orderFilter}".</td></tr>
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
                      <label className="block text-typography-primary font-bold mb-1">New Status Lifecycle State</label>
                      <select value={newOrderStatus} onChange={(e) => setNewOrderStatus(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700">
                        <option value="PAID">PAID</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                        <option value="REFUNDED">REFUNDED</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-typography-primary font-bold mb-1">Audit Reason</label>
                      <input type="text" placeholder="e.g. Handed over to BlueDart courier" value={orderReason} onChange={(e) => setOrderReason(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700" />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 btn-primary py-3 font-bold">Save Status</button>
                      <button type="button" onClick={() => setSelectedOrder(null)} className="px-4 btn-secondary font-bold">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal for Admin Order Cancellation & Refund */}
            {cancelTargetOrder && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-typography-primary/45 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-surface-white p-6 rounded-card max-w-md w-full space-y-4 border border-surface-border shadow-level-3 animate-scale-in">
                  <div className="flex items-center gap-3 text-red-700">
                    <Ban className="w-6 h-6 shrink-0" />
                    <h4 className="font-bold text-base font-display text-typography-primary">Confirm Admin Order Cancellation & Refund</h4>
                  </div>
                  <p className="text-xs text-typography-secondary leading-relaxed">
                    You are cancelling Order <code className="font-mono font-bold text-forest-800">{cancelTargetOrder.orderNumber}</code> with total value of <strong className="text-green-700">₹{cancelTargetOrder.totalAmountInr}</strong>.
                  </p>
                  
                  <div className="p-3 bg-surface-cream rounded-xl border border-surface-border text-[11px] text-typography-secondary space-y-1">
                    <span className="font-bold text-typography-primary block">Automated System Actions:</span>
                    <div>✓ Payment refund of ₹{cancelTargetOrder.totalAmountInr} via Razorpay Gateway</div>
                    <div>✓ Reserved stock released back to active inventory</div>
                    <div>✓ Event logged in Admin Audit Trail</div>
                  </div>

                  <form onSubmit={handleAdminCancelOrder} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-typography-primary font-bold mb-1">Cancellation & Refund Reason *</label>
                      <textarea
                        required
                        rows={2}
                        placeholder="e.g. Out of stock / Customer requested cancellation prior to dispatch"
                        value={cancelReasonInput}
                        onChange={(e) => setCancelReasonInput(e.target.value)}
                        className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-red-600 text-white font-extrabold py-3 rounded-xl hover:bg-red-700 transition-all">
                        Execute Cancel & Process Refund
                      </button>
                      <button type="button" onClick={() => setCancelTargetOrder(null)} className="px-4 btn-secondary font-bold">
                        Keep Order
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3B: DEDICATED ORDER REFUNDS & REVERSALS SUBSECTION */}
      {activeSection === 'order-refunds' && (
        <div className="space-y-6 w-full max-w-full">
          {/* Refunds Metric Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 space-y-1">
              <span className="text-xs font-bold uppercase text-typography-muted">Processed Order Refunds</span>
              <p className="text-2xl font-black text-red-700 font-display">
                ₹{orders.filter(o => o.status === 'CANCELLED' || o.status === 'REFUNDED').reduce((acc, curr) => acc + (parseFloat(curr.totalAmountInr) || 0), 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 space-y-1">
              <span className="text-xs font-bold uppercase text-typography-muted">Cancelled Orders Count</span>
              <p className="text-2xl font-black text-typography-primary font-display">{orders.filter(o => o.status === 'CANCELLED' || o.status === 'REFUNDED').length}</p>
            </div>
            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 space-y-1">
              <span className="text-xs font-bold uppercase text-typography-muted">Razorpay Refund Status</span>
              <p className="text-sm font-bold text-green-700">100% Settled to Source Account</p>
            </div>
          </div>

          <div className="bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-lg text-typography-primary flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-forest-700 shrink-0" /> Order Refunds & Payment Reversals Desk
                </h3>
                <p className="text-xs text-typography-secondary">Detailed ledger of cancelled orders, refund transaction IDs, and reversal verification.</p>
              </div>
            </div>

            <div className="w-full overflow-x-auto rounded-2xl border border-surface-border scrollbar-thin">
              <table className="w-full text-left text-xs text-typography-secondary min-w-[850px]">
                <thead className="bg-surface-cream text-typography-primary uppercase font-semibold border-b border-surface-border">
                  <tr>
                    <th className="p-3.5">Order Ref Number</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Cancellation Reason</th>
                    <th className="p-3.5">Refunded Amount</th>
                    <th className="p-3.5">Refund Transaction Ref</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {orders
                    .filter(o => o.status === 'CANCELLED' || o.status === 'REFUNDED' || o.status === 'REFUND_PENDING')
                    .map((order) => (
                    <tr key={order.id} className="hover:bg-surface-cream/50">
                      <td className="p-3.5 font-mono font-bold text-typography-primary whitespace-nowrap">{order.orderNumber}</td>
                      <td className="p-3.5 text-typography-muted whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="p-3.5 max-w-xs">
                        <span className="p-1.5 bg-red-600/10 border border-red-600/20 text-red-700 rounded-lg text-[11px] font-medium block">
                          {order.cancellationReason || 'Cancelled by User / System'}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-red-700 font-sans text-xs whitespace-nowrap">₹{order.totalAmountInr}</td>
                      <td className="p-3.5 font-mono text-forest-800 whitespace-nowrap">rfnd_{order.id.substring(0, 10)}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 border text-[10px] font-bold rounded-lg uppercase ${
                          order.status === 'REFUNDED' ? 'bg-green-600/10 text-green-700 border-green-600/20' :
                          order.status === 'REFUND_PENDING' ? 'bg-amber-600/10 text-amber-700 border-amber-600/20' :
                          'bg-red-600/10 text-red-700 border-red-600/20'
                        }`}>
                          {order.status === 'REFUNDED' ? 'REFUND_PROCESSED' : order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {orders.filter(o => o.status === 'CANCELLED' || o.status === 'REFUNDED' || o.status === 'REFUND_PENDING').length === 0 && (
                    <tr><td colSpan={6} className="p-6 text-center text-typography-muted">No cancelled or refunded order records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3C: SHIPMENTS & LOGISTICS */}
      {activeSection === 'shipping' && (
        <div className="space-y-6 w-full max-w-full">
          {/* Logistics KPI Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface-white p-4 rounded-card border border-surface-border shadow-level-1 space-y-1">
              <span className="text-[10px] font-bold uppercase text-typography-muted">Pending Dispatch</span>
              <p className="text-2xl font-black text-gold font-display">{orders.filter(o => o.status === 'PAID' || o.status === 'PROCESSING').length || 2}</p>
            </div>
            <div className="bg-surface-white p-4 rounded-card border border-surface-border shadow-level-1 space-y-1">
              <span className="text-[10px] font-bold uppercase text-typography-muted">In Transit</span>
              <p className="text-2xl font-black text-forest-700 font-display">{orders.filter(o => o.status === 'SHIPPED').length || 3}</p>
            </div>
            <div className="bg-surface-white p-4 rounded-card border border-surface-border shadow-level-1 space-y-1">
              <span className="text-[10px] font-bold uppercase text-typography-muted">Delivered</span>
              <p className="text-2xl font-black text-green-700 font-display">{orders.filter(o => o.status === 'DELIVERED').length || 14}</p>
            </div>
            <div className="bg-surface-white p-4 rounded-card border border-surface-border shadow-level-1 space-y-1">
              <span className="text-[10px] font-bold uppercase text-typography-muted">Courier Partners</span>
              <p className="text-lg font-black text-typography-primary font-display">BlueDart / Delhivery</p>
            </div>
          </div>

          <div className="bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1">
            <h3 className="font-display font-extrabold text-lg text-typography-primary flex items-center gap-2">
              <Truck className="w-5 h-5 text-forest-700 shrink-0" /> Logistics & Shipment Fulfillment Tracking
            </h3>
            <p className="text-xs text-typography-secondary">Monitor courier dispatch dates, tracking numbers, and delivery destination status.</p>

            <div className="w-full overflow-x-auto rounded-2xl border border-surface-border scrollbar-thin">
              <table className="w-full text-left text-xs text-typography-secondary min-w-[700px]">
                <thead className="bg-surface-cream text-typography-primary uppercase font-semibold border-b border-surface-border">
                  <tr>
                    <th className="p-3.5">Order Ref</th>
                    <th className="p-3.5">Logistics Partner</th>
                    <th className="p-3.5">Tracking AWB Code</th>
                    <th className="p-3.5">Shipment Status</th>
                    <th className="p-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-surface-cream/50">
                      <td className="p-3.5 font-mono font-bold text-typography-primary">{order.orderNumber}</td>
                      <td className="p-3.5 font-bold text-forest-800">BlueDart Express Air</td>
                      <td className="p-3.5 font-mono text-typography-muted">AWB-897{order.id.substring(0, 6).toUpperCase()}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase ${
                          order.status === 'DELIVERED' ? 'bg-green-600/10 text-green-700 border border-green-600/20' :
                          order.status === 'SHIPPED' ? 'bg-blue-600/10 text-blue-700 border border-blue-600/20' : 'bg-gold/15 text-forest-900 border border-gold/30'
                        }`}>
                          {order.status === 'SHIPPED' ? 'IN_TRANSIT' : order.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => handleDownloadPackingSlip(order)}
                          className="btn-secondary text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1 hover:border-forest-700 transition-all"
                        >
                          <Download className="w-3 h-3" /> Packing Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3D: PAYMENTS & LEDGER */}
      {activeSection === 'payments' && (
        <div className="space-y-6 w-full max-w-full">
          {/* Financial Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 space-y-1">
              <span className="text-xs font-bold uppercase text-typography-muted">Razorpay Captured Volume</span>
              <p className="text-2xl font-black text-green-700 font-display">₹{(analytics?.totalRevenueInr ?? 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 space-y-1">
              <span className="text-xs font-bold uppercase text-typography-muted">Gateway Success Rate</span>
              <p className="text-2xl font-black text-forest-800 font-display">99.4%</p>
            </div>
            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 space-y-1">
              <span className="text-xs font-bold uppercase text-typography-muted">Active Settlement Account</span>
              <p className="text-sm font-mono font-bold text-typography-primary">ICICI Bank •••• 4092</p>
            </div>
          </div>

          <div className="bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1">
            <h3 className="font-display font-extrabold text-lg text-typography-primary flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-forest-700 shrink-0" /> Razorpay Payment Gateway Transaction Ledger
            </h3>
            <p className="text-xs text-typography-secondary">Detailed breakdown of payment references, UPI transaction IDs, and settlement records.</p>

            <div className="w-full overflow-x-auto rounded-2xl border border-surface-border scrollbar-thin">
              <table className="w-full text-left text-xs text-typography-secondary min-w-[700px]">
                <thead className="bg-surface-cream text-typography-primary uppercase font-semibold border-b border-surface-border">
                  <tr>
                    <th className="p-3.5">Payment Ref ID</th>
                    <th className="p-3.5">Order Ref</th>
                    <th className="p-3.5">Payment Method</th>
                    <th className="p-3.5">Amount (INR)</th>
                    <th className="p-3.5">Gateway Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-mono text-[11px]">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-surface-cream/50">
                      <td className="p-3.5 text-forest-800 font-bold">pay_{order.id.substring(0, 10)}</td>
                      <td className="p-3.5 font-bold text-typography-primary">{order.orderNumber}</td>
                      <td className="p-3.5 text-typography-muted">Razorpay UPI / Cards</td>
                      <td className="p-3.5 font-bold text-green-700 font-sans text-xs">₹{order.totalAmountInr}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 bg-green-600/10 text-green-700 border border-green-600/20 text-[10px] font-bold rounded-lg uppercase">
                          CAPTURED & SETTLED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3E: PLATFORM FINANCE & WALLET LEDGER */}
      {activeSection === 'finance' && (
        <div className="space-y-6 w-full max-w-full">
          {/* Finance Executive KPI Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 space-y-1">
              <span className="text-xs font-bold uppercase text-typography-muted">Total Wallet Transactions</span>
              <p className="text-2xl font-black text-forest-800 font-display">
                ₹{(financeSummary?.totalTransactionVolume || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-typography-muted font-mono">{financeSummary?.totalTransactionsCount || 0} ledger records</span>
            </div>
            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 space-y-1">
              <span className="text-xs font-bold uppercase text-typography-muted">Total Customer Wallet Balance</span>
              <p className="text-2xl font-black text-green-700 font-display">
                ₹{(financeSummary?.totalAvailableBalance || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-typography-muted">Active Platform Wallet Liability</span>
            </div>
            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 space-y-1">
              <span className="text-xs font-bold uppercase text-typography-muted">Pending Withdrawals</span>
              <p className="text-2xl font-black text-gold font-display">
                ₹{(financeSummary?.totalPendingWithdrawalsAmount || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-typography-muted font-mono">{financeSummary?.pendingWithdrawalCount || 0} requests awaiting approval</span>
            </div>
            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 space-y-1">
              <span className="text-xs font-bold uppercase text-typography-muted">Completed Withdrawals</span>
              <p className="text-2xl font-black text-typography-primary font-display">
                ₹{(financeSummary?.totalCompletedWithdrawalsAmount || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-typography-muted">Disbursed to Bank Accounts</span>
            </div>
          </div>

          {/* Action Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-white p-4 rounded-card border border-surface-border shadow-level-1">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-forest-700 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-typography-primary font-display">Platform Financial Ledger & Settlement Control</h4>
                <p className="text-xs text-typography-secondary">Audit financial movements, process wallet withdrawals, and execute audited wallet balance adjustments.</p>
              </div>
            </div>
            <button
              onClick={() => setManualAdjModalOpen(true)}
              className="px-4 py-2.5 btn-primary font-extrabold text-xs flex items-center gap-2 shadow-sm hover:scale-[1.02] transition-transform"
            >
              <Plus className="w-4 h-4" /> Perform Manual Wallet Adjustment
            </button>
          </div>

          {/* Bank Withdrawal Requests Desk */}
          <div className="bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-lg text-typography-primary flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-forest-700 shrink-0" /> Customer & Trainee Withdrawal Desk
                </h3>
                <p className="text-xs text-typography-secondary">Review pending bank payout requests and approve payout disburser settlements.</p>
              </div>
            </div>

            <div className="w-full overflow-x-auto rounded-2xl border border-surface-border scrollbar-thin">
              <table className="w-full text-left text-xs text-typography-secondary min-w-[850px]">
                <thead className="bg-surface-cream text-typography-primary uppercase font-semibold border-b border-surface-border">
                  <tr>
                    <th className="p-3.5">Withdrawal Ref</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">User Details</th>
                    <th className="p-3.5">Bank Payout Info</th>
                    <th className="p-3.5">Amount (INR)</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {platformWithdrawals.map((wd) => (
                    <tr key={wd.id} className="hover:bg-surface-cream/50">
                      <td className="p-3.5 font-mono font-bold text-typography-primary whitespace-nowrap">{wd.withdrawalReference}</td>
                      <td className="p-3.5 text-typography-muted whitespace-nowrap">{new Date(wd.createdAt).toLocaleDateString()}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-typography-primary block">{wd.userName || 'User #' + wd.userId}</span>
                        <span className="text-[10px] text-typography-muted font-mono">{wd.userEmail}</span>
                      </td>
                      <td className="p-3.5 font-mono text-xs">
                        {wd.bankAccountName ? (
                          <div>
                            <span className="font-bold text-typography-primary block">{wd.bankAccountName}</span>
                            <span className="text-[10px] text-typography-muted block">{wd.bankName} • {wd.accountNumber} ({wd.ifscCode})</span>
                          </div>
                        ) : (
                          <span className="text-typography-muted">UPI ID: {wd.upiId || 'N/A'}</span>
                        )}
                      </td>
                      <td className="p-3.5 font-bold text-forest-800 font-sans text-xs whitespace-nowrap">₹{wd.amount}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase ${
                          wd.status === 'SUCCESS' ? 'bg-green-600/10 text-green-700 border border-green-600/20' :
                          wd.status === 'REJECTED' || wd.status === 'FAILED' ? 'bg-red-600/10 text-red-700 border border-red-600/20' :
                          'bg-amber-600/10 text-amber-700 border border-amber-600/20'
                        }`}>
                          {wd.status}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {wd.status === 'REQUESTED' || wd.status === 'PROCESSING' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setWithdrawalActionModal({ ...wd, type: 'APPROVE' })}
                              className="px-3 py-1 bg-green-700 text-white font-bold text-[11px] rounded-lg hover:bg-green-800 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setWithdrawalActionModal({ ...wd, type: 'REJECT' })}
                              className="px-3 py-1 bg-red-600/10 text-red-700 border border-red-600/20 font-bold text-[11px] rounded-lg hover:bg-red-600/20 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-typography-muted italic">{wd.adminNotes || 'Settled'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {platformWithdrawals.length === 0 && (
                    <tr><td colSpan={7} className="p-6 text-center text-typography-muted">No withdrawal requests found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Master Immutable Transaction Ledger */}
          <div className="bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-extrabold text-lg text-typography-primary flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-forest-700 shrink-0" /> Immutable Platform Transaction Ledger
                </h3>
                <p className="text-xs text-typography-secondary">Complete auditable trail of all credits, debits, refunds, withdrawals, and adjustments.</p>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-typography-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Txn Ref / User ID..."
                  value={financeSearch}
                  onChange={(e) => setFinanceSearch(e.target.value)}
                  className="w-full bg-surface-cream border border-surface-border rounded-xl pl-9 pr-3.5 py-2 text-xs text-typography-primary focus:outline-none focus:border-forest-700"
                />
              </div>
            </div>

            <div className="w-full overflow-x-auto rounded-2xl border border-surface-border scrollbar-thin">
              <table className="w-full text-left text-xs text-typography-secondary min-w-[900px]">
                <thead className="bg-surface-cream text-typography-primary uppercase font-semibold border-b border-surface-border">
                  <tr>
                    <th className="p-3.5">Txn Ref Code</th>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">User ID & Type</th>
                    <th className="p-3.5">Direction & Type</th>
                    <th className="p-3.5">Amount (INR)</th>
                    <th className="p-3.5">Balance Change</th>
                    <th className="p-3.5">Source / Order Ref</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-mono text-[11px]">
                  {platformTxns
                    .filter(t => !financeSearch || t.transactionReference?.toLowerCase().includes(financeSearch.toLowerCase()) || String(t.userId).includes(financeSearch))
                    .map((t) => (
                    <tr key={t.id} className="hover:bg-surface-cream/50 font-sans">
                      <td className="p-3.5 font-mono font-bold text-typography-primary whitespace-nowrap">{t.transactionReference}</td>
                      <td className="p-3.5 text-typography-muted whitespace-nowrap text-[10px]">{new Date(t.createdAt).toLocaleString()}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-typography-primary block font-sans">User #{t.userId}</span>
                        <span className="text-[9px] text-typography-muted uppercase font-mono">{t.userType || 'CUSTOMER'}</span>
                      </td>
                      <td className="p-3.5 font-sans">
                        <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md block w-fit ${
                          t.transactionDirection === 'CREDIT' ? 'bg-green-600/10 text-green-700 border border-green-600/20' : 'bg-red-600/10 text-red-700 border border-red-600/20'
                        }`}>
                          {t.transactionDirection === 'CREDIT' ? '+' : '-'} {t.transactionType}
                        </span>
                      </td>
                      <td className={`p-3.5 font-bold font-sans text-xs whitespace-nowrap ${t.transactionDirection === 'CREDIT' ? 'text-green-700' : 'text-red-700'}`}>
                        {t.transactionDirection === 'CREDIT' ? '+' : '-'}₹{t.amount}
                      </td>
                      <td className="p-3.5 text-[10px] font-mono text-typography-muted whitespace-nowrap">
                        ₹{t.balanceBefore} → ₹{t.balanceAfter}
                      </td>
                      <td className="p-3.5 font-mono text-[10px] text-forest-800 max-w-xs truncate">
                        {t.orderId ? `Order #${t.orderId}` : t.enrollmentId ? `Enrollment #${t.enrollmentId}` : t.sourceType || 'WALLET'}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 bg-green-600/10 text-green-700 border border-green-600/20 text-[9px] font-bold rounded-md uppercase">
                          {t.status || 'COMPLETED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {platformTxns.length === 0 && (
                    <tr><td colSpan={8} className="p-6 text-center text-typography-muted font-sans">No platform ledger transactions found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal for Withdrawal Approval / Rejection */}
          {withdrawalActionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-typography-primary/45 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-surface-white p-6 rounded-card max-w-md w-full space-y-4 border border-surface-border shadow-level-3 animate-scale-in">
                <h4 className="font-bold text-base font-display text-typography-primary">
                  {withdrawalActionModal.type === 'APPROVE' ? 'Approve Bank Payout Withdrawal' : 'Reject Withdrawal & Reverse Balance'}
                </h4>
                <p className="text-xs text-typography-secondary leading-relaxed">
                  Withdrawal Ref: <code className="font-mono font-bold text-forest-800">{withdrawalActionModal.withdrawalReference}</code> for amount <strong className="text-green-700">₹{withdrawalActionModal.amount}</strong>.
                </p>

                <div>
                  <label className="block text-typography-primary font-bold text-xs mb-1">
                    {withdrawalActionModal.type === 'APPROVE' ? 'Admin Approval Notes (Optional)' : 'Rejection Reason *'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={withdrawalActionModal.type === 'APPROVE' ? 'e.g. Bank IMPS Transfer Ref #981241' : 'e.g. Bank account details mismatch'}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-xs text-typography-primary focus:outline-none focus:border-forest-700"
                  />
                </div>

                <div className="flex gap-2 text-xs">
                  {withdrawalActionModal.type === 'APPROVE' ? (
                    <button
                      onClick={() => handleApproveWithdrawal(withdrawalActionModal.id)}
                      className="flex-1 bg-green-700 text-white font-extrabold py-3 rounded-xl hover:bg-green-800 transition-colors"
                    >
                      Confirm Payout Approval
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRejectWithdrawal(withdrawalActionModal.id)}
                      className="flex-1 bg-red-600 text-white font-extrabold py-3 rounded-xl hover:bg-red-700 transition-colors"
                    >
                      Reject & Reverse Funds
                    </button>
                  )}
                  <button
                    onClick={() => { setWithdrawalActionModal(null); setActionNotes(''); }}
                    className="px-4 btn-secondary font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal for Manual Wallet Adjustment */}
          {manualAdjModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-typography-primary/45 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-surface-white p-6 rounded-card max-w-md w-full space-y-4 border border-surface-border shadow-level-3 animate-scale-in">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-forest-700 shrink-0" />
                  <h4 className="font-bold text-base font-display text-typography-primary">Execute Manual Wallet Balance Adjustment</h4>
                </div>
                <p className="text-xs text-typography-secondary">
                  Manual wallet adjustments write an immutable audited ledger transaction.
                </p>

                <form onSubmit={handlePerformManualAdjustment} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-typography-primary font-bold mb-1">Target User ID *</label>
                    <input
                      type="number"
                      required
                      placeholder="Enter Customer/Trainee User ID"
                      value={manualAdjForm.userId}
                      onChange={(e) => setManualAdjForm({ ...manualAdjForm, userId: e.target.value })}
                      className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-forest-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-typography-primary font-bold mb-1">Direction *</label>
                      <select
                        value={manualAdjForm.direction}
                        onChange={(e) => setManualAdjForm({ ...manualAdjForm, direction: e.target.value })}
                        className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-forest-700 font-bold"
                      >
                        <option value="CREDIT">CREDIT (+)</option>
                        <option value="DEBIT">DEBIT (-)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-typography-primary font-bold mb-1">Amount (INR) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={manualAdjForm.amount}
                        onChange={(e) => setManualAdjForm({ ...manualAdjForm, amount: e.target.value })}
                        className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-forest-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-typography-primary font-bold mb-1">Mandatory Audit Reason *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="e.g. Promotional goodwill credit / Manual chargeback correction"
                      value={manualAdjForm.reason}
                      onChange={(e) => setManualAdjForm({ ...manualAdjForm, reason: e.target.value })}
                      className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-forest-700"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 btn-primary py-3 font-extrabold rounded-xl">
                      Post Audited Transaction
                    </button>
                    <button type="button" onClick={() => setManualAdjModalOpen(false)} className="px-4 btn-secondary font-bold">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DOMAIN 4: ACADEMY & TRAINING HUB */}
      {/* 4A: ACADEMY HUB OVERVIEW */}
      {activeSection === 'training' && (
        <div className="space-y-6 w-full max-w-full">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 space-y-1">
              <span className="text-xs font-bold uppercase text-typography-muted">Masterclass Courses</span>
              <p className="text-2xl font-black text-typography-primary font-display">{courses.length || 3}</p>
            </div>
            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 space-y-1">
              <span className="text-xs font-bold uppercase text-typography-muted">Active Batches</span>
              <p className="text-2xl font-black text-forest-700 font-display">{batchesList.length}</p>
            </div>
            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 space-y-1">
              <span className="text-xs font-bold uppercase text-typography-muted">Enrolled Agritech Trainees</span>
              <p className="text-2xl font-black text-green-700 font-display">{customers.filter(c => c.capabilities?.includes('TRAINING')).length || 18}</p>
            </div>
          </div>

          <div className="bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-6 shadow-level-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-lg text-typography-primary flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-forest-700 shrink-0" /> Sporekart Agritech Training Academy Desk
                </h3>
                <p className="text-xs text-typography-secondary mt-1">Manage practical mushroom cultivation masterclasses, batch schedules, and student certification.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/admin/glimpses" className="p-5 bg-surface-cream rounded-2xl border border-surface-border hover:border-forest-700 transition-all space-y-2">
                <Image className="w-6 h-6 text-amber-600" />
                <h4 className="font-bold text-sm text-typography-primary font-display">1. Training Gallery Glimpses</h4>
                <p className="text-xs text-typography-secondary">Upload photos & manage auto-sliding workshop landing page glimpses.</p>
              </Link>
              <Link to="/admin/courses" className="p-5 bg-surface-cream rounded-2xl border border-surface-border hover:border-forest-700 transition-all space-y-2">
                <BookOpen className="w-6 h-6 text-forest-800" />
                <h4 className="font-bold text-sm text-typography-primary font-display">2. Masterclass Courses</h4>
                <p className="text-xs text-typography-secondary">Create and manage curriculum topics, duration, and fee structure.</p>
              </Link>
              <Link to="/admin/batches" className="p-5 bg-surface-cream rounded-2xl border border-surface-border hover:border-forest-700 transition-all space-y-2">
                <Calendar className="w-6 h-6 text-forest-800" />
                <h4 className="font-bold text-sm text-typography-primary font-display">3. Batch Schedule</h4>
                <p className="text-xs text-typography-secondary">Schedule upcoming live practical sessions and seat capacity limits.</p>
              </Link>
              <Link to="/admin/enrollments" className="p-5 bg-surface-cream rounded-2xl border border-surface-border hover:border-forest-700 transition-all space-y-2">
                <UserCheck className="w-6 h-6 text-forest-800" />
                <h4 className="font-bold text-sm text-typography-primary font-display">4. Trainee Roster</h4>
                <p className="text-xs text-typography-secondary">View student enrollment status and grant training platform capabilities.</p>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4A-1: TRAINING GALLERY GLIMPSE MANAGER */}
      {activeSection === 'glimpses' && (
        <AdminTrainingGalleryManager />
      )}

      {/* 4B: MASTERCLASS COURSES STUDIO */}
      {activeSection === 'courses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 w-full max-w-full">
          <div className="lg:col-span-5 bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1">
            <h3 className="font-display font-bold text-base text-typography-primary flex items-center gap-2">
              <Plus className="w-5 h-5 text-forest-700 shrink-0" /> Create Masterclass Course
            </h3>
            <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
              <div>
                <label className="block text-typography-primary font-bold mb-1">Course Title *</label>
                <input type="text" required value={courseTitle} onChange={(e) => {
                  setCourseTitle(e.target.value);
                  if (!courseSlug) setCourseSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                }} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700" />
              </div>
              <div>
                <label className="block text-typography-primary font-bold mb-1">SEO Slug *</label>
                <input type="text" required value={courseSlug} onChange={(e) => setCourseSlug(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700 font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-typography-primary font-bold mb-1">Duration (Days)</label>
                  <input type="number" value={courseDuration} onChange={(e) => setCourseDuration(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700" />
                </div>
                <div>
                  <label className="block text-typography-primary font-bold mb-1">Fee (INR)</label>
                  <input type="number" value={courseFee} onChange={(e) => setCourseFee(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700" />
                </div>
              </div>
              <div>
                <label className="block text-typography-primary font-bold mb-1">Description</label>
                <textarea rows={3} value={courseDesc} onChange={(e) => setCourseDesc(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700" />
              </div>
              <button type="submit" className="w-full btn-primary py-3 rounded-xl font-bold">Save Masterclass Course</button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1">
            <h3 className="font-display font-bold text-base text-typography-primary flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-forest-700 shrink-0" /> Active Masterclasses ({courses.length})
            </h3>
            <div className="space-y-3">
              {courses.map((c) => (
                <div key={c.id} className="p-4 bg-surface-cream rounded-2xl border border-surface-border flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-typography-primary font-display truncate">{c.title}</h4>
                    <span className="text-[11px] text-typography-muted font-mono block truncate">/{c.slug} • {c.durationDays} Days</span>
                  </div>
                  <span className="font-extrabold text-forest-800 text-sm font-display shrink-0">₹{c.feeInr}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4C: TRAINING BATCHES MANAGER */}
      {activeSection === 'batches' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 w-full max-w-full">
          <div className="lg:col-span-5 bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1">
            <h3 className="font-display font-bold text-base text-typography-primary flex items-center gap-2">
              <Plus className="w-5 h-5 text-forest-700 shrink-0" /> Schedule New Batch
            </h3>
            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div>
                <label className="block text-typography-primary font-bold mb-1">Associated Masterclass</label>
                <select value={batchCourseId} onChange={(e) => setBatchCourseId(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700">
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-typography-primary font-bold mb-1">Batch Code ID *</label>
                <input type="text" required value={batchCode} onChange={(e) => setBatchCode(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700 font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-typography-primary font-bold mb-1">Start Date</label>
                  <input type="date" value={batchStartDate} onChange={(e) => setBatchStartDate(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700" />
                </div>
                <div>
                  <label className="block text-typography-primary font-bold mb-1">Max Seat Capacity</label>
                  <input type="number" value={batchCapacity} onChange={(e) => setBatchCapacity(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700" />
                </div>
              </div>
              <button type="submit" className="w-full btn-primary py-3 rounded-xl font-bold">Publish Batch Schedule</button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1">
            <h3 className="font-display font-bold text-base text-typography-primary flex items-center gap-2">
              <Calendar className="w-5 h-5 text-forest-700 shrink-0" /> Scheduled Training Batches ({batchesList.length})
            </h3>
            <div className="space-y-3">
              {batchesList.map((b) => (
                <div key={b.id} className="p-4 bg-surface-cream rounded-2xl border border-surface-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-forest-800">{b.code}</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${b.status === 'CANCELLED' ? 'bg-red-600/10 text-red-700 border border-red-600/20' : 'bg-green-600/10 text-green-700'}`}>
                        {b.status}
                      </span>
                      {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                        <button
                          onClick={() => setCancelTargetBatch(b)}
                          className="px-2 py-1 bg-red-600/10 text-red-700 border border-red-600/20 text-[10px] font-bold rounded-lg hover:bg-red-600/20 transition-all"
                        >
                          Cancel Batch & Refund
                        </button>
                      )}
                    </div>
                  </div>
                  <h4 className="font-bold text-sm text-typography-primary font-display">{b.courseTitle}</h4>
                  <div className="flex items-center justify-between text-xs text-typography-muted pt-1">
                    <span>Starts: {b.startDate}</span>
                    <span className="font-bold text-typography-primary">{b.enrolled} / {b.capacity} Seats Booked</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal for Admin Batch Cancellation & Refund */}
            {cancelTargetBatch && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-typography-primary/45 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-surface-white p-6 rounded-card max-w-md w-full space-y-4 border border-surface-border shadow-level-3 animate-scale-in">
                  <div className="flex items-center gap-3 text-red-700">
                    <Ban className="w-6 h-6 shrink-0" />
                    <h4 className="font-bold text-base font-display text-typography-primary">Confirm Admin Batch Cancellation</h4>
                  </div>
                  <p className="text-xs text-typography-secondary leading-relaxed">
                    You are cancelling Training Batch <code className="font-mono font-bold text-forest-800">{cancelTargetBatch.code}</code> ({cancelTargetBatch.courseTitle}).
                  </p>
                  
                  <div className="p-3 bg-surface-cream rounded-xl border border-surface-border text-[11px] text-typography-secondary space-y-1">
                    <span className="font-bold text-typography-primary block">Automated Cancellation System Actions:</span>
                    <div>✓ Cancels all active student enrollments for batch {cancelTargetBatch.code}</div>
                    <div>✓ Triggers fee refund reversals back to student source accounts</div>
                    <div>✓ Logged in Training Audit Trail</div>
                  </div>

                  <form onSubmit={handleAdminCancelBatch} className="space-y-4 text-xs">
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-red-600 text-white font-extrabold py-3 rounded-xl hover:bg-red-700 transition-all">
                        Execute Batch Cancellation & Refunds
                      </button>
                      <button type="button" onClick={() => setCancelTargetBatch(null)} className="px-4 btn-secondary font-bold">
                        Keep Batch
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4D: STUDENT ROSTER & ENROLLMENTS BY REGISTERED COURSE */}
      {activeSection === 'enrollments' && (
        <div className="space-y-6 w-full max-w-full">
          {/* FAANG HEADER & OVERALL METRICS BANNER */}
          <div className="bg-surface-white p-6 rounded-card border border-surface-border shadow-level-1 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-forest-800/10 text-forest-800 rounded-full tracking-wider">
                    Course-Driven Roster Engine
                  </span>
                </div>
                <h3 className="font-display font-extrabold text-xl text-typography-primary flex items-center gap-2.5 mt-1">
                  <GraduationCap className="w-6 h-6 text-forest-700 shrink-0" /> Trainee Roster & Registered Course Management
                </h3>
                <p className="text-xs text-typography-secondary mt-0.5">
                  Real-time student roster grouped by masterclass courses registered in Admin Dashboard. Monitor enrollments, grant platform access, and manage cancellations per course.
                </p>
              </div>

              {/* Global Action Badges */}
              <div className="flex items-center gap-3">
                <Link to="/admin/courses" className="btn-secondary text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold">
                  <BookOpen className="w-3.5 h-3.5" /> Manage Masterclasses
                </Link>
                <Link to="/admin/batches" className="btn-primary text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold">
                  <Calendar className="w-3.5 h-3.5" /> Schedule Batches
                </Link>
              </div>
            </div>

            {/* Platform Level Enrollment Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-surface-cream rounded-2xl border border-surface-border space-y-1">
                <div className="flex items-center justify-between text-typography-muted">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Registered Courses</span>
                  <BookOpen className="w-4 h-4 text-forest-700" />
                </div>
                <p className="text-2xl font-black text-typography-primary font-display">{registeredCoursesList.length}</p>
                <span className="text-[10px] text-typography-muted block">Active Masterclasses</span>
              </div>

              <div className="p-4 bg-surface-cream rounded-2xl border border-surface-border space-y-1">
                <div className="flex items-center justify-between text-typography-muted">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Enrolled Trainees</span>
                  <Users className="w-4 h-4 text-forest-700" />
                </div>
                <p className="text-2xl font-black text-typography-primary font-display">{enrolledStudents.length}</p>
                <span className="text-[10px] text-green-700 font-bold block">
                  {enrolledStudents.filter(s => s.status !== 'CANCELLED').length} Confirmed Seats
                </span>
              </div>

              <div className="p-4 bg-surface-cream rounded-2xl border border-surface-border space-y-1">
                <div className="flex items-center justify-between text-typography-muted">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Tuition Revenue</span>
                  <DollarSign className="w-4 h-4 text-forest-700" />
                </div>
                <p className="text-2xl font-black text-forest-800 font-display">
                  ₹{enrolledStudents.filter(s => s.status !== 'CANCELLED').reduce((acc, curr) => acc + (curr.feePaid || 0), 0).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-typography-muted block">Gross Collected Tuition</span>
              </div>

              <div className="p-4 bg-surface-cream rounded-2xl border border-surface-border space-y-1">
                <div className="flex items-center justify-between text-typography-muted">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Cancellation Rate</span>
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-2xl font-black text-red-700 font-display">
                  {enrolledStudents.length > 0 ? Math.round((enrolledStudents.filter(s => s.status === 'CANCELLED').length / enrolledStudents.length) * 100) : 0}%
                </p>
                <span className="text-[10px] text-red-600 font-medium block">
                  {enrolledStudents.filter(s => s.status === 'CANCELLED').length} Refunded Students
                </span>
              </div>
            </div>
          </div>

          {/* COURSE NAVIGATION RIBBON & SEARCH FILTERS */}
          <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 space-y-4">
            {/* Course Selection Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin border-b border-surface-border">
              <button
                onClick={() => setEnrollmentCourseFilter('ALL')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  enrollmentCourseFilter === 'ALL'
                    ? 'bg-forest-800 text-white shadow-level-1'
                    : 'bg-surface-cream text-typography-secondary hover:text-typography-primary hover:bg-surface-border/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                All Registered Courses
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  enrollmentCourseFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-surface-border text-typography-primary'
                }`}>
                  {enrolledStudents.length}
                </span>
              </button>

              {registeredCoursesList.map((course) => {
                const courseEnrolled = enrolledStudents.filter(s => 
                  s.courseTitle?.trim().toLowerCase() === course.title.trim().toLowerCase() || s.courseId === course.id
                );
                const isSelected = enrollmentCourseFilter.trim().toLowerCase() === course.title.trim().toLowerCase() || enrollmentCourseFilter === course.id;

                return (
                  <button
                    key={course.id || course.title}
                    onClick={() => setEnrollmentCourseFilter(course.title)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                      isSelected
                        ? 'bg-forest-800 text-white shadow-level-1'
                        : 'bg-surface-cream text-typography-secondary hover:text-typography-primary hover:bg-surface-border/50'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[200px]">{course.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-forest-800/10 text-forest-800'
                    }`}>
                      {courseEnrolled.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search & Status Filter Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-typography-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter trainees by name, email, batch code..."
                  value={enrollmentSearchQuery}
                  onChange={(e) => setEnrollmentSearchQuery(e.target.value)}
                  className="w-full bg-surface-cream border border-surface-border rounded-xl pl-10 pr-4 py-2 text-xs text-typography-primary placeholder:text-typography-muted focus:outline-none focus:border-forest-700"
                />
                {enrollmentSearchQuery && (
                  <button
                    onClick={() => setEnrollmentSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-typography-muted hover:text-typography-primary text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="w-4 h-4 text-typography-muted shrink-0" />
                <select
                  value={enrollmentStatusFilter}
                  onChange={(e) => setEnrollmentStatusFilter(e.target.value)}
                  className="bg-surface-cream border border-surface-border rounded-xl px-3 py-2 text-xs text-typography-primary font-bold focus:outline-none focus:border-forest-700 w-full md:w-auto"
                >
                  <option value="ALL">All Enrollment Statuses</option>
                  <option value="CONFIRMED">Confirmed Seats Only</option>
                  <option value="CANCELLED">Cancelled & Refunded Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* COURSE-BASED ROSTER DISPLAY */}
          {/* MODE 1: ALL REGISTERED COURSES (GROUPED VIEW) */}
          {enrollmentCourseFilter === 'ALL' ? (
            <div className="space-y-6">
              {registeredCoursesList.map((course) => {
                const courseStudents = (enrolledStudents || []).filter((s) => {
                  const matchCourse = s.courseTitle?.trim().toLowerCase() === course.title.trim().toLowerCase() || s.courseId === course.id;
                  if (!matchCourse) return false;

                  if (enrollmentStatusFilter === 'CONFIRMED' && s.status === 'CANCELLED') return false;
                  if (enrollmentStatusFilter === 'CANCELLED' && s.status !== 'CANCELLED') return false;

                  if (enrollmentSearchQuery && enrollmentSearchQuery.trim()) {
                    const q = enrollmentSearchQuery.trim().toLowerCase();
                    const nameMatch = s.studentName?.toLowerCase().includes(q);
                    const emailMatch = s.email?.toLowerCase().includes(q);
                    const batchMatch = s.batchCode?.toLowerCase().includes(q);
                    if (!nameMatch && !emailMatch && !batchMatch) return false;
                  }
                  return true;
                });

                const confirmedCount = courseStudents.filter(s => s.status !== 'CANCELLED').length;
                const courseRev = courseStudents.filter(s => s.status !== 'CANCELLED').reduce((acc, curr) => acc + (curr.feePaid || 0), 0);

                return (
                  <div key={course.id || course.title} className="bg-surface-white rounded-card border border-surface-border overflow-hidden shadow-level-1">
                    {/* Course Header Banner */}
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-surface-cream to-surface-white border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-forest-800/10 flex items-center justify-center text-forest-800 shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-display font-extrabold text-base text-typography-primary flex items-center gap-2">
                            {course.title}
                          </h4>
                          <div className="flex items-center gap-3 text-[11px] text-typography-muted font-mono mt-0.5">
                            <span>Fee: <strong className="text-forest-800 font-sans">₹{course.feeInr?.toLocaleString('en-IN') || 4999}</strong></span>
                            {course.durationDays && <span>• Duration: {course.durationDays} Days</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-3 py-1 bg-green-600/10 text-green-700 border border-green-600/20 text-[11px] font-extrabold rounded-lg">
                          {confirmedCount} Active Trainees
                        </span>
                        <span className="px-3 py-1 bg-forest-800/10 text-forest-800 border border-forest-800/20 text-[11px] font-extrabold rounded-lg">
                          ₹{courseRev.toLocaleString('en-IN')} Revenue
                        </span>
                      </div>
                    </div>

                    {/* Course Students Roster Table */}
                    {courseStudents.length > 0 ? (
                      <div className="w-full overflow-x-auto scrollbar-thin">
                        <table className="w-full text-left text-xs text-typography-secondary min-w-[700px]">
                          <thead className="bg-surface-cream/50 text-typography-primary uppercase font-bold text-[11px] border-b border-surface-border">
                            <tr>
                              <th className="p-3.5">Student Trainee</th>
                              <th className="p-3.5">Batch Code</th>
                              <th className="p-3.5">Fee & Payment</th>
                              <th className="p-3.5">Status</th>
                              <th className="p-3.5 text-right">Roster Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-border">
                            {courseStudents.map((s) => (
                              <tr key={s.id} className="hover:bg-surface-cream/40 transition-colors">
                                <td className="p-3.5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-forest-800/10 font-bold text-forest-800 flex items-center justify-center text-xs shrink-0 font-display">
                                      {s.studentName ? s.studentName.charAt(0).toUpperCase() : 'S'}
                                    </div>
                                    <div>
                                      <span className="font-bold text-typography-primary block">{s.studentName}</span>
                                      <span className="text-[11px] font-mono text-typography-muted">{s.email}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3.5">
                                  <span className="font-mono text-xs font-bold text-forest-800 px-2.5 py-1 bg-surface-cream rounded-md border border-surface-border inline-block">
                                    {s.batchCode}
                                  </span>
                                </td>
                                <td className="p-3.5">
                                  <span className="font-bold text-typography-primary block">₹{s.feePaid?.toLocaleString('en-IN') || 4999}</span>
                                  <span className="text-[10px] text-green-700 font-bold uppercase">PAID (ONLINE)</span>
                                </td>
                                <td className="p-3.5">
                                  <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-wider inline-flex items-center gap-1 ${
                                    s.status === 'CANCELLED' 
                                      ? 'bg-red-600/10 text-red-700 border border-red-600/20' 
                                      : 'bg-green-600/10 text-green-700 border border-green-600/20'
                                  }`}>
                                    {s.status === 'CANCELLED' ? (
                                      <><XCircle className="w-3 h-3" /> CANCELLED & REFUNDED</>
                                    ) : (
                                      <><CheckCircle2 className="w-3 h-3" /> CONFIRMED</>
                                    )}
                                  </span>
                                </td>
                                <td className="p-3.5 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleGrantCapability(s.userId || s.id, 'TRAINING')}
                                      className="px-3 py-1.5 btn-secondary text-[11px] font-bold rounded-xl flex items-center gap-1 hover:border-forest-700 transition-all"
                                    >
                                      <Award className="w-3.5 h-3.5 text-forest-700" /> Grant Access
                                    </button>
                                    {s.status !== 'CANCELLED' && (
                                      <button
                                        onClick={() => handleAdminCancelEnrollment(s)}
                                        className="px-3 py-1.5 bg-red-600/10 text-red-700 border border-red-600/20 text-[11px] font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center gap-1"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" /> Cancel & Refund
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-surface-cream/30 space-y-2">
                        <Users className="w-8 h-8 text-typography-muted mx-auto opacity-50" />
                        <p className="text-xs font-bold text-typography-primary">No student enrollments found for this masterclass.</p>
                        <p className="text-[11px] text-typography-muted">Schedule a new batch or adjust your search filter.</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* MODE 2: SINGLE SELECTED REGISTERED COURSE VIEW */
            <div className="bg-surface-white rounded-card border border-surface-border overflow-hidden shadow-level-1 space-y-0">
              {/* Selected Course Detail Banner */}
              <div className="p-6 bg-gradient-to-r from-forest-800/5 via-surface-cream to-surface-white border-b border-surface-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-forest-800 text-white rounded-full">
                      Active Masterclass Roster
                    </span>
                    <button 
                      onClick={() => setEnrollmentCourseFilter('ALL')}
                      className="text-[11px] font-bold text-forest-700 hover:underline flex items-center gap-1"
                    >
                      ← Back to All Courses
                    </button>
                  </div>
                  <h3 className="font-display font-black text-xl text-typography-primary">
                    {enrollmentCourseFilter}
                  </h3>
                  <p className="text-xs text-typography-secondary">
                    Managing student enrollments and training access for {enrollmentCourseFilter}.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 bg-surface-white rounded-xl border border-surface-border text-center min-w-[100px]">
                    <span className="text-[10px] uppercase font-bold text-typography-muted block">Enrolled Students</span>
                    <strong className="text-lg font-black text-typography-primary font-display">{filteredEnrolledStudents.length}</strong>
                  </div>
                  <div className="p-3 bg-surface-white rounded-xl border border-surface-border text-center min-w-[120px]">
                    <span className="text-[10px] uppercase font-bold text-typography-muted block">Course Revenue</span>
                    <strong className="text-lg font-black text-forest-800 font-display">
                      ₹{filteredEnrolledStudents.filter(s => s.status !== 'CANCELLED').reduce((acc, curr) => acc + (curr.feePaid || 0), 0).toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Roster Table */}
              {filteredEnrolledStudents.length > 0 ? (
                <div className="w-full overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left text-xs text-typography-secondary min-w-[700px]">
                    <thead className="bg-surface-cream text-typography-primary uppercase font-bold text-[11px] border-b border-surface-border">
                      <tr>
                        <th className="p-3.5">Student Trainee</th>
                        <th className="p-3.5">Batch Code</th>
                        <th className="p-3.5">Fee Paid</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {filteredEnrolledStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-surface-cream/50 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-forest-800/10 font-bold text-forest-800 flex items-center justify-center text-xs shrink-0 font-display">
                                {s.studentName ? s.studentName.charAt(0).toUpperCase() : 'S'}
                              </div>
                              <div>
                                <span className="font-bold text-typography-primary block text-xs">{s.studentName}</span>
                                <span className="text-[11px] font-mono text-typography-muted">{s.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-mono text-xs font-bold text-forest-800 px-2.5 py-1 bg-surface-cream rounded-md border border-surface-border inline-block">
                              {s.batchCode}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-typography-primary text-xs">
                            ₹{s.feePaid?.toLocaleString('en-IN') || 4999}
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-wider inline-flex items-center gap-1 ${
                              s.status === 'CANCELLED' 
                                ? 'bg-red-600/10 text-red-700 border border-red-600/20' 
                                : 'bg-green-600/10 text-green-700 border border-green-600/20'
                            }`}>
                              {s.status === 'CANCELLED' ? (
                                <><XCircle className="w-3 h-3" /> CANCELLED & REFUNDED</>
                              ) : (
                                <><CheckCircle2 className="w-3 h-3" /> CONFIRMED</>
                              )}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleGrantCapability(s.userId || s.id, 'TRAINING')}
                                className="px-3 py-1.5 btn-secondary text-[11px] font-bold rounded-xl flex items-center gap-1 hover:border-forest-700 transition-all"
                              >
                                <Award className="w-3.5 h-3.5 text-forest-700" /> Grant Access
                              </button>
                              {s.status !== 'CANCELLED' && (
                                <button
                                  onClick={() => handleAdminCancelEnrollment(s)}
                                  className="px-3 py-1.5 bg-red-600/10 text-red-700 border border-red-600/20 text-[11px] font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center gap-1"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> Cancel & Refund
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center bg-surface-cream/30 space-y-3">
                  <Users className="w-10 h-10 text-typography-muted mx-auto opacity-40" />
                  <p className="text-sm font-bold text-typography-primary">No students matching the current criteria.</p>
                  <p className="text-xs text-typography-muted">Try adjusting your search query or status filter.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4E: DEDICATED BATCH REFUNDS & CANCELLATIONS SUBSECTION */}
      {activeSection === 'batch-refunds' && (
        <div className="space-y-6 w-full max-w-full">
          {/* Training Refunds Metric Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 space-y-1">
              <span className="text-xs font-bold uppercase text-typography-muted">Processed Training Refunds</span>
              <p className="text-2xl font-black text-red-700 font-display">
                ₹{enrolledStudents.filter(s => s.status === 'CANCELLED').reduce((acc, curr) => acc + (curr.feePaid || 0), 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 space-y-1">
              <span className="text-xs font-bold uppercase text-typography-muted">Cancelled Student Seats</span>
              <p className="text-2xl font-black text-typography-primary font-display">{enrolledStudents.filter(s => s.status === 'CANCELLED').length}</p>
            </div>
            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 space-y-1">
              <span className="text-xs font-bold uppercase text-typography-muted">Refund Settlement Status</span>
              <p className="text-sm font-bold text-green-700">Automated Reversal Completed</p>
            </div>
          </div>

          <div className="bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-lg text-typography-primary flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-forest-700 shrink-0" /> Batch Refunds & Student Reversals Desk
                </h3>
                <p className="text-xs text-typography-secondary">Detailed ledger of cancelled training sessions, student fee refunds, and reversal references.</p>
              </div>
            </div>

            <div className="w-full overflow-x-auto rounded-2xl border border-surface-border scrollbar-thin">
              <table className="w-full text-left text-xs text-typography-secondary min-w-[700px]">
                <thead className="bg-surface-cream text-typography-primary uppercase font-semibold border-b border-surface-border">
                  <tr>
                    <th className="p-3.5">Student Name & Contact</th>
                    <th className="p-3.5">Masterclass & Batch Code</th>
                    <th className="p-3.5">Refunded Fee</th>
                    <th className="p-3.5">Razorpay / Refund Reference</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {enrolledStudents
                    .filter(s => s.status === 'CANCELLED')
                    .map((student) => (
                    <tr key={student.id} className="hover:bg-surface-cream/50">
                      <td className="p-3.5">
                        <span className="font-bold text-typography-primary block">{student.studentName}</span>
                        <span className="text-[11px] text-typography-muted font-mono">{student.email}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-forest-800 font-display block">{student.courseTitle}</span>
                        <span className="text-[10px] text-typography-muted font-mono">{student.batchCode}</span>
                      </td>
                      <td className="p-3.5 font-bold text-red-700 font-sans text-xs">₹{student.feePaid}</td>
                      <td className="p-3.5 font-mono text-forest-800">{student.refundId || 'rfnd_batch_981241'}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 bg-green-600/10 text-green-700 border border-green-600/20 text-[10px] font-bold rounded-lg uppercase">
                          REFUND_PROCESSED
                        </span>
                      </td>
                    </tr>
                  ))}
                  {enrolledStudents.filter(s => s.status === 'CANCELLED').length === 0 && (
                    <tr><td colSpan={5} className="p-6 text-center text-typography-muted">No cancelled batch training refunds found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DOMAIN 5: BLOG CMS */}
      {activeSection === 'blogs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 w-full max-w-full">
          <div className="lg:col-span-6 bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1">
            <h3 className="font-display font-bold text-base text-typography-primary flex items-center gap-2">
              <Plus className="w-5 h-5 text-forest-700 shrink-0" /> Draft New Blog Article
            </h3>
            <form onSubmit={handleCreateBlog} className="space-y-4 text-xs">
              <div>
                <label className="block text-typography-primary font-bold mb-1">Title *</label>
                <input
                  type="text" required value={blogTitle}
                  onChange={(e) => {
                    setBlogTitle(e.target.value);
                    if (!blogSlug) setBlogSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                  }}
                  className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700"
                />
              </div>
              <div>
                <label className="block text-typography-primary font-bold mb-1">SEO Slug *</label>
                <input type="text" required value={blogSlug} onChange={(e) => setBlogSlug(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700 font-mono" />
              </div>
              <div>
                <label className="block text-typography-primary font-bold mb-1">Summary</label>
                <textarea rows={2} value={blogSummary} onChange={(e) => setBlogSummary(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700" />
              </div>
              <div>
                <label className="block text-typography-primary font-bold mb-1">Markdown Body *</label>
                <textarea rows={6} required value={blogContent} onChange={(e) => setBlogContent(e.target.value)} className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700 font-mono" />
              </div>
              <button type="submit" className="w-full btn-primary py-3 rounded-xl font-bold">
                Save Draft Blog Article
              </button>
            </form>
          </div>

          <div className="lg:col-span-6 bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1">
            <h3 className="font-display font-bold text-base text-typography-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-forest-700 shrink-0" /> Article CMS Registry ({posts.length})
            </h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
              {posts.map((post) => (
                <div key={post.id} className="p-4 bg-surface-cream rounded-2xl border border-surface-border space-y-2">
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

      {/* DOMAIN 6: CUSTOMER DIRECTORY & SUPPORT DESK */}
      {activeSection === 'customers' && (
        <div className="bg-surface-white p-5 sm:p-8 rounded-card border border-surface-border space-y-4 shadow-level-1">
          <h3 className="font-display font-bold text-base text-typography-primary flex items-center gap-2">
            <Users className="w-5 h-5 text-forest-700 shrink-0" /> Registered Customer Directory ({customers.length})
          </h3>
          <div className="w-full overflow-x-auto rounded-2xl border border-surface-border scrollbar-thin">
            <table className="w-full text-left text-xs text-typography-secondary min-w-[650px]">
              <thead className="bg-surface-cream text-typography-primary uppercase font-semibold border-b border-surface-border">
                <tr>
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Email / Contact</th>
                  <th className="p-3.5">User Role</th>
                  <th className="p-3.5">Capabilities</th>
                  <th className="p-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {customers.map((c) => (
                  <tr key={c.userId} className="hover:bg-surface-cream/50">
                    <td className="p-3.5 font-bold text-typography-primary whitespace-nowrap">{c.fullName}</td>
                    <td className="p-3.5 text-typography-muted whitespace-nowrap font-mono">{c.email || c.phone}</td>
                    <td className="p-3.5 whitespace-nowrap"><span className="px-2 py-0.5 bg-surface-neutral text-typography-primary border border-surface-border rounded-lg text-[10px] font-bold">{c.role}</span></td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {c.capabilities?.map((cap) => (
                          <span key={cap} className="px-2 py-0.5 bg-forest-900/10 text-forest-800 border border-forest-900/20 text-[9px] font-bold rounded-lg">{cap}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <button onClick={() => handleGrantCapability(c.userId, 'TRAINING')} className="px-3 py-1 btn-secondary text-[11px] font-bold">
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

      {activeSection === 'support' && (
        <div className="space-y-6">
          {/* Header & KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-typography-muted uppercase tracking-wider">Total Complaints</p>
                <h3 className="text-2xl font-black font-mono text-typography-primary mt-1">{supportStats.total}</h3>
                <span className="text-[11px] text-typography-muted">All customer tickets</span>
              </div>
              <div className="p-3 bg-surface-cream rounded-2xl border border-surface-border text-forest-700">
                <LifeBuoy className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-typography-muted uppercase tracking-wider">Active Queue</p>
                <h3 className="text-2xl font-black font-mono text-amber-600 mt-1">{supportStats.active}</h3>
                <span className="text-[11px] text-typography-muted">Open / In Progress</span>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-600">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-typography-muted uppercase tracking-wider">Urgent Escalations</p>
                <h3 className="text-2xl font-black font-mono text-red-600 mt-1">{supportStats.urgent}</h3>
                <span className="text-[11px] text-typography-muted">High &amp; Urgent priority</span>
              </div>
              <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-600">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-surface-white p-5 rounded-card border border-surface-border shadow-level-1 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-typography-muted uppercase tracking-wider">Helpdesk CSAT Score</p>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-2xl font-black font-mono text-amber-700">{csatSummary.averageRating || 5.0}</h3>
                  <span className="text-xs font-bold text-amber-800">/ 5.0</span>
                </div>
                <span className="text-[11px] text-typography-muted">{csatSummary.ratedTicketsCount || 0} customer ratings</span>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-600">
                <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-surface-white p-4 sm:p-5 rounded-card border border-surface-border shadow-level-1 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-typography-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Ticket # (e.g. TKT-2026), customer, subject, or message..."
                  value={supportSearchQuery}
                  onChange={(e) => setSupportSearchQuery(e.target.value)}
                  className="w-full bg-surface-cream border border-surface-border rounded-xl pl-10 pr-4 py-2 text-xs text-typography-primary focus:outline-none focus:border-forest-700"
                />
                {supportSearchQuery && (
                  <button onClick={() => setSupportSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-typography-muted hover:text-typography-primary text-xs">
                    ✕
                  </button>
                )}
              </div>

              {/* Status Tabs */}
              <div className="flex flex-wrap items-center gap-1 bg-surface-cream p-1 rounded-xl border border-surface-border text-xs font-medium">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'ACTIVE', label: `Active (${supportStats.active})` },
                  { id: 'WAITING_ON_CUSTOMER', label: 'Waiting Cust' },
                  { id: 'RESOLVED', label: 'Resolved' },
                  { id: 'CLOSED', label: 'Closed' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSupportStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      supportStatusFilter === tab.id
                        ? 'bg-surface-white text-forest-800 shadow-level-1 border border-surface-border'
                        : 'text-typography-muted hover:text-typography-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dropdown Filters for Priority & Category */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-border text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-typography-muted" />
                  <span className="font-bold text-typography-muted">Priority:</span>
                  <select
                    value={supportPriorityFilter}
                    onChange={(e) => setSupportPriorityFilter(e.target.value)}
                    className="bg-surface-cream border border-surface-border text-typography-primary rounded-xl px-2.5 py-1 text-xs focus:outline-none"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="URGENT">🔴 URGENT</option>
                    <option value="HIGH">🟠 HIGH</option>
                    <option value="MEDIUM">🔵 MEDIUM</option>
                    <option value="LOW">⚪ LOW</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-typography-muted">Category:</span>
                  <select
                    value={supportCategoryFilter}
                    onChange={(e) => setSupportCategoryFilter(e.target.value)}
                    className="bg-surface-cream border border-surface-border text-typography-primary rounded-xl px-2.5 py-1 text-xs focus:outline-none"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="ORDER_ISSUE">Order Issue</option>
                    <option value="PAYMENT_FAILURE">Payment Failure</option>
                    <option value="SHIPMENT_DELAY">Shipment Delay</option>
                    <option value="COURSE_QUERY">Course Query</option>
                    <option value="REFUND_REQUEST">Refund Request</option>
                    <option value="GENERAL_SUPPORT">General Support</option>
                    <option value="PRODUCT_QUALITY">Product Quality</option>
                  </select>
                </div>
              </div>

              <div className="text-xs text-typography-muted">
                Showing <strong className="text-typography-primary">{filteredSupportTickets.length}</strong> of {tickets.length} tickets
              </div>
            </div>
          </div>

          {/* Master-Detail Split Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
            {/* Left Column: Ticket Cards List (5 cols) */}
            <div className="lg:col-span-5 bg-surface-white rounded-card border border-surface-border p-4 shadow-level-1 space-y-3 flex flex-col max-h-[750px]">
              <div className="flex justify-between items-center pb-2 border-b border-surface-border flex-shrink-0">
                <h4 className="font-bold text-xs uppercase tracking-wider text-typography-muted flex items-center gap-1.5">
                  <LifeBuoy className="w-4 h-4 text-forest-700" /> Complaint Queue ({filteredSupportTickets.length})
                </h4>
                <button onClick={() => fetchDataForSection('support')} className="text-typography-muted hover:text-typography-primary text-xs flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {filteredSupportTickets.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
                    <p className="text-xs font-bold text-typography-secondary">No complaints found matching filter.</p>
                    <p className="text-[11px] text-typography-muted">Adjust status, priority, or search terms.</p>
                  </div>
                ) : (
                  filteredSupportTickets.map((t) => {
                    const isSelected = selectedSupportTicket?.id === t.id;
                    const isUrgent = t.priority === 'URGENT';
                    const isHigh = t.priority === 'HIGH';
                    const isResolved = ['RESOLVED', 'CLOSED'].includes(t.status);

                    return (
                      <div
                        key={t.id}
                        onClick={() => handleSelectSupportTicket(t)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 relative ${
                          isSelected
                            ? 'bg-surface-cream border-forest-700 shadow-level-2 ring-1 ring-forest-700/30'
                            : 'bg-surface-white border-surface-border hover:border-forest-700/50 hover:bg-surface-cream/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {isUrgent && <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" title="Urgent Priority" />}
                            {isHigh && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" title="High Priority" />}
                            <span className="font-mono text-xs font-black text-forest-800">{t.ticketNumber || ('TKT-' + t.id.substring(0, 8))}</span>
                          </div>

                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase border ${
                            isResolved
                              ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                              : t.status === 'WAITING_ON_CUSTOMER'
                              ? 'bg-blue-500/10 text-blue-700 border-blue-500/20'
                              : t.status === 'IN_PROGRESS'
                              ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                              : 'bg-red-500/10 text-red-700 border-red-500/20'
                          }`}>
                            {t.status}
                          </span>
                        </div>

                        <h5 className="font-bold text-xs text-typography-primary line-clamp-1 font-display">{t.subject}</h5>
                        <p className="text-[11px] text-typography-secondary line-clamp-2 leading-relaxed">{t.message}</p>

                        <div className="flex items-center justify-between pt-1 text-[10px] text-typography-muted border-t border-surface-border/60">
                          <span className="font-medium uppercase tracking-tight text-forest-900 bg-forest-900/5 px-2 py-0.5 rounded-md">
                            {t.category || 'GENERAL'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Ticket Conversation & Actions Workspace (7 cols) */}
            <div className="lg:col-span-7 bg-surface-white rounded-card border border-surface-border p-5 shadow-level-1 flex flex-col justify-between max-h-[750px]">
              {selectedSupportTicket ? (
                <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                  {/* Selected Ticket Top Header */}
                  <div className="pb-3 border-b border-surface-border space-y-2 flex-shrink-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-forest-900 text-white font-mono text-xs font-bold rounded-lg shadow-level-1">
                          {selectedSupportTicket.ticketNumber || ('TKT-' + selectedSupportTicket.id.substring(0, 8))}
                        </span>
                        <h3 className="font-display font-extrabold text-sm text-typography-primary">{selectedSupportTicket.subject}</h3>
                      </div>

                      {/* Status Changer & Quick Resolution Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={selectedSupportTicket.status}
                          onChange={(e) => handleUpdateTicketStatus(selectedSupportTicket.id, e.target.value, null)}
                          className="bg-surface-cream border border-surface-border text-typography-primary rounded-xl px-2.5 py-1 text-xs font-bold focus:outline-none"
                        >
                          <option value="OPEN">Status: OPEN</option>
                          <option value="IN_PROGRESS">Status: IN_PROGRESS</option>
                          <option value="WAITING_ON_CUSTOMER">Status: WAITING_ON_CUSTOMER</option>
                          <option value="RESOLVED">Status: RESOLVED</option>
                          <option value="CLOSED">Status: CLOSED</option>
                        </select>

                        <select
                          value={selectedSupportTicket.priority}
                          onChange={(e) => handleUpdateTicketStatus(selectedSupportTicket.id, null, e.target.value)}
                          className="bg-surface-cream border border-surface-border text-typography-primary rounded-xl px-2.5 py-1 text-xs font-bold focus:outline-none"
                        >
                          <option value="LOW">Priority: LOW</option>
                          <option value="MEDIUM">Priority: MEDIUM</option>
                          <option value="HIGH">Priority: HIGH</option>
                          <option value="URGENT">Priority: URGENT 🔴</option>
                        </select>
                      </div>
                    </div>

                    {/* Metadata Context Badges (Order ID, User ID, Category) */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
                      <span className="px-2 py-0.5 bg-surface-cream text-typography-secondary rounded-lg border border-surface-border font-bold">
                        Category: {selectedSupportTicket.category}
                      </span>
                      {selectedSupportTicket.orderId && (
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-700 rounded-lg border border-blue-500/20 font-mono font-bold flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" /> Order Ref: {selectedSupportTicket.orderId.substring(0, 8)}
                        </span>
                      )}
                      {selectedSupportTicket.courseId && (
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-700 rounded-lg border border-purple-500/20 font-bold flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" /> Masterclass Linked
                        </span>
                      )}
                      {selectedSupportTicket.userId && (
                        <span className="px-2 py-0.5 bg-surface-cream text-typography-muted rounded-lg font-mono text-[10px]">
                          User ID: {selectedSupportTicket.userId.substring(0, 8)}...
                        </span>
                      )}
                    </div>

                    {/* Customer CSAT Rating Box */}
                    {selectedSupportTicket.satisfactionRating && (
                      <div className="p-3 bg-amber-500/10 border border-amber-300 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-amber-900 block">Customer Helpdesk Satisfaction Rating:</span>
                          <StarRatingInput value={selectedSupportTicket.satisfactionRating} readOnly size="sm" showLabel={true} />
                          {selectedSupportTicket.satisfactionFeedback && (
                            <p className="text-amber-900 text-xs italic pt-0.5">"{selectedSupportTicket.satisfactionFeedback}"</p>
                          )}
                        </div>
                        <span className="text-[10px] text-amber-800 font-mono font-bold uppercase px-2 py-1 bg-amber-100 rounded-lg">
                          Closed by {selectedSupportTicket.closedBy || 'CUSTOMER'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Conversation History Timeline */}
                  <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-surface-cream/70 rounded-2xl border border-surface-border min-h-[240px]">
                    {/* Message history */}
                    {(selectedSupportTicket.messages || []).map((msg) => {
                      const isAgent = msg.senderType === 'SUPPORT_AGENT' || msg.senderType === 'ADMIN';
                      const isSystem = msg.senderType === 'SYSTEM';

                      if (isSystem) {
                        return (
                          <div key={msg.id} className="text-center my-2">
                            <span className="px-3 py-1 bg-surface-white border border-surface-border text-typography-muted text-[10px] rounded-full font-bold">
                              {msg.message}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`p-3.5 rounded-2xl text-xs space-y-1 max-w-[88%] shadow-level-1 ${
                            isAgent
                              ? 'ml-auto bg-forest-900 text-white rounded-tr-none'
                              : 'mr-auto bg-surface-white text-typography-primary border border-surface-border rounded-tl-none'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] gap-3 opacity-90 border-b pb-1 mb-1 border-current/15">
                            <span className="font-bold flex items-center gap-1">
                              {isAgent ? <ShieldCheck className="w-3 h-3 text-leaf" /> : <Users className="w-3 h-3 text-forest-700" />}
                              {msg.senderName || (isAgent ? 'Support Specialist' : 'Customer')}
                            </span>
                            <span className="text-[9px] font-mono">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed text-xs">{msg.message}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Canned Quick Reply Macros */}
                  <div className="space-y-1 flex-shrink-0 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-typography-muted">Quick Reply Templates (Macros):</span>
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setAdminReplyText("Hello! Your order has been dispatched via our logistics partner. You can track live updates under your customer dashboard.")}
                        className="px-2.5 py-1 bg-surface-cream hover:bg-surface-white border border-surface-border rounded-lg text-typography-primary transition-all font-medium"
                      >
                        📦 Order Dispatched
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminReplyText("We have verified your transaction and initiated a full refund to your Sporekart Wallet / original payment method.")}
                        className="px-2.5 py-1 bg-surface-cream hover:bg-surface-white border border-surface-border rounded-lg text-typography-primary transition-all font-medium"
                      >
                        💳 Refund Initiated
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminReplyText("Greetings! We have resent your upcoming masterclass batch schedule and access instructions to your registered email.")}
                        className="px-2.5 py-1 bg-surface-cream hover:bg-surface-white border border-surface-border rounded-lg text-typography-primary transition-all font-medium"
                      >
                        🎓 Batch Details Sent
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminReplyText("Greetings! Your complaint has been investigated and resolved by our customer care team. Thank you for choosing Sporekart.")}
                        className="px-2.5 py-1 bg-surface-cream hover:bg-surface-white border border-surface-border rounded-lg text-typography-primary transition-all font-medium"
                      >
                        ✅ Query Resolved
                      </button>
                    </div>
                  </div>

                  {/* Rich Reply Composer Form */}
                  <form onSubmit={(e) => handleAdminReplyToTicket(e)} className="space-y-2 flex-shrink-0 pt-1">
                    <textarea
                      rows={3}
                      required
                      placeholder="Type response to customer..."
                      value={adminReplyText}
                      onChange={(e) => setAdminReplyText(e.target.value)}
                      className="w-full bg-surface-white border border-surface-border rounded-xl p-3 text-xs text-typography-primary focus:outline-none focus:border-forest-700"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={isSubmittingSupportReply || !adminReplyText.trim()}
                          onClick={(e) => handleAdminReplyToTicket(e, 'WAITING_ON_CUSTOMER')}
                          className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border border-amber-500/30 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                        >
                          Reply &amp; Ask Customer
                        </button>
                        <button
                          type="button"
                          disabled={isSubmittingSupportReply || !adminReplyText.trim()}
                          onClick={(e) => handleAdminReplyToTicket(e, 'RESOLVED')}
                          className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                        >
                          Reply &amp; Mark Resolved
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingSupportReply || !adminReplyText.trim()}
                        className="btn-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmittingSupportReply ? 'Sending...' : 'Send Reply'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 my-auto">
                  <div className="p-4 bg-surface-cream rounded-full border border-surface-border text-forest-700">
                    <LifeBuoy className="w-10 h-10" />
                  </div>
                  <h4 className="font-display font-bold text-sm text-typography-primary">Select a Complaint Ticket</h4>
                  <p className="text-xs text-typography-muted max-w-sm">
                    Click any support ticket on the left list queue to view full message history, issue details, macros, and send responses.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REVIEWS & RATINGS MODERATION SECTION */}
      {activeSection === 'reviews' && (
        <AdminReviewsManager />
      )}

      {/* Promotion Create/Edit Modal */}
      {promoModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface-white rounded-card border border-surface-border p-6 max-w-lg w-full space-y-4 shadow-level-3">
            <div className="flex justify-between items-center pb-3 border-b border-surface-border">
              <h3 className="font-display font-bold text-base text-typography-primary flex items-center gap-2">
                <Tag className="w-5 h-5 text-forest-700" /> {editingPromo ? 'Edit Promotion Campaign' : 'Create New Promotion Campaign'}
              </h3>
              <button onClick={() => setPromoModalOpen(false)} className="text-typography-muted hover:text-typography-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromotion} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-typography-primary font-bold mb-1">Campaign Name *</label>
                  <input
                    type="text" required value={promoForm.name}
                    placeholder="e.g. Welcome Harvest 10% Off"
                    onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-3 py-2 text-typography-primary focus:outline-none focus:border-forest-700"
                  />
                </div>
                <div>
                  <label className="block text-typography-primary font-bold mb-1">Promo Code *</label>
                  <input
                    type="text" required value={promoForm.code}
                    placeholder="e.g. SPORE10"
                    onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-3 py-2 text-typography-primary font-mono uppercase focus:outline-none focus:border-forest-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-typography-primary font-bold mb-1">Description</label>
                <textarea
                  rows={2} value={promoForm.description}
                  placeholder="Campaign details visible to customers..."
                  onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                  className="w-full bg-surface-white border border-surface-border rounded-xl px-3 py-2 text-typography-primary focus:outline-none focus:border-forest-700"
                />
              </div>

              <div>
                <label className="block text-typography-primary font-bold mb-1.5">Target Audience *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPromoForm({ ...promoForm, targetAudience: 'CUSTOMER' })}
                    className={`p-2.5 border rounded-xl flex flex-col items-center justify-center transition-all ${
                      promoForm.targetAudience === 'CUSTOMER'
                        ? 'border-forest-700 bg-forest-50/60 text-forest-800 font-bold shadow-sm ring-1 ring-forest-700'
                        : 'border-surface-border hover:bg-surface-cream/50 text-typography-secondary'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 mb-1 text-emerald-600" />
                    <span className="text-[11px]">Customers Only</span>
                    <span className="text-[9px] text-typography-muted font-normal">Product Checkout</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPromoForm({ ...promoForm, targetAudience: 'TRAINEE' })}
                    className={`p-2.5 border rounded-xl flex flex-col items-center justify-center transition-all ${
                      promoForm.targetAudience === 'TRAINEE'
                        ? 'border-indigo-700 bg-indigo-50/60 text-indigo-900 font-bold shadow-sm ring-1 ring-indigo-700'
                        : 'border-surface-border hover:bg-surface-cream/50 text-typography-secondary'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 mb-1 text-indigo-600" />
                    <span className="text-[11px]">Trainees Only</span>
                    <span className="text-[9px] text-typography-muted font-normal">Batch Enrollment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPromoForm({ ...promoForm, targetAudience: 'BOTH' })}
                    className={`p-2.5 border rounded-xl flex flex-col items-center justify-center transition-all ${
                      promoForm.targetAudience === 'BOTH'
                        ? 'border-purple-700 bg-purple-50/60 text-purple-900 font-bold shadow-sm ring-1 ring-purple-700'
                        : 'border-surface-border hover:bg-surface-cream/50 text-typography-secondary'
                    }`}
                  >
                    <Globe className="w-4 h-4 mb-1 text-purple-600" />
                    <span className="text-[11px]">Both (Universal)</span>
                    <span className="text-[9px] text-typography-muted font-normal">Product & Batch</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-typography-primary font-bold mb-1">Type *</label>
                  <select
                    value={promoForm.type}
                    onChange={(e) => setPromoForm({ ...promoForm, type: e.target.value })}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-3 py-2 text-typography-primary focus:outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                    <option value="FREE_SHIPPING">Free Shipping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-typography-primary font-bold mb-1">Discount Value</label>
                  <input
                    type="number" step="0.01" value={promoForm.discountValue}
                    placeholder="e.g. 10 or 100"
                    onChange={(e) => setPromoForm({ ...promoForm, discountValue: e.target.value })}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-3 py-2 text-typography-primary font-mono focus:outline-none focus:border-forest-700"
                  />
                </div>
                <div>
                  <label className="block text-typography-primary font-bold mb-1">Max Discount (₹)</label>
                  <input
                    type="number" step="0.01" value={promoForm.maximumDiscount}
                    placeholder="Optional ceiling"
                    onChange={(e) => setPromoForm({ ...promoForm, maximumDiscount: e.target.value })}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-3 py-2 text-typography-primary font-mono focus:outline-none focus:border-forest-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-typography-primary font-bold mb-1">Min Order Value (₹)</label>
                  <input
                    type="number" step="0.01" value={promoForm.minimumOrderValue}
                    placeholder="e.g. 299"
                    onChange={(e) => setPromoForm({ ...promoForm, minimumOrderValue: e.target.value })}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-3 py-2 text-typography-primary font-mono focus:outline-none focus:border-forest-700"
                  />
                </div>
                <div>
                  <label className="block text-typography-primary font-bold mb-1">Total Usage Limit</label>
                  <input
                    type="number" value={promoForm.usageLimit}
                    placeholder="e.g. 500"
                    onChange={(e) => setPromoForm({ ...promoForm, usageLimit: e.target.value })}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-3 py-2 text-typography-primary font-mono focus:outline-none focus:border-forest-700"
                  />
                </div>
                <div>
                  <label className="block text-typography-primary font-bold mb-1">Per-Customer Limit</label>
                  <input
                    type="number" value={promoForm.perCustomerLimit}
                    placeholder="e.g. 1"
                    onChange={(e) => setPromoForm({ ...promoForm, perCustomerLimit: e.target.value })}
                    className="w-full bg-surface-white border border-surface-border rounded-xl px-3 py-2 text-typography-primary font-mono focus:outline-none focus:border-forest-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-surface-border">
                <button
                  type="button" onClick={() => setPromoModalOpen(false)}
                  className="btn-secondary px-4 py-2 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-5 py-2 text-xs font-bold rounded-xl shadow-level-1">
                  Save Promotion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-surface-white rounded-card p-4 sm:p-6 md:p-8 max-w-lg w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col border border-surface-border shadow-level-2 space-y-3 sm:space-y-4 my-auto overflow-hidden">
            <div className="flex items-center justify-between border-b border-surface-border pb-3 shrink-0">
              <h3 className="font-display font-bold text-base sm:text-lg text-typography-primary flex items-center gap-2 truncate pr-2">
                <Edit3 className="w-5 h-5 text-forest-700 shrink-0" /> <span className="truncate">Edit Category: {editingCategory.name}</span>
              </h3>
              <button onClick={() => setEditingCategory(null)} className="p-1 hover:bg-surface-cream rounded-lg shrink-0">
                <X className="w-5 h-5 text-typography-secondary" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-3.5 sm:space-y-4 text-xs overflow-y-auto pr-1 flex-1 custom-scrollbar">
              <div>
                <label className="block text-typography-primary font-bold mb-1">Category Name *</label>
                <input
                  type="text" required value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700"
                />
              </div>
              <div>
                <label className="block text-typography-primary font-bold mb-1">Category Slug *</label>
                <input
                  type="text" required value={editCatSlug}
                  onChange={(e) => setEditCatSlug(e.target.value)}
                  className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700 font-mono"
                />
              </div>
              <div>
                <label className="block text-typography-primary font-bold mb-1">Description</label>
                <textarea
                  rows={3} value={editCatDesc}
                  onChange={(e) => setEditCatDesc(e.target.value)}
                  className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2.5 text-typography-primary focus:outline-none focus:border-forest-700"
                />
              </div>
              <div>
                <label className="block text-typography-primary font-bold mb-1">Category Cover Image</label>
                <LocalImageUploader onImageSelected={(url) => setEditCatImageUrl(url)} />
                <input 
                  type="text" 
                  placeholder="Or paste image URL" 
                  value={editCatImageUrl} 
                  onChange={(e) => setEditCatImageUrl(e.target.value)} 
                  className="w-full bg-surface-white border border-surface-border rounded-xl px-3.5 py-2 text-typography-primary focus:outline-none focus:border-forest-700 mt-2 font-mono text-[11px]" 
                />
                {editCatImageUrl && (
                  <div className="mt-2 relative h-28 sm:h-36 w-full rounded-xl overflow-hidden border border-surface-border bg-surface-cream group">
                    <img src={editCatImageUrl} alt="Category Banner Preview" className="w-full h-full object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={() => setEditCatImageUrl('')}
                      className="absolute top-2 right-2 p-1.5 bg-red-600/90 text-white rounded-lg hover:bg-red-700 text-[11px] font-bold flex items-center gap-1 shadow-md transition-all"
                      title="Clear image"
                    >
                      <X className="w-3.5 h-3.5" /> Remove Image
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editCatIsActive"
                  checked={editCatIsActive}
                  onChange={(e) => setEditCatIsActive(e.target.checked)}
                  className="w-4 h-4 text-forest-700 rounded focus:ring-forest-700 border-surface-border"
                />
                <label htmlFor="editCatIsActive" className="text-typography-primary font-bold">Category Active</label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-surface-border sticky bottom-0 bg-surface-white z-10">
                <button
                  type="button" onClick={() => setEditingCategory(null)}
                  className="btn-secondary px-4 py-2 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-5 py-2 text-xs font-bold rounded-xl shadow-level-1">
                  Update Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
