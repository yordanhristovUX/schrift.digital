import React, { useState } from 'react';
import { RefreshCw, Search, CheckCircle, AlertCircle } from 'lucide-react';

const SubscriptionManager: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDebug = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError(null);
    setDebugInfo(null);
    setSyncResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/debug-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to debug subscription');
      }

      const data = await response.json();
      setDebugInfo(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (stripeCustomerId?: string) => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError(null);
    setSyncResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          stripeCustomerId 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync subscription');
      }

      const data = await response.json();
      setSyncResult(data);
      
      // Refresh debug info after sync
      setTimeout(() => {
        handleDebug();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Subscription Manager</h1>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Debug User Subscription</h2>
            
            <div className="flex gap-4 mb-6">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter user email (e.g., yhristov.xyz@gmail.com)"
                className="flex-1 p-3 border border-gray-300 rounded-md"
              />
              <button
                onClick={handleDebug}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Search size={20} className="mr-2" />
                {loading ? 'Debugging...' : 'Debug'}
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center">
                <AlertCircle size={20} className="mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            {syncResult && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center">
                <CheckCircle size={20} className="mr-2 flex-shrink-0" />
                {syncResult.message}
              </div>
            )}

            {debugInfo && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Supabase User</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <pre className="text-sm">{JSON.stringify(debugInfo.user, null, 2)}</pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Supabase Customer Mapping</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <pre className="text-sm">
                        {debugInfo.supabaseCustomer 
                          ? JSON.stringify(debugInfo.supabaseCustomer, null, 2)
                          : 'No customer mapping found'
                        }
                      </pre>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Stripe Customers</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    {debugInfo.stripeCustomers.length > 0 ? (
                      debugInfo.stripeCustomers.map((customer: any, index: number) => (
                        <div key={customer.id} className="mb-4 p-3 border border-gray-200 rounded">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <strong>Customer ID:</strong> {customer.id}<br />
                              <strong>Email:</strong> {customer.email}<br />
                              <strong>Created:</strong> {new Date(customer.created * 1000).toLocaleString()}
                            </div>
                            <button
                              onClick={() => handleSync(customer.id)}
                              disabled={loading}
                              className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                            >
                              <RefreshCw size={16} className="mr-1" />
                              Sync
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>No Stripe customers found for this email</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Stripe Subscriptions</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    {debugInfo.subscriptions.length > 0 ? (
                      debugInfo.subscriptions.map((customerSubs: any, index: number) => (
                        <div key={index} className="mb-4">
                          <h4 className="font-medium mb-2">Customer: {customerSubs.customerId}</h4>
                          {customerSubs.subscriptions.length > 0 ? (
                            customerSubs.subscriptions.map((sub: any) => (
                              <div key={sub.id} className="ml-4 p-3 border border-gray-200 rounded mb-2">
                                <strong>Subscription ID:</strong> {sub.id}<br />
                                <strong>Status:</strong> <span className={`px-2 py-1 rounded text-sm ${
                                  sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>{sub.status}</span><br />
                                <strong>Price ID:</strong> {sub.items.data[0]?.price?.id}<br />
                                <strong>Current Period:</strong> {new Date(sub.current_period_start * 1000).toLocaleDateString()} - {new Date(sub.current_period_end * 1000).toLocaleDateString()}
                              </div>
                            ))
                          ) : (
                            <p className="ml-4 text-gray-600">No subscriptions found</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p>No subscription data available</p>
                    )}
                  </div>
                </div>

                {debugInfo.supabaseSubscription && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Current Supabase Subscription</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <pre className="text-sm">{JSON.stringify(debugInfo.supabaseSubscription, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {debugInfo.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
                    <div className="bg-yellow-50 p-4 rounded-md">
                      <ul className="list-disc list-inside space-y-1">
                        {debugInfo.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="text-yellow-800">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManager;

export default SubscriptionManager