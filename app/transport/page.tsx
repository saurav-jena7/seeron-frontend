'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { getAuthContext, hasPermission } from '@/lib/auth';
import { getApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Bus, User, MapPin, Wrench, Plus, Trash2, Search, Navigation } from 'lucide-react';

interface TransportStats { totalVehicles: number; activeVehicles: number; totalDrivers: number; totalRoutes: number; totalAllocations: number; }
interface Vehicle { id: string; vehicle_number: string; type: string; capacity: number; make?: string; model?: string; status: string; driver?: { id: string; name: string } | null; }
interface Driver  { id: string; name: string; phone: string; license_no?: string; license_expiry?: string; status: string; }
interface Route   { id: string; name: string; start_point?: string; end_point?: string; distance_km?: number; fare?: number; status: string; vehicle?: any; driver?: any; stops?: { name: string; time: string }[]; }

export default function TransportPage() {
  const ctx      = getAuthContext();
  const canAdd   = hasPermission('transport.vehicle.create', ctx);
  const canDriver= hasPermission('transport.driver.create', ctx);
  const canRoute = hasPermission('transport.route.create', ctx);

  const [stats,    setStats]    = useState<TransportStats | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers,  setDrivers]  = useState<Driver[]>([]);
  const [routes,   setRoutes]   = useState<Route[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<'vehicles' | 'drivers' | 'routes'>('vehicles');
  const [search,   setSearch]   = useState('');

  // Vehicle modal
  const [vOpen, setVOpen] = useState(false);
  const [vForm, setVForm] = useState({ vehicle_number: '', type: 'bus', capacity: '40', make: '', model: '', year: '', fuel_type: 'diesel' });
  const [vSave, setVSave] = useState(false);

  // Driver modal
  const [dOpen, setDOpen] = useState(false);
  const [dForm, setDForm] = useState({ name: '', phone: '', license_no: '', license_expiry: '', address: '' });
  const [dSave, setDSave] = useState(false);

  // Route modal
  const [rOpen, setROpen] = useState(false);
  const [rForm, setRForm] = useState({ name: '', start_point: '', end_point: '', distance_km: '', fare: '', vehicle_id: '', driver_id: '' });
  const [rSave, setRSave] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [sRes, vRes, dRes, rRes] = await Promise.all([
        api.get('/transport/stats').catch(() => ({ data: { data: {} } })),
        api.get('/transport/vehicles').catch(() => ({ data: { data: [] } })),
        api.get('/transport/drivers').catch(() => ({ data: { data: [] } })),
        api.get('/transport/routes').catch(() => ({ data: { data: [] } })),
      ]);
      setStats(sRes.data.data);
      setVehicles(vRes.data.data || []);
      setDrivers(dRes.data.data || []);
      setRoutes(rRes.data.data || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function addVehicle(e: React.FormEvent) {
    e.preventDefault(); setVSave(true);
    try {
      await api.post('/transport/vehicles', { ...vForm, capacity: parseInt(vForm.capacity), year: vForm.year ? parseInt(vForm.year) : undefined });
      toast.success('Vehicle added'); setVOpen(false);
      setVForm({ vehicle_number: '', type: 'bus', capacity: '40', make: '', model: '', year: '', fuel_type: 'diesel' });
      loadAll();
    } catch (err) { toast.error(getApiError(err)); }
    setVSave(false);
  }

  async function addDriver(e: React.FormEvent) {
    e.preventDefault(); setDSave(true);
    try {
      await api.post('/transport/drivers', dForm);
      toast.success('Driver added'); setDOpen(false);
      setDForm({ name: '', phone: '', license_no: '', license_expiry: '', address: '' });
      loadAll();
    } catch (err) { toast.error(getApiError(err)); }
    setDSave(false);
  }

  async function addRoute(e: React.FormEvent) {
    e.preventDefault(); setRSave(true);
    try {
      await api.post('/transport/routes', {
        ...rForm,
        distance_km: rForm.distance_km ? parseFloat(rForm.distance_km) : undefined,
        fare:        rForm.fare        ? parseFloat(rForm.fare)        : undefined,
        vehicle_id: rForm.vehicle_id || undefined,
        driver_id:  rForm.driver_id  || undefined,
      });
      toast.success('Route added'); setROpen(false);
      setRForm({ name: '', start_point: '', end_point: '', distance_km: '', fare: '', vehicle_id: '', driver_id: '' });
      loadAll();
    } catch (err) { toast.error(getApiError(err)); }
    setRSave(false);
  }

  async function deleteVehicle(id: string) {
    if (!confirm('Delete vehicle?')) return;
    try { await api.delete(`/transport/vehicles/${id}`); toast.success('Deleted'); loadAll(); }
    catch (err) { toast.error(getApiError(err)); }
  }

  const vehicleStatusVariant = (s: string): 'success' | 'warning' | 'danger' =>
    s === 'active' ? 'success' : s === 'maintenance' ? 'warning' : 'danger';

  const fv = vehicles.filter(v => v.vehicle_number?.toLowerCase().includes(search.toLowerCase()) || v.make?.toLowerCase().includes(search.toLowerCase()));
  const fd = drivers.filter(d => d.name?.toLowerCase().includes(search.toLowerCase()) || d.phone?.includes(search));
  const fr = routes.filter(r => r.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <AuthGuard anyPermission={['transport.vehicle.view']}>
      <AppShell title="Transport">
        <div className="space-y-6">

          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4 shadow-lg shadow-violet-100">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Bus className="w-5 h-5" /> Transport Management
              </h2>
              <p className="text-violet-100 text-sm mt-0.5">Manage vehicles, drivers, routes and student allocation</p>
            </div>
            {canAdd && (
              <button onClick={() => setVOpen(true)}
                className="flex items-center gap-2 bg-white text-violet-700 hover:bg-violet-50 font-semibold text-sm px-4 py-2 rounded-xl shadow transition-colors">
                <Plus className="w-4 h-4" /> Add Vehicle
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Vehicles',  value: loading ? '…' : stats?.totalVehicles  ?? 0, icon: Bus,        color: 'bg-violet-50 text-violet-600' },
              { label: 'Active Vehicles', value: loading ? '…' : stats?.activeVehicles ?? 0, icon: Navigation, color: 'bg-green-50 text-green-600' },
              { label: 'Drivers',         value: loading ? '…' : stats?.totalDrivers   ?? 0, icon: User,       color: 'bg-blue-50 text-blue-600' },
              { label: 'Routes',          value: loading ? '…' : stats?.totalRoutes    ?? 0, icon: MapPin,     color: 'bg-amber-50 text-amber-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
                <div className={`p-3 rounded-xl ${s.color.split(' ')[0]}`}><s.icon className={`w-5 h-5 ${s.color.split(' ')[1]}`} /></div>
                <div><p className="text-xs text-gray-500">{s.label}</p><p className="text-2xl font-bold text-gray-900">{s.value}</p></div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {(['vehicles', 'drivers', 'routes'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Search + add button for current tab */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <Search className="w-4 h-4 text-gray-400" />
              <input type="text" placeholder={`Search ${tab}…`} value={search} onChange={e => setSearch(e.target.value)}
                className="text-sm outline-none bg-transparent text-gray-700 w-44" />
            </div>
            {tab === 'drivers' && canDriver && (
              <button onClick={() => setDOpen(true)} className="flex items-center gap-1.5 text-sm text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
                <Plus className="w-4 h-4" /> Add Driver
              </button>
            )}
            {tab === 'routes' && canRoute && (
              <button onClick={() => setROpen(true)} className="flex items-center gap-1.5 text-sm text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
                <Plus className="w-4 h-4" /> Add Route
              </button>
            )}
          </div>

          {/* Vehicles tab */}
          {tab === 'vehicles' && (
            <Card>
              <CardHeader><CardTitle>Vehicles ({fv.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                {loading ? <Spinner /> : fv.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">No vehicles{canAdd && <> — <button onClick={() => setVOpen(true)} className="text-violet-600 hover:underline">add one</button></>}</p>
                ) : (
                  <Table>
                    <Thead><tr><Th>Vehicle No</Th><Th>Type</Th><Th>Capacity</Th><Th>Make/Model</Th><Th>Driver</Th><Th>Status</Th>{canAdd && <Th>Actions</Th>}</tr></Thead>
                    <Tbody>
                      {fv.map(v => (
                        <Tr key={v.id}>
                          <Td className="font-medium text-gray-900 font-mono">{v.vehicle_number}</Td>
                          <Td><Badge variant="info" className="capitalize">{v.type}</Badge></Td>
                          <Td className="text-gray-600">{v.capacity}</Td>
                          <Td className="text-gray-500 text-sm">{[v.make, v.model].filter(Boolean).join(' ') || '—'}</Td>
                          <Td className="text-gray-600">{(v.driver as any)?.name ?? '—'}</Td>
                          <Td><Badge variant={vehicleStatusVariant(v.status)} className="capitalize">{v.status}</Badge></Td>
                          {canAdd && (
                            <Td>
                              <button onClick={() => deleteVehicle(v.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </Td>
                          )}
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Drivers tab */}
          {tab === 'drivers' && (
            <Card>
              <CardHeader><CardTitle>Drivers ({fd.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                {loading ? <Spinner /> : fd.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">No drivers{canDriver && <> — <button onClick={() => setDOpen(true)} className="text-violet-600 hover:underline">add one</button></>}</p>
                ) : (
                  <Table>
                    <Thead><tr><Th>Name</Th><Th>Phone</Th><Th>License No</Th><Th>Expiry</Th><Th>Status</Th></tr></Thead>
                    <Tbody>
                      {fd.map(d => (
                        <Tr key={d.id}>
                          <Td className="font-medium text-gray-900">{d.name}</Td>
                          <Td className="text-gray-600">{d.phone}</Td>
                          <Td className="text-gray-500 font-mono text-xs">{d.license_no || '—'}</Td>
                          <Td className="text-gray-500">{d.license_expiry || '—'}</Td>
                          <Td><Badge variant={d.status === 'active' ? 'success' : 'danger'} className="capitalize">{d.status}</Badge></Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Routes tab */}
          {tab === 'routes' && (
            <Card>
              <CardHeader><CardTitle>Routes ({fr.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                {loading ? <Spinner /> : fr.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">No routes{canRoute && <> — <button onClick={() => setROpen(true)} className="text-violet-600 hover:underline">add one</button></>}</p>
                ) : (
                  <Table>
                    <Thead><tr><Th>Route Name</Th><Th>From → To</Th><Th>Distance</Th><Th>Fare</Th><Th>Vehicle</Th><Th>Driver</Th><Th>Status</Th></tr></Thead>
                    <Tbody>
                      {fr.map(r => (
                        <Tr key={r.id}>
                          <Td className="font-medium text-gray-900">{r.name}</Td>
                          <Td className="text-gray-500 text-sm">{r.start_point && r.end_point ? `${r.start_point} → ${r.end_point}` : '—'}</Td>
                          <Td className="text-gray-600">{r.distance_km ? `${r.distance_km} km` : '—'}</Td>
                          <Td className="text-gray-600">{r.fare ? `₹${r.fare}` : '—'}</Td>
                          <Td className="text-gray-500 text-sm">{(r.vehicle as any)?.vehicle_number ?? '—'}</Td>
                          <Td className="text-gray-500 text-sm">{(r.driver as any)?.name ?? '—'}</Td>
                          <Td><Badge variant={r.status === 'active' ? 'success' : 'danger'} className="capitalize">{r.status}</Badge></Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Add Vehicle Modal */}
        {canAdd && (
          <Modal open={vOpen} onClose={() => setVOpen(false)} title="Add Vehicle" size="md">
            <form onSubmit={addVehicle} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Vehicle Number *" value={vForm.vehicle_number} onChange={e => setVForm(p => ({...p, vehicle_number: e.target.value}))} required placeholder="e.g. MH-01-AB-1234" />
                <Select label="Type" value={vForm.type} onChange={e => setVForm(p => ({...p, type: e.target.value}))}
                  options={[{value:'bus',label:'Bus'},{value:'van',label:'Van'},{value:'auto',label:'Auto'},{value:'car',label:'Car'},{value:'other',label:'Other'}]} />
                <Input label="Capacity" type="number" value={vForm.capacity} onChange={e => setVForm(p => ({...p, capacity: e.target.value}))} />
                <Select label="Fuel Type" value={vForm.fuel_type} onChange={e => setVForm(p => ({...p, fuel_type: e.target.value}))}
                  options={[{value:'diesel',label:'Diesel'},{value:'petrol',label:'Petrol'},{value:'cng',label:'CNG'},{value:'electric',label:'Electric'}]} />
                <Input label="Make" value={vForm.make} onChange={e => setVForm(p => ({...p, make: e.target.value}))} placeholder="e.g. Tata" />
                <Input label="Model" value={vForm.model} onChange={e => setVForm(p => ({...p, model: e.target.value}))} placeholder="e.g. Starbus" />
                <Input label="Year" type="number" value={vForm.year} onChange={e => setVForm(p => ({...p, year: e.target.value}))} placeholder="e.g. 2022" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setVOpen(false)}>Cancel</Button>
                <Button type="submit" loading={vSave}>Add Vehicle</Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Add Driver Modal */}
        {canDriver && (
          <Modal open={dOpen} onClose={() => setDOpen(false)} title="Add Driver" size="sm">
            <form onSubmit={addDriver} className="space-y-4">
              <Input label="Name *" value={dForm.name} onChange={e => setDForm(p => ({...p, name: e.target.value}))} required />
              <Input label="Phone *" value={dForm.phone} onChange={e => setDForm(p => ({...p, phone: e.target.value}))} required />
              <div className="grid grid-cols-2 gap-3">
                <Input label="License No" value={dForm.license_no} onChange={e => setDForm(p => ({...p, license_no: e.target.value}))} />
                <Input label="License Expiry" type="date" value={dForm.license_expiry} onChange={e => setDForm(p => ({...p, license_expiry: e.target.value}))} />
              </div>
              <Input label="Address" value={dForm.address} onChange={e => setDForm(p => ({...p, address: e.target.value}))} />
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setDOpen(false)}>Cancel</Button>
                <Button type="submit" loading={dSave}>Add Driver</Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Add Route Modal */}
        {canRoute && (
          <Modal open={rOpen} onClose={() => setROpen(false)} title="Add Route" size="md">
            <form onSubmit={addRoute} className="space-y-4">
              <Input label="Route Name *" value={rForm.name} onChange={e => setRForm(p => ({...p, name: e.target.value}))} required placeholder="e.g. City Center Route" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Start Point" value={rForm.start_point} onChange={e => setRForm(p => ({...p, start_point: e.target.value}))} placeholder="e.g. School" />
                <Input label="End Point" value={rForm.end_point} onChange={e => setRForm(p => ({...p, end_point: e.target.value}))} placeholder="e.g. City Center" />
                <Input label="Distance (km)" type="number" value={rForm.distance_km} onChange={e => setRForm(p => ({...p, distance_km: e.target.value}))} />
                <Input label="Fare (₹)" type="number" value={rForm.fare} onChange={e => setRForm(p => ({...p, fare: e.target.value}))} />
                <Select label="Vehicle" value={rForm.vehicle_id} onChange={e => setRForm(p => ({...p, vehicle_id: e.target.value}))}
                  options={vehicles.map(v => ({value: v.id, label: v.vehicle_number}))} placeholder="None" />
                <Select label="Driver" value={rForm.driver_id} onChange={e => setRForm(p => ({...p, driver_id: e.target.value}))}
                  options={drivers.map(d => ({value: d.id, label: d.name}))} placeholder="None" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setROpen(false)}>Cancel</Button>
                <Button type="submit" loading={rSave}>Add Route</Button>
              </div>
            </form>
          </Modal>
        )}
      </AppShell>
    </AuthGuard>
  );
}
