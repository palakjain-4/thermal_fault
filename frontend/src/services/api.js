const API_BASE = '/api';

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function analyzeImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    let errorMsg = 'Analysis failed.';
    if (data.message) {
      errorMsg = data.message;
    } else if (data.detail) {
      if (typeof data.detail === 'object') {
        errorMsg = data.detail.message || data.detail.error || JSON.stringify(data.detail);
      } else {
        errorMsg = data.detail;
      }
    }
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function preprocessImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/preprocess`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    let errorMsg = data.message || 'Preprocessing failed.';
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function getDashboardStats() {
  const res = await fetch(`${API_BASE}/dashboard/stats`);
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = (data.detail && typeof data.detail === 'object') ? data.detail.message : (data.detail || 'Failed to fetch dashboard stats.');
    const err = new Error(errorMsg);
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function getAnalyses(limit = 100, skip = 0) {
  const res = await fetch(`${API_BASE}/analyses?limit=${limit}&skip=${skip}`);
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = (data.detail && typeof data.detail === 'object') ? data.detail.message : (data.detail || 'Failed to fetch analyses.');
    const err = new Error(errorMsg);
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function getAnalysisById(id) {
  const res = await fetch(`${API_BASE}/analyses/${id}`);
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = (data.detail && typeof data.detail === 'object') ? data.detail.message : (data.detail || 'Failed to fetch analysis details.');
    const err = new Error(errorMsg);
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function deleteAnalysis(id) {
  const res = await fetch(`${API_BASE}/analyses/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = (data.detail && typeof data.detail === 'object') ? data.detail.message : (data.detail || 'Failed to delete analysis.');
    const err = new Error(errorMsg);
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function getModelInfo() {
  const res = await fetch(`${API_BASE}/model/info`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to fetch model info.');
  }
  return data;
}

export function getReportDownloadUrl(analysisId) {
  return `${API_BASE}/analyses/${analysisId}/report`;
}
