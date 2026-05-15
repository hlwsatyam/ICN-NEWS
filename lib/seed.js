import { getDb } from './db';
import { hashPassword } from './auth';
import { v4 as uuid } from 'uuid';

export const INDIAN_STATES = [
  { name: 'Delhi', districts: ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'] },
  { name: 'Maharashtra', districts: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'] },
  { name: 'Uttar Pradesh', districts: ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Noida', 'Ghaziabad'] },
  { name: 'Gujarat', districts: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'] },
  { name: 'Karnataka', districts: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubli'] },
  { name: 'Tamil Nadu', districts: ['Chennai', 'Coimbatore', 'Madurai', 'Salem'] },
  { name: 'West Bengal', districts: ['Kolkata', 'Howrah', 'Darjeeling', 'Siliguri'] },
  { name: 'Rajasthan', districts: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'] },
  { name: 'Bihar', districts: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur'] },
  { name: 'Punjab', districts: ['Amritsar', 'Ludhiana', 'Jalandhar', 'Patiala'] }
];

export const CATEGORIES = [
  { key: 'breaking', label: 'Breaking', emoji: '🚨' },
  { key: 'murder', label: 'Murder Case', emoji: '🔪' },
  { key: 'robbery', label: 'Robbery', emoji: '💰' },
  { key: 'cyber', label: 'Cyber Crime', emoji: '💻' },
  { key: 'accident', label: 'Accident', emoji: '🚗' },
  { key: 'politics', label: 'Crime & Politics', emoji: '🏛️' },
  { key: 'arrest', label: 'Arrest', emoji: '👮' },
  { key: 'court', label: 'Court Verdict', emoji: '⚖️' },
  { key: 'fraud', label: 'Fraud / Scam', emoji: '🎭' },
  { key: 'drugs', label: 'Drugs', emoji: '💊' }
];

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1637016887843-c6d136c06d74?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80',
  'https://images.unsplash.com/photo-1718592168437-8382e5b97736?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80',
  'https://images.unsplash.com/photo-1606022831434-91293aebf25a?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80',
  'https://images.unsplash.com/photo-1532077795300-c4b487f601f6?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80',
  'https://images.unsplash.com/photo-1690400524283-4e410dce7318?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80',
  'https://images.unsplash.com/photo-1541214184964-d90ddf59c88b?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80',
  'https://images.unsplash.com/photo-1526666361175-e3595627c376?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80',
  'https://images.unsplash.com/photo-1605071483252-41904a888644?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80',
  'https://images.unsplash.com/photo-1593115057322-e94b77572f20?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80',
  'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80',
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80'
];

const DEMO_NEWS = [
  { headline: 'दिल्ली में बड़ी कार्रवाई: NCR गैंग का पर्दाफाश, 12 गिरफ्तार', category: 'arrest', state: 'Delhi', district: 'New Delhi', summary: 'Delhi Police Special Cell ने NCR क्षेत्र में सक्रिय एक संगठित गिरोह का भंडाफोड़ किया है। 12 लोग गिरफ्तार, करोड़ों की लूट का माल बरामद।', content: 'दिल्ली पुलिस की स्पेशल सेल ने राष्ट्रीय राजधानी क्षेत्र में सक्रिय एक संगठित आपराधिक गिरोह का पर्दाफाश किया है। पुलिस ने 12 अपराधियों को गिरफ्तार किया है और उनके पास से करोड़ों रुपये की लूट का सामान, हथियार और नकदी बरामद की है।\n\nसूत्रों के अनुसार यह गिरोह पिछले 6 महीनों से NCR में लूट और डकैती की वारदातें कर रहा था। पुलिस को मिले इनपुट के आधार पर एक संयुक्त ऑपरेशन चलाया गया।' },
  { headline: 'Mumbai Cyber Crime: ₹4.5 करोड़ की ऑनलाइन ठगी, 3 गिरफ्तार', category: 'cyber', state: 'Maharashtra', district: 'Mumbai', summary: 'मुंबई साइबर पुलिस ने एक बड़े ऑनलाइन फ्रॉड का खुलासा किया है। मास्टरमाइंड समेत 3 साइबर अपराधी गिरफ्तार। ₹4.5 करोड़ की ठगी।', content: 'मुंबई के साइबर अपराध शाखा ने आज एक बड़े ऑनलाइन फ्रॉड रैकेट का पर्दाफाश किया है जिसने पूरे देश के निवेशकों से ₹4.5 करोड़ से अधिक की ठगी की थी।\n\nआरोपी सोशल मीडिया पर फर्जी निवेश योजनाओं का प्रचार करते थे और मोटे रिटर्न का लालच देकर लोगों को फंसाते थे। तीन मुख्य आरोपी गिरफ्तार किए गए हैं और उनके बैंक खाते सीज कर दिए गए हैं।' },
  { headline: 'Lucknow में हाई-प्रोफाइल मर्डर केस का खुलासा', category: 'murder', state: 'Uttar Pradesh', district: 'Lucknow', summary: 'राजधानी लखनऊ में हुई बहुचर्चित हत्या के मामले में पुलिस ने मुख्य आरोपी को गिरफ्तार किया है। संपत्ति विवाद बना हत्या की वजह।', content: 'लखनऊ पुलिस ने पिछले महीने हुई बहुचर्चित हत्या के मामले में मुख्य आरोपी को गिरफ्तार करने में सफलता पाई है। प्रारंभिक जांच में पता चला है कि हत्या संपत्ति विवाद के कारण की गई थी।\n\nपुलिस अधीक्षक ने बताया कि आरोपी पिछले 2 हफ्तों से फरार था। CCTV फुटेज और तकनीकी सबूतों के आधार पर उसकी पहचान हुई।' },
  { headline: 'Bengaluru Tech Park में बड़ी डकैती की कोशिश नाकाम', category: 'robbery', state: 'Karnataka', district: 'Bengaluru', summary: 'बेंगलुरु के प्रसिद्ध टेक पार्क में डकैती की कोशिश को पुलिस ने समय रहते नाकाम कर दिया। 5 बदमाश गिरफ्तार।', content: 'बेंगलुरु पुलिस ने आज सुबह एक प्रमुख टेक पार्क में डकैती की योजना बना रहे 5 बदमाशों को गिरफ्तार किया। पुलिस को मुखबिर से सूचना मिली थी जिसके आधार पर त्वरित कार्रवाई की गई।' },
  { headline: 'Ahmedabad में नशीले पदार्थों की बड़ी खेप जब्त', category: 'drugs', state: 'Gujarat', district: 'Ahmedabad', summary: 'NCB और गुजरात पुलिस की संयुक्त कार्रवाई में ₹25 करोड़ की ड्रग्स बरामद। अंतरराष्ट्रीय तस्करी रैकेट का खुलासा।', content: 'NCB और गुजरात पुलिस की संयुक्त कार्रवाई में आज अहमदाबाद से ₹25 करोड़ मूल्य के नशीले पदार्थ बरामद किए गए हैं। 4 तस्कर गिरफ्तार।' },
  { headline: 'Kolkata Court Verdict: 15 साल पुराने केस में सजा सुनाई गई', category: 'court', state: 'West Bengal', district: 'Kolkata', summary: 'कोलकाता की अदालत ने 15 साल पुराने एक हत्याकांड में अंतिम फैसला सुनाया है। मुख्य आरोपी को आजीवन कारावास।', content: 'कोलकाता सिटी सेशन्स कोर्ट ने 2010 के एक बहुचर्चित हत्याकांड में आज अपना फैसला सुनाया। मुख्य आरोपी को आजीवन कारावास की सजा सुनाई गई।' },
  { headline: 'Jaipur में करोड़ों का बैंक फ्रॉड, मैनेजर समेत 4 गिरफ्तार', category: 'fraud', state: 'Rajasthan', district: 'Jaipur', summary: 'जयपुर के एक प्रमुख बैंक में करोड़ों का फ्रॉड पकड़ा गया। बैंक मैनेजर समेत 4 लोग गिरफ्तार।', content: 'जयपुर की आर्थिक अपराध शाखा ने एक बड़े बैंक फ्रॉड का पर्दाफाश किया है। फर्जी लोन सेंक्शन कर ₹15 करोड़ का घोटाला किया गया।' },
  { headline: 'Pune-Mumbai Expressway पर बड़ा हादसा, 8 लोग घायल', category: 'accident', state: 'Maharashtra', district: 'Pune', summary: 'पुणे-मुंबई एक्सप्रेसवे पर एक भयानक सड़क हादसा हुआ है जिसमें 8 लोग गंभीर रूप से घायल हो गए हैं।', content: 'आज सुबह पुणे-मुंबई एक्सप्रेसवे पर एक टैंकर और कार के बीच हुई जोरदार टक्कर में 8 लोग घायल हुए हैं। सभी को नजदीकी अस्पताल में भर्ती कराया गया है।' }
];

export async function seedDatabase() {
  const db = await getDb();
  
  // Already seeded?
  const existing = await db.collection('users').findOne({ email: 'admin@icn.com' });
  if (existing) return { message: 'Already seeded', admin: 'admin@icn.com', password: 'admin123' };

  // Seed admin
  const adminId = uuid();
  await db.collection('users').insertOne({
    id: adminId,
    email: 'admin@icn.com',
    password: await hashPassword('admin123'),
    name: 'Admin',
    role: 'admin',
    state: 'Delhi',
    district: 'New Delhi',
    mobile: '9999999999',
    createdAt: new Date()
  });

  // Seed demo reporter
  const reporterId = uuid();
  await db.collection('users').insertOne({
    id: reporterId,
    email: 'reporter@icn.com',
    password: await hashPassword('reporter123'),
    name: 'Rajesh Kumar',
    role: 'reporter',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    mobile: '8888888888',
    designation: 'Senior Reporter',
    photo: 'https://api.dicebear.com/7.x/initials/svg?seed=Rajesh',
    walletBalance: 4500,
    referralCode: 'RAJESH001',
    createdAt: new Date()
  });

  // Seed states & districts
  for (const s of INDIAN_STATES) {
    await db.collection('states').insertOne({ id: uuid(), ...s });
  }

  // Seed categories
  for (const c of CATEGORIES) {
    await db.collection('categories').insertOne({ id: uuid(), ...c });
  }

  // Seed demo news
  for (let i = 0; i < DEMO_NEWS.length; i++) {
    const n = DEMO_NEWS[i];
    await db.collection('news').insertOne({
      id: uuid(),
      ...n,
      images: [SAMPLE_IMAGES[i % SAMPLE_IMAGES.length]],
      reporterId,
      reporterName: 'Rajesh Kumar',
      reporterPhoto: 'https://api.dicebear.com/7.x/initials/svg?seed=Rajesh',
      status: 'approved',
      views: Math.floor(Math.random() * 50000) + 1000,
      shares: Math.floor(Math.random() * 500),
      trending: Math.random() > 0.6,
      createdAt: new Date(Date.now() - i * 3600000),
      publishedAt: new Date(Date.now() - i * 3600000)
    });
  }

  // Seed breaking news
  const breakingHeadlines = [
    '🚨 Delhi: NCR गैंग का पर्दाफाश, 12 गिरफ्तार',
    '🔴 Mumbai Cyber Crime: ₹4.5 करोड़ की ठगी',
    '⚡ Lucknow: हाई-प्रोफाइल मर्डर केस सॉल्व',
    '🚔 Bengaluru: टेक पार्क में डकैती की कोशिश नाकाम',
    '💊 Ahmedabad: ₹25 करोड़ की ड्रग्स बरामद',
    '⚖️ Kolkata: 15 साल पुराने केस में फैसला',
    '💰 Jaipur: करोड़ों का बैंक फ्रॉड पकड़ा गया'
  ];
  for (const h of breakingHeadlines) {
    await db.collection('breaking').insertOne({
      id: uuid(),
      text: h,
      active: true,
      createdAt: new Date()
    });
  }

  return { message: 'Seeded successfully', admin: 'admin@icn.com / admin123', reporter: 'reporter@icn.com / reporter123' };
}
