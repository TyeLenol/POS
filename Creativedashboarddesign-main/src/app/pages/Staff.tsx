import React, { useState, useRef } from "react";
import {
  Users, UserPlus, Mail, Phone, Edit, Trash2, X, Upload, ImageIcon,
  Search, ChevronDown, Shield, BadgeCheck, Calendar, Building2, Filter
} from "lucide-react";
import { cn } from "../utils/cn";

const COUNTRIES_DIAL = [
  { name: "Ghana", code: "GH", dialCode: "+233", flag: "🇬🇭" },
  { name: "Nigeria", code: "NG", dialCode: "+234", flag: "🇳🇬" },
  { name: "Kenya", code: "KE", dialCode: "+254", flag: "🇰🇪" },
  { name: "South Africa", code: "ZA", dialCode: "+27", flag: "🇿🇦" },
  { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
  { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
  { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦" },
  { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪" },
  { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷" },
  { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳" },
];

type StaffMember = {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  role: "Manager" | "Cashier" | "Supervisor";
  email: string;
  dialCode: string;
  phone: string;
  country: string;
  status: "Active" | "On Leave" | "Suspended";
  joinDate: string;
  avatar: string | null;
  bio: string;
};

const INITIAL_STAFF: StaffMember[] = [
  { id: "1", employeeId: "EMP-001", firstName: "Harry", lastName: "Potter", role: "Manager", email: "harry@diagonalley.com", dialCode: "+44", phone: "7700 900077", country: "United Kingdom", status: "Active", joinDate: "2024-01-15", avatar: null, bio: "Head manager responsible for overall store operations." },
  { id: "2", employeeId: "EMP-002", firstName: "Ron", lastName: "Weasley", role: "Cashier", email: "ron@diagonalley.com", dialCode: "+44", phone: "7700 900123", country: "United Kingdom", status: "Active", joinDate: "2024-02-01", avatar: null, bio: "Friendly and reliable cashier." },
  { id: "3", employeeId: "EMP-003", firstName: "Hermione", lastName: "Granger", role: "Cashier", email: "hermione@diagonalley.com", dialCode: "+44", phone: "7700 900456", country: "United Kingdom", status: "On Leave", joinDate: "2024-02-01", avatar: null, bio: "Senior cashier on medical leave until end of month." },
  { id: "4", employeeId: "EMP-004", firstName: "Neville", lastName: "Longbottom", role: "Cashier", email: "neville@diagonalley.com", dialCode: "+44", phone: "7700 900789", country: "United Kingdom", status: "Active", joinDate: "2024-03-10", avatar: null, bio: "Part-time cashier, available mornings." },
];

const statusConfig = {
  Active: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" },
  "On Leave": { cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" },
  Suspended: { cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" },
};

const roleConfig = {
  Manager: { icon: Shield, color: "text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400" },
  Supervisor: { icon: BadgeCheck, color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400" },
  Cashier: { icon: BadgeCheck, color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" },
};

const inputClass = "w-full px-3 py-2.5 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] transition-all text-sm text-[var(--text-color)] placeholder-[var(--text-muted)]";

type FormData = Omit<StaffMember, "id">;

function emptyForm(): FormData {
  return {
    employeeId: `EMP-${String(Math.floor(Math.random() * 900) + 100)}`,
    firstName: "", lastName: "", role: "Cashier", email: "",
    dialCode: "+44", phone: "", country: "United Kingdom",
    status: "Active", joinDate: new Date().toISOString().split("T")[0],
    avatar: null, bio: "",
  };
}

function initials(m: StaffMember) {
  return `${m.firstName[0] ?? ""}${m.lastName[0] ?? ""}`.toUpperCase();
}

export default function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [addForm, setAddForm] = useState<FormData>(emptyForm());
  const [editForm, setEditForm] = useState<StaffMember | null>(null);

  const addAvatarRef = useRef<HTMLInputElement>(null);
  const editAvatarRef = useRef<HTMLInputElement>(null);

  const filteredStaff = staff.filter((m) => {
    const matchSearch = `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === "All" || m.role === filterRole;
    const matchStatus = filterStatus === "All" || m.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const handleAddAvatar = (e: React.ChangeEvent<HTMLInputElement>, form: FormData | StaffMember | null, setForm: (v: any) => void) => {
    const file = e.target.files?.[0];
    if (file && form) setForm({ ...form, avatar: URL.createObjectURL(file) });
  };

  const handleAddSubmit = () => {
    if (!addForm.firstName.trim() || !addForm.lastName.trim()) return;
    const newMember: StaffMember = { ...addForm, id: String(Date.now()) };
    setStaff([...staff, newMember]);
    setShowAdd(false);
    setAddForm(emptyForm());
  };

  const handleEditSubmit = () => {
    if (!editForm) return;
    setStaff(staff.map((m) => (m.id === editForm.id ? editForm : m)));
    setShowEdit(false);
    setEditForm(null);
  };

  const handleDelete = () => {
    if (!selectedMember) return;
    setStaff(staff.filter((m) => m.id !== selectedMember.id));
    setShowDelete(false);
    setSelectedMember(null);
  };

  const openDetail = (m: StaffMember) => { setSelectedMember(m); setShowDetail(true); };
  const openEdit = (m: StaffMember, e?: React.MouseEvent) => { e?.stopPropagation(); setEditForm({ ...m }); setShowEdit(true); };
  const openDelete = (m: StaffMember, e?: React.MouseEvent) => { e?.stopPropagation(); setSelectedMember(m); setShowDelete(true); };

  const Modal = ({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
          <h3 className="font-semibold text-[var(--text-color)]">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-color)] transition-colors"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="p-5 pt-0 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );

  const btnSecondary = "px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-color)] border border-[var(--border-color)] transition-colors";
  const btnPrimary = "px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[var(--color-pos-accent)] hover:bg-[var(--color-pos-accent-strong)] transition-colors";

  const StaffForm = ({
    form, setForm, avatarRef
  }: {
    form: FormData | StaffMember,
    setForm: (v: any) => void,
    avatarRef: React.RefObject<HTMLInputElement | null>
  }) => (
    <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
      {/* Avatar */}
      <div className="flex justify-center">
        <div
          className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-color)] flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:border-[var(--color-pos-accent)] transition-colors group"
          onClick={() => avatarRef.current?.click()}
        >
          {form.avatar ? (
            <img src={form.avatar} className="w-full h-full object-cover" alt="avatar" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {form.firstName?.[0] ?? ""}{form.lastName?.[0] ?? ""}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
            <Upload size={16} className="text-white" />
          </div>
        </div>
        <input ref={avatarRef as any} type="file" accept="image/*" className="hidden" onChange={(e) => handleAddAvatar(e, form, setForm)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">First Name *</label>
          <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputClass} placeholder="First name" />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Last Name *</label>
          <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputClass} placeholder="Last name" />
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Role</label>
          <div className="relative">
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as StaffMember["role"] })} className={cn(inputClass, "appearance-none cursor-pointer pr-8")}>
              <option value="Manager">Manager</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Cashier">Cashier</option>
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Status</label>
          <div className="relative">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as StaffMember["status"] })} className={cn(inputClass, "appearance-none cursor-pointer pr-8")}>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Suspended">Suspended</option>
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>

        <div className="col-span-2">
          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Email Address *</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="name@example.com" />
        </div>

        <div className="col-span-2">
          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Phone Number</label>
          <div className="flex gap-2">
            <div className="relative w-28 shrink-0">
              <select value={form.dialCode} onChange={(e) => setForm({ ...form, dialCode: e.target.value })} className={cn(inputClass, "appearance-none cursor-pointer pr-6 text-center")}>
                {COUNTRIES_DIAL.map((c) => <option key={c.code} value={c.dialCode}>{c.flag} {c.dialCode}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            </div>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={cn(inputClass, "flex-1")} placeholder="Phone number" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Country</label>
          <div className="relative">
            <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={cn(inputClass, "appearance-none cursor-pointer pr-8")}>
              {COUNTRIES_DIAL.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Date Joined</label>
          <input type="date" value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} className={inputClass} />
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Employee ID</label>
          <input type="text" value={form.employeeId} readOnly className={cn(inputClass, "opacity-60 cursor-not-allowed")} />
        </div>

        <div className="col-span-2">
          <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Bio / Notes</label>
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className={cn(inputClass, "resize-none")} rows={2} placeholder="Optional notes about this staff member" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-color)] tracking-tight">Staff Management</h1>
          <p className="text-[var(--text-muted)] text-sm">Manage your team members and their roles.</p>
        </div>
        <button onClick={() => { setAddForm(emptyForm()); setShowAdd(true); }} className="flex items-center gap-2 text-sm font-medium text-white bg-[var(--color-pos-accent)] hover:bg-[var(--color-pos-accent-strong)] px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98]">
          <UserPlus size={16} />Add Staff Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Staff", value: staff.length, color: "text-[var(--text-color)]" },
          { label: "Active", value: staff.filter((m) => m.status === "Active").length, color: "text-emerald-600" },
          { label: "On Leave", value: staff.filter((m) => m.status === "On Leave").length, color: "text-amber-500" },
          { label: "Managers", value: staff.filter((m) => m.role === "Manager").length, color: "text-violet-600" },
        ].map((s, i) => (
          <div key={i} className="bento-card p-5">
            <div className="text-xs font-medium text-[var(--text-muted)] mb-1">{s.label}</div>
            <div className={cn("text-2xl font-bold font-mono", s.color)}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
          <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] text-sm text-[var(--text-color)]" />
        </div>
        <div className="relative">
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="pl-3 pr-8 py-2.5 rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] text-sm text-[var(--text-color)] appearance-none cursor-pointer">
            <option value="All">All Roles</option>
            <option value="Manager">Manager</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Cashier">Cashier</option>
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="pl-3 pr-8 py-2.5 rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pos-accent)] text-sm text-[var(--text-color)] appearance-none cursor-pointer">
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Suspended">Suspended</option>
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
        </div>
      </div>

      {/* Staff Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredStaff.map((member) => {
          const RoleIcon = roleConfig[member.role].icon;
          return (
            <div
              key={member.id}
              className="bento-card p-5 flex flex-col relative group overflow-hidden cursor-pointer hover:shadow-md transition-all"
              onClick={() => openDetail(member)}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                  {member.avatar ? (
                    <img src={member.avatar} className="w-full h-full object-cover" alt={member.firstName} />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg">
                      {initials(member)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--text-color)] truncate">{member.firstName} {member.lastName}</h3>
                  <div className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1", roleConfig[member.role].color)}>
                    <RoleIcon size={11} />
                    {member.role}
                  </div>
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <button onClick={(e) => openEdit(member, e)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--color-pos-accent)] hover:bg-[var(--color-pos-accent-soft)] transition-colors">
                    <Edit size={15} />
                  </button>
                  <button onClick={(e) => openDelete(member, e)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <Mail size={14} className="shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <Phone size={14} className="shrink-0" />
                  <span>{member.dialCode} {member.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <Calendar size={14} className="shrink-0" />
                  <span>Joined {new Date(member.joinDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", statusConfig[member.status].cls)}>
                  {member.status}
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)]">{member.employeeId}</span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredStaff.length === 0 && (
        <div className="bento-card flex flex-col items-center justify-center py-16 text-center">
          <Users size={32} className="text-[var(--text-muted)] mb-4" />
          <h3 className="font-medium text-[var(--text-color)]">No staff found</h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* ── Add Modal ──────────────────────────────────────────────────────── */}
      {showAdd && (
        <Modal
          title="Add Staff Member"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className={btnSecondary} onClick={() => setShowAdd(false)}>Cancel</button>
              <button className={btnPrimary} onClick={handleAddSubmit}>Add Staff</button>
            </>
          }
        >
          <StaffForm form={addForm} setForm={setAddForm} avatarRef={addAvatarRef} />
        </Modal>
      )}

      {/* ── Detail Modal ───────────────────────────────────────────────────── */}
      {showDetail && selectedMember && (
        <Modal
          title="Staff Profile"
          onClose={() => setShowDetail(false)}
          footer={
            <>
              <button className={cn(btnSecondary, "text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-500/10")} onClick={() => { setShowDetail(false); openDelete(selectedMember); }}>
                <Trash2 size={14} className="inline mr-1.5" />Remove
              </button>
              <button className={btnPrimary} onClick={() => { setShowDetail(false); openEdit(selectedMember); }}>
                <Edit size={14} className="inline mr-1.5" />Edit Profile
              </button>
            </>
          }
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm shrink-0">
                {selectedMember.avatar ? (
                  <img src={selectedMember.avatar} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xl">
                    {initials(selectedMember)}
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-lg font-semibold text-[var(--text-color)]">{selectedMember.firstName} {selectedMember.lastName}</h4>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full", roleConfig[selectedMember.role].color)}>
                    {selectedMember.role}
                  </span>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", statusConfig[selectedMember.status].cls)}>
                    {selectedMember.status}
                  </span>
                </div>
                {selectedMember.bio && <p className="text-xs text-[var(--text-muted)] mt-2 max-w-[280px]">{selectedMember.bio}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                ["Employee ID", selectedMember.employeeId],
                ["Date Joined", new Date(selectedMember.joinDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })],
                ["Email", selectedMember.email],
                ["Phone", `${selectedMember.dialCode} ${selectedMember.phone}`],
                ["Country", selectedMember.country],
              ].map(([label, value]) => (
                <div key={label} className={cn("p-3 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)]", label === "Email" || label === "Country" ? "col-span-2" : "")}>
                  <div className="text-xs text-[var(--text-muted)] mb-0.5">{label}</div>
                  <div className="text-sm font-medium text-[var(--text-color)] break-all">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      {showEdit && editForm && (
        <Modal
          title="Edit Staff Member"
          onClose={() => setShowEdit(false)}
          footer={
            <>
              <button className={btnSecondary} onClick={() => setShowEdit(false)}>Cancel</button>
              <button className={btnPrimary} onClick={handleEditSubmit}>Save Changes</button>
            </>
          }
        >
          <StaffForm form={editForm} setForm={setEditForm} avatarRef={editAvatarRef} />
        </Modal>
      )}

      {/* ── Delete Modal ───────────────────────────────────────────────────── */}
      {showDelete && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDelete(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-color)]">Remove Staff Member</h3>
                <p className="text-xs text-[var(--text-muted)]">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              Are you sure you want to remove <strong className="text-[var(--text-color)]">{selectedMember.firstName} {selectedMember.lastName}</strong> from the system? All their associated data will be archived.
            </p>
            <div className="flex gap-3">
              <button className={cn(btnSecondary, "flex-1")} onClick={() => setShowDelete(false)}>Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
