import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from '../../hooks/useStaffAuth';
import { io } from 'socket.io-client';
import { getSessions, setSplit, markSplitPaid, closeSession } from '../../api/sessionApi';
import i18n from '../../i18n';

const LABELS = {
  en: {
    title: "Today's Overview", totalOrders: 'Total Orders', revenue: 'Revenue',
    activeOrders: 'Active Orders', allOrders: 'All Orders', table: 'Table',
    status: 'Status', amount: 'Amount', time: 'Time', new: 'New',
    preparing: 'Preparing', ready: 'Ready', completed: 'Completed',
    markComplete: 'Complete', staff: 'Staff', addStaff: '+ Add Staff',
    name: 'Full Name', role: 'Role', language: 'Language', password: 'Password',
    save: 'Save', cancel: 'Cancel', edit: 'Edit', delete: 'Delete',
    active: 'Active', inactive: 'Inactive', noStaff: 'No staff yet',
    credentialsTitle: 'Account Created!', shareWith: 'Share with',
    loginId: 'Login ID', loginUrl: 'Login URL', copyCredentials: 'Copy Credentials',
    done: 'Done', noOrders: 'No active sessions', orders: 'Orders',
    cannotCreateManager: 'Managers cannot create other managers',
    printBill: 'Print Bill', qty: 'Qty', price: 'Price',
    total: 'Total', thankYou: 'Thank you for visiting!', items: 'Items',
    splitBill: 'Split Bill', closeSess: 'Close & Done', sessionTotal: 'Session Total',
    splitEqual: 'Split Equally', splitCustom: 'Custom Split', splitByOrder: 'By Order',
    perPerson: 'per person', markPaid: 'Mark Paid', paid: '✅ Paid',
    apply: 'Apply', numPeople: 'Number of people',
    customAmounts: 'Enter amounts (must add up to total)', person: 'Person',
    open: 'Open', billRequested: '🔔 Bill Requested!',
    inventory: 'Inventory', menu: 'Menu',
    addItem: '+ Add Item', editItem: 'Edit Item', itemName: 'Item Name',
    quantity: 'Quantity', unit: 'Unit', alertWhen: 'Alert when below',
    inStock: 'In Stock', lowStock: 'Low Stock', outOfStock: 'Out of Stock',
    allItems: 'All', bulkEdit: 'Bulk Edit', saveAll: 'Save All', cancelBulk: 'Cancel',
    noItems: 'No inventory items yet', addFirst: 'Add your first item',
    unlimited: 'Unlimited', exportCSV: 'Export CSV',
    addCategory: '+ Add Category', category: 'Category', available: 'Available',
    unavailable: 'Unavailable', noCategories: 'No categories yet',
    startWithCategory: 'Start by adding a category', noMenuItems: 'No items in this category',
    itemNamePlaceholder: 'e.g. Paneer Tikka', descPlaceholder: 'Describe this dish...',
    description: 'Description', generateDesc: 'Generate with AI',
    generatingDesc: 'Generating...', photo: 'Photo', uploadPhoto: 'Click to upload photo',
    generateImage: 'Generate image with AI', generatingImage: 'Generating image...',
    imageNote: 'Image generation may take up to 60 seconds',
    dietaryTags: 'Dietary Tags', suggestTags: 'Suggest Tags',
    suggestingTags: 'Suggesting...', aiSuggestedTags: 'AI suggested',
    canDeselect: 'click to deselect', modifiers: 'Modifiers', addGroup: '+ Add Group',
    groupName: 'Group Name', optionLabel: 'Option label', extraPrice: 'Extra price',
    addOption: '+ Add option', selectCategory: 'Select Category',
    categoryPlaceholder: 'e.g. Starters', editCategory: 'Edit Category',
    newOrderFor: '+ New Order for Table...',
  },
  hi: {
    title: 'आज का अवलोकन', totalOrders: 'कुल ऑर्डर', revenue: 'राजस्व',
    activeOrders: 'सक्रिय ऑर्डर', allOrders: 'सभी ऑर्डर', table: 'टेबल',
    status: 'स्थिति', amount: 'राशि', time: 'समय', new: 'नया',
    preparing: 'बन रहा है', ready: 'तैयार', completed: 'पूरा',
    markComplete: 'पूरा करें', staff: 'स्टाफ', addStaff: '+ स्टाफ जोड़ें',
    name: 'पूरा नाम', role: 'भूमिका', language: 'भाषा', password: 'पासवर्ड',
    save: 'सेव', cancel: 'रद्द', edit: 'संपादित', delete: 'हटाएं',
    active: 'सक्रिय', inactive: 'निष्क्रिय', noStaff: 'अभी कोई स्टाफ नहीं',
    credentialsTitle: 'अकाउंट बना!', shareWith: 'शेयर करें',
    loginId: 'लॉगिन ID', loginUrl: 'लॉगिन URL', copyCredentials: 'कॉपी करें',
    done: 'हो गया', noOrders: 'कोई सक्रिय सत्र नहीं', orders: 'ऑर्डर',
    cannotCreateManager: 'मैनेजर दूसरे मैनेजर नहीं बना सकते',
    printBill: 'बिल प्रिंट करें', qty: 'मात्रा', price: 'मूल्य',
    total: 'कुल', thankYou: 'आपके आगमन का धन्यवाद!', items: 'आइटम',
    splitBill: 'बिल विभाजित करें', closeSess: 'बंद करें', sessionTotal: 'सत्र कुल',
    splitEqual: 'बराबर विभाजित', splitCustom: 'कस्टम', splitByOrder: 'ऑर्डर अनुसार',
    perPerson: 'प्रति व्यक्ति', markPaid: 'भुगतान', paid: '✅ भुगतान',
    apply: 'लागू', numPeople: 'लोगों की संख्या',
    customAmounts: 'राशि दर्ज करें', person: 'व्यक्ति',
    open: 'खुला', billRequested: '🔔 बिल मांगा गया!',
    inventory: 'इन्वेंटरी', menu: 'मेनू',
    addItem: '+ आइटम जोड़ें', editItem: 'आइटम संपादित', itemName: 'आइटम नाम',
    quantity: 'मात्रा', unit: 'इकाई', alertWhen: 'अलर्ट कब',
    inStock: 'स्टॉक में', lowStock: 'कम स्टॉक', outOfStock: 'स्टॉक खत्म',
    allItems: 'सभी', bulkEdit: 'बल्क संपादित', saveAll: 'सभी सेव करें', cancelBulk: 'रद्द',
    noItems: 'कोई इन्वेंटरी नहीं', addFirst: 'पहला आइटम जोड़ें',
    unlimited: 'असीमित', exportCSV: 'CSV निर्यात',
    addCategory: '+ श्रेणी जोड़ें', category: 'श्रेणी', available: 'उपलब्ध',
    unavailable: 'अनुपलब्ध', noCategories: 'कोई श्रेणी नहीं',
    startWithCategory: 'श्रेणी जोड़कर शुरू करें', noMenuItems: 'कोई आइटम नहीं',
    itemNamePlaceholder: 'जैसे पनीर टिक्का', descPlaceholder: 'विवरण लिखें...',
    description: 'विवरण', generateDesc: 'AI से बनाएं',
    generatingDesc: 'बन रहा है...', photo: 'फोटो', uploadPhoto: 'फोटो अपलोड करें',
    generateImage: 'AI से इमेज बनाएं', generatingImage: 'बन रहा है...',
    imageNote: 'इमेज बनने में 60 सेकंड लग सकते हैं',
    dietaryTags: 'आहार टैग', suggestTags: 'टैग सुझाएं',
    suggestingTags: 'सुझाव दे रहा है...', aiSuggestedTags: 'AI सुझाव',
    canDeselect: 'हटाने के लिए क्लिक करें', modifiers: 'मॉडिफायर', addGroup: '+ समूह जोड़ें',
    groupName: 'समूह नाम', optionLabel: 'विकल्प', extraPrice: 'अतिरिक्त मूल्य',
    addOption: '+ विकल्प जोड़ें', selectCategory: 'श्रेणी चुनें',
    categoryPlaceholder: 'जैसे स्टार्टर', editCategory: 'श्रेणी संपादित',
    newOrderFor: '+ टेबल के लिए नया ऑर्डर...',
  },
  mr: {
    title: 'आजचा आढावा', totalOrders: 'एकूण ऑर्डर', revenue: 'महसूल',
    activeOrders: 'सक्रिय ऑर्डर', allOrders: 'सर्व ऑर्डर', table: 'टेबल',
    status: 'स्थिती', amount: 'रक्कम', time: 'वेळ', new: 'नवीन',
    preparing: 'तयार होत आहे', ready: 'तयार', completed: 'पूर्ण',
    markComplete: 'पूर्ण करा', staff: 'स्टाफ', addStaff: '+ स्टाफ जोडा',
    name: 'पूर्ण नाव', role: 'भूमिका', language: 'भाषा', password: 'पासवर्ड',
    save: 'सेव', cancel: 'रद्द', edit: 'संपादित', delete: 'हटवा',
    active: 'सक्रिय', inactive: 'निष्क्रिय', noStaff: 'अजून स्टाफ नाही',
    credentialsTitle: 'अकाउंट तयार!', shareWith: 'शेअर करा',
    loginId: 'लॉगिन ID', loginUrl: 'लॉगिन URL', copyCredentials: 'कॉपी करा',
    done: 'झाले', noOrders: 'कोणतेही सक्रिय सत्र नाही', orders: 'ऑर्डर',
    cannotCreateManager: 'व्यवस्थापक इतर व्यवस्थापक बनवू शकत नाहीत',
    printBill: 'बिल प्रिंट करा', qty: 'प्रमाण', price: 'किंमत',
    total: 'एकूण', thankYou: 'आपल्या भेटीबद्दल धन्यवाद!', items: 'आइटम',
    splitBill: 'बिल विभाजित करा', closeSess: 'बंद करा', sessionTotal: 'सत्र एकूण',
    splitEqual: 'समान विभागणी', splitCustom: 'कस्टम', splitByOrder: 'ऑर्डरनुसार',
    perPerson: 'प्रति व्यक्ती', markPaid: 'भरले', paid: '✅ भरले',
    apply: 'लागू करा', numPeople: 'लोकांची संख्या',
    customAmounts: 'रक्कम प्रविष्ट करा', person: 'व्यक्ती',
    open: 'उघडे', billRequested: '🔔 बिल मागितले!',
    inventory: 'इन्व्हेंटरी', menu: 'मेनू',
    addItem: '+ आइटम जोडा', editItem: 'आइटम संपादित', itemName: 'आइटम नाव',
    quantity: 'प्रमाण', unit: 'एकक', alertWhen: 'अलर्ट कधी',
    inStock: 'स्टॉकमध्ये', lowStock: 'कमी स्टॉक', outOfStock: 'स्टॉक संपला',
    allItems: 'सर्व', bulkEdit: 'बल्क संपादित', saveAll: 'सर्व सेव करा', cancelBulk: 'रद्द',
    noItems: 'कोणतीही इन्व्हेंटरी नाही', addFirst: 'पहिला आइटम जोडा',
    unlimited: 'अमर्यादित', exportCSV: 'CSV निर्यात',
    addCategory: '+ श्रेणी जोडा', category: 'श्रेणी', available: 'उपलब्ध',
    unavailable: 'अनुपलब्ध', noCategories: 'कोणतीही श्रेणी नाही',
    startWithCategory: 'श्रेणी जोडून सुरू करा', noMenuItems: 'कोणतेही आइटम नाही',
    itemNamePlaceholder: 'उदा. पनीर टिक्का', descPlaceholder: 'वर्णन लिहा...',
    description: 'वर्णन', generateDesc: 'AI ने बनवा',
    generatingDesc: 'बनत आहे...', photo: 'फोटो', uploadPhoto: 'फोटो अपलोड करा',
    generateImage: 'AI ने इमेज बनवा', generatingImage: 'बनत आहे...',
    imageNote: 'इमेज बनण्यास ६० सेकंद लागू शकतात',
    dietaryTags: 'आहार टॅग', suggestTags: 'टॅग सुचवा',
    suggestingTags: 'सुचवत आहे...', aiSuggestedTags: 'AI सूचना',
    canDeselect: 'काढण्यासाठी क्लिक करा', modifiers: 'मॉडिफायर', addGroup: '+ गट जोडा',
    groupName: 'गट नाव', optionLabel: 'पर्याय', extraPrice: 'अतिरिक्त किंमत',
    addOption: '+ पर्याय जोडा', selectCategory: 'श्रेणी निवडा',
    categoryPlaceholder: 'उदा. स्टार्टर', editCategory: 'श्रेणी संपादित',
    newOrderFor: '+ टेबलसाठी नवीन ऑर्डर...',
  }
};

