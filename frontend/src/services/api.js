import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const fetchJobLogs = (params) =>
  axios.get(`${API_BASE}/joblogs`, { params }).then(res => res.data);

export const fetchAverageMetric = (params) =>
  axios.get(`${API_BASE}/joblogs/metrics/general`, { params }).then(res => res.data);

export const fetchDeltaMetric = (params) =>
  axios.get(`${API_BASE}/joblogs/metrics/delta`, { params }).then(res => res.data);


// For filter dropdowns, fetch unique clients and countries
export const fetchClients = async () => {
  const res = await fetchJobLogs({ limit: 1000 });
  const clients = [...new Set(res.data.map(j => j.transactionSourceName))];
  return clients;
};

export const fetchCountries = async () => {
  const res = await fetchJobLogs({ limit: 1000 });
  const countries = [...new Set(res.data.map(j => j.country_code))];
  return countries;
};

export const sendChatQuestion = (question) =>
  axios.post(`${API_BASE}/chat`, { question }).then(res => res.data);

export const fetchGlobalTotalJobsSent = () =>
  fetchAverageMetric({ field: 'TOTAL_JOBS_SENT_TO_INDEX', groupBy: 'transactionSourceName', agg: 'sum' });


export const fetchGlobalTotalJobsFailed = () =>
  fetchAverageMetric({ field: 'TOTAL_JOBS_FAIL_INDEXED', groupBy: 'transactionSourceName', agg: 'sum' }); 