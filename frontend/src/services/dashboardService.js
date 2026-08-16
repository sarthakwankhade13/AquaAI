import { getGeographySummary } from './geographyApi';

export const getKpiStats = async () => {
  try {
    const geoRes = await getGeographySummary();
    const data = geoRes?.data || {};
    return {
      totalDistricts:       data.totalDistricts || 11,
      totalVillages:        data.totalVillages || 1170,
      activeTankers:        0,
      activeTrips:          0,
      pendingWaterRequests: 0,
      openComplaints:       0,
      highRiskVillages:     0,
      availableWaterML:     'N/A',
    };
  } catch {
    return {
      totalDistricts:       11,
      totalVillages:        1170,
      activeTankers:        0,
      activeTrips:          0,
      pendingWaterRequests: 0,
      openComplaints:       0,
      highRiskVillages:     0,
      availableWaterML:     'N/A',
    };
  }
};

export const getRecentActivity = async () => {
  return [];
};
