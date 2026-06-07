'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchLeads, fetchCompanies, fetchProducts, fetchNotifications } from '@/app/hooks/useApi';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const { user, token, logout, loading } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading2, setLoading2] = useState(true);

  useEffect(() => {
    if (loading) return;
    
    if (!token) {
      router.push('/login');
      return;
    }

    const loadDashboard = async () => {
      try {
        const [leads, companies, products, notifications] = await Promise.all([
          fetchLeads(token, { limit: 5 }),
          fetchCompanies(token, { limit: 10 }),
          fetchProducts(token, { limit: 10 }),
          fetchNotifications(token),
        ]);

        setStats({
          totalLeads: leads.pagination.total,
          totalCompanies: companies.pagination.total,
          totalProducts: products.pagination.total,
          unreadNotifications: notifications.unreadCount,
        });

        setRecentLeads(leads.leads.slice(0, 5));
      } catch (error) {
        console.error('[v0] Dashboard load error:', error);
      } finally {
        setLoading2(false);
      }
    };

    loadDashboard();
  }, [token, loading, router]);

  if (loading || loading2) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enterprise CRM</h1>
            <p className="text-gray-600">{user?.firstName} {user?.lastName} ({user?.role})</p>
          </div>
          <Button onClick={logout} variant="outline">
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.totalLeads}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.totalCompanies}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.totalProducts}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Unread Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.unreadNotifications}</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Leads Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>Latest leads in your system</CardDescription>
              </div>
              <Link href="/leads">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div key={lead._id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium">{lead.firstName} {lead.lastName}</p>
                    <p className="text-sm text-gray-600">{lead.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {lead.status}
                    </span>
                    <Link href={`/leads/${lead._id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/leads">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Leads</CardTitle>
                <CardDescription>Manage your sales leads</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/companies">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Companies</CardTitle>
                <CardDescription>Manage companies and organizations</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/products">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Products</CardTitle>
                <CardDescription>Manage your product catalog</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
