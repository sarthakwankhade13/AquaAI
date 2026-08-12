import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import { MapPin, RefreshCw, Database, Building, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  getDistricts,
  getTalukasByDistrict,
  getVillagesByTaluka,
  getVillages,
  syncGeographyData,
} from '../../services/geographyApi';

export default function GeographyMaster() {
  const [districts, setDistricts] = useState([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [talukas, setTalukas] = useState([]);
  const [selectedTalukaId, setSelectedTalukaId] = useState('');
  const [villages, setVillages] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingTalukas, setLoadingTalukas] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Initial Load: Fetch 11 Vidarbha Districts
  useEffect(() => {
    loadDistricts();
  }, []);

  const loadDistricts = async () => {
    setLoadingDistricts(true);
    setErrorMsg('');
    try {
      const res = await getDistricts();
      if (res.success && Array.isArray(res.data)) {
        setDistricts(res.data);
      }
    } catch (err) {
      setErrorMsg('Failed to load districts from backend database.');
    } finally {
      setLoadingDistricts(false);
    }
  };

  // 2. When District Selected -> Fetch Talukas
  useEffect(() => {
    if (!selectedDistrictId) {
      setTalukas([]);
      setSelectedTalukaId('');
      setVillages([]);
      return;
    }

    const loadTalukas = async () => {
      setLoadingTalukas(true);
      setSelectedTalukaId('');
      setVillages([]);
      try {
        const res = await getTalukasByDistrict(selectedDistrictId);
        if (res.success && Array.isArray(res.data)) {
          setTalukas(res.data);
        }
      } catch (err) {
        setErrorMsg('Failed to load talukas for selected district.');
      } finally {
        setLoadingTalukas(false);
      }
    };

    loadTalukas();
  }, [selectedDistrictId]);

  // 3. When Taluka Selected -> Fetch Villages
  useEffect(() => {
    if (!selectedTalukaId) {
      setVillages([]);
      return;
    }

    const loadVillages = async () => {
      setLoadingVillages(true);
      try {
        const res = await getVillagesByTaluka(selectedTalukaId);
        if (res.success && Array.isArray(res.data)) {
          setVillages(res.data);
        }
      } catch (err) {
        setErrorMsg('Failed to load villages for selected taluka.');
      } finally {
        setLoadingVillages(false);
      }
    };

    loadVillages();
  }, [selectedTalukaId]);

  // 4. Handle Search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await getVillages({ search: searchTerm.trim() });
      if (res.success && Array.isArray(res.data)) {
        setSearchResults(res.data);
      }
    } catch (err) {
      setErrorMsg('Search query failed.');
    }
  };

  // 5. Handle Official Government Sync
  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setErrorMsg('');
    try {
      const res = await syncGeographyData();
      if (res.success) {
        setSyncResult(res.data);
        // Refresh local views after sync
        loadDistricts();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Geography sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AdminLayout title="Geographical Master Data">
      <div className="adm-page-body">
        {/* Page Header Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Vidarbha Geographical Master Service
            </h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
              Official Maharashtra Common Village Master Data (Districts → Talukas → Villages)
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              backgroundColor: syncing ? '#94a3b8' : '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: syncing ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            <RefreshCw size={18} className={syncing ? 'spin' : ''} />
            {syncing ? 'Synchronizing with Government API...' : 'Sync Vidarbha Geography'}
          </button>
        </div>

        {/* Sync Summary Alert */}
        {syncResult && (
          <div style={{ padding: 16, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#166534', fontWeight: 600, fontSize: 16 }}>
              <CheckCircle size={20} color="#16a34a" />
              Synchronization Complete!
            </div>
            <div style={{ marginTop: 8, fontSize: 14, color: '#15803d', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <span>Districts Processed: <strong>{syncResult.districtsProcessed}</strong></span>
              <span>Talukas Processed: <strong>{syncResult.talukasProcessed}</strong></span>
              <span>Villages Processed: <strong>{syncResult.villagesProcessed}</strong></span>
              <span>Inserted: <strong>{syncResult.inserted}</strong></span>
              <span>Updated: <strong>{syncResult.updated}</strong></span>
              <span>Failed: <strong>{syncResult.failed}</strong></span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div style={{ padding: 16, backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 24, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={20} color="#dc2626" />
            {errorMsg}
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div style={{ background: '#fff', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={16} color="#0284c7" /> Region Scope
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>Vidarbha (11)</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Maharashtra State (Code 27)</div>
          </div>

          <div style={{ background: '#fff', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Building size={16} color="#16a34a" /> Districts
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
              {loadingDistricts ? '...' : districts.length}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Official Government Master</div>
          </div>

          <div style={{ background: '#fff', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Database size={16} color="#8b5cf6" /> Selected Talukas
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
              {loadingTalukas ? '...' : talukas.length}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Active in selected district</div>
          </div>

          <div style={{ background: '#fff', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Building size={16} color="#f59e0b" /> Selected Villages
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
              {loadingVillages ? '...' : villages.length}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Active in selected taluka</div>
          </div>
        </div>

        {/* Main Content Grid: Cascading Selectors & Table */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
          {/* Left Column: Selectors & Search */}
          <div style={{ background: '#fff', padding: 20, borderRadius: 10, border: '1px solid #e2e8f0', height: 'fit-content' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 16, color: '#1e293b' }}>
              Geographical Hierarchy
            </h3>

            {/* District Selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                1. Select District ({districts.length})
              </label>
              <select
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }}
              >
                <option value="">-- Choose District --</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.district_name} ({d.official_district_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Taluka Selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                2. Select Taluka / Sub-District ({talukas.length})
              </label>
              <select
                value={selectedTalukaId}
                onChange={(e) => setSelectedTalukaId(e.target.value)}
                disabled={!selectedDistrictId || loadingTalukas}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  backgroundColor: !selectedDistrictId ? '#f8fafc' : '#fff',
                }}
              >
                <option value="">-- Choose Taluka --</option>
                {talukas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.taluka_name} ({t.official_taluka_code})
                  </option>
                ))}
              </select>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '20px 0' }} />

            {/* Village Global Search */}
            <form onSubmit={handleSearch}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                Search Village Across Vidarbha
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  placeholder="e.g. Nandgaon, Karanja..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
                <button
                  type="submit"
                  style={{ padding: '8px 12px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                >
                  <Search size={16} />
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Master Data Table */}
          <div style={{ background: '#fff', padding: 20, borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 16, color: '#1e293b' }}>
              {searchResults.length > 0
                ? `Search Results for "${searchTerm}" (${searchResults.length})`
                : selectedTalukaId
                ? `Villages List (${villages.length})`
                : selectedDistrictId
                ? `Talukas List (${talukas.length})`
                : '11 Vidarbha Districts Master'}
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '10px 14px' }}>ID</th>
                    <th style={{ padding: '10px 14px' }}>Official Code</th>
                    <th style={{ padding: '10px 14px' }}>English Name</th>
                    <th style={{ padding: '10px 14px' }}>Local / Marathi Name</th>
                    <th style={{ padding: '10px 14px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {/* SEARCH RESULTS MODE */}
                  {searchResults.length > 0 ? (
                    searchResults.map((v) => (
                      <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px', color: '#64748b' }}>#{v.id}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0284c7' }}>{v.official_village_code}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 500 }}>{v.village_name}</td>
                        <td style={{ padding: '10px 14px', color: '#475569' }}>{v.village_local_name || '—'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 12, backgroundColor: '#dcfce7', color: '#15803d', fontSize: 12, fontWeight: 600 }}>
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : selectedTalukaId ? (
                    /* VILLAGES MODE */
                    loadingVillages ? (
                      <tr><td colSpan="5" style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Loading villages...</td></tr>
                    ) : villages.length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No villages synced yet for this taluka. Click "Sync Vidarbha Geography" to pull data.</td></tr>
                    ) : (
                      villages.map((v) => (
                        <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 14px', color: '#64748b' }}>#{v.id}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0284c7' }}>{v.official_village_code}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 500 }}>{v.village_name}</td>
                          <td style={{ padding: '10px 14px', color: '#475569' }}>{v.village_local_name || '—'}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 12, backgroundColor: '#dcfce7', color: '#15803d', fontSize: 12, fontWeight: 600 }}>
                              {v.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )
                  ) : selectedDistrictId ? (
                    /* TALUKAS MODE */
                    loadingTalukas ? (
                      <tr><td colSpan="5" style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Loading talukas...</td></tr>
                    ) : talukas.length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No talukas synced yet for this district. Click "Sync Vidarbha Geography".</td></tr>
                    ) : (
                      talukas.map((t) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 14px', color: '#64748b' }}>#{t.id}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0284c7' }}>{t.official_taluka_code}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 500 }}>{t.taluka_name}</td>
                          <td style={{ padding: '10px 14px', color: '#475569' }}>—</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 12, backgroundColor: '#dcfce7', color: '#15803d', fontSize: 12, fontWeight: 600 }}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    /* DISTRICTS MODE */
                    loadingDistricts ? (
                      <tr><td colSpan="5" style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Loading districts...</td></tr>
                    ) : districts.length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No Vidarbha districts found. Click "Sync Vidarbha Geography" button to sync from Maharashtra Government API.</td></tr>
                    ) : (
                      districts.map((d) => (
                        <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 14px', color: '#64748b' }}>#{d.id}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0284c7' }}>{d.official_district_code}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 500 }}>{d.district_name}</td>
                          <td style={{ padding: '10px 14px', color: '#475569' }}>{d.region}, {d.state}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 12, backgroundColor: '#dcfce7', color: '#15803d', fontSize: 12, fontWeight: 600 }}>
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
