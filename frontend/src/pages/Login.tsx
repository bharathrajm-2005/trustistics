import { useAuth } from '../context/AuthContext';
import type { Role } from '../context/AuthContext';
import { Card } from '../components/ui';
import { Thermometer, Factory, Truck, Building2, ShieldCheck, User } from 'lucide-react';
import ColorBends from '../components/ui/ColorBends';

export function Login() {
  const { login } = useAuth();

  const roles: { id: Role; icon: any; desc: string }[] = [
    { id: 'Supplier', icon: Factory, desc: 'Create shipments & upload docs' },
    { id: 'Driver', icon: Truck, desc: 'Record handoffs & transit temp' },
    { id: 'Warehouse Manager', icon: Building2, desc: 'Record storage intake' },
    { id: 'Customs Officer', icon: ShieldCheck, desc: 'Add clearance reports' },
    { id: 'Customer', icon: User, desc: 'Public verification view' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 md:p-12 relative overflow-hidden bg-slate-900">
      <div className="absolute inset-0 z-0">
        <ColorBends
          colors={["#ab2b89", "#ff5c7a", "#8a5cff", "#00ffd1", "#480b2d"]}
          rotation={45}
          speed={0.15}
          scale={1.0}
          frequency={1.0}
          warpStrength={1.2}
          mouseInfluence={0.5}
          noise={0.1}
          iterations={2}
          intensity={1.8}
          bandWidth={5}
          transparent={false}
        />
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"></div>
      </div>

      <div className="max-w-6xl w-full flex flex-col md:flex-row items-center justify-between gap-12 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Left Side: Branding */}
        <div className="md:w-1/2 text-center md:text-left space-y-6">
          <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tighter drop-shadow-2xl">
            Trustistics
          </h2>
          <div className="space-y-2">
            <p className="text-xl md:text-2xl font-bold drop-shadow-sm" style={{ color: '#ab2b89' }}>
              Secure Cold Chain Provenance
            </p>
            <p className="text-lg text-neutral-100 max-w-md leading-relaxed drop-shadow">
              Ensuring the integrity of every shipment through 
              AI-powered blockchain verification.
            </p>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="md:w-auto w-full max-w-lg">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="mb-6 text-center md:text-left">
              <h3 className="text-xl font-bold text-white">Access Portal</h3>
              <p className="text-sm text-neutral-300">Select your role to continue</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    onClick={() => login(role.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all text-left group border border-transparent hover:border-white/10 h-full bg-black/5"
                  >
                    <div className="p-2.5 rounded-lg bg-black/20 text-neutral-300 group-hover:text-brand-300 group-hover:bg-brand-500/20 transition-all border border-white/5 group-hover:border-brand-500/30 shadow-inner shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white tracking-wide truncate">{role.id}</h3>
                      <p className="text-[10px] leading-tight text-neutral-300 line-clamp-2">{role.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
