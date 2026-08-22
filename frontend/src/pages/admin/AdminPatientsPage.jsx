import { useEffect, useState } from 'react';
import { Avatar, Box, Card, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import patientService from '../../services/patientService';

export default function AdminPatientsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  const loadPatients = async () => {
    setLoading(true);
    try {
      const page = await patientService.getAll({ size: 100 });
      setRows(page.content);
    } catch {
      enqueueSnackbar('Could not load patients', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (!keyword.trim()) {
        loadPatients();
        return;
      }
      try {
        const results = await patientService.search(keyword.trim());
        setRows(results);
      } catch {
        enqueueSnackbar('Search failed', { variant: 'error' });
      }
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  const columns = [
    {
      field: 'firstName',
      headerName: 'Patient',
      flex: 1.4,
      minWidth: 200,
      renderCell: (params) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'secondary.main' }}>
            {params.row.firstName?.[0]}{params.row.lastName?.[0]}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>{params.row.firstName} {params.row.lastName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{params.row.email}</Typography>
          </Box>
        </Stack>
      ),
    },
    { field: 'phone', headerName: 'Phone', width: 150 },
    { field: 'bloodGroup', headerName: 'Blood Group', width: 120 },
    { field: 'insuranceProvider', headerName: 'Insurance', flex: 1, minWidth: 150 },
    {
      field: 'allergies',
      headerName: 'Allergies',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => params.value || <Typography variant="caption" color="text.secondary">None on file</Typography>,
    },
  ];

  return (
    <Box>
      <PageHeader title="Patients" subtitle="Search and review registered patients.">
        <TextField
          size="small"
          placeholder="Search by name, email, or phone"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          sx={{ width: 280 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlinedIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </PageHeader>

      <Card sx={{ p: loading ? 3 : 0 }}>
        {loading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            autoHeight
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            sx={{ border: 'none' }}
          />
        )}
      </Card>
    </Box>
  );
}
