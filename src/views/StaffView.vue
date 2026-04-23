<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { deleteStaff, getStaff, updateStaff } from '../../api/pos'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

interface StaffMember {
  id: number
  username: string
  role: string
  is_active: boolean
  first_name: string | null
  last_name: string | null
  email: string | null
  created_at?: string
}

// ── State ─────────────────────────────────────────────────────────────────────
const staffList = ref<StaffMember[]>([])
const isLoading = ref(false)
const loadError = ref('')
const searchTerm = ref('')
const filterRole = ref('All')
const filterStatus = ref('All')

// Add modal
const showAdd = ref(false)
const isAdding = ref(false)
const addError = ref('')
const addForm = reactive({
  username: '',
  password: '',
  role: 'cashier' as 'cashier' | 'manager',
  first_name: '',
  last_name: '',
  email: '',
})

// Detail modal
const showDetail = ref(false)
const selectedMember = ref<StaffMember | null>(null)

// Edit modal
const showEdit = ref(false)
const isEditing = ref(false)
const editError = ref('')
const editForm = reactive({
  id: 0,
  first_name: '',
  last_name: '',
  email: '',
  role: 'cashier' as 'cashier' | 'manager',
  is_active: true,
})

// Delete modal
const showDelete = ref(false)
const deleteTarget = ref<StaffMember | null>(null)
const isDeleting = ref(false)

// ── Computed ──────────────────────────────────────────────────────────────────
const filteredStaff = computed(() => {
  return staffList.value.filter((m) => {
    const haystack = `${m.first_name ?? ''} ${m.last_name ?? ''} ${m.username} ${m.email ?? ''}`.toLowerCase()
    const matchSearch = haystack.includes(searchTerm.value.toLowerCase())
    const matchRole = filterRole.value === 'All' || m.role === filterRole.value.toLowerCase()
    const matchStatus =
      filterStatus.value === 'All' ||
      (filterStatus.value === 'Active' && m.is_active) ||
      (filterStatus.value === 'Inactive' && !m.is_active)
    return matchSearch && matchRole && matchStatus
  })
})

const activeCount = computed(() => staffList.value.filter((m) => m.is_active).length)
const inactiveCount = computed(() => staffList.value.filter((m) => !m.is_active).length)
const managerCount = computed(() => staffList.value.filter((m) => m.role === 'manager').length)

// ── Helpers ───────────────────────────────────────────────────────────────────
const initials = (m: StaffMember) => {
  const f = m.first_name?.[0] ?? ''
  const l = m.last_name?.[0] ?? ''
  return (f + l).toUpperCase() || m.username.slice(0, 2).toUpperCase()
}

const displayName = (m: StaffMember) =>
  [m.first_name, m.last_name].filter(Boolean).join(' ') || m.username

const formatDate = (iso?: string) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ── Load ─────────────────────────────────────────────────────────────────────
const loadStaff = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    staffList.value = await getStaff()
  } catch (e: unknown) {
    loadError.value = e instanceof Error ? e.message : 'Failed to load staff'
  } finally {
    isLoading.value = false
  }
}

// ── Add ───────────────────────────────────────────────────────────────────────
const openAdd = () => {
  Object.assign(addForm, { username: '', password: '', role: 'cashier', first_name: '', last_name: '', email: '' })
  addError.value = ''
  showAdd.value = true
}

const submitAdd = async () => {
  if (!addForm.username.trim() || !addForm.password.trim()) {
    addError.value = 'Username and password are required'
    return
  }
  isAdding.value = true
  addError.value = ''
  const result = await authStore.createUser(addForm.username, addForm.password, addForm.role)
  if (result.success) {
    showAdd.value = false
    await loadStaff()
  } else {
    addError.value = result.error || 'Failed to create account'
  }
  isAdding.value = false
}

// ── Detail ────────────────────────────────────────────────────────────────────
const openDetail = (m: StaffMember) => {
  selectedMember.value = m
  showDetail.value = true
}

// ── Edit ──────────────────────────────────────────────────────────────────────
const openEdit = (m: StaffMember) => {
  showDetail.value = false
  Object.assign(editForm, {
    id: m.id,
    first_name: m.first_name ?? '',
    last_name: m.last_name ?? '',
    email: m.email ?? '',
    role: m.role as 'cashier' | 'manager',
    is_active: m.is_active,
  })
  editError.value = ''
  showEdit.value = true
}

