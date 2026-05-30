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

const formatAmount = (amount) => `${Number(amount || 0).toLocaleString()} MRU`;

const formatDate = (isoDate) => {
  if (!isoDate) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('employees')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Liste, profil, salaire et presence des employes, visibles par Admin uniquement.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-blue-500/20 transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <Plus className="h-4 w-4" />
          Ajouter un employe
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full max-w-md">
            <span className="sr-only">Rechercher un employe</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t('employeesPage.searchPlaceholder')}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <span className="text-sm text-slate-500">
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
          <div className="p-8 text-center text-sm text-slate-500">
            {t('employeesPage.emptyState')}
          </div>
        )}

        {employeesState.status === 'success' && filteredEmployees.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 font-medium text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">{t('employeesPage.headers.name')}</th>
                  <th className="px-6 py-4 font-medium">{t('employeesPage.headers.phone')}</th>
                  <th className="px-6 py-4 font-medium">{t('employeesPage.headers.role')}</th>
                  <th className="px-6 py-4 text-right font-medium">{t('employeesPage.headers.salary')}</th>
                  <th className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredEmployees.map((employee) => (
                  <tr key={employee._id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-950/50">
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedEmployeeId(employee._id)}
                        className="font-medium text-slate-900 underline-offset-4 hover:underline dark:text-white"
                      >
                        {employee.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{formatPhoneNumber(employee.phone)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {employee.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                      {formatAmount(employee.salary)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(employee)}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          <Edit className="h-4 w-4" />
                          Editer
                        </button>
                        <button
                          type="button"
                          onClick={() => openAttendanceModal(employee)}
                          className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-3 py-1.5 text-sm text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                        >
                          <CalendarCheck className="h-4 w-4" />
                          Presence
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        <div key={item} className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800" />
      ))}
    </div>
  );
}

function EmployeeDetail({ employee, onClose }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{employee.name}</h2>
            <p className="text-sm text-slate-500">{formatPhoneNumber(employee.phone)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le detail employe"
          className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <DetailStat label="Role" value={employee.role} />
        <DetailStat label="Salaire" value={formatAmount(employee.salary)} />
        <DetailStat label="Derniere activite" value={formatDate(employee.lastActiveAt)} />
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Presence recente</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(employee.attendance ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">Aucune presence enregistree.</p>
          ) : (
            employee.attendance.map((item) => (
              <div
                key={`${employee._id}-${item.date}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
              >
                <span className="text-slate-600 dark:text-slate-300">{formatDate(item.date)}</span>
                <span className="font-medium text-slate-900 dark:text-white">{item.status}</span>
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
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60">
      <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <span className="mt-1 block text-sm font-semibold text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

function EmployeeFormModal({ mode, formData, mutationState, onChange, onClose, onSubmit }) {
  const isSubmitting = mutationState.status === 'loading';
  const title = mode === 'create' ? 'Ajouter un employe' : 'Modifier employe';

  const handleChange = (event) => {
    const { name, value } = event.target;
    onChange((current) => ({ ...current, [name]: value }));
  };

  return (
    <ModalFrame title={title} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nom complet</span>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Telephone</span>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Salaire</span>
          <input
            type="number"
            name="salary"
            min="0"
            value={formData.salary}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {mode === 'create' ? 'Mot de passe' : 'Nouveau mot de passe'}
          </span>
          <input
            type="password"
            name="password"
            minLength={6}
            value={formData.password}
            onChange={handleChange}
            required={mode === 'create'}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </label>

        {mutationState.error && (
          <p className="text-sm text-rose-600 dark:text-rose-400">{mutationState.error}</p>
        )}

        <ModalActions
          onClose={onClose}
          isSubmitting={isSubmitting}
          submitLabel={mode === 'create' ? 'Creer' : 'Enregistrer'}
        />
      </form>
    </ModalFrame>
  );
}

function AttendanceModal({ employee, attendanceData, mutationState, onChange, onClose, onSubmit }) {
  const isSubmitting = mutationState.status === 'loading';

  const handleChange = (event) => {
    const { name, value } = event.target;
    onChange((current) => ({ ...current, [name]: value }));
  };

  return (
    <ModalFrame title={`Presence - ${employee.name}`} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Date</span>
          <input
            type="date"
            name="date"
            value={attendanceData.date}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">Statut</legend>
          <div className="grid grid-cols-2 gap-3">
            {['present', 'absent'].map((status) => (
              <label
                key={status}
                className={`cursor-pointer rounded-xl border p-3 text-center text-sm font-medium transition-colors ${
                  attendanceData.status === status
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
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

        <ModalActions onClose={onClose} isSubmitting={isSubmitting} submitLabel="Marquer" />
      </form>
    </ModalFrame>
  );
}

function ModalFrame({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onClose, isSubmitting, submitLabel }) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Annuler
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-blue-500/20 transition-colors hover:bg-blue-700 disabled:opacity-70"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitLabel}
      </button>
    </div>
  );
}
