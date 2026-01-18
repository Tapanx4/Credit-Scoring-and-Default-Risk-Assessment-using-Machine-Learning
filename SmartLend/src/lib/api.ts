
import axios from 'axios';
import { supabase } from './supabase';

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // console.log("🔑 Token attached:", token.substring(0, 10) + "...");
  } else {
    console.warn("⚠️ No auth token found in session!");
  }
  
  return config;
});

// Response Interceptor: Handle 401s (Auto-Logout)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("🔒 Unauthorized! Token invalid or expired.");
      // Optional: Force logout if token is bad
      // supabase.auth.signOut();
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);