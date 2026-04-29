import { useState } from 'react';
import { Card } from '../components/ui';
import { QRCodeSVG } from 'qrcode.react';
import { Download, PackagePlus, AlertTriangle } from 'lucide-react';
import { createShipment, type CreateShipmentResponse } from '../api/shipmentApi';

export function CreateShipment() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateShipmentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [product, setProduct] = useState('');
  const [batchId, setBatchId] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [minTemp, setMinTemp] = useState('');
  const [maxTemp, setMaxTemp] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const shipmentId = `SHP-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const response = await createShipment({
        shipment_id: shipmentId,
        product,
        origin,
        destination,
      });

      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.error || response.message || 'Unknown error');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err.message || 'Network error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById("QRCodeSVG");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      const margin = 20;
      canvas.width = img.width + margin * 2;
      canvas.height = img.height + margin * 2;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, margin, margin);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `${result?.shipment_id}-QR.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-8">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
            <PackagePlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Initialize New Shipment</h2>
            <p className="text-sm text-gray-500">Enter details to generate a secure blockchain tracking ID</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Shipment creation failed</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Product Type</label>
                <input required type="text" value={product} onChange={e => setProduct(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" placeholder="e.g. COVID-19 Vaccines" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Batch ID</label>
                <input type="text" value={batchId} onChange={e => setBatchId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" placeholder="e.g. B-7721-A" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Source Location</label>
                <input required type="text" value={origin} onChange={e => setOrigin(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" placeholder="Facility Name, City" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Destination</label>
                <input required type="text" value={destination} onChange={e => setDestination(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" placeholder="Facility Name, City" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Min Temperature (°C)</label>
                <input type="number" value={minTemp} onChange={e => setMinTemp(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" placeholder="-80" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Max Temperature (°C)</label>
                <input type="number" value={maxTemp} onChange={e => setMaxTemp(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" placeholder="-60" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Additional Notes</label>
                <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" placeholder="Handling instructions..." />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? 'Registering on Blockchain...' : 'Create Shipment'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">Shipment Created!</h3>
              <p className="text-gray-500">Tracking ID: <span className="font-mono font-bold text-teal-600">{result.shipment_id}</span></p>
              {result.blockchain_tx && (
                <p className="text-xs font-mono text-gray-400 break-all max-w-md">
                  Blockchain TX: {result.blockchain_tx}
                </p>
              )}
              {result.data_hash && (
                <p className="text-xs font-mono text-gray-400 break-all max-w-md">
                  Data Hash: {result.data_hash}
                </p>
              )}
              <p className="text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full inline-block mt-2 border border-amber-200">
                Print and attach this QR to the shipment
              </p>
            </div>
            
            <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <QRCodeSVG 
                id="QRCodeSVG" 
                value={`${window.location.origin}/verify/${result.shipment_id}`} 
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="flex gap-4">
              <button 
                onClick={downloadQR}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download QR
              </button>
              <button 
                onClick={() => { setResult(null); setProduct(''); setOrigin(''); setDestination(''); setBatchId(''); setMinTemp(''); setMaxTemp(''); setNotes(''); }}
                className="px-6 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
              >
                Create Another
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
