import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarCheck,
  Edit,
  Loader2,
  Plus,
  Search,
  UserRound,
  X
} from 'lucide-react';
import { employeeApi } from '../../api/employee';
import { formatPhoneNumber } from '../../lib/utils';
import { formatNumber, getLocale } from '../../lib/format';
import BottomSheet from '../../components/ui/BottomSheet';

const initialEmployeesState = {
  status: 'idle',
  data: [],
  error: null,
  meta: null
};

const formInitialState = {
  name: '',
  phone: '',
  salary: '',
  password: ''
};

const attendanceInitialState = {
  date: '2025-06-16',
  status: 'present'
};

const formatAmount = (amount) => `${formatNumber(amount)} MRU`;

const formatDate = (isoDate) => {
  if (!isoDate) return '-';
  return new Intl.DateTimeFormat(getLocale(), {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).format(new Date(isoDate));
};

const toUtcDate = (dateValue) => `${dateValue}T00:00:00.000Z`;

export default function Employees() {
  const { t } = useTranslation();
  const [employeesState, setEmployeesState] = useState(initialEmployeesState);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [formData, setFormData] = useState(formInitialState);
  const [attendanceData, setAttendanceData] = useState(attendanceInitialState);
  const [mutationState, setMutationState] = useState({ status: 'idle', error: null });

  const loadEmployees = useCallback(async () => {
    setEmployeesState((current) => ({ ...current, status: 'loading', error: null }));

    try {
      const response = await employeeApi.getEmployees({ page: 1, limit: 20 });
      setEmployeesState({
        status: 'success',
        data: response.data,
        error: null,
        meta: response.meta
      });
    } catch (error) {
      setEmployeesState({
        status: 'error',
        data: [],
        error: error.message || 'Impossible de charger les employes.',
        meta: null
      });
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadEmployees();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadEmployees]);

  const selectedEmployee = useMemo(
    () => employeesState.data.find((employee) => employee._id === selectedEmployeeId) ?? null,
    [employeesState.data, selectedEmployeeId]
  );

  const filteredEmployees = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return employeesState.data;
    }

    return employeesState.data.filter((employee) =>
      employee.name.toLowerCase().includes(query) ||
      employee.phone.includes(query)
    );
  }, [employeesState.data, searchTerm]);

  const openCreateModal = () => {
    setFormData(formInitialState);
    setMutationState({ status: 'idle', error: null });
    setModalMode('create');
  };

  const openEditModal = (employee) => {
    setSelectedEmployeeId(employee._id);
    setFormData({
      name: employee.name,
      phone: formatPhoneNumber(employee.phone),
      salary: String(employee.salary ?? 0),
      password: ''
    });
    setMutationState({ status: 'idle', error: null });
    setModalMode('edit');
  };

  const openAttendanceModal = (employee) => {
    setSelectedEmployeeId(employee._id);
    setAttendanceData(attendanceInitialState);
    setMutationState({ status: 'idle', error: null });
    setModalMode('attendance');
  };

  const closeModal = () => {
    setModalMode(null);
    setMutationState({ status: 'idle', error: null });
  };

  const updateEmployeeInState = (updatedEmployee) => {
    setEmployeesState((current) => ({
      ...current,
      data: current.data.map((employee) =>
        employee._id === updatedEmployee._id ? updatedEmployee : employee
      )
    }));
  };

  const handleEmployeeSubmit = async (event) => {
    event.preventDefault();
    setMutationState({ status: 'loading', error: null });

    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      salary: Number(formData.salary || 0)
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    try {
      if (modalMode === 'create') {
        const response = await employeeApi.createEmployee(payload);
        setEmployeesState((current) => ({
          ...current,
          data: [...current.data, response.data],
          meta: current.meta
            ? { ...current.meta, total: current.meta.total + 1 }
            : current.meta
        }));
      }

      if (modalMode === 'edit' && selectedEmployee) {
        const response = await employeeApi.updateEmployee(selectedEmployee._id, payload);
        updateEmployeeInState(response.data);
      }

      closeModal();
    } catch (error) {
      setMutationState({
        status: 'error',
        error: error.message || 'Operation impossible.'
      });
    }
  };

  const handleAttendanceSubmit = async (event) => {
    event.preventDefault();
    if (!selectedEmployee) return;

    setMutationState({ status: 'loading', error: null });

    try {
      const response = await employeeApi.updateAttendance(selectedEmployee._id, {
        date: toUtcDate(attendanceData.date),
        status: attendanceData.status
      });
      updateEmployeeInState({
        ...selectedEmployee,
        attendance: response.data.allAttendance
      });
      closeModal();
    } catch (error) {
      setMutationState({
        status: 'error',
        error: error.message || 'Impossible de marquer la presence.'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {t('employees')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('employeesPage.description')}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-500 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" />
          {t('employeesPage.addButton')}
        </button>
      </div>

      <div className="rounded-2xl border border-surface-border bg-card">
        <div className="flex flex-col gap-3 border-b border-surface-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full max-w-md">
            <span className="sr-only">{t('employeesPage.searchPlaceholder')}</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t('employeesPage.searchPlaceholder')}
              className="!pl-9 !pr-4 !py-2.5"
            />
          </label>
          <span className="text-sm text-muted-foreground">
            {employeesState.meta?.total ?? employeesState.data.length} total
          </span>
        </div>

        {employeesState.status === 'loading' && <EmployeesLoading />}

        {employeesState.status === 'error' && (
          <div className="p-6 text-sm text-rose-600 dark:text-rose-400">
            {employeesState.error}
          </div>
        )}

        {employeesState.status === 'success' && filteredEmployees.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {t('employeesPage.emptyState')}
          </div>
        )}

        {employeesState.status === 'success' && filteredEmployees.length > 0 && (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-surface-border">
              {filteredEmployees.map((employee) => (
                <div key={employee._id} className="px-4 py-3 hover:bg-accent">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      onClick={() => setSelectedEmployeeId(employee._id)}
                      className="font-medium text-text-primary text-sm"
                    >
                      {employee.name}
                    </button>
                    <span className="inline-flex items-center rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                      {employee.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{formatPhoneNumber(employee.phone)}</span>
                    <span className="text-sm font-medium text-text-primary tabular-nums">{formatAmount(employee.salary)}</span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(employee)}
                      className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-hover active:scale-[0.97]"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      {t('employeesPage.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => openAttendanceModal(employee)}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary/20 active:scale-[0.97]"
                    >
                      <CalendarCheck className="h-3.5 w-3.5" />
                      {t('employeesPage.attendance')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden sm:block">
              <table className="w-full text-left text-sm">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">{t('employeesPage.headers.name')}</th>
                    <th className="px-6 py-4 font-medium">{t('employeesPage.headers.phone')}</th>
                    <th className="px-6 py-4 font-medium">{t('employeesPage.headers.role')}</th>
                    <th className="px-6 py-4 text-right font-medium">{t('employeesPage.headers.salary')}</th>
                    <th className="px-6 py-4 text-right font-medium">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee._id} className="transition-colors hover:bg-accent">
                      <td className="px-6 py-4 min-w-[100px]">
                        <button
                          type="button"
                          onClick={() => setSelectedEmployeeId(employee._id)}
                          className="font-medium text-text-primary underline-offset-4 hover:underline text-sm"
                        >
                          {employee.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{formatPhoneNumber(employee.phone)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-primary">
                          {employee.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-text-primary whitespace-nowrap tabular-nums">
                        {formatAmount(employee.salary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(employee)}
                            className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover"
                          >
                            <Edit className="h-4 w-4" />
                            {t('employeesPage.edit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => openAttendanceModal(employee)}
                            className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-sm text-primary transition-colors hover:bg-primary/20"
                          >
                            <CalendarCheck className="h-4 w-4" />
                            {t('employeesPage.attendance')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {selectedEmployee && (
        <EmployeeDetail employee={selectedEmployee} onClose={() => setSelectedEmployeeId(null)} />
      )}

      {(modalMode === 'create' || modalMode === 'edit') && (
        <EmployeeFormModal
          mode={modalMode}
          formData={formData}
          mutationState={mutationState}
          onChange={setFormData}
          onClose={closeModal}
          onSubmit={handleEmployeeSubmit}
        />
      )}

      {modalMode === 'attendance' && selectedEmployee && (
        <AttendanceModal
          employee={selectedEmployee}
          attendanceData={attendanceData}
          mutationState={mutationState}
          onChange={setAttendanceData}
          onClose={closeModal}
          onSubmit={handleAttendanceSubmit}
        />
      )}
    </div>
  );
}

function EmployeesLoading() {
  return (
    <div className="space-y-3 p-6" aria-live="polite" aria-busy="true">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-12 rounded-xl bg-card" />
      ))}
    </div>
  );
}

function EmployeeDetail({ employee, onClose }) {
  const { t } = useTranslation();
  return (
    <section className="rounded-2xl border border-surface-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{employee.name}</h2>
            <p className="text-sm text-muted-foreground">{formatPhoneNumber(employee.phone)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('employeesPage.close')}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-text-primary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <DetailStat label={t('employeesPage.headers.role')} value={employee.role} />
        <DetailStat label={t('employeesPage.headers.salary')} value={formatAmount(employee.salary)} />
        <DetailStat label={t('employeesPage.lastActivity')} value={formatDate(employee.lastActiveAt)} />
      </div>

      <div className="mt-5">
          <h3 className="text-sm font-semibold text-text-primary">{t('employeesPage.recentAttendance')}</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(employee.attendance ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('employeesPage.noAttendance')}</p>
          ) : (
            employee.attendance.map((item) => (
              <div
                key={`${employee._id}-${item.date}`}
                className="flex items-center justify-between rounded-xl border border-surface-border px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground">{formatDate(item.date)}</span>
                <span className="font-medium text-text-primary">{item.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function DetailStat({ label, value }) {
  return (
    <div className="rounded-xl bg-card p-3 border border-surface-border">
      <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="mt-1 block text-sm font-semibold text-text-primary">{value}</span>
    </div>
  );
}

function EmployeeFormModal({ mode, formData, mutationState, onChange, onClose, onSubmit }) {
  const { t } = useTranslation();
  const isSubmitting = mutationState.status === 'loading';
  const title = mode === 'create' ? t('employeesPage.addTitle') : t('employeesPage.editTitle');

  const handleChange = (event) => {
    const { name, value } = event.target;
    onChange((current) => ({ ...current, [name]: value }));
  };

  return (
    <ModalFrame title={title} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-text-secondary">{t('employeesPage.fields.name')}</span>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-text-secondary">{t('employeesPage.fields.phone')}</span>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-text-secondary">{t('employeesPage.fields.salary')}</span>
          <input
            type="number"
            name="salary"
            min="0"
            value={formData.salary}
            onChange={handleChange}
            className="!tabular-nums"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-text-secondary">
            {mode === 'create' ? t('employeesPage.password') : t('employeesPage.newPassword')}
          </span>
          <input
            type="password"
            name="password"
            minLength={6}
            value={formData.password}
            onChange={handleChange}
            required={mode === 'create'}
          />
        </label>

        {mutationState.error && (
          <p className="text-sm text-rose-600 dark:text-rose-400">{mutationState.error}</p>
        )}

        <ModalActions
          onClose={onClose}
          isSubmitting={isSubmitting}
          submitLabel={mode === 'create' ? t('employeesPage.create') : t('employeesPage.save')}
        />
      </form>
    </ModalFrame>
  );
}

function AttendanceModal({ employee, attendanceData, mutationState, onChange, onClose, onSubmit }) {
  const { t } = useTranslation();
  const isSubmitting = mutationState.status === 'loading';

  const handleChange = (event) => {
    const { name, value } = event.target;
    onChange((current) => ({ ...current, [name]: value }));
  };

  return (
    <ModalFrame title={`${t('employeesPage.attendance')} - ${employee.name}`} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-text-secondary">{t('table.date')}</span>
          <input
            type="date"
            name="date"
            value={attendanceData.date}
            onChange={handleChange}
            required
            className="w-full rounded-xl px-4 py-3"
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-text-secondary">{t('employeesPage.status')}</legend>
          <div className="grid grid-cols-2 gap-3">
            {['present', 'absent'].map((status) => (
              <label
                key={status}
                className={`cursor-pointer rounded-xl border p-3 text-center text-sm font-medium transition-colors ${
                  attendanceData.status === status
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-surface-border text-muted-foreground hover:bg-accent'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={status}
                  checked={attendanceData.status === status}
                  onChange={handleChange}
                  className="sr-only"
                />
                {status}
              </label>
            ))}
          </div>
        </fieldset>

        {mutationState.error && (
          <p className="text-sm text-rose-600 dark:text-rose-400">{mutationState.error}</p>
        )}

        <ModalActions onClose={onClose} isSubmitting={isSubmitting} submitLabel={t('employeesPage.mark')} />
      </form>
    </ModalFrame>
  );
}

function ModalFrame({ title, onClose, children }) {
  const { t } = useTranslation();
  return (
    <>
      {/* Mobile Bottom Sheet */}
      <BottomSheet isOpen={true} onClose={onClose} title={title}>
        {children}
      </BottomSheet>

      {/* Desktop Modal */}
      <div className="hidden sm:flex fixed inset-0 z-50 items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface p-6 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('employeesPage.close')}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-text-primary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}

function ModalActions({ onClose, isSubmitting, submitLabel }) {
  const { t } = useTranslation();
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
      >
        {t('employeesPage.cancel')}
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-500 hover:to-cyan-400 disabled:opacity-70"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitLabel}
      </button>
    </div>
  );
}
