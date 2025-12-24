import React, { useEffect, useState, useCallback } from 'react';
import DashboardFilters from '../components/Dashboard/DashboardFilters';
import DashboardMetrics from '../components/Dashboard/DashboardMetrics';
import DashboardTable from '../components/Dashboard/DashboardTable';
import GeneralDashboardCharts from '../components/GeneralDashboard/GeneralDashboardCharts';
import { fetchJobLogs, fetchAverageMetric, fetchDeltaMetric, fetchClients, fetchCountries } from '../services/api';
import { Alert } from '@mui/material';

const DashboardPage = () => {
  // Filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [client, setClient] = useState('');
  const [country, setCountry] = useState('');
  // Pagination and sorting state
  const [page, setPage] = useState(0); // zero-based for MUI
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  // Data state
  const [jobLogs, setJobLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [averageMetric, setAverageMetric] = useState([]);
  const [deltaMetric, setDeltaMetric] = useState([]);
  const [clients, setClients] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch filter options on mount
  useEffect(() => {
    fetchClients().then(setClients);
    fetchCountries().then(setCountries);
  }, []);

  // Fetch job logs and metrics when filters, pagination, or sorting change
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        client: client || undefined,
        country: country || undefined,
        limit,
        page: page + 1, // backend expects 1-based
        sortField,
        sortOrder,
      };
      const [jobLogsRes, avgMetric, deltaMetric] = await Promise.all([
        fetchJobLogs(params),
        fetchAverageMetric({
          field: 'TOTAL_JOBS_SENT_TO_INDEX',
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          groupBy: 'transactionSourceName',
          client: client || undefined,
          country: country || undefined,
        }),
        fetchDeltaMetric({
          field: 'TOTAL_JOBS_SENT_TO_INDEX',
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          groupBy: 'transactionSourceName',
          client: client || undefined,
          country: country || undefined,
        })
      ]);
      setJobLogs(jobLogsRes.data);
      setTotal(jobLogsRes.total);
      setAverageMetric(avgMetric);
      setDeltaMetric(deltaMetric);
    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again.');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, client, country, limit, page, sortField, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers for filters
  const handleFilterChange = (filters) => {
    setStartDate(filters.startDate);
    setEndDate(filters.endDate);
    setClient(filters.client);
    setCountry(filters.country);
    setPage(0); // Reset to first page on filter change
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setClient('');
    setCountry('');
    setPage(0);
  };
  // Handlers for pagination and sorting
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(0);
  };
  const handleRequestSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortField(field);
    setSortOrder(isAsc ? 'desc' : 'asc');
  };

  return (
    <div style={{ 
      padding: '2rem',
      maxWidth: '1400px',
      margin: '0 auto',
      width: '100%'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Operations Dashboard</h1>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <GeneralDashboardCharts />
      <DashboardFilters
        startDate={startDate}
        endDate={endDate}
        client={client}
        country={country}
        clients={clients}
        countries={countries}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />
      <DashboardMetrics averageMetric={averageMetric} deltaMetric={deltaMetric} loading={loading} />
      <DashboardTable
        jobLogs={jobLogs}
        total={total}
        loading={loading}
        page={page}
        limit={limit}
        sortField={sortField}
        sortOrder={sortOrder}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        onRequestSort={handleRequestSort}
      />
    </div>
  );
};

export default DashboardPage; 