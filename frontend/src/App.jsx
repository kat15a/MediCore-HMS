import { Routes, Route } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout';
import AuthLayout from './components/layout/AuthLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import NotFoundPage from './pages/shared/NotFoundPage';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminDoctorsPage from './pages/admin/AdminDoctorsPage';
import AdminPatientsPage from './pages/admin/AdminPatientsPage';
import AdminReceptionistsPage from './pages/admin/AdminReceptionistsPage';
import AdminDepartmentsPage from './pages/admin/AdminDepartmentsPage';
import AdminAppointmentsPage from './pages/admin/AdminAppointmentsPage';
import AdminMedicinesPage from './pages/admin/AdminMedicinesPage';
import AdminLaboratoriesPage from './pages/admin/AdminLaboratoriesPage';
import AdminRoomsPage from './pages/admin/AdminRoomsPage';
import AdminBillingPage from './pages/admin/AdminBillingPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';

import DoctorDashboardPage from './pages/doctor/DoctorDashboardPage';
import DoctorPatientsPage from './pages/doctor/DoctorPatientsPage';
import DoctorAppointmentsPage from './pages/doctor/DoctorAppointmentsPage';
import DoctorPrescriptionsPage from './pages/doctor/DoctorPrescriptionsPage';
import DoctorLabReportsPage from './pages/doctor/DoctorLabReportsPage';
import DoctorAiAssistantPage from './pages/doctor/DoctorAiAssistantPage';
import DoctorProfilePage from './pages/doctor/DoctorProfilePage';

import ReceptionistDashboardPage from './pages/receptionist/ReceptionistDashboardPage';
import ReceptionistRegisterPatientPage from './pages/receptionist/ReceptionistRegisterPatientPage';
import ReceptionistAppointmentsPage from './pages/receptionist/ReceptionistAppointmentsPage';
import ReceptionistQueuePage from './pages/receptionist/ReceptionistQueuePage';
import ReceptionistBillingPage from './pages/receptionist/ReceptionistBillingPage';
import ReceptionistRoomsPage from './pages/receptionist/ReceptionistRoomsPage';

import PatientDashboardPage from './pages/patient/PatientDashboardPage';
import PatientAppointmentsPage from './pages/patient/PatientAppointmentsPage';
import PatientPrescriptionsPage from './pages/patient/PatientPrescriptionsPage';
import PatientLabReportsPage from './pages/patient/PatientLabReportsPage';
import PatientBillingPage from './pages/patient/PatientBillingPage';
import PatientAiAssistantPage from './pages/patient/PatientAiAssistantPage';
import PatientProfilePage from './pages/patient/PatientProfilePage';

export default function App() {
  return (
    <Routes>
      {/* ---------------------------------------------------------- Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Route>

      {/* -------------------------------------------------------- Protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<DashboardLayout />}>
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="doctors" element={<AdminDoctorsPage />} />
            <Route path="patients" element={<AdminPatientsPage />} />
            <Route path="receptionists" element={<AdminReceptionistsPage />} />
            <Route path="departments" element={<AdminDepartmentsPage />} />
            <Route path="appointments" element={<AdminAppointmentsPage />} />
            <Route path="medicines" element={<AdminMedicinesPage />} />
            <Route path="laboratories" element={<AdminLaboratoriesPage />} />
            <Route path="rooms" element={<AdminRoomsPage />} />
            <Route path="billing" element={<AdminBillingPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={['DOCTOR']} />}>
          <Route path="/doctor" element={<DashboardLayout />}>
            <Route path="dashboard" element={<DoctorDashboardPage />} />
            <Route path="patients" element={<DoctorPatientsPage />} />
            <Route path="appointments" element={<DoctorAppointmentsPage />} />
            <Route path="prescriptions" element={<DoctorPrescriptionsPage />} />
            <Route path="lab-reports" element={<DoctorLabReportsPage />} />
            <Route path="ai-assistant" element={<DoctorAiAssistantPage />} />
            <Route path="profile" element={<DoctorProfilePage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={['RECEPTIONIST']} />}>
          <Route path="/receptionist" element={<DashboardLayout />}>
            <Route path="dashboard" element={<ReceptionistDashboardPage />} />
            <Route path="patients/new" element={<ReceptionistRegisterPatientPage />} />
            <Route path="appointments" element={<ReceptionistAppointmentsPage />} />
            <Route path="queue" element={<ReceptionistQueuePage />} />
            <Route path="billing" element={<ReceptionistBillingPage />} />
            <Route path="rooms" element={<ReceptionistRoomsPage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={['PATIENT']} />}>
          <Route path="/patient" element={<DashboardLayout />}>
            <Route path="dashboard" element={<PatientDashboardPage />} />
            <Route path="appointments" element={<PatientAppointmentsPage />} />
            <Route path="prescriptions" element={<PatientPrescriptionsPage />} />
            <Route path="lab-reports" element={<PatientLabReportsPage />} />
            <Route path="billing" element={<PatientBillingPage />} />
            <Route path="ai-assistant" element={<PatientAiAssistantPage />} />
            <Route path="profile" element={<PatientProfilePage />} />
          </Route>
        </Route>
      </Route>

      {/* ------------------------------------------------------------ 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
