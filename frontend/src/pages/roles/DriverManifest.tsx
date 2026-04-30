import { useState, useEffect, useCallback } from 'react';
import { Card, Badge, RiskBadge, ProgressTracker } from '../../components/ui';
import { Truck, MapPin, Package, ThermometerSnowflake, Thermometer, Navigation, Loader2, ChevronDown, ChevronUp, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listShipments, recordHandoff, logTemperature, type BackendShipment } from '../../api/shipmentApi';

export function DriverManifest() {
  const vehicleId = "TRK-8842-REF";
  const driverName = "Alex Driver";
  const [shipments, setShipments] = useState<BackendShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Inline form state
  const [actionType, setActionType] = useState<'temp' | 'handoff' | null>(null);
  const [formLocation, setFormLocation] = useState('');
  const [formTemp, setFormTemp] = useState('');
  const [formToParty, setFormToParty] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionResult, setActionResult] = useState<{ id: string; msg: string } | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await listShipments();
      if (res.success) setShipments(res.data || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('[DriverManifest] Failed to load:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 15_000);
    return () => clearInterval(interval);
  }, [load]);

  const activeManifest = shipments.filter(s => s.status !== 'DELIVERED' && s.status !== 'REJECTED');

  const handleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setActionType(null);
    } else {
      setExpandedId(id);
      setActionType(null);
      setFormLocation('');
      setFormTemp('');
      setFormToParty('');
      setFormNotes('');
      setActionResult(null);
    }
  };

  const handleLogTemp = async (shipmentId: string) => {
    if (!formTemp || !formLocation) return;
    setSubmitting(true);
    try {
      await logTemperature(shipmentId, {
        temperature_celsius: parseFloat(formTemp),
        location: formLocation,
        logged_by: driverName,
      });
      setActionResult({ id: shipmentId, msg: `✔ Temperature ${formTemp}°C logged at ${formLocation}` });
      setFormTemp('');
      setFormLocation('');
      setActionType(null);
      load(true);
    } catch (err: any) {
      setActionResult({ id: shipmentId, msg: `✖ Failed: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleHandoff = async (shipmentId: string) => {
    if (!formLocation || !formToParty) return;
    setSubmitting(true);
    try {
      const res = await recordHandoff(shipmentId, {
        from_party: 'Driver',
        to_party: formToParty,
        location: formLocation,
        notes: formNotes || undefined,
        signed_by: driverName,
      });
      if (formTemp) {
        await logTemperature(shipmentId, {
          temperature_celsius: parseFloat(formTemp),
          location: formLocation,
          logged_by: driverName,
        });
      }
      setActionResult({ id: shipmentId, msg: `✔ Handoff to ${formToParty} recorded. TX: ${res.data?.blockchain_tx || 'N/A'}` });
      setFormLocation('');
      setFormToParty('');
      setFormTemp('');
      setFormNotes('');
      setActionType(null);
      load(true);
    } catch (err: any) {
      setActionResult({ id: shipmentId, msg: `✖ Failed: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const statusLabel = (s?: string) => {
    if (!s) return 'Created';
    const map: Record<string, string> = {
      CREATED: 'Created', IN_TRANSIT: 'In Transit', IN_STORAGE: 'In Storage',
      AT_CUSTOMS: 'At Customs', DELIVERED: 'Delivered', FLAGGED: 'Flagged',
      REJECTED: 'Rejected', CUSTODY_TRANSFER: 'In Transit',
    };
    return map[s] || s;
  };

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
                <span className="text-slate-500 ml-2">• Last: {lastRefreshed.toLocaleTimeString()}</span>
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 min-w-[140px]">
              <p className="text-slate-400 text-xs mb-1">Total Packages</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">{activeManifest.length}</span>
                <Package className="w-5 h-5 text-slate-400 mb-1" />
              </div>
            </div>
            <button onClick={() => load()} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-colors flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      </Card>

      <div className="flex justify-between items-center px-2 pt-4">
        <h3 className="text-lg font-semibold text-gray-900">Current Load</h3>
        <p className="text-xs text-gray-400">Auto-refreshes every 15s</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
        ) : (
        activeManifest.map((shipment) => {
          const isExpanded = expandedId === shipment.shipment_id;
          return (
          <Card key={shipment.shipment_id} className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            {/* Card Header — tappable */}
            <button
              onClick={() => handleExpand(shipment.shipment_id)}
              className="w-full p-6 text-left flex justify-between items-start"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-bold text-gray-900 text-lg">{shipment.shipment_id}</h4>
                  <Badge variant={shipment.status === 'FLAGGED' ? 'danger' : 'default'}>
                    {statusLabel(shipment.status)}
                  </Badge>
                </div>
                <p className="text-teal-600 font-medium text-sm mb-3">{shipment.product}</p>
                
                {/* Mini progress bar */}
                <div className="max-w-xs">
                  <ProgressTracker status={shipment.status} compact />
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 ml-4">
                <RiskBadge score={shipment.risk_score ?? 0} />
                {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </div>
            </button>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="px-6 pb-6 border-t border-gray-100 pt-4 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 gap-4 mb-4">
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
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Temp Range</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">{shipment.min_temp_celsius ?? 2}°C to {shipment.max_temp_celsius ?? 8}°C</p>
                    </div>
                  </div>
                </div>

                {/* Action Result */}
                {actionResult?.id === shipment.shipment_id && (
                  <div className={`p-3 rounded-lg text-sm mb-4 ${actionResult.msg.startsWith('✔') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {actionResult.msg}
                  </div>
                )}

                {/* Quick Action Buttons */}
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => { setActionType('temp'); setActionResult(null); }}
                    className={`flex-1 py-2.5 text-center rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      actionType === 'temp' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <Thermometer className="w-4 h-4" /> Log Temperature
                  </button>
                  <button
                    onClick={() => { setActionType('handoff'); setActionResult(null); }}
                    className={`flex-1 py-2.5 text-center rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      actionType === 'handoff' ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                    }`}
                  >
                    <Navigation className="w-4 h-4" /> Record Handoff
                  </button>
                  <Link
                    to={`/supplier/tracking?id=${shipment.shipment_id}`}
                    className="px-4 py-2.5 text-center bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    Details
                  </Link>
                </div>

                {/* Inline Temperature Form */}
                {actionType === 'temp' && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number" step="0.1" placeholder="Temperature (°C)" value={formTemp}
                        onChange={e => setFormTemp(e.target.value)}
                        className="px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      />
                      <input
                        type="text" placeholder="Location" value={formLocation}
                        onChange={e => setFormLocation(e.target.value)}
                        className="px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      />
                    </div>
                    <button
                      onClick={() => handleLogTemp(shipment.shipment_id)}
                      disabled={submitting || !formTemp || !formLocation}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {submitting ? 'Logging...' : 'Submit Temperature'}
                    </button>
                  </div>
                )}

                {/* Inline Handoff Form */}
                {actionType === 'handoff' && (
                  <div className="p-4 bg-teal-50 rounded-lg border border-teal-100 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text" placeholder="Handing off to..." value={formToParty}
                        onChange={e => setFormToParty(e.target.value)}
                        className="px-3 py-2 border border-teal-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                      />
                      <input
                        type="text" placeholder="Location" value={formLocation}
                        onChange={e => setFormLocation(e.target.value)}
                        className="px-3 py-2 border border-teal-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number" step="0.1" placeholder="Temp °C (optional)" value={formTemp}
                        onChange={e => setFormTemp(e.target.value)}
                        className="px-3 py-2 border border-teal-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                      />
                      <input
                        type="text" placeholder="Notes (optional)" value={formNotes}
                        onChange={e => setFormNotes(e.target.value)}
                        className="px-3 py-2 border border-teal-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                      />
                    </div>
                    <button
                      onClick={() => handleHandoff(shipment.shipment_id)}
                      disabled={submitting || !formLocation || !formToParty}
                      className="w-full py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                      {submitting ? 'Anchoring...' : 'Submit Handoff to Blockchain'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </Card>
          );
        })
        )}
      </div>
      
      {!loading && activeManifest.length === 0 && (
        <Card className="p-12 text-center">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Vehicle is Empty</h3>
          <p className="text-gray-500">No active shipments assigned to {vehicleId} right now.</p>
        </Card>
      )}
    </div>
  );
}
