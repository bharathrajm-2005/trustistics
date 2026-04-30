import { useState } from 'react';
import { Card } from '../../components/ui';
import { QrCode, ClipboardList, MapPin, Thermometer, AlertTriangle, Box, CloudRain } from 'lucide-react';
import { recordHandoff, logTemperature, checkTransitWeather } from '../../api/shipmentApi';


export function DriverDashboard() {
  const [shipmentId, setShipmentId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [temperature, setTemperature] = useState('');
  const [receiverParty, setReceiverParty] = useState('Local Warehouse');
  const [weatherAlert, setWeatherAlert] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  const [notes, setNotes] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Record handoff
      const handoffRes = await recordHandoff(shipmentId, {
        from_party: 'Driver',
        to_party: receiverParty,
        location,
        notes: notes || undefined,
        signed_by: 'Authorized Driver',
      });


      // Log temperature
      if (temperature) {
        await logTemperature(shipmentId, {
          temperature_celsius: parseFloat(temperature),
          location,
          logged_by: 'Driver',
        });
        
        // Check weather risk at current location
        setLoadingWeather(true);
        try {
          const wRes = await checkTransitWeather(shipmentId, location, parseFloat(temperature));
          if (wRes.success) {
            setWeatherAlert(wRes.data);
          }
        } catch (wErr) {
          console.error("Transit weather check failed", wErr);
        } finally {
          setLoadingWeather(false);
        }
      }


      if (handoffRes.success) {
        setSuccess(`Handoff anchored to blockchain! TX: ${handoffRes.data?.blockchain_tx || 'N/A'}`);
        setShipmentId('');
        setLocation('');
        setTemperature('');
        setNotes('');
      } else {
        setError(handoffRes.error || 'Handoff failed');
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
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Record Handoff & Transit</h2>
            <p className="text-sm text-gray-500">Log custody transfers and current conditions to the blockchain</p>
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
                <MapPin className="w-4 h-4" /> Current Location
              </label>
              <input required type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" placeholder="e.g. Interstate 80, PA" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Box className="w-4 h-4 text-blue-500" /> Receiver Party
              </label>
              <select 
                value={receiverParty} 
                onChange={e => setReceiverParty(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none bg-white"
              >
                <option value="Local Warehouse">Local Warehouse</option>
                <option value="Customs Checkpoint">Customs Checkpoint</option>
                <option value="Delivery Partner">Delivery Partner</option>
                <option value="Final Destination">Final Destination</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Thermometer className="w-4 h-4" /> Current Temperature (°C)
              </label>
              <input required type="number" step="0.1" value={temperature} onChange={e => setTemperature(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" placeholder="e.g. -70" />
            </div>
          </div>
          
          {loadingWeather && <p className="text-sm text-gray-500 animate-pulse text-center">Checking local weather...</p>}
          {weatherAlert && (
            <div className={`p-4 rounded-xl border ${weatherAlert.assessment.risk_level === 'high' ? 'bg-red-50 border-red-200' : weatherAlert.assessment.risk_level === 'medium' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <CloudRain className={`w-5 h-5 ${weatherAlert.assessment.risk_level === 'high' ? 'text-red-500' : weatherAlert.assessment.risk_level === 'medium' ? 'text-amber-500' : 'text-green-500'}`} />
                <h4 className={`font-semibold ${weatherAlert.assessment.risk_level === 'high' ? 'text-red-900' : weatherAlert.assessment.risk_level === 'medium' ? 'text-amber-900' : 'text-green-900'}`}>
                  Local Weather: {weatherAlert.weather.temperature}°C ({weatherAlert.weather.description})
                </h4>
              </div>
              <p className={`text-sm ${weatherAlert.assessment.risk_level === 'high' ? 'text-red-700 font-medium' : weatherAlert.assessment.risk_level === 'medium' ? 'text-amber-700 font-medium' : 'text-green-700'}`}>
                {weatherAlert.assessment.recommendation}
              </p>
              {weatherAlert.alert_created && (
                <p className="text-xs font-bold text-red-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Auto-alert created for Climate Risk
                </p>
              )}
            </div>
          )}


          <div className="space-y-2">

            <label className="text-sm font-medium text-gray-700">Condition Notes</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" placeholder="Packaging intact, refrigeration unit stable..." />
            {error && <p className="text-sm text-red-600 mt-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> {error}</p>}
            {success && <p className="text-sm text-green-600 mt-2">✔ {success}</p>}
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={loading || !shipmentId}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Anchoring to Blockchain...' : 'Record Handoff'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
