/**
 * Sporekart (Shriyap Enterprise) Official Legal Policies & Compliance Documentation
 * Formatted in accordance with:
 * - Information Technology Act, 2000 & SPDI Rules, 2011
 * - Digital Personal Data Protection Act, 2023 (DPDP)
 * - Consumer Protection (E-Commerce) Rules, 2020
 * - Payment and Settlement Systems Act, 2007 (Razorpay Merchant Guidelines)
 */

export const LEGAL_POLICIES = {
  'privacy-policy': {
    slug: 'privacy-policy',
    title: 'Privacy Policy & Data Protection',
    shortTitle: 'Privacy Policy',
    category: 'Data & Privacy',
    badge: 'DPDP Act 2023 & SPDI Rules Compliant',
    lastUpdated: 'October 30, 2026',
    effectiveDate: 'January 1, 2026',
    readTime: '6 min read',
    summary: 'Explains how Shriyap Enterprise (Sporekart) collects, stores, protects, and handles your personal information, contact credentials, and farm consultation data with zero card storage.',
    sections: [
      {
        id: 'data-fiduciary',
        title: '1. Identity of Data Fiduciary',
        content: `This Privacy Policy governs the collection, processing, and handling of personal data by **Shriyap Enterprise**, an agricultural enterprise operating the commercial brand **Sporekart** ("we", "us", "our"), having its registered operational facility at:

**Shriyap Enterprise**
Basapura village, Behind Taralabalu school,
Davangere - 577001, Karnataka, India.
Contact: +91 7204709870 | Email: support@sporekart.in / privacy@sporekart.in

We are committed to maintaining the highest standards of confidentiality, lawful data processing, and technical security in compliance with the **Information Technology Act, 2000**, the **Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 (SPDI)**, and the **Digital Personal Data Protection Act, 2023 (DPDP Act)**.`
      },
      {
        id: 'data-collected',
        title: '2. Categories of Personal Data Collected',
        content: `To provide lab-certified mushroom spawn seeds, gourmet harvests, equipment, and masterclasses, we collect the following categories of information:

- **Identity & Contact Data:** Full Name, Delivery Postal Address, Contact Telephone Number (for SMS/WhatsApp dispatch alerts and delivery verification), and Email Address.
- **Transactional & Invoicing Data:** Order history, ordered item specifications, GST invoice details, and Razorpay payment reference IDs.
- **Agricultural & Consultation Telemetry (Voluntary):** Crop substrate photographs, humidity/temperature readings, and farm issue details submitted voluntarily by growers seeking technical consultation.
- **Technical & Device Telemetry:** Anonymized IP addresses, browser specifications, screen resolutions, and Core Web Vitals telemetry collected solely to ensure sub-second page performance across rural and urban mobile networks.`
      },
      {
        id: 'payment-security',
        title: '3. Zero Card Storage Policy & Payment Gateway Security',
        content: `**We strictly maintain a Zero Financial Storage Policy:**

- Sporekart **NEVER** collects, handles, or stores your credit card numbers, debit card numbers, card expiration dates, CVV codes, or NetBanking credentials on our servers.
- All online payments are securely handed off and processed exclusively by **Razorpay Software Private Limited**, an RBI-authorized Payment Aggregator certified under **PCI-DSS Level 1** (Payment Card Industry Data Security Standard).
- Payment communications are secured using end-to-end 256-bit TLS 1.3 cryptographic protocols with mandatory RBI 3D-Secure two-factor authentication.`
      },
      {
        id: 'data-purposes',
        title: '4. Lawful Grounds and Purposes of Data Processing',
        content: `Your information is processed strictly for legitimate operational purposes:

1. **Order Fulfillment:** Coordinating cold-chain packaging, dispatch, and doorstep transit of living cultures and supplies.
2. **Statutory Tax Compliance:** Generating valid GST e-invoices and maintaining statutory audit accounts under the Indian Goods and Services Tax Act.
3. **Training & Certification:** Managing masterclass batch enrollments, issuing authenticated completion certificates, and sending session timetable links.
4. **Security & Anti-Fraud:** Protecting user accounts from brute-force attempts and identifying anomalous order patterns.`
      },
      {
        id: 'data-sharing',
        title: '5. Third-Party Service Providers & Disclosures',
        content: `We do **NOT** sell, rent, or trade your personal data to marketing brokers or third-party advertisers. Data is shared strictly on a need-to-know basis with trusted operational partners:

- **Logistics Partners:** National express couriers (e.g., Delhivery, Shiprocket, Blue Dart, India Post Speed Post) solely to achieve prompt delivery to your address.
- **Transactional Telecommunication Providers:** Authorized telecom gateways for OTP verification codes and parcel delivery dispatch tracking via SMS and WhatsApp.
- **Statutory Law Enforcement:** Only when mandated by a lawful written warrant or summons under Indian law.`
      },
      {
        id: 'data-rights',
        title: '6. Your Rights under the DPDP Act, 2023',
        content: `As a data principal under the Digital Personal Data Protection Act, you possess explicit legal rights:

- **Right to Access & Summary:** Request a digital summary of all personal data held about you.
- **Right to Rectification:** Update, correct, or complete inaccurate shipping or profile information.
- **Right to Erasure:** Request deletion of your customer profile, subject to statutory tax retention periods.
- **Right to Grievance Redressal:** Lodge inquiries directly with our designated Grievance Officer.

To exercise any of these rights, email **privacy@sporekart.in** with the subject line *"Data Subject Request"*. Verification will be completed within 48 hours.`
      },
      {
        id: 'data-retention',
        title: '7. Data Retention & Safeguards',
        content: `Personal data is retained only for the duration required to satisfy the operational purposes for which it was gathered. Financial records and tax invoices are preserved for 7 years in compliance with statutory Indian accounting laws. 

All database records are stored in access-controlled environments protected by multi-factor authentication, Spring Security role boundaries, and AES-256 encrypted storage.`
      }
    ]
  },

  'terms': {
    slug: 'terms',
    title: 'Terms of Service & E-Commerce Agreement',
    shortTitle: 'Terms of Service',
    category: 'User Agreement',
    badge: 'Legally Binding Contract',
    lastUpdated: 'October 30, 2026',
    effectiveDate: 'January 1, 2026',
    readTime: '7 min read',
    summary: 'The legal agreement governing your use of Sporekart e-commerce services, purchase of living mycelium spawn, farm supplies, and participation in commercial mushroom cultivation masterclasses.',
    sections: [
      {
        id: 'agreement-scope',
        title: '1. Agreement & Platform Ownership',
        content: `Welcome to **Sporekart** (sporekart.in), owned and operated by **Shriyap Enterprise**, Davangere, Karnataka. 

By accessing this website, creating an account, enrolling in masterclasses, or purchasing mushroom spawn seeds, fresh/dry harvests, or equipment, you enter into a legally binding contract with Shriyap Enterprise and agree to abide by these Terms of Service and all incorporated policies.`
      },
      {
        id: 'account-eligibility',
        title: '2. User Eligibility & Account Responsibilities',
        content: `You must be at least 18 years of age or possess the consent of a legal guardian to transact on Sporekart. 

You agree to provide accurate, truthful, and updated shipping and contact credentials. You are solely responsible for all activities occurring under your authenticated profile.`
      },
      {
        id: 'biological-disclaimer',
        title: '3. Biological Living Cultures & Agronomic Disclaimers',
        content: `**Important Agricultural Notice:**

- **Cleanroom Sterility:** All Sporekart spawn seeds (Milky, Oyster, Button strains) are cultivated in certified sterile cleanrooms using pure grain mother cultures, passing stringent visual and microbiological contamination checks prior to dispatch.
- **Biological Viability:** Fungal mycelium is a living organism. Final crop harvest yields depend directly upon environmental factors outside Sporekart’s direct custody—including grower substrate sterilization, ambient humidity, temperature management, air exchange, and sanitation.
- **Technical Guidance:** Sporekart provides technical cultivation handbooks, spawn guides, and consulting in good faith. However, we do not guarantee specific crop yields or financial returns under unmonitored external farm conditions.`
      },
      {
        id: 'pricing-orders',
        title: '4. Product Pricing, Invoicing & Order Acceptance',
        content: `All product prices are quoted in Indian National Rupees (INR) and include applicable Goods and Services Tax (GST) unless indicated otherwise.

- We reserve the right to limit order quantities for commercial living spawn batches to protect product quality and dispatch freshness.
- An order is deemed accepted only when handed over to cold-chain logistics and an official AWB dispatch tracking number is generated.
- In the unlikely event of an inadvertent pricing error or strain stock failure, we reserve the right to cancel the order and immediately refund 100% of the transacted amount to your source payment method.`
      },
      {
        id: 'training-terms',
        title: '5. Training Masterclasses & Intellectual Property',
        content: `Sporekart offers online and hands-on commercial mushroom cultivation and spawn lab production masterclasses:

- All proprietary cultivation frameworks, lab standard operating procedures (SOPs), video lessons, and digital handbooks are the exclusive intellectual property of **Shriyap Enterprise**.
- Course registrations are personal to the enrolled trainee. Commercial re-distribution, public screening, unauthorized recording, or digital mirroring of course materials is strictly prohibited.`
      },
      {
        id: 'liability-limitations',
        title: '6. Limitation of Liability',
        content: `To the fullest extent permissible under applicable Indian law, Shriyap Enterprise, its proprietors, affiliates, and technical partners shall not be liable for any indirect, consequential, incidental, or exemplary damages, including lost agricultural yields, crop failures, or commercial losses resulting from the use or inability to use our products or guides.

In all circumstances, Shriyap Enterprise’s total aggregate financial liability arising out of any order shall be strictly limited to the actual net purchase price paid by the customer for the specific product in dispute.`
      },
      {
        id: 'governing-law',
        title: '7. Governing Law & Davangere Jurisdiction',
        content: `These Terms and any dispute or claim arising out of or related to our website, products, or services shall be governed and construed in accordance with the substantive laws of **India**.

Any legal proceedings, suits, or arbitrations shall be instituted exclusively in the competent civil courts situated in **Davangere, Karnataka, India**.`
      }
    ]
  },

  'refund-policy': {
    slug: 'refund-policy',
    title: 'Cancellation, Return & Refund Policy',
    shortTitle: 'Refund & Returns',
    category: 'Orders & Returns',
    badge: 'Fair Trade & Freshness Guarantee',
    lastUpdated: 'October 30, 2026',
    effectiveDate: 'January 1, 2026',
    readTime: '5 min read',
    summary: 'Clear, transparent guidelines for order cancellations, 24-hour living spawn transit guarantees, 7-day equipment returns, and masterclass rescheduling.',
    sections: [
      {
        id: 'cancellation-rules',
        title: '1. Order Cancellation Policy',
        content: `Customers can cancel an order free of charge prior to dispatch:

- **Pre-Dispatch Cancellation:** You may cancel your order from your Customer Dashboard or by messaging WhatsApp Support (+91 7204709870) before the parcel has been assigned an AWB tracking number and handed to cold-chain couriers (typically within 4 to 6 hours of placement). A 100% immediate refund will be initiated.
- **Post-Dispatch Cancellation:** Once a parcel has been dispatched from our Davangere facility, cancellation is no longer possible because living cultures are already in express transit.`
      },
      {
        id: 'spawn-guarantee',
        title: '2. Living Spawn & Perishable Agricultural Items (24-Hour Guarantee)',
        content: `**Living Mushroom Spawn Seeds & Fresh Harvests:**

Because grain spawn contains live, active mycelium that requires strict temperature control and sterile handling, **opened or unsealed bags cannot be returned for restock**.

**Our Transit Freshness & Quality Guarantee:**
If your spawn shipment arrives visibly damaged, contaminated during transit, punctured, or delayed by couriers to the point of overheating:
1. Contact us within **24 hours of delivery** via WhatsApp (+91 7204709870) or Email (support@sporekart.in).
2. Share your Order ID along with clear unboxing photographs or a short video showing the unopened bag with its batch tag and outer shipping label.
3. Upon rapid verification by our laboratory agronomist, you may choose:
   - **Immediate Free Reshipment:** We will dispatch a fresh, certified replacement batch via priority express at zero cost to you; OR
   - **100% Full Refund:** Credited to your original payment source or instant Sporekart wallet.`
      },
      {
        id: 'equipment-returns',
        title: '3. Durable Equipment & Growing Kits (7-Day Return Window)',
        content: `**Farm Equipment, Lab Tools, DIY Growing Kits & Dehydrated Products:**

- **7-Day Return Eligibility:** You may request a return or replacement within **7 calendar days** from the recorded delivery date for items that arrive defective, malfunctioning, broken, or mismatched from what was ordered.
- **Condition of Item:** Goods must be returned in their original packaging, unused, undamaged, and complete with all manuals, accessories, and warranty cards.
- **Reverse Pickup:** Where serviceable, we will arrange a complimentary reverse courier pickup. In remote pin codes, you may ship the item via speed post, and we will reimburse standard postal charges.`
      },
      {
        id: 'training-refunds',
        title: '4. Training Masterclasses & Workshop Cancellations',
        content: `For enrollment in our certified training programs:

- **Cancellation ≥ 48 Hours Before Batch:** Full **100% refund** or complimentary rescheduling to any upcoming batch within 6 months.
- **Cancellation < 48 Hours Before Batch:** Non-refundable due to limited lab seat reservation; however, you receive **1 free batch rescheduling pass** valid for 6 months.
- **Instructor Cancellation:** In the rare event that Sporekart reschedules or cancels a session, trainees are entitled to an immediate 100% refund or priority entry into the next batch.`
      },
      {
        id: 'refund-timeline',
        title: '5. Refund Modes & Settlement Timelines',
        content: `Once a refund is approved by our billing desk:

- **Refund Initiation:** Initiated within **24 to 48 hours**.
- **Original Payment Source (Razorpay):** Re-credited to the exact card, bank account, or UPI VPA used during checkout. Depending on your bank's clearing cycle, the funds will reflect in your account within **5 to 7 business days**.
- **Sporekart Store Wallet:** Instant deposit into your Sporekart profile ledger, immediately redeemable toward any future purchase with zero deductions.`
      }
    ]
  },

  'shipping-policy': {
    slug: 'shipping-policy',
    title: 'Shipping, Cold-Chain & Delivery Policy',
    shortTitle: 'Shipping Policy',
    category: 'Logistics',
    badge: 'Pan-India Express Cold-Chain',
    lastUpdated: 'October 30, 2026',
    effectiveDate: 'January 1, 2026',
    readTime: '4 min read',
    summary: 'Details our specialized cold-chain packaging, dispatch cycles (Monday to Thursday for living spawn), transit timelines across India, and damaged-in-transit guarantees.',
    sections: [
      {
        id: 'delivery-coverage',
        title: '1. Pan-India Delivery Coverage',
        content: `Sporekart ships to all serviceable pin codes across India (covering 28 States and 8 Union Territories) through premier national logistics partners including Delhivery, Shiprocket, Blue Dart, DTDC, and India Post Speed Post.

We serve commercial mushroom cultivators in major metros as well as rural agricultural belts across Karnataka, Maharashtra, Tamil Nadu, Andhra Pradesh, Telangana, Kerala, and North India.`
      },
      {
        id: 'spawn-dispatch-schedule',
        title: '2. Spawn Dispatch Schedules & Freshness Protocol',
        content: `To ensure live mycelium arrives vigorous, healthy, and uncontaminated:

- **Spawn Dispatch Days:** Living grain spawn cultures are dispatched **Monday through Thursday only**. This prevents fragile mycelium from sitting idle over the weekend in non-temperature-controlled regional courier hubs.
- **Weekend Orders:** Spawn orders received from Friday to Sunday are prepared, quality-inspected, and dispatched first thing on Monday morning.
- **Equipment & Supplies:** Dehydrated mushrooms, growing kits, lab accessories, and supplies are dispatched daily within **24 to 48 hours**.`
      },
      {
        id: 'packaging-standards',
        title: '3. Specialized Cold-Chain Thermal Packaging',
        content: `Every package leaving our Davangere lab is engineered for agricultural durability:

- **Microporous Breathable Filter Bags:** Live spawn is packed in autoclave-grade polypropylene bags with breathable microporous filter patches allowing continuous oxygen-CO2 exchange while blocking wild fungal and bacterial spores.
- **Insulated Thermal Pouches:** Shipments during peak summer or across long routes include insulated thermal foil liners with food-grade gel refrigerant packs to maintain optimal temperature.
- **Cushioned Outer Corrugated Cartons:** Heavy-duty corrugated boxes protect against drop impact during regional transit.`
      },
      {
        id: 'delivery-timelines',
        title: '4. Estimated Transit Timelines',
        content: `Transit timelines begin from the moment the courier scans the parcel at our Davangere hub:

- **Karnataka & Southern India:** 1 to 3 business days.
- **Metro & Tier-1 Cities Across India:** 2 to 4 business days.
- **Tier-2, Tier-3 & Rural Farming Pin Codes:** 4 to 7 business days.

*Note: Extreme weather conditions, regional holidays, or transport strikes may occasionally introduce courier delays.*`
      },
      {
        id: 'tracking-support',
        title: '5. Real-Time Tracking & Undelivered Parcels',
        content: `As soon as your shipment is picked up, an automated SMS, WhatsApp, and Email notification containing your direct courier AWB tracking link is dispatched to your registered contact details.

If a parcel is marked undelivered due to an incorrect address or customer unavailability, couriers will attempt re-delivery up to 3 times before returning the parcel to Davangere. Please ensure your contact phone number is reachable on the expected day of delivery.`
      }
    ]
  },

  'cookie-policy': {
    slug: 'cookie-policy',
    title: 'Cache, Cookie & Local Data Storage Policy',
    shortTitle: 'Cookie & Cache Policy',
    category: 'Technical Compliance',
    badge: 'High-Performance Web Transparency',
    lastUpdated: 'October 30, 2026',
    effectiveDate: 'January 1, 2026',
    readTime: '4 min read',
    summary: 'Full transparency regarding our use of high-performance HTTP caching, HTML5 LocalStorage, and essential cookies to ensure instant page loads and secure checkouts.',
    sections: [
      {
        id: 'what-is-cache-cookie',
        title: '1. What are Caches, Cookies, and Local Storage?',
        content: `To deliver a smooth, high-speed shopping experience for mushroom farmers across India, Sporekart utilizes modern web technologies:

- **Browser & HTTP Caching:** Temporary storage of static assets (such as images, icons, and JavaScript code) on your phone or computer so the website loads in milliseconds on repeat visits without burning your mobile data.
- **HTML5 LocalStorage:** Secure key-value storage within your browser used to remember your shopping cart items and saved interface preferences between sessions.
- **Essential Cookies:** Small text tokens managed securely by your browser to authenticate user sessions and prevent cross-site request forgery.`
      },
      {
        id: 'how-we-use-storage',
        title: '2. How Sporekart Uses Local Storage & Caching',
        content: `Sporekart utilizes browser storage strictly for functional, high-performance, and security purposes:

| Storage Key / Cookie | Type | Purpose & Duration |
| :--- | :--- | :--- |
| \`sporekart_cart\` | LocalStorage | Remembers your cart items across tabs and refreshes so you do not lose your selected spawn varieties. |
| \`sporekart_token\` | LocalStorage | Encrypted authentication JWT token keeping your grower profile signed in securely. |
| \`sporekart_cookie_consent\` | LocalStorage | Remembers your preference so you are not repeatedly prompted by our cookie transparency notice. |
| \`Cache-Control\` Headers | HTTP Cache | Caches static WebP images and stylesheets for up to 30 days, reducing data usage for rural farmers. |
| Session Caching | Memory | Accelerates checkout step transitions without reloading full server state. |`
      },
      {
        id: 'zero-ad-tracking',
        title: '3. Zero Third-Party Advertising Trackers',
        content: `**We respect your online privacy:**

- Sporekart **DOES NOT** deploy intrusive third-party behavioral advertising trackers, data brokers, or cross-site tracking pixels that follow you across the internet.
- We do not sell your browsing history, crop consultation queries, or buying habits to any commercial advertising exchange.`
      },
      {
        id: 'manage-clear-cache',
        title: '4. How to Inspect, Clear, or Manage Your Cache & Cookies',
        content: `You maintain complete control over your device’s stored data. You can clear your cache and storage at any time through your browser settings:

- **Google Chrome / Android Browser:** Tap Settings > Privacy and Security > Clear browsing data > Check *"Cookies and other site data"* and *"Cached images and files"*.
- **Apple Safari / iOS:** Go to Settings > Safari > Advanced > Website Data > Tap *"Remove All Website Data"*.
- **Mozilla Firefox:** Settings > Privacy & Security > Cookies and Site Data > Tap *"Clear Data"*.

*Please Note: Clearing LocalStorage will reset your active guest shopping cart and require you to sign in again to your Sporekart profile.*`
      }
    ]
  },

  'grievance': {
    slug: 'grievance',
    title: 'Statutory Grievance Redressal & Nodal Officer',
    shortTitle: 'Grievance Redressal',
    category: 'Legal Redressal',
    badge: 'Statutory Compliance Rule 5(9)',
    lastUpdated: 'October 30, 2026',
    effectiveDate: 'January 1, 2026',
    readTime: '3 min read',
    summary: 'Statutory contact details of our designated Grievance Officer and escalation matrix under the Consumer Protection (E-Commerce) Rules, 2020.',
    sections: [
      {
        id: 'statutory-officer',
        title: '1. Statutory Nodal & Grievance Redressal Officer',
        content: `In accordance with **Rule 5(9) of the Consumer Protection (E-Commerce) Rules, 2020** and the **Information Technology Act, 2000**, the details of our designated Grievance Officer are set forth below:

**Designated Grievance Redressal Officer**
Shriyap Enterprise (Brand: Sporekart)
Basapura village, Behind Taralabalu school,
Davangere - 577001, Karnataka, India.

- **Direct Telephone:** +91 7204709870
- **Official Grievance Email:** grievance@sporekart.in
- **General Support Email:** support@sporekart.in
- **Working Hours:** Monday through Saturday, 9:30 AM to 6:30 PM IST (Excluding Public Holidays)`
      },
      {
        id: 'escalation-protocol',
        title: '2. Grievance Escalation & Resolution Timelines',
        content: `We adhere strictly to statutory resolution standards:

1. **Acknowledgment:** Every grievance or dispute filed via email or formal written communication will receive an official acknowledgment and unique complaint ticket number within **48 hours** of receipt.
2. **Investigation:** Our customer grievance cell will examine order records, logistics AWB manifests, and laboratory quality control batches.
3. **Resolution:** A complete written resolution, corrective remediation, or settlement will be provided to the complainant within **30 calendar days** from the date of formal grievance submission.`
      },
      {
        id: 'contact-channels',
        title: '3. How to File a Formal Grievance',
        content: `To ensure rapid processing of your grievance, please furnish:
- Your full name and registered phone number.
- Sporekart Order ID or Training Enrollment ID.
- Clear description of the grievance, prior communication history, and any relevant supporting documents or photographs.

Submit your formal complaint to **grievance@sporekart.in**.`
      }
    ]
  }
};

