'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { fetchCompanies } from '@/app/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const statusColors = {
  prospect: 'bg-blue-100 text-blue-800',
  customer: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
};

export default function CompaniesPage() {
  const router = useRouter();
  const { token, loading } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading2, setLoading2] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!token) {
      router.push('/login');
      return;
    }

    const loadCompanies = async () => {
      try {
        const data = await fetchCompanies(token, { limit: 50 });
        setCompanies(data.companies);
      } catch (error) {
        console.error('[v0] Load companies error:', error);
      } finally {
        setLoading2(false);
      }
    };

    loadCompanies();
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
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 mb-2">
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {companies.map((company) => (
            <Card key={company._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{company.name}</h3>
                    <p className="text-sm text-gray-600">{company.description}</p>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Industry</p>
                        <p className="font-medium">{company.industry || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Employees</p>
                        <p className="font-medium">{company.employees}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Leads</p>
                        <p className="font-medium">{company.leads?.length || 0}</p>
                      </div>
                      <div>
                        <span className={`px-3 py-1 rounded text-sm font-medium ${statusColors[company.status]}`}>
                          {company.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {companies.length === 0 && (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-gray-600">No companies found</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
