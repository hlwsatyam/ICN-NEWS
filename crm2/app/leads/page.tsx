'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { fetchLeads } from '@/app/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

const statusColors = {
  new: 'bg-gray-100 text-gray-800',
  contacted: 'bg-blue-100 text-blue-800',
  qualified: 'bg-purple-100 text-purple-800',
  opportunity: 'bg-yellow-100 text-yellow-800',
  negotiation: 'bg-orange-100 text-orange-800',
  'closed-won': 'bg-green-100 text-green-800',
  'closed-lost': 'bg-red-100 text-red-800',
};

export default function LeadsPage() {
  const router = useRouter();
  const { token, loading } = useAuth();
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading2, setLoading2] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, skip: 0 });

  useEffect(() => {
    if (loading) return;
    if (!token) {
      router.push('/login');
      return;
    }

    const loadLeads = async () => {
      try {
        const data = await fetchLeads(token, { search, status, limit: 20, skip: 0 });
        setLeads(data.leads);
        setPagination(data.pagination);
      } catch (error) {
        console.error('[v0] Load leads error:', error);
      } finally {
        setLoading2(false);
      }
    };

    loadLeads();
  }, [token, loading, router, search, status]);

  if (loading || loading2) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 mb-2">
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          </div>
          <Link href="/leads/new">
            <Button>New Lead</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Input
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-4 py-2 border rounded-md"
              >
                <option value="">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="opportunity">Opportunity</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed-won">Closed Won</option>
                <option value="closed-lost">Closed Lost</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>Leads List</CardTitle>
            <CardDescription>Total: {pagination.total} leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leads.length === 0 ? (
                <p className="text-gray-600 py-4">No leads found</p>
              ) : (
                leads.map((lead) => (
                  <Link key={lead._id} href={`/leads/${lead._id}`}>
                    <div className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex-1">
                        <p className="font-medium">{lead.firstName} {lead.lastName}</p>
                        <p className="text-sm text-gray-600">{lead.email}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 text-sm rounded-full font-medium ${statusColors[lead.status]}`}>
                          {lead.status}
                        </span>
                        <span className="text-gray-600">${lead.value.toLocaleString()}</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
