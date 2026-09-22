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
import { Home, BedDouble, Users, AlertCircle, Plus, Pencil, Trash2, Search, UserCheck } from 'lucide-react';

interface HostelStats { totalHostels: number; totalRooms: number; totalBeds: number; occupiedBeds: number; activeAllocs: number; }
interface Hostel { id: string; name: string; type: string; address?: string; capacity: number; totalRooms?: number; occupiedRooms?: number; }
interface Room { id: string; hostel: { id: string; name: string } | null; room_number: string; floor: number; capacity: number; occupied: number; room_type: string; status: string; }
interface Allocation {
  id: string;
  student: { id: string; name: string; admission_no: string } | null;
  hostel:  { id: string; name: string } | null;
  room:    { id: string; room_number: string; floor: number } | null;
  check_in: string; check_out?: string; status: string;
}
interface Student { id: string; name: string; admission_no: string; }

export default function HostelPage() {
  const ctx       = getAuthContext();
  const canAdd    = hasPermission('hostel.room.create', ctx);
  const canEdit   = hasPermission('hostel.room.update', ctx);
  const canAlloc  = hasPermission('hostel.allocation.create', ctx);

  const [stats,       setStats]       = useState<HostelStats | null>(null);
  const [hostels,     setHostels]     = useState<Hostel[]>([]);
  const [rooms,       setRooms]       = useState<Room[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState<'hostels' | 'rooms' | 'allocations'>('hostels');
  const [search,      setSearch]      = useState('');

  // Add hostel modal
  const [hostelOpen,  setHostelOpen]  = useState(false);
  const [hostelForm,  setHostelForm]  = useState({ name: '', type: 'boys', address: '', capacity: '100' });
  const [hostelSave,  setHostelSave]  = useState(false);

  // Add room modal
  const [roomOpen,    setRoomOpen]    = useState(false);
  const [roomForm,    setRoomForm]    = useState({ hostel_id: '', room_number: '', floor: '0', capacity: '2', room_type: 'double' });
  const [roomSave,    setRoomSave]    = useState(false);

  // Allocate student modal
  const [allocOpen,   setAllocOpen]   = useState(false);
  const [allocForm,   setAllocForm]   = useState({ hostel_id: '', room_id: '', student_id: '', check_in: new Date().toISOString().split('T')[0] });
  const [allocSave,   setAllocSave]   = useState(false);
  const [studentSearch,   setStudentSearch]   = useState('');
  const [studentResults,  setStudentResults]  = useState<Student[]>([]);
  const [selStudent,      setSelStudent]      = useState<Student | null>(null);
  const [allocRooms,      setAllocRooms]      = useState<Room[]>([]);

  async function loadAll() {
    setLoading(true);
    try {
      const [sRes, hRes, rRes, aRes] = await Promise.all([
        api.get('/hostel/stats').catch(() => ({ data: { data: {} } })),
        api.get('/hostel/hostels').catch(() => ({ data: { data: [] } })),
        api.get('/hostel/rooms').catch(() => ({ data: { data: [] } })),
        api.get('/hostel/allocations').catch(() => ({ data: { data: [] } })),
      ]);
      setStats(sRes.data.data);
      setHostels(hRes.data.data || []);
      setRooms(rRes.data.data || []);
      setAllocations(aRes.data.data || []);
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

  // Student search for allocation modal
  async function searchStudents(q: string) {
    if (q.length < 2) { setStudentResults([]); return; }
    try {
      const r = await api.get('/students', { params: { search: q, limit: 5 } });
      setStudentResults(r.data.data || []);
    } catch {}
  }

  function selectStudent(s: Student) {
    setSelStudent(s);
    setAllocForm(p => ({ ...p, student_id: s.id }));
    setStudentSearch(s.name);
    setStudentResults([]);
  }

  // When hostel changes in alloc modal, reload available rooms for that hostel
  async function onAllocHostelChange(hostelId: string) {
    setAllocForm(p => ({ ...p, hostel_id: hostelId, room_id: '' }));
    if (!hostelId) { setAllocRooms([]); return; }
    try {
      const r = await api.get('/hostel/rooms', { params: { hostel_id: hostelId, status: 'available' } });
      setAllocRooms(r.data.data || []);
    } catch { setAllocRooms([]); }
  }

  async function allocateStudent(e: React.FormEvent) {
    e.preventDefault(); setAllocSave(true);
    try {
      await api.post('/hostel/allocations', {
        hostel_id: allocForm.hostel_id,
        room_id:   allocForm.room_id,
        student_id: allocForm.student_id,
        check_in:  allocForm.check_in,
      });
      toast.success('Student allocated to room');
      setAllocOpen(false);
      setAllocForm({ hostel_id: '', room_id: '', student_id: '', check_in: new Date().toISOString().split('T')[0] });
      setSelStudent(null); setStudentSearch(''); setAllocRooms([]);
      loadAll();
    } catch (err) { toast.error(getApiError(err)); }
    setAllocSave(false);
  }

  async function vacateStudent(allocId: string) {
    if (!confirm('Mark this student as vacated?')) return;
    try {
      await api.put(`/hostel/allocations/${allocId}/vacate`, {});
      toast.success('Student vacated');
      loadAll();
    } catch (err) { toast.error(getApiError(err)); }
  }

  const filteredHostels = hostels.filter(h => h.name?.toLowerCase().includes(search.toLowerCase()));
  const filteredRooms   = rooms.filter(r =>
    r.room_number?.toLowerCase().includes(search.toLowerCase()) ||
    (r.hostel as any)?.name?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredAllocs  = allocations.filter(a =>
    a.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.student?.admission_no?.toLowerCase().includes(search.toLowerCase()) ||
    (a.room as any)?.room_number?.toLowerCase().includes(search.toLowerCase())
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-teal-500" />
                  Student Allocations ({filteredAllocs.length})
                </CardTitle>
                {canAlloc && (
                  <button onClick={() => setAllocOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-teal-600 hover:underline font-medium">
                    <Plus className="w-3.5 h-3.5" /> Allocate Student
                  </button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {loading ? <Spinner /> : filteredAllocs.length === 0 ? (
                  <div className="py-10 text-center">
                    <Users className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                    <p className="text-gray-400 text-sm">No allocations found</p>
                    {canAlloc && (
                      <button onClick={() => setAllocOpen(true)} className="mt-2 text-sm text-teal-600 hover:underline font-medium">
                        + Allocate a student
                      </button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <Thead>
                      <tr>
                        <Th>Student</Th><Th>Hostel</Th><Th>Room</Th>
                        <Th>Check-in</Th><Th>Status</Th>
                        {canAlloc && <Th>Actions</Th>}
                      </tr>
                    </Thead>
                    <Tbody>
                      {filteredAllocs.map(a => (
                        <Tr key={a.id}>
                          <Td>
                            <div className="font-medium text-gray-900">{a.student?.name ?? '—'}</div>
                            <div className="text-xs text-gray-400">#{a.student?.admission_no}</div>
                          </Td>
                          <Td className="text-gray-600">{(a.hostel as any)?.name ?? '—'}</Td>
                          <Td className="text-gray-600">
                            {(a.room as any)?.room_number
                              ? `Room ${(a.room as any).room_number}${(a.room as any).floor != null ? ` (Floor ${(a.room as any).floor})` : ''}`
                              : '—'}
                          </Td>
                          <Td className="text-gray-500 text-sm">{a.check_in || '—'}</Td>
                          <Td>
                            <Badge variant={a.status === 'active' ? 'success' : 'default'} className="capitalize">
                              {a.status}
                            </Badge>
                          </Td>
                          {canAlloc && (
                            <Td>
                              {a.status === 'active' && (
                                <button
                                  onClick={() => vacateStudent(a.id)}
                                  className="text-xs text-orange-600 hover:text-orange-800 font-medium hover:underline"
                                >
                                  Vacate
                                </button>
                              )}
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

        {/* Allocate Student Modal */}
        {canAlloc && (
          <Modal open={allocOpen} onClose={() => { setAllocOpen(false); setSelStudent(null); setStudentSearch(''); setStudentResults([]); setAllocRooms([]); }} title="Allocate Student to Room" size="sm">
            <form onSubmit={allocateStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <div className="relative">
                  <input type="text" value={studentSearch}
                    onChange={e => { setStudentSearch(e.target.value); searchStudents(e.target.value); }}
                    placeholder="Search by name or admission no…"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  {studentResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 mt-1">
                      {studentResults.map(s => (
                        <button key={s.id} type="button" onClick={() => selectStudent(s)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-teal-50 flex justify-between">
                          <span className="font-medium text-gray-800">{s.name}</span>
                          <span className="text-gray-400 text-xs">#{s.admission_no}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selStudent && <p className="text-xs text-green-600 mt-1">✓ {selStudent.name} selected</p>}
              </div>
              <Select label="Hostel *" value={allocForm.hostel_id}
                onChange={e => onAllocHostelChange(e.target.value)}
                options={hostels.map(h => ({ value: h.id, label: h.name }))}
                placeholder="Select hostel" required />
              <Select label="Room *" value={allocForm.room_id}
                onChange={e => setAllocForm(p => ({ ...p, room_id: e.target.value }))}
                options={allocRooms.map(r => ({
                  value: r.id,
                  label: `Room ${r.room_number} (Floor ${r.floor}) — ${r.capacity - r.occupied} bed${r.capacity - r.occupied !== 1 ? 's' : ''} free`,
                }))}
                placeholder={allocForm.hostel_id ? (allocRooms.length === 0 ? 'No available rooms' : 'Select room') : 'Select hostel first'}
                required />
              <Input label="Check-in Date *" type="date" value={allocForm.check_in}
                onChange={e => setAllocForm(p => ({ ...p, check_in: e.target.value }))} required />
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setAllocOpen(false)}>Cancel</Button>
                <Button type="submit" loading={allocSave} disabled={!allocForm.student_id || !allocForm.room_id}>Allocate</Button>
              </div>
            </form>
          </Modal>
        )}
      </AppShell>
    </AuthGuard>
  );
}
