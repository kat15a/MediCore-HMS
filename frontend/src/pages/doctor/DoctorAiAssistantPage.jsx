import { useEffect, useState } from 'react';
import {
  Box, Button, Card, Chip, CircularProgress, Divider, MenuItem, Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import aiService from '../../services/aiService';
import prescriptionService from '../../services/prescriptionService';
import useAuth from '../../hooks/useAuth';

function ReportSummarizer() {
  const { enqueueSnackbar } = useSnackbar();
  const [reportText, setReportText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const summarizeText = async () => {
    if (!reportText.trim()) {
      enqueueSnackbar('Paste the report text first', { variant: 'warning' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      setResult(await aiService.summarizeReportText({ reportText }));
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not summarize this report', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const summarizePdf = async () => {
    if (!file) {
      enqueueSnackbar('Choose a PDF file first', { variant: 'warning' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      setResult(await aiService.summarizeReportPdf(file));
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not summarize this PDF', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <Typography variant="subtitle1" fontWeight={600}>Paste report text</Typography>
          <TextField
            multiline minRows={5} fullWidth
            placeholder="Paste the raw lab or diagnostic report text here…"
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
          />
          <Button variant="contained" onClick={summarizeText} disabled={loading} sx={{ alignSelf: 'flex-start' }}>
            {loading ? 'Summarizing…' : 'Summarize Text'}
          </Button>

          <Divider>or</Divider>

          <Typography variant="subtitle1" fontWeight={600}>Upload a PDF report</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button component="label" variant="outlined" startIcon={<UploadFileOutlinedIcon />}>
              Choose PDF
              <input type="file" accept="application/pdf" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </Button>
            {file && <Typography variant="body2" color="text.secondary">{file.name}</Typography>}
            <Button variant="contained" onClick={summarizePdf} disabled={loading || !file}>
              {loading ? 'Summarizing…' : 'Summarize PDF'}
            </Button>
          </Stack>
        </Stack>
      </Card>

      {loading && <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress /></Stack>}

      {result && (
        <Card sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Summary</Typography>
              <Typography variant="body2">{result.summary}</Typography>
            </Box>
            {result.abnormalFindings?.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }} color="error.main">Abnormal findings</Typography>
                <Stack spacing={0.5}>
                  {result.abnormalFindings.map((f, i) => (
                    <Typography key={i} variant="body2" color="error.main">• {f}</Typography>
                  ))}
                </Stack>
              </Box>
            )}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Plain-language explanation</Typography>
              <Typography variant="body2" color="text.secondary">{result.plainLanguageExplanation}</Typography>
            </Box>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}

function PrescriptionExplainer() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!user?.profileId) return;
    prescriptionService
      .getByDoctor(user.profileId, { size: 50, sort: 'createdAt,desc' })
      .then((page) => setPrescriptions(page.content))
      .catch(() => enqueueSnackbar('Could not load your prescriptions', { variant: 'error' }))
      .finally(() => setLoadingList(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.profileId]);

  const explain = async () => {
    if (!selectedId) {
      enqueueSnackbar('Choose a prescription first', { variant: 'warning' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      setResult(await aiService.explainPrescription(selectedId));
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not explain this prescription', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loadingList) return null;

  return (
    <Stack spacing={3}>
      <Card sx={{ p: 3 }}>
        {prescriptions.length === 0 ? (
          <EmptyState title="No prescriptions yet" description="Write a prescription first, then come back to get an AI explanation for your patient." />
        ) : (
          <Stack direction="row" spacing={2}>
            <TextField
              select fullWidth label="Choose a prescription" value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {prescriptions.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.patientName} — {new Date(p.createdAt).toLocaleDateString()} — {p.diagnosis || 'No diagnosis noted'}
                </MenuItem>
              ))}
            </TextField>
            <Button variant="contained" onClick={explain} disabled={loading} sx={{ flexShrink: 0 }}>
              {loading ? 'Explaining…' : 'Explain'}
            </Button>
          </Stack>
        )}
      </Card>

      {loading && <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress /></Stack>}

      {result && (
        <Card sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <Typography variant="body2">{result.overallSummary}</Typography>
            <Divider />
            {result.medicines.map((m, i) => (
              <Box key={i}>
                <Typography variant="subtitle2">{m.medicineName}</Typography>
                <Typography variant="body2" color="text.secondary"><strong>Purpose:</strong> {m.purpose}</Typography>
                <Typography variant="body2" color="text.secondary"><strong>Side effects:</strong> {m.commonSideEffects}</Typography>
                <Typography variant="body2" color="text.secondary"><strong>Dosage:</strong> {m.dosageGuidance}</Typography>
                <Typography variant="body2" color="text.secondary"><strong>Precautions:</strong> {m.precautions}</Typography>
              </Box>
            ))}
            <Typography variant="caption" color="text.secondary">
              This explanation has been saved to the prescription and is now visible to the patient.
            </Typography>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}

export default function DoctorAiAssistantPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <PageHeader title="AI Assistant" subtitle="Summarize reports and generate patient-friendly prescription explanations." />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Report Summarizer" />
        <Tab label="Prescription Explainer" />
      </Tabs>
      {tab === 0 ? <ReportSummarizer /> : <PrescriptionExplainer />}
    </Box>
  );
}
