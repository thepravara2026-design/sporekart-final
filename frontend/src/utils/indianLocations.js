/**
 * FAANG-Grade Indian Location Data & Pincode Lookup Utility
 * Provides instant pincode auto-filling, state/city cascading dropdowns, and spelling mismatch prevention.
 */

// 1. All 28 Indian States & 8 Union Territories (Alphabetical & Standardized)
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  // Union Territories
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

// 2. Comprehensive City & District Mapping by State / UT
export const INDIAN_CITIES_BY_STATE = {
  'Andhra Pradesh': [
    'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry',
    'Tirupati', 'Kakinada', 'Kadapa', 'Anantapur', 'Eluru', 'Ongole', 'Vizianagaram',
    'Machilipatnam', 'Tenali', 'Proddatur', 'Chittoor', 'Hindupur', 'Bhimavaram', 'Srikakulam'
  ],
  'Arunachal Pradesh': [
    'Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro', 'Bomdila', 'Tezu', 'Changlang', 'Roing'
  ],
  'Assam': [
    'Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur',
    'Bongaigaon', 'Dhubri', 'Diphu', 'Goalpara', 'Karimganj', 'Sivasagar', 'Lakhimpur'
  ],
  'Bihar': [
    'Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif',
    'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Samastipur', 'Sasaram', 'Hajipur', 'Motihari'
  ],
  'Chhattisgarh': [
    'Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh', 'Ambikapur'
  ],
  'Goa': [
    'Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem'
  ],
  'Gujarat': [
    'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh',
    'Gandhinagar', 'Anand', 'Navsari', 'Morbi', 'Bharuch', 'Mehsana', 'Bhuj', 'Porbandar', 'Valsad'
  ],
  'Haryana': [
    'Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar',
    'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Bahadurgarh', 'Jhind', 'Rewari'
  ],
  'Himachal Pradesh': [
    'Shimla', 'Dharamshala', 'Mandi', 'Solan', 'Kullu', 'Manali', 'Hamirpur', 'Bilaspur', 'Chamba', 'Una'
  ],
  'Jharkhand': [
    'Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro Steel City', 'Hazaribagh', 'Deoghar',
    'Giridih', 'Ramgarh', 'Phusro', 'Medininagar (Daltonganj)'
  ],
  'Karnataka': [
    'Bengaluru', 'Mysuru', 'Davangere', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi',
    'Shivamogga', 'Ballari', 'Tumakuru', 'Vijayapura', 'Kalaburagi', 'Udupi', 'Hassan',
    'Mandya', 'Chikkamagaluru', 'Kolar', 'Raichur', 'Bidar', 'Gadag', 'Chitradurga', 'Haveri', 'Bagalkot'
  ],
  'Kerala': [
    'Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur',
    'Alappuzha', 'Kottayam', 'Palakkad', 'Malappuram', 'Pathanamthitta', 'Kasaragod', 'Thodupuzha'
  ],
  'Madhya Pradesh': [
    'Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas',
    'Satna', 'Ratlam', 'Rewa', 'Katni', 'Singrauli', 'Burhanpur', 'Chhindwara', 'Khandwa'
  ],
  'Maharashtra': [
    'Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Chhatrapati Sambhajinagar',
    'Solapur', 'Amravati', 'Kolhapur', 'Navi Mumbai', 'Sangli', 'Jalgaon', 'Akola',
    'Latur', 'Ahmednagar', 'Nanded', 'Satara', 'Dhule', 'Chandrapur', 'Ratnagiri'
  ],
  'Manipur': [
    'Imphal', 'Churachandpur', 'Thoubal', 'Bishnupur', 'Ukhrul', 'Senapati'
  ],
  'Meghalaya': [
    'Shillong', 'Tura', 'Jowai', 'Nongstoin', 'Baghmara'
  ],
  'Mizoram': [
    'Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib'
  ],
  'Nagaland': [
    'Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto'
  ],
  'Odisha': [
    'Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri',
    'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda', 'Bargarh'
  ],
  'Punjab': [
    'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali',
    'Hoshiarpur', 'Pathankot', 'Moga', 'Abohar', 'Khanna', 'Phagwara'
  ],
  'Rajasthan': [
    'Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara',
    'Alwar', 'Sikar', 'Bharatpur', 'Pali', 'Chittorgarh', 'Sri Ganganagar', 'Jhunjhunu'
  ],
  'Sikkim': [
    'Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Singtam'
  ],
  'Tamil Nadu': [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur',
    'Erode', 'Vellore', 'Tirunelveli', 'Thanjavur', 'Tuticorin', 'Dindigul',
    'Nagercoil', 'Kanchipuram', 'Cuddalore', 'Karur', 'Hosur'
  ],
  'Telangana': [
    'Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam',
    'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Siddipet', 'Miryalaguda'
  ],
  'Tripura': [
    'Agartala', 'Dharmanagar', 'Udaipur', 'Kailashahar', 'Belonia'
  ],
  'Uttar Pradesh': [
    'Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Noida', 'Greater Noida', 'Ghaziabad',
    'Prayagraj', 'Meerut', 'Bareilly', 'Aligarh', 'Moradabad', 'Gorakhpur', 'Jhansi', 'Mathura', 'Ayodhya', 'Saharanpur'
  ],
  'Uttarakhand': [
    'Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudraprashad', 'Kashipur', 'Rishikesh', 'Nainital', 'Almora'
  ],
  'West Bengal': [
    'Kolkata', 'Howrah', 'Siliguri', 'Durgapur', 'Asansol', 'Bardhaman',
    'Malda', 'Baharampur', 'Kharagpur', 'Haldia', 'Jalpaiguri', 'Darjeeling'
  ],
  // Union Territories
  'Andaman and Nicobar Islands': [
    'Port Blair', 'Car Nicobar', 'Mayabunder'
  ],
  'Chandigarh': [
    'Chandigarh'
  ],
  'Dadra and Nagar Haveli and Daman and Diu': [
    'Daman', 'Diu', 'Silvassa'
  ],
  'Delhi': [
    'New Delhi', 'Central Delhi', 'East Delhi', 'North Delhi', 'North East Delhi',
    'North West Delhi', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi', 'Shahdara'
  ],
  'Jammu and Kashmir': [
    'Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur', 'Kathua', 'Sopore'
  ],
  'Ladakh': [
    'Leh', 'Kargil'
  ],
  'Lakshadweep': [
    'Kavaratti', 'Agatti', 'Amini'
  ],
  'Puducherry': [
    'Puducherry', 'Karaikal', 'Mahe', 'Yanam'
  ]
};

