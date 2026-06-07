'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { fetchProducts } from '@/app/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ProductsPage() {
  const router = useRouter();
  const { token, loading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading2, setLoading2] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!token) {
      router.push('/login');
      return;
    }

    const loadProducts = async () => {
      try {
        const data = await fetchProducts(token, { limit: 50 });
        setProducts(data.products);
      } catch (error) {
        console.error('[v0] Load products error:', error);
      } finally {
        setLoading2(false);
      }
    };

    loadProducts();
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
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                <CardDescription className="line-clamp-2">{product.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-medium">{product.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="text-2xl font-bold">${product.price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Stock</p>
                  <p className="font-medium">{product.stock} units</p>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {product.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-gray-600">No products found</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
