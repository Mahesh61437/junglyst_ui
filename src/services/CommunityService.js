/**
 * Junglyst Community API client.
 *
 * All endpoints live under /api/community/. Auth is via the global JWT
 * interceptor in services/api.js — anonymous reads work, writes require login.
 */
import api from './api';


export const CommunityService = {
  // ── Posts ──────────────────────────────────────────────────────────────
  listPosts: async ({ page = 1, pageSize = 20 } = {}) => {
    const { data } = await api.get('/community/posts/', {
      params: { page, page_size: pageSize },
    });
    return data;
  },

  getPost: async (id) => {
    const { data } = await api.get(`/community/posts/${id}/`);
    return data;
  },

  /**
   * payload: {
   *   body, post_type ('text' | 'image' | 'youtube' | 'vimeo'),
   *   youtube_url?, vimeo_url?, tagged_product_id?,
   *   tags?: string[], image_urls?: string[]
   * }
   */
  createPost: async (payload) => {
    const { data } = await api.post('/community/posts/', payload);
    return data;
  },

  updatePost: async (id, partial) => {
    const { data } = await api.patch(`/community/posts/${id}/`, partial);
    return data;
  },

  deletePost: async (id) => {
    const { data } = await api.delete(`/community/posts/${id}/`);
    return data;
  },

  togglePostLike: async (id) => {
    const { data } = await api.post(`/community/posts/${id}/like/`);
    return data; // { liked: boolean }
  },

  reportPost: async (id, { reason, details = '' }) => {
    const { data } = await api.post(`/community/posts/${id}/report/`, { reason, details });
    return data;
  },

  // ── Comments ───────────────────────────────────────────────────────────
  listComments: async (postId, { page = 1, pageSize = 20 } = {}) => {
    const { data } = await api.get(`/community/posts/${postId}/comments/`, {
      params: { page, page_size: pageSize },
    });
    return data;
  },

  createComment: async (postId, { body, parentId = null }) => {
    const payload = parentId ? { body, parent_id: parentId } : { body };
    const { data } = await api.post(`/community/posts/${postId}/comments/`, payload);
    return data;
  },

  updateComment: async (id, { body }) => {
    const { data } = await api.patch(`/community/comments/${id}/`, { body });
    return data;
  },

  deleteComment: async (id) => {
    const { data } = await api.delete(`/community/comments/${id}/`);
    return data;
  },

  toggleCommentLike: async (id) => {
    const { data } = await api.post(`/community/comments/${id}/like/`);
    return data;
  },

  reportComment: async (id, { reason, details = '' }) => {
    const { data } = await api.post(`/community/comments/${id}/report/`, { reason, details });
    return data;
  },

  // ── Profiles ───────────────────────────────────────────────────────────
  getMyProfile: async () => {
    const { data } = await api.get('/community/users/me/');
    return data;
  },

  updateMyProfile: async (partial) => {
    const { data } = await api.patch('/community/users/me/', partial);
    return data;
  },

  getProfileByHandle: async (handle) => {
    const { data } = await api.get(`/community/users/@${handle}/`);
    return data;
  },

  listUserPosts: async (handle, { page = 1, pageSize = 20 } = {}) => {
    const { data } = await api.get(`/community/users/@${handle}/posts/`, {
      params: { page, page_size: pageSize },
    });
    return data;
  },

  toggleFollowUser: async (userId) => {
    const { data } = await api.post(`/community/users/${userId}/follow/`);
    return data; // { following: boolean }
  },

  // ── Tags ───────────────────────────────────────────────────────────────
  listTags: async ({ q = '', page = 1 } = {}) => {
    const { data } = await api.get('/community/tags/', { params: { q, page } });
    return data;
  },

  getTag: async (slug) => {
    const { data } = await api.get(`/community/tags/${slug}/`);
    return data;
  },

  listTagPosts: async (slug, { page = 1, pageSize = 20 } = {}) => {
    const { data } = await api.get(`/community/tags/${slug}/posts/`, {
      params: { page, page_size: pageSize },
    });
    return data;
  },

  toggleFollowTag: async (slug) => {
    const { data } = await api.post(`/community/tags/${slug}/follow/`);
    return data;
  },
};


// ── Shared query keys (use these so cache invalidation stays consistent) ───
export const communityKeys = {
  posts:    ['community', 'posts'],
  post:     (id) => ['community', 'post', id],
  comments: (postId) => ['community', 'comments', postId],
  profile:  (handle) => ['community', 'profile', handle],
  myProfile:['community', 'profile', 'me'],
  tag:      (slug) => ['community', 'tag', slug],
  tagPosts: (slug) => ['community', 'tag', slug, 'posts'],
  userPosts:(handle) => ['community', 'user', handle, 'posts'],
};