// 3. Indian Postal PIN Code Prefix Mapping (2-digit prefix -> State & Primary City)
export const PINCODE_PREFIX_MAP = {
  // Delhi
  '11': { state: 'Delhi', city: 'New Delhi' },
  // Haryana
  '12': { state: 'Haryana', city: 'Gurugram' },
  '13': { state: 'Haryana', city: 'Ambala' },
  // Punjab & Chandigarh
  '14': { state: 'Punjab', city: 'Ludhiana' },
  '15': { state: 'Punjab', city: 'Bathinda' },
  '16': { state: 'Chandigarh', city: 'Chandigarh' },
  // Himachal Pradesh
  '17': { state: 'Himachal Pradesh', city: 'Shimla' },
  // Jammu & Kashmir & Ladakh
  '18': { state: 'Jammu and Kashmir', city: 'Jammu' },
  '19': { state: 'Jammu and Kashmir', city: 'Srinagar' },
  // Uttar Pradesh & Uttarakhand
  '20': { state: 'Uttar Pradesh', city: 'Noida' },
  '21': { state: 'Uttar Pradesh', city: 'Prayagraj' },
  '22': { state: 'Uttar Pradesh', city: 'Lucknow' },
  '23': { state: 'Uttar Pradesh', city: 'Varanasi' },
  '24': { state: 'Uttarakhand', city: 'Dehradun' },
  '25': { state: 'Uttar Pradesh', city: 'Meerut' },
  '26': { state: 'Uttarakhand', city: 'Haldwani' },
  '27': { state: 'Uttar Pradesh', city: 'Gorakhpur' },
  '28': { state: 'Uttar Pradesh', city: 'Agra' },
  // Rajasthan
  '30': { state: 'Rajasthan', city: 'Jaipur' },
  '31': { state: 'Rajasthan', city: 'Udaipur' },
  '32': { state: 'Rajasthan', city: 'Kota' },
  '33': { state: 'Rajasthan', city: 'Bikaner' },
  '34': { state: 'Rajasthan', city: 'Jodhpur' },
  // Gujarat & Dadra/Daman
  '36': { state: 'Gujarat', city: 'Rajkot' },
  '37': { state: 'Gujarat', city: 'Jamnagar' },
  '38': { state: 'Gujarat', city: 'Ahmedabad' },
  '39': { state: 'Gujarat', city: 'Surat' },
  // Maharashtra & Goa
  '40': { state: 'Maharashtra', city: 'Mumbai' },
  '41': { state: 'Maharashtra', city: 'Pune' },
  '42': { state: 'Maharashtra', city: 'Nashik' },
  '43': { state: 'Maharashtra', city: 'Chhatrapati Sambhajinagar' },
  '44': { state: 'Maharashtra', city: 'Nagpur' },
  '403': { state: 'Goa', city: 'Panaji' },
  // Madhya Pradesh & Chhattisgarh
  '45': { state: 'Madhya Pradesh', city: 'Indore' },
  '46': { state: 'Madhya Pradesh', city: 'Bhopal' },
  '47': { state: 'Madhya Pradesh', city: 'Gwalior' },
  '48': { state: 'Madhya Pradesh', city: 'Jabalpur' },
  '49': { state: 'Chhattisgarh', city: 'Raipur' },
  // Telangana & Andhra Pradesh
  '50': { state: 'Telangana', city: 'Hyderabad' },
  '51': { state: 'Andhra Pradesh', city: 'Tirupati' },
  '52': { state: 'Andhra Pradesh', city: 'Vijayawada' },
  '53': { state: 'Andhra Pradesh', city: 'Visakhapatnam' },
  // Karnataka
  '56': { state: 'Karnataka', city: 'Bengaluru' },
  '57': { state: 'Karnataka', city: 'Mysuru' },
  '577': { state: 'Karnataka', city: 'Davangere' },
  '58': { state: 'Karnataka', city: 'Hubballi-Dharwad' },
  '59': { state: 'Karnataka', city: 'Belagavi' },
  // Tamil Nadu & Puducherry
  '60': { state: 'Tamil Nadu', city: 'Chennai' },
  '61': { state: 'Tamil Nadu', city: 'Tiruchirappalli' },
  '62': { state: 'Tamil Nadu', city: 'Madurai' },
  '63': { state: 'Tamil Nadu', city: 'Vellore' },
  '64': { state: 'Tamil Nadu', city: 'Coimbatore' },
  '605': { state: 'Puducherry', city: 'Puducherry' },
  // Kerala & Lakshadweep
  '67': { state: 'Kerala', city: 'Kozhikode' },
  '68': { state: 'Kerala', city: 'Kochi' },
  '69': { state: 'Kerala', city: 'Thiruvananthapuram' },
  // West Bengal & Andaman
  '70': { state: 'West Bengal', city: 'Kolkata' },
  '71': { state: 'West Bengal', city: 'Howrah' },
  '72': { state: 'West Bengal', city: 'Kharagpur' },
  '73': { state: 'West Bengal', city: 'Siliguri' },
  '74': { state: 'West Bengal', city: 'Durgapur' },
  '744': { state: 'Andaman and Nicobar Islands', city: 'Port Blair' },
  // Odisha
  '75': { state: 'Odisha', city: 'Bhubaneswar' },
  '76': { state: 'Odisha', city: 'Berhampur' },
  '77': { state: 'Odisha', city: 'Rourkela' },
  // North-East States
  '78': { state: 'Assam', city: 'Guwahati' },
  '790': { state: 'Arunachal Pradesh', city: 'Itanagar' },
  '793': { state: 'Meghalaya', city: 'Shillong' },
  '795': { state: 'Manipur', city: 'Imphal' },
  '796': { state: 'Mizoram', city: 'Aizawl' },
  '797': { state: 'Nagaland', city: 'Kohima' },
  '799': { state: 'Tripura', city: 'Agartala' },
  // Bihar & Jharkhand
  '80': { state: 'Bihar', city: 'Patna' },
  '81': { state: 'Bihar', city: 'Bhagalpur' },
  '82': { state: 'Bihar', city: 'Gaya' },
  '83': { state: 'Jharkhand', city: 'Ranchi' },
  '84': { state: 'Bihar', city: 'Muzaffarpur' },
  '85': { state: 'Bihar', city: 'Purnia' },
};

