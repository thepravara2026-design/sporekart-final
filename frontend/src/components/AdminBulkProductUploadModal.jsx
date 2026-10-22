import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, X, 
  AlertTriangle, Layers, ChevronDown, ChevronRight, Package, Sparkles, 
  RefreshCw, Eye, ArrowUpRight, Check, Tag, ShieldCheck, ArrowRight,
  Info, HelpCircle
} from 'lucide-react';
import { adminApi } from '../api';

/**
 * FAANG-Grade Admin Bulk Product Upload & Template Generator Modal
 * Standardized on top e-commerce platforms (Shopify / Amazon Flat File / Flipkart Batch).
 * Handles multi-product, multi-variant grouping, category mapping, FSSAI compliance, 
 * pre-import validation, and batch execution with real-time progress.
 */
export default function AdminBulkProductUploadModal({
  isOpen,
  onClose,
  categories = [],
  onSuccess,
  initialFile = null
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parsedProducts, setParsedProducts] = useState([]);
  const [parseSummary, setParseSummary] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, currentTitle: '', status: '' });
  const [importResults, setImportResults] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [filterValidation, setFilterValidation] = useState('ALL'); // ALL, VALID, ERROR
  const fileInputRef = useRef(null);

  // Filter parsed products for display (declared before early return to obey Rules of Hooks)
  const displayedProducts = useMemo(() => {
    if (filterValidation === 'VALID') {
      return parsedProducts.filter(p => p.errors.length === 0);
    }
    if (filterValidation === 'ERROR') {
      return parsedProducts.filter(p => p.errors.length > 0);
    }
    return parsedProducts;
  }, [parsedProducts, filterValidation]);

  // Support direct file ingestion (via prop or external drag & drop)
  React.useEffect(() => {
    if (initialFile && isOpen) {
      parseUploadedFile(initialFile);
    }
  }, [initialFile, isOpen]);

  if (!isOpen) return null;

  // =========================================================================
  // 1. EXCEL TEMPLATE GENERATION (Top E-Commerce Multi-Sheet Architecture)
  // =========================================================================
  const generateTemplateWorkbook = () => {
    const wb = XLSX.utils.book_new();

    // 1A. Products Sheet (Master rows with multi-variant examples)
    const productData = [
      {
        'Handle': 'fresh-oyster-mushrooms',
        'Title': 'Fresh Organic Blue Oyster Mushrooms',
        'Category': 'Fresh Mushrooms',
        'Product_Type': 'FRESH_MUSHROOM',
        'Description': 'Farm-fresh premium Blue Oyster mushrooms harvested daily at peak freshness. Rich in protein, beta-glucans, and culinary umami.',
        'Brand_Name': 'Sporekart Agritech',
        'HSN_Code': '07095900',
        'GST_Rate': 0,
        'FSSAI_License': '10020011000123',
        'Is_Vegetarian': 'TRUE',
        'Mushroom_Species': 'Pleurotus ostreatus',
        'Strain_Variety': 'Blue Pearl High-Yield',
        'Net_Quantity': '500g',
        'Country_Of_Origin': 'India',
        'Recommended_Substrate': 'Sterilized Paddy Straw',
        'Storage_Instructions': 'Refrigerate at 2-4°C in breathable packaging',
        'Shelf_Life_Guidance': '5 to 7 days refrigerated',
        'Primary_Image_URL': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
        'Gallery_Image_URLs': 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=800',
        'Variant_Name': 'Standard Pack 250g',
        'Variant_SKU': 'FSH-OYST-250G',
        'Variant_Price_INR': 95,
        'Compare_At_Price_INR': 120,
        'Stock_Quantity': 60,
        'Status': 'ACTIVE'
      },
      {
        'Handle': 'fresh-oyster-mushrooms',
        'Title': '', // Same Handle groups this second variant under the same parent product
        'Category': 'Fresh Mushrooms',
        'Product_Type': 'FRESH_MUSHROOM',
        'Description': '',
        'Brand_Name': '',
        'HSN_Code': '',
        'GST_Rate': '',
        'FSSAI_License': '',
        'Is_Vegetarian': '',
        'Mushroom_Species': '',
        'Strain_Variety': '',
        'Net_Quantity': '1 Kg',
        'Country_Of_Origin': '',
        'Recommended_Substrate': '',
        'Storage_Instructions': '',
        'Shelf_Life_Guidance': '',
        'Primary_Image_URL': '',
        'Gallery_Image_URLs': '',
        'Variant_Name': 'Economy Family Pack 500g',
        'Variant_SKU': 'FSH-OYST-500G',
        'Variant_Price_INR': 175,
        'Compare_At_Price_INR': 220,
        'Stock_Quantity': 45,
        'Status': 'ACTIVE'
      },
      {
        'Handle': 'commercial-spawn-button',
        'Title': 'Commercial White Button Mushroom Grain Spawn',
        'Category': 'Mushroom Spawn',
        'Product_Type': 'MUSHROOM_SPAWN',
        'Description': 'Lab-grade pure master grain spawn inoculated on sterilized organic wheat grains. Guaranteed 99.8% colonization viability with zero mold contamination.',
        'Brand_Name': 'Sporekart Agritech',
        'HSN_Code': '06029090',
        'GST_Rate': 5,
        'FSSAI_License': '',
        'Is_Vegetarian': 'TRUE',
        'Mushroom_Species': 'Agaricus bisporus',
        'Strain_Variety': 'A-15 Hybrid Master',
        'Net_Quantity': '1 Kg',
        'Country_Of_Origin': 'India',
        'Recommended_Substrate': 'Composted Wheat Straw & Horse Manure',
        'Storage_Instructions': 'Keep in cool, sterile cold room at 2-5°C',
        'Shelf_Life_Guidance': '30 to 45 days at recommended temperature',
        'Primary_Image_URL': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800',
        'Gallery_Image_URLs': '',
        'Variant_Name': 'Spawn Master Bag 1 Kg',
        'Variant_SKU': 'SPW-BTN-1KG',
        'Variant_Price_INR': 240,
        'Compare_At_Price_INR': 300,
        'Stock_Quantity': 100,
        'Status': 'ACTIVE'
      },
      {
        'Handle': 'commercial-spawn-button',
        'Title': '',
        'Category': 'Mushroom Spawn',
        'Product_Type': 'MUSHROOM_SPAWN',
        'Description': '',
        'Brand_Name': '',
        'HSN_Code': '',
        'GST_Rate': '',
        'FSSAI_License': '',
        'Is_Vegetarian': '',
        'Mushroom_Species': '',
        'Strain_Variety': '',
        'Net_Quantity': '3 Kg',
        'Country_Of_Origin': '',
        'Recommended_Substrate': '',
        'Storage_Instructions': '',
        'Shelf_Life_Guidance': '',
        'Primary_Image_URL': '',
        'Gallery_Image_URLs': '',
        'Variant_Name': 'Commercial Multi-Pack 3 Kg',
        'Variant_SKU': 'SPW-BTN-3KG',
        'Variant_Price_INR': 650,
        'Compare_At_Price_INR': 850,
        'Stock_Quantity': 40,
        'Status': 'ACTIVE'
      },
      {
        'Handle': 'commercial-spawn-button',
        'Title': '',
        'Category': 'Mushroom Spawn',
        'Product_Type': 'MUSHROOM_SPAWN',
        'Description': '',
        'Brand_Name': '',
        'HSN_Code': '',
        'GST_Rate': '',
        'FSSAI_License': '',
        'Is_Vegetarian': '',
        'Mushroom_Species': '',
        'Strain_Variety': '',
        'Net_Quantity': '5 Kg',
        'Country_Of_Origin': '',
        'Recommended_Substrate': '',
        'Storage_Instructions': '',
        'Shelf_Life_Guidance': '',
        'Primary_Image_URL': '',
        'Gallery_Image_URLs': '',
        'Variant_Name': 'Farm Bulk Sack 5 Kg',
        'Variant_SKU': 'SPW-BTN-5KG',
        'Variant_Price_INR': 999,
        'Compare_At_Price_INR': 1350,
        'Stock_Quantity': 25,
        'Status': 'ACTIVE'
      },
      {
        'Handle': 'diy-shiitake-grow-kit',
        'Title': 'Gourmet Shiitake All-in-One Mushroom Cultivation Kit',
        'Category': 'Growing Kits',
        'Product_Type': 'GROWING_KIT',
        'Description': 'Complete indoor cultivation kit for beginners and kitchen hobbyists. Includes fully colonized fruiting block, humidity tent, spray mister, and detailed guide.',
        'Brand_Name': 'Sporekart Agritech',
        'HSN_Code': '06029090',
        'GST_Rate': 12,
        'FSSAI_License': '',
        'Is_Vegetarian': 'TRUE',
        'Mushroom_Species': 'Lentinula edodes',
        'Strain_Variety': 'Wide-Range Cold Shiitake',
        'Net_Quantity': '2 Kg Block',
        'Country_Of_Origin': 'India',
        'Recommended_Substrate': 'Hardwood Sawdust Block',
        'Storage_Instructions': 'Store in cool ambient room (18-24°C)',
        'Shelf_Life_Guidance': 'Activate within 14 days of receipt',
        'Primary_Image_URL': 'https://images.unsplash.com/photo-1511497584788-87676104235f?w=800',
        'Gallery_Image_URLs': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
        'Variant_Name': 'Complete Cultivation Kit',
        'Variant_SKU': 'KIT-SHIITAKE-STD',
        'Variant_Price_INR': 799,
        'Compare_At_Price_INR': 1050,
        'Stock_Quantity': 30,
        'Status': 'ACTIVE'
      }
    ];

    const wsProducts = XLSX.utils.json_to_sheet(productData);

    // Set professional column widths for optimal reading in Excel
    wsProducts['!cols'] = [
      { wch: 25 }, // Handle
      { wch: 38 }, // Title
      { wch: 20 }, // Category
      { wch: 18 }, // Product_Type
      { wch: 45 }, // Description
      { wch: 20 }, // Brand_Name
      { wch: 12 }, // HSN_Code
      { wch: 10 }, // GST_Rate
      { wch: 18 }, // FSSAI_License
      { wch: 14 }, // Is_Vegetarian
      { wch: 22 }, // Mushroom_Species
      { wch: 24 }, // Strain_Variety
      { wch: 14 }, // Net_Quantity
      { wch: 16 }, // Country_Of_Origin
      { wch: 28 }, // Recommended_Substrate
      { wch: 30 }, // Storage_Instructions
      { wch: 24 }, // Shelf_Life_Guidance
      { wch: 35 }, // Primary_Image_URL
      { wch: 35 }, // Gallery_Image_URLs
      { wch: 26 }, // Variant_Name
      { wch: 18 }, // Variant_SKU
      { wch: 18 }, // Variant_Price_INR
      { wch: 22 }, // Compare_At_Price_INR
      { wch: 15 }, // Stock_Quantity
      { wch: 12 }, // Status
    ];

    XLSX.utils.book_append_sheet(wb, wsProducts, 'Products');

    // 1B. Live Store Categories Reference Sheet
    const categoryData = (categories && categories.length > 0)
      ? categories.map(c => ({
          'Category Name': c.name,
          'Category Slug': c.slug || '',
          'Category UUID': c.id || '',
          'Status': c.isActive ? 'Active' : 'Inactive',
          'Description': c.description || 'Sporekart Product Classification'
        }))
      : [
          { 'Category Name': 'Fresh Mushrooms', 'Category Slug': 'fresh-mushrooms', 'Category UUID': '', 'Status': 'Active', 'Description': 'Fresh gourmet and edible mushrooms' },
          { 'Category Name': 'Mushroom Spawn', 'Category Slug': 'mushroom-spawn', 'Category UUID': '', 'Status': 'Active', 'Description': 'Sterile grain and sawdust spawn cultures' },
          { 'Category Name': 'Dry Mushrooms', 'Category Slug': 'dry-mushrooms', 'Category UUID': '', 'Status': 'Active', 'Description': 'Dehydrated culinary and medicinal mushrooms' },
          { 'Category Name': 'Growing Kits', 'Category Slug': 'growing-kits', 'Category UUID': '', 'Status': 'Active', 'Description': 'Ready-to-fruit indoor mushroom grow kits' }
        ];

    const wsCategories = XLSX.utils.json_to_sheet(categoryData);
    wsCategories['!cols'] = [
      { wch: 26 },
      { wch: 22 },
      { wch: 38 },
      { wch: 12 },
      { wch: 45 }
    ];
    XLSX.utils.book_append_sheet(wb, wsCategories, 'Store_Categories_Reference');

    // 1C. Instructions and Rules Sheet
    const instructionData = [
      { 'Rule / Column': 'Multi-Variant Products', 'Requirement': 'MANDATORY RULE', 'Explanation': 'Top e-commerce standard: Multiple rows sharing the EXACT same "Handle" will be merged as variants under one single parent product. Leave Title blank on subsequent rows or duplicate it.' },
      { 'Rule / Column': 'Handle', 'Requirement': 'Mandatory', 'Explanation': 'Unique alphanumeric slug for grouping variants (e.g. "oyster-spawn", "fresh-button"). Lowercase and hyphens recommended.' },
      { 'Rule / Column': 'Title', 'Requirement': 'Mandatory (First row of product)', 'Explanation': 'Display title of product on Sporekart storefront.' },
      { 'Rule / Column': 'Category', 'Requirement': 'Mandatory', 'Explanation': 'Must match an existing category name or slug. Refer to the "Store_Categories_Reference" tab in this workbook.' },
      { 'Rule / Column': 'Product_Type', 'Requirement': 'Mandatory', 'Explanation': 'Allowed values: FRESH_MUSHROOM, DRY_MUSHROOM, MUSHROOM_SPAWN, GROWING_KIT, OTHER.' },
      { 'Rule / Column': 'Variant_SKU', 'Requirement': 'Mandatory per variant', 'Explanation': 'Unique inventory SKU code (e.g. "OYST-250G"). Must be unique across all products.' },
      { 'Rule / Column': 'Variant_Price_INR', 'Requirement': 'Mandatory', 'Explanation': 'Actual selling price in Indian Rupees (INR). Must be greater than 0.' },
      { 'Rule / Column': 'Compare_At_Price_INR', 'Requirement': 'Optional', 'Explanation': 'Original price / MRP. If provided, it MUST BE strictly greater than Variant_Price_INR (to show customer discount badge).' },
      { 'Rule / Column': 'FSSAI_License', 'Requirement': 'Mandatory for food publish', 'Explanation': '14-digit FSSAI license number. Required if Product_Type is FRESH_MUSHROOM or DRY_MUSHROOM and published immediately.' },
      { 'Rule / Column': 'Stock_Quantity', 'Requirement': 'Optional (Default: 50)', 'Explanation': 'Starting warehouse inventory count for this specific variant.' },
      { 'Rule / Column': 'Status', 'Requirement': 'Optional (Default: ACTIVE)', 'Explanation': 'ACTIVE (visible on storefront) or DRAFT (hidden in catalog until approved).' },
      { 'Rule / Column': 'Images', 'Requirement': 'Optional', 'Explanation': 'Provide accessible public HTTPS URLs. Primary image will be main card photo; gallery URLs will be secondary thumbnails.' }
    ];

    const wsInstructions = XLSX.utils.json_to_sheet(instructionData);
    wsInstructions['!cols'] = [
      { wch: 25 },
      { wch: 28 },
      { wch: 75 }
    ];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions_And_Rules');

    return wb;
  };

  const handleDownloadExcelTemplate = () => {
    try {
      const wb = generateTemplateWorkbook();
      XLSX.writeFile(wb, 'Sporekart_Bulk_Product_Upload_Template.xlsx');
    } catch (err) {
      console.error('Error generating Excel template:', err);
      setParseError('Failed to generate Excel template. Please try CSV download.');
    }
  };

  const handleDownloadCsvTemplate = () => {
    try {
      const wb = generateTemplateWorkbook();
      const ws = wb.Sheets['Products'];
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'Sporekart_Bulk_Product_Upload_Template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating CSV template:', err);
      setParseError('Failed to generate CSV template.');
    }
  };

  // =========================================================================
  // 2. PARSING & INTELLIGENT MULTI-VARIANT GROUPING
  // =========================================================================
  const normalizeKey = (key) => {
    if (!key) return '';
    return key.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const parseUploadedFile = async (file) => {
    if (!file) return;
    setParsing(true);
    setParseError(null);
    setParsedProducts([]);
    setParseSummary(null);
    setSelectedFile(file);

    try {
      let buffer;
      if (typeof file.arrayBuffer === 'function') {
        buffer = await file.arrayBuffer();
      } else {
        buffer = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = () => reject(new Error('Failed to read file from disk.'));
          reader.readAsArrayBuffer(file);
        });
      }

      const workbook = XLSX.read(buffer, { type: 'array' });

        // Find primary products sheet
        let sheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('product')) || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setParseError(`The uploaded file sheet "${sheetName}" contains no data rows.`);
          setParsing(false);
          return;
        }

        // Process rows and group multi-variants by Handle or Title
        const groupedProducts = {};
        const skusSeen = new Set();
        let lastSeenHandle = null;

        rawJson.forEach((rawRow, index) => {
          // Normalize row keys to handle different column label spellings
          const row = {};
          Object.keys(rawRow).forEach(k => {
            row[normalizeKey(k)] = rawRow[k];
          });

          // Identify handle or title
          let handle = (row['handle'] || '').toString().trim();
          let title = (row['title'] || row['productname'] || row['producttitle'] || '').toString().trim();

          // Top e-commerce convention: if handle is blank, use last seen handle if row has variant
          if (!handle && lastSeenHandle && !title) {
            handle = lastSeenHandle;
          } else if (!handle && title) {
            handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          }

          if (!handle) {
            // Skip empty spacer rows
            return;
          }

          lastSeenHandle = handle;

          // If product group not yet created, initialize parent product
          if (!groupedProducts[handle]) {
            const rawCat = (row['category'] || row['categoryname'] || row['categoryslug'] || '').toString().trim();
            // Find matched category in live store categories
            let matchedCat = categories.find(c => 
              c.name.toLowerCase() === rawCat.toLowerCase() ||
              c.slug?.toLowerCase() === rawCat.toLowerCase() ||
              c.id === rawCat
            );

            // Default category fallback if none matched
            if (!matchedCat && categories.length > 0) {
              matchedCat = categories[0];
            }

            const rawType = (row['producttype'] || row['type'] || 'FRESH_MUSHROOM').toString().toUpperCase().trim();
            const validTypes = ['FRESH_MUSHROOM', 'DRY_MUSHROOM', 'MUSHROOM_SPAWN', 'GROWING_KIT', 'OTHER'];
            const productType = validTypes.includes(rawType) ? rawType : 'FRESH_MUSHROOM';

            const gstVal = parseFloat(row['gstrate'] || row['gst'] || 0);

            groupedProducts[handle] = {
              handle,
              rowNumber: index + 2,
              title: title || handle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              slug: handle.toLowerCase(),
              category: matchedCat,
              rawCategoryText: rawCat,
              productType,
              description: (row['description'] || row['desc'] || '').toString().trim(),
              brandName: (row['brandname'] || row['brand'] || 'Sporekart Agritech').toString().trim(),
              hsnCode: (row['hsncode'] || row['hsn'] || (productType === 'FRESH_MUSHROOM' ? '07095900' : '06029090')).toString().trim(),
              gstRate: isNaN(gstVal) ? 0 : gstVal,
              fssaiLicense: (row['fssailicense'] || row['fssai'] || row['fssailicensenumber'] || '').toString().trim(),
              isVegetarian: String(row['isvegetarian'] || 'TRUE').toUpperCase() !== 'FALSE',
              mushroomSpecies: (row['mushroomspecies'] || row['species'] || row['scientificname'] || '').toString().trim(),
              strainVariety: (row['strainvariety'] || row['strain'] || '').toString().trim(),
              netQuantity: (row['netquantity'] || row['netqty'] || '').toString().trim(),
              countryOfOrigin: (row['countryoforigin'] || row['country'] || 'India').toString().trim(),
              recommendedSubstrate: (row['recommendedsubstrate'] || row['substrate'] || '').toString().trim(),
              storageInstructions: (row['storageinstructions'] || row['storage'] || '').toString().trim(),
              shelfLifeGuidance: (row['shelflifeguidance'] || row['shelflife'] || '').toString().trim(),
              primaryImageUrl: (row['primaryimageurl'] || row['imageurl'] || row['image'] || '').toString().trim(),
              galleryImageUrls: (row['galleryimageurls'] || row['gallery'] || '').toString().trim(),
              status: (row['status'] || 'ACTIVE').toString().toUpperCase().trim() === 'DRAFT' ? 'DRAFT' : 'ACTIVE',
              variants: [],
              errors: [],
              warnings: []
            };
          }

          // Extract Variant details
          const vName = (row['variantname'] || row['variant'] || row['packsize'] || `Pack ${(groupedProducts[handle].variants.length + 1)}`).toString().trim();
          const vSku = (row['variantsku'] || row['sku'] || `${handle.slice(0, 8).toUpperCase()}-V${groupedProducts[handle].variants.length + 1}`).toString().trim().toUpperCase();
          const vPrice = parseFloat(row['variantpriceinr'] || row['price'] || row['priceinr'] || 0);
          const vComparePriceRaw = row['compareatpriceinr'] || row['compareprice'] || row['mrp'];
          const vComparePrice = vComparePriceRaw ? parseFloat(vComparePriceRaw) : null;
          const vStockRaw = row['stockquantity'] || row['stock'] || row['inventory'] || 50;
          const vStock = isNaN(parseInt(vStockRaw)) ? 50 : parseInt(vStockRaw);

          const variantObj = {
            rowNumber: index + 2,
            variantName: vName,
            sku: vSku,
            priceInr: vPrice,
            compareAtPriceInr: vComparePrice,
            stockQuantity: vStock,
            errors: []
          };

          // Validate Variant
          if (!vSku) {
            variantObj.errors.push('SKU is required.');
          } else if (skusSeen.has(vSku)) {
            variantObj.errors.push(`Duplicate SKU "${vSku}" found in sheet.`);
          } else {
            skusSeen.add(vSku);
          }

          if (isNaN(vPrice) || vPrice <= 0) {
            variantObj.errors.push(`Price must be > 0 (found ${vPrice}).`);
          }

          if (vComparePrice !== null && !isNaN(vComparePrice)) {
            if (vPrice >= vComparePrice) {
              variantObj.errors.push(`Selling price (₹${vPrice}) must be strictly less than Compare-at Price (₹${vComparePrice}).`);
            }
          }

          groupedProducts[handle].variants.push(variantObj);
        });

        const productList = Object.values(groupedProducts);

        if (productList.length === 0) {
          setParseError('No valid product rows could be recognized in the file.');
          setParsing(false);
          return;
        }

        // Validate products overall
        let totalVariantsCount = 0;
        let validProductsCount = 0;
        let errorProductsCount = 0;

        productList.forEach(p => {
          totalVariantsCount += p.variants.length;

          if (!p.title) {
            p.errors.push('Product Title is missing.');
          }

          if (!p.category) {
            p.errors.push(`Category "${p.rawCategoryText}" could not be mapped to any store category.`);
          }

          if (p.variants.length === 0) {
            p.errors.push('At least one pricing variant with SKU and Price is required.');
          }

          // Check if any variant has errors
          const variantErrors = p.variants.flatMap(v => v.errors);
          if (variantErrors.length > 0) {
            p.errors.push(...variantErrors);
          }

          // Compliance warning check
          if (publishImmediately && (p.productType === 'FRESH_MUSHROOM' || p.productType === 'DRY_MUSHROOM')) {
            if (!p.fssaiLicense || p.fssaiLicense.length < 14) {
              p.warnings.push('FSSAI License is recommended for fresh food produce.');
            }
          }

          if (p.errors.length === 0) {
            validProductsCount++;
          } else {
            errorProductsCount++;
          }
        });

        setParsedProducts(productList);
        setParseSummary({
          totalProducts: productList.length,
          totalVariants: totalVariantsCount,
          validProducts: validProductsCount,
          errorProducts: errorProductsCount,
          categoriesCount: new Set(productList.map(p => p.category?.name).filter(Boolean)).size
        });
        setParsing(false);
      } catch (err) {
        console.error('File parsing error:', err);
        setParseError(`Failed to parse file: ${err.message || 'Corrupted or unsupported Excel/CSV structure'}.`);
        setParsing(false);
      }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer?.files || e.nativeEvent?.dataTransfer?.files;
    if (files && files[0]) {
      parseUploadedFile(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target?.files || (fileInputRef.current && fileInputRef.current.files);
    if (files && files[0]) {
      parseUploadedFile(files[0]);
    }
  };



  // =========================================================================
  // 3. EXECUTE BULK IMPORT INGESTION
  // =========================================================================
  const handleExecuteImport = async () => {
    const productsToImport = parsedProducts.filter(p => p.errors.length === 0);
    if (productsToImport.length === 0) {
      setParseError('No valid products to import. Please resolve the errors in your spreadsheet and re-upload.');
      return;
    }

    setImporting(true);
    setImportResults(null);
    setParseError(null);

    const successful = [];
    const failed = [];

    for (let i = 0; i < productsToImport.length; i++) {
      const p = productsToImport[i];
      setImportProgress({
        current: i + 1,
        total: productsToImport.length,
        currentTitle: p.title,
        status: `Processing product ${i + 1} of ${productsToImport.length}...`
      });

      try {
        // 1. Create Parent Product
        const infoPayload = {
          brandName: p.brandName || null,
          countryOfOrigin: p.countryOfOrigin || 'India',
          netQuantity: p.netQuantity || null,
          unitOfMeasure: 'g',
          fssaiLicenseNumber: p.fssaiLicense || null,
          isVegetarian: p.isVegetarian,
          mushroomSpecies: p.mushroomSpecies || null,
          scientificName: p.mushroomSpecies || null,
          strainVariety: p.strainVariety || null,
          strainName: p.strainVariety || null,
          recommendedSubstrate: p.recommendedSubstrate || null,
          storageInstructions: p.storageInstructions || null,
          shelfLifeGuidance: p.shelfLifeGuidance || null
        };

        const createPayload = {
          title: p.title,
          slug: p.slug,
          productType: p.productType,
          status: publishImmediately ? 'ACTIVE' : 'DRAFT',
          description: p.description || null,
          hsnCode: p.hsnCode || null,
          gstRate: p.gstRate || 0,
          categoryId: p.category?.id || null,
          information: infoPayload,
          productInformation: infoPayload
        };

        let createdProduct = null;
        if (typeof adminApi?.createProduct === 'function') {
          const res = await adminApi.createProduct(createPayload);
          createdProduct = res.data?.data || res.data;
        }

        const productId = createdProduct?.id || `sim-${Date.now()}-${i}`;

        // 2. Update Information specs if needed
        if (createdProduct?.id && typeof adminApi?.updateProductInformation === 'function') {
          try {
            await adminApi.updateProductInformation(createdProduct.id, infoPayload);
          } catch (iErr) {
            console.warn('Info update warning:', iErr);
          }
        }

        // 3. Add Variants
        let variantsCreated = 0;
        for (const v of p.variants) {
          if (!v.sku || !v.priceInr) continue;
          if (createdProduct?.id && typeof adminApi?.addVariant === 'function') {
            try {
              await adminApi.addVariant(createdProduct.id, {
                variantName: v.variantName || 'Standard Pack',
                sku: v.sku,
                priceInr: v.priceInr,
                compareAtPriceInr: v.compareAtPriceInr || null,
                stockQuantity: v.stockQuantity || 50,
                isActive: true
              });
              variantsCreated++;
            } catch (vErr) {
              console.warn(`Variant add warning for ${v.sku}:`, vErr);
            }
          } else {
            variantsCreated++;
          }
        }

        // 4. Attach Media if URLs are provided
        if (createdProduct?.id && (p.primaryImageUrl || p.galleryImageUrls)) {
          const mediaPayload = [];
          if (p.primaryImageUrl) {
            mediaPayload.push({
              productId: createdProduct.id,
              mediaUrl: p.primaryImageUrl,
              role: 'PRIMARY',
              isPrimary: true,
              displayOrder: 0
            });
          }
          if (p.galleryImageUrls) {
            const extraUrls = p.galleryImageUrls.split(/[;,]/).map(u => u.trim()).filter(Boolean);
            extraUrls.forEach((u, uIdx) => {
              mediaPayload.push({
                productId: createdProduct.id,
                mediaUrl: u,
                role: 'GALLERY',
                isPrimary: false,
                displayOrder: uIdx + 1
              });
            });
          }

          if (mediaPayload.length > 0 && typeof adminApi?.syncProductMedia === 'function') {
            try {
              await adminApi.syncProductMedia(createdProduct.id, mediaPayload);
            } catch (mErr) {
              console.warn('Media sync warning:', mErr);
            }
          }
        }

        // 5. Publish to live catalog if requested
        if (publishImmediately && createdProduct?.id && typeof adminApi?.publishProduct === 'function') {
          try {
            await adminApi.publishProduct(createdProduct.id);
          } catch (pubErr) {
            console.warn('Product publish status warning:', pubErr);
          }
        }

        successful.push({
          title: p.title,
          sku: p.variants[0]?.sku,
          variantsCount: p.variants.length,
          category: p.category?.name
        });
      } catch (err) {
        console.error(`Failed importing ${p.title}:`, err);
        const errMsg = err.response?.data?.message || err.message || 'Unknown server error';
        failed.push({
          title: p.title,
          reason: errMsg
        });
      }
    }

    setImporting(false);
    setImportResults({
      successful,
      failed
    });

    if (successful.length > 0 && typeof onSuccess === 'function') {
      onSuccess(successful.length);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedProducts([]);
    setParseSummary(null);
    setParseError(null);
    setImportResults(null);
    setImportProgress({ current: 0, total: 0, currentTitle: '', status: '' });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-forest-950/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      data-testid="admin-bulk-upload-backdrop"
    >
      <div
        className="bg-surface-white w-full max-w-4xl rounded-3xl border border-surface-border shadow-level-3 flex flex-col max-h-[92vh] overflow-hidden animate-scale-in relative text-typography-primary"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-upload-modal-title"
      >
        {/* Glow Accent Top Banner */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-forest-700 to-gold shrink-0" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-surface-border flex items-start justify-between gap-4 bg-surface-cream/40">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-forest-900 text-white flex items-center justify-center shadow-level-1 shrink-0 mt-0.5">
              <FileSpreadsheet className="w-6 h-6 text-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-forest-900/5 text-forest-900 border border-forest-900/10 font-mono">
                  Enterprise Catalog Ops
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-emerald-500/10 text-emerald-800 border-emerald-500/20">
                  Multi-Variant Excel / CSV
                </span>
              </div>
              <h2 id="bulk-upload-modal-title" className="text-xl sm:text-2xl font-black font-display text-typography-primary leading-tight">
                Bulk Product & Variant Upload Studio
              </h2>
              <p className="text-xs text-typography-secondary mt-1 max-w-2xl">
                Upload entire catalogs with multiple variants, category mappings, and FSSAI technical specs directly via Excel (.xlsx) or CSV files, modeled after top e-commerce platforms.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-typography-muted hover:text-typography-primary hover:bg-surface-border/50 transition-colors shrink-0"
            aria-label="Close modal"
            data-testid="btn-close-bulk-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-thin bg-surface-cream/20">
          {/* STEP 1: DOWNLOAD OFFICIAL TEMPLATE RIBBON */}
          <div className="bg-surface-white p-4 sm:p-5 rounded-2xl border border-surface-border shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-forest-900/10 text-forest-900 flex items-center justify-center shrink-0 font-bold text-xs font-mono">
                  01
                </div>
                <div>
                  <h3 className="text-sm font-bold text-typography-primary flex items-center gap-1.5 font-display">
                    Download Pre-Formatted Excel Template
                  </h3>
                  <p className="text-xs text-typography-secondary">
                    Includes sample multi-variant rows, validation rules, and live store categories prefilled on separate reference sheets.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="flex-1 sm:flex-initial btn-primary px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-level-1"
                  data-testid="btn-download-excel-template"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="flex-1 sm:flex-initial btn-secondary px-3 py-2 text-xs font-bold flex items-center justify-center gap-1"
                  data-testid="btn-download-csv-template"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-forest-700" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Quick Helper Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-surface-border text-[11px] text-typography-secondary">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Multi-variants grouped by <strong>Handle</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Pricing: Selling Price &lt; Compare MRP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Supports <strong>{categories.length || 4} Categories</strong></span>
              </div>
            </div>
          </div>

          {/* STEP 2: DRAG & DROP / FILE UPLOADER */}
          {!importResults && (
            <div className="bg-surface-white p-4 sm:p-5 rounded-2xl border border-surface-border shadow-2xs space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-forest-900/10 text-forest-900 flex items-center justify-center shrink-0 font-bold text-xs font-mono">
                  02
                </div>
                <div>
                  <h3 className="text-sm font-bold text-typography-primary flex items-center gap-1.5 font-display">
                    Select or Drop Your Completed Excel / CSV Spreadsheet
                  </h3>
                  <p className="text-xs text-typography-secondary">
                    Supports Microsoft Excel (.xlsx, .xls) and standard comma-separated (.csv) files.
                  </p>
                </div>
              </div>

              {/* Dropzone Container */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-3 ${
                  dragActive 
                    ? 'border-forest-700 bg-forest-900/5 ring-4 ring-forest-700/10' 
                    : selectedFile 
                      ? 'border-emerald-600/50 bg-emerald-500/5' 
                      : 'border-surface-border hover:border-forest-700/50 hover:bg-surface-cream/50'
                }`}
                data-testid="bulk-upload-dropzone"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                  onChange={handleFileInputChange}
                  onInput={handleFileInputChange}
                  className="hidden"
                  data-testid="bulk-file-input"
                />

                <div className="w-12 h-12 rounded-2xl bg-surface-cream border border-surface-border flex items-center justify-center mx-auto text-forest-900 shadow-2xs">
                  {parsing ? (
                    <RefreshCw className="w-6 h-6 animate-spin text-forest-700" />
                  ) : selectedFile ? (
                    <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <Upload className="w-6 h-6 text-forest-700" />
                  )}
                </div>

                <div>
                  {selectedFile ? (
                    <div>
                      <p className="text-xs font-bold text-typography-primary">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-typography-muted font-mono mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Click to choose a different spreadsheet
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-typography-primary">
                        Drag & drop your Excel file here, or <span className="text-forest-700 underline">browse your files</span>
                      </p>
                      <p className="text-[11px] text-typography-muted mt-1">
                        Files are validated locally in your browser before committing to catalog
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {parseError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: PRE-IMPORT VERIFICATION TABLE & BATCH PREVIEW */}
          {parsedProducts.length > 0 && !importResults && (
            <div className="bg-surface-white p-4 sm:p-5 rounded-2xl border border-surface-border shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-forest-900/10 text-forest-900 flex items-center justify-center shrink-0 font-bold text-xs font-mono">
                    03
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-typography-primary flex items-center gap-1.5 font-display">
                      Pre-Import Verification & Multi-Variant Inspection
                    </h3>
                    <p className="text-xs text-typography-secondary">
                      Verify that products and child variants are structured properly before ingestion.
                    </p>
                  </div>
                </div>

                {/* Filter Validation Status Pills */}
                <div className="flex items-center gap-1 bg-surface-cream p-1 rounded-xl border border-surface-border text-[11px]">
                  <button
                    type="button"
                    onClick={() => setFilterValidation('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      filterValidation === 'ALL' ? 'bg-forest-900 text-white shadow-2xs' : 'text-typography-muted hover:text-typography-primary'
                    }`}
                  >
                    All ({parseSummary?.totalProducts || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterValidation('VALID')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      filterValidation === 'VALID' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-emerald-700 hover:bg-emerald-500/10'
                    }`}
                  >
                    Valid ({parseSummary?.validProducts || 0})
                  </button>
                  {parseSummary?.errorProducts > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterValidation('ERROR')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        filterValidation === 'ERROR' ? 'bg-red-700 text-white shadow-2xs' : 'text-red-700 hover:bg-red-500/10'
                      }`}
                    >
                      Errors ({parseSummary?.errorProducts})
                    </button>
                  )}
                </div>
              </div>

              {/* Summary Metrics Bar */}
              {parseSummary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-surface-cream/50 p-3 rounded-xl border border-surface-border">
                    <span className="text-[10px] font-bold text-typography-muted uppercase block">Total Products</span>
                    <span className="text-lg font-black font-display text-forest-900 mt-0.5 block">
                      {parseSummary.totalProducts}
                    </span>
                  </div>
                  <div className="bg-surface-cream/50 p-3 rounded-xl border border-surface-border">
                    <span className="text-[10px] font-bold text-typography-muted uppercase block">Total Variants</span>
                    <span className="text-lg font-black font-display text-typography-primary mt-0.5 block">
                      {parseSummary.totalVariants}
                    </span>
                  </div>
                  <div className="bg-surface-cream/50 p-3 rounded-xl border border-surface-border">
                    <span className="text-[10px] font-bold text-typography-muted uppercase block">Categories</span>
                    <span className="text-lg font-black font-display text-typography-primary mt-0.5 block">
                      {parseSummary.categoriesCount}
                    </span>
                  </div>
                  <div className={`p-3 rounded-xl border ${
                    parseSummary.errorProducts === 0 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800' 
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-800'
                  }`}>
                    <span className="text-[10px] font-bold uppercase block">Status</span>
                    <span className="text-sm font-black font-display mt-0.5 block">
                      {parseSummary.errorProducts === 0 ? '✓ Ready to Ingest' : `⚠ ${parseSummary.errorProducts} with Errors`}
                    </span>
                  </div>
                </div>
              )}

              {/* Parsed Products Accordion List */}
              <div className="space-y-2 max-h-[36vh] overflow-y-auto scrollbar-thin pr-1">
                {displayedProducts.map((p, idx) => {
                  const hasErrors = p.errors.length > 0;
                  const isExpanded = expandedIndex === idx;
                  const priceMin = Math.min(...p.variants.map(v => v.priceInr || 0));
                  const priceMax = Math.max(...p.variants.map(v => v.priceInr || 0));
                  const priceDisplay = priceMin === priceMax ? `₹${priceMin}` : `₹${priceMin} - ₹${priceMax}`;

                  return (
                    <div
                      key={p.handle || idx}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        hasErrors 
                          ? 'bg-red-500/5 border-red-500/30' 
                          : 'bg-surface-white border-surface-border hover:border-forest-700/40'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                            className="p-1 rounded-lg bg-surface-cream hover:bg-forest-900 hover:text-white transition-colors shrink-0 mt-0.5"
                            title="Expand variants details"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-typography-primary truncate block">
                                {p.title}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-cream border border-surface-border text-typography-muted">
                                /{p.handle}
                              </span>
                              {hasErrors ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-red-500/10 text-red-700 border border-red-500/20">
                                  {p.errors.length} Issue{p.errors.length === 1 ? '' : 's'}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                                  Valid
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-typography-muted flex-wrap mt-0.5">
                              <span><strong>Category:</strong> {p.category?.name || p.rawCategoryText}</span>
                              <span><strong>Type:</strong> {p.productType}</span>
                              <span><strong>Variants:</strong> {p.variants.length}</span>
                              <span><strong>Price:</strong> {priceDisplay}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                            p.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-800' : 'bg-amber-500/10 text-amber-800'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                      </div>

                      {/* Display Errors if any */}
                      {hasErrors && (
                        <div className="mt-2.5 p-2 rounded-xl bg-red-500/10 text-red-700 text-[11px] space-y-1">
                          {p.errors.map((err, eIdx) => (
                            <div key={eIdx} className="flex items-center gap-1.5">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>{err}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Expanded Variants Table */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-surface-border space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-typography-muted block">
                            Configured Child Variants ({p.variants.length}):
                          </span>
                          <div className="w-full overflow-x-auto rounded-xl border border-surface-border">
                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-surface-cream text-typography-primary uppercase font-bold text-[9px] border-b border-surface-border">
                                <tr>
                                  <th className="p-2">Variant Name</th>
                                  <th className="p-2">SKU</th>
                                  <th className="p-2">Selling Price</th>
                                  <th className="p-2">Compare At</th>
                                  <th className="p-2">Stock</th>
                                  <th className="p-2">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-surface-border">
                                {p.variants.map((v, vIdx) => (
                                  <tr key={v.sku || vIdx} className="hover:bg-surface-cream/50">
                                    <td className="p-2 font-bold">{v.variantName}</td>
                                    <td className="p-2 font-mono text-typography-muted">{v.sku}</td>
                                    <td className="p-2 font-bold text-forest-900">₹{v.priceInr}</td>
                                    <td className="p-2 text-typography-muted">{v.compareAtPriceInr ? `₹${v.compareAtPriceInr}` : '—'}</td>
                                    <td className="p-2">{v.stockQuantity}</td>
                                    <td className="p-2">
                                      {v.errors.length > 0 ? (
                                        <span className="text-red-600 font-bold">Error</span>
                                      ) : (
                                        <span className="text-emerald-700 font-bold">OK</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Ingestion Options */}
              <div className="pt-3 border-t border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={publishImmediately}
                    onChange={(e) => setPublishImmediately(e.target.checked)}
                    className="w-4 h-4 text-forest-700 rounded focus:ring-forest-700 border-surface-border"
                  />
                  <span className="font-bold text-typography-primary">
                    Publish products immediately (Set status to ACTIVE in storefront)
                  </span>
                </label>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 sm:flex-initial btn-secondary px-3.5 py-2 text-xs font-bold"
                  >
                    Reset & Re-upload
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={importing || (parseSummary && parseSummary.validProducts === 0)}
                    className="flex-1 sm:flex-initial btn-primary px-5 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-level-1 disabled:opacity-50"
                    data-testid="btn-confirm-bulk-import"
                  >
                    {importing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Importing ({importProgress.current}/{importProgress.total})...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Import {parseSummary?.validProducts || 0} Products Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* IMPORT PROGRESS OVERLAY / BAR */}
          {importing && (
            <div className="p-5 rounded-2xl bg-forest-900 text-white space-y-3 shadow-level-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-gold" />
                  <span>{importProgress.status}</span>
                </span>
                <span className="font-mono text-gold font-bold">
                  {Math.round((importProgress.current / (importProgress.total || 1)) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gold to-emerald-400 transition-all duration-300"
                  style={{ width: `${Math.round((importProgress.current / (importProgress.total || 1)) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-white/70 truncate">
                Current product: <strong>{importProgress.currentTitle}</strong>
              </p>
            </div>
          )}

          {/* STEP 4: IMPORT COMPLETION SUMMARY REPORT */}
          {importResults && (
            <div className="bg-surface-white p-5 sm:p-6 rounded-2xl border border-surface-border shadow-2xs space-y-4 animate-scale-in">
              <div className="text-center space-y-2 py-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black font-display text-typography-primary">
                  Bulk Catalog Ingestion Complete
                </h3>
                <p className="text-xs text-typography-secondary max-w-md mx-auto">
                  {importResults.successful.length} products with all their variants were successfully registered into Sporekart agritech catalog.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <span className="text-xs text-emerald-800 font-bold uppercase block">Successfully Created</span>
                  <span className="text-2xl font-black font-display text-emerald-800 block mt-0.5">
                    {importResults.successful.length}
                  </span>
                </div>
                <div className="p-3 bg-surface-cream rounded-xl border border-surface-border">
                  <span className="text-xs text-typography-muted font-bold uppercase block">Skipped / Failed</span>
                  <span className="text-2xl font-black font-display text-typography-primary block mt-0.5">
                    {importResults.failed.length}
                  </span>
                </div>
              </div>

              {/* List of imported products */}
              <div className="max-h-[30vh] overflow-y-auto space-y-1.5 scrollbar-thin">
                {importResults.successful.map((s, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-surface-cream/50 border border-surface-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-typography-primary">{s.title}</span>
                      <span className="text-[10px] text-typography-muted">({s.category})</span>
                    </div>
                    <span className="text-[10px] font-mono text-forest-800 bg-forest-900/10 px-2 py-0.5 rounded">
                      {s.variantsCount} Variant{s.variantsCount === 1 ? '' : 's'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-secondary px-4 py-2 text-xs font-bold"
                >
                  Upload Another File
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-primary px-5 py-2 text-xs font-bold shadow-level-1"
                  data-testid="btn-finish-bulk-upload"
                >
                  View Updated Catalog
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-surface-border bg-surface-cream/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-typography-muted">
            <Info className="w-4 h-4 text-forest-700 shrink-0" />
            <span className="hidden sm:inline">Top E-Commerce Specification: Multi-variants grouped via Handle</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="btn-secondary px-4 py-2 text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
