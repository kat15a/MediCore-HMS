import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Grid, Typography, Button, Stack, Chip, Avatar, Paper, Divider,
} from '@mui/material';
import { motion } from 'framer-motion';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import PulseLine from '../../components/common/PulseLine';

const queueRows = [
  { time: '09:00', name: 'A. Kapoor', doctor: 'Dr. Rhee — Cardiology', status: 'In Room', tone: 'success' },
  { time: '09:20', name: 'M. Alvarez', doctor: 'Dr. Rhee — Cardiology', status: 'Waiting', tone: 'warning' },
  { time: '09:40', name: 'S. Chen', doctor: 'Dr. Obi — Pediatrics', status: 'Confirmed', tone: 'default' },
  { time: '10:00', name: 'J. Novak', doctor: 'Dr. Fabre — Orthopedics', status: 'Confirmed', tone: 'default' },
];

const roleCards = [
  {
    role: 'Admin',
    icon: BadgeOutlinedIcon,
    blurb: 'See the whole hospital at once — census, revenue, staffing, and stock — without opening five screens.',
  },
  {
    role: 'Doctor',
    icon: LocalHospitalOutlinedIcon,
    blurb: "Walk into a room already knowing the patient's history, and leave with the prescription already drafted.",
  },
  {
    role: 'Receptionist',
    icon: PeopleOutlineIcon,
    blurb: 'Register a patient, book a slot, and settle a bill without switching between three different logins.',
  },
  {
    role: 'Patient',
    icon: PersonOutlineIcon,
    blurb: 'Book a visit, read your results in plain language, and pay a bill — all from your phone.',
  },
];

