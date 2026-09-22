# Sporekart Product Regulatory & Compliance Field Matrix

**Date**: September 19, 2026  
**Regulatory Frameworks**:
* **FSSAI**: Food Safety and Standards (Labelling and Display) Regulations, 2020 & amendments.
* **Legal Metrology**: Legal Metrology (Packaged Commodities) Rules, 2011 (Rule 6) & amendments.
* **Seeds Act / Agritech Standards**: Seeds Act 1966 & voluntary agritech quality disclosures.

---

## 1. Regulatory Context & Overview

Sporekart operates at the intersection of fresh produce, processed food, and agricultural inputs. Therefore, product information requirements vary strictly by **Product Type**:

1. **Food Products** (`FRESH_MUSHROOM`, `DRY_MUSHROOM`): Governed by FSSAI & Legal Metrology.
2. **Agricultural Inputs** (`SPAWN_SEED`, `GROWING_KIT`): Governed by Legal Metrology & Seed/Agritech voluntary compliance (FSSAI food licensing fields are non-applicable).

---

## 2. Structured Compliance Field Matrix

| Field | Product Type Applicability | Mandatory? | Condition / Trigger | Regulatory Source | Admin Required? | Buyer Display? | Field Type & Format |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Brand Name** | All Products | **Yes** | Always | Legal Metrology Rule 6 | Yes | Yes | Text (`Sporekart Agritech`) |
| **Product Generic Name** | All Products | **Yes** | Always | FSSAI Reg 5(1) & Legal Metrology | Yes | Yes | Text (e.g., `Oyster Mushroom Spawn`) |
| **Country of Origin** | All Products | **Yes** | Always | Legal Metrology Amendment 2017 | Yes | Yes | Text (`India`) |
| **Manufacturer / Packer Name & Address** | All Products | **Yes** | Always | FSSAI Reg 5(6) & Legal Metrology | Yes | Yes | Text Area / Address block |
| **Marketer Name & Address** | All Products | Mandatory if marketer differs from packer | When marketer is separate entity | FSSAI Reg 5(6) | Optional | Yes (if present) | Text Area / Address block |
| **Customer Care Contact** | All Products | **Yes** | Always | FSSAI Reg 5(13) & Legal Metrology | Yes | Yes | Phone / Email / Address string |
| **Net Quantity** | All Products | **Yes** | Always | Legal Metrology Rule 6(1)(c) | Yes | Yes | Number + Unit (`200 g`, `1 kg`) |
| **Standard Unit of Measure** | All Products | **Yes** | Always | Legal Metrology | Yes | Yes | Dropdown (`g`, `kg`, `pcs`, `ml`) |
| **FSSAI License / Registration No.** | `FRESH_MUSHROOM`, `DRY_MUSHROOM` | **Yes (Food Only)** | For edible food items | FSSAI Reg 5(7) | Yes (for food) | Yes (with FSSAI logo) | 14-Digit Numeric String |
| **Vegetarian / Non-Veg Symbol** | `FRESH_MUSHROOM`, `DRY_MUSHROOM` | **Yes (Food Only)** | For all packaged food | FSSAI Reg 5(4) | Yes (Default: `VEGETARIAN`) | Yes (Green Dot Symbol) | Enum (`VEGETARIAN`, `NON_VEGETARIAN`) |
| **Ingredients List** | `DRY_MUSHROOM`, Multi-ingredient food | Mandatory for processed foods | Multi-ingredient products | FSSAI Reg 5(2) | Conditional | Yes (if present) | Text (`100% Dried Oyster Mushrooms`) |
| **Allergen Declaration** | `FRESH_MUSHROOM`, `DRY_MUSHROOM` | Conditional | If containing known allergens | FSSAI Reg 5(3) | Optional | Yes (if present) | Text (e.g., `Contains Mushroom Spores`) |
| **Nutritional Information** | `DRY_MUSHROOM`, `FRESH_MUSHROOM` | Mandatory for processed food; optional for raw fresh produce | Per 100g declaration | FSSAI Reg 5(5) | Optional for fresh; Rec. for dry | Yes (if present) | Structured JSON / Key-Value map |
| **Storage Instructions** | All Products | **Yes** | Always | FSSAI Reg 5(10) & Agritech Best Practice | Yes | Yes | Text (`Store in refrigerator between 2°C - 4°C`) |
| **Storage Temperature Guidance** | `FRESH_MUSHROOM`, `SPAWN_SEED` | **Yes** | Cold-chain sensitive produce | Agritech / Quality Control | Yes | Yes | Text (`2°C - 4°C`) |
| **Best Before / Shelf Life** | All Products | **Yes** | Always | FSSAI Reg 5(9) & Quality Control | Yes | Yes | Text (`7 Days from dispatch` / `30 Days`) |
| **Batch / Lot Number** | All Products | Mandatory on physical pack; optional in digital listing | Packaging rule | FSSAI Reg 5(8) | Optional | Optional | Text (`LOT-2026-09-A`) |
| **Mushroom Variety / Species** | All Products | **Yes** | Agritech Specific | Quality Standard | Yes | Yes | Text (e.g., `Pleurotus ostreatus`) |
| **Cultivation Method** | `FRESH_MUSHROOM`, `DRY_MUSHROOM` | Recommended | Consumer info | Agritech Disclosure | Optional | Yes (if present) | Text (`Organically Grown on Wheat Straw`) |
| **Strain / Spawn Type** | `SPAWN_SEED` | **Yes (Spawn Only)** | For spawn products | Seed Quality Standard | Yes (Spawn) | Yes | Text (e.g., `Master Grain Spawn - Strain Florida`) |
| **Recommended Substrate** | `SPAWN_SEED`, `GROWING_KIT` | **Yes (Agri Only)** | For spawn & kits | Cultivation Guidance | Yes (Agri) | Yes | Text (`Paddy Straw / Wheat Straw / Sawdust`) |
| **Inoculation / Handling Guidance** | `SPAWN_SEED`, `GROWING_KIT` | **Yes (Agri Only)** | For spawn & kits | Cultivation Guidance | Yes (Agri) | Yes | Text Area |
| **Kit Contents List** | `GROWING_KIT` | **Yes (Kit Only)** | For DIY Kits | Legal Metrology Rule 6 | Yes (Kit) | Yes | Text Area |
| **Estimated Cultivation Cycle** | `GROWING_KIT` | Recommended | DIY Kit performance | Agritech Guidance | Optional | Yes (if present) | Text (`14-21 Days to first flush`) |

---

## 3. Product Publication & Validation Rules

### A. Draft Status (`status = DRAFT`)
* Admin can create and update products without completing all mandatory compliance fields.
* Allows partial data entry during product setup.

### B. Published Status (`status = ACTIVE`)
* Backend validation enforces that required fields based on `productType` are present before allowing status `ACTIVE`:
  1. **All Products**: Brand, generic name, country of origin, manufacturer address, net quantity, unit of measure, storage instructions, shelf life.
  2. **Food Products (`FRESH_MUSHROOM`, `DRY_MUSHROOM`)**: Must have FSSAI License Number (14 digits) and Veg/Non-Veg declaration.
  3. **Agricultural Inputs (`SPAWN_SEED`, `GROWING_KIT`)**: Must have Mushroom species/variety, recommended substrate, and handling instructions.

---

## 4. Legal Compliance Disclaimer
This compliance matrix reflects Indian regulatory standards (FSSAI 2020, Legal Metrology 2011). The technical implementation provides structured fields to capture and display compliance data; final legal validation for specific SKUs should be confirmed by the Food Business Operator (FBO) / Legal Compliance Officer.
