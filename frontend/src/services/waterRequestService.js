export const getWaterRequests = async () => {
  return [];
};

export const getWaterAvailability = async () => {
  return {
    totalAvailableBL: 0,
    reservoirStoragePct: 0,
    groundwaterStatusPct: 0,
    dailyConsumptionML: 0,
    dailyDemandML: 0,
    deficitML: 0,
    weeklyData: [],
  };
};