/**
 * Get available city options for a given state name
 */
export const getCitiesForState = (stateName) => {
  if (!stateName) return [];
  const normalizedState = stateName.trim();
  // Exact match first
  if (INDIAN_CITIES_BY_STATE[normalizedState]) {
    return INDIAN_CITIES_BY_STATE[normalizedState];
  }
  // Case-insensitive match fallback
  const foundKey = Object.keys(INDIAN_CITIES_BY_STATE).find(
    (key) => key.toLowerCase() === normalizedState.toLowerCase()
  );
  return foundKey ? INDIAN_CITIES_BY_STATE[foundKey] : [];
};

/**
 * Fast & Resilient PIN Code Auto-Lookup
 * Attempts India Post REST API first, then falls back to prefix lookup.
 */
export const lookupPincode = async (pincode) => {
  const cleanPin = (pincode || '').toString().trim();
  if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
    return { success: false, error: 'Invalid PIN code length or format' };
  }

  // 1. Try India Post API with short timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        const stateFromApi = po.State ? po.State.trim() : null;
        const districtFromApi = po.District ? po.District.trim() : (po.Block ? po.Block.trim() : po.Name);

        // Normalize state name to match INDIAN_STATES standard list
        const matchedState = INDIAN_STATES.find(
          (s) => s.toLowerCase() === stateFromApi?.toLowerCase()
        ) || stateFromApi;

        if (matchedState) {
          return {
            success: true,
            state: matchedState,
            city: districtFromApi || po.Name,
            district: districtFromApi,
            source: 'INDIA_POST_API',
          };
        }
      }
    }
  } catch (err) {
    // API timed out or network error — smooth fallback to offline dataset
  }

  // 2. Offline Prefix Fallback Lookup (3-digit prefix then 2-digit prefix)
  const prefix3 = cleanPin.substring(0, 3);
  const prefix2 = cleanPin.substring(0, 2);

  const fallback = PINCODE_PREFIX_MAP[prefix3] || PINCODE_PREFIX_MAP[prefix2];
  if (fallback) {
    return {
      success: true,
      state: fallback.state,
      city: fallback.city,
      district: fallback.city,
      source: 'OFFLINE_PREFIX_MAP',
    };
  }

  return { success: false, error: 'PIN code prefix not found in database' };
};