const aiFeatures = [
  {
    icon: ChatBubbleOutlineIcon,
    title: 'Symptom Checker',
    desc: 'Patients describe how they feel; get a likely department, urgency level, and red-flag warnings before they ever reach the front desk.',
  },
  {
    icon: DescriptionOutlinedIcon,
    title: 'Report Summarizer',
    desc: 'Upload a lab PDF, get abnormal values flagged and explained in plain language — for the patient, not just the chart.',
  },
  {
    icon: MedicationOutlinedIcon,
    title: 'Prescription Explainer',
    desc: 'Every medicine comes with a plain-English note on dosage, side effects, and what to watch for.',
  },
  {
    icon: SmartToyOutlinedIcon,
    title: 'Hospital Chatbot',
    desc: 'Timings, departments, doctor availability — answered instantly, day or night.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};

export default function LandingPage() {
  return (
    <Box>
      {/* ---------------------------------------------------------------- HERO */}
      <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 8, md: 12 } }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <Chip
                label="ADMIN · DOCTOR · RECEPTIONIST · PATIENT"
                size="small"
                sx={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  bgcolor: 'success.light',
                  color: 'success.main',
                  mb: 3,
                }}
              />
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
              <Typography variant="h1" sx={{ fontSize: { xs: 40, md: 56 }, lineHeight: 1.08, mb: 3 }}>
                One ward, four logins, no more chasing paper.
              </Typography>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, mb: 4, maxWidth: 480 }}>
                MediCore runs scheduling, prescriptions, billing, and lab results in one system —
                with an AI assistant that reads charts and reports so your staff don't have to start from zero.
              </Typography>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  color="secondary"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                >
                  Book Your First Appointment
                </Button>
                <Button component={RouterLink} to="/login" variant="outlined" size="large" sx={{ borderColor: 'divider', color: 'text.primary' }}>
                  Staff Log In
                </Button>
              </Stack>
            </motion.div>
          </Grid>

          {/* "Today's Board" hero mockup — the real product, not a marketing graphic */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
            >
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 24px 60px -24px rgba(14,42,38,0.35)',
                }}
              >
                <Box sx={{ bgcolor: 'primary.dark', color: '#fff', px: 3, py: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                    <Typography variant="overline" sx={{ opacity: 0.8 }}>TODAY'S BOARD</Typography>
                    <Typography variant="caption" sx={{ fontFamily: '"IBM Plex Mono", monospace', opacity: 0.8 }}>
                      Tue, 09:12 AM
                    </Typography>
                  </Stack>
                  <Typography variant="h5" sx={{ mt: 0.5 }}>Cardiology · Ground Floor</Typography>
                </Box>

                <Box sx={{ p: 0 }}>
                  {queueRows.map((row, i) => (
                    <Box key={i}>
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        sx={{ px: 3, py: 1.75 }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: '"IBM Plex Mono", monospace', width: 48, color: 'text.secondary' }}
                        >
                          {row.time}
                        </Typography>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'success.light', color: 'success.main', fontSize: 13 }}>
                          {row.name[0]}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>{row.name}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>{row.doctor}</Typography>
                        </Box>
                        <Chip
                          label={row.status}
                          size="small"
                          color={row.tone === 'default' ? undefined : row.tone}
                          variant={row.tone === 'default' ? 'outlined' : 'filled'}
                          sx={row.tone !== 'default' ? { color: '#fff' } : {}}
                        />
                      </Stack>
                      {i < queueRows.length - 1 && <Divider />}
                    </Box>
                  ))}
                </Box>

                <Box sx={{ px: 3, py: 2, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">4 patients · 2 beds free</Typography>
                    <Typography variant="caption" sx={{ fontFamily: '"IBM Plex Mono", monospace', color: 'secondary.main', fontWeight: 600 }}>
                      Live
                    </Typography>
                  </Stack>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      <Box sx={{ color: 'divider', px: { xs: 3, md: 0 } }}>
        <Container maxWidth="lg">
          <PulseLine height={40} />
        </Container>
      </Box>

      {/* ---------------------------------------------------------------- ROLES */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Typography variant="overline" color="secondary.dark" sx={{ display: 'block', mb: 1 }}>
          BUILT FOR EVERY SEAT IN THE BUILDING
        </Typography>
        <Typography variant="h2" sx={{ fontSize: { xs: 30, md: 38 }, mb: 6, maxWidth: 640 }}>
          Four roles. One system that actually talks to itself.
        </Typography>

        <Grid container spacing={3}>
          {roleCards.map(({ role, icon: Icon, blurb }, i) => (
            <Grid item xs={12} sm={6} md={3} key={role}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    transition: 'border-color 0.2s, transform 0.2s',
                    '&:hover': { borderColor: 'secondary.main', transform: 'translateY(-3px)' },
                  }}
                >
                  <Icon sx={{ fontSize: 28, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontFamily: '"Fraunces", serif', mb: 1 }}>{role}</Typography>
                  <Typography variant="body2" color="text.secondary">{blurb}</Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ---------------------------------------------------------------- AI */}
      <Box sx={{ bgcolor: 'primary.dark', color: '#fff', py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            <Grid item xs={12} md={4}>
              <Typography variant="overline" sx={{ color: 'secondary.light', display: 'block', mb: 1 }}>
                AI, WHERE IT ACTUALLY HELPS
              </Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: 28, md: 34 }, mb: 2 }}>
                An assistant that reads charts, not scripts.
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8 }}>
                Every AI feature in MediCore is scoped to one job — triage, summarize, explain, or answer —
                and every clinical suggestion carries a disclaimer. It supports the care team; it doesn't replace it.
              </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <Grid container spacing={3}>
                {aiFeatures.map(({ icon: Icon, title, desc }, i) => (
                  <Grid item xs={12} sm={6} key={title}>
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 0.4, delay: i * 0.07 }}
                    >
                      <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)', height: '100%' }}>
                        <Icon sx={{ fontSize: 24, color: 'secondary.light', mb: 1.5 }} />
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>{title}</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.78 }}>{desc}</Typography>
                      </Box>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ---------------------------------------------------------------- CTA */}
      <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
        <Typography variant="h2" sx={{ fontSize: { xs: 30, md: 38 }, mb: 2 }}>
          Ready to run a calmer ward?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 480, mx: 'auto' }}>
          Patients can register and book in minutes. Staff accounts are set up by your administrator.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button component={RouterLink} to="/register" variant="contained" color="secondary" size="large">
            Create a Patient Account
          </Button>
          <Button component={RouterLink} to="/login" variant="text" size="large" sx={{ color: 'primary.main' }}>
            I already have an account
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
