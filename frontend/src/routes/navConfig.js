import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';

export const navConfig = {
  ADMIN: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: DashboardOutlinedIcon },
    { label: 'Doctors', path: '/admin/doctors', icon: LocalHospitalOutlinedIcon },
    { label: 'Patients', path: '/admin/patients', icon: PeopleOutlineIcon },
    { label: 'Receptionists', path: '/admin/receptionists', icon: BadgeOutlinedIcon },
    { label: 'Departments', path: '/admin/departments', icon: ApartmentOutlinedIcon },
    { label: 'Appointments', path: '/admin/appointments', icon: EventOutlinedIcon },
    { label: 'Medicines', path: '/admin/medicines', icon: MedicationOutlinedIcon },
    { label: 'Laboratories', path: '/admin/laboratories', icon: ScienceOutlinedIcon },
    { label: 'Rooms', path: '/admin/rooms', icon: MeetingRoomOutlinedIcon },
    { label: 'Billing', path: '/admin/billing', icon: ReceiptLongOutlinedIcon },
    { label: 'Reports', path: '/admin/reports', icon: DescriptionOutlinedIcon },
  ],
  DOCTOR: [
    { label: 'Dashboard', path: '/doctor/dashboard', icon: DashboardOutlinedIcon },
    { label: "Today's Patients", path: '/doctor/patients', icon: PeopleOutlineIcon },
    { label: 'Appointments', path: '/doctor/appointments', icon: EventOutlinedIcon },
    { label: 'Prescriptions', path: '/doctor/prescriptions', icon: DescriptionOutlinedIcon },
    { label: 'Lab Reports', path: '/doctor/lab-reports', icon: ScienceOutlinedIcon },
    { label: 'AI Assistant', path: '/doctor/ai-assistant', icon: SmartToyOutlinedIcon },
    { label: 'Profile', path: '/doctor/profile', icon: PersonOutlineIcon },
  ],
  RECEPTIONIST: [
    { label: 'Dashboard', path: '/receptionist/dashboard', icon: DashboardOutlinedIcon },
    { label: 'Register Patient', path: '/receptionist/patients/new', icon: AssignmentIndOutlinedIcon },
    { label: 'Appointments', path: '/receptionist/appointments', icon: EventOutlinedIcon },
    { label: 'Queue', path: '/receptionist/queue', icon: PeopleOutlineIcon },
    { label: 'Billing', path: '/receptionist/billing', icon: PaymentsOutlinedIcon },
    { label: 'Rooms', path: '/receptionist/rooms', icon: MeetingRoomOutlinedIcon },
  ],
  PATIENT: [
    { label: 'Dashboard', path: '/patient/dashboard', icon: DashboardOutlinedIcon },
    { label: 'Appointments', path: '/patient/appointments', icon: EventOutlinedIcon },
    { label: 'Prescriptions', path: '/patient/prescriptions', icon: DescriptionOutlinedIcon },
    { label: 'Lab Reports', path: '/patient/lab-reports', icon: ScienceOutlinedIcon },
    { label: 'Bills & Payments', path: '/patient/billing', icon: PaymentsOutlinedIcon },
    { label: 'AI Assistant', path: '/patient/ai-assistant', icon: SmartToyOutlinedIcon },
    { label: 'Profile', path: '/patient/profile', icon: PersonOutlineIcon },
  ],
};
