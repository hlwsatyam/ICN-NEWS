import { useAuth } from '@/app/context/AuthContext';

export function useApi() {
  const { token } = useAuth();

  const apiCall = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Handle unauthorized
        window.location.href = '/login';
      }
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  };

  return { apiCall };
}

export async function fetchLeads(token, filters = {}) {
  const query = new URLSearchParams(filters).toString();
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leads?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export async function fetchLeadById(token, id) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leads/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export async function createLead(token, leadData) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(leadData),
  });
  return response.json();
}

export async function updateLead(token, id, leadData) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leads/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(leadData),
  });
  return response.json();
}

export async function deleteLead(token, id) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leads/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export async function fetchCompanies(token, filters = {}) {
  const query = new URLSearchParams(filters).toString();
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/companies?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export async function fetchProducts(token, filters = {}) {
  const query = new URLSearchParams(filters).toString();
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export async function fetchNotifications(token) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export async function fetchUsers(token) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export async function uploadDocument(token, formData) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return response.json();
}
