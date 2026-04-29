import { useState } from 'react';
import { Card } from '../../components/ui';
import { QrCode, Building2, Thermometer, Box, AlertTriangle } from 'lucide-react';
import { addEvent, logTemperature } from '../../api/shipmentApi';

export function WarehouseDashboard() {
  const [shipmentId, setShipmentId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [storageUnit, setStorageUnit] = useState('');
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const eventRes = await addEvent(shipmentId, 'CUSTODY_HANDOFF', `Warehouse - ${storageUnit}`);

      if (temperature) {
        await logTemperature(shipmentId, {
          temperature_celsius: parseFloat(temperature),
          location: `Warehouse - ${storageUnit}`,
          logged_by: 'Warehouse',
        });
      }

      if (eventRes.success) {
        setSuccess(`Intake anchored to blockchain! TX: ${eventRes.data?.tx_hash || 'N/A'}`);
        setShipmentId('');
        setStorageUnit('');
        setTemperature('');
        setNotes('');
      } else {
        setError(eventRes.error || 'Failed to record intake');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="p-8">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Record Storage Intake</h2>
            <p className="text-sm text-gray-500">Log facility arrival and storage conditions to the blockchain</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex justify-between">
              Shipment ID
              <button type="button" onClick={() => setIsScanning(!isScanning)} className="text-teal-600 flex items-center gap-1 text-xs">
                <QrCode className="w-3 h-3" /> Scan QR
              </button>
            </label>
            <input 
              required 
              type="text" 
              value={shipmentId}
              onChange={e => setShipmentId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" 
              placeholder="e.g. SHP-9021" 
            />
          </div>

          {isScanning && (
            <div className="w-full h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-teal-500 animate-[scan_2s_ease-in-out_infinite]"></div>
              <p className="text-gray-500">Camera Feed Active</p>
              <button 
                type="button"
                onClick={() => { setShipmentId('SHP-9022'); setIsScanning(false); }}
                className="absolute bottom-4 px-4 py-2 bg-white rounded shadow text-sm font-medium hover:bg-gray-50"
              >
                Simulate Successful Scan
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Box className="w-4 h-4" /> Storage Unit ID
              </label>
              <input required type="text" value={storageUnit} onChange={e => setStorageUnit(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" placeholder="e.g. Cold-Room-B4" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Thermometer className="w-4 h-4" /> Unit Temperature (°C)
              </label>
              <input required type="number" step="0.1" value={temperature} onChange={e => setTemperature(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" placeholder="e.g. -80" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Storage Condition Notes</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" placeholder="Transferred to ultra-low temp freezer immediately upon arrival..." />
            {error && <p className="text-sm text-red-600 mt-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> {error}</p>}
            {success && <p className="text-sm text-green-600 mt-2">✔ {success}</p>}
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={loading || !shipmentId}
              className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Anchoring to Blockchain...' : 'Record Intake'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
