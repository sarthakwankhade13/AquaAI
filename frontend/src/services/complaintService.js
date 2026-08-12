/**
 * complaintService.js — Mock complaint data.
 */

export const getComplaintStats = async () => ({
  total: 143, pending: 48, underVerification: 32, inProgress: 29, resolved: 28, emergency: 6,
  chartData: [
    { label: 'Pending',       value: 48, color: '#f59e0b' },
    { label: 'Verification',  value: 32, color: '#3b82f6' },
    { label: 'In Progress',   value: 29, color: '#8b5cf6' },
    { label: 'Resolved',      value: 28, color: '#22c55e' },
    { label: 'Emergency',     value: 6,  color: '#ef4444' },
  ],
});

export const getComplaints = async () => [
  { id:'CP-0321', village:'Nandgaon',   district:'Amravati', type:'Water Shortage',     priority:'Emergency', date:'2026-08-11', status:'emergency'   },
  { id:'CP-0320', village:'Karanja',    district:'Washim',   type:'Tanker Delayed',     priority:'High',      date:'2026-08-10', status:'in-progress' },
  { id:'CP-0319', village:'Balapur',    district:'Akola',    type:'Quality Issue',       priority:'High',      date:'2026-08-10', status:'review'      },
  { id:'CP-0318', village:'Risod',      district:'Washim',   type:'No Supply 3 Days',   priority:'Critical',  date:'2026-08-09', status:'pending'     },
  { id:'CP-0317', village:'Dhamangaon', district:'Amravati', type:'Pipeline Broken',    priority:'Medium',    date:'2026-08-09', status:'in-progress' },
  { id:'CP-0316', village:'Hinganghat', district:'Wardha',   type:'Contamination',      priority:'High',      date:'2026-08-08', status:'review'      },
  { id:'CP-0315', village:'Chandur',    district:'Amravati', type:'Insufficient Qty',   priority:'Low',       date:'2026-08-08', status:'resolved'    },
];
