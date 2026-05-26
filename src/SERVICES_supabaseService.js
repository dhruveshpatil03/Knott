// Service layer for all Supabase database operations
import { supabase } from './CONFIG_supabase';
import { calculatePlatformFee, calculateEscrowRelease, detectLeakage } from './LIB_utils';

// ============ LISTINGS SERVICE ============

export const listingsService = {
  // Get active listings with optional filters
  getListings: async (filters = {}) => {
    let query = supabase
      .from('listings')
      .select('*, users(name, trust_score, is_verified, is_power_seller)')
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.condition) {
      query = query.eq('condition', filters.condition);
    }
    if (filters.area) {
      query = query.eq('area', filters.area);
    }
    if (filters.minPrice) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get single listing by ID
  getListingById: async (id) => {
    const { data, error } = await supabase
      .from('listings')
      .select('*, users(name, trust_score, is_verified, is_power_seller, id)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get user's listings
  getUserListings: async (userId) => {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create listing
  createListing: async (listingData, userId) => {
    const { data, error } = await supabase
      .from('listings')
      .insert([{
        ...listingData,
        seller_id: userId,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update listing
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

  // Increment view count
  incrementViews: async (id) => {
    const { error } = await supabase.rpc('increment_views', {
      listing_id: id,
    }).catch(() => {
      // Fallback if RPC not available
      return supabase
        .from('listings')
        .update({ views: supabase.raw('views + 1') })
        .eq('id', id);
    });

    if (error) console.error('Error incrementing views:', error);
  },

  // Mark listing as featured
  featureListing: async (id, days = 7) => {
    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + days);

    const { data, error } = await supabase
      .from('listings')
      .update({
        is_featured: true,
        featured_until: featuredUntil.toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mark listing as sold
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

  // Delete listing
  deleteListing: async (id) => {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ============ ORDERS SERVICE ============

export const ordersService = {
  // Get buyer's orders
  getBuyerOrders: async (userId) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, listings(title, images), users(name)')
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get seller's orders
  getSellerOrders: async (userId) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, listings(title, images), users(name)')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get order by ID
  getOrderById: async (id) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, listings(*, users(name, phone, is_verified)), users(name, phone)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create order
  createOrder: async (orderData) => {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update order status
  updateOrderStatus: async (id, status, updates = {}) => {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...updates,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mark order as paid (with escrow release time)
  markAsPaid: async (id, razorpayOrderId, razorpayPaymentId) => {
    const releaseAt = calculateEscrowRelease(new Date().toISOString(), 48);

    return ordersService.updateOrderStatus(id, 'paid', {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      escrow_release_at: releaseAt,
    });
  },

  // Mark as delivered
  markAsDelivered: async (id) => {
    const releaseAt = calculateEscrowRelease(new Date().toISOString(), 48);

    return ordersService.updateOrderStatus(id, 'delivered', {
      escrow_release_at: releaseAt,
    });
  },
};

// ============ MESSAGES SERVICE ============

export const messagesService = {
  // Get messages for listing/order
  getMessages: async (listingId, orderId = null) => {
    let query = supabase
      .from('messages')
      .select('*, users(name, avatar_url)')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: true });

    if (orderId) {
      query = query.eq('order_id', orderId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Send message
  sendMessage: async (messageData) => {
    // Check for leakage patterns
    const leakage = detectLeakage(messageData.content);

    if (leakage.length > 0) {
      // Message will be flagged
      messageData.is_flagged = true;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select()
      .single();

    if (error) throw error;

    if (leakage.length > 0) {
      // Increment user warning count
      await usersService.incrementWarningCount(messageData.sender_id);
    }

    return { data, flagged: leakage.length > 0, leakageTypes: leakage };
  },

  // Subscribe to message updates
  subscribeToMessages: (listingId, callback) => {
    const subscription = supabase
      .channel(`messages:${listingId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `listing_id=eq.${listingId}`,
      }, callback)
      .subscribe();

    return subscription;
  },
};

// ============ USERS SERVICE ============

export const usersService = {
  // Get user profile
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Get user with reviews and listings
  getPublicProfile: async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        listings(id, title, images, price, status),
        reviews(rating, comment, created_at, users(name))
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Update profile
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

  // Increment warning count
  incrementWarningCount: async (userId) => {
    const user = await usersService.getProfile(userId);
    const newCount = (user.warning_count || 0) + 1;

    const updates = { warning_count: newCount };

    if (newCount >= 5) {
      // Suspend for 7 days
      const suspendUntil = new Date();
      suspendUntil.setDate(suspendUntil.getDate() + 7);
      updates.is_suspended = true;
      updates.suspended_until = suspendUntil.toISOString();
    } else if (newCount >= 3) {
      // Hide all listings
      // This is handled in listing queries
    }

    return usersService.updateProfile(userId, updates);
  },

  // Update trust score
  updateTrustScore: async (userId, score) => {
    return usersService.updateProfile(userId, { trust_score: Math.min(score, 100) });
  },
};

// ============ REVIEWS SERVICE ============

export const reviewsService = {
  // Create review
  createReview: async (reviewData) => {
    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get reviews for user
  getReviewsForUser: async (userId) => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, users(name, avatar_url)')
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};

// ============ NOTIFICATIONS SERVICE ============

export const notificationsService = {
  // Get notifications
  getNotifications: async (userId) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create notification
  createNotification: async (notificationData) => {
    const { error } = await supabase
      .from('notifications')
      .insert([notificationData]);

    if (error) throw error;
  },

  // Mark as read
  markAsRead: async (notificationId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Subscribe to notifications
  subscribeToNotifications: (userId, callback) => {
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, callback)
      .subscribe();

    return subscription;
  },
};
