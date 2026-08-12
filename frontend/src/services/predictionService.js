/**
 * predictionService.js — Mock AI prediction data.
 */

export const getDroughtSummary = async () => {
  return {
    overallRisk:        'High',
    confidence:         87,        // %
    waterStressIndex:   0.74,
    highRiskVillages:   62,
    moderateRiskVillages: 148,
    lowRiskVillages:    312,
    severeVillages:     18,
    distribution: [
      { label: 'Severe',   value: 18,  color: '#ef4444', pct: 4  },
      { label: 'High',     value: 62,  color: '#f97316', pct: 14 },
      { label: 'Moderate', value: 148, color: '#f59e0b', pct: 34 },
      { label: 'Low',      value: 312, color: '#22c55e', pct: 48 },
    ],
  };
};

export const getDistrictRiskData = async () => {
  return [
    { district: 'Amravati',  highRisk: 14, moderate: 32, low: 61 },
    { district: 'Akola',     highRisk: 12, moderate: 28, low: 43 },
    { district: 'Buldhana',  highRisk: 10, moderate: 25, low: 58 },
    { district: 'Wardha',    highRisk: 8,  moderate: 20, low: 44 },
    { district: 'Yavatmal',  highRisk: 18, moderate: 43, low: 87 },
    { district: 'Washim',    highRisk: 7,  moderate: 18, low: 39 },
  ];
};
