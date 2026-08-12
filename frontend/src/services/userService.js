/**
 * userService.js — Mock user management data.
 */

export const getUsers = async () => [
  { id:'USR-001', name:'Rajesh Kumar Sharma',  email:'r.sharma@wrd.gov.in',  role:'District Admin', district:'Amravati', status:'active',   lastLogin:'2026-08-11 09:12' },
  { id:'USR-002', name:'Sunita Patil',          email:'s.patil@wrd.gov.in',   role:'District Admin', district:'Akola',    status:'active',   lastLogin:'2026-08-11 08:45' },
  { id:'USR-003', name:'Manoj Bhoyar',          email:'m.bhoyar@wrd.gov.in',  role:'Village Officer',district:'Wardha',   status:'active',   lastLogin:'2026-08-10 17:30' },
  { id:'USR-004', name:'Kavita Meshram',        email:'k.meshram@wrd.gov.in', role:'Village Officer',district:'Yavatmal', status:'inactive', lastLogin:'2026-08-08 11:20' },
  { id:'USR-005', name:'Deepak Wankhede',       email:'d.wankhede@wrd.gov.in',role:'District Admin', district:'Buldhana', status:'active',   lastLogin:'2026-08-11 10:05' },
  { id:'USR-006', name:'Raju Rane',             email:'r.rane@wrd.gov.in',    role:'Driver',         district:'Amravati', status:'active',   lastLogin:'2026-08-11 06:30' },
  { id:'USR-007', name:'Santosh Ingole',        email:'s.ingole@wrd.gov.in',  role:'Driver',         district:'Washim',   status:'active',   lastLogin:'2026-08-11 07:15' },
];

export const getUserStats = async () => ({
  totalUsers: 284, districtAdmins: 11, villageOfficers: 186, drivers: 72, citizens: 15,
});
