/**
 * reportService.js — Mock report data.
 */

export const getReports = async () => [
  { id:'RPT-088', title:'Vidarbha Drought Assessment — July 2026',  type:'Drought',      district:'All',      generated:'2026-08-01', status:'completed', size:'2.4 MB' },
  { id:'RPT-087', title:'Amravati Water Distribution Monthly',      type:'Distribution', district:'Amravati', generated:'2026-08-01', status:'completed', size:'1.8 MB' },
  { id:'RPT-086', title:'Tanker Utilization Report — Week 31',      type:'Operations',   district:'All',      generated:'2026-08-04', status:'completed', size:'980 KB' },
  { id:'RPT-085', title:'Complaint Resolution Summary — July',      type:'Complaints',   district:'All',      generated:'2026-08-01', status:'completed', size:'640 KB' },
  { id:'RPT-084', title:'Groundwater Level Analysis Q2 2026',       type:'Environmental',district:'All',      generated:'2026-07-01', status:'completed', size:'3.1 MB' },
  { id:'RPT-083', title:'AI Prediction Accuracy Report — Q2',       type:'AI/ML',        district:'All',      generated:'2026-07-01', status:'completed', size:'1.2 MB' },
];

export const getNotifications = async () => [
  { id:1, type:'emergency', title:'Critical Water Shortage',         desc:'Nandgaon village — 3 days without supply', time:'5 min ago',  read:false },
  { id:2, type:'alert',     title:'Tanker TR-0446 Delayed',          desc:'Washim → Risod route — 45 min delay',      time:'18 min ago', read:false },
  { id:3, type:'info',      title:'AI Prediction Updated',           desc:'New drought forecast for Amravati',         time:'1 hr ago',   read:false },
  { id:4, type:'success',   title:'Water Request WR-0891 Approved',  desc:'50,000 L approved for Dhamangaon',          time:'2 hr ago',   read:true  },
  { id:5, type:'warning',   title:'Reservoir Level Low',             desc:'Wardha reservoir at 38% capacity',          time:'3 hr ago',   read:true  },
  { id:6, type:'info',      title:'Monthly Report Generated',        desc:'Amravati division — July 2026',             time:'5 hr ago',   read:true  },
];
