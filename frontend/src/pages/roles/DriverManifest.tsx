import { useState, useEffect } from 'react';
import { Card, Badge } from '../../components/ui';
import { Truck, MapPin, Package, ThermometerSnowflake, Navigation, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listShipments, type BackendShipment } from '../../api/shipmentApi';

export function DriverManifest() {
  const vehicleId = "TRK-8842-REF";
  const driverName = "Alex Driver";
  const [shipments, setShipments] = useState<BackendShipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await listShipments();
        if (res.success) setShipments(res.data || []);
      } catch (err) {
        console.error('[DriverManifest] Failed to load:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filter for non-delivered shipments
  const activeManifest = shipments.filter(s => s.status !== 'DELIVERED' && s.status !== 'REJECTED');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Vehicle Status Header */}
      <Card className="p-6 bg-teal-950 text-white border-teal-900">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-500/20 rounded-xl border border-blue-500/30">
              <Truck className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <p className="text-blue-400 text-sm font-medium mb-1">Active Vehicle Manifest</p>
              <h2 className="text-2xl font-bold">{vehicleId}</h2>
              <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                GPS Active • Driven by {driverName}
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 min-w-[140px]">
              <p className="text-slate-400 text-xs mb-1">Fleet Temp Target</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-blue-400">-70°C</span>
                <ThermometerSnowflake className="w-5 h-5 text-blue-400 mb-1" />
              </div>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 min-w-[140px]">
              <p className="text-slate-400 text-xs mb-1">Total Packages</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">{activeManifest.length}</span>
                <Package className="w-5 h-5 text-slate-400 mb-1" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-between items-center px-2 pt-4">
        <h3 className="text-lg font-semibold text-gray-900">Current Load</h3>
        <Link 
          to="/driver/handoff"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Navigation className="w-4 h-4" /> Batch Update Location
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 flex items-center justify-center h-32">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
        ) : (
        activeManifest.map((shipment) => (
          <Card key={shipment.shipment_id} className="p-6 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
              <div>
                <h4 className="font-bold text-gray-900 text-lg">{shipment.shipment_id}</h4>
                <p className="text-teal-600 font-medium text-sm">{shipment.product}</p>
              </div>
              <Badge variant="warning">In Transit</Badge>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Destination</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{shipment.destination}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ThermometerSnowflake className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Required Temp Range</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{shipment.min_temp_celsius ?? 2}°C to {shipment.max_temp_celsius ?? 8}°C</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link 
                to="/driver/handoff"
                className="flex-1 py-2 text-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 text-gray-700 hover:text-blue-700 font-medium rounded-lg text-sm transition-colors"
              >
                Log Checkpoint
              </Link>
              <Link 
                to={`/supplier/tracking?id=${shipment.shipment_id}`}
                className="flex-1 py-2 text-center bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-200 text-gray-700 hover:text-teal-700 font-medium rounded-lg text-sm transition-colors"
              >
                View Details
              </Link>
            </div>
          </Card>
        ))
        )}
      </div>
      
      {activeManifest.length === 0 && (
        <Card className="p-12 text-center">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Vehicle is Empty</h3>
          <p className="text-gray-500">No active shipments assigned to {vehicleId} right now.</p>
        </Card>
      )}
    </div>
  );
}
