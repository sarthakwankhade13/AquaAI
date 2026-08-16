export const getDroughtSummary = async () => {
  return {
    overallRisk:        'Not Evaluated',
    confidence:         0,
    waterStressIndex:   0.0,
    highRiskVillages:   0,
    moderateRiskVillages: 0,
    lowRiskVillages:    0,
    severeVillages:     0,
    distribution: [
      { label: 'Severe',   value: 0, color: '#ef4444', pct: 0 },
      { label: 'High',     value: 0, color: '#f97316', pct: 0 },
      { label: 'Moderate', value: 0, color: '#f59e0b', pct: 0 },
      { label: 'Low',      value: 0, color: '#22c55e', pct: 0 },
    ],
  };
};

export const getDistrictRiskData = async () => {
  return [];
};
