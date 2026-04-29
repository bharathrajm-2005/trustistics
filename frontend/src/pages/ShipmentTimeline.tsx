import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Badge } from '../components/ui';
import { MapPin, FileText, CheckCircle2, AlertTriangle, Box, Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { getTimeline, getShipment } from '../api/shipmentApi';

export function ShipmentTimeline() {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';
  const [shipmentId, setShipmentId] = useState(initialId);
  const [events, setEvents] = useState<any[]>([]);
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialId) handleSearch(initialId);
  }, [initialId]);

  const handleSearch = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    try {
      const [timelineRes, shipmentRes] = await Promise.all([
        getTimeline(id),
        getShipment(id),
      ]);
      if (timelineRes.success) setEvents(timelineRes.data?.events || []);
      if (shipmentRes.success) setShipment(shipmentRes.data);
    } catch (err) {
      console.error('[ShipmentTimeline] Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
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
            {loading ? 'Loading...' : 'Load Timeline'}
          </button>
        </div>
      </Card>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      )}

      {!loading && events.length > 0 && (
        <Card className="p-8">
          <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Shipment History</h2>
              <p className="text-sm text-gray-500">Immutable blockchain records for {shipment?.shipment_id || shipmentId}</p>
            </div>
            <Badge variant={shipment?.status === 'FLAGGED' ? 'warning' : 'default'}>
              Status: {shipment?.status || 'CREATED'}
            </Badge>
          </div>

          <div className="relative pl-8 space-y-8">
            <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gray-200"></div>

            {events.map((item: any, idx: number) => (
              <div key={idx} className="relative">
                <div className={`absolute -left-[41px] p-1.5 rounded-full border-4 border-white bg-teal-500`}>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>

                <div className="p-6 rounded-xl border border-gray-100 bg-white shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.event_type}</h3>
                      {item.location && (
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4" /> {item.location}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {item.timestamp && (
                        <>
                          <span className="text-sm font-medium text-gray-900 block">{format(new Date(item.timestamp), 'MMM dd, yyyy')}</span>
                          <span className="text-xs text-gray-500">{format(new Date(item.timestamp), 'HH:mm a')}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {item.tx_hash && (
                    <div className="mt-2 p-2 bg-teal-50 rounded text-xs font-mono text-teal-700 break-all">
                      TX: {item.tx_hash}
                    </div>
                  )}

                  {item.data_hash && (
                    <div className="mt-1 text-xs font-mono text-gray-400 break-all">
                      Hash: {item.data_hash}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!loading && events.length === 0 && shipmentId && (
        <Card className="p-8 text-center text-gray-500">
          <p>No events found. Enter a valid shipment ID to see the timeline.</p>
        </Card>
      )}
    </div>
  );
}
