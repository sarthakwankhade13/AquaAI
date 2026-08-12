/**
 * waterRequestService.js — Mock water request data.
 */

export const getWaterRequests = async () => {
  return [
    { id:'WR-0894', village:'Nandgaon',    district:'Amravati', qty:'60,000 L', priority:'Critical', date:'2026-08-11', status:'pending' },
    { id:'WR-0893', village:'Karanja',     district:'Washim',   qty:'45,000 L', priority:'High',     date:'2026-08-10', status:'review' },
    { id:'WR-0892', village:'Hinganghat',  district:'Wardha',   qty:'30,000 L', priority:'Medium',   date:'2026-08-10', status:'approved' },
    { id:'WR-0891', village:'Dhamangaon',  district:'Amravati', qty:'50,000 L', priority:'High',     date:'2026-08-09', status:'completed' },
    { id:'WR-0890', village:'Risod',       district:'Washim',   qty:'25,000 L', priority:'Low',      date:'2026-08-09', status:'in-progress' },
    { id:'WR-0889', village:'Chandur Bazar',district:'Amravati',qty:'40,000 L', priority:'Medium',   date:'2026-08-08', status:'approved' },
    { id:'WR-0888', village:'Balapur',     district:'Akola',    qty:'55,000 L', priority:'Critical', date:'2026-08-08', status:'pending' },
    { id:'WR-0887', village:'Mangrulpir',  district:'Washim',   qty:'35,000 L', priority:'High',     date:'2026-08-07', status:'rejected' },
  ];
};

export const getWaterAvailability = async () => {
  return {
    totalAvailableBL: 2.4,
    reservoirStoragePct: 41,
    groundwaterStatusPct: 34,
    dailyConsumptionML: 18.6,
    dailyDemandML: 24.0,
    deficitML: 5.4,
    weeklyData: [
      { day: 'Mon', supply: 18, demand: 24 },
      { day: 'Tue', supply: 17, demand: 23 },
      { day: 'Wed', supply: 19, demand: 25 },
      { day: 'Thu', supply: 16, demand: 24 },
      { day: 'Fri', supply: 20, demand: 24 },
      { day: 'Sat', supply: 18, demand: 23 },
      { day: 'Sun', supply: 19, demand: 24 },
    ],
  };
};
