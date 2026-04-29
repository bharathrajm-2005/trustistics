import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card } from '../components/ui';
import { CheckCircle, ShieldAlert, FileText, MapPin, Box, Thermometer, ShieldCheck, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { getShipment, fullVerify, getTimeline, type VerificationResult, type BackendShipment } from '../api/shipmentApi';

export function PublicVerify() {
  const { shipmentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState<BackendShipment | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!shipmentId) return;
      try {
        const [shipRes, verifyRes, timelineRes] = await Promise.all([
          getShipment(shipmentId),
          fullVerify(shipmentId).catch(() => null),
          getTimeline(shipmentId).catch(() => null),
        ]);
        if (shipRes.success && shipRes.data) {
          setShipment(shipRes.data);
        } else {
          setError('Shipment not found');
        }
        if (verifyRes?.success && verifyRes.data) {
          setVerification(verifyRes.data);
        }
        if (timelineRes?.success && timelineRes.data?.events) {
          setEvents(timelineRes.data.events);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load shipment');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [shipmentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <ShieldAlert className="w-16 h-16 text-red-400 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Shipment Not Found</h1>
        <p className="text-gray-500">{error || `No record for ${shipmentId}`}</p>
      </div>
    );
  }

  const isFlagged = verification?.verdict === 'FLAGGED' || (shipment.risk_score ?? 0) > 50;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Header Banner */}
      <div className={`w-full p-6 text-white text-center shadow-md ${isFlagged ? 'bg-red-600' : 'bg-green-600'}`}>
        <div className="max-w-md mx-auto flex flex-col items-center gap-3">
          {isFlagged ? (
             <ShieldAlert className="w-16 h-16 text-red-200 animate-pulse" />
          ) : (
             <CheckCircle className="w-16 h-16 text-green-200" />
          )}
          <h1 className="text-2xl font-black tracking-wide">
            {isFlagged ? 'SHIPMENT FLAGGED' : 'SHIPMENT VERIFIED'}
          </h1>
          <p className="text-sm font-medium opacity-90">
            {isFlagged 
              ? 'Critical anomalies detected in blockchain audit.' 
              : 'Safe to receive. Blockchain records verified.'}
          </p>
        </div>
      </div>

      <div className="w-full max-w-md p-4 space-y-4 -mt-2">
        <Card className="p-5 shadow-lg border-0 ring-1 ring-black/5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{shipment.product}</h2>
              <p className="text-sm text-gray-500 font-mono">ID: {shipment.shipment_id}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              isFlagged ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              Risk: {shipment.risk_score ?? 0}%
            </div>
          </div>
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex gap-3 items-start">
              <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Origin</p>
                <p className="text-sm font-medium text-gray-900">{shipment.origin}</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <MapPin className="w-5 h-5 text-teal-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Destination</p>
                <p className="text-sm font-medium text-gray-900">{shipment.destination}</p>
              </div>
            </div>
          </div>
          {shipment.blockchain_tx && (
            <div className="mt-4 p-2 bg-teal-50 rounded text-[10px] font-mono text-teal-700 break-all">
              TX: {shipment.blockchain_tx}
            </div>
          )}
        </Card>

        {verification && (
          <Card className="p-5 border-0 ring-1 ring-black/5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" /> Verification Summary
            </h3>
            <div className="space-y-2">
              {verification.reasons?.map((r, i) => (
                <p key={i} className="text-sm text-gray-600">• {r}</p>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-5 border-0 ring-1 ring-black/5 mb-8">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Box className="w-5 h-5 text-teal-600" /> Event Chain
          </h3>
          <div className="relative pl-6 space-y-6">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200"></div>
            {events.length > 0 ? events.map((item: any, idx: number) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[31px] p-1 rounded-full border-2 border-white bg-teal-500">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{item.event_type}</h4>
                  {item.location && <p className="text-xs text-gray-500 mt-1">{item.location}</p>}
                  {item.timestamp && <p className="text-xs text-gray-400">{format(new Date(item.timestamp), 'MMM dd, HH:mm')}</p>}
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-400">No events recorded yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
