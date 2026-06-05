import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { signToken, hashPassword, comparePassword, getAuthUser } from '@/lib/auth';
import { generateText } from '@/lib/llm';
import { seedDatabase, INDIAN_STATES, CATEGORIES } from '@/lib/seed';
import { generateNewsPDF, generateIDCardPDF, generateCertificatePDF } from '@/lib/pdf';
import { v4 as uuid } from 'uuid';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const json = (data, status = 200) => NextResponse.json(data, { status });

// Auto-seed on first request
let seeded = false;
async function ensureSeeded() {
  if (seeded) return;
  try { await seedDatabase(); seeded = true; } catch (e) { console.error('seed err', e); }
}

async function handler(request, { params }) {
  await ensureSeeded();
  const path = (params?.path || []).join('/');
  const method = request.method;
  const db = await getDb();

  try {
    // ============ AUTH ============
    if (path === 'auth/register' && method === 'POST') {
      const body = await request.json();
      const {
        email, password, name, mobile, state, district, city, pincode, village, role = 'reporter',
        referralCode: referredByCode,
        aadhaar, pan, address, bio, experience, profilePhoto, coverBanner,
        aadhaarFront, aadhaarBack,
        appliedPostId, appliedPostName, joiningType,
        socialFacebook, socialTwitter, socialInstagram, socialYoutube
      } = body;
      if (!email || !password || !name) return json({ error: 'Missing fields' }, 400);
      const exists = await db.collection('users').findOne({ email });
      if (exists) return json({ error: 'Email already registered' }, 400);

      let referredBy = null;
      if (referredByCode) {
        const referrer = await db.collection('users').findOne({ referralCode: referredByCode });
        if (referrer) referredBy = referrer.id;
      }

      const id = uuid();
      const user = {
        id, email, name, mobile,
        state, district, city: city || '', pincode: pincode || '', village: village || '',
        role,
        password: await hashPassword(password),
        designation: role === 'reporter' ? 'Reporter' : 'User',
        photo: profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        coverBanner: coverBanner || '',
        aadhaar: aadhaar || '',
        aadhaarFront: aadhaarFront || '',
        aadhaarBack: aadhaarBack || '',
        pan: pan || '',
        address: address || '',
        bio: bio || '',
        experience: experience || '',
        appliedPostId: appliedPostId || null,
        appliedPostName: appliedPostName || '',
        joiningType: joiningType || '',
        kycVerified: false,
        social: {
          facebook: socialFacebook || '',
          twitter: socialTwitter || '',
          instagram: socialInstagram || '',
          youtube: socialYoutube || ''
        },
        walletBalance: 0,
        verified: false,
        followersCount: 0,
        referralCode: name.toUpperCase().replace(/\s/g, '').slice(0, 6) + Math.floor(Math.random() * 1000),
        referredBy,
        paymentStatus: 'pending',
        createdAt: new Date()
      };
      await db.collection('users').insertOne(user);

      if (referredBy) {
        const bonus = 100;
        await db.collection('users').updateOne({ id: referredBy }, { $inc: { walletBalance: bonus } });
        await db.collection('referrals').insertOne({
          id: uuid(), referrerId: referredBy, referredUserId: id,
          referredUserName: name, bonus, status: 'credited', createdAt: new Date()
        });
      }

      const token = signToken({ id, email, role });
      const { password: _, ...safe } = user;
      return json({ token, user: safe, referralApplied: !!referredBy });
    }

    if (path === 'auth/login' && method === 'POST') {
      const { email, password } = await request.json();
      const user = await db.collection('users').findOne({ email });
      if (!user) return json({ error: 'Invalid credentials' }, 401);
      const ok = await comparePassword(password, user.password);
      if (!ok) return json({ error: 'Invalid credentials' }, 401);
      const token = signToken({ id: user.id, email: user.email, role: user.role });
      const { password: _, _id, ...safe } = user;
      return json({ token, user: safe });
    }

    if (path === 'auth/me' && method === 'GET') {
      const auth = getAuthUser(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);
      const user = await db.collection('users').findOne({ id: auth.id });
      if (!user) return json({ error: 'Not found' }, 404);
      const { password, _id, ...safe } = user;
      return json({ user: safe });
    }

    // ============ NEWS ============
    if (path === 'news' && method === 'GET') {
      const url = new URL(request.url);
      const state = url.searchParams.get('state');
      const district = url.searchParams.get('district');
      const category = url.searchParams.get('category');
      const status = url.searchParams.get('status') || 'approved';
      const search = url.searchParams.get('q');
      const reporterId = url.searchParams.get('reporterId');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '8');
      const q = {};
      if (status !== 'all') q.status = status;
      if (state) q.state = state;
      if (district) q.district = district;
      if (category) q.category = category;
      if (reporterId) q.reporterId = reporterId;
      if (search) q.headline = { $regex: search, $options: 'i' };
      // Lazy expire featured flags
      const __now = new Date();
      await db.collection('news').updateMany(
        { isFeatured: true, featuredUntil: { $lte: __now } },
        { $set: { isFeatured: false }, $unset: { featuredUntil: '' } }
      );
      const total = await db.collection('news').countDocuments(q);
      const news = await db.collection('news')
        .find(q, { projection: { _id: 0 } })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();
      return json({ news, total, page, hasMore: page * limit < total });
    }

    if (path.startsWith('news/') && path.split('/').length === 2 && method === 'GET') {
      const id = path.split('/')[1];
      const n = await db.collection('news').findOne({ id }, { projection: { _id: 0 } });
      if (!n) return json({ error: 'Not found' }, 404);
      await db.collection('news').updateOne({ id }, { $inc: { views: 1 } });
      return json({ news: n });
    }

    if (path === 'news' && method === 'POST') {
      const auth = getAuthUser(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);
      const body = await request.json();
      const user = await db.collection('users').findOne({ id: auth.id });
      const id = uuid();
      const slug = (body.headline || '').toLowerCase().replace(/[^a-z0-9\u0900-\u097F]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) + '-' + id.slice(0, 6);
      const news = {
        id, slug,
        headline: body.headline,
        summary: body.summary || '',
        content: body.content,
        contentHtml: body.contentHtml || body.content,
        category: body.category,
        state: body.state,
        district: body.district,
        city: body.city || body.district,
        images: body.images || [],
        videoUrl: body.videoUrl || '',
        media: body.media || [],
        thumbnail: body.thumbnail || body.images?.[0] || '',
        metaTitle: body.metaTitle || body.headline,
        metaDescription: body.metaDescription || body.summary || '',
        reporterId: auth.id,
        reporterName: user?.name || 'Reporter',
        reporterPhoto: user?.photo || '',
        status: 'approved',  // AUTO-PUBLISH
        views: 0,
        shares: 0,
        trending: false,
        hidden: false,
        featured: false,
        createdAt: new Date(),
        publishedAt: new Date()
      };
      await db.collection('news').insertOne(news);
      const { _id, ...safe } = news;
      return json({ news: safe });
    }

    if (path.startsWith('news/') && method === 'PATCH') {
      const auth = getAuthUser(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);
      const id = path.split('/')[1];
      const body = await request.json();
      const update = {};
      if (auth.role === 'admin') {
        if (body.status) update.status = body.status;
        if (body.trending !== undefined) update.trending = body.trending;
        if (body.status === 'approved') update.publishedAt = new Date();
      }
      await db.collection('news').updateOne({ id }, { $set: update });
      return json({ ok: true });
    }

    if (path.startsWith('news/') && method === 'DELETE') {
      const auth = getAuthUser(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);
      const id = path.split('/')[1];
      await db.collection('news').deleteOne({ id });
      return json({ ok: true });
    }

    // ============ BREAKING NEWS ============
    if (path === 'breaking' && method === 'GET') {
      const items = await db.collection('breaking')
        .find({ active: true }, { projection: { _id: 0 } })
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray();
      return json({ breaking: items });
    }

    if (path === 'breaking' && method === 'POST') {
      const auth = getAuthUser(request);
      if (!auth || auth.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const { text } = await request.json();
      const item = { id: uuid(), text, active: true, createdAt: new Date() };
      await db.collection('breaking').insertOne(item);
      const { _id, ...safe } = item;
      return json({ breaking: safe });
    }

    if (path.startsWith('breaking/') && method === 'DELETE') {
      const auth = getAuthUser(request);
      if (!auth || auth.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const id = path.split('/')[1];
      await db.collection('breaking').deleteOne({ id });
      return json({ ok: true });
    }

    // ============ AI ============
    if (path === 'ai/generate-headline' && method === 'POST') {
      const { content, state, district, category } = await request.json();
      const sys = 'You are an expert Indian crime news headline writer. Generate ONE punchy bilingual (Hindi + English mix) headline in less than 18 words. Use \u20b9 for rupees. NO quotes, NO numbering, just the headline text.';
      const prompt = `Write a viral, breaking-news-style headline for this crime news story.\nState: ${state || 'India'}\nDistrict: ${district || ''}\nCategory: ${category || 'crime'}\nStory content: ${content?.slice(0, 1500)}\n\nReturn only the headline.`;
      const headline = await generateText(prompt, sys);
      return json({ headline: headline.trim().replace(/^["']|["']$/g, '') });
    }

    if (path === 'ai/generate-meta' && method === 'POST') {
      const { headline, content } = await request.json();
      const sys = 'You are an SEO expert. Output strict JSON only, no markdown.';
      const prompt = `For this news article, generate SEO meta data. Return ONLY valid JSON: {"metaTitle":"...","metaDescription":"...","keywords":["...","..."]}\nMax 60 chars metaTitle, max 155 chars metaDescription, 5-8 keywords.\nHeadline: ${headline}\nContent: ${content?.slice(0, 1000)}`;
      const out = await generateText(prompt, sys);
      try {
        const cleaned = out.replace(/```json|```/g, '').trim();
        return json(JSON.parse(cleaned));
      } catch {
        return json({ metaTitle: headline, metaDescription: content?.slice(0, 150) || '', keywords: [] });
      }
    }

    if (path === 'ai/summarize' && method === 'POST') {
      const { content } = await request.json();
      const sys = 'You write concise crime news summaries in Hindi-English mix (Hinglish). Max 3 sentences.';
      const summary = await generateText(`Summarize: ${content?.slice(0, 2000)}`, sys);
      return json({ summary: summary.trim() });
    }

    // ============ STATES / CATEGORIES ============
    if (path === 'states' && method === 'GET') {
      return json({ states: INDIAN_STATES });
    }
    if (path === 'categories' && method === 'GET') {
      return json({ categories: CATEGORIES });
    }

    // ============ STATS ============
    if (path === 'stats' && method === 'GET') {
      const auth = getAuthUser(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);
      let q = {};
      if (auth.role === 'reporter') q.reporterId = auth.id;
      const total = await db.collection('news').countDocuments(q);
      const approved = await db.collection('news').countDocuments({ ...q, status: 'approved' });
      const pending = await db.collection('news').countDocuments({ ...q, status: 'pending' });
      const rejected = await db.collection('news').countDocuments({ ...q, status: 'rejected' });
      const viewsAgg = await db.collection('news').aggregate([
        { $match: q },
        { $group: { _id: null, total: { $sum: '$views' } } }
      ]).toArray();
      const totalUsers = await db.collection('users').countDocuments({});
      const totalReporters = await db.collection('users').countDocuments({ role: 'reporter' });
      return json({
        total, approved, pending, rejected,
        totalViews: viewsAgg[0]?.total || 0,
        totalUsers, totalReporters
      });
    }

    // ============ FEATURED NEWS (Top 10 paid slots — ₹499 for 24h) ============
    if (path === 'featured' && method === 'GET') {
      const now = new Date();
      // Lazy-expire: clear flags on expired featured news
      await db.collection('news').updateMany(
        { isFeatured: true, featuredUntil: { $lte: now } },
        { $set: { isFeatured: false }, $unset: { featuredUntil: '' } }
      );
      const featured = await db.collection('news')
        .find(
          { isFeatured: true, featuredUntil: { $gt: now }, status: 'approved', hidden: { $ne: true } },
          { projection: { _id: 0 } }
        )
        .sort({ featuredAt: -1 })
        .limit(10)
        .toArray();
      const slotsTotal = 10;
      const slotsUsed = featured.length;
      return json({
        featured,
        slotsTotal,
        slotsUsed,
        slotsAvailable: Math.max(0, slotsTotal - slotsUsed),
        full: slotsUsed >= slotsTotal,
        fee: 499,
        durationHours: 24
      });
    }

    if (path === 'featured/order' && method === 'POST') {
      const auth = getAuthUser(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);
      const { newsId } = await request.json();
      if (!newsId) return json({ error: 'newsId required' }, 400);
      const news = await db.collection('news').findOne({ id: newsId });
      if (!news) return json({ error: 'News not found' }, 404);
      if (news.reporterId !== auth.id && auth.role !== 'admin') return json({ error: 'Not your news' }, 403);
      if (news.status !== 'approved') return json({ error: 'Only approved news can be featured' }, 400);
      // Already featured?
      if (news.isFeatured && news.featuredUntil && new Date(news.featuredUntil) > new Date()) {
        return json({ error: 'Already featured', featuredUntil: news.featuredUntil }, 400);
      }
      // Auto-expire stale records first
      const now = new Date();
      await db.collection('news').updateMany(
        { isFeatured: true, featuredUntil: { $lte: now } },
        { $set: { isFeatured: false }, $unset: { featuredUntil: '' } }
      );
      const activeCount = await db.collection('news').countDocuments({ isFeatured: true, featuredUntil: { $gt: now } });
      if (activeCount >= 10) return json({ error: 'All 10 featured slots are full. Please try later.', slotsAvailable: 0 }, 400);
      try {
        const rzp = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        const order = await rzp.orders.create({
          amount: 499 * 100,
          currency: 'INR',
          receipt: `feat_${Date.now()}`,
          notes: { newsId, userId: auth.id, type: 'featured-news' }
        });
        return json({ orderId: order.id, amount: order.amount, keyId: process.env.RAZORPAY_KEY_ID, slotsAvailable: 10 - activeCount });
      } catch (e) {
        return json({ error: 'Razorpay not configured', detail: e.message }, 500);
      }
    }

    if (path === 'featured/activate' && method === 'POST') {
      const auth = getAuthUser(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, newsId, demo } = await request.json();
      // DEMO mode: allow activation without signature when Razorpay isn't configured
      const isDemoBypass = demo === true && !process.env.RAZORPAY_KEY_SECRET;
      if (!isDemoBypass) {
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
          return json({ error: 'Missing payment fields' }, 400);
        }
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const expected = hmac.digest('hex');
        if (expected !== razorpay_signature) return json({ error: 'Invalid signature' }, 400);
      }
      const news = await db.collection('news').findOne({ id: newsId });
      if (!news) return json({ error: 'News not found' }, 404);
      if (news.reporterId !== auth.id && auth.role !== 'admin') return json({ error: 'Not your news' }, 403);
      // Slot recheck (race condition guard)
      const now = new Date();
      const activeCount = await db.collection('news').countDocuments({ isFeatured: true, featuredUntil: { $gt: now } });
      if (activeCount >= 10) return json({ error: 'All 10 slots filled while paying. Contact support for refund.' }, 400);

      const featuredUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      await db.collection('news').updateOne(
        { id: newsId },
        { $set: { isFeatured: true, featuredAt: now, featuredUntil, featuredPaymentId: razorpay_payment_id || ('demo_' + Date.now()) } }
      );
      await db.collection('payments').insertOne({
        id: uuid(),
        userId: auth.id,
        newsId,
        orderId: razorpay_order_id || null,
        paymentId: razorpay_payment_id || ('demo_' + Date.now()),
        amount: 499,
        type: 'featured-news',
        status: 'paid',
        createdAt: now,
        expiresAt: featuredUntil
      });
      return json({ ok: true, featuredUntil, message: 'News featured for 24 hours' });
    }

    // ============ PAYMENT (Razorpay) ============
    if (path === 'payment/create-order' && method === 'POST') {
      const { amount = 500 } = await request.json();
      try {
        const rzp = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        const order = await rzp.orders.create({
          amount: amount * 100,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`
        });
        return json({ orderId: order.id, amount: order.amount, keyId: process.env.RAZORPAY_KEY_ID });
      } catch (e) {
        return json({ error: 'Razorpay not configured', detail: e.message }, 500);
      }
    }

    if (path === 'payment/verify' && method === 'POST') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = await request.json();
      const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const expected = hmac.digest('hex');
      if (expected !== razorpay_signature) return json({ error: 'Invalid signature' }, 400);
      if (userId) {
        await db.collection('users').updateOne({ id: userId }, { $set: { paymentStatus: 'paid', joinedAt: new Date() } });
      }
      await db.collection('payments').insertOne({
        id: uuid(), userId, orderId: razorpay_order_id, paymentId: razorpay_payment_id,
        amount: 500, status: 'paid', createdAt: new Date()
      });
      return json({ ok: true });
    }

    // ============ USERS (admin) ============
    if (path === 'users' && method === 'GET') {
      const auth = getAuthUser(request);
      if (!auth || auth.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const users = await db.collection('users').find({}, { projection: { password: 0, _id: 0 } }).toArray();
      return json({ users });
    }

    // ============ REFERRALS ============
    if (path === 'referrals' && method === 'GET') {
      const auth = getAuthUser(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);
      const referrals = await db.collection('referrals').find(
        { referrerId: auth.id },
        { projection: { _id: 0 } }
      ).sort({ createdAt: -1 }).toArray();
      const totalEarned = referrals.reduce((sum, r) => sum + (r.bonus || 0), 0);
      const user = await db.collection('users').findOne({ id: auth.id });
      return json({
        referrals,
        totalEarned,
        totalReferrals: referrals.length,
        referralCode: user?.referralCode || '',
        walletBalance: user?.walletBalance || 0
      });
    }

    // ============ PAYOUTS (Withdrawal) ============
    if (path === 'payouts' && method === 'POST') {
      const auth = getAuthUser(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);
      const body = await request.json();
      const { amount, method: payMethod, upiId, accountNumber, ifsc, accountHolder, notes } = body;
      const amt = parseFloat(amount);
      if (!amt || amt < 100) return json({ error: 'Minimum payout is ₹100' }, 400);
      if (payMethod === 'upi' && !upiId) return json({ error: 'UPI ID required' }, 400);
      if (payMethod === 'bank' && (!accountNumber || !ifsc || !accountHolder)) return json({ error: 'Bank details incomplete' }, 400);

      const user = await db.collection('users').findOne({ id: auth.id });
      if (!user) return json({ error: 'User not found' }, 404);
      if ((user.walletBalance || 0) < amt) return json({ error: 'Insufficient wallet balance' }, 400);

      // Deduct from wallet immediately (escrow)
      await db.collection('users').updateOne({ id: auth.id }, { $inc: { walletBalance: -amt } });

      const payout = {
        id: uuid(),
        userId: auth.id,
        userName: user.name,
        userEmail: user.email,
        userMobile: user.mobile,
        amount: amt,
        method: payMethod,
        upiId: payMethod === 'upi' ? upiId : null,
        accountNumber: payMethod === 'bank' ? accountNumber : null,
        ifsc: payMethod === 'bank' ? ifsc : null,
        accountHolder: payMethod === 'bank' ? accountHolder : null,
        status: 'pending',
        notes: notes || '',
        createdAt: new Date(),
        processedAt: null,
        adminNote: null,
        transactionId: null
      };
      await db.collection('payouts').insertOne(payout);
      const { _id, ...safe } = payout;
      return json({ payout: safe, message: 'Payout request submitted. Amount held in escrow.' });
    }

    if (path === 'payouts' && method === 'GET') {
      const auth = getAuthUser(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);
      const url = new URL(request.url);
      const all = url.searchParams.get('all') === 'true';
      const q = (all && auth.role === 'admin') ? {} : { userId: auth.id };
      const payouts = await db.collection('payouts').find(q, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(100).toArray();
      const summary = {
        totalRequested: payouts.reduce((s, p) => s + p.amount, 0),
        totalPaid: payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
        totalPending: payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
      };
      return json({ payouts, summary });
    }

    if (path.startsWith('payouts/') && method === 'PATCH') {
      const auth = getAuthUser(request);
      if (!auth || auth.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const id = path.split('/')[1];
      const body = await request.json();
      const { status, transactionId, adminNote } = body;
      const payout = await db.collection('payouts').findOne({ id });
      if (!payout) return json({ error: 'Not found' }, 404);

      const update = { status, adminNote: adminNote || null, processedAt: new Date() };
      if (transactionId) update.transactionId = transactionId;

      // If rejected, refund to wallet
      if (status === 'rejected' && payout.status !== 'rejected') {
        await db.collection('users').updateOne({ id: payout.userId }, { $inc: { walletBalance: payout.amount } });
      }
      // If reverting from rejected to paid, deduct again
      if (status === 'paid' && payout.status === 'rejected') {
        await db.collection('users').updateOne({ id: payout.userId }, { $inc: { walletBalance: -payout.amount } });
      }
      await db.collection('payouts').updateOne({ id }, { $set: update });
      return json({ ok: true });
    }

    // ============ CITY REPORTERS (Real-time check) ============
    if (path === 'reporters/by-city' && method === 'GET') {
      const url = new URL(request.url);
      const state = url.searchParams.get('state');
      const district = url.searchParams.get('district');
      if (!state || !district) return json({ reporters: [], canApply: true });
      const reporters = await db.collection('users').find(
        { state, district, role: 'reporter' },
        { projection: { password: 0, _id: 0, aadhaar: 0, pan: 0, address: 0, aadhaarFront: 0, aadhaarBack: 0 } }
      ).limit(10).toArray();
      // attach news counts
      const enriched = await Promise.all(reporters.map(async (r) => ({
        ...r,
        newsCount: await db.collection('news').countDocuments({ reporterId: r.id, status: 'approved' })
      })));
      return json({ reporters: enriched, canApply: enriched.length === 0, totalInCity: enriched.length });
    }

    // ============ REPORTER PROFILE ============
    if (path.startsWith('reporter/') && method === 'GET') {
      const idOrCode = path.split('/')[1];
      const user = await db.collection('users').findOne(
        { $or: [{ id: idOrCode }, { referralCode: idOrCode }] },
        { projection: { password: 0, _id: 0, aadhaar: 0, pan: 0, aadhaarFront: 0, aadhaarBack: 0 } }
      );
      if (!user) return json({ error: 'Not found' }, 404);
      const news = await db.collection('news').find(
        { reporterId: user.id, status: 'approved' },
        { projection: { _id: 0 } }
      ).sort({ createdAt: -1 }).limit(20).toArray();
      const newsCount = await db.collection('news').countDocuments({ reporterId: user.id, status: 'approved' });
      return json({ user, news, newsCount });
    }

    // ============ ADVERTISEMENTS ============
    if (path === 'ads' && method === 'GET') {
      const url = new URL(request.url);
      const newsId = url.searchParams.get('newsId');
      const status = url.searchParams.get('status') || 'approved';
      const type = url.searchParams.get('type'); // 'bottom' or 'middle'
      const q = { status };
      if (type) q.type = type;
      if (newsId) q.newsId = newsId;
      const ads = await db.collection('ads').find(q, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(50).toArray();
      return json({ ads });
    }

    if (path === 'ads' && method === 'POST') {
      const auth = getAuthUser(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);
      const body = await request.json();
      const { placement, banner, link, ctaText, title, duration, paymentId, newsId } = body;
      if (!['middle', 'bottom', 'both'].includes(placement)) return json({ error: 'Invalid placement' }, 400);
      if (!banner) return json({ error: 'Banner required' }, 400);
      const ad = {
        id: uuid(),
        placement,
        type: placement, // legacy compat
        title: title || '',
        banner,
        link: link || '',
        ctaText: ctaText || (link ? 'Visit' : ''),
        duration: parseInt(duration) || 7,
        reporterId: auth.id,
        newsId: newsId || null,
        paymentId: paymentId || null,
        status: 'pending',
        impressions: 0,
        clicks: 0,
        amountPaid: 299,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + (parseInt(duration) || 7) * 86400000)
      };
      await db.collection('ads').insertOne(ad);
      const { _id, ...safe } = ad;
      return json({ ad: safe });
    }

    if (path.startsWith('ads/') && method === 'PATCH') {
      const auth = getAuthUser(request);
      if (!auth || auth.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const id = path.split('/')[1];
      const body = await request.json();
      await db.collection('ads').updateOne({ id }, { $set: { status: body.status, adminNote: body.adminNote || null } });
      return json({ ok: true });
    }

    if (path.startsWith('ads/') && method === 'DELETE') {
      const auth = getAuthUser(request);
      if (!auth) return json({ error: 'Forbidden' }, 403);
      const id = path.split('/')[1];
      const ad = await db.collection('ads').findOne({ id });
      if (!ad) return json({ error: 'Not found' }, 404);
      // Reporter can delete own ads; admin can delete any
      if (auth.role !== 'admin' && ad.reporterId !== auth.id) return json({ error: 'Forbidden' }, 403);
      await db.collection('ads').deleteOne({ id });
      return json({ ok: true });
    }

    if (path.startsWith('ads/') && path.endsWith('/click') && method === 'POST') {
      const id = path.split('/')[1];
      await db.collection('ads').updateOne({ id }, { $inc: { clicks: 1 } });
      return json({ ok: true });
    }

    if (path === 'ads/my' && method === 'GET') {
      const auth = getAuthUser(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);
      const ads = await db.collection('ads').find({ reporterId: auth.id }, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
      return json({ ads });
    }

    // ============ SOCIAL FEED (Reels / Videos) ============
    if (path === 'social' && method === 'GET') {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const posts = await db.collection('social').find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(limit).toArray();
      return json({ posts });
    }

    if (path === 'social' && method === 'POST') {
      const auth = getAuthUser(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);
      const body = await request.json();
      const { url: videoUrl, platform, caption } = body;
      if (!videoUrl) return json({ error: 'URL required' }, 400);
      const user = await db.collection('users').findOne({ id: auth.id });
      // Detect platform
      let detected = platform;
      if (!detected) {
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) detected = 'youtube';
        else if (videoUrl.includes('instagram.com')) detected = 'instagram';
        else if (videoUrl.includes('facebook.com') || videoUrl.includes('fb.watch')) detected = 'facebook';
        else if (videoUrl.includes('twitter.com') || videoUrl.includes('x.com')) detected = 'twitter';
        else detected = 'other';
      }
      // Extract YouTube ID for embed
      let embedId = null;
      if (detected === 'youtube') {
        const m = videoUrl.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
        embedId = m ? m[1] : null;
      }
      const post = {
        id: uuid(),
        url: videoUrl, platform: detected, embedId,
        caption: caption || '',
        reporterId: auth.id,
        reporterName: user?.name || 'Reporter',
        reporterPhoto: user?.photo || '',
        views: 0, likes: 0, shares: 0,
        createdAt: new Date()
      };
      await db.collection('social').insertOne(post);
      const { _id, ...safe } = post;
      return json({ post: safe });
    }

    if (path.startsWith('social/') && path.endsWith('/like') && method === 'POST') {
      const id = path.split('/')[1];
      await db.collection('social').updateOne({ id }, { $inc: { likes: 1 } });
      return json({ ok: true });
    }

    // ============ SITE SETTINGS (YouTube, Insta, Support, Contact, Logo) ============
    if (path === 'site-settings' && method === 'GET') {
      let s = await db.collection('settings').findOne({ id: 'site' });
      if (!s) {
        // Seed defaults
        s = {
          id: 'site',
          siteName: 'Indian Crime News',
          tagline: 'सच्चाई की आवाज़',
          logo: '/branding/icn-logo.png',
          youtubeVideos: [
            { id: 'dQw4w9WgXcQ', title: 'Sample Video 1' },
            { id: 'jNQXAC9IVRw', title: 'Sample Video 2' },
            { id: '9bZkp7q19f0', title: 'Sample Video 3' },
            { id: 'kJQP7kiw5Fk', title: 'Sample Video 4' },
            { id: 'L_jWHffIx5E', title: 'Sample Video 5' },
            { id: 'fJ9rUzIMcZQ', title: 'Sample Video 6' }
          ],
          instagram: { url: 'https://instagram.com/icnewsmedia', handle: '@icnewsmedia', label: 'IC News Media' },
          supportTeam: {
            timeStart: '11:00 AM',
            timeEnd: '6:00 PM',
            members: [
              { name: 'Support Lead', mobile: '+91 0000000000', role: 'Senior Support' },
              { name: 'Support Officer', mobile: '+91 0000000001', role: 'Technical Help' }
            ]
          },
          contact: {
            address: 'FF-120, ADITYA COMPLEX, KASAK CIRCLE, BHARUCH - 392001, GUJARAT (INDIA)',
            email: 'icnewsmediaofficial@gmail.com',
            phones: ['+91 8485985700']
          },
          updatedAt: new Date()
        };
        await db.collection('settings').insertOne(s);
      } else if (!s.logo) {
        // Backfill logo if upgrading from older seed
        await db.collection('settings').updateOne(
          { id: 'site' },
          { $set: { logo: '/branding/icn-logo.png', siteName: s.siteName || 'Indian Crime News', tagline: s.tagline || 'सच्चाई की आवाज़' } }
        );
        s.logo = '/branding/icn-logo.png';
        s.siteName = s.siteName || 'Indian Crime News';
        s.tagline = s.tagline || 'सच्चाई की आवाज़';
      }
      const { _id, ...rest } = s;
      return json(rest);
    }

    if (path === 'site-settings' && method === 'PUT') {
      const auth = getAuthUser(request);
      if (!auth || auth.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const body = await request.json();
      const update = { ...body, id: 'site', updatedAt: new Date() };
      delete update._id;
      await db.collection('settings').updateOne(
        { id: 'site' },
        { $set: update },
        { upsert: true }
      );
      return json({ ok: true });
    }

    // ============ HELP REQUESTS ============
    if (path === 'help' && method === 'POST') {
      const { name, contact, query, media } = await request.json();
      if (!name || !contact || !query) return json({ error: 'Name, contact, and query are required' }, 400);
      const helpReq = {
        id: uuid(),
        name,
        contact,
        query,
        media: media || [], // array of base64 strings (photos/videos)
        status: 'open',
        createdAt: new Date()
      };
      await db.collection('help_requests').insertOne(helpReq);
      return json({ ok: true, id: helpReq.id, message: 'आपका सन्देश हमें मिल गया है। हम जल्द ही संपर्क करेंगे।' });
    }

    if (path === 'help' && method === 'GET') {
      const auth = getAuthUser(request);
      if (!auth || auth.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const all = await db.collection('help_requests').find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(200).toArray();
      return json({ requests: all });
    }

    // ============ NEW UPDATES (Company announcements for reporters) ============
    if (path === 'updates' && method === 'GET') {
      const auth = getAuthUser(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);
      const updates = await db.collection('updates').find({ active: { $ne: false } }, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(100).toArray();
      return json({ updates });
    }
    if (path === 'admin/updates' && method === 'POST') {
      const auth = getAuthUser(request);
      if (!auth || auth.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const { title, body: text, type = 'info', pinned = false } = await request.json();
      if (!title) return json({ error: 'Title required' }, 400);
      const update = { id: uuid(), title, body: text || '', type, pinned, active: true, createdAt: new Date(), createdBy: auth.id };
      await db.collection('updates').insertOne(update);
      delete update._id;
      return json({ ok: true, update });
    }
    if (path.startsWith('admin/updates/') && method === 'DELETE') {
      const auth = getAuthUser(request);
      if (!auth || auth.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const id = path.split('/')[2];
      await db.collection('updates').deleteOne({ id });
      return json({ ok: true });
    }

    // ============ FAQs ============
    if (path === 'faqs' && method === 'GET') {
      const faqs = await db.collection('faqs').find({ active: { $ne: false } }, { projection: { _id: 0 } }).sort({ order: 1, createdAt: 1 }).toArray();
      return json({ faqs });
    }
    if (path === 'admin/faqs' && method === 'POST') {
      const auth = getAuthUser(request);
      if (!auth || auth.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const { question, answer, order = 0 } = await request.json();
      if (!question || !answer) return json({ error: 'Question and answer required' }, 400);
      const faq = { id: uuid(), question, answer, order, active: true, createdAt: new Date() };
      await db.collection('faqs').insertOne(faq);
      delete faq._id;
      return json({ ok: true, faq });
    }
    if (path.startsWith('admin/faqs/') && method === 'PUT') {
      const auth = getAuthUser(request);
      if (!auth || auth.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const id = path.split('/')[2];
      const body = await request.json();
      delete body._id; delete body.id;
      await db.collection('faqs').updateOne({ id }, { $set: { ...body, updatedAt: new Date() } });
      return json({ ok: true });
    }
    if (path.startsWith('admin/faqs/') && method === 'DELETE') {
      const auth = getAuthUser(request);
      if (!auth || auth.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const id = path.split('/')[2];
      await db.collection('faqs').deleteOne({ id });
      return json({ ok: true });
    }

    // ============ OPERATIONS / TASKS ============
    // Admin assigns task to reporter, reporter submits reports
    if (path === 'tasks/my' && method === 'GET') {
      const auth = getAuthUser(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);
      const tasks = await db.collection('tasks').find({ assignedTo: auth.id }, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
      // Fetch reports for these tasks
      const taskIds = tasks.map(t => t.id);
      const reports = await db.collection('task_reports').find({ taskId: { $in: taskIds } }, { projection: { _id: 0 } }).toArray();
      const byTask = {};
      reports.forEach(r => { (byTask[r.taskId] = byTask[r.taskId] || []).push(r); });
      tasks.forEach(t => { t.reports = byTask[t.id] || []; });
      return json({ tasks });
    }
    if (path === 'admin/tasks' && method === 'GET') {
      const auth = getAuthUser(request);
      if (!auth || auth.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const tasks = await db.collection('tasks').find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(500).toArray();
      // Attach assignee info + reports
      const userIds = [...new Set(tasks.map(t => t.assignedTo).filter(Boolean))];
      const users = await db.collection('users').find({ id: { $in: userIds } }, { projection: { _id: 0, password: 0, aadhaar: 0, pan: 0, address: 0, aadhaarFront: 0, aadhaarBack: 0 } }).toArray();
      const userMap = Object.fromEntries(users.map(u => [u.id, u]));
      const taskIds = tasks.map(t => t.id);
      const reports = await db.collection('task_reports').find({ taskId: { $in: taskIds } }, { projection: { _id: 0 } }).toArray();
      const reportsByTask = {};
      reports.forEach(r => { (reportsByTask[r.taskId] = reportsByTask[r.taskId] || []).push(r); });
      tasks.forEach(t => {
        t.assignee = userMap[t.assignedTo] ? { id: userMap[t.assignedTo].id, name: userMap[t.assignedTo].name, photo: userMap[t.assignedTo].photo, email: userMap[t.assignedTo].email, mobile: userMap[t.assignedTo].mobile, state: userMap[t.assignedTo].state, district: userMap[t.assignedTo].district } : null;
        t.reports = reportsByTask[t.id] || [];
      });
      return json({ tasks });
    }
    if (path === 'admin/tasks' && method === 'POST') {
      const auth = getAuthUser(request);
      if (!auth || auth.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const { title, description, assignedTo, deadline, priority = 'medium', location } = await request.json();
      if (!title || !assignedTo) return json({ error: 'Title and assignee required' }, 400);
      const task = { id: uuid(), title, description: description || '', assignedTo, deadline: deadline ? new Date(deadline) : null, priority, location: location || '', status: 'pending', createdAt: new Date(), createdBy: auth.id };
      await db.collection('tasks').insertOne(task);
      delete task._id;
      return json({ ok: true, task });
    }
    if (path.startsWith('admin/tasks/') && method === 'DELETE') {
      const auth = getAuthUser(request);
      if (!auth || auth.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const id = path.split('/')[2];
      await db.collection('tasks').deleteOne({ id });
      await db.collection('task_reports').deleteMany({ taskId: id });
      return json({ ok: true });
    }
    if (path.startsWith('tasks/') && path.endsWith('/report') && method === 'POST') {
      const auth = getAuthUser(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);
      const taskId = path.split('/')[1];
      const task = await db.collection('tasks').findOne({ id: taskId });
      if (!task) return json({ error: 'Task not found' }, 404);
      if (task.assignedTo !== auth.id) return json({ error: 'Not your task' }, 403);
      const { summary, findings, location, peopleInvolved, timeSpent, media, status = 'submitted' } = await request.json();
      if (!summary) return json({ error: 'Report summary required' }, 400);
      const report = {
        id: uuid(), taskId, reporterId: auth.id, reporterName: auth.name || '',
        summary, findings: findings || '', location: location || '',
        peopleInvolved: peopleInvolved || '', timeSpent: timeSpent || '',
        media: media || [], status, createdAt: new Date()
      };
      await db.collection('task_reports').insertOne(report);
      // Auto-update task status if first report
      await db.collection('tasks').updateOne({ id: taskId }, { $set: { status: status === 'completed' ? 'completed' : 'in-progress', lastReportAt: new Date() } });
      delete report._id;
      return json({ ok: true, report });
    }

    // ============ JOB POSTS / RECRUITMENT ============

    // Auto-seed STATE LEVEL appointment structure for ALL India states/UTs
    if (path === 'admin/seed-state-posts' && method === 'POST') {
      const auth = getAuthUser(request);
      if (!auth || auth.role !== 'admin') return json({ error: 'Forbidden' }, 403);

      // All 28 States + 8 Union Territories
      const INDIA_STATES = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
        'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
        'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
        'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
        'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
        // UTs
        'Andaman and Nicobar Islands', 'Chandigarh',
        'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
        'Ladakh', 'Lakshadweep', 'Puducherry'
      ];

      // 10-post State Level appointment structure (43 vacancies per state)
      const STATE_POSTS = [
        { key: 'bureau-chief',    name: 'State Bureau Chief',            hindi: 'स्टेट ब्यूरो चीफ',           fee: 25000, vacancy: 1,  description: 'पूरे राज्य का प्रमुख एवं संचालन',                  responsibilities: ['राज्य-स्तरीय नेतृत्व', 'संचालन प्रबंधन', 'टीम मॉनिटरिंग'] },
        { key: 'state-head',      name: 'State Head',                    hindi: 'स्टेट हेड / राज्य प्रमुख',   fee: 11000, vacancy: 4,  description: 'राज्य की पूरी जिम्मेदारी एवं प्रबंधन',                responsibilities: ['राज्य प्रबंधन', 'टीम जिम्मेदारी', 'प्रशासनिक कार्य'] },
        { key: 'state-coord',     name: 'State Coordinator',             hindi: 'स्टेट कोऑर्डिनेटर',          fee: 7500,  vacancy: 4,  description: 'टीम मैनेजमेंट एवं रिपोर्टिंग समन्वय',                 responsibilities: ['टीम मैनेजमेंट', 'रिपोर्टिंग समन्वय', 'फील्ड संचालन'] },
        { key: 'crime-reporter',  name: 'State Crime Reporter',          hindi: 'स्टेट क्राइम रिपोर्टर',      fee: 5100,  vacancy: 4,  description: 'राज्य की क्राइम खबरों की रिपोर्टिंग',                  responsibilities: ['क्राइम रिपोर्टिंग', 'घटना कवरेज', 'सोर्स नेटवर्क'] },
        { key: 'investigation',   name: 'Media Investigation Officer',   hindi: 'स्टेट इन्वेस्टिगेशन ऑफिसर',  fee: 5100,  vacancy: 4,  description: 'जांच आधारित खबरें एवं विशेष रिपोर्टिंग',              responsibilities: ['जांच रिपोर्टिंग', 'स्पेशल कवरेज', 'डाटा एनालिसिस'] },
        { key: 'media-manager',   name: 'State Media Manager',           hindi: 'स्टेट मीडिया मैनेजर',        fee: 4000,  vacancy: 4,  description: 'मीडिया संचालन एवं प्रमोशन प्रबंधन',                   responsibilities: ['मीडिया संचालन', 'प्रमोशन', 'विज्ञापन प्रबंधन'] },
        { key: 'news-editor',     name: 'State News Editor',             hindi: 'स्टेट न्यूज़ एडिटर',          fee: 3500,  vacancy: 4,  description: 'समाचार जांच, एडिटिंग एवं प्रकाशन नियंत्रण',          responsibilities: ['एडिटिंग', 'प्रकाशन नियंत्रण', 'समाचार जांच'] },
        { key: 'social-head',     name: 'State Social Media Head',       hindi: 'स्टेट सोशल मीडिया हेड',      fee: 2500,  vacancy: 4,  description: 'Facebook, YouTube, Instagram एवं डिजिटल प्लेटफॉर्म संचालन', responsibilities: ['सोशल मीडिया संचालन', 'डिजिटल मार्केटिंग', 'कंटेंट क्रिएशन'] },
        { key: 'field-reporter',  name: 'State Field Reporter',          hindi: 'स्टेट फील्ड रिपोर्टर',        fee: 3500,  vacancy: 10, description: 'जिला एवं शहर स्तर पर ग्राउंड रिपोर्टिंग',              responsibilities: ['ग्राउंड रिपोर्टिंग', 'फील्ड कवरेज', 'जिला कनेक्ट'] },
        { key: 'pro',             name: 'State Press Relation Officer',  hindi: 'स्टेट प्रेस रिलेशन ऑफिसर',   fee: 3500,  vacancy: 4,  description: 'सरकारी विभाग, प्रेस एवं जनसंपर्क प्रबंधन',            responsibilities: ['पीआर', 'सरकारी समन्वय', 'जनसंपर्क'] }
      ];

      const now = new Date();
      let inserted = 0, updated = 0, skipped = 0;
      const ops = [];

      for (const stateName of INDIA_STATES) {
        for (const template of STATE_POSTS) {
          // Deterministic ID: idempotent re-runs
          const id = `state-${stateName.toLowerCase().replace(/[^a-z]/g, '')}-${template.key}`;
          const existing = await db.collection('posts').findOne({ id });
          const post = {
            id,
            name: template.name,
            nameHindi: template.hindi,
            joiningFee: template.fee,
            levelType: 'state',
            state: stateName,
            district: null,
            city: null,
            totalVacancy: template.vacancy,
            description: template.description,
            responsibilities: template.responsibilities,
            status: 'open',
            autoSeeded: true,
            updatedAt: now
          };
          if (!existing) {
            post.createdAt = now;
            ops.push({ insertOne: { document: post } });
            inserted++;
          } else {
            ops.push({ updateOne: { filter: { id }, update: { $set: post } } });
            updated++;
          }
        }
      }

      if (ops.length > 0) {
        await db.collection('posts').bulkWrite(ops, { ordered: false });
      }

      return json({
        ok: true,
        message: `Auto-seeded ${INDIA_STATES.length} states × 10 posts = ${INDIA_STATES.length * STATE_POSTS.length} total job templates (${INDIA_STATES.length * 43} total vacancies)`,
        statesCount: INDIA_STATES.length,
        postsPerState: STATE_POSTS.length,
        vacanciesPerState: 43,
        totalPosts: INDIA_STATES.length * STATE_POSTS.length,
        totalVacancies: INDIA_STATES.length * 43,
        inserted,
        updated,
        skipped
      });
    }

    if (path === 'posts' && method === 'GET') {
      const url = new URL(request.url);
      const status = url.searchParams.get('status') || 'open';
      const state = url.searchParams.get('state');
      const district = url.searchParams.get('district');
      const city = url.searchParams.get('city');
      const q = { status };
      if (state) q.state = state;
      if (district) q.district = district;
      if (city) q.city = city;
      const posts = await db.collection('posts').find(q, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
      // Compute available seats for each
      const enriched = await Promise.all(posts.map(async (p) => {
        const filled = await db.collection('users').countDocuments({
          appliedPostId: p.id,
          ...(p.state ? { state: p.state } : {}),
          ...(p.district ? { district: p.district } : {}),
          ...(p.city ? { city: p.city } : {}),
          applicationStatus: 'approved'
        });
        return { ...p, filledSeats: filled, availableSeats: Math.max(0, (p.totalVacancy || 0) - filled) };
      }));
      return json({ posts: enriched });
    }

    if (path === 'posts' && method === 'POST') {
      const auth = getAuthUser(request);
      if (!auth || auth.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const body = await request.json();
      const id = uuid();
      const post = {
        id,
        name: body.name,
        joiningFee: parseFloat(body.joiningFee) || 0,
        levelType: body.levelType, // 'state' | 'district' | 'city'
        state: body.state || null,
        district: body.district || null,
        city: body.city || null,
        totalVacancy: parseInt(body.totalVacancy) || 1,
        description: body.description || '',
        responsibilities: body.responsibilities || [],
        status: 'open',
        createdAt: new Date()
      };
      await db.collection('posts').insertOne(post);
      const { _id, ...safe } = post;
      return json({ post: safe });
    }

    if (path.startsWith('posts/') && path.split('/').length === 2 && method === 'GET') {
      const id = path.split('/')[1];
      const p = await db.collection('posts').findOne({ id }, { projection: { _id: 0 } });
      if (!p) return json({ error: 'Not found' }, 404);
      // Get approved members
      const members = await db.collection('users').find(
        {
          appliedPostId: id,
          applicationStatus: 'approved'
        },
        { projection: { password: 0, _id: 0, aadhaar: 0, pan: 0, address: 0, aadhaarFront: 0, aadhaarBack: 0 } }
      ).toArray();
      const availableSeats = Math.max(0, (p.totalVacancy || 0) - members.length);
      return json({ post: p, members, availableSeats, totalFilled: members.length });
    }

    if (path.startsWith('posts/') && path.endsWith('/apply') && method === 'POST') {
      const auth = getAuthUser(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);
      const id = path.split('/')[1];
      const post = await db.collection('posts').findOne({ id });
      if (!post) return json({ error: 'Post not found' }, 404);
      const filled = await db.collection('users').countDocuments({ appliedPostId: id, applicationStatus: 'approved' });
      if (filled >= post.totalVacancy) return json({ error: 'All positions filled' }, 400);
      await db.collection('users').updateOne({ id: auth.id }, {
        $set: {
          appliedPostId: id, appliedPostName: post.name,
          applicationStatus: 'pending', appliedAt: new Date()
        }
      });
      return json({ ok: true, message: 'Application submitted! Pay joining fee and await admin approval.' });
    }

    if (path.startsWith('posts/') && path.split('/').length === 2 && method === 'DELETE') {
      const auth = getAuthUser(request);
      if (!auth || auth.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const id = path.split('/')[1];
      await db.collection('posts').deleteOne({ id });
      return json({ ok: true });
    }

    if (path.startsWith('users/') && path.endsWith('/approve-application') && method === 'POST') {
      const auth = getAuthUser(request);
      if (!auth || auth.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const userId = path.split('/')[1];
      await db.collection('users').updateOne({ id: userId }, { $set: { applicationStatus: 'approved', verified: true, approvedAt: new Date() } });
      return json({ ok: true });
    }

    if (path === 'applications/pending' && method === 'GET') {
      const auth = getAuthUser(request);
      if (!auth || auth.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const apps = await db.collection('users').find(
        { applicationStatus: 'pending', appliedPostId: { $ne: null } },
        { projection: { password: 0, _id: 0 } }
      ).sort({ appliedAt: -1 }).toArray();
      return json({ applications: apps });
    }

    // ============ HEALTH ============
    if (path === '' || path === 'health') {
      return json({ status: 'ok', app: 'Indian Crime News API', timestamp: new Date() });
    }

    // ============ PDF DOWNLOADS ============
    if (path.startsWith('pdf/news/') && method === 'GET') {
      const id = path.split('/')[2];
      const n = await db.collection('news').findOne({ id });
      if (!n) return json({ error: 'Not found' }, 404);
      const ads = await db.collection('ads').find({ status: 'approved' }, { projection: { _id: 0 } }).toArray();
      const reporter = await db.collection('users').findOne({ id: n.reporterId }, { projection: { password: 0, _id: 0 } });
      const buf = await generateNewsPDF(n, process.env.NEXT_PUBLIC_BASE_URL || '', ads, reporter);
      return new Response(buf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="news-${id}.pdf"`
        }
      });
    }

    if (path.startsWith('pdf/idcard/') && method === 'GET') {
      const id = path.split('/')[2];
      const u = await db.collection('users').findOne({ id });
      if (!u) return json({ error: 'Not found' }, 404);
      const buf = await generateIDCardPDF(u, process.env.NEXT_PUBLIC_BASE_URL || '');
      return new Response(buf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="press-id-${id}.pdf"`
        }
      });
    }

    if (path.startsWith('pdf/certificate/') && method === 'GET') {
      const id = path.split('/')[2];
      const u = await db.collection('users').findOne({ id });
      if (!u) return json({ error: 'Not found' }, 404);
      const buf = await generateCertificatePDF(u);
      return new Response(buf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="certificate-${id}.pdf"`
        }
      });
    }

    // ============ AI SPAM DETECTION ============
    if (path === 'ai/spam-check' && method === 'POST') {
      const { content, headline } = await request.json();
      const sys = 'You are a content moderator. Output ONLY valid JSON.';
      const prompt = `Analyze this news article. Return JSON: {"isSpam": bool, "confidence": 0-100, "reason": "...", "categoryHint": "..."}.\nHeadline: ${headline}\nContent: ${content?.slice(0, 1000)}`;
      try {
        const out = await generateText(prompt, sys);
        const cleaned = out.replace(/```json|```/g, '').trim();
        return json(JSON.parse(cleaned));
      } catch {
        return json({ isSpam: false, confidence: 0, reason: 'check failed' });
      }
    }

    // ============ ANALYTICS ============
    if (path === 'analytics' && method === 'GET') {
      const auth = getAuthUser(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);

      // Last 7 days news count
      const last7 = await db.collection('news').aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          views: { $sum: '$views' }
        }},
        { $sort: { _id: 1 } }
      ]).toArray();

      // By category
      const byCat = await db.collection('news').aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: '$category', count: { $sum: 1 }, views: { $sum: '$views' } } },
        { $sort: { count: -1 } }
      ]).toArray();

      // By state
      const byState = await db.collection('news').aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: '$state', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray();

      // Top reporters
      const topReporters = await db.collection('news').aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: '$reporterName', count: { $sum: 1 }, views: { $sum: '$views' } } },
        { $sort: { views: -1 } },
        { $limit: 5 }
      ]).toArray();

      return json({
        timeline: last7.map(x => ({ date: x._id.slice(5), news: x.count, views: x.views })),
        byCategory: byCat.map(x => ({ category: x._id, count: x.count, views: x.views })),
        byState: byState.map(x => ({ state: x._id, count: x.count })),
        topReporters: topReporters.map(x => ({ name: x._id, news: x.count, views: x.views }))
      });
    }

    // ============ STATE PAGE DATA ============
    if (path.startsWith('state/') && method === 'GET') {
      const stateName = decodeURIComponent(path.split('/')[1]);
      const news = await db.collection('news').find(
        { state: stateName, status: 'approved' },
        { projection: { _id: 0 } }
      ).sort({ createdAt: -1 }).limit(20).toArray();
      const reporters = await db.collection('users').find(
        { state: stateName, role: 'reporter' },
        { projection: { password: 0, _id: 0 } }
      ).limit(10).toArray();
      const total = await db.collection('news').countDocuments({ state: stateName });
      const districts = (await db.collection('states').findOne({ name: stateName }))?.districts || [];
      return json({ state: stateName, news, reporters, total, districts });
    }

    return json({ error: 'Not found', path }, 404);
  } catch (e) {
    console.error('API error:', e);
    return json({ error: e.message || 'Server error' }, 500);
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
