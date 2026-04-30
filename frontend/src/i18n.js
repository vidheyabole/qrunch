import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const translations = {
  en: {
    nav: {
      dashboard: 'Dashboard', menu: 'Menu Builder', tables: 'Tables & QR',
      orders: 'Orders', analytics: 'Analytics', inventory: 'Inventory',
      staff: 'Staff', soon: 'Soon'
    },
    common: {
      add: 'Add', edit: 'Edit', delete: 'Delete', save: 'Save',
      cancel: 'Cancel', update: 'Update', logout: 'Logout', loading: 'Loading...',
      available: 'Available', unavailable: 'Unavailable', exportCSV: 'Export CSV',
      refresh: 'Refresh', apply: 'Apply', confirm: 'Confirm', close: 'Close',
      search: 'Search', noResults: 'No results found'
    },
    menu: {
      title: 'Menu Builder', addCategory: 'Add Category', editCategory: 'Edit Category',
      addItem: '+ Add Item', editItem: 'Edit Item', itemName: 'Item Name',
      itemNamePlaceholder: 'e.g. Paneer Tikka or Cluck it Burger!',
      description: 'Description', descPlaceholder: 'Describe your dish, or use AI to generate one...',
      price: 'Price', photo: 'Photo', uploadPhoto: 'Click to upload photo',
      generateDesc: 'Generate with AI', generatingDesc: 'Generating...',
      suggestTags: 'Suggest with AI', suggestingTags: 'Suggesting...',
      generateImage: 'Generate image with AI', generatingImage: 'Generating image...',
      dietaryTags: 'Dietary Tags', modifiers: 'Modifiers', addGroup: '+ Add Group',
      addOption: '+ Add Option', groupName: 'Group name (e.g. Size, Add-ons)',
      optionLabel: 'Option label', extraPrice: '+price', noCategories: 'No categories yet',
      noItems: 'No items yet — add your first dish!',
      categoryPlaceholder: 'e.g. Starters, Mains, Desserts',
      aiSuggestedTags: 'AI suggested', canDeselect: 'you can deselect any below',
      imageNote: 'This may take up to 60 seconds', selectCategory: 'Select a category',
      startWithCategory: 'Add a category to get started'
    },
    inventory: {
      title: 'Inventory', addItem: '+ Add Item', editItem: 'Edit Item',
      bulkEdit: 'Bulk Edit', cancelBulk: 'Cancel Bulk Edit', saveAll: 'Save All',
      allItems: 'All Items', lowStock: 'Low Stock', outOfStock: 'Out of Stock',
      unlimited: 'Unlimited', inStock: 'In Stock', quantity: 'Quantity', unit: 'Unit',
      alertThreshold: 'Low Stock Alert Threshold', alertWhen: 'Alert when ≤',
      emailAlertSent: 'email alert sent',
      helpText: 'Leave stock blank for unlimited. Items at 0 are automatically hidden from the customer menu. Low stock alerts are sent when stock reaches the threshold.',
      itemName: 'Item Name', itemNamePlaceholder: 'e.g. Chicken, Potatoes, Oil',
      unitPlaceholder: 'e.g. kg, lbs, litre, bottles', noItems: 'No inventory items yet.',
      addFirst: 'Start tracking your ingredients.'
    },
    analytics: {
      title: 'Analytics', totalRevenue: 'Total Revenue', totalOrders: 'Total Orders',
      avgOrderValue: 'Avg Order Value', today: 'Today', thisWeek: 'This Week',
      thisMonth: 'This Month', topItems: 'Top Items', tablePerformance: 'Table Performance',
      peakHours: 'Peak Hours', revenueOverTime: 'Revenue Over Time',
      noData: 'No data for this period', orders: 'orders', revenue: 'Revenue',
      table: 'Table', item: 'Item', count: 'Count', hour: 'Hour',
      downloadReport: 'Download Report', refreshData: 'Refresh Data'
    },
    customer: {
      selectLang: 'Select your language', continueMenu: 'Go to Menu',
      skipBrowse: 'Just browse', enterDetails: "Let's go!",
      optionalDetails: 'Enter your details for a personalised experience.',
      yourName: 'Your name', phoneNumber: 'Phone number', optional: 'optional',
      addToCart: 'Add to cart', viewCart: 'View cart', placeOrder: 'Place Order',
      placing: 'Placing order...', yourCart: 'Your Cart', items: 'items',
      orderPlaced: 'Order Placed!', orderSentKitchen: 'Your order has been sent to the kitchen.',
      orderId: 'Order ID', orderMore: 'Order More', specialInstructions: 'Special instructions',
      goesWith: 'Goes well with...', forYou: '⭐ For You', total: 'Total',
      billSummary: 'Bill Summary', scanOrder: 'Scan to view menu', poweredBy: 'Powered by QRunch',
      welcomeBack: 'Welcome back', returnMenu: 'Returning to menu in',
      emptyCart: 'Your cart is empty', browseMenu: 'Browse Menu',
      yourDetails: 'Your Details', reorderNote: 'For order updates only.',
      remove: 'Remove', noMenu: 'Menu is being prepared.'
    }
  },

  es: {
    nav: {
      dashboard: 'Panel', menu: 'Menú', tables: 'Mesas y QR',
      orders: 'Pedidos', analytics: 'Análisis', inventory: 'Inventario',
      staff: 'Personal', soon: 'Pronto'
    },
    common: {
      add: 'Agregar', edit: 'Editar', delete: 'Eliminar', save: 'Guardar',
      cancel: 'Cancelar', update: 'Actualizar', logout: 'Cerrar sesión', loading: 'Cargando...',
      available: 'Disponible', unavailable: 'No disponible', exportCSV: 'Exportar CSV',
      refresh: 'Actualizar', apply: 'Aplicar', confirm: 'Confirmar', close: 'Cerrar',
      search: 'Buscar', noResults: 'Sin resultados'
    },
    menu: {
      title: 'Constructor de Menú', addCategory: 'Añadir categoría', editCategory: 'Editar categoría',
      addItem: '+ Añadir plato', editItem: 'Editar plato', itemName: 'Nombre del plato',
      itemNamePlaceholder: 'ej. Tacos de pollo', description: 'Descripción',
      descPlaceholder: 'Describe tu plato o usa IA...', price: 'Precio', photo: 'Foto',
      uploadPhoto: 'Haz clic para subir foto', generateDesc: 'Generar con IA', generatingDesc: 'Generando...',
      suggestTags: 'Sugerir con IA', suggestingTags: 'Sugiriendo...',
      generateImage: 'Generar imagen con IA', generatingImage: 'Generando imagen...',
      dietaryTags: 'Etiquetas dietéticas', modifiers: 'Modificadores', addGroup: '+ Añadir grupo',
      addOption: '+ Añadir opción', groupName: 'Nombre del grupo (ej. Tamaño, Extras)',
      optionLabel: 'Etiqueta de opción', extraPrice: '+precio', noCategories: 'Sin categorías',
      noItems: 'Sin platos aún — ¡añade tu primer plato!',
      categoryPlaceholder: 'ej. Entradas, Principales, Postres',
      aiSuggestedTags: 'Sugerido por IA', canDeselect: 'puedes deseleccionar abajo',
      imageNote: 'Puede tardar hasta 60 segundos', selectCategory: 'Seleccionar categoría',
      startWithCategory: 'Añade una categoría para empezar'
    },
    inventory: {
      title: 'Inventario', addItem: '+ Añadir artículo', editItem: 'Editar artículo',
      bulkEdit: 'Edición masiva', cancelBulk: 'Cancelar edición masiva', saveAll: 'Guardar todo',
      allItems: 'Todos', lowStock: 'Stock bajo', outOfStock: 'Sin stock',
      unlimited: 'Ilimitado', inStock: 'En stock', quantity: 'Cantidad', unit: 'Unidad',
      alertThreshold: 'Umbral de alerta', alertWhen: 'Alerta cuando ≤',
      emailAlertSent: 'alerta enviada por correo',
      helpText: 'Deja el stock en blanco para ilimitado. Los artículos en 0 se ocultan automáticamente.',
      itemName: 'Nombre', itemNamePlaceholder: 'ej. Pollo, Papas, Aceite',
      unitPlaceholder: 'ej. kg, litros, botellas', noItems: 'Sin artículos de inventario.',
      addFirst: 'Empieza a rastrear tus ingredientes.'
    },
    analytics: {
      title: 'Análisis', totalRevenue: 'Ingresos totales', totalOrders: 'Pedidos totales',
      avgOrderValue: 'Valor medio de pedido', today: 'Hoy', thisWeek: 'Esta semana',
      thisMonth: 'Este mes', topItems: 'Platos más pedidos', tablePerformance: 'Rendimiento por mesa',
      peakHours: 'Horas pico', revenueOverTime: 'Ingresos en el tiempo',
      noData: 'Sin datos para este período', orders: 'pedidos', revenue: 'Ingresos',
      table: 'Mesa', item: 'Plato', count: 'Cantidad', hour: 'Hora',
      downloadReport: 'Descargar informe', refreshData: 'Actualizar datos'
    },
    customer: {
      selectLang: 'Seleccionar idioma', continueMenu: 'Ir al menú',
      skipBrowse: 'Solo explorar', enterDetails: '¡Empecemos!',
      optionalDetails: 'Ingresa tus datos para una experiencia personalizada.',
      yourName: 'Tu nombre', phoneNumber: 'Teléfono', optional: 'opcional',
      addToCart: 'Añadir al carrito', viewCart: 'Ver carrito', placeOrder: 'Hacer pedido',
      placing: 'Realizando pedido...', yourCart: 'Tu carrito', items: 'artículos',
      orderPlaced: '¡Pedido realizado!', orderSentKitchen: 'Tu pedido ha sido enviado a la cocina.',
      orderId: 'ID de pedido', orderMore: 'Pedir más', specialInstructions: 'Instrucciones especiales',
      goesWith: 'Va bien con...', forYou: '⭐ Para ti', total: 'Total',
      billSummary: 'Resumen del pedido', scanOrder: 'Escanea para ver el menú',
      poweredBy: 'Con tecnología de QRunch', welcomeBack: 'Bienvenido de nuevo',
      returnMenu: 'Volviendo al menú en', emptyCart: 'Tu carrito está vacío',
      browseMenu: 'Ver menú', yourDetails: 'Tus datos', reorderNote: 'Solo para actualizaciones.',
      remove: 'Quitar', noMenu: 'El menú está siendo preparado.'
    }
  },

  hi: {
    nav: {
      dashboard: 'डैशबोर्ड', menu: 'मेनू बिल्डर', tables: 'टेबल और QR',
      orders: 'ऑर्डर', analytics: 'विश्लेषण', inventory: 'सूची',
      staff: 'स्टाफ', soon: 'जल्द'
    },
    common: {
      add: 'जोड़ें', edit: 'संपादित करें', delete: 'हटाएं', save: 'सहेजें',
      cancel: 'रद्द करें', update: 'अपडेट करें', logout: 'लॉगआउट', loading: 'लोड हो रहा है...',
      available: 'उपलब्ध', unavailable: 'अनुपलब्ध', exportCSV: 'CSV निर्यात करें',
      refresh: 'रीफ्रेश', apply: 'लागू करें', confirm: 'पुष्टि करें', close: 'बंद करें',
      search: 'खोजें', noResults: 'कोई परिणाम नहीं'
    },
    menu: {
      title: 'मेनू बिल्डर', addCategory: 'श्रेणी जोड़ें', editCategory: 'श्रेणी संपादित करें',
      addItem: '+ आइटम जोड़ें', editItem: 'आइटम संपादित करें', itemName: 'व्यंजन का नाम',
      itemNamePlaceholder: 'जैसे पनीर टिक्का या बर्गर', description: 'विवरण',
      descPlaceholder: 'अपने व्यंजन का विवरण दें या AI से उत्पन्न करें...',
      price: 'मूल्य', photo: 'फोटो', uploadPhoto: 'फोटो अपलोड करें',
      generateDesc: 'AI से बनाएं', generatingDesc: 'बना रहे हैं...',
      suggestTags: 'AI से सुझाएं', suggestingTags: 'सुझाव दे रहे हैं...',
      generateImage: 'AI से इमेज बनाएं', generatingImage: 'इमेज बना रहे हैं...',
      dietaryTags: 'आहार टैग', modifiers: 'मॉडिफायर', addGroup: '+ ग्रुप जोड़ें',
      addOption: '+ विकल्प जोड़ें', groupName: 'ग्रुप का नाम (जैसे साइज़, एक्स्ट्रा)',
      optionLabel: 'विकल्प लेबल', extraPrice: '+मूल्य', noCategories: 'कोई श्रेणी नहीं',
      noItems: 'अभी कोई आइटम नहीं — पहला व्यंजन जोड़ें!',
      categoryPlaceholder: 'जैसे स्टार्टर, मेन, डेज़र्ट',
      aiSuggestedTags: 'AI सुझाव', canDeselect: 'आप नीचे अचयनित कर सकते हैं',
      imageNote: 'इसमें 60 सेकंड तक लग सकते हैं', selectCategory: 'श्रेणी चुनें',
      startWithCategory: 'शुरू करने के लिए श्रेणी जोड़ें'
    },
    inventory: {
      title: 'सूची प्रबंधन', addItem: '+ आइटम जोड़ें', editItem: 'आइटम संपादित करें',
      bulkEdit: 'बल्क संपादन', cancelBulk: 'बल्क संपादन रद्द करें', saveAll: 'सभी सहेजें',
      allItems: 'सभी आइटम', lowStock: 'कम स्टॉक', outOfStock: 'स्टॉक खत्म',
      unlimited: 'असीमित', inStock: 'स्टॉक में', quantity: 'मात्रा', unit: 'इकाई',
      alertThreshold: 'कम स्टॉक अलर्ट सीमा', alertWhen: 'अलर्ट जब ≤',
      emailAlertSent: 'ईमेल अलर्ट भेजा गया',
      helpText: 'असीमित के लिए स्टॉक खाली छोड़ें। 0 पर आइटम स्वचालित रूप से छिप जाते हैं।',
      itemName: 'आइटम का नाम', itemNamePlaceholder: 'जैसे चिकन, आलू, तेल',
      unitPlaceholder: 'जैसे किग्रा, लीटर, बोतलें', noItems: 'कोई इन्वेंटरी आइटम नहीं।',
      addFirst: 'अपने सामग्री ट्रैक करना शुरू करें।'
    },
    analytics: {
      title: 'विश्लेषण', totalRevenue: 'कुल राजस्व', totalOrders: 'कुल ऑर्डर',
      avgOrderValue: 'औसत ऑर्डर मूल्य', today: 'आज', thisWeek: 'इस सप्ताह',
      thisMonth: 'इस महीने', topItems: 'शीर्ष आइटम', tablePerformance: 'टेबल प्रदर्शन',
      peakHours: 'पीक घंटे', revenueOverTime: 'समय के साथ राजस्व',
      noData: 'इस अवधि के लिए कोई डेटा नहीं', orders: 'ऑर्डर', revenue: 'राजस्व',
      table: 'टेबल', item: 'आइटम', count: 'संख्या', hour: 'घंटा',
      downloadReport: 'रिपोर्ट डाउनलोड करें', refreshData: 'डेटा रीफ्रेश करें'
    },
    customer: {
      selectLang: 'भाषा चुनें', continueMenu: 'मेनू देखें',
      skipBrowse: 'बस ब्राउज़ करें', enterDetails: 'चलते हैं!',
      optionalDetails: 'व्यक्तिगत अनुभव के लिए अपनी जानकारी दें।',
      yourName: 'आपका नाम', phoneNumber: 'फोन नंबर', optional: 'वैकल्पिक',
      addToCart: 'कार्ट में जोड़ें', viewCart: 'कार्ट देखें', placeOrder: 'ऑर्डर करें',
      placing: 'ऑर्डर हो रहा है...', yourCart: 'आपकी कार्ट', items: 'आइटम',
      orderPlaced: 'ऑर्डर हो गया!', orderSentKitchen: 'आपका ऑर्डर रसोई में भेज दिया गया।',
      orderId: 'ऑर्डर ID', orderMore: 'और ऑर्डर करें', specialInstructions: 'विशेष निर्देश',
      goesWith: 'इसके साथ अच्छा लगेगा...', forYou: '⭐ आपके लिए', total: 'कुल',
      billSummary: 'बिल सारांश', scanOrder: 'मेनू देखने के लिए स्कैन करें',
      poweredBy: 'QRunch द्वारा संचालित', welcomeBack: 'वापस आए',
      returnMenu: 'मेनू पर वापस जा रहे हैं', emptyCart: 'आपकी कार्ट खाली है',
      browseMenu: 'मेनू देखें', yourDetails: 'आपकी जानकारी', reorderNote: 'केवल ऑर्डर अपडेट के लिए।',
      remove: 'हटाएं', noMenu: 'मेनू तैयार किया जा रहा है।'
    }
  },

  mr: {
    nav: {
      dashboard: 'डॅशबोर्ड', menu: 'मेनू बिल्डर', tables: 'टेबल आणि QR',
      orders: 'ऑर्डर', analytics: 'विश्लेषण', inventory: 'यादी',
      staff: 'कर्मचारी', soon: 'लवकरच'
    },
    common: {
      add: 'जोडा', edit: 'संपादित करा', delete: 'हटवा', save: 'जतन करा',
      cancel: 'रद्द करा', update: 'अपडेट करा', logout: 'लॉगआउट', loading: 'लोड होत आहे...',
      available: 'उपलब्ध', unavailable: 'अनुपलब्ध', exportCSV: 'CSV निर्यात करा',
      refresh: 'रीफ्रेश', apply: 'लागू करा', confirm: 'पुष्टी करा', close: 'बंद करा',
      search: 'शोधा', noResults: 'कोणतेही परिणाम नाही'
    },
    menu: {
      title: 'मेनू बिल्डर', addCategory: 'श्रेणी जोडा', editCategory: 'श्रेणी संपादित करा',
      addItem: '+ पदार्थ जोडा', editItem: 'पदार्थ संपादित करा', itemName: 'पदार्थाचे नाव',
      itemNamePlaceholder: 'उदा. पनीर टिक्का किंवा बर्गर', description: 'वर्णन',
      descPlaceholder: 'आपल्या पदार्थाचे वर्णन द्या किंवा AI वापरा...',
      price: 'किंमत', photo: 'फोटो', uploadPhoto: 'फोटो अपलोड करा',
      generateDesc: 'AI ने बनवा', generatingDesc: 'बनवत आहे...',
      suggestTags: 'AI ने सुचवा', suggestingTags: 'सुचवत आहे...',
      generateImage: 'AI ने इमेज बनवा', generatingImage: 'इमेज बनवत आहे...',
      dietaryTags: 'आहार टॅग', modifiers: 'मॉडिफायर', addGroup: '+ गट जोडा',
      addOption: '+ पर्याय जोडा', groupName: 'गटाचे नाव (उदा. आकार, अतिरिक्त)',
      optionLabel: 'पर्याय लेबल', extraPrice: '+किंमत', noCategories: 'कोणतीही श्रेणी नाही',
      noItems: 'अजून कोणतेही पदार्थ नाहीत — पहिला पदार्थ जोडा!',
      categoryPlaceholder: 'उदा. स्टार्टर, मुख्य, मिठाई',
      aiSuggestedTags: 'AI सुचवलेले', canDeselect: 'तुम्ही खाली रद्द करू शकता',
      imageNote: 'यास 60 सेकंद लागू शकतात', selectCategory: 'श्रेणी निवडा',
      startWithCategory: 'सुरू करण्यासाठी श्रेणी जोडा'
    },
    inventory: {
      title: 'यादी व्यवस्थापन', addItem: '+ आयटम जोडा', editItem: 'आयटम संपादित करा',
      bulkEdit: 'बल्क संपादन', cancelBulk: 'बल्क संपादन रद्द करा', saveAll: 'सर्व जतन करा',
      allItems: 'सर्व आयटम', lowStock: 'कमी स्टॉक', outOfStock: 'स्टॉक संपला',
      unlimited: 'असीमित', inStock: 'स्टॉकमध्ये', quantity: 'प्रमाण', unit: 'एकक',
      alertThreshold: 'कमी स्टॉक सूचना मर्यादा', alertWhen: 'सूचना जेव्हा ≤',
      emailAlertSent: 'ईमेल सूचना पाठवली',
      helpText: 'असीमितसाठी स्टॉक रिकामे ठेवा। 0 वरील आयटम आपोआप लपतात।',
      itemName: 'आयटमचे नाव', itemNamePlaceholder: 'उदा. चिकन, बटाटे, तेल',
      unitPlaceholder: 'उदा. किग्रॅ, लिटर, बाटल्या', noItems: 'कोणतेही यादी आयटम नाही।',
      addFirst: 'आपले घटक ट्रॅक करणे सुरू करा।'
    },
    analytics: {
      title: 'विश्लेषण', totalRevenue: 'एकूण महसूल', totalOrders: 'एकूण ऑर्डर',
      avgOrderValue: 'सरासरी ऑर्डर मूल्य', today: 'आज', thisWeek: 'या आठवड्यात',
      thisMonth: 'या महिन्यात', topItems: 'शीर्ष आयटम', tablePerformance: 'टेबल कामगिरी',
      peakHours: 'पीक तास', revenueOverTime: 'वेळानुसार महसूल',
      noData: 'या कालावधीसाठी डेटा नाही', orders: 'ऑर्डर', revenue: 'महसूल',
      table: 'टेबल', item: 'आयटम', count: 'संख्या', hour: 'तास',
      downloadReport: 'अहवाल डाउनलोड करा', refreshData: 'डेटा रीफ्रेश करा'
    },
    customer: {
      selectLang: 'भाषा निवडा', continueMenu: 'मेनू पहा',
      skipBrowse: 'फक्त ब्राउज़ करा', enterDetails: 'चला सुरू करूया!',
      optionalDetails: 'वैयक्तिक अनुभवासाठी आपली माहिती द्या।',
      yourName: 'आपले नाव', phoneNumber: 'फोन नंबर', optional: 'पर्यायी',
      addToCart: 'कार्टमध्ये जोडा', viewCart: 'कार्ट पहा', placeOrder: 'ऑर्डर करा',
      placing: 'ऑर्डर होत आहे...', yourCart: 'आपली कार्ट', items: 'आयटम',
      orderPlaced: 'ऑर्डर झाला!', orderSentKitchen: 'आपला ऑर्डर स्वयंपाकघरात पाठवला गेला।',
      orderId: 'ऑर्डर ID', orderMore: 'आणखी ऑर्डर करा', specialInstructions: 'विशेष सूचना',
      goesWith: 'याच्यासोबत चांगले...', forYou: '⭐ तुमच्यासाठी', total: 'एकूण',
      billSummary: 'बिल सारांश', scanOrder: 'मेनू पाहण्यासाठी स्कॅन करा',
      poweredBy: 'QRunch द्वारे चालवलेले', welcomeBack: 'परत आलात',
      returnMenu: 'मेनूवर परत जात आहे', emptyCart: 'तुमची कार्ट रिकामी आहे',
      browseMenu: 'मेनू पहा', yourDetails: 'तुमची माहिती', reorderNote: 'फक्त ऑर्डर अपडेटसाठी।',
      remove: 'काढा', noMenu: 'मेनू तयार होत आहे।'
    }
  },

  gu: {
    nav: { dashboard:'ડૅશબોર્ડ', menu:'મેનૂ બિલ્ડર', tables:'ટેબલ અને QR', orders:'ઓર્ડર', analytics:'વિશ્લેષણ', inventory:'ઇન્વેન્ટરી', staff:'સ્ટાફ', soon:'ટૂંક સમયમાં' },
    common: { add:'ઉમેરો', edit:'સંપાદિત કરો', delete:'કાઢો', save:'સાચવો', cancel:'રદ કરો', update:'અપડેટ કરો', logout:'લૉગ આઉટ', loading:'લોડ થઈ રહ્યું છે...', available:'ઉપલબ્ધ', unavailable:'અનુપલબ્ધ', exportCSV:'CSV નિકાસ કરો', refresh:'રીફ્રેશ', apply:'લાગુ કરો', confirm:'પુષ્ટિ કરો', close:'બંધ', search:'શોધો', noResults:'કોઈ પરિણામ નથી' },
    menu: { title:'મેનૂ બિલ્ડર', addCategory:'શ્રેણી ઉમેરો', editCategory:'શ્રેણી સંપાદિત કરો', addItem:'+ વ્યંજન ઉમેરો', editItem:'વ્યંજન સંપાદિત કરો', itemName:'વ્યંજનનું નામ', itemNamePlaceholder:'દા.ત. પનીર ટિક્કા', description:'વર્ણન', descPlaceholder:'તમારા વ્યંજનનું વર્ણન કરો...', price:'કિંમત', photo:'ફોટો', uploadPhoto:'ફોટો અપલોડ કરો', generateDesc:'AI સાથે બનાવો', generatingDesc:'બનાવી રહ્યા છીએ...', suggestTags:'AI સૂચન', suggestingTags:'સૂચન...', generateImage:'AI ઇમેજ', generatingImage:'ઇમેજ...', dietaryTags:'આહાર ટૅગ', modifiers:'ફેરફારો', addGroup:'+ ગ્રૂપ', addOption:'+ વિકલ્પ', groupName:'ગ્રૂપ નામ', optionLabel:'વિકલ્પ', extraPrice:'+કિંમત', noCategories:'કોઈ શ્રેણી નથી', noItems:'કોઈ વ્યંજન નથી', categoryPlaceholder:'દા.ત. સ્ટાર્ટર, મુખ્ય', aiSuggestedTags:'AI સૂચન', canDeselect:'નીચે અનસ્લિક્ટ કરો', imageNote:'60 સેકન્ડ લાગી શકે', selectCategory:'શ્રેણી પસંદ કરો', startWithCategory:'શ્રેણી ઉમેરો' },
    inventory: { title:'ઇન્વેન્ટરી', addItem:'+ ઉમેરો', editItem:'સંપાદિત', bulkEdit:'બલ્ક સંપાદન', cancelBulk:'રદ', saveAll:'સાચવો', allItems:'બધા', lowStock:'ઓછો સ્ટૉક', outOfStock:'સ્ટૉક ખૂટ્યો', unlimited:'અમર્યાદિત', inStock:'સ્ટૉકમાં', quantity:'જથ્થો', unit:'એકમ', alertThreshold:'અલર્ટ સીમા', alertWhen:'≤ ત્યારે', emailAlertSent:'ઈ-મેઈલ', helpText:'અમર્યાદિત માટે ખાલી. 0 = ઓટો-હાઇડ', itemName:'નામ', itemNamePlaceholder:'ચિકન, બટાટા, તેલ', unitPlaceholder:'kg, litre, bottles', noItems:'કોઈ ઇન્વેન્ટરી નથી', addFirst:'ટ્રૅક કરવાનું શરૂ કરો.' },
    analytics: { title:'વિશ્લેષણ', totalRevenue:'કુલ આવક', totalOrders:'કુલ ઓર્ડર', avgOrderValue:'સરેરાશ', today:'આજ', thisWeek:'આ સપ્તાહ', thisMonth:'આ મહિને', topItems:'ટૉપ', tablePerformance:'ટેબલ', peakHours:'પીક', revenueOverTime:'આવક', noData:'ડેટા નથી', orders:'ઓર્ડર', revenue:'આવક', table:'ટેબલ', item:'વ્યંજન', count:'સંખ્યા', hour:'કલાક', downloadReport:'ડાઉનલોડ', refreshData:'રીફ્રેશ' },
    customer: { selectLang:'ભાષા પસંદ કરો', continueMenu:'મેનૂ', skipBrowse:'ફક્ત જૂઓ', enterDetails:'ચાલો!', optionalDetails:'વ્યક્તિગત અનુભવ.', yourName:'નામ', phoneNumber:'ફોન', optional:'વૈકલ્પિક', addToCart:'કાર્ટ', viewCart:'કાર્ટ', placeOrder:'ઓર્ડર', placing:'ઓર્ડર...', yourCart:'કાર્ટ', items:'આઇટમ', orderPlaced:'ઓર્ડર!', orderSentKitchen:'રસોઈ ગઈ.', orderId:'ID', orderMore:'વધુ', specialInstructions:'સૂચના', goesWith:'સાથે...', forYou:'⭐ તમારા', total:'કુલ', billSummary:'બિલ', scanOrder:'સ્કૅન', poweredBy:'QRunch', welcomeBack:'સ્વાગત', returnMenu:'પાછું', emptyCart:'ખાલી', browseMenu:'મેનૂ', yourDetails:'માહિતી', reorderNote:'ઓર્ડર.', remove:'કાઢો', noMenu:'મેનૂ...' }
  },

  ta: {
    nav: { dashboard:'டாஷ்போர்டு', menu:'மெனு', tables:'அட்டவணைகள்', orders:'ஆர்டர்கள்', analytics:'பகுப்பாய்வு', inventory:'சரக்கு', staff:'ஊழியர்கள்', soon:'விரைவில்' },
    common: { add:'சேர்', edit:'திருத்து', delete:'நீக்கு', save:'சேமி', cancel:'ரத்து', update:'புதுப்பி', logout:'வெளியேறு', loading:'ஏற்றுகிறது...', available:'கிடைக்கிறது', unavailable:'கிடைக்கவில்லை', exportCSV:'CSV ஏற்றுமதி', refresh:'புதுப்பி', apply:'பயன்படுத்து', confirm:'உறுதிப்படுத்து', close:'மூடு', search:'தேடு', noResults:'முடிவுகள் இல்லை' },
    menu: { title:'மெனு', addCategory:'வகை சேர்', editCategory:'வகை திருத்து', addItem:'+ உணவு சேர்', editItem:'திருத்து', itemName:'பெயர்', itemNamePlaceholder:'உ.வா. பனீர் டிக்கா', description:'விவரிப்பு', descPlaceholder:'விவரிக்கவும்...', price:'விலை', photo:'புகைப்படம்', uploadPhoto:'புகைப்படம் பதிவேற்று', generateDesc:'AI உருவாக்கு', generatingDesc:'உருவாக்குகிறது...', suggestTags:'AI பரிந்துரை', suggestingTags:'பரிந்துரைக்கிறது...', generateImage:'AI படம்', generatingImage:'படம்...', dietaryTags:'உணவு குறிச்சொற்கள்', modifiers:'மாற்றங்கள்', addGroup:'+ குழு', addOption:'+ விருப்பம்', groupName:'குழு பெயர்', optionLabel:'விருப்பம்', extraPrice:'+விலை', noCategories:'வகைகள் இல்லை', noItems:'உணவுகள் இல்லை', categoryPlaceholder:'உ.வா. மதிய உணவு', aiSuggestedTags:'AI பரிந்துரை', canDeselect:'கீழே நீக்கலாம்', imageNote:'60 வினாடிகள்', selectCategory:'வகை தேர்ந்தெடு', startWithCategory:'வகை சேர்க்கவும்' },
    inventory: { title:'சரக்கு', addItem:'+ சேர்', editItem:'திருத்து', bulkEdit:'மொத்த திருத்து', cancelBulk:'ரத்து', saveAll:'சேமி', allItems:'அனைத்தும்', lowStock:'குறைந்த சரக்கு', outOfStock:'சரக்கு இல்லை', unlimited:'வரம்பற்ற', inStock:'சரக்கில்', quantity:'அளவு', unit:'அலகு', alertThreshold:'எச்சரிக்கை', alertWhen:'≤ போது', emailAlertSent:'மின்னஞ்சல்', helpText:'வெற்று = வரம்பற்ற. 0 = மறை', itemName:'பெயர்', itemNamePlaceholder:'கோழி, உருளை, எண்ணெய்', unitPlaceholder:'கிலோ, லிட்டர்', noItems:'சரக்கு இல்லை', addFirst:'கண்காணிக்க தொடங்கு' },
    analytics: { title:'பகுப்பாய்வு', totalRevenue:'மொத்த வருவாய்', totalOrders:'மொத்த ஆர்டர்', avgOrderValue:'சராசரி', today:'இன்று', thisWeek:'இந்த வாரம்', thisMonth:'இந்த மாதம்', topItems:'சிறந்த', tablePerformance:'அட்டவணை', peakHours:'பரபரப்பு நேரம்', revenueOverTime:'வருவாய்', noData:'தரவு இல்லை', orders:'ஆர்டர்', revenue:'வருவாய்', table:'அட்டவணை', item:'உணவு', count:'எண்ணிக்கை', hour:'மணி', downloadReport:'தரவிறக்கு', refreshData:'புதுப்பி' },
    customer: { selectLang:'மொழி தேர்ந்தெடு', continueMenu:'மெனு', skipBrowse:'பார்க்க', enterDetails:'தொடரலாம்!', optionalDetails:'தனிப்பட்ட அனுபவம்.', yourName:'பெயர்', phoneNumber:'தொலைபேசி', optional:'விருப்பமான', addToCart:'கார்ட்', viewCart:'கார்ட்', placeOrder:'ஆர்டர்', placing:'ஆர்டர்...', yourCart:'கார்ட்', items:'பொருட்கள்', orderPlaced:'ஆர்டர் ஆனது!', orderSentKitchen:'சமையலறைக்கு அனுப்பினோம்.', orderId:'ID', orderMore:'மேலும்', specialInstructions:'சிறப்பு', goesWith:'சேர்ந்து...', forYou:'⭐ உங்களுக்கு', total:'மொத்தம்', billSummary:'பில்', scanOrder:'ஸ்கேன்', poweredBy:'QRunch', welcomeBack:'வரவேற்கிறோம்', returnMenu:'திரும்புகிறது', emptyCart:'காலி', browseMenu:'மெனு', yourDetails:'விவரங்கள்', reorderNote:'ஆர்டர்.', remove:'நீக்கு', noMenu:'மெனு...' }
  },

  te: {
    nav: { dashboard:'డాష్‌బోర్డ్', menu:'మెనూ', tables:'టేబుళ్ళు', orders:'ఆర్డర్లు', analytics:'విశ్లేషణ', inventory:'జాబితా', staff:'సిబ్బంది', soon:'త్వరలో' },
    common: { add:'జోడించు', edit:'సవరించు', delete:'తొలగించు', save:'సేవ్', cancel:'రద్దు', update:'అప్‌డేట్', logout:'లాగ్‌అవుట్', loading:'లోడ్...', available:'అందుబాటులో', unavailable:'లేదు', exportCSV:'CSV', refresh:'రీఫ్రెష్', apply:'వర్తించు', confirm:'నిర్ధారించు', close:'మూసివేయి', search:'వెతుకు', noResults:'ఫలితాలు లేవు' },
    menu: { title:'మెనూ', addCategory:'వర్గం జోడించు', editCategory:'వర్గం సవరించు', addItem:'+ ఆహారం జోడించు', editItem:'సవరించు', itemName:'పేరు', itemNamePlaceholder:'ఉదా. పనీర్ టిక్కా', description:'వివరణ', descPlaceholder:'వివరించండి...', price:'ధర', photo:'ఫోటో', uploadPhoto:'అప్‌లోడ్', generateDesc:'AI', generatingDesc:'తయారు...', suggestTags:'AI సూచన', suggestingTags:'సూచిస్తోంది...', generateImage:'AI చిత్రం', generatingImage:'చిత్రం...', dietaryTags:'ఆహార ట్యాగ్లు', modifiers:'మార్పులు', addGroup:'+ గ్రూప్', addOption:'+ ఎంపిక', groupName:'గ్రూప్ పేరు', optionLabel:'ఎంపిక', extraPrice:'+ధర', noCategories:'వర్గాలు లేవు', noItems:'ఆహారాలు లేవు', categoryPlaceholder:'ఉదా. స్టార్టర్', aiSuggestedTags:'AI', canDeselect:'క్రింద తొలగించు', imageNote:'60 సెకన్లు', selectCategory:'వర్గం ఎంచుకో', startWithCategory:'వర్గం జోడించు' },
    inventory: { title:'జాబితా', addItem:'+ జోడించు', editItem:'సవరించు', bulkEdit:'మొత్తం', cancelBulk:'రద్దు', saveAll:'సేవ్', allItems:'అన్నీ', lowStock:'తక్కువ', outOfStock:'లేదు', unlimited:'అపరిమిత', inStock:'ఉంది', quantity:'పరిమాణం', unit:'యూనిట్', alertThreshold:'హెచ్చరిక', alertWhen:'≤', emailAlertSent:'ఇమెయిల్', helpText:'ఖాళీ = అపరిమిత. 0 = దాచు', itemName:'పేరు', itemNamePlaceholder:'చికెన్, ఆలుగడ్డ', unitPlaceholder:'కిలో, లీటర్', noItems:'జాబితా లేదు', addFirst:'ట్రాక్ చేయండి' },
    analytics: { title:'విశ్లేషణ', totalRevenue:'మొత్తం ఆదాయం', totalOrders:'మొత్తం', avgOrderValue:'సగటు', today:'ఈరోజు', thisWeek:'ఈ వారం', thisMonth:'ఈ నెల', topItems:'టాప్', tablePerformance:'టేబుల్', peakHours:'గరిష్ట సమయం', revenueOverTime:'ఆదాయం', noData:'డేటా లేదు', orders:'ఆర్డర్లు', revenue:'ఆదాయం', table:'టేబుల్', item:'ఆహారం', count:'సంఖ్య', hour:'గంట', downloadReport:'డౌన్‌లోడ్', refreshData:'రీఫ్రెష్' },
    customer: { selectLang:'భాష ఎంచుకో', continueMenu:'మెనూ', skipBrowse:'చూడు', enterDetails:'వెళ్దాం!', optionalDetails:'వ్యక్తిగత అనుభవం.', yourName:'పేరు', phoneNumber:'ఫోన్', optional:'ఐచ్ఛికం', addToCart:'కార్ట్', viewCart:'కార్ట్', placeOrder:'ఆర్డర్', placing:'ఆర్డర్...', yourCart:'కార్ట్', items:'వస్తువులు', orderPlaced:'ఆర్డర్!', orderSentKitchen:'వంటగదికి వెళ్ళింది.', orderId:'ID', orderMore:'మరింత', specialInstructions:'సూచనలు', goesWith:'పాటు...', forYou:'⭐ మీకు', total:'మొత్తం', billSummary:'బిల్', scanOrder:'స్కాన్', poweredBy:'QRunch', welcomeBack:'స్వాగతం', returnMenu:'తిరిగి', emptyCart:'ఖాళీ', browseMenu:'మెనూ', yourDetails:'వివరాలు', reorderNote:'ఆర్డర్.', remove:'తొలగించు', noMenu:'మెనూ...' }
  },

  ml: {
    nav: { dashboard:'ഡാഷ്‌ബോർഡ്', menu:'മെനു', tables:'ടേബിളുകൾ', orders:'ഓർഡറുകൾ', analytics:'വിശകലനം', inventory:'ഇൻവെന്ററി', staff:'സ്റ്റാഫ്', soon:'ഉടൻ' },
    common: { add:'ചേർക്കുക', edit:'എഡിറ്റ്', delete:'ഇല്ലാതാക്കുക', save:'സേവ്', cancel:'റദ്ദ്', update:'അപ്‌ഡേറ്റ്', logout:'ലോഗ്ഔട്ട്', loading:'ലോഡ്...', available:'ലഭ്യം', unavailable:'ലഭ്യമല്ല', exportCSV:'CSV', refresh:'പുതുക്കുക', apply:'പ്രയോഗിക്കുക', confirm:'സ്ഥിരീകരിക്കുക', close:'അടയ്ക്കുക', search:'തിരയുക', noResults:'ഫലങ്ങൾ ഇല്ല' },
    menu: { title:'മെനു', addCategory:'വിഭാഗം', editCategory:'എഡിറ്റ്', addItem:'+ ഭക്ഷണം', editItem:'എഡിറ്റ്', itemName:'പേര്', itemNamePlaceholder:'ഉദാ. പനീർ ടിക്ക', description:'വിവരണം', descPlaceholder:'വിവരിക്കുക...', price:'വില', photo:'ഫോട്ടോ', uploadPhoto:'അപ്‌ലോഡ്', generateDesc:'AI', generatingDesc:'...', suggestTags:'AI', suggestingTags:'...', generateImage:'AI ചിത്രം', generatingImage:'...', dietaryTags:'ടാഗുകൾ', modifiers:'മാറ്റങ്ങൾ', addGroup:'+ ഗ്രൂപ്പ്', addOption:'+ ഓപ്‌ഷൻ', groupName:'ഗ്രൂപ്പ്', optionLabel:'ഓപ്‌ഷൻ', extraPrice:'+വില', noCategories:'ഇല്ല', noItems:'ഇല്ല', categoryPlaceholder:'ഉദാ. സ്റ്റാർട്ടർ', aiSuggestedTags:'AI', canDeselect:'നീക്കാം', imageNote:'60 സെക്കൻഡ്', selectCategory:'തിരഞ്ഞെടുക്കുക', startWithCategory:'ചേർക്കുക' },
    inventory: { title:'ഇൻവെന്ററി', addItem:'+ ചേർക്കുക', editItem:'എഡിറ്റ്', bulkEdit:'ബൾക്ക്', cancelBulk:'റദ്ദ്', saveAll:'സേവ്', allItems:'എല്ലാം', lowStock:'കുറവ്', outOfStock:'ഇല്ല', unlimited:'പരിധിയില്ല', inStock:'ഉണ്ട്', quantity:'അളവ്', unit:'യൂണിറ്റ്', alertThreshold:'അലർട്ട്', alertWhen:'≤', emailAlertSent:'ഇമെയിൽ', helpText:'ഒഴിഞ്ഞ് = പരിധിയില്ല. 0 = മറക്കുക', itemName:'പേര്', itemNamePlaceholder:'ചിക്കൻ, ഉരുളക്കിഴങ്ങ്', unitPlaceholder:'കിലോ, ലിറ്റർ', noItems:'ഇൻവെന്ററി ഇല്ല', addFirst:'ട്രാക്ക് ചെയ്യൂ' },
    analytics: { title:'വിശകലനം', totalRevenue:'വരുമാനം', totalOrders:'ഓർഡറുകൾ', avgOrderValue:'ശരാശരി', today:'ഇന്ന്', thisWeek:'ഈ ആഴ്ച', thisMonth:'ഈ മാസം', topItems:'മികച്ചത്', tablePerformance:'ടേബിൾ', peakHours:'പീക്ക്', revenueOverTime:'വരുമാനം', noData:'ഡാറ്റ ഇല്ല', orders:'ഓർഡർ', revenue:'വരുമാനം', table:'ടേബിൾ', item:'ഭക്ഷണം', count:'എണ്ണം', hour:'മണിക്കൂർ', downloadReport:'ഡൗൺലോഡ്', refreshData:'പുതുക്കുക' },
    customer: { selectLang:'ഭാഷ തിരഞ്ഞെടുക്കുക', continueMenu:'മെനു', skipBrowse:'കാണുക', enterDetails:'പോകാം!', optionalDetails:'വ്യക്തിഗത.', yourName:'പേര്', phoneNumber:'ഫോൺ', optional:'ഐച്ഛികം', addToCart:'കാർട്ട്', viewCart:'കാർട്ട്', placeOrder:'ഓർഡർ', placing:'...', yourCart:'കാർട്ട്', items:'ഇനങ്ങൾ', orderPlaced:'ഓർഡർ!', orderSentKitchen:'അടുക്കളയിലേക്ക്.', orderId:'ID', orderMore:'കൂടുതൽ', specialInstructions:'നിർദ്ദേശം', goesWith:'കൂടെ...', forYou:'⭐ നിങ്ങൾക്ക്', total:'മൊത്തം', billSummary:'ബിൽ', scanOrder:'സ്കാൻ', poweredBy:'QRunch', welcomeBack:'സ്വാഗതം', returnMenu:'തിരിച്ച്', emptyCart:'ശൂന്യം', browseMenu:'മെനു', yourDetails:'വിവരങ്ങൾ', reorderNote:'ഓർഡർ.', remove:'നീക്കം', noMenu:'...' }
  },

  kn: {
    nav: { dashboard:'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', menu:'ಮೆನು', tables:'ಟೇಬಲ್ಗಳು', orders:'ಆರ್ಡರ್‌ಗಳು', analytics:'ವಿಶ್ಲೇಷಣೆ', inventory:'ದಾಸ್ತಾನು', staff:'ಸಿಬ್ಬಂದಿ', soon:'ಶೀಘ್ರದಲ್ಲಿ' },
    common: { add:'ಸೇರಿಸಿ', edit:'ಸಂಪಾದಿಸಿ', delete:'ಅಳಿಸಿ', save:'ಉಳಿಸಿ', cancel:'ರದ್ದು', update:'ನವೀಕರಿಸಿ', logout:'ಲಾಗ್‌ಔಟ್', loading:'ಲೋಡ್...', available:'ಲಭ್ಯ', unavailable:'ಲಭ್ಯವಿಲ್ಲ', exportCSV:'CSV', refresh:'ರಿಫ್ರೆಶ್', apply:'ಅನ್ವಯಿಸಿ', confirm:'ದೃಢೀಕರಿಸಿ', close:'ಮುಚ್ಚಿ', search:'ಹುಡುಕಿ', noResults:'ಫಲಿತಾಂಶಗಳಿಲ್ಲ' },
    menu: { title:'ಮೆನು', addCategory:'ವರ್ಗ', editCategory:'ಸಂಪಾದಿಸಿ', addItem:'+ ಆಹಾರ', editItem:'ಸಂಪಾದಿಸಿ', itemName:'ಹೆಸರು', itemNamePlaceholder:'ಉದಾ. ಪನೀರ್ ಟಿಕ್ಕಾ', description:'ವಿವರ', descPlaceholder:'ವಿವರಿಸಿ...', price:'ಬೆಲೆ', photo:'ಫೋಟೋ', uploadPhoto:'ಅಪ್‌ಲೋಡ್', generateDesc:'AI', generatingDesc:'...', suggestTags:'AI', suggestingTags:'...', generateImage:'AI ಚಿತ್ರ', generatingImage:'...', dietaryTags:'ಟ್ಯಾಗ್‌ಗಳು', modifiers:'ಬದಲಾವಣೆಗಳು', addGroup:'+ ಗ್ರೂಪ್', addOption:'+ ಆಯ್ಕೆ', groupName:'ಗ್ರೂಪ್', optionLabel:'ಆಯ್ಕೆ', extraPrice:'+ಬೆಲೆ', noCategories:'ಇಲ್ಲ', noItems:'ಇಲ್ಲ', categoryPlaceholder:'ಉದಾ. ಸ್ಟಾರ್ಟರ್', aiSuggestedTags:'AI', canDeselect:'ತೆಗೆದುಹಾಕಿ', imageNote:'60 ಸೆಕೆಂಡ್', selectCategory:'ಆಯ್ಕೆಮಾಡಿ', startWithCategory:'ಸೇರಿಸಿ' },
    inventory: { title:'ದಾಸ್ತಾನು', addItem:'+ ಸೇರಿಸಿ', editItem:'ಸಂಪಾದಿಸಿ', bulkEdit:'ಬಲ್ಕ್', cancelBulk:'ರದ್ದು', saveAll:'ಉಳಿಸಿ', allItems:'ಎಲ್ಲಾ', lowStock:'ಕಡಿಮೆ', outOfStock:'ಇಲ್ಲ', unlimited:'ಅಮಿತ', inStock:'ಇದೆ', quantity:'ಪ್ರಮಾಣ', unit:'ಘಟಕ', alertThreshold:'ಎಚ್ಚರಿಕೆ', alertWhen:'≤', emailAlertSent:'ಇಮೇಲ್', helpText:'ಖಾಲಿ = ಅಮಿತ', itemName:'ಹೆಸರು', itemNamePlaceholder:'ಚಿಕನ್, ಆಲೂ', unitPlaceholder:'ಕಿಲೋ, ಲೀಟರ್', noItems:'ದಾಸ್ತಾನು ಇಲ್ಲ', addFirst:'ಟ್ರ್ಯಾಕ್ ಮಾಡಿ' },
    analytics: { title:'ವಿಶ್ಲೇಷಣೆ', totalRevenue:'ಒಟ್ಟು', totalOrders:'ಆರ್ಡರ್', avgOrderValue:'ಸರಾಸರಿ', today:'ಇಂದು', thisWeek:'ಈ ವಾರ', thisMonth:'ಈ ತಿಂಗಳು', topItems:'ಟಾಪ್', tablePerformance:'ಟೇಬಲ್', peakHours:'ಪೀಕ್', revenueOverTime:'ಆದಾಯ', noData:'ಡೇಟಾ ಇಲ್ಲ', orders:'ಆರ್ಡರ್', revenue:'ಆದಾಯ', table:'ಟೇಬಲ್', item:'ಆಹಾರ', count:'ಸಂಖ್ಯೆ', hour:'ಗಂಟೆ', downloadReport:'ಡೌನ್‌ಲೋಡ್', refreshData:'ರಿಫ್ರೆಶ್' },
    customer: { selectLang:'ಭಾಷೆ ಆಯ್ಕೆ', continueMenu:'ಮೆನು', skipBrowse:'ನೋಡಿ', enterDetails:'ಹೋಗೋಣ!', optionalDetails:'ವೈಯಕ್ತಿಕ.', yourName:'ಹೆಸರು', phoneNumber:'ಫೋನ್', optional:'ಐಚ್ಛಿಕ', addToCart:'ಕಾರ್ಟ್', viewCart:'ಕಾರ್ಟ್', placeOrder:'ಆರ್ಡರ್', placing:'...', yourCart:'ಕಾರ್ಟ್', items:'ಐಟಂಗಳು', orderPlaced:'ಆರ್ಡರ್!', orderSentKitchen:'ಅಡುಗೆಮನೆಗೆ.', orderId:'ID', orderMore:'ಹೆಚ್ಚು', specialInstructions:'ಸೂಚನೆ', goesWith:'ಜೊತೆ...', forYou:'⭐ ನಿಮಗಾಗಿ', total:'ಒಟ್ಟು', billSummary:'ಬಿಲ್', scanOrder:'ಸ್ಕ್ಯಾನ್', poweredBy:'QRunch', welcomeBack:'ಸ್ವಾಗತ', returnMenu:'ಹಿಂದಿರುಗಿ', emptyCart:'ಖಾಲಿ', browseMenu:'ಮೆನು', yourDetails:'ವಿವರಗಳು', reorderNote:'ಆರ್ಡರ್.', remove:'ತೆಗೆ', noMenu:'...' }
  },

  bn: {
    nav: { dashboard:'ড্যাশবোর্ড', menu:'মেনু', tables:'টেবিল', orders:'অর্ডার', analytics:'বিশ্লেষণ', inventory:'ইনভেন্টরি', staff:'কর্মী', soon:'শীঘ্রই' },
    common: { add:'যোগ করুন', edit:'সম্পাদনা', delete:'মুছুন', save:'সংরক্ষণ', cancel:'বাতিল', update:'আপডেট', logout:'লগআউট', loading:'লোড...', available:'পাওয়া যাচ্ছে', unavailable:'নেই', exportCSV:'CSV', refresh:'রিফ্রেশ', apply:'প্রয়োগ', confirm:'নিশ্চিত', close:'বন্ধ', search:'খুঁজুন', noResults:'ফলাফল নেই' },
    menu: { title:'মেনু', addCategory:'বিভাগ', editCategory:'সম্পাদনা', addItem:'+ খাবার', editItem:'সম্পাদনা', itemName:'নাম', itemNamePlaceholder:'যেমন পনির টিক্কা', description:'বিবরণ', descPlaceholder:'বর্ণনা...', price:'মূল্য', photo:'ছবি', uploadPhoto:'আপলোড', generateDesc:'AI', generatingDesc:'...', suggestTags:'AI', suggestingTags:'...', generateImage:'AI ছবি', generatingImage:'...', dietaryTags:'ট্যাগ', modifiers:'পরিবর্তন', addGroup:'+ গ্রুপ', addOption:'+ বিকল্প', groupName:'গ্রুপ', optionLabel:'বিকল্প', extraPrice:'+মূল্য', noCategories:'নেই', noItems:'নেই', categoryPlaceholder:'যেমন স্টার্টার', aiSuggestedTags:'AI', canDeselect:'সরান', imageNote:'৬০ সেকেন্ড', selectCategory:'নির্বাচন', startWithCategory:'যোগ করুন' },
    inventory: { title:'ইনভেন্টরি', addItem:'+ যোগ', editItem:'সম্পাদনা', bulkEdit:'বাল্ক', cancelBulk:'বাতিল', saveAll:'সংরক্ষণ', allItems:'সব', lowStock:'কম', outOfStock:'নেই', unlimited:'সীমাহীন', inStock:'আছে', quantity:'পরিমাণ', unit:'একক', alertThreshold:'সতর্কতা', alertWhen:'≤', emailAlertSent:'ইমেইল', helpText:'ফাঁকা = সীমাহীন', itemName:'নাম', itemNamePlaceholder:'মুরগি, আলু', unitPlaceholder:'কেজি, লিটার', noItems:'নেই', addFirst:'ট্র্যাক করুন' },
    analytics: { title:'বিশ্লেষণ', totalRevenue:'মোট', totalOrders:'অর্ডার', avgOrderValue:'গড়', today:'আজ', thisWeek:'এ সপ্তাহ', thisMonth:'এ মাস', topItems:'সেরা', tablePerformance:'টেবিল', peakHours:'পিক', revenueOverTime:'আয়', noData:'ডেটা নেই', orders:'অর্ডার', revenue:'আয়', table:'টেবিল', item:'খাবার', count:'সংখ্যা', hour:'ঘণ্টা', downloadReport:'ডাউনলোড', refreshData:'রিফ্রেশ' },
    customer: { selectLang:'ভাষা বেছে নিন', continueMenu:'মেনু', skipBrowse:'দেখুন', enterDetails:'চলুন!', optionalDetails:'ব্যক্তিগত.', yourName:'নাম', phoneNumber:'ফোন', optional:'ঐচ্ছিক', addToCart:'কার্ট', viewCart:'কার্ট', placeOrder:'অর্ডার', placing:'...', yourCart:'কার্ট', items:'আইটেম', orderPlaced:'অর্ডার!', orderSentKitchen:'রান্নাঘরে গেছে.', orderId:'ID', orderMore:'আরো', specialInstructions:'নির্দেশ', goesWith:'সাথে...', forYou:'⭐ আপনার', total:'মোট', billSummary:'বিল', scanOrder:'স্ক্যান', poweredBy:'QRunch', welcomeBack:'স্বাগত', returnMenu:'ফিরে', emptyCart:'খালি', browseMenu:'মেনু', yourDetails:'তথ্য', reorderNote:'অর্ডার.', remove:'সরান', noMenu:'...' }
  },

  pa: {
    nav: { dashboard:'ਡੈਸ਼ਬੋਰਡ', menu:'ਮੀਨੂ', tables:'ਟੇਬਲ', orders:'ਆਰਡਰ', analytics:'ਵਿਸ਼ਲੇਸ਼ਣ', inventory:'ਸੂਚੀ', staff:'ਸਟਾਫ਼', soon:'ਜਲਦ' },
    common: { add:'ਜੋੜੋ', edit:'ਸੋਧੋ', delete:'ਮਿਟਾਓ', save:'ਸੇਵ', cancel:'ਰੱਦ', update:'ਅਪਡੇਟ', logout:'ਲੌਗਆਉਟ', loading:'ਲੋਡ...', available:'ਉਪਲਬਧ', unavailable:'ਨਹੀਂ', exportCSV:'CSV', refresh:'ਤਾਜ਼ਾ', apply:'ਲਾਗੂ', confirm:'ਪੁਸ਼ਟੀ', close:'ਬੰਦ', search:'ਖੋਜੋ', noResults:'ਕੋਈ ਨਤੀਜਾ ਨਹੀਂ' },
    menu: { title:'ਮੀਨੂ', addCategory:'ਸ਼੍ਰੇਣੀ', editCategory:'ਸੋਧੋ', addItem:'+ ਖਾਣਾ', editItem:'ਸੋਧੋ', itemName:'ਨਾਮ', itemNamePlaceholder:'ਜਿਵੇਂ ਪਨੀਰ ਟਿੱਕਾ', description:'ਵੇਰਵਾ', descPlaceholder:'ਦੱਸੋ...', price:'ਕੀਮਤ', photo:'ਫੋਟੋ', uploadPhoto:'ਅਪਲੋਡ', generateDesc:'AI', generatingDesc:'...', suggestTags:'AI', suggestingTags:'...', generateImage:'AI ਤਸਵੀਰ', generatingImage:'...', dietaryTags:'ਟੈਗ', modifiers:'ਬਦਲਾਅ', addGroup:'+ ਗਰੁੱਪ', addOption:'+ ਵਿਕਲਪ', groupName:'ਗਰੁੱਪ', optionLabel:'ਵਿਕਲਪ', extraPrice:'+ਕੀਮਤ', noCategories:'ਨਹੀਂ', noItems:'ਨਹੀਂ', categoryPlaceholder:'ਜਿਵੇਂ ਸਟਾਰਟਰ', aiSuggestedTags:'AI', canDeselect:'ਹਟਾਓ', imageNote:'60 ਸਕਿੰਟ', selectCategory:'ਚੁਣੋ', startWithCategory:'ਜੋੜੋ' },
    inventory: { title:'ਸੂਚੀ', addItem:'+ ਜੋੜੋ', editItem:'ਸੋਧੋ', bulkEdit:'ਬਲਕ', cancelBulk:'ਰੱਦ', saveAll:'ਸੇਵ', allItems:'ਸਭ', lowStock:'ਘੱਟ', outOfStock:'ਨਹੀਂ', unlimited:'ਅਸੀਮਿਤ', inStock:'ਹੈ', quantity:'ਮਾਤਰਾ', unit:'ਇਕਾਈ', alertThreshold:'ਚੇਤਾਵਨੀ', alertWhen:'≤', emailAlertSent:'ਈਮੇਲ', helpText:'ਖਾਲੀ = ਅਸੀਮਿਤ', itemName:'ਨਾਮ', itemNamePlaceholder:'ਚਿਕਨ, ਆਲੂ', unitPlaceholder:'ਕਿਲੋ, ਲੀਟਰ', noItems:'ਸੂਚੀ ਨਹੀਂ', addFirst:'ਟਰੈਕ ਕਰੋ' },
    analytics: { title:'ਵਿਸ਼ਲੇਸ਼ਣ', totalRevenue:'ਕੁੱਲ', totalOrders:'ਆਰਡਰ', avgOrderValue:'ਔਸਤ', today:'ਅੱਜ', thisWeek:'ਇਸ ਹਫ਼ਤੇ', thisMonth:'ਇਸ ਮਹੀਨੇ', topItems:'ਟਾਪ', tablePerformance:'ਟੇਬਲ', peakHours:'ਪੀਕ', revenueOverTime:'ਆਮਦਨ', noData:'ਡੇਟਾ ਨਹੀਂ', orders:'ਆਰਡਰ', revenue:'ਆਮਦਨ', table:'ਟੇਬਲ', item:'ਖਾਣਾ', count:'ਗਿਣਤੀ', hour:'ਘੰਟਾ', downloadReport:'ਡਾਊਨਲੋਡ', refreshData:'ਤਾਜ਼ਾ' },
    customer: { selectLang:'ਭਾਸ਼ਾ ਚੁਣੋ', continueMenu:'ਮੀਨੂ', skipBrowse:'ਦੇਖੋ', enterDetails:'ਚੱਲੋ!', optionalDetails:'ਨਿੱਜੀ.', yourName:'ਨਾਮ', phoneNumber:'ਫ਼ੋਨ', optional:'ਵਿਕਲਪਿਕ', addToCart:'ਕਾਰਟ', viewCart:'ਕਾਰਟ', placeOrder:'ਆਰਡਰ', placing:'...', yourCart:'ਕਾਰਟ', items:'ਆਇਟਮ', orderPlaced:'ਆਰਡਰ!', orderSentKitchen:'ਰਸੋਈ ਗਿਆ.', orderId:'ID', orderMore:'ਹੋਰ', specialInstructions:'ਹਦਾਇਤ', goesWith:'ਨਾਲ...', forYou:'⭐ ਤੁਹਾਡੇ', total:'ਕੁੱਲ', billSummary:'ਬਿੱਲ', scanOrder:'ਸਕੈਨ', poweredBy:'QRunch', welcomeBack:'ਸਵਾਗਤ', returnMenu:'ਵਾਪਸ', emptyCart:'ਖਾਲੀ', browseMenu:'ਮੀਨੂ', yourDetails:'ਜਾਣਕਾਰੀ', reorderNote:'ਆਰਡਰ.', remove:'ਹਟਾਓ', noMenu:'...' }
  }
};

const resources = Object.fromEntries(
  Object.entries(translations).map(([lang, t]) => [lang, { translation: t }])
);

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng:           localStorage.getItem('qrunch_ui_lang') || 'en',
    fallbackLng:   'en',
    interpolation: { escapeValue: false }
  });

export default i18n;