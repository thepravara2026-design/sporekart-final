import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import AdminBulkProductUploadModal from '../components/AdminBulkProductUploadModal';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import { adminApi, catalogApi, trainingApi, orderApi, adminFinanceApi, shippingApi } from '../api';

vi.mock('../components/SeoHead', () => ({ default: () => null }));
vi.mock('../components/LocalImageUploader', () => ({ default: () => <div data-testid="image-uploader">Mock Image Uploader</div> }));

vi.mock('../api', () => ({
  adminApi: {
    getOverview: vi.fn().mockResolvedValue({ totalRevenueINR: 500000, totalOrdersCount: 400 }),
    getAnalytics: vi.fn().mockResolvedValue({
      totalRevenueINR: 500000,
      totalOrdersCount: 400,
      totalProducts: 10,
      activeOrders: 5,
      totalCustomers: 50,
      salesTrend: []
    }),
    getAnalyticsOverview: vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: {
          totalProducts: 10,
          activeOrders: 5,
          totalCustomers: 50,
          activeCourses: 2,
          totalRevenueInr: 500000
        }
      }
    }),
    getAdminProducts: vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: {
          content: [
            { id: 'p-1', title: 'Oyster Mushroom Spawn', productType: 'MUSHROOM_SPAWN', priceInr: 250, variants: [{ id: 'v-1', variantName: '1Kg', sku: 'SPW-1KG', stockQuantity: 30 }] }
          ],
          totalElements: 1
        }
      }
    }),
    getOrders: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getCustomers: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    getAuditLogs: vi.fn().mockResolvedValue({ data: { success: true, data: { content: [], totalPages: 1 } } }),
    getPromotions: vi.fn().mockResolvedValue({ data: { success: true, data: { content: [] } } }),
    createProduct: vi.fn().mockResolvedValue({ data: { success: true, data: { id: 'prod-new-123' } } }),
    updateProductInformation: vi.fn().mockResolvedValue({ data: { success: true } }),
    addVariant: vi.fn().mockResolvedValue({ data: { success: true, data: { id: 'var-new-456' } } }),
    syncProductMedia: vi.fn().mockResolvedValue({ data: { success: true } }),
    publishProduct: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
  catalogApi: {
    getCategories: vi.fn().mockResolvedValue([
      { id: 'cat-fresh', name: 'Fresh Mushrooms', slug: 'fresh-mushrooms', isActive: true },
      { id: 'cat-spawn', name: 'Mushroom Spawn', slug: 'mushroom-spawn', isActive: true },
    ]),
    getProducts: vi.fn().mockResolvedValue({
      content: [
        { id: 'p-1', title: 'Oyster Mushroom Spawn', productType: 'MUSHROOM_SPAWN', priceInr: 250, variants: [{ id: 'v-1', variantName: '1Kg', sku: 'SPW-1KG', stockQuantity: 30 }] }
      ],
      totalElements: 1
    }),
  },
  trainingApi: {
    getCourses: vi.fn().mockResolvedValue([]),
    getAdminGlimpses: vi.fn().mockResolvedValue({ data: [] }),
    getBatches: vi.fn().mockResolvedValue({ content: [] }),
    getEnrollments: vi.fn().mockResolvedValue({ content: [] }),
  },
  orderApi: {
    getOrders: vi.fn().mockResolvedValue({ content: [] }),
  },
  adminFinanceApi: {
    getFinanceSummary: vi.fn().mockResolvedValue({ totalPlatformRevenue: 500000, walletHoldingsTotal: 25000 }),
    getPlatformTransactions: vi.fn().mockResolvedValue({ content: [] }),
    getPlatformWithdrawals: vi.fn().mockResolvedValue({ content: [] }),
  },
  shippingApi: {
    getShipments: vi.fn().mockResolvedValue({ content: [] }),
  },
}));