const submitEdit = async () => {
  isEditing.value = true
  editError.value = ''
  try {
    await updateStaff(editForm.id, {
      first_name: editForm.first_name || null,
      last_name: editForm.last_name || null,
      email: editForm.email || null,
      role: editForm.role,
      is_active: editForm.is_active,
    })
    showEdit.value = false
    await loadStaff()
  } catch (e: unknown) {
    editError.value = e instanceof Error ? e.message : 'Failed to update staff member'
  } finally {
    isEditing.value = false
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
const openDelete = (m: StaffMember) => {
  showDetail.value = false
  deleteTarget.value = m
  showDelete.value = true
}

const submitDelete = async () => {
  if (!deleteTarget.value) return
  isDeleting.value = true
  try {
    await deleteStaff(deleteTarget.value.id)
    showDelete.value = false
    deleteTarget.value = null
    await loadStaff()
  } catch {
    // keep modal open on failure
  } finally {
    isDeleting.value = false
  }
}

onMounted(loadStaff)
</script>

<template>
  <div class="staff-page">

    <!-- ── Header ── -->
    <div class="staff-header">
      <div>
        <h1 class="page-title">Staff Management</h1>
        <p class="page-sub">Manage your team members and their roles.</p>
      </div>
      <button class="add-btn" @click="openAdd">
        <span class="mdi mdi-account-plus" style="font-size:16px" />
        Add Staff Member
      </button>
    </div>

    <!-- ── Stats ── -->
    <div class="stats-grid">
      <div class="stat-card bento-card">
        <div class="stat-label">Total Staff</div>
        <div class="stat-value">{{ staffList.length }}</div>
      </div>
      <div class="stat-card bento-card">
        <div class="stat-label">Active</div>
        <div class="stat-value stat-value--green">{{ activeCount }}</div>
      </div>
      <div class="stat-card bento-card">
        <div class="stat-label">Inactive</div>
        <div class="stat-value stat-value--amber">{{ inactiveCount }}</div>
      </div>
      <div class="stat-card bento-card">
        <div class="stat-label">Managers</div>
        <div class="stat-value stat-value--violet">{{ managerCount }}</div>
      </div>
    </div>

    <!-- ── Filters ── -->
    <div class="filters-row">
      <div class="search-wrap">
        <span class="mdi mdi-magnify search-icon" />
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Search by name or email…"
          class="search-input"
        />
      </div>
      <div class="select-wrap">
        <select v-model="filterRole" class="filter-select">
          <option value="All">All Roles</option>
          <option value="Manager">Manager</option>
          <option value="Cashier">Cashier</option>
        </select>
        <span class="mdi mdi-chevron-down select-chevron" />
      </div>
      <div class="select-wrap">
        <select v-model="filterStatus" class="filter-select">
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <span class="mdi mdi-chevron-down select-chevron" />
      </div>
    </div>

    <div v-if="loadError" class="load-error">{{ loadError }}</div>

    <div v-if="isLoading" class="loading-state">
      <v-progress-circular indeterminate color="primary" size="32" />
      <span>Loading staff…</span>
    </div>

    <!-- ── Staff cards ── -->
    <div v-else-if="filteredStaff.length > 0" class="staff-grid">
      <div
        v-for="member in filteredStaff"
        :key="member.id"
        class="staff-card bento-card"
        @click="openDetail(member)"
      >
        <!-- Hover actions -->
        <div class="hover-actions" @click.stop>
          <button class="icon-action" title="Edit" @click.stop="openEdit(member)">
            <span class="mdi mdi-pencil-outline" style="font-size:15px" />
          </button>
          <button
            v-if="member.id !== authStore.user?.id"
            class="icon-action icon-action--danger"
            title="Remove"
            @click.stop="openDelete(member)"
          >
            <span class="mdi mdi-trash-can-outline" style="font-size:15px" />
          </button>
        </div>

        <!-- Top: avatar + name + role -->
        <div class="card-top">
          <div class="avatar-wrap" :class="member.role === 'manager' ? 'avatar--manager' : 'avatar--cashier'">
            {{ initials(member) }}
          </div>
          <div class="card-identity">
            <h3 class="card-name">{{ displayName(member) }}</h3>
            <div class="role-badge" :class="member.role === 'manager' ? 'role-badge--manager' : 'role-badge--cashier'">
              <span :class="['mdi', member.role === 'manager' ? 'mdi-shield-account' : 'mdi-account-badge-outline']" style="font-size:11px" />
              {{ member.role === 'manager' ? 'Manager' : 'Cashier' }}
            </div>
          </div>
        </div>

        <!-- Info rows -->
        <div class="card-info">
          <div v-if="member.email" class="info-row">
            <span class="mdi mdi-email-outline info-icon" />
            <span class="info-text truncate">{{ member.email }}</span>
          </div>
          <div class="info-row">
            <span class="mdi mdi-calendar-outline info-icon" />
            <span class="info-text">Joined {{ formatDate(member.created_at) }}</span>
          </div>
          <div class="info-row">
            <span class="mdi mdi-account-outline info-icon" />
            <span class="info-text mono">{{ member.username }}</span>
          </div>
        </div>

        <!-- Footer: status + you badge -->
        <div class="card-footer">
          <span class="status-badge" :class="member.is_active ? 'status-badge--active' : 'status-badge--inactive'">
            {{ member.is_active ? 'Active' : 'Inactive' }}
          </span>
          <span v-if="member.id === authStore.user?.id" class="you-badge">You</span>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!isLoading" class="empty-state bento-card">
      <span class="mdi mdi-account-group-outline empty-icon" />
      <h3 class="empty-title">No staff found</h3>
      <p class="empty-sub">Try adjusting your search or filters.</p>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         ADD MODAL
    ══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showAdd" class="modal-backdrop" @click="showAdd = false">
        <div class="modal-box" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">Add Staff Member</h3>
            <button class="modal-close" @click="showAdd = false">
              <span class="mdi mdi-close" style="font-size:18px" />
            </button>
          </div>
          <div class="modal-body scroll-body">
            <div v-if="addError" class="form-error">{{ addError }}</div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">First Name</label>
                <input v-model="addForm.first_name" type="text" class="form-input" placeholder="First name" />
              </div>
              <div class="form-group">
                <label class="form-label">Last Name</label>
                <input v-model="addForm.last_name" type="text" class="form-input" placeholder="Last name" />
              </div>
              <div class="form-group col-span-2">
                <label class="form-label">Email Address</label>
                <input v-model="addForm.email" type="email" class="form-input" placeholder="name@example.com" />
              </div>
              <div class="form-group col-span-2">
                <label class="form-label">Username <span class="required">*</span></label>
                <input v-model="addForm.username" type="text" class="form-input" placeholder="login username" autocomplete="off" />
              </div>
              <div class="form-group col-span-2">
                <label class="form-label">Temporary Password <span class="required">*</span></label>
                <input v-model="addForm.password" type="password" class="form-input" placeholder="••••••••" autocomplete="new-password" />
              </div>
              <div class="form-group col-span-2">
                <label class="form-label role-label">Role</label>
                <div class="role-picker">
                  <button
                    type="button"
                    class="role-option"
                    :class="{ 'role-option--active': addForm.role === 'cashier' }"
                    @click="addForm.role = 'cashier'"
                  >
                    <span class="mdi mdi-account-badge-outline" style="font-size:20px" />
                    <div class="role-option-label">Cashier</div>
                    <div class="role-option-desc">Point-of-sale access only</div>
                  </button>
                  <button
                    type="button"
                    class="role-option"
                    :class="{ 'role-option--active': addForm.role === 'manager' }"
                    @click="addForm.role = 'manager'"
                  >
                    <span class="mdi mdi-shield-account" style="font-size:20px" />
                    <div class="role-option-label">Manager</div>
                    <div class="role-option-desc">Full system access</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="showAdd = false">Cancel</button>
            <button class="btn-primary" :disabled="isAdding" @click="submitAdd">
              {{ isAdding ? 'Adding…' : 'Add Staff' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════
         DETAIL MODAL
    ══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showDetail && selectedMember" class="modal-backdrop" @click="showDetail = false">
        <div class="modal-box" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">Staff Profile</h3>
            <button class="modal-close" @click="showDetail = false">
              <span class="mdi mdi-close" style="font-size:18px" />
            </button>
          </div>
          <div class="modal-body">
            <!-- Profile header -->
            <div class="detail-profile">
              <div
                class="detail-avatar"
                :class="selectedMember.role === 'manager' ? 'avatar--manager' : 'avatar--cashier'"
              >
                {{ initials(selectedMember) }}
              </div>
              <div>
                <h4 class="detail-name">{{ displayName(selectedMember) }}</h4>
                <div class="detail-badges">
                  <span class="role-badge" :class="selectedMember.role === 'manager' ? 'role-badge--manager' : 'role-badge--cashier'">
                    {{ selectedMember.role === 'manager' ? 'Manager' : 'Cashier' }}
                  </span>
                  <span class="status-badge" :class="selectedMember.is_active ? 'status-badge--active' : 'status-badge--inactive'">
                    {{ selectedMember.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Detail grid -->
            <div class="detail-grid">
              <div class="detail-field">
                <div class="detail-field-label">Username</div>
                <div class="detail-field-value mono">{{ selectedMember.username }}</div>
              </div>
              <div class="detail-field">
                <div class="detail-field-label">Date Joined</div>
                <div class="detail-field-value">{{ formatDate(selectedMember.created_at) }}</div>
              </div>
              <div v-if="selectedMember.email" class="detail-field detail-field--wide">
                <div class="detail-field-label">Email</div>
                <div class="detail-field-value">{{ selectedMember.email }}</div>
              </div>
              <div v-if="selectedMember.first_name || selectedMember.last_name" class="detail-field detail-field--wide">
                <div class="detail-field-label">Full Name</div>
                <div class="detail-field-value">{{ displayName(selectedMember) }}</div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              v-if="selectedMember.id !== authStore.user?.id"
              class="btn-danger-outline"
              @click="openDelete(selectedMember)"
            >
              <span class="mdi mdi-trash-can-outline" style="font-size:14px" />
              Remove
            </button>
            <button class="btn-primary" @click="openEdit(selectedMember)">
              <span class="mdi mdi-pencil-outline" style="font-size:14px" />
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════
         EDIT MODAL
    ══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showEdit" class="modal-backdrop" @click="showEdit = false">
        <div class="modal-box" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">Edit Staff Member</h3>
            <button class="modal-close" @click="showEdit = false">
              <span class="mdi mdi-close" style="font-size:18px" />
            </button>
          </div>
          <div class="modal-body scroll-body">
            <div v-if="editError" class="form-error">{{ editError }}</div>
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">First Name</label>
                <input v-model="editForm.first_name" type="text" class="form-input" placeholder="First name" />
              </div>
              <div class="form-group">
                <label class="form-label">Last Name</label>
                <input v-model="editForm.last_name" type="text" class="form-input" placeholder="Last name" />
              </div>
              <div class="form-group col-span-2">
                <label class="form-label">Email Address</label>
                <input v-model="editForm.email" type="email" class="form-input" placeholder="name@example.com" />
              </div>
              <div class="form-group">
                <label class="form-label">Role</label>
                <div class="select-wrap" style="width:100%">
                  <select v-model="editForm.role" class="filter-select" style="width:100%">
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                  </select>
                  <span class="mdi mdi-chevron-down select-chevron" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Status</label>
                <div class="select-wrap" style="width:100%">
                  <select v-model="editForm.is_active" class="filter-select" style="width:100%">
                    <option :value="true">Active</option>
                    <option :value="false">Inactive</option>
                  </select>
                  <span class="mdi mdi-chevron-down select-chevron" />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="showEdit = false">Cancel</button>
            <button class="btn-primary" :disabled="isEditing" @click="submitEdit">
              {{ isEditing ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════
         DELETE MODAL
    ══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showDelete && deleteTarget" class="modal-backdrop" @click="showDelete = false">
        <div class="modal-box modal-box--sm" @click.stop>
          <div class="delete-icon-row">
            <div class="delete-icon-wrap">
              <span class="mdi mdi-trash-can-outline" style="font-size:20px;color:#ef4444" />
            </div>
            <div>
              <h3 class="modal-title">Remove Staff Member</h3>
              <p class="delete-sub">This action cannot be undone.</p>
            </div>
          </div>
          <p class="delete-body">
            Are you sure you want to remove
            <strong>{{ displayName(deleteTarget) }}</strong>
            from the system? All their associated data will be archived.
          </p>
          <div class="delete-footer">
            <button class="btn-secondary flex-1" @click="showDelete = false">Cancel</button>
            <button class="btn-danger flex-1" :disabled="isDeleting" @click="submitDelete">
              {{ isDeleting ? 'Removing…' : 'Remove' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
/* ── Page ── */
.staff-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
@media (min-width: 1024px) { .staff-page { padding: 32px; } }

/* ── Header ── */
.staff-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
@media (min-width: 768px) {
  .staff-header { flex-direction: row; align-items: center; justify-content: space-between; }
}
.page-title { font-size: 24px; font-weight: 700; color: var(--text-color); letter-spacing: -0.02em; }
.page-sub   { font-size: 14px; color: var(--text-muted); margin-top: 2px; }

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 12px;
  background: var(--color-pos-accent);
  color: white;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  transition: background 0.15s, transform 0.1s;
  font-family: var(--pos-sans);
  white-space: nowrap;
}
.add-btn:hover { background: var(--color-pos-accent-strong); }
.add-btn:active { transform: scale(0.98); }

/* ── Stats ── */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (min-width: 768px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }

.stat-card { padding: 20px; }
.stat-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}
.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-color);
  font-family: var(--pos-mono);
  line-height: 1;
}
.stat-value--green  { color: #16a34a; }
.stat-value--amber  { color: #d97706; }
.stat-value--violet { color: #7c3aed; }

/* ── Filters ── */
.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.search-wrap {
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 320px;
}
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: var(--text-muted);
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 10px 16px 10px 38px;
  border-radius: 12px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  outline: none;
  font-size: 14px;
  color: var(--text-color);
  font-family: var(--pos-sans);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-input:focus {
  border-color: var(--color-pos-accent);
  box-shadow: 0 0 0 3px var(--color-pos-accent-soft);
}
.search-input::placeholder { color: var(--text-muted); }

.select-wrap { position: relative; }
.filter-select {
  padding: 10px 32px 10px 12px;
  border-radius: 12px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  outline: none;
  font-size: 14px;
  color: var(--text-color);
  font-family: var(--pos-sans);
  appearance: none;
  cursor: pointer;
  transition: border-color 0.15s;
}
.filter-select:focus {
  border-color: var(--color-pos-accent);
  box-shadow: 0 0 0 3px var(--color-pos-accent-soft);
}
.select-chevron {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  color: var(--text-muted);
  pointer-events: none;
}

/* ── Loading / Error ── */
.load-error {
  color: #ef4444;
  font-size: 14px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
}
.loading-state {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
  font-size: 14px;
  padding: 40px;
  justify-content: center;
}

/* ── Staff grid ── */
.staff-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}
@media (min-width: 768px)  { .staff-grid { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1280px) { .staff-grid { grid-template-columns: 1fr 1fr 1fr; } }

/* ── Staff card ── */
.staff-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  position: relative;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.15s;
  overflow: hidden;
}
.staff-card:hover { box-shadow: 0 8px 30px rgba(0,0,0,0.08); }

.hover-actions {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}
.staff-card:hover .hover-actions { opacity: 1; }

.icon-action {
  padding: 6px;
  border-radius: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  transition: color 0.15s, background 0.15s;
}
.icon-action:hover { color: var(--color-pos-accent); background: var(--color-pos-accent-soft); }
.icon-action--danger:hover { color: #ef4444; background: #fef2f2; }

/* ── Card sections ── */
.card-top {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 16px;
}

.avatar-wrap {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: 0.04em;
}
.avatar--manager { background: rgba(124,58,237,0.12); color: #7c3aed; }
.avatar--cashier  { background: var(--color-pos-accent-soft); color: var(--color-pos-accent-strong); }

.card-identity { flex: 1; min-width: 0; }
.card-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 9999px;
}
.role-badge--manager { background: rgba(124,58,237,0.1); color: #7c3aed; }
.role-badge--cashier  { background: var(--color-pos-accent-soft); color: var(--color-pos-accent-strong); }

.card-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}
.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-muted);
}
.info-icon { font-size: 14px; flex-shrink: 0; }
.info-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mono { font-family: var(--pos-mono); font-size: 12px; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.card-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
}
.status-badge--active   { background: #ecfdf5; color: #065f46; border-color: #a7f3d0; }
.status-badge--inactive { background: #fef2f2; color: #991b1b; border-color: #fecaca; }

.you-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--border-color);
  padding: 2px 10px;
  border-radius: 9999px;
}

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}
.empty-icon { font-size: 36px; color: var(--text-muted); margin-bottom: 12px; }
.empty-title { font-size: 16px; font-weight: 600; color: var(--text-color); }
.empty-sub   { font-size: 14px; color: var(--text-muted); margin-top: 4px; }

/* ══════════════════════════════════════════════════════════
   MODALS
══════════════════════════════════════════════════════════ */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
}

.modal-box {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  width: 100%;
  max-width: 512px;
  position: relative;
}
.modal-box--sm { max-width: 400px; padding: 24px; }

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border-color);
}
.modal-title { font-size: 16px; font-weight: 600; color: var(--text-color); }
.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px;
  border-radius: 8px;
  display: flex;
  transition: background 0.15s, color 0.15s;
}
.modal-close:hover { background: var(--bg-color); color: var(--text-color); }

.modal-body { padding: 20px; }
.scroll-body { max-height: 65vh; overflow-y: auto; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 20px 20px;
}

/* ── Forms ── */
.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { display: flex; flex-direction: column; }
.col-span-2 { grid-column: span 2; }

.form-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  margin-bottom: 4px;
}
.role-label { text-transform: uppercase; letter-spacing: 0.1em; }
.required { color: #ef4444; }

.form-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  outline: none;
  font-size: 14px;
  color: var(--text-color);
  font-family: var(--pos-sans);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.form-input::placeholder { color: var(--text-muted); }
.form-input:focus {
  border-color: var(--color-pos-accent);
  box-shadow: 0 0 0 3px var(--color-pos-accent-soft);
}

.form-error {
  font-size: 13px;
  color: #ef4444;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 14px;
}

.role-picker { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.role-option {
  background: var(--bg-color);
  border: 1.5px solid var(--border-color);
  border-radius: 12px;
  padding: 14px 10px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-family: var(--pos-sans);
}
.role-option:hover { border-color: var(--color-pos-accent); background: var(--color-pos-accent-soft); }
.role-option--active { border-color: var(--color-pos-accent) !important; background: var(--color-pos-accent-soft) !important; }
.role-option-label { font-size: 13px; font-weight: 700; color: var(--text-color); margin-top: 4px; }
.role-option-desc  { font-size: 11px; color: var(--text-muted); line-height: 1.3; }

/* ── Detail modal ── */
.detail-profile {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.detail-avatar {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.detail-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 6px;
}
.detail-badges { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }

.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.detail-field {
  padding: 12px;
  border-radius: 10px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
}
.detail-field--wide { grid-column: span 2; }
.detail-field-label { font-size: 12px; color: var(--text-muted); margin-bottom: 3px; }
.detail-field-value { font-size: 14px; font-weight: 500; color: var(--text-color); word-break: break-all; }

/* ── Delete modal ── */
.delete-icon-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}
.delete-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #fef2f2;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.delete-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.delete-body { font-size: 14px; color: var(--text-muted); line-height: 1.6; margin-bottom: 24px; }
.delete-footer { display: flex; gap: 12px; }

/* ── Buttons ── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  background: var(--color-pos-accent);
  border: none;
  cursor: pointer;
  transition: background 0.15s;
  font-family: var(--pos-sans);
}
.btn-primary:hover:not(:disabled) { background: var(--color-pos-accent-strong); }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

.btn-secondary {
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  border: 1px solid var(--border-color);
  background: transparent;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-family: var(--pos-sans);
}
.btn-secondary:hover { background: var(--bg-color); color: var(--text-color); }

.btn-danger-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #ef4444;
  border: 1px solid #fecaca;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s;
  font-family: var(--pos-sans);
}
.btn-danger-outline:hover { background: #fef2f2; }

.btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  background: #ef4444;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
  font-family: var(--pos-sans);
}
.btn-danger:hover:not(:disabled) { background: #dc2626; }
.btn-danger:disabled { opacity: 0.7; cursor: not-allowed; }

.flex-1 { flex: 1; }
</style>
