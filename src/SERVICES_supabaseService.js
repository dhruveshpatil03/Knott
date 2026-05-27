// Service layer for all Supabase database operations
import { supabase } from './CONFIG_supabase';
import { calculatePlatformFee, calculateEscrowRelease, detectLeakage } from './LIB_utils';

// ============ LISTINGS SERVICE ============

export const listingsService = {
  getListings: async (filters = {}) => {
    let query = supabase
      .from('listings')
      .select('*, users(name, trust_score, is_verified, is_power_seller)')
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters.category) query = query.eq('category', filters.category);
    if (filters.condition) query = query.eq('condition', filters.condition);
    if (filters.area) query = query.eq('area', filters.area);
    if (filters.minPrice) query = query.gte('price', filters.minPrice);
    if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  getListingById: async (id) => {
    const { data, error } = await supabase
      .from('listings')
      .select('*, users(name, trust_score, is_verified, is_power_seller, id)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  getUserListings: async (userId) => {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  createListing: async (listingData, userId) => {
    const { data, error } = await supabase
      .from('listings')
      .insert([{ ...listingData, seller_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateListing: async (id, updates) => {
    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // BUG FIX: removed supabase.raw() which doesn't exist in v2.
  // Uses an RPC function; falls back to a no-op on error (view count is non-critical).
  incrementViews: async (id) => {
    try {
      await supabase.rpc('increment_views', { listing_id: id });
    } catch {
      // Non-critical — silently ignore if RPC doesn't exist
    }
  },

  featureListing: async (id, days = 7) => {
    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + days);

    const { data, error } = await supabase
      .from('listings')
      .update({ is_featured: true, featured_until: featuredUntil.toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  markAsSold: async (id) => {
    const { data, error } = await supabase
      .from('listings')
      .update({ status: 'sold' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteListing: async (id) => {
    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (error) throw error;
  },
};

// ============ ORDERS SERVICE ============

export const ordersService = {
  getBuyerOrders: async (userId) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, listings(title, images), users(name)')
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  getSellerOrders: async (userId) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, listings(title, images), users(name)')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  getOrderById: async (id) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, listings(*, users(name, is_verified)), users(name)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  createOrder: async (orderData) => {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateOrderStatus: async (id, status, updates = {}) => {
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString(), ...updates })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  markAsPaid: async (id, razorpayOrderId, razorpayPaymentId) => {
    const releaseAt = calculateEscrowRelease(new Date().toISOString(), 48);
    return ordersService.updateOrderStatus(id, 'paid', {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      escrow_release_at: releaseAt,
    });
  },

  markAsDelivered: async (id) => {
    const releaseAt = calculateEscrowRelease(new Date().toISOString(), 48);
    return ordersService.updateOrderStatus(id, 'delivered', {
      escrow_release_at: releaseAt,
    });
  },

  // BUG FIX: createDispute was missing entirely — Dispute page called this and crashed.
  createDispute: async (disputeData) => {
    const { data, error } = await supabase
      .from('disputes')
      .insert([disputeData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ============ MESSAGES SERVICE ============

export const messagesService = {
  // BUG FIX: previous impl always filtered by listing_id=null for order chats.
  // Now correctly builds the query based on which ID is provided.
  getMessages: async (listingId, orderId = null) => {
    let query = supabase
      .from('messages')
      .select('*, users(name, avatar_url)')
      .order('created_at', { ascending: true });

    if (listingId) query = query.eq('listing_id', listingId);
    if (orderId) query = query.eq('order_id', orderId);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  getListingMessages: (listingId) => messagesService.getMessages(listingId, null),
  getOrderMessages: (orderId) => messagesService.getMessages(null, orderId),

  sendMessage: async (messageData) => {
    const leakage = detectLeakage(messageData.content);
    if (leakage.length > 0) messageData.is_flagged = true;

    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select()
      .single();

    if (error) throw error;

    if (leakage.length > 0) {
      await usersService.incrementWarningCount(messageData.sender_id);
    }

    return { data, flagged: leakage.length > 0, leakageTypes: leakage };
  },

  subscribeToMessages: (listingId, callback) => {
    return supabase
      .channel(`messages:${listingId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `listing_id=eq.${listingId}`,
      }, callback)
      .subscribe();
  },
};

// ============ USERS SERVICE ============

export const usersService = {
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Alias used by Profile page
  getUserProfile: async (userId) => usersService.getProfile(userId),

  getPublicProfile: async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select(`*, listings(id, title, images, price, status), reviews(rating, comment, created_at, users(name))`)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Alias used by Profile page
  updateUserProfile: async (userId, updates) => usersService.updateProfile(userId, updates),

  // BUG FIX: was patched as a mutation at the bottom of the file. Now a proper method.
  // Uses upsert to safely handle the case where the profile already exists.
  createUserProfile: async (profileData) => {
    const { data, error } = await supabase
      .from('users')
      .upsert([profileData], { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  incrementWarningCount: async (userId) => {
    const user = await usersService.getProfile(userId);
    const newCount = (user.warning_count || 0) + 1;
    const updates = { warning_count: newCount };

    if (newCount >= 5) {
      const suspendUntil = new Date();
      suspendUntil.setDate(suspendUntil.getDate() + 7);
      updates.is_suspended = true;
      updates.suspended_until = suspendUntil.toISOString();
    }

    return usersService.updateProfile(userId, updates);
  },

  updateTrustScore: async (userId, score) => {
    return usersService.updateProfile(userId, { trust_score: Math.min(score, 100) });
  },
};

// ============ REVIEWS SERVICE ============

export const reviewsService = {
  createReview: async (reviewData) => {
    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getReviewsForUser: async (userId) => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, users(name, avatar_url)')
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Alias used by Profile page
  getProfileReviews: async (userId) => reviewsService.getReviewsForUser(userId),
};

// ============ NOTIFICATIONS SERVICE ============

export const notificationsService = {
  getNotifications: async (userId) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Alias used by Notifications page
  getUserNotifications: async (userId) => notificationsService.getNotifications(userId),

  createNotification: async (notificationData) => {
    const { error } = await supabase.from('notifications').insert([notificationData]);
    if (error) throw error;
  },

  markAsRead: async (notificationId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  // BUG FIX: was using field `read` instead of `is_read`.
  markAllAsRead: async (userId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);

    if (error) throw error;
  },

  subscribeToNotifications: (userId, callback) => {
    return supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, callback)
      .subscribe();
  },
};
