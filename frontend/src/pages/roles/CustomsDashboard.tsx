import { useState } from 'react';
import { Card } from '../../components/ui';
import { QrCode, ShieldCheck, MapPin, FileCheck, AlertTriangle } from 'lucide-react';
import { addEvent, updateShipmentStatus } from '../../api/shipmentApi';

export function CustomsDashboard() {
  const [shipmentId, setShipmentId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // First, update the shipment status (which might flag it)
      let backendStatus = 'IN_TRANSIT';
      if (status === 'Held' || status === 'Rejected') backendStatus = 'FLAGGED';
      
      const statusRes = await updateShipmentStatus(shipmentId, backendStatus, notes);

      // Then record the customs event
      const eventRes = await addEvent(shipmentId, 'CUSTOMS_CLEARANCE', `${location} - ${status}`);

      if (eventRes.success && statusRes.success) {
        setSuccess(`Clearance anchored to blockchain! TX: ${eventRes.data?.tx_hash || 'N/A'}`);
        setShipmentId('');
        setLocation('');
        setStatus('');
        setNotes('');
      } else {
        setError(eventRes.error || statusRes.error || 'Failed to record clearance');
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
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Add Clearance Report</h2>
            <p className="text-sm text-gray-500">Log border checkpoint clearance to the blockchain</p>
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
                <MapPin className="w-4 h-4" /> Checkpoint Location
              </label>
              <input required type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" placeholder="e.g. JFK Airport Customs" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileCheck className="w-4 h-4" /> Clearance Status
              </label>
              <select required value={status} onChange={e => setStatus(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none bg-white">
                <option value="">Select status...</option>
                <option value="Cleared">Cleared for Import/Export</option>
                <option value="Held">Held for Inspection</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Inspection Notes</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" placeholder="All seals intact, documentation verified against blockchain..." />
            {error && <p className="text-sm text-red-600 mt-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> {error}</p>}
            {success && <p className="text-sm text-green-600 mt-2">✔ {success}</p>}
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={loading || !shipmentId}
              className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Anchoring to Blockchain...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
