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
import { Home, BedDouble, Users, AlertCircle, Plus, Pencil, Trash2, Search } from 'lucide-react';

interface HostelStats { totalHostels: number; totalRooms: number; totalBeds: number; occupiedBeds: number; activeAllocs: number; }
interface Hostel { id: string; name: string; type: string; address?: string; capacity: number; totalRooms?: number; occupiedRooms?: number; }
interface Room { id: string; hostel: { id: string; name: string } | null; room_number: string; floor: number; capacity: number; occupied: number; room_type: string; status: string; }

export default function HostelPage() {
  const ctx       = getAuthContext();
  const canAdd    = hasPermission('hostel.room.create', ctx);
  const canEdit   = hasPermission('hostel.room.update', ctx);
  const canAlloc  = hasPermission('hostel.allocation.create', ctx);

  const [stats,     setStats]     = useState<HostelStats | null>(null);
  const [hostels,   setHostels]   = useState<Hostel[]>([]);
  const [rooms,     setRooms]     = useState<Room[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<'hostels' | 'rooms' | 'allocations'>('hostels');
  const [search,    setSearch]    = useState('');

  // Add hostel modal
  const [hostelOpen,  setHostelOpen]  = useState(false);
  const [hostelForm,  setHostelForm]  = useState({ name: '', type: 'boys', address: '', capacity: '100' });
  const [hostelSave,  setHostelSave]  = useState(false);

  // Add room modal
  const [roomOpen,    setRoomOpen]    = useState(false);
  const [roomForm,    setRoomForm]    = useState({ hostel_id: '', room_number: '', floor: '0', capacity: '2', room_type: 'double' });
  const [roomSave,    setRoomSave]    = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [sRes, hRes, rRes] = await Promise.all([
        api.get('/hostel/stats').catch(() => ({ data: { data: {} } })),
        api.get('/hostel/hostels').catch(() => ({ data: { data: [] } })),
        api.get('/hostel/rooms').catch(() => ({ data: { data: [] } })),
      ]);
      setStats(sRes.data.data);
      setHostels(hRes.data.data || []);
      setRooms(rRes.data.data || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function addHostel(e: React.FormEvent) {
    e.preventDefault(); setHostelSave(true);
    try {
      await api.post('/hostel/hostels', { ...hostelForm, capacity: parseInt(hostelForm.capacity) });
      toast.success('Hostel added'); setHostelOpen(false);
      setHostelForm({ name: '', type: 'boys', address: '', capacity: '100' });
      loadAll();
    } catch (err) { toast.error(getApiError(err)); }
    setHostelSave(false);
  }

  async function addRoom(e: React.FormEvent) {
    e.preventDefault(); setRoomSave(true);
    try {
      await api.post('/hostel/rooms', { ...roomForm, floor: parseInt(roomForm.floor), capacity: parseInt(roomForm.capacity) });
      toast.success('Room added'); setRoomOpen(false);
      setRoomForm({ hostel_id: '', room_number: '', floor: '0', capacity: '2', room_type: 'double' });
      loadAll();
    } catch (err) { toast.error(getApiError(err)); }
    setRoomSave(false);
  }

  async function deleteHostel(id: string) {
    if (!confirm('Delete this hostel?')) return;
    try { await api.delete(`/hostel/hostels/${id}`); toast.success('Deleted'); loadAll(); }
    catch (err) { toast.error(getApiError(err)); }
  }

  const filteredHostels = hostels.filter(h => h.name?.toLowerCase().includes(search.toLowerCase()));
  const filteredRooms   = rooms.filter(r =>
    r.room_number?.toLowerCase().includes(search.toLowerCase()) ||
    (r.hostel as any)?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const statusVariant = (s: string): 'success' | 'danger' | 'warning' =>
    s === 'available' ? 'success' : s === 'full' ? 'danger' : 'warning';

  return (
    <AuthGuard anyPermission={['hostel.view']}>
      <AppShell title="Hostel">
        <div className="space-y-6">

          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-cyan-700 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4 shadow-lg shadow-teal-100">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Home className="w-5 h-5" /> Hostel Management
              </h2>
              <p className="text-teal-100 text-sm mt-0.5">Manage hostels, rooms, beds and student allocations</p>
            </div>
            {canAdd && (
              <button onClick={() => setHostelOpen(true)}
                className="flex items-center gap-2 bg-white text-teal-700 hover:bg-teal-50 font-semibold text-sm px-4 py-2 rounded-xl shadow transition-colors">
                <Plus className="w-4 h-4" /> Add Hostel
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Hostels',   value: loading ? '…' : stats?.totalHostels   ?? 0, icon: Home,       color: 'bg-teal-50 text-teal-600' },
              { label: 'Total Rooms',     value: loading ? '…' : stats?.totalRooms     ?? 0, icon: BedDouble,  color: 'bg-blue-50 text-blue-600' },
              { label: 'Occupied Beds',   value: loading ? '…' : stats?.occupiedBeds   ?? 0, icon: Users,      color: 'bg-amber-50 text-amber-600' },
              { label: 'Active Allocs',   value: loading ? '…' : stats?.activeAllocs   ?? 0, icon: AlertCircle,color: 'bg-purple-50 text-purple-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
                <div className={`p-3 rounded-xl ${s.color.split(' ')[0]}`}><s.icon className={`w-5 h-5 ${s.color.split(' ')[1]}`} /></div>
                <div><p className="text-xs text-gray-500">{s.label}</p><p className="text-2xl font-bold text-gray-900">{s.value}</p></div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {(['hostels', 'rooms', 'allocations'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-full max-w-xs">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" placeholder={`Search ${tab}…`} value={search} onChange={e => setSearch(e.target.value)}
              className="text-sm outline-none bg-transparent text-gray-700 flex-1" />
          </div>

          {/* Hostels tab */}
          {tab === 'hostels' && (
            <Card>
              <CardHeader>
                <CardTitle>Hostels ({filteredHostels.length})</CardTitle>
                {canAdd && <button onClick={() => setHostelOpen(true)} className="flex items-center gap-1.5 text-xs text-teal-600 hover:underline font-medium"><Plus className="w-3.5 h-3.5" /> Add</button>}
              </CardHeader>
              <CardContent className="p-0">
                {loading ? <Spinner /> : filteredHostels.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">No hostels found{canAdd && <> — <button onClick={() => setHostelOpen(true)} className="text-teal-600 hover:underline">add one</button></>}</p>
                ) : (
                  <Table>
                    <Thead><tr><Th>Name</Th><Th>Type</Th><Th>Capacity</Th><Th>Rooms</Th><Th>Address</Th>{canAdd && <Th>Actions</Th>}</tr></Thead>
                    <Tbody>
                      {filteredHostels.map(h => (
                        <Tr key={h.id}>
                          <Td className="font-medium text-gray-900">{h.name}</Td>
                          <Td><Badge variant="info" className="capitalize">{h.type}</Badge></Td>
                          <Td className="text-gray-600">{h.capacity}</Td>
                          <Td className="text-gray-600">{h.totalRooms ?? 0}</Td>
                          <Td className="text-gray-500 text-sm">{h.address || '—'}</Td>
                          {canAdd && (
                            <Td>
                              <button onClick={() => deleteHostel(h.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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

          {/* Rooms tab */}
          {tab === 'rooms' && (
            <Card>
              <CardHeader>
                <CardTitle>Rooms ({filteredRooms.length})</CardTitle>
                {canAdd && (
                  <button onClick={() => setRoomOpen(true)} className="flex items-center gap-1.5 text-xs text-teal-600 hover:underline font-medium">
                    <Plus className="w-3.5 h-3.5" /> Add Room
                  </button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {loading ? <Spinner /> : filteredRooms.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">No rooms found</p>
                ) : (
                  <Table>
                    <Thead><tr><Th>Room No</Th><Th>Hostel</Th><Th>Floor</Th><Th>Type</Th><Th>Capacity</Th><Th>Occupied</Th><Th>Status</Th></tr></Thead>
                    <Tbody>
                      {filteredRooms.map(r => (
                        <Tr key={r.id}>
                          <Td className="font-medium text-gray-900">{r.room_number}</Td>
                          <Td className="text-gray-600">{(r.hostel as any)?.name ?? '—'}</Td>
                          <Td className="text-gray-600">{r.floor}</Td>
                          <Td><Badge variant="default" className="capitalize">{r.room_type}</Badge></Td>
                          <Td className="text-gray-600">{r.capacity}</Td>
                          <Td className="text-gray-600">{r.occupied}</Td>
                          <Td><Badge variant={statusVariant(r.status)} className="capitalize">{r.status}</Badge></Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Allocations tab */}
          {tab === 'allocations' && (
            <Card>
              <CardHeader><CardTitle>Student Allocations</CardTitle></CardHeader>
              <CardContent className="py-12 text-center text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                <p>Allocate students to rooms from the Students panel</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Add Hostel Modal */}
        {canAdd && (
          <Modal open={hostelOpen} onClose={() => setHostelOpen(false)} title="Add Hostel" size="sm">
            <form onSubmit={addHostel} className="space-y-4">
              <Input label="Hostel Name *" value={hostelForm.name} onChange={e => setHostelForm(p => ({...p, name: e.target.value}))} required />
              <Select label="Type" value={hostelForm.type} onChange={e => setHostelForm(p => ({...p, type: e.target.value}))}
                options={[{value:'boys',label:'Boys'},{value:'girls',label:'Girls'},{value:'co-ed',label:'Co-ed'}]} />
              <Input label="Capacity" type="number" value={hostelForm.capacity} onChange={e => setHostelForm(p => ({...p, capacity: e.target.value}))} />
              <Input label="Address" value={hostelForm.address} onChange={e => setHostelForm(p => ({...p, address: e.target.value}))} />
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setHostelOpen(false)}>Cancel</Button>
                <Button type="submit" loading={hostelSave}>Add Hostel</Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Add Room Modal */}
        {canAdd && (
          <Modal open={roomOpen} onClose={() => setRoomOpen(false)} title="Add Room" size="sm">
            <form onSubmit={addRoom} className="space-y-4">
              <Select label="Hostel *" value={roomForm.hostel_id} onChange={e => setRoomForm(p => ({...p, hostel_id: e.target.value}))} required
                options={hostels.map(h => ({value: h.id, label: h.name}))} placeholder="Select hostel" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Room Number *" value={roomForm.room_number} onChange={e => setRoomForm(p => ({...p, room_number: e.target.value}))} required placeholder="e.g. 101" />
                <Input label="Floor" type="number" value={roomForm.floor} onChange={e => setRoomForm(p => ({...p, floor: e.target.value}))} />
                <Input label="Capacity" type="number" value={roomForm.capacity} onChange={e => setRoomForm(p => ({...p, capacity: e.target.value}))} />
                <Select label="Room Type" value={roomForm.room_type} onChange={e => setRoomForm(p => ({...p, room_type: e.target.value}))}
                  options={[{value:'single',label:'Single'},{value:'double',label:'Double'},{value:'triple',label:'Triple'},{value:'dormitory',label:'Dormitory'}]} />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setRoomOpen(false)}>Cancel</Button>
                <Button type="submit" loading={roomSave}>Add Room</Button>
              </div>
            </form>
          </Modal>
        )}
      </AppShell>
    </AuthGuard>
  );
}