describe('Admin Bulk Product & Multi-Variant Excel Upload System', () => {
  const mockCategories = [
    { id: 'cat-fresh', name: 'Fresh Mushrooms', slug: 'fresh-mushrooms', isActive: true },
    { id: 'cat-spawn', name: 'Mushroom Spawn', slug: 'mushroom-spawn', isActive: true },
  ];

  const createMockExcelFile = (rows, filename = 'test.xlsx') => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    const fileBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const file = new File([fileBuffer], filename, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    file.arrayBuffer = () => Promise.resolve(fileBuffer);
    return file;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when isOpen is true and unmounts when false', () => {
    const { rerender } = render(
      <AdminBulkProductUploadModal
        isOpen={false}
        onClose={() => {}}
        categories={mockCategories}
      />
    );
    expect(screen.queryByTestId('admin-bulk-upload-backdrop')).toBeNull();

    rerender(
      <AdminBulkProductUploadModal
        isOpen={true}
        onClose={() => {}}
        categories={mockCategories}
      />
    );
    expect(screen.getByTestId('admin-bulk-upload-backdrop')).toBeInTheDocument();
    expect(screen.getByText(/Bulk Product & Variant Upload Studio/i)).toBeInTheDocument();
    expect(screen.getByTestId('btn-download-excel-template')).toBeInTheDocument();
    expect(screen.getByTestId('btn-download-csv-template')).toBeInTheDocument();
  });

  it('generates and downloads high-grade Excel template with multiple sheets', () => {
    const writeFileSpy = vi.spyOn(XLSX, 'writeFile').mockImplementation(() => {});
    
    render(
      <AdminBulkProductUploadModal
        isOpen={true}
        onClose={() => {}}
        categories={mockCategories}
      />
    );

    const downloadBtn = screen.getByTestId('btn-download-excel-template');
    fireEvent.click(downloadBtn);

    expect(writeFileSpy).toHaveBeenCalledWith(
      expect.anything(),
      'Sporekart_Bulk_Product_Upload_Template.xlsx'
    );

    const generatedWb = writeFileSpy.mock.calls[0][0];
    expect(generatedWb.SheetNames).toContain('Products');
    expect(generatedWb.SheetNames).toContain('Store_Categories_Reference');
    expect(generatedWb.SheetNames).toContain('Instructions_And_Rules');

    writeFileSpy.mockRestore();
  });

  it('parses valid spreadsheet file, groups multi-variants by handle, and renders review summary', async () => {
    // Construct mock workbook with multi-variant rows sharing same handle
    const rows = [
      {
        'Handle': 'oyster-fresh-pkg',
        'Title': 'Premium Blue Oyster Mushrooms',
        'Category': 'Fresh Mushrooms',
        'Product_Type': 'FRESH_MUSHROOM',
        'Description': 'Farm fresh delicious oyster mushrooms',
        'Brand_Name': 'Sporekart Agritech',
        'HSN_Code': '07095900',
        'GST_Rate': 0,
        'FSSAI_License': '10020011000123',
        'Is_Vegetarian': 'TRUE',
        'Mushroom_Species': 'Pleurotus ostreatus',
        'Strain_Variety': 'Blue Pearl',
        'Net_Quantity': '250g',
        'Country_Of_Origin': 'India',
        'Recommended_Substrate': 'Paddy Straw',
        'Storage_Instructions': 'Refrigerate at 2-4 C',
        'Shelf_Life_Guidance': '7 days',
        'Primary_Image_URL': 'https://images.unsplash.com/photo-test1',
        'Gallery_Image_URLs': '',
        'Variant_Name': 'Pack 250g',
        'Variant_SKU': 'FSH-OYST-250',
        'Variant_Price_INR': 120,
        'Compare_At_Price_INR': 150,
        'Stock_Quantity': 50,
        'Status': 'ACTIVE'
      },
      {
        'Handle': 'oyster-fresh-pkg',
        'Title': '', // Second variant for same handle
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
        'Net_Quantity': '500g',
        'Country_Of_Origin': '',
        'Recommended_Substrate': '',
        'Storage_Instructions': '',
        'Shelf_Life_Guidance': '',
        'Primary_Image_URL': '',
        'Gallery_Image_URLs': '',
        'Variant_Name': 'Family Pack 500g',
        'Variant_SKU': 'FSH-OYST-500',
        'Variant_Price_INR': 220,
        'Compare_At_Price_INR': 280,
        'Stock_Quantity': 40,
        'Status': 'ACTIVE'
      },
      {
        'Handle': 'spawn-milky-grain',
        'Title': 'Sterile Milky Mushroom Spawn',
        'Category': 'Mushroom Spawn',
        'Product_Type': 'MUSHROOM_SPAWN',
        'Description': 'Commercial grade master spawn for tropical cultivation',
        'Brand_Name': 'Sporekart Agritech',
        'HSN_Code': '06029090',
        'GST_Rate': 0,
        'FSSAI_License': '',
        'Is_Vegetarian': 'TRUE',
        'Mushroom_Species': 'Calocybe indica',
        'Strain_Variety': 'CI-4',
        'Net_Quantity': '1 Kg',
        'Country_Of_Origin': 'India',
        'Recommended_Substrate': 'Wheat Grain',
        'Storage_Instructions': 'Cool dark place',
        'Shelf_Life_Guidance': '30 days',
        'Primary_Image_URL': 'https://images.unsplash.com/photo-test2',
        'Gallery_Image_URLs': '',
        'Variant_Name': 'Standard Pack 1 Kg',
        'Variant_SKU': 'SPW-MLK-1KG',
        'Variant_Price_INR': 180,
        'Compare_At_Price_INR': 220,
        'Stock_Quantity': 100,
        'Status': 'ACTIVE'
      }
    ];

    const file = createMockExcelFile(rows, 'catalog_import.xlsx');

    render(
      <AdminBulkProductUploadModal
        isOpen={true}
        onClose={() => {}}
        categories={mockCategories}
        initialFile={file}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Pre-Import Verification/i)).toBeInTheDocument();
    });

    // Verify 2 parent products were grouped from the 3 rows
    expect(screen.getByText('Premium Blue Oyster Mushrooms')).toBeInTheDocument();
    expect(screen.getByText('Sterile Milky Mushroom Spawn')).toBeInTheDocument();

    // Verify variants counts are rendered
    expect(screen.getByText('Total Variants')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getAllByText(/Variants:/i).length).toBe(2);

    // Verify import button is enabled and shows ready count
    expect(screen.getByTestId('btn-confirm-bulk-import')).toBeInTheDocument();
  });

  it('validates and flags errors when required fields are missing or compare price is invalid', async () => {
    const invalidRows = [
      {
        'Handle': 'invalid-product',
        'Title': '', // Missing title
        'Category': '', // Missing category
        'Product_Type': 'FRESH_MUSHROOM',
        'Variant_Name': 'Bad Pack',
        'Variant_SKU': '', // Missing SKU
        'Variant_Price_INR': 0, // Invalid price <= 0
        'Compare_At_Price_INR': 50 // CompareAtPrice > VariantPrice is ok, but price is 0
      },
      {
        'Handle': 'pricing-error-product',
        'Title': 'Faulty Pricing Mushroom',
        'Category': 'Fresh Mushrooms',
        'Product_Type': 'FRESH_MUSHROOM',
        'Variant_Name': 'Pack A',
        'Variant_SKU': 'SKU-FAULT-1',
        'Variant_Price_INR': 200,
        'Compare_At_Price_INR': 150 // Invalid: CompareAtPrice must be greater than Price
      }
    ];

    const file = createMockExcelFile(invalidRows, 'invalid_catalog.xlsx');

    render(
      <AdminBulkProductUploadModal
        isOpen={true}
        onClose={() => {}}
        categories={mockCategories}
        initialFile={file}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Pre-Import Verification/i)).toBeInTheDocument();
    });

    // Verify errors are flagged in summary cards
    const errorBadges = screen.getAllByText(/Errors/i);
    expect(errorBadges.length).toBeGreaterThan(0);
  });

  it('executes batch ingestion calling adminApi and triggers onSuccess callback', async () => {
    const rows = [
      {
        'Handle': 'fresh-portobello',
        'Title': 'Organic Portobello Caps',
        'Category': 'Fresh Mushrooms',
        'Product_Type': 'FRESH_MUSHROOM',
        'Description': 'Meaty gourmet portobello caps for grilling',
        'Brand_Name': 'Sporekart Agritech',
        'HSN_Code': '07095900',
        'GST_Rate': 0,
        'FSSAI_License': '10020011000123',
        'Is_Vegetarian': 'TRUE',
        'Variant_Name': 'Twin Pack 300g',
        'Variant_SKU': 'FSH-PORTO-300G',
        'Variant_Price_INR': 180,
        'Compare_At_Price_INR': 220,
        'Stock_Quantity': 25,
        'Primary_Image_URL': 'https://images.unsplash.com/photo-portobello',
        'Status': 'ACTIVE'
      }
    ];

    const file = createMockExcelFile(rows, 'portobello.xlsx');

    const mockSuccess = vi.fn();
    const mockClose = vi.fn();

    render(
      <AdminBulkProductUploadModal
        isOpen={true}
        onClose={mockClose}
        categories={mockCategories}
        onSuccess={mockSuccess}
        initialFile={file}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-bulk-import')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('btn-confirm-bulk-import'));

    await waitFor(() => {
      expect(adminApi.createProduct).toHaveBeenCalled();
      expect(adminApi.updateProductInformation).toHaveBeenCalled();
      expect(adminApi.addVariant).toHaveBeenCalled();
      expect(adminApi.syncProductMedia).toHaveBeenCalled();
      expect(adminApi.publishProduct).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Bulk Catalog Ingestion Complete')).toBeInTheDocument();
      expect(mockSuccess).toHaveBeenCalledWith(1);
    });

    // Click finish button
    fireEvent.click(screen.getByTestId('btn-finish-bulk-upload'));
    expect(mockClose).toHaveBeenCalled();
  });

  it('integrates seamlessly with AdminDashboardPage products registry and add-product studio', async () => {
    // 1. Render AdminDashboardPage at /admin/products
    const { unmount } = render(
      <MemoryRouter initialEntries={['/admin/products']}>
        <AdminDashboardPage user={{ role: 'ADMIN', name: 'Master Agronomist' }} />
      </MemoryRouter>
    );

    // Verify "Bulk Excel Upload" button appears in Products list
    await waitFor(() => {
      expect(screen.getByTestId('btn-open-bulk-product-upload')).toBeInTheDocument();
    });

    // Click to open modal
    fireEvent.click(screen.getByTestId('btn-open-bulk-product-upload'));
    expect(screen.getByTestId('admin-bulk-upload-backdrop')).toBeInTheDocument();
    expect(screen.getByText(/Bulk Product & Variant Upload Studio/i)).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByTestId('btn-close-bulk-modal'));
    await waitFor(() => {
      expect(screen.queryByTestId('admin-bulk-upload-backdrop')).toBeNull();
    });

    unmount();

    // 2. Render AdminDashboardPage at /admin/products?mode=add
    render(
      <MemoryRouter initialEntries={['/admin/products?mode=add']}>
        <AdminDashboardPage user={{ role: 'ADMIN', name: 'Master Agronomist' }} />
      </MemoryRouter>
    );

    // Verify Add Product studio banner and header button appear
    await waitFor(() => {
      expect(screen.getByTestId('btn-add-product-bulk-excel')).toBeInTheDocument();
      expect(screen.getByTestId('btn-banner-bulk-upload')).toBeInTheDocument();
    });

    // Click banner button to open modal
    fireEvent.click(screen.getByTestId('btn-banner-bulk-upload'));
    expect(screen.getByTestId('admin-bulk-upload-backdrop')).toBeInTheDocument();
  });
});
