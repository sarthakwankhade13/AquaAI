import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import CardHeader from '../../components/admin/ui/CardHeader';
import { LoadingState, ErrorState } from '../../components/admin/ui/LoadingState';
import {
  fetchDistricts, fetchTalukasByDistrict, fetchVillagesByTaluka,
  triggerGeographySync, validateGeography,
} from '../../services/geographyService';
import {
  Map, ChevronRight, RefreshCw, CheckCircle,
  AlertTriangle, Search, Building2, MapPin,
} from 'lucide-react';

export default function GeographyManagement() {
  const [districts,       setDistricts]       = useState([]);
  const [talukas,         setTalukas]         = useState([]);
  const [villages,        setVillages]        = useState([]);
  const [selectedDist,    setSelectedDist]    = useState(null);
  const [selectedTaluka,  setSelectedTaluka]  = useState(null);
  const [search,          setSearch]          = useState('');
  const [loadingDistricts,setLoadingDistricts]= useState(true);
  const [loadingTalukas,  setLoadingTalukas]  = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [syncing,         setSyncing]         = useState(false);
  const [syncResult,      setSyncResult]      = useState(null);
  const [validation,      setValidation]      = useState(null);
  const [error,           setError]           = useState('');

  // Load districts on mount
  useEffect(() => {
    fetchDistricts()
      .then(setDistricts)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingDistricts(false));
  }, []);

  // Load talukas when district selected
  const selectDistrict = useCallback(async (district) => {
    setSelectedDist(district);
    setSelectedTaluka(null);
    setTalukas([]);
    setVillages([]);
    setLoadingTalukas(true);
    try {
      const data = await fetchTalukasByDistrict(district.id);
      setTalukas(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingTalukas(false);
    }
  }, []);

  // Load villages when taluka selected
  const selectTaluka = useCallback(async (taluka) => {
    setSelectedTaluka(taluka);
    setVillages([]);
    setLoadingVillages(true);
    try {
      const data = await fetchVillagesByTaluka(taluka.id);
      setVillages(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingVillages(false);
    }
  }, []);

  // Trigger sync
  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setError('');
    try {
      const res = await triggerGeographySync();
      setSyncResult(res);
      // Refresh districts after sync
      const dists = await fetchDistricts();
      setDistricts(dists);
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  };

  // Validate
  const handleValidate = async () => {
    try {
      const res = await validateGeography();
      setValidation(res.data);
    } catch (e) {
      setError(e.message);
    }
  };

  const filteredVillages = search
    ? villages.filter((v) => v.village_name?.toLowerCase().includes(search.toLowerCase()) || v.village_local_name?.toLowerCase().includes(search.toLowerCase()))
    : villages;

  return (
    <AdminLayout title="Geography Management" breadcrumb="Geography Management">
      <div className="adm-page">

        {/* Header */}
        <div className="adm-page-header">
          <div>
            <div className="adm-page-title">Geography Master Data</div>
            <div className="adm-page-desc">
              Vidarbha region — 11 Districts · Maharashtra Official Data
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="adm-btn adm-btn-ghost" onClick={handleValidate}>
              <CheckCircle size={14} /> Validate
            </button>
            <button className="adm-btn adm-btn-primary" onClick={handleSync} disabled={syncing}>
              <RefreshCw size={14} className={syncing ? 'spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync from Maharashtra API'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="adm-alert-card alert-orange">
            <div className="adm-alert-icon" style={{ background:'#ffedd5' }}>
              <AlertTriangle size={16} color="#ea580c" />
            </div>
            <div className="adm-alert-body">
              <div className="adm-alert-title" style={{ color:'#ea580c' }}>Error</div>
              <div className="adm-alert-detail">{error}</div>
            </div>
            <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => setError('')}>Dismiss</button>
          </div>
        )}

        {/* Sync Result */}
        {syncResult && (
          <div className="adm-card adm-card-pad" style={{ background:'#f0fdf4', border:'1px solid rgba(34,197,94,0.3)' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#15803d', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
              <CheckCircle size={15} /> Sync Completed Successfully
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
              {[
                { label:'Districts', val: syncResult.data?.districtsProcessed },
                { label:'Talukas',   val: syncResult.data?.talukasProcessed   },
                { label:'Villages',  val: syncResult.data?.villagesProcessed  },
                { label:'Inserted',  val: syncResult.data?.inserted           },
                { label:'Updated',   val: syncResult.data?.updated            },
                { label:'Failed',    val: syncResult.data?.failed, warn:true  },
              ].map(({ label, val, warn }) => (
                <div key={label} style={{ textAlign:'center', padding:'10px', background:'#fff', borderRadius:8, border:'1px solid #e2e8f0' }}>
                  <div style={{ fontSize:20, fontWeight:800, color: warn && val > 0 ? '#ef4444' : '#15803d' }}>{val ?? '—'}</div>
                  <div style={{ fontSize:11, color:'#64748b' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation Result */}
        {validation && (
          <div className={`adm-card adm-card-pad`} style={{ background: validation.isValid ? '#f0fdf4' : '#fff5f5', border:`1px solid ${validation.isValid ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
            <div style={{ fontSize:13, fontWeight:700, color: validation.isValid ? '#15803d' : '#dc2626', marginBottom:8, display:'flex', alignItems:'center', gap:8 }}>
              {validation.isValid ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
              {validation.isValid ? 'Data Validation Passed' : 'Validation Issues Found'}
            </div>
            <div style={{ display:'flex', gap:24, fontSize:12 }}>
              <span>Districts: <strong>{validation.districtCount}</strong> / 11</span>
              <span>Talukas: <strong>{validation.talukaCount}</strong></span>
              <span>Villages: <strong>{validation.villageCount}</strong></span>
            </div>
            {validation.issues?.length > 0 && (
              <ul style={{ marginTop:8, paddingLeft:16, color:'#dc2626', fontSize:12 }}>
                {validation.issues.map((i, idx) => <li key={idx}>{i}</li>)}
              </ul>
            )}
          </div>
        )}

        {/* 3-panel explorer */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1.5fr', gap:16, alignItems:'start' }}>

          {/* Districts */}
          <div className="adm-card">
            <CardHeader
              title={<div style={{ display:'flex', alignItems:'center', gap:6 }}><Map size={14} color="#0ea5e9" /> Districts</div>}
              subtitle={`${districts.length} of 11 loaded`}
            />
            {loadingDistricts ? <LoadingState message="Loading districts..." /> : (
              <div style={{ maxHeight:480, overflowY:'auto' }}>
                {districts.length === 0 ? (
                  <div style={{ padding:'24px', textAlign:'center', color:'#94a3b8', fontSize:12 }}>
                    No districts found. Run sync first.
                  </div>
                ) : districts.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => selectDistrict(d)}
                    style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      width:'100%', padding:'10px 16px',
                      background: selectedDist?.id === d.id ? '#e0f2fe' : 'transparent',
                      border:'none', borderBottom:'1px solid #f1f5f9',
                      cursor:'pointer', textAlign:'left',
                      transition:'background 0.1s',
                    }}
                  >
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color: selectedDist?.id === d.id ? '#0369a1' : '#0f172a' }}>{d.district_name}</div>
                      <div style={{ fontSize:10, color:'#94a3b8', fontFamily:'monospace' }}>Code: {d.official_district_code}</div>
                    </div>
                    <ChevronRight size={14} color={selectedDist?.id === d.id ? '#0369a1' : '#94a3b8'} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Talukas */}
          <div className="adm-card">
            <CardHeader
              title={<div style={{ display:'flex', alignItems:'center', gap:6 }}><Building2 size={14} color="#8b5cf6" /> Talukas</div>}
              subtitle={selectedDist ? `${talukas.length} talukas in ${selectedDist.district_name}` : 'Select a district'}
            />
            {loadingTalukas ? <LoadingState message="Loading talukas..." /> : !selectedDist ? (
              <div style={{ padding:'24px', textAlign:'center', color:'#94a3b8', fontSize:12 }}>
                ← Select a district to view talukas
              </div>
            ) : (
              <div style={{ maxHeight:480, overflowY:'auto' }}>
                {talukas.length === 0 ? (
                  <div style={{ padding:'24px', textAlign:'center', color:'#94a3b8', fontSize:12 }}>No talukas found</div>
                ) : talukas.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectTaluka(t)}
                    style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      width:'100%', padding:'10px 16px',
                      background: selectedTaluka?.id === t.id ? '#ede9fe' : 'transparent',
                      border:'none', borderBottom:'1px solid #f1f5f9',
                      cursor:'pointer', textAlign:'left',
                    }}
                  >
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color: selectedTaluka?.id === t.id ? '#7c3aed' : '#0f172a' }}>{t.taluka_name}</div>
                      <div style={{ fontSize:10, color:'#94a3b8', fontFamily:'monospace' }}>Code: {t.official_taluka_code}</div>
                    </div>
                    <ChevronRight size={14} color={selectedTaluka?.id === t.id ? '#7c3aed' : '#94a3b8'} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Villages */}
          <div className="adm-card">
            <CardHeader
              title={<div style={{ display:'flex', alignItems:'center', gap:6 }}><MapPin size={14} color="#22c55e" /> Villages</div>}
              subtitle={selectedTaluka ? `${filteredVillages.length} villages in ${selectedTaluka.taluka_name}` : 'Select a taluka'}
              action={
                selectedTaluka && (
                  <div style={{ display:'flex', alignItems:'center', gap:6, padding:'0 8px', height:32, border:'1.5px solid #e2e8f0', borderRadius:8, background:'#f8fafc' }}>
                    <Search size={12} color="#94a3b8" />
                    <input
                      placeholder="Search village..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ border:'none', background:'transparent', fontSize:12, outline:'none', width:120, color:'#334155' }}
                    />
                  </div>
                )
              }
            />
            {loadingVillages ? <LoadingState message="Loading villages..." /> : !selectedTaluka ? (
              <div style={{ padding:'24px', textAlign:'center', color:'#94a3b8', fontSize:12 }}>
                ← Select a taluka to view villages
              </div>
            ) : (
              <div style={{ maxHeight:480, overflowY:'auto' }}>
                {filteredVillages.length === 0 ? (
                  <div style={{ padding:'24px', textAlign:'center', color:'#94a3b8', fontSize:12 }}>No villages found</div>
                ) : filteredVillages.map((v) => (
                  <div key={v.id} style={{ padding:'8px 16px', borderBottom:'1px solid #f1f5f9' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#0f172a' }}>{v.village_name}</div>
                    {v.village_local_name && (
                      <div style={{ fontSize:11, color:'#94a3b8' }}>{v.village_local_name}</div>
                    )}
                    <div style={{ fontSize:10, color:'#cbd5e1', fontFamily:'monospace' }}>Code: {v.official_village_code}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
