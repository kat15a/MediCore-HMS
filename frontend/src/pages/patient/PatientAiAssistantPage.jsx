import { useState } from 'react';
import {
  Alert, Avatar, Box, Button, Card, Chip, CircularProgress, Divider, IconButton,
  Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import aiService from '../../services/aiService';

const URGENCY_COLOR = { LOW: 'success', MEDIUM: 'warning', HIGH: 'error', EMERGENCY: 'error' };

function SymptomChecker() {
  const { enqueueSnackbar } = useSnackbar();
  const [symptoms, setSymptoms] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async () => {
    if (!symptoms.trim()) {
      enqueueSnackbar('Describe how you\'re feeling first', { variant: 'warning' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await aiService.checkSymptoms({ symptoms, medicalHistory });
      setResult(res);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not check your symptoms right now', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <TextField
            label="What symptoms are you experiencing?"
            multiline minRows={3} fullWidth
            placeholder="e.g. Sharp pain in my lower right abdomen since this morning, mild fever…"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />
          <TextField
            label="Relevant medical history (optional)"
            multiline minRows={2} fullWidth
            placeholder="Existing conditions, medications, allergies…"
            value={medicalHistory}
            onChange={(e) => setMedicalHistory(e.target.value)}
          />
          <Button variant="contained" onClick={submit} disabled={loading} sx={{ alignSelf: 'flex-start' }}>
            {loading ? 'Checking…' : 'Check My Symptoms'}
          </Button>
        </Stack>
      </Card>

      {loading && (
        <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress /></Stack>
      )}

      {result && (
        <Card sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Chip
                label={`Urgency: ${result.urgencyLevel}`}
                color={URGENCY_COLOR[result.urgencyLevel] || 'default'}
                icon={result.urgencyLevel === 'EMERGENCY' ? <WarningAmberOutlinedIcon /> : undefined}
              />
              <Chip label={`See: ${result.recommendedDepartment}`} variant="outlined" icon={<HealthAndSafetyOutlinedIcon />} />
            </Stack>

            {result.urgencyLevel === 'EMERGENCY' && (
              <Alert severity="error">
                This may be a medical emergency. Please call your local emergency number or go to the
                nearest emergency room now.
              </Alert>
            )}

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Possible conditions to discuss with a doctor</Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {result.possibleConditions?.map((c, i) => <Chip key={i} label={c} size="small" />)}
              </Stack>
            </Box>

            {result.redFlagSymptoms?.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }} color="error.main">
                  Seek care immediately if you also notice
                </Typography>
                <Stack spacing={0.5}>
                  {result.redFlagSymptoms.map((s, i) => (
                    <Typography key={i} variant="body2" color="error.main">• {s}</Typography>
                  ))}
                </Stack>
              </Box>
            )}

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Questions your doctor may ask</Typography>
              <Stack spacing={0.5}>
                {result.suggestedQuestions?.map((q, i) => (
                  <Typography key={i} variant="body2" color="text.secondary">• {q}</Typography>
                ))}
              </Stack>
            </Box>

            <Divider />
            <Typography variant="caption" color="text.secondary">{result.disclaimer}</Typography>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}

function HospitalChat() {
  const { enqueueSnackbar } = useSnackbar();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I can help with hospital hours, departments, doctors, or booking questions. What do you need?" },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);
    try {
      const res = await aiService.chat({
        message: text,
        history: nextMessages.slice(0, -1).slice(-6),
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'The assistant is unavailable right now', { variant: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card sx={{ p: 0, display: 'flex', flexDirection: 'column', height: 520 }}>
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        <Stack spacing={2}>
          {messages.map((m, i) => (
            <Stack key={i} direction="row" spacing={1.5} justifyContent={m.role === 'user' ? 'flex-end' : 'flex-start'}>
              {m.role === 'assistant' && (
                <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main' }}><SmartToyOutlinedIcon sx={{ fontSize: 16 }} /></Avatar>
              )}
              <Box
                sx={{
                  maxWidth: '75%',
                  px: 2, py: 1.25,
                  borderRadius: 2.5,
                  bgcolor: m.role === 'user' ? 'primary.main' : 'background.default',
                  color: m.role === 'user' ? '#fff' : 'text.primary',
                }}
              >
                <Typography variant="body2">{m.content}</Typography>
              </Box>
              {m.role === 'user' && (
                <Avatar sx={{ width: 28, height: 28, bgcolor: 'grey.400' }}><PersonOutlineIcon sx={{ fontSize: 16 }} /></Avatar>
              )}
            </Stack>
          ))}
          {sending && (
            <Stack direction="row" spacing={1.5}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main' }}><SmartToyOutlinedIcon sx={{ fontSize: 16 }} /></Avatar>
              <CircularProgress size={18} />
            </Stack>
          )}
        </Stack>
      </Box>
      <Divider />
      <Stack direction="row" spacing={1} sx={{ p: 2 }}>
        <TextField
          fullWidth size="small" placeholder="Ask about hours, departments, doctors…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <IconButton color="primary" onClick={send} disabled={sending || !input.trim()}>
          <SendOutlinedIcon />
        </IconButton>
      </Stack>
    </Card>
  );
}

export default function PatientAiAssistantPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <PageHeader title="AI Assistant" subtitle="Check your symptoms or ask about the hospital." />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Symptom Checker" />
        <Tab label="Hospital Chat" />
      </Tabs>
      {tab === 0 ? <SymptomChecker /> : <HospitalChat />}
    </Box>
  );
}
