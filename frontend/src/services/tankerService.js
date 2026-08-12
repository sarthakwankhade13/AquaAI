/**
 * tankerService.js — Mock tanker & trip data.
 */

export const getTankerStats = async () => ({
  total: 112, available: 45, assigned: 28, onTrip: 34, maintenance: 5,
});

export const getTankers = async () => [
  { id:'TK-001', vehicle:'MH-20-AB-1234', driver:'Raju Rane',     capacity:'10,000 L', status:'on-trip',     location:'Amravati → Nandgaon',  trip:'TR-0445' },
  { id:'TK-002', vehicle:'MH-22-CD-5678', driver:'Suresh Patil',  capacity:'8,000 L',  status:'available',   location:'Wardha Depot',          trip:'-' },
  { id:'TK-003', vehicle:'MH-14-EF-9012', driver:'Vijay Meshram', capacity:'12,000 L', status:'assigned',    location:'Akola Depot',           trip:'TR-0447' },
  { id:'TK-004', vehicle:'MH-26-GH-3456', driver:'Deepak Sonone', capacity:'10,000 L', status:'on-trip',     location:'Washim → Risod',        trip:'TR-0446' },
  { id:'TK-005', vehicle:'MH-31-IJ-7890', driver:'Anil Kale',     capacity:'8,000 L',  status:'maintenance', location:'Amravati Workshop',     trip:'-' },
  { id:'TK-006', vehicle:'MH-20-KL-1357', driver:'Manoj Bhoyar',  capacity:'10,000 L', status:'available',   location:'Yavatmal Depot',        trip:'-' },
];

export const getActiveTrips = async () => [
  { id:'TR-0445', tanker:'MH-20-AB-1234', driver:'Raju Rane',     from:'Amravati', to:'Nandgaon',    qty:'10,000 L', eta:'14:30', status:'on-route',  delay:false },
  { id:'TR-0446', tanker:'MH-26-GH-3456', driver:'Deepak Sonone', from:'Washim',   to:'Risod',       qty:'8,000 L',  eta:'15:00', status:'delayed',   delay:true  },
  { id:'TR-0447', tanker:'MH-14-EF-9012', driver:'Vijay Meshram', from:'Akola',    to:'Balapur',     qty:'12,000 L', eta:'13:45', status:'on-route',  delay:false },
  { id:'TR-0448', tanker:'MH-20-MN-2468', driver:'Prakash Ingole',from:'Buldhana', to:'Mehkar',      qty:'10,000 L', eta:'16:15', status:'on-route',  delay:false },
  { id:'TR-0449', tanker:'MH-22-OP-3579', driver:'Santosh Wagh',  from:'Wardha',   to:'Hinganghat',  qty:'8,000 L',  eta:'14:00', status:'delivered', delay:false },
];
