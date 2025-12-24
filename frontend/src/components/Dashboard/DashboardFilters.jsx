import { useEffect,useState } from 'react';
import { Box, TextField, MenuItem, Button } from '@mui/material';

const DashboardFilters = ({ startDate, endDate, client, country, clients, countries, onChange ,onReset}) => {
  const [localStartDate, setLocalStartDate] = useState(startDate || '');
  const [localEndDate, setLocalEndDate] = useState(endDate || '');
  const [localClient, setLocalClient] = useState(client || '');
  const [localCountry, setLocalCountry] = useState(country || '');

  useEffect(() => { setLocalStartDate(startDate || ''); }, [startDate]);
  useEffect(() => { setLocalEndDate(endDate || ''); }, [endDate]);
  useEffect(() => { setLocalClient(client || ''); }, [client]);
  useEffect(() => { setLocalCountry(country || ''); }, [country]);

  const handleApply = () => {
    onChange({
      startDate: localStartDate,
      endDate: localEndDate,
      client: localClient,
      country: localCountry,
    });
  };

  return (
    <Box display="flex" gap={2} mb={3} justifyContent="center" flexWrap="wrap">
      <TextField
        label="Start Date"
        type="date"
        InputLabelProps={{ shrink: true }}
        value={localStartDate}
        onChange={e => setLocalStartDate(e.target.value)}
      />
      <TextField
        label="End Date"
        type="date"
        InputLabelProps={{ shrink: true }}
        value={localEndDate}
        onChange={e => setLocalEndDate(e.target.value)}
      />
      <TextField
        select
        label="Client"
        value={localClient}
        onChange={e => setLocalClient(e.target.value)}
        style={{ minWidth: 120 }}
      >
        <MenuItem value="">All</MenuItem>
        {(clients || []).map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
      </TextField>
      <TextField
        select
        label="Country"
        value={localCountry}
        onChange={e => setLocalCountry(e.target.value)}
        style={{ minWidth: 120 }}
      >
        <MenuItem value="">All</MenuItem>
        {(countries || []).map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
      </TextField>
      <Button variant="contained" onClick={handleApply}>Apply</Button>
      <Button variant="contained" onClick={onReset}>Reset</Button>

    </Box>
  );
};

export default DashboardFilters; 