import { useState, useEffect } from 'react';
import { Card, Badge } from '../components/ui';
import { Package, CheckCircle2, AlertTriangle, Truck, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listShipments, getAnalyticsSummary, type BackendShipment } from '../api/shipmentApi';

export function Dashboard() {
  const [shipments, setShipments] = useState<BackendShipment[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [shipRes, analyticsRes] = await Promise.all([
          listShipments(),
          getAnalyticsSummary().catch(() => null),
        ]);
        if (shipRes.success) setShipments(shipRes.data || []);
        if (analyticsRes?.success) setSummary(analyticsRes.data);
      } catch (err) {
        console.error('[Dashboard] Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalShipments = summary?.shipments?.total ?? shipments.length;
  const byStatus = summary?.shipments?.by_status ?? {};
  const stats = [
    { label: 'Total Shipments', value: totalShipments, icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Active / In Transit', value: (byStatus['CREATED'] ?? 0) + (byStatus['IN_TRANSIT'] ?? 0) + (byStatus['CUSTODY_TRANSFER'] ?? 0), icon: Truck, color: 'text-teal-600', bg: 'bg-teal-100' },
    { label: 'Flagged', value: byStatus['FLAGGED'] ?? 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Delivered', value: byStatus['DELIVERED'] ?? 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  const mapStatus = (s?: string): 'Active' | 'Delivered' | 'Flagged' => {
    if (!s) return 'Active';
    if (s === 'DELIVERED') return 'Delivered';
    if (s === 'FLAGGED' || s === 'REJECTED') return 'Flagged';
    return 'Active';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <span className="ml-3 text-gray-500">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="p-6 flex items-center gap-4">
              <div className={`p-4 rounded-full ${stat.bg} ${stat.color}`}>
                <Icon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Recent Shipments</h2>
          <Link to="/supplier/analytics" className="text-sm text-teal-600 font-medium hover:text-teal-700">View All Analytics &rarr;</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Shipment ID</th>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Risk Score</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shipments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No shipments yet. Create your first shipment to get started.
                  </td>
                </tr>
              ) : (
                shipments.map((shipment) => {
                  const displayStatus = mapStatus(shipment.status);
                  const riskScore = shipment.risk_score ?? 0;
                  return (
                    <tr key={shipment.shipment_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{shipment.shipment_id}</td>
                      <td className="px-6 py-4 text-gray-600">{shipment.product}</td>
                      <td className="px-6 py-4">
                        <Badge variant={
                          displayStatus === 'Active' ? 'default' : 
                          displayStatus === 'Delivered' ? 'success' : 'danger'
                        }>
                          {shipment.status || 'CREATED'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${riskScore > 50 ? 'bg-red-500' : riskScore > 20 ? 'bg-amber-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(riskScore, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{riskScore}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link to={`/supplier/tracking?id=${shipment.shipment_id}`} className="text-teal-600 hover:text-teal-800 font-medium text-sm">
                          Track
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
