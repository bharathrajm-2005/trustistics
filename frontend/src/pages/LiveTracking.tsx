import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Badge } from '../components/ui';
import { MapPin, QrCode, Search, Thermometer, Clock, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getShipment, getTemperatureLogs, type BackendShipment } from '../api/shipmentApi';

export function LiveTracking() {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';
  const [shipmentId, setShipmentId] = useState(initialId);
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BackendShipment | null>(null);
  const [tempLogs, setTempLogs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialId) handleSearch(initialId);
  }, [initialId]);

  const handleSearch = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getShipment(id);
      if (res.success && res.data) {
        setData(res.data);
        // Also fetch temperature logs
        const tempRes = await getTemperatureLogs(id).catch(() => null);
        if (tempRes?.success) setTempLogs(tempRes.data || []);
      } else {
        setError('Shipment not found');
        setData(null);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch shipment');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const latestTemp = tempLogs.length > 0 ? tempLogs[0] : null;
  const currentTemp = latestTemp?.temperature_celsius ?? 0;
  const tempMin = data?.min_temp_celsius ?? 2;
  const tempMax = data?.max_temp_celsius ?? 8;

  const mapStatus = (s?: string) => {
    if (!s) return 'Active';
    if (s === 'DELIVERED') return 'Delivered';
    if (s === 'FLAGGED' || s === 'REJECTED') return 'Flagged';
    return 'Active';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="p-6 flex flex-col md:flex-row gap-4 justify-between items-center bg-white shadow-sm border-gray-100">
        <div className="flex w-full md:w-auto items-center gap-4">
          <div className="relative flex-1 md:w-80">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={shipmentId}
              onChange={(e) => setShipmentId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(shipmentId)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" 
              placeholder="Enter Shipment ID..." 
            />
          </div>
          <button 
            onClick={() => handleSearch(shipmentId)}
            disabled={loading}
            className="px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-70"
          >
            {loading ? 'Loading...' : 'Track'}
          </button>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsScanning(!isScanning)}
            className="px-4 py-2 bg-teal-950 text-white font-medium rounded-lg hover:bg-teal-900 flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" /> {isScanning ? 'Cancel Scan' : 'Scan QR'}
          </button>
        </div>
      </Card>

      {error && (
        <Card className="p-6 text-center text-red-600">
          <p className="font-medium">{error}</p>
        </Card>
      )}

      {isScanning && (
        <Card className="p-8 text-center bg-gray-50 border-dashed">
          <div className="w-64 h-64 bg-gray-200 mx-auto rounded-lg flex items-center justify-center border-4 border-slate-300 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-teal-500 animate-[scan_2s_ease-in-out_infinite]"></div>
             <p className="text-gray-500 font-medium">Camera Feed</p>
          </div>
          <p className="mt-4 text-gray-600">Position QR code within the frame</p>
        </Card>
      )}

      {data && !isScanning && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{data.shipment_id}</h2>
                  <p className="text-gray-500">{data.product}</p>
                </div>
                <Badge variant={mapStatus(data.status) === 'Active' ? 'default' : mapStatus(data.status) === 'Delivered' ? 'success' : 'danger'}>
                  {data.status || 'CREATED'}
                </Badge>
              </div>

              <div className="h-64 bg-slate-100 rounded-xl flex items-center justify-center mb-6 relative overflow-hidden border border-gray-200">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                <div className="flex flex-col items-center gap-2 z-10">
                  <MapPin className="w-10 h-10 text-teal-600 animate-bounce" />
                  <div className="bg-white px-3 py-1 rounded-full shadow-md text-sm font-medium">
                    {data.status === 'DELIVERED' ? 'Delivered' : 'In Transit'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <p className="text-sm text-gray-500 mb-1">Source</p>
                  <p className="font-medium text-gray-900">{data.origin}</p>
                </div>
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <p className="text-sm text-gray-500 mb-1">Destination</p>
                  <p className="font-medium text-gray-900">{data.destination}</p>
                </div>
              </div>

              {data.blockchain_tx && (
                <div className="mt-4 p-3 bg-teal-50 rounded-lg border border-teal-100">
                  <p className="text-xs text-teal-700 font-medium">Blockchain TX</p>
                  <p className="text-xs font-mono text-teal-600 break-all">{data.blockchain_tx}</p>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-gray-400" /> Temperature Monitor
              </h3>
              
              <div className="flex justify-center mb-6">
                <div className="relative w-40 h-40 flex items-center justify-center rounded-full border-[12px] border-gray-100">
                  <div className={`absolute inset-0 rounded-full border-[12px] border-transparent border-t-teal-500 border-r-teal-500 transform rotate-45`}></div>
                  <div className="text-center">
                    <span className={`text-4xl font-bold ${currentTemp > tempMax || currentTemp < tempMin ? 'text-red-500' : 'text-gray-900'}`}>
                      {latestTemp ? `${currentTemp}°` : 'N/A'}
                    </span>
                    <span className="block text-xs text-gray-500 mt-1">{latestTemp ? 'Latest' : 'No data'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Min: <strong className="text-gray-900">{tempMin}°</strong></span>
                <span className="text-gray-500">Max: <strong className="text-gray-900">{tempMax}°</strong></span>
              </div>
              
              {latestTemp && (currentTemp > tempMax || currentTemp < tempMin) && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 animate-pulse shrink-0"></div>
                  Temperature breach detected! Outside safe operating range.
                </div>
              )}

              {tempLogs.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-gray-500">Recent Readings ({tempLogs.length})</p>
                  {tempLogs.slice(0, 5).map((log: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs text-gray-600 py-1 border-b border-gray-50">
                      <span className={log.is_breach ? 'text-red-600 font-medium' : ''}>{log.temperature_celsius}°C</span>
                      <span>{log.location || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" /> Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Created:</span>
                  <span className="font-medium">
                    {data.created_at ? formatDistanceToNow(new Date(data.created_at), { addSuffix: true }) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Updated:</span>
                  <span className="font-medium text-teal-600">
                    {data.updated_at ? formatDistanceToNow(new Date(data.updated_at), { addSuffix: true }) : 'Just now'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Risk Score:</span>
                  <span className={`font-medium ${(data.risk_score ?? 0) > 50 ? 'text-red-600' : 'text-green-600'}`}>
                    {data.risk_score ?? 0}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Events:</span>
                  <span className="font-medium">{data.events?.length ?? 0}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
