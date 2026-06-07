'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { fetchLeadById, updateLead } from '@/app/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { token, loading } = useAuth();
  const [lead, setLead] = useState(null);
  const [loading2, setLoading2] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (loading) return;
    if (!token) {
      router.push('/login');
      return;
    }

    const loadLead = async () => {
      try {
        const data = await fetchLeadById(token, params.id);
        setLead(data);
        setFormData(data);
      } catch (error) {
        console.error('[v0] Load lead error:', error);
      } finally {
        setLoading2(false);
      }
    };

    loadLead();
  }, [token, loading, router, params.id]);

  const handleSave = async () => {
    try {
      await updateLead(token, params.id, formData);
      setLead(formData);
      setEditing(false);
      alert('Lead updated successfully');
    } catch (error) {
      console.error('[v0] Update lead error:', error);
      alert('Failed to update lead');
    }
  };

  if (loading || loading2) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!lead) {
    return <div className="flex items-center justify-center min-h-screen">Lead not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <Link href="/leads" className="text-gray-600 hover:text-gray-900 mb-2">
              ← Back to Leads
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{lead.firstName} {lead.lastName}</h1>
          </div>
          {!editing && <Button onClick={() => setEditing(true)}>Edit</Button>}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div>
                      <label className="text-sm font-medium">First Name</label>
                      <Input
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Last Name</label>
                      <Input
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Phone</label>
                      <Input
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="opportunity">Opportunity</option>
                        <option value="negotiation">Negotiation</option>
                        <option value="closed-won">Closed Won</option>
                        <option value="closed-lost">Closed Lost</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave}>Save</Button>
                      <Button variant="outline" onClick={() => {
                        setEditing(false);
                        setFormData(lead);
                      }}>Cancel</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{lead.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{lead.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-medium capitalize">{lead.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Value</p>
                      <p className="font-medium">${lead.value.toLocaleString()}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-600">{lead.notes || 'No notes added'}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Source</p>
                  <p className="font-medium capitalize">{lead.source}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium">{new Date(lead.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="font-medium">{new Date(lead.updatedAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