const DIETARY_OPTIONS = ['Vegan','Vegetarian','Gluten-Free','Dairy-Free','Spicy','Contains Nuts','Egg-Free','Halal','Jain'];
const INV_UNITS       = ['kg','g','lbs','oz','litre','ml','bottles','cans','packets','pieces','dozen','bags'];
const ROLES           = ['chef', 'waiter'];
const LANGS           = ['en', 'hi', 'mr'];
const LANG_LABELS     = { en: 'English', hi: 'हिन्दी', mr: 'मराठी' };
const ROLE_COLORS     = {
  manager: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  chef:    'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  waiter:  'bg-blue-100  dark:bg-blue-900/20  text-blue-600  dark:text-blue-400',
};
const SESSION_STATUS_COLORS = {
  open:           'text-green-600  bg-green-50  dark:bg-green-900/20',
  bill_requested: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
  closed:         'text-gray-400   bg-gray-100  dark:bg-gray-800',
};

export default function ManagerView() {
  const { staff }    = useStaffAuth();
  const navigate     = useNavigate();
  const iframeRef    = useRef(null);
  const [tab,        setTab]        = useState('orders');
  const [orders,     setOrders]     = useState([]);
  const [sessions,   setSessions]   = useState([]);
  const [tables,     setTables]     = useState([]);
  const [staffList,  setStaffList]  = useState([]);
  const [showModal,  setShowModal]  = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [showPass,   setShowPass]   = useState(null);
  const [saving,     setSaving]     = useState(false);

  // Split bill state
  const [splitSession, setSplitSession] = useState(null);
  const [splitMethod,  setSplitMethod]  = useState('equal');
  const [numPeople,    setNumPeople]    = useState(2);
  const [customAmts,   setCustomAmts]   = useState([]);
  const [showSplit,    setShowSplit]     = useState(false);

  // Staff form
  const [name,     setName]     = useState('');
  const [role,     setRole]     = useState('chef');
  const [language, setLanguage] = useState('en');
  const [password, setPassword] = useState('');

  // ── Inventory state ──────────────────────────────────────────
  const [invItems,     setInvItems]     = useState([]);
  const [invFilter,    setInvFilter]    = useState('all');
  const [invLoading,   setInvLoading]   = useState(false);
  const [showInvModal, setShowInvModal] = useState(false);
  const [editInvItem,  setEditInvItem]  = useState(null);
  const [savingInv,    setSavingInv]    = useState(false);
  const [bulkMode,     setBulkMode]     = useState(false);
  const [bulkEdits,    setBulkEdits]    = useState({});
  const [savingBulk,   setSavingBulk]   = useState(false);
  const [invName,      setInvName]      = useState('');
  const [invQty,       setInvQty]       = useState('');
  const [invUnit,      setInvUnit]      = useState('kg');
  const [invCustomUnit,setInvCustomUnit]= useState('');
  const [invThreshold, setInvThreshold] = useState(5);

  // ── Menu state ───────────────────────────────────────────────
  const [categories,    setCategories]    = useState([]);
  const [menuItems,     setMenuItems]     = useState([]);
  const [activeCat,     setActiveCat]     = useState(null);
  const [showCatModal,  setShowCatModal]  = useState(false);
  const [editCat,       setEditCat]       = useState(null);
  const [catName,       setCatName]       = useState('');
  const [savingCat,     setSavingCat]     = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editMenuItem,  setEditMenuItem]  = useState(null);
  const [savingItem,    setSavingItem]    = useState(false);
  const [mName,         setMName]         = useState('');
  const [mDesc,         setMDesc]         = useState('');
  const [mPrice,        setMPrice]        = useState('');
  const [mCatId,        setMCatId]        = useState('');
  const [mAvailable,    setMAvailable]    = useState(true);
  const [mTags,         setMTags]         = useState([]);
  const [mImagePreview, setMImagePreview] = useState('');
  const [mExistingImg,  setMExistingImg]  = useState('');
  const [mImageFile,    setMImageFile]    = useState(null);
  const [genDesc,       setGenDesc]       = useState(false);
  const [genImg,        setGenImg]        = useState(false);
  const [genTags,       setGenTags]       = useState(false);

  const lang         = i18n.language || 'en';
  const L            = LABELS[lang] || LABELS.en;
  const token        = staff?.token;
  const authHeader   = { Authorization: `Bearer ${token}` };
  const currency     = '₹';
  const restaurantId = staff?.restaurant?._id;

  // ── Load functions ───────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    const res  = await fetch(`/api/orders/staff/${restaurantId}`, { headers: authHeader });
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
  }, [restaurantId, token]);

  const loadSessions = useCallback(async () => {
    const data = await getSessions(restaurantId, token);
    setSessions(Array.isArray(data) ? data : []);
  }, [restaurantId, token]);

  const loadTables = useCallback(async () => {
    if (!restaurantId) return;
    const res  = await fetch(`/api/tables/${restaurantId}`, { headers: authHeader });
    const data = await res.json();
    setTables(Array.isArray(data) ? data : []);
  }, [restaurantId, token]);

  const loadStaff = useCallback(async () => {
    const res  = await fetch('/api/staff/manage/list', { headers: authHeader });
    const data = await res.json();
    setStaffList(Array.isArray(data) ? data : []);
  }, [token]);

  const loadInventory = useCallback(async () => {
    if (!restaurantId) return;
    setInvLoading(true);
    const res  = await fetch(`/api/inventory/${restaurantId}`, { headers: authHeader });
    const data = await res.json();
    setInvItems(Array.isArray(data) ? data : []);
    setInvLoading(false);
  }, [restaurantId, token]);

  const loadCategories = useCallback(async () => {
    if (!restaurantId) return;
    const res  = await fetch(`/api/menu/categories/${restaurantId}`, { headers: authHeader });
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
    if (Array.isArray(data) && data.length && !activeCat) setActiveCat(data[0]._id);
  }, [restaurantId, token]);

  const loadMenuItems = useCallback(async () => {
    if (!restaurantId || categories.length === 0) return;
    const all = await Promise.all(
      categories.map(cat =>
        fetch(`/api/menu/items/${cat._id}`, { headers: authHeader }).then(r => r.json())
      )
    );
    setMenuItems(all.flat());
  }, [restaurantId, token, categories]);

  useEffect(() => {
    loadOrders(); loadSessions(); loadTables(); loadStaff(); loadInventory(); loadCategories();
    const socket = io('http://localhost:5000', { auth: { token } });
    socket.on('connect',         () => { socket.emit('join_restaurant', restaurantId); });
    socket.on('new_order',       () => { loadOrders(); loadSessions(); });
    socket.on('order_updated',   () => { loadOrders(); loadSessions(); });
    socket.on('session_updated', () => loadSessions());
    socket.on('session_opened',  () => { loadSessions(); loadTables(); });
    socket.on('session_closed',  () => { loadSessions(); loadTables(); });
    socket.on('bill_requested',  (data) => {
      loadSessions();
      const tableNum = data?.tableNumber || data?.session?.tableNumber || '?';
      alert(`🔔 Table ${tableNum} has requested the bill!`);
    });
    return () => socket.disconnect();
  }, [restaurantId]);

  useEffect(() => { loadMenuItems(); }, [loadMenuItems]);

  const updateStatus = async (orderId, status) => {
    await fetch(`/api/orders/staff/${orderId}/status`, {
      method: 'PATCH', headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    loadOrders(); loadSessions();
  };

  // ── Print Bill ───────────────────────────────────────────────
  const handlePrintBillSession = (session, splitData = null) => {
    const allItems = (session.orders || []).flatMap(o => o.items || []);
    const itemRows = allItems.map(item => {
      const qty = item.quantity || item.qty || 1;
      return `<tr>
        <td style="padding:6px 4px;border-bottom:1px solid #eee;">${item.name}</td>
        <td style="padding:6px 4px;border-bottom:1px solid #eee;text-align:center;">${qty}</td>
        <td style="padding:6px 4px;border-bottom:1px solid #eee;text-align:right;">${currency}${((item.price||0)*qty).toFixed(2)}</td>
      </tr>`;
    }).join('');
    const splitSection = splitData?.length ? `
      <hr style="border:none;border-top:1px dashed #ccc;margin:12px 0;" />
      <div style="font-weight:700;margin-bottom:8px;">Split Bill</div>
      ${splitData.map(s=>`<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;"><span>${s.label}</span><span>${currency}${s.amount.toFixed(2)} ${s.paid?'✅':''}</span></div>`).join('')}
    ` : '';
    const html = `<html><head><title>Bill — Table ${session.tableNumber}</title>
      <style>@media print{.no-print{display:none;}body{margin:0;}}body{font-family:-apple-system,sans-serif;max-width:400px;margin:0 auto;padding:24px 16px;color:#111;}.brand{text-align:center;font-size:22px;font-weight:800;color:#f97316;margin-bottom:4px;}.sub{text-align:center;font-size:14px;color:#666;margin-bottom:16px;}.divider{border:none;border-top:1px dashed #ccc;margin:12px 0;}table{width:100%;border-collapse:collapse;font-size:13px;}th{text-align:left;padding:6px 4px;border-bottom:2px solid #111;font-size:11px;text-transform:uppercase;color:#666;}th:last-child{text-align:right;}.total-row td{padding:10px 4px 4px;font-weight:800;font-size:15px;}.total-row td:last-child{text-align:right;color:#f97316;}.thank-you{text-align:center;margin-top:20px;font-size:13px;color:#888;}.btn{display:block;margin:20px auto 0;padding:10px 24px;background:#f97316;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer;}</style></head>
      <body><div class="brand">🍽️ QRunch</div><div class="sub">${staff?.restaurant?.name||''}</div><hr class="divider"/>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;"><span>Table ${session.tableNumber}</span><span>${new Date(session.openedAt).toLocaleString()}</span></div>
      <hr class="divider"/>
      <table><thead><tr><th>Item</th><th>Qty</th><th style="text-align:right;">Amount</th></tr></thead>
      <tbody>${itemRows}<tr class="total-row"><td colspan="2">Total</td><td>${currency}${(session.totalAmount||0).toFixed(2)}</td></tr></tbody></table>
      ${splitSection}<hr class="divider"/><div class="thank-you">${L.thankYou}</div>
      <button class="btn no-print" onclick="window.print()">🖨️ Print</button></body></html>`;
    const iframe = iframeRef.current;
    iframe.srcdoc = html;
    iframe.onload = () => { iframe.contentWindow.focus(); iframe.contentWindow.print(); };
  };

  // ── Split Bill ───────────────────────────────────────────────
  const openSplit = (session) => {
    setSplitSession(session); setSplitMethod('equal'); setNumPeople(2);
    setCustomAmts([session.totalAmount/2, session.totalAmount/2]); setShowSplit(true);
  };
  const applySplit = async () => {
    if (!splitSession) return;
    let splits = [];
    if (splitMethod === 'equal') {
      const amt = splitSession.totalAmount / numPeople;
      splits = Array.from({length:numPeople},(_,i)=>({label:`${L.person} ${i+1}`,amount:parseFloat(amt.toFixed(2)),paid:false}));
    } else if (splitMethod === 'custom') {
      splits = customAmts.map((amt,i)=>({label:`${L.person} ${i+1}`,amount:parseFloat(amt)||0,paid:false}));
    } else if (splitMethod === 'by_order') {
      splits = (splitSession.orders||[]).map((o,i)=>({label:`Order ${i+1}${o.customerName?` (${o.customerName})`:''}`,amount:o.totalAmount||0,paid:false}));
    }
    await setSplit(splitSession._id,{splitMethod,customerCount:numPeople,splits},token);
    setShowSplit(false); loadSessions();
  };
  const handleMarkPaid     = async (session,idx) => { await markSplitPaid(session._id,idx,token); loadSessions(); };
  const handleCloseSession = async (session) => { if(!confirm(`Close session for Table ${session.tableNumber}?`))return; await closeSession(session._id,token); loadSessions(); loadTables(); };

  // ── Inventory functions ──────────────────────────────────────
  const invFinalUnit     = invUnit === 'custom' ? invCustomUnit : invUnit;
  const filteredInvItems = invItems.filter(item => {
    if (invFilter === 'out') return item.quantity === 0;
    if (invFilter === 'low') return item.quantity > 0 && item.quantity <= item.lowStockThreshold;
    return true;
  });
  const getStockStatus = (item) => {
    if (item.quantity === 0) return { label: L.outOfStock, color: 'text-red-500 bg-red-50 dark:bg-red-900/20' };
    if (item.quantity <= item.lowStockThreshold) return { label: L.lowStock, color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' };
    return { label: L.inStock, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' };
  };
  const resetInvForm = () => { setInvName(''); setInvQty(''); setInvUnit('kg'); setInvCustomUnit(''); setInvThreshold(5); };
  const openAddInv   = () => { resetInvForm(); setEditInvItem(null); setShowInvModal(true); };
  const openEditInv  = (item) => {
    setEditInvItem(item); setInvName(item.name); setInvQty(item.quantity.toString());
    const known = INV_UNITS.includes(item.unit);
    setInvUnit(known ? item.unit : 'custom'); setInvCustomUnit(known ? '' : item.unit);
    setInvThreshold(item.lowStockThreshold ?? 5); setShowInvModal(true);
  };
  const saveInvItem = async (e) => {
    e.preventDefault();
    if (!invName.trim() || invQty === '' || !invFinalUnit) return;
    setSavingInv(true);
    const body = { name:invName, quantity:parseFloat(invQty), unit:invFinalUnit, lowStockThreshold:parseFloat(invThreshold), restaurantId };
    const url    = editInvItem ? `/api/inventory/${editInvItem._id}` : '/api/inventory';
    const method = editInvItem ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { ...authHeader, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSavingInv(false); setShowInvModal(false); loadInventory();
  };
  const deleteInvItem = async (id) => { if(!confirm('Delete this item?'))return; await fetch(`/api/inventory/${id}`,{method:'DELETE',headers:authHeader}); loadInventory(); };
  const startBulk = () => { const e={}; invItems.forEach(i=>{e[i._id]={quantity:i.quantity,lowStockThreshold:i.lowStockThreshold};}); setBulkEdits(e); setBulkMode(true); };
  const saveBulk  = async () => {
    setSavingBulk(true);
    await Promise.all(Object.entries(bulkEdits).map(([id,vals])=>fetch(`/api/inventory/${id}`,{method:'PUT',headers:{...authHeader,'Content-Type':'application/json'},body:JSON.stringify(vals)})));
    setSavingBulk(false); setBulkMode(false); loadInventory();
  };
  const exportInvCSV = () => {
    const rows = invItems.map(i=>`"${i.name}",${i.quantity},${i.unit},${i.lowStockThreshold}`);
    const blob = new Blob([['Name,Quantity,Unit,Threshold',...rows].join('\n')],{type:'text/csv'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='inventory.csv'; a.click();
  };

  // ── Menu functions ───────────────────────────────────────────
  const visibleMenuItems = menuItems.filter(i => i.category === activeCat || i.category?._id === activeCat);
  const resetMenuForm    = () => { setMName(''); setMDesc(''); setMPrice(''); setMCatId(activeCat||''); setMAvailable(true); setMTags([]); setMImageFile(null); setMImagePreview(''); setMExistingImg(''); };
  const openAddMenuItem  = () => { resetMenuForm(); setEditMenuItem(null); setShowItemModal(true); };
  const openEditMenuItem = (item) => {
    setEditMenuItem(item); setMName(item.name); setMDesc(item.description||''); setMPrice(item.price.toString());
    setMCatId(item.category?._id||item.category||''); setMAvailable(item.isAvailable!==false);
    setMTags(item.dietaryTags||[]); setMImageFile(null); setMImagePreview(''); setMExistingImg(item.imageUrl||''); setShowItemModal(true);
  };
  const saveMenuItem = async (e) => {
    e.preventDefault(); if (!mName.trim()||!mPrice||!mCatId) return; setSavingItem(true);
    const fd = new FormData();
    fd.append('name',mName); fd.append('description',mDesc); fd.append('price',mPrice);
    fd.append('categoryId',mCatId); fd.append('restaurantId',restaurantId);
    fd.append('isAvailable',mAvailable); fd.append('dietaryTags',JSON.stringify(mTags));
    if (mImageFile) fd.append('image',mImageFile);
    else if (mExistingImg) fd.append('generatedImageUrl',mExistingImg);
    const url    = editMenuItem ? `/api/menu/items/${editMenuItem._id}` : '/api/menu/items';
    const method = editMenuItem ? 'PUT' : 'POST';
    await fetch(url, { method, headers: authHeader, body: fd });
    setSavingItem(false); setShowItemModal(false); loadMenuItems();
  };
  const deleteMenuItem = async (id) => { if(!confirm('Delete this item?'))return; await fetch(`/api/menu/items/${id}`,{method:'DELETE',headers:authHeader}); loadMenuItems(); };
  const toggleMenuAvail = async (item) => {
    setMenuItems(prev=>prev.map(i=>i._id===item._id?{...i,isAvailable:!i.isAvailable}:i));
    await fetch(`/api/menu/items/${item._id}/toggle`,{method:'PATCH',headers:authHeader});
  };
  const saveCat = async (e) => {
    e.preventDefault(); if (!catName.trim()) return; setSavingCat(true);
    const url    = editCat ? `/api/menu/categories/${editCat._id}` : '/api/menu/categories';
    const method = editCat ? 'PUT' : 'POST';
    await fetch(url,{method,headers:{...authHeader,'Content-Type':'application/json'},body:JSON.stringify({name:catName,restaurantId})});
    setSavingCat(false); setShowCatModal(false); loadCategories();
  };
  const deleteCat = async (catId) => {
    if (!confirm('Delete category and all its items?'))return;
    await fetch(`/api/menu/categories/${catId}`,{method:'DELETE',headers:authHeader});
    if (activeCat===catId) setActiveCat(null); loadCategories(); loadMenuItems();
  };
  const handleGenDesc = async () => {
    if (!mName.trim()) return alert('Enter item name first');
    setGenDesc(true);
    try { const r=await fetch('/api/ai/describe',{method:'POST',headers:{...authHeader,'Content-Type':'application/json'},body:JSON.stringify({itemName:mName,restaurantId})}); const d=await r.json(); setMDesc(d.description||''); } catch{}
    setGenDesc(false);
  };
  const handleGenImg = async () => {
    if (!mName.trim()) return alert('Enter item name first');
    setGenImg(true);
    try { const r=await fetch('/api/images/generate',{method:'POST',headers:{...authHeader,'Content-Type':'application/json'},body:JSON.stringify({dishName:mName,restaurantId})}); const d=await r.json(); if(d.imageUrl){setMExistingImg(d.imageUrl);setMImagePreview(d.imageUrl);setMImageFile(null);} } catch{}
    setGenImg(false);
  };
  const handleGenTags = async () => {
    if (!mName.trim()) return alert('Enter item name first');
    setGenTags(true);
    try { const r=await fetch('/api/ai/suggest-tags',{method:'POST',headers:{...authHeader,'Content-Type':'application/json'},body:JSON.stringify({itemName:mName,description:mDesc})}); const d=await r.json(); setMTags(prev=>[...new Set([...prev,...(d.tags||[])])]); } catch{}
    setGenTags(false);
  };

  // ── Staff functions ──────────────────────────────────────────
  const resetForm    = () => { setName(''); setRole('chef'); setLanguage('en'); setPassword(''); };
  const openAdd      = () => { resetForm(); setEditMember(null); setShowModal(true); };
  const openEdit     = (s) => { setEditMember(s); setName(s.name); setRole(s.role); setLanguage(s.language||'en'); setPassword(''); setShowModal(true); };
  const deleteStaff  = async (id) => { if(!confirm('Delete this staff member?'))return; await fetch(`/api/staff/manage/${id}`,{method:'DELETE',headers:authHeader}); loadStaff(); };
  const toggleActive = async (s) => { await fetch(`/api/staff/manage/${s._id}`,{method:'PUT',headers:{...authHeader,'Content-Type':'application/json'},body:JSON.stringify({isActive:!s.isActive})}); loadStaff(); };
  const saveStaff = async (e) => {
    e.preventDefault(); if (!name.trim()||(!editMember&&!password.trim()))return; setSaving(true);
    const body={name,language}; const url=editMember?`/api/staff/manage/${editMember._id}`:'/api/staff/manage'; const method=editMember?'PUT':'POST';
    if (!editMember){body.role=role;body.password=password;} if(editMember&&password)body.password=password;
    const res=await fetch(url,{method,headers:{...authHeader,'Content-Type':'application/json'},body:JSON.stringify(body)});
    const data=await res.json(); setSaving(false); setShowModal(false);
    if (!editMember&&data.loginId) setShowPass({loginId:data.loginId,password,name:data.name,role:data.role});
    loadStaff();
  };

  const todayOrders    = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
  const activeSessions = sessions.filter(s => s.status !== 'closed');
  const totalRev       = todayOrders.filter(o => o.status === 'completed').reduce((s,o) => s + o.totalAmount, 0);

  return (
    <div>
      <iframe ref={iframeRef} style={{ display: 'none' }} title="bill-print-frame" />

      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-5">📊 {L.title}</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-400 mb-1">{L.totalOrders}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{todayOrders.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-400 mb-1">{L.revenue}</p>
          <p className="text-2xl font-bold text-orange-500">{currency}{totalRev.toFixed(0)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-400 mb-1">{L.activeOrders}</p>
          <p className="text-2xl font-bold text-red-500">{activeSessions.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { key: 'orders',    icon: '📋', label: L.allOrders },
          { key: 'inventory', icon: '📦', label: L.inventory  },
          { key: 'menu',      icon: '🍽️', label: L.menu       },
          { key: 'staff',     icon: '👥', label: L.staff      },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition
              ${tab === t.key ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Orders Tab ── */}
      {tab === 'orders' && (
        <div className="flex flex-col gap-4">

          {/* ── New Order Table Picker ── */}
          {tables.length > 0 && (
            <div className="flex justify-end">
              <select
                onChange={e => { if (e.target.value) { navigate(`/staff/order/${e.target.value}`); e.target.value = ''; } }}
                defaultValue=""
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer">
                <option value="" disabled>🍽️ {L.newOrderFor}</option>
                {tables.map(t => (
                  <option key={t._id} value={t._id}>{L.table} {t.tableNumber}</option>
                ))}
              </select>
            </div>
          )}

          {activeSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
              <span className="text-4xl mb-3">📋</span><p>{L.noOrders}</p>
            </div>
          ) : activeSessions.map(session => (
            <div key={session._id}
              className={`bg-white dark:bg-gray-900 rounded-2xl border-2 shadow-sm overflow-hidden
                ${session.status === 'bill_requested' ? 'border-orange-400' : 'border-gray-100 dark:border-gray-800'}`}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-800 dark:text-gray-100">{L.table} {session.tableNumber}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${SESSION_STATUS_COLORS[session.status]}`}>
                    {session.status === 'bill_requested' ? L.billRequested : L.open}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(session.openedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/staff/order/${session.table?._id || session.table}`)}
                    className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-500 hover:bg-orange-100 px-2.5 py-1 rounded-lg transition font-medium">
                    + Order
                  </button>
                  <span className="text-sm font-bold text-orange-500">{currency}{(session.totalAmount||0).toFixed(2)}</span>
                </div>
              </div>
              <div className="px-4 py-3">
                {(session.orders||[]).map((order,oi) => (
                  <div key={order._id||oi} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-400 font-medium">
                        Order {oi+1} · {new Date(order.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                        {order.customerName && ` · ${order.customerName}`}
                      </p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                        ${order.status==='new'?'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400':
                          order.status==='preparing'?'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400':
                          order.status==='ready'?'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400':
                          'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                        {L[order.status]}
                      </span>
                    </div>
                    {(order.items||[]).map((item,i) => {
                      const qty = item.quantity||item.qty||1;
                      return (
                        <div key={i} className="flex justify-between text-sm text-gray-600 dark:text-gray-400 py-0.5 pl-2">
                          <span>{item.name} <span className="text-orange-500 font-medium">×{qty}</span></span>
                          <span>{currency}{((item.price||0)*qty).toFixed(2)}</span>
                        </div>
                      );
                    })}
                    <div className="flex gap-2 mt-2 pl-2">
                      {order.status==='new' && <button onClick={()=>updateStatus(order._id,'preparing')} className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg transition font-medium">🍳 {L.preparing}</button>}
                      {order.status==='preparing' && <button onClick={()=>updateStatus(order._id,'ready')} className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition font-medium">🔔 {L.ready}</button>}
                      {order.status==='ready' && <button onClick={()=>updateStatus(order._id,'completed')} className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition font-medium">✅ {L.markComplete}</button>}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-gray-800 dark:text-gray-100 pt-2 mt-1 border-t border-gray-100 dark:border-gray-800">
                  <span>{L.sessionTotal}</span>
                  <span className="text-orange-500">{currency}{(session.totalAmount||0).toFixed(2)}</span>
                </div>
                {session.splitMethod && session.splitMethod !== 'none' && session.splits?.length > 0 && (
                  <div className="mt-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Split Bill</p>
                    {session.splits.map((split,idx) => (
                      <div key={idx} className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{split.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{currency}{split.amount.toFixed(2)}</span>
                          {split.paid ? <span className="text-xs text-green-500 font-medium">{L.paid}</span> :
                            <button onClick={()=>handleMarkPaid(session,idx)} className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-lg transition">{L.markPaid}</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <button onClick={()=>openSplit(session)} className="flex-1 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 py-2 rounded-lg transition font-medium">✂️ {L.splitBill}</button>
                <button onClick={()=>handlePrintBillSession(session,session.splits?.length?session.splits:null)} className="flex-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 hover:bg-blue-100 py-2 rounded-lg transition font-medium">🖨️ {L.printBill}</button>
                <button onClick={()=>handleCloseSession(session)} className="flex-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 py-2 rounded-lg transition font-medium">✅ {L.closeSess}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Inventory Tab ── */}
      {tab === 'inventory' && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex gap-2 flex-wrap">
              {[{key:'all',label:L.allItems},{key:'low',label:`⚠️ ${L.lowStock}`},{key:'out',label:`🚫 ${L.outOfStock}`}].map(f=>(
                <button key={f.key} onClick={()=>setInvFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${invFilter===f.key?'bg-orange-500 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={exportInvCSV} className="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">📥 {L.exportCSV}</button>
              {bulkMode ? (
                <>
                  <button onClick={()=>setBulkMode(false)} className="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-xl text-sm transition">{L.cancelBulk}</button>
                  <button onClick={saveBulk} disabled={savingBulk} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition">{savingBulk?'...':L.saveAll}</button>
                </>
              ) : (
                <>
                  <button onClick={startBulk} className="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-xl text-sm transition">{L.bulkEdit}</button>
                  <button onClick={openAddInv} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition">{L.addItem}</button>
                </>
              )}
            </div>
          </div>
          {invLoading ? (
            <div className="flex justify-center py-16"><span className="animate-spin text-2xl">⏳</span></div>
          ) : filteredInvItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
              <span className="text-4xl mb-3">📦</span>
              <p className="text-sm">{invItems.length===0?L.noItems:'No items match this filter'}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredInvItems.map(item => {
                const {label,color} = getStockStatus(item);
                return (
                  <div key={item._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-3 shadow-sm">
                    {bulkMode ? (
                      <div className="grid grid-cols-[2fr_1fr_1fr] gap-3 items-center">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.name}</span>
                        <div>
                          <label className="text-xs text-gray-400 block mb-0.5">{L.quantity}</label>
                          <input type="number" min="0" step="0.1" value={bulkEdits[item._id]?.quantity??item.quantity}
                            onChange={e=>setBulkEdits(b=>({...b,[item._id]:{...b[item._id],quantity:parseFloat(e.target.value)||0}}))}
                            className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-0.5">{L.alertWhen}</label>
                          <input type="number" min="0" step="0.5" value={bulkEdits[item._id]?.lowStockThreshold??item.lowStockThreshold}
                            onChange={e=>setBulkEdits(b=>({...b,[item._id]:{...b[item._id],lowStockThreshold:parseFloat(e.target.value)||0}}))}
                            className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.quantity} {item.unit} · {L.alertWhen} {item.lowStockThreshold} {item.unit}</p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${color}`}>{label}</span>
                        <div className="flex gap-3 shrink-0">
                          <button onClick={()=>openEditInv(item)} className="text-xs text-blue-500 hover:text-blue-700 transition">{L.edit}</button>
                          <button onClick={()=>deleteInvItem(item._id)} className="text-xs text-red-400 hover:text-red-600 transition">{L.delete}</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Menu Tab ── */}
      {tab === 'menu' && (
        <div className="flex gap-4" style={{minHeight:'400px'}}>
          <div className="w-44 shrink-0 flex flex-col gap-2">
            <button onClick={()=>{setEditCat(null);setCatName('');setShowCatModal(true);}}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 rounded-xl transition">
              + {L.addCategory}
            </button>
            {categories.length === 0 ? (
              <p className="text-xs text-gray-400 text-center mt-4">{L.noCategories}</p>
            ) : categories.map(cat => (
              <div key={cat._id}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm transition
                  ${activeCat===cat._id?'bg-orange-500 text-white font-semibold':'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                onClick={()=>setActiveCat(cat._id)}>
                <span className="truncate">{cat.name}</span>
                <div className="hidden group-hover:flex gap-1">
                  <button onClick={e=>{e.stopPropagation();setEditCat(cat);setCatName(cat.name);setShowCatModal(true);}} className="text-xs px-1 hover:opacity-70">✎</button>
                  <button onClick={e=>{e.stopPropagation();deleteCat(cat._id);}} className="text-xs px-1 hover:opacity-70">✕</button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex-1">
            {!activeCat ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <span className="text-4xl mb-3">🍽️</span>
                <p className="text-sm">{L.startWithCategory}</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-gray-500">{visibleMenuItems.length} items</p>
                  <button onClick={openAddMenuItem} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">{L.addItem}</button>
                </div>
                {visibleMenuItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                    <span className="text-3xl mb-2">🍴</span>
                    <p className="text-sm">{L.noMenuItems}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {visibleMenuItems.map(item => (
                      <div key={item._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-28 object-cover" /> :
                          <div className="w-full h-28 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center"><span className="text-2xl">🍽️</span></div>}
                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{item.name}</p>
                            <span className="text-sm font-bold text-orange-500 shrink-0">{currency}{item.price.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                            <button onClick={()=>toggleMenuAvail(item)}
                              className={`text-xs font-medium px-2.5 py-1 rounded-full transition
                                ${item.isAvailable?'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400':'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                              {item.isAvailable?L.available:L.unavailable}
                            </button>
                            <div className="flex gap-3">
                              <button onClick={()=>openEditMenuItem(item)} className="text-xs text-blue-500 hover:text-blue-700 transition">{L.edit}</button>
                              <button onClick={()=>deleteMenuItem(item._id)} className="text-xs text-red-400 hover:text-red-600 transition">{L.delete}</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Staff Tab ── */}
      {tab === 'staff' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{staffList.length} members</p>
            <button onClick={openAdd} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition">{L.addStaff}</button>
          </div>
          {staffList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
              <span className="text-4xl mb-3">👥</span><p className="text-sm">{L.noStaff}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {staffList.map(s => (
                <div key={s._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-3 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg shrink-0">
                      {s.role==='manager'?'👔':s.role==='chef'?'👨‍🍳':'🛎️'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{s.name}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[s.role]}`}>{s.role}</span>
                        {!s.isActive && <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">Inactive</span>}
                        {s._id===staff?._id && <span className="text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-500 px-2 py-0.5 rounded-full">You</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">ID: {s.loginId} · {LANG_LABELS[s.language]||s.language}</p>
                    </div>
                  </div>
                  {s.role !== 'manager' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={()=>toggleActive(s)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full transition ${s.isActive?'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200':'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200'}`}>
                        {s.isActive?L.active:L.inactive}
                      </button>
                      <button onClick={()=>openEdit(s)} className="text-xs text-blue-500 hover:text-blue-700 transition">{L.edit}</button>
                      <button onClick={()=>deleteStaff(s._id)} className="text-xs text-red-400 hover:text-red-600 transition">{L.delete}</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Inventory Modal ── */}
      {showInvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl">
            <div className="px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{editInvItem?L.editItem:L.addItem}</h3>
            </div>
            <form onSubmit={saveInvItem} className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">{L.itemName} *</label>
                <input type="text" value={invName} onChange={e=>setInvName(e.target.value)} required autoFocus
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">{L.quantity}</label>
                <input type="number" value={invQty} onChange={e=>setInvQty(e.target.value)} min="0" step="0.1"
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">{L.unit} *</label>
                <select value={invUnit} onChange={e=>setInvUnit(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                  {INV_UNITS.map(u=><option key={u} value={u}>{u}</option>)}
                  <option value="custom">Custom…</option>
                </select>
                {invUnit==='custom' && <input type="text" value={invCustomUnit} onChange={e=>setInvCustomUnit(e.target.value)} required placeholder="Custom unit"
                  className="mt-2 w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />}
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">{L.alertWhen} {invFinalUnit||'units'}</label>
                <input type="number" value={invThreshold} onChange={e=>setInvThreshold(e.target.value)} min="0" step="0.5"
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={()=>setShowInvModal(false)} className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">{L.cancel}</button>
                <button type="submit" disabled={savingInv} className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-xl text-sm transition">{savingInv?'...':editInvItem?L.save:L.addItem}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Category Modal ── */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{editCat?L.editCategory:L.addCategory}</h3>
            <form onSubmit={saveCat} className="flex flex-col gap-4">
              <input type="text" value={catName} onChange={e=>setCatName(e.target.value)} placeholder={L.categoryPlaceholder} autoFocus required
                className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <div className="flex gap-3">
                <button type="button" onClick={()=>setShowCatModal(false)} className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl text-sm transition">{L.cancel}</button>
                <button type="submit" disabled={savingCat} className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-xl text-sm transition">{savingCat?'...':editCat?L.save:L.addCategory}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Menu Item Modal ── */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800 z-10">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{editMenuItem?L.editItem:L.addItem}</h3>
            </div>
            <form onSubmit={saveMenuItem} className="px-6 py-5 flex flex-col gap-5">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">{L.selectCategory} *</label>
                <select value={mCatId} onChange={e=>setMCatId(e.target.value)} required
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="">— {L.selectCategory} —</option>
                  {categories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">{L.itemName} *</label>
                <input type="text" value={mName} onChange={e=>setMName(e.target.value)} required placeholder={L.itemNamePlaceholder}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm text-gray-600 dark:text-gray-400">{L.description}</label>
                  <button type="button" onClick={handleGenDesc} disabled={genDesc} className="text-xs text-orange-500 hover:text-orange-600 font-medium disabled:opacity-50 transition">
                    {genDesc?`⏳ ${L.generatingDesc}`:`✨ ${L.generateDesc}`}
                  </button>
                </div>
                <textarea value={mDesc} onChange={e=>setMDesc(e.target.value)} rows={3} placeholder={L.descPlaceholder}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">{L.price} ({currency}) *</label>
                <input type="number" value={mPrice} onChange={e=>setMPrice(e.target.value)} min="0" step="0.01" required placeholder="0.00"
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm text-gray-600 dark:text-gray-400">{L.photo}</label>
                  <button type="button" onClick={handleGenImg} disabled={genImg} className="text-xs text-purple-500 hover:text-purple-600 font-medium disabled:opacity-50 transition">
                    {genImg?`⏳ ${L.generatingImage}`:`🎨 ${L.generateImage}`}
                  </button>
                </div>
                <label className="flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl h-24 cursor-pointer hover:border-orange-300 transition overflow-hidden">
                  {(mImagePreview||mExistingImg) ? <img src={mImagePreview||mExistingImg} alt="preview" className="h-full w-full object-cover" /> :
                    <span className="text-xs text-gray-400">{L.uploadPhoto}</span>}
                  <input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files[0];if(!f)return;setMImageFile(f);setMImagePreview(URL.createObjectURL(f));setMExistingImg('');}} />
                </label>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">{L.dietaryTags}</label>
                  <button type="button" onClick={handleGenTags} disabled={genTags} className="text-xs text-green-500 hover:text-green-600 font-medium disabled:opacity-50 transition">
                    {genTags?`⏳ ${L.suggestingTags}`:`✨ ${L.suggestTags}`}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map(tag=>(
                    <button key={tag} type="button" onClick={()=>setMTags(prev=>prev.includes(tag)?prev.filter(t=>t!==tag):[...prev,tag])}
                      className={`text-xs px-2.5 py-1 rounded-full border transition ${mTags.includes(tag)?'bg-green-500 text-white border-green-500':'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-green-400'}`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300">{L.available}</span>
                <div onClick={()=>setMAvailable(v=>!v)} className={`w-11 h-6 rounded-full transition-colors relative ${mAvailable?'bg-orange-500':'bg-gray-300 dark:bg-gray-600'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${mAvailable?'translate-x-5':'translate-x-0.5'}`} />
                </div>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowItemModal(false)} className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-3 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">{L.cancel}</button>
                <button type="submit" disabled={savingItem} className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-xl text-sm transition">{savingItem?'...':editMenuItem?L.save:L.addItem}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add/Edit Staff Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl">
            <div className="px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{editMember?L.edit+' Staff':L.addStaff}</h3>
            </div>
            <form onSubmit={saveStaff} className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">{L.name} *</label>
                <input type="text" value={name} onChange={e=>setName(e.target.value)} required autoFocus placeholder="e.g. Rahul Sharma"
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              {!editMember && (
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">{L.role} *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map(r=>(
                      <button key={r} type="button" onClick={()=>setRole(r)}
                        className={`py-2 rounded-xl text-sm font-medium border transition capitalize ${role===r?'bg-orange-500 text-white border-orange-500':'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-300'}`}>
                        {r==='chef'?'👨‍🍳':'🛎️'} {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">{L.language}</label>
                <div className="flex gap-2">
                  {LANGS.map(l=>(
                    <button key={l} type="button" onClick={()=>setLanguage(l)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${language===l?'bg-orange-500 text-white border-orange-500':'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-300'}`}>
                      {LANG_LABELS[l]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">
                  {L.password} {editMember&&<span className="text-xs text-gray-400">(leave blank to keep)</span>}
                </label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required={!editMember}
                  placeholder={editMember?'New password (optional)':'Set a password'}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">{L.cancel}</button>
                <button type="submit" disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-xl text-sm transition">{saving?'...':editMember?L.save:L.addStaff}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Credentials Modal ── */}
      {showPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl p-6">
            <div className="text-center mb-4">
              <span className="text-4xl">{showPass.role==='chef'?'👨‍🍳':'🛎️'}</span>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-2">{L.credentialsTitle}</h3>
              <p className="text-sm text-gray-400 mt-1">{L.shareWith} {showPass.name}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-4 flex flex-col gap-3">
              <div className="flex items-center justify-between"><span className="text-xs text-gray-400 uppercase tracking-wide">{L.loginId}</span><span className="font-mono font-bold text-gray-800 dark:text-gray-100 text-sm">{showPass.loginId}</span></div>
              <div className="flex items-center justify-between"><span className="text-xs text-gray-400 uppercase tracking-wide">{L.password}</span><span className="font-mono font-bold text-gray-800 dark:text-gray-100 text-sm">{showPass.password}</span></div>
              <div className="flex items-center justify-between"><span className="text-xs text-gray-400 uppercase tracking-wide">{L.loginUrl}</span><span className="text-xs text-orange-500">{window.location.origin}/staff/login</span></div>
            </div>
            <button onClick={()=>navigator.clipboard.writeText(`QRunch Staff Login\nURL: ${window.location.origin}/staff/login\nLogin ID: ${showPass.loginId}\nPassword: ${showPass.password}`)}
              className="w-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition mb-2">
              📋 {L.copyCredentials}
            </button>
            <button onClick={()=>setShowPass(null)} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition">{L.done}</button>
          </div>
        </div>
      )}

      {/* ── Split Bill Modal ── */}
      {showSplit && splitSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl">
            <div className="px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">✂️ {L.splitBill} — {L.table} {splitSession.tableNumber}</h3>
              <p className="text-sm text-gray-400 mt-0.5">{L.sessionTotal}: {currency}{(splitSession.totalAmount||0).toFixed(2)}</p>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-2">
                {[{key:'equal',label:L.splitEqual},{key:'custom',label:L.splitCustom},{key:'by_order',label:L.splitByOrder}].map(m=>(
                  <button key={m.key} onClick={()=>setSplitMethod(m.key)}
                    className={`py-2 px-1 rounded-xl text-xs font-medium border transition text-center ${splitMethod===m.key?'bg-orange-500 text-white border-orange-500':'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                    {m.label}
                  </button>
                ))}
              </div>
              {splitMethod==='equal' && (
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 block">{L.numPeople}</label>
                  <input type="number" min="2" max="20" value={numPeople} onChange={e=>setNumPeople(parseInt(e.target.value)||2)}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  <p className="text-sm text-orange-500 font-semibold mt-2 text-center">{currency}{(splitSession.totalAmount/numPeople).toFixed(2)} {L.perPerson}</p>
                </div>
              )}
              {splitMethod==='custom' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">{L.customAmounts}</label>
                    <div className="flex gap-1">
                      <button onClick={()=>setCustomAmts(a=>[...a,0])} className="text-xs text-orange-500 font-medium">+ Add</button>
                      {customAmts.length>2&&<button onClick={()=>setCustomAmts(a=>a.slice(0,-1))} className="text-xs text-red-400 font-medium ml-2">- Remove</button>}
                    </div>
                  </div>
                  {customAmts.map((amt,i)=>(
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-500 w-16">{L.person} {i+1}</span>
                      <input type="number" min="0" step="0.01" value={amt}
                        onChange={e=>{const n=[...customAmts];n[i]=parseFloat(e.target.value)||0;setCustomAmts(n);}}
                        className="flex-1 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                  ))}
                  <div className={`text-xs font-medium text-center mt-1 ${Math.abs(customAmts.reduce((s,a)=>s+(parseFloat(a)||0),0)-splitSession.totalAmount)<0.01?'text-green-500':'text-red-500'}`}>
                    Sum: {currency}{customAmts.reduce((s,a)=>s+(parseFloat(a)||0),0).toFixed(2)} / {currency}{splitSession.totalAmount.toFixed(2)}
                  </div>
                </div>
              )}
              {splitMethod==='by_order' && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  {(splitSession.orders||[]).map((o,i)=>(
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600 dark:text-gray-400">Order {i+1}{o.customerName?` — ${o.customerName}`:''}</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{currency}{(o.totalAmount||0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={()=>setShowSplit(false)} className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">{L.cancel}</button>
                <button onClick={applySplit} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition">{L.apply}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}