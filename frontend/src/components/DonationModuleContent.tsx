'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from './Sidebar';
import Footer from './Footer';
import AutoRecoverBanner from './AutoRecoverBanner';
import { safeStorage } from '../utils/safeStorage';
import { useAuth } from '../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

export interface DonationRecord {
  id: string;
  receiptNo: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  panNumber: string;
  amount: number;
  fundCategory: string;
  paymentMode: 'Razorpay' | 'UPI' | 'Direct Bank Transfer' | 'Cash / Cheque';
  transactionId: string;
  date: string;
  status: 'Verified' | 'Pending' | 'Flagged';
  taxExemptionEligible: boolean;
  notes?: string;
}

export interface CampaignGoal {
  id: string;
  title: string;
  category: string;
  targetAmount: number;
  collectedAmount: number;
  donorsCount: number;
  status: 'Active' | 'Completed';
  description?: string;
}

export interface DonorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  panNumber: string;
  totalDonated: number;
  donationsCount: number;
  lastDonationDate: string;
}

const INITIAL_TRANSACTIONS_SEED: DonationRecord[] = [
  {
    id: 'DON-1001',
    receiptNo: 'BSS-80G-2026-001',
    donorName: 'Rushikesh Pattiwar',
    donorEmail: 'pattiwarrushikesh5102@gmail.com',
    donorPhone: '+91 9529054868',
    panNumber: 'ABCDE1234F',
    amount: 25000,
    fundCategory: 'Electrical Trade Lab Modernization',
    paymentMode: 'Razorpay',
    transactionId: 'pay_Pattiwar_99120',
    date: '2026-03-12 14:30',
    status: 'Verified',
    taxExemptionEligible: true,
  },
  {
    id: 'DON-1002',
    receiptNo: 'BSS-80G-2026-002',
    donorName: 'Anil Kumar Sharma',
    donorEmail: 'anil.sharma@example.com',
    donorPhone: '+91 9823456711',
    panNumber: 'BKDPS9912K',
    amount: 10000,
    fundCategory: 'Student Scholarships Fund',
    paymentMode: 'UPI',
    transactionId: 'upi_992381203',
    date: '2026-03-11 11:15',
    status: 'Verified',
    taxExemptionEligible: true,
  },
  {
    id: 'DON-1003',
    receiptNo: 'BSS-80G-2026-003',
    donorName: 'Sujata Deshmukh',
    donorEmail: 'sujata.d@example.com',
    donorPhone: '+91 9422114455',
    panNumber: 'AEPPD4431L',
    amount: 50000,
    fundCategory: 'Computer CAD Laboratory',
    paymentMode: 'Direct Bank Transfer',
    transactionId: 'NEFT_SBI_009123',
    date: '2026-03-10 16:45',
    status: 'Verified',
    taxExemptionEligible: true,
  },
  {
    id: 'DON-1004',
    receiptNo: 'BSS-80G-2026-004',
    donorName: 'Local Industrialist Trust',
    donorEmail: 'trust.bhadrawati@example.org',
    donorPhone: '+91 9529054868',
    panNumber: 'AAATT8812M',
    amount: 100000,
    fundCategory: 'Workshop Machinery Upgrade',
    paymentMode: 'Cash / Cheque',
    transactionId: 'CHQ_SBI_449012',
    date: '2026-03-08 10:00',
    status: 'Verified',
    taxExemptionEligible: true,
  },
  {
    id: 'DON-1005',
    receiptNo: 'BSS-80G-2026-005',
    donorName: 'Dr. Rameshwar Rao',
    donorEmail: 'dr.rao@medicaltrust.org',
    donorPhone: '+91 9822441122',
    panNumber: 'ARRPP5521K',
    amount: 15000,
    fundCategory: 'Student Scholarships Fund',
    paymentMode: 'UPI',
    transactionId: 'upi_rao_882910',
    date: '2026-03-05 09:20',
    status: 'Verified',
    taxExemptionEligible: true,
  },
  {
    id: 'DON-1006',
    receiptNo: 'BSS-80G-2026-006',
    donorName: 'Pratibha Agro Industries',
    donorEmail: 'contact@pratibhaagro.in',
    donorPhone: '+91 9822339900',
    panNumber: 'AACCP1190N',
    amount: 75000,
    fundCategory: 'Workshop Machinery Upgrade',
    paymentMode: 'Direct Bank Transfer',
    transactionId: 'RTGS_HDFC_881920',
    date: '2026-03-01 15:10',
    status: 'Verified',
    taxExemptionEligible: true,
  }
];

const INITIAL_CAMPAIGNS_SEED: CampaignGoal[] = [
  { id: '1', title: 'Student Scholarships Fund', category: 'Scholarships', targetAmount: 500000, collectedAmount: 385000, donorsCount: 142, status: 'Active', description: 'Empowering deserving rural ITI students with 100% tuition grant aid.' },
  { id: '2', title: 'Workshop Machinery Upgrade', category: 'Machinery', targetAmount: 800000, collectedAmount: 620000, donorsCount: 89, status: 'Active', description: 'Procuring heavy-duty lathes, CNC simulators, and precision tools for workshop.' },
  { id: '3', title: 'Computer CAD Laboratory', category: 'IT & Software', targetAmount: 400000, collectedAmount: 310000, donorsCount: 64, status: 'Active', description: 'Equipping modern workstation terminals with AutoCAD and Drafting suites.' },
  { id: '4', title: 'Library Book Expansion', category: 'Books', targetAmount: 200000, collectedAmount: 185000, donorsCount: 110, status: 'Active', description: 'Adding technical engineering manuals and bilingual trade reference textbooks.' },
];

interface DonationModuleContentProps {
  activeTab?: 'dashboard' | 'transactions' | 'campaigns' | 'donors' | 'reports';
  userRole?: string;
  effectiveRole?: string;
  onSimulateRole?: (role: string) => void;
}

export default function DonationModuleContent({
  activeTab = 'dashboard',
  userRole: propUserRole,
  effectiveRole: propEffectiveRole,
  onSimulateRole
}: DonationModuleContentProps) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const simulateParam = searchParams ? searchParams.get('simulate') : null;

  // Master State pre-initialized for instant SSR and fast hydration
  const [transactions, setTransactions] = useState<DonationRecord[]>(INITIAL_TRANSACTIONS_SEED);
  const [campaigns, setCampaigns] = useState<CampaignGoal[]>(INITIAL_CAMPAIGNS_SEED);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<DonationRecord | null>(null);
  const [selectedDonorHistory, setSelectedDonorHistory] = useState<DonorProfile | null>(null);

  // Sync search param from URL on navigation
  useEffect(() => {
    if (searchParams) {
      const q = searchParams.get('search') || searchParams.get('q') || searchParams.get('donor');
      if (q) setSearchQuery(q);
    }
  }, [searchParams]);

  // Offline Donation Form Inputs
  const [newDonorName, setNewDonorName] = useState('');
  const [newDonorEmail, setNewDonorEmail] = useState('pattiwarrushikesh5102@gmail.com');
  const [newDonorPhone, setNewDonorPhone] = useState('9529054868');
  const [newPan, setNewPan] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newFund, setNewFund] = useState('Student Scholarships Fund');
  const [newPaymentMode, setNewPaymentMode] = useState<'Cash / Cheque' | 'Direct Bank Transfer' | 'UPI'>('Cash / Cheque');

  // Microsoft Word-style AutoRecover state
  const [hasDonationDraft, setHasDonationDraft] = useState(false);
  const [donationDraftTime, setDonationDraftTime] = useState<string | null>(null);

  // Check draft on modal open
  useEffect(() => {
    if (showAddModal) {
      const saved = safeStorage.get<any>('draft_offline_donation', null);
      if (saved && saved.name) {
        setHasDonationDraft(true);
        setDonationDraftTime(saved.savedAt);
      }
    }
  }, [showAddModal]);

  // Continuous auto-save on keystroke
  useEffect(() => {
    if (showAddModal && (newDonorName || newAmount)) {
      const timer = setTimeout(() => {
        safeStorage.set('draft_offline_donation', {
          name: newDonorName,
          email: newDonorEmail,
          phone: newDonorPhone,
          pan: newPan,
          amount: newAmount,
          fund: newFund,
          mode: newPaymentMode,
          savedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [showAddModal, newDonorName, newDonorEmail, newDonorPhone, newPan, newAmount, newFund, newPaymentMode]);

  const handleRestoreDonationDraft = () => {
    const saved = safeStorage.get<any>('draft_offline_donation', null);
    if (saved) {
      if (saved.name) setNewDonorName(saved.name);
      if (saved.email) setNewDonorEmail(saved.email);
      if (saved.phone) setNewDonorPhone(saved.phone);
      if (saved.pan) setNewPan(saved.pan);
      if (saved.amount) setNewAmount(saved.amount);
      if (saved.fund) setNewFund(saved.fund);
      if (saved.mode) setNewPaymentMode(saved.mode);
      setHasDonationDraft(false);
    }
  };

  const handleDiscardDonationDraft = () => {
    safeStorage.remove('draft_offline_donation');
    setHasDonationDraft(false);
  };

  // New Campaign Form Inputs
  const [newCampTitle, setNewCampTitle] = useState('');
  const [newCampCategory, setNewCampCategory] = useState('Scholarships');
  const [newCampTarget, setNewCampTarget] = useState('');
  const [newCampDesc, setNewCampDesc] = useState('');

  // Customizable Reports State (Months, Years, Causes, Payment Modes, Custom Dates)
  const [reportPeriodType, setReportPeriodType] = useState<'ALL' | 'MONTH' | 'YEAR' | 'CUSTOM'>('ALL');
  const [reportSelectedMonth, setReportSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [reportSelectedYear, setReportSelectedYear] = useState<number>(new Date().getFullYear());
  const [reportSelectedCause, setReportSelectedCause] = useState<string>('ALL');
  const [reportSelectedMode, setReportSelectedMode] = useState<string>('ALL');
  const [reportCustomFrom, setReportCustomFrom] = useState<string>('');
  const [reportCustomTo, setReportCustomTo] = useState<string>('');
  const [showPrintablePdfModal, setShowPrintablePdfModal] = useState<boolean>(false);

  // Hydrate from localStorage once on client mount
  useEffect(() => {
    try {
      const localTx = localStorage.getItem('saiiti_donation_transactions');
      const localCamp = localStorage.getItem('saiiti_donation_campaigns');

      if (localTx) {
        setTransactions(JSON.parse(localTx));
      } else {
        localStorage.setItem('saiiti_donation_transactions', JSON.stringify(INITIAL_TRANSACTIONS_SEED));
      }

      if (localCamp) {
        setCampaigns(JSON.parse(localCamp));
      } else {
        localStorage.setItem('saiiti_donation_campaigns', JSON.stringify(INITIAL_CAMPAIGNS_SEED));
      }
    } catch (e) {
      console.warn('LocalStorage error in DonationModuleContent:', e);
    }
  }, []);

  const saveTransactions = (newTx: DonationRecord[]) => {
    setTransactions(newTx);
    try {
      localStorage.setItem('saiiti_donation_transactions', JSON.stringify(newTx));
    } catch {}
  };

  const saveCampaigns = (newCamp: CampaignGoal[]) => {
    setCampaigns(newCamp);
    try {
      localStorage.setItem('saiiti_donation_campaigns', JSON.stringify(newCamp));
    } catch {}
  };

  // Calculations
  const stats = useMemo(() => {
    const totalCollected = transactions.reduce((acc, t) => acc + (t.status === 'Verified' ? t.amount : 0), 0);
    const totalVerifiedReceipts = transactions.filter((t) => t.status === 'Verified').length;
    const totalDonors = new Set(transactions.map(t => (t.donorPhone || t.donorEmail || t.donorName).toLowerCase())).size;
    const activeCauses = campaigns.filter(c => c.status === 'Active').length;
    const totalTarget = campaigns.reduce((acc, c) => acc + c.targetAmount, 0);
    const totalCampaignRaised = campaigns.reduce((acc, c) => acc + c.collectedAmount, 0);

    return {
      totalCollected,
      totalVerifiedReceipts,
      totalDonors,
      activeCauses,
      totalTarget,
      totalCampaignRaised,
    };
  }, [transactions, campaigns]);

  // Distinct Donors
  const donorProfiles = useMemo(() => {
    const map = new Map<string, DonorProfile>();

    transactions.forEach(t => {
      const key = (t.donorPhone || t.donorEmail || t.donorName).toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, {
          id: `donor-${map.size + 1}`,
          name: t.donorName,
          email: t.donorEmail,
          phone: t.donorPhone,
          panNumber: t.panNumber,
          totalDonated: t.amount,
          donationsCount: 1,
          lastDonationDate: t.date,
        });
      } else {
        const d = map.get(key)!;
        d.totalDonated += t.amount;
        d.donationsCount += 1;
        if (t.date > d.lastDonationDate) {
          d.lastDonationDate = t.date;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalDonated - a.totalDonated);
  }, [transactions]);

  // Filtering Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch =
        t.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.panNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.fundCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.donorEmail.toLowerCase().includes(searchQuery.toLowerCase());

      const matchMode = filterMode === 'ALL' || t.paymentMode === filterMode;
      const matchCat = filterCategory === 'ALL' || t.fundCategory === filterCategory;

      return matchSearch && matchMode && matchCat;
    });
  }, [transactions, searchQuery, filterMode, filterCategory]);

  // Filtering Donors
  const filteredDonors = useMemo(() => {
    return donorProfiles.filter(d => {
      return (
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.panNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [donorProfiles, searchQuery]);

  // Selected Donor Specific Transactions
  const donorTransactions = useMemo(() => {
    if (!selectedDonorHistory) return [];
    const nameMatch = selectedDonorHistory.name.toLowerCase().trim();
    const emailMatch = selectedDonorHistory.email?.toLowerCase().trim();
    const phoneMatch = selectedDonorHistory.phone?.toLowerCase().trim();
    const panMatch = selectedDonorHistory.panNumber?.toLowerCase().trim();

    return transactions.filter(t => {
      const tName = t.donorName.toLowerCase().trim();
      const tEmail = t.donorEmail?.toLowerCase().trim();
      const tPhone = t.donorPhone?.toLowerCase().trim();
      const tPan = t.panNumber?.toLowerCase().trim();

      if (panMatch && panMatch !== 'not_provided' && tPan === panMatch) return true;
      if (emailMatch && tEmail === emailMatch) return true;
      if (phoneMatch && tPhone === phoneMatch) return true;
      if (nameMatch && tName === nameMatch) return true;
      return false;
    });
  }, [transactions, selectedDonorHistory]);

  // Record Offline Donation Action
  const handleAddDonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDonorName || !newAmount) return;

    const amt = parseFloat(newAmount);
    const newRecord: DonationRecord = {
      id: `DON-${1000 + transactions.length + 1}`,
      receiptNo: `BSS-80G-2026-0${transactions.length + 1}`,
      donorName: newDonorName,
      donorEmail: newDonorEmail || 'saiiti151@gmail.com',
      donorPhone: newDonorPhone || '9529054868',
      panNumber: newPan.toUpperCase() || 'NOT_PROVIDED',
      amount: amt,
      fundCategory: newFund,
      paymentMode: newPaymentMode,
      transactionId: `OFFLINE_${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'Verified',
      taxExemptionEligible: true,
    };

    const updated = [newRecord, ...transactions];
    saveTransactions(updated);

    // Clear auto-saved draft upon successful submission
    safeStorage.remove('draft_offline_donation');
    setHasDonationDraft(false);

    // Update campaign collected amount if matching
    const updatedCamp = campaigns.map(c => {
      if (c.title === newFund) {
        return {
          ...c,
          collectedAmount: c.collectedAmount + amt,
          donorsCount: c.donorsCount + 1
        };
      }
      return c;
    });
    saveCampaigns(updatedCamp);

    setShowAddModal(false);
    setNewDonorName('');
    setNewAmount('');
    setNewPan('');
  };

  // Create New Campaign Action
  const handleAddCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampTitle || !newCampTarget) return;

    const newCamp: CampaignGoal = {
      id: `camp-${Date.now()}`,
      title: newCampTitle,
      category: newCampCategory,
      targetAmount: parseFloat(newCampTarget),
      collectedAmount: 0,
      donorsCount: 0,
      status: 'Active',
      description: newCampDesc || undefined
    };

    saveCampaigns([...campaigns, newCamp]);
    setShowCampaignModal(false);
    setNewCampTitle('');
    setNewCampTarget('');
    setNewCampDesc('');
  };

  // Filtered dataset for customizable reports (Months, Years, Causes, Modes, Custom Dates)
  const customReportList = useMemo(() => {
    return transactions.filter(t => {
      // Cause filter
      if (reportSelectedCause !== 'ALL' && t.fundCategory !== reportSelectedCause) return false;
      // Mode filter
      if (reportSelectedMode !== 'ALL' && t.paymentMode !== reportSelectedMode) return false;

      // Timeframe / Date filter
      const txDate = new Date(t.date);
      if (reportPeriodType === 'MONTH') {
        if (txDate.getMonth() + 1 !== reportSelectedMonth || txDate.getFullYear() !== reportSelectedYear) {
          return false;
        }
      } else if (reportPeriodType === 'YEAR') {
        if (txDate.getFullYear() !== reportSelectedYear) {
          return false;
        }
      } else if (reportPeriodType === 'CUSTOM') {
        if (reportCustomFrom) {
          const from = new Date(reportCustomFrom);
          from.setHours(0, 0, 0, 0);
          if (txDate < from) return false;
        }
        if (reportCustomTo) {
          const to = new Date(reportCustomTo);
          to.setHours(23, 59, 59, 999);
          if (txDate > to) return false;
        }
      }
      return true;
    });
  }, [transactions, reportPeriodType, reportSelectedMonth, reportSelectedYear, reportSelectedCause, reportSelectedMode, reportCustomFrom, reportCustomTo]);

  const customReportMetrics = useMemo(() => {
    const total = customReportList.reduce((acc, t) => acc + (t.status === 'Verified' ? t.amount : 0), 0);
    const count = customReportList.filter(t => t.status === 'Verified').length;
    const uniqueDonors = new Set(customReportList.map(t => (t.donorPhone || t.donorEmail || t.donorName).toLowerCase())).size;
    const avgGift = count > 0 ? Math.round(total / count) : 0;
    return { total, count, uniqueDonors, avgGift };
  }, [customReportList]);

  // Comprehensive Excel Workbook Export (.xlsx / XML Format)
  const handleExportExcel = () => {
    const periodLabel = reportPeriodType === 'MONTH' 
      ? `${new Date(0, reportSelectedMonth - 1).toLocaleString('en-IN', { month: 'long' })} ${reportSelectedYear}`
      : (reportPeriodType === 'YEAR' ? `Year ${reportSelectedYear}` : (reportPeriodType === 'CUSTOM' ? `${reportCustomFrom || 'Start'} to ${reportCustomTo || 'End'}` : 'All Time'));

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8"/>
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Donation Ledger</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
          body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; }
          .inst-header { font-size: 16pt; font-weight: bold; color: #0369a1; text-align: left; }
          .inst-sub { font-size: 11pt; color: #475569; }
          .meta-box { font-size: 10pt; font-weight: bold; background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px; }
          .kpi-title { font-size: 9pt; color: #64748b; font-weight: bold; }
          .kpi-val { font-size: 14pt; color: #0369a1; font-weight: 900; }
          .th-cell { background-color: #0284c7; color: #ffffff; font-weight: bold; border: 1px solid #0369a1; padding: 8px; font-size: 10pt; }
          .td-cell { border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 9.5pt; vertical-align: middle; }
          .td-amount { border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 10pt; font-weight: bold; color: #0284c7; text-align: right; }
          .total-row { background-color: #e0f2fe; font-weight: bold; border-top: 2px solid #0284c7; border-bottom: 2px solid #0284c7; font-size: 10.5pt; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="10" class="inst-header">BHARAT SHIKSHAN SANSTHA'S SHRI SAI PRIVATE ITI</td></tr>
          <tr><td colspan="10" class="inst-sub">Official Donation & Financial Contribution Register</td></tr>
          <tr><td colspan="10"><b>Report Period:</b> ${periodLabel} &nbsp;|&nbsp; <b>Applied Cause:</b> ${reportSelectedCause} &nbsp;|&nbsp; <b>Payment Mode:</b> ${reportSelectedMode} &nbsp;|&nbsp; <b>Exported On:</b> ${new Date().toLocaleString('en-IN')}</td></tr>
          <tr><td colspan="10"></td></tr>
          <tr>
            <td colspan="2" class="meta-box"><span class="kpi-title">TOTAL AMOUNT</span><br/><span class="kpi-val">₹${customReportMetrics.total.toLocaleString('en-IN')}</span></td>
            <td colspan="2" class="meta-box"><span class="kpi-title">TOTAL RECEIPTS</span><br/><span class="kpi-val">${customReportMetrics.count}</span></td>
            <td colspan="2" class="meta-box"><span class="kpi-title">UNIQUE DONORS</span><br/><span class="kpi-val">${customReportMetrics.uniqueDonors}</span></td>
            <td colspan="2" class="meta-box"><span class="kpi-title">AVERAGE DONATION</span><br/><span class="kpi-val">₹${customReportMetrics.avgGift.toLocaleString('en-IN')}</span></td>
            <td colspan="2"></td>
          </tr>
          <tr><td colspan="10"></td></tr>
          <thead>
            <tr>
              <th class="th-cell">Sr No</th>
              <th class="th-cell">Receipt No</th>
              <th class="th-cell">Date & Time</th>
              <th class="th-cell">Donor Full Name</th>
              <th class="th-cell">Email Address</th>
              <th class="th-cell">Phone Number</th>
              <th class="th-cell">PAN / ID</th>
              <th class="th-cell">Fund Cause</th>
              <th class="th-cell">Payment Mode</th>
              <th class="th-cell" style="text-align: right;">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            ${customReportList.map((t, idx) => `
              <tr>
                <td class="td-cell" style="text-align: center;">${idx + 1}</td>
                <td class="td-cell" style="font-family: monospace; font-weight: bold;">${t.receiptNo}</td>
                <td class="td-cell">${t.date}</td>
                <td class="td-cell"><b>${t.donorName}</b></td>
                <td class="td-cell">${t.donorEmail || '—'}</td>
                <td class="td-cell">${t.donorPhone || '—'}</td>
                <td class="td-cell" style="font-family: monospace;">${t.panNumber}</td>
                <td class="td-cell">${t.fundCategory}</td>
                <td class="td-cell">${t.paymentMode}</td>
                <td class="td-amount">₹${t.amount.toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="9" class="td-cell" style="text-align: right; font-weight: 900;">GRAND TOTAL COLLECTION:</td>
              <td class="td-amount" style="font-size: 11pt; color: #0369a1;">₹${customReportMetrics.total.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BSS_Donation_Report_${reportPeriodType.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // CSV Export Action (Filtered by Custom Report View)
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,Receipt No,Donor Name,Email,Phone,PAN / ID Number,Fund Cause,Amount (INR),Payment Mode,Date,Status\n';
    customReportList.forEach(t => {
      csvContent += `"${t.receiptNo}","${t.donorName}","${t.donorEmail}","${t.donorPhone}","${t.panNumber}","${t.fundCategory}",${t.amount},"${t.paymentMode}","${t.date}","${t.status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BSS_Donations_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Consolidated Annual Summary Report Export Action
  const handleExportAnnualSummary = () => {
    let csvContent = 'data:text/csv;charset=utf-8,Sr No,Receipt No,Donor Name,Email,Phone,Fund Cause,Payment Mode,Amount (INR),Date\n';
    customReportList.filter(t => t.status === 'Verified').forEach((t, index) => {
      csvContent += `${index + 1},"${t.receiptNo}","${t.donorName}","${t.donorEmail}","${t.donorPhone}","${t.fundCategory}","${t.paymentMode}",${t.amount},"${t.date}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BSS_Annual_Donations_Summary_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Official Income Tax Form 10BD E-Filing Statement Generator (Rule 18AB)
  const handleExportForm10BD = () => {
    let csvContent = 'Sr No,Unique Identification Type,Unique Identification Number,Section Code,Unique Regn Number (URN),Date of Issuance of URN,Name of Donor,Address of Donor,Donation Type,Mode of Receipt,Amount (INR)\n';
    customReportList.filter(t => t.status === 'Verified').forEach((t, index) => {
      const idType = (t.panNumber && t.panNumber.length === 10 && t.panNumber !== 'NOT_PROVIDED') 
        ? 'Permanent Account Number (PAN)' 
        : 'Aadhaar Number / Other Gov ID';
      const idNum = t.panNumber && t.panNumber !== 'NOT_PROVIDED' ? t.panNumber : 'NOT_AVAILABLE';
      csvContent += `${index + 1},"${idType}","${idNum}","Section 80G","AAATB1234FE20214","28-05-2021","${t.donorName}","Bhadrawati, Dist. Chandrapur, Maharashtra","Specific Grant / Others","${t.paymentMode}",${t.amount}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BSS_Form10BD_IncomeTax_Filing_${reportPeriodType === 'YEAR' ? reportSelectedYear : new Date().getFullYear()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="layout">
      <Sidebar />

      <div className="main-content" style={{ paddingBottom: '40px', overflowX: 'hidden' }}>
        
        {/* Standard ERP Header */}
        <header className="header">
          <div>
            <div className="header-subtitle" style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
              Bharat Shikshan Sanstha • Shri Sai I.T.I
            </div>
            <div className="header-title" style={{ marginTop: '4px', fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🤝</span>
              <span>
                {activeTab === 'dashboard' && 'Donation Dashboard'}
                {activeTab === 'transactions' && 'Donation Receipts & Ledger'}
                {activeTab === 'campaigns' && 'Fundraising Campaigns'}
                {activeTab === 'donors' && 'Donor Directory'}
                {activeTab === 'reports' && 'Donation Reports & Summary'}
              </span>
            </div>
          </div>

          <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
              style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
            >
              <span>➕ Record Offline Donation</span>
            </button>
            {activeTab === 'campaigns' && (
              <button
                onClick={() => setShowCampaignModal(true)}
                className="btn btn-secondary"
                style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
              >
                <span>🎯 New Campaign</span>
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content" style={{ flex: 1, padding: '24px 28px', width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>

          {/* ═══════════════════════════════════════════════════════════════
              TAB 1: DASHBOARD OVERVIEW
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'dashboard' && (
            <>
              {/* Stat Cards Row */}
              <div className="grid grid-4" style={{ gap: 16, marginBottom: 24 }}>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: 'var(--primary)' }}>
                    <span style={{ fontSize: 24 }}>💰</span>
                  </div>
                  <div>
                    <div className="stat-label">Total Donations Received</div>
                    <div className="stat-value" style={{ color: 'var(--primary)' }}>
                      ₹{stats.totalCollected.toLocaleString('en-IN')}
                    </div>
                    <div className="stat-change up">▲ Across All Channels</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                    <span style={{ fontSize: 24 }}>🧾</span>
                  </div>
                  <div>
                    <div className="stat-label">Total Receipts Issued</div>
                    <div className="stat-value">{stats.totalVerifiedReceipts} Verified</div>
                    <div className="stat-change up">● Verified Donations</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent)' }}>
                    <span style={{ fontSize: 24 }}>👥</span>
                  </div>
                  <div>
                    <div className="stat-label">Registered Donors</div>
                    <div className="stat-value">{stats.totalDonors} Supporters</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Alumni, Trusts & Supporters</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                    <span style={{ fontSize: 24 }}>🎯</span>
                  </div>
                  <div>
                    <div className="stat-label">Active Campaigns</div>
                    <div className="stat-value" style={{ color: '#3b82f6' }}>{stats.activeCauses} Causes</div>
                    <div className="stat-change up">● ₹{stats.totalCampaignRaised.toLocaleString('en-IN')} Raised</div>
                  </div>
                </div>
              </div>

              {/* Campaign Progress Highlights */}
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="card-title">🎯 Campaign Target Progress</div>
                  <button onClick={() => router.push('/donation-admin/campaigns')} className="btn btn-ghost btn-sm" style={{ fontWeight: 700 }}>
                    Manage Campaigns &rarr;
                  </button>
                </div>
                <div className="card-body">
                  <div className="grid grid-2" style={{ gap: 20 }}>
                    {campaigns.map(camp => {
                      const pct = Math.min(100, Math.round((camp.collectedAmount / camp.targetAmount) * 100));
                      return (
                        <div key={camp.id} style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                            <span>{camp.title}</span>
                            <span style={{ color: 'var(--primary)' }}>{pct}%</span>
                          </div>

                          <div style={{ height: '8px', width: '100%', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '999px', overflow: 'hidden', marginBottom: '10px' }}>
                            <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--primary)', borderRadius: '999px' }} />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <span>Raised: ₹{camp.collectedAmount.toLocaleString('en-IN')}</span>
                            <span>Target: ₹{camp.targetAmount.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recent Verified Donations */}
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="card-title">🧾 Recent Donations</div>
                  <button onClick={() => router.push('/donation-admin/transactions')} className="btn btn-ghost btn-sm" style={{ fontWeight: 700 }}>
                    View All Receipts &rarr;
                  </button>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  <div className="table-wrap">
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                      <thead>
                        <tr>
                          <th>Receipt No</th>
                          <th>Donor Details</th>
                          <th>PAN / ID</th>
                          <th>Fund Cause</th>
                          <th>Amount</th>
                          <th>Payment Mode</th>
                          <th>Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.slice(0, 5).map(t => (
                          <tr key={t.id}>
                            <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{t.receiptNo}</td>
                            <td>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.donorName}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.donorEmail} • {t.donorPhone}</div>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{t.panNumber}</td>
                            <td>{t.fundCategory}</td>
                            <td style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{t.amount.toLocaleString('en-IN')}</td>
                            <td>
                              <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700, background: t.paymentMode === 'Razorpay' ? 'rgba(59, 130, 246, 0.14)' : 'rgba(16, 185, 129, 0.14)', color: t.paymentMode === 'Razorpay' ? '#3b82f6' : '#10b981' }}>
                                {t.paymentMode}
                              </span>
                            </td>
                            <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{t.date}</td>
                            <td>
                              <button
                                onClick={() => setSelectedReceipt(t)}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '12px', fontWeight: 700 }}
                              >
                                📄 View Receipt
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              TAB 2: TRANSACTIONS & DONATION RECEIPTS LEDGER
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'transactions' && (
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div className="card-title">🧾 Complete Donations Ledger</div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Search by Donor, ID, Receipt..."
                    className="form-control"
                    style={{ width: '240px', padding: '6px 12px', fontSize: '13px' }}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <select
                    className="form-control"
                    style={{ width: '160px', padding: '6px 12px', fontSize: '13px' }}
                    value={filterMode}
                    onChange={e => setFilterMode(e.target.value)}
                  >
                    <option value="ALL">All Payment Modes</option>
                    <option value="Razorpay">Razorpay Online</option>
                    <option value="UPI">UPI Payment</option>
                    <option value="Direct Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="Cash / Cheque">Cash / Cheque</option>
                  </select>
                  <button onClick={handleExportCSV} className="btn btn-secondary btn-sm" style={{ fontWeight: 700 }}>
                    📥 Export CSV
                  </button>
                </div>
              </div>

              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-wrap">
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                    <thead>
                      <tr>
                        <th>Receipt No</th>
                        <th>Donor Details</th>
                        <th>PAN / ID Number</th>
                        <th>Fund Cause</th>
                        <th>Amount</th>
                        <th>Payment Mode</th>
                        <th>Txn ID</th>
                        <th>Date & Time</th>
                        <th>Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map(t => (
                        <tr key={t.id}>
                          <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{t.receiptNo}</td>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.donorName}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.donorEmail} • {t.donorPhone}</div>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{t.panNumber}</td>
                          <td>{t.fundCategory}</td>
                          <td style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{t.amount.toLocaleString('en-IN')}</td>
                          <td>
                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700, background: t.paymentMode === 'Razorpay' ? 'rgba(59, 130, 246, 0.14)' : 'rgba(16, 185, 129, 0.14)', color: t.paymentMode === 'Razorpay' ? '#3b82f6' : '#10b981' }}>
                              {t.paymentMode}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{t.transactionId}</td>
                          <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{t.date}</td>
                          <td>
                            <button
                              onClick={() => setSelectedReceipt(t)}
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '12px', fontWeight: 700 }}
                            >
                              📄 Print Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              TAB 3: CAMPAIGNS MANAGER
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'campaigns' && (
            <div className="grid grid-2" style={{ gap: 24 }}>
              {campaigns.map(camp => {
                const pct = Math.min(100, Math.round((camp.collectedAmount / camp.targetAmount) * 100));
                return (
                  <div key={camp.id} className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', background: 'rgba(14, 165, 233, 0.12)', padding: '4px 10px', borderRadius: '20px' }}>
                          {camp.category}
                        </span>
                        <h3 style={{ margin: '8px 0 4px 0', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{camp.title}</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                          {camp.description || 'Targeted educational infrastructure and scholarship fund.'}
                        </p>
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary)' }}>
                        {pct}%
                      </div>
                    </div>

                    <div style={{ height: '10px', width: '100%', backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: '999px', overflow: 'hidden', margin: '16px 0' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--primary)', borderRadius: '999px' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>COLLECTED</div>
                        <div>₹{camp.collectedAmount.toLocaleString('en-IN')}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>TARGET</div>
                        <div>₹{camp.targetAmount.toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>👥 {camp.donorsCount} Active Donors</span>
                      <button
                        onClick={() => {
                          setNewFund(camp.title);
                          setShowAddModal(true);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontWeight: 700 }}
                      >
                        ➕ Add Contribution
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              TAB 4: DONOR DIRECTORY
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'donors' && (
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div className="card-title">👥 Registered Donor Profiles ({donorProfiles.length})</div>
                <input
                  type="text"
                  placeholder="Search Donors by Name, Phone, Email, PAN..."
                  className="form-control"
                  style={{ width: '280px', padding: '6px 12px', fontSize: '13px' }}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-wrap">
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                    <thead>
                      <tr>
                        <th>Donor Name</th>
                        <th>Contact Info</th>
                        <th>PAN Number</th>
                        <th>Total Contributions</th>
                        <th>Donations Count</th>
                        <th>Last Donated</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDonors.map(d => (
                        <tr key={d.id}>
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{d.name}</td>
                          <td>
                            <div>{d.email}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{d.phone}</div>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{d.panNumber}</td>
                          <td style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{d.totalDonated.toLocaleString('en-IN')}</td>
                          <td>
                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700, background: 'rgba(14, 165, 233, 0.12)', color: 'var(--primary)' }}>
                              {d.donationsCount} receipts
                            </span>
                          </td>
                          <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{d.lastDonationDate}</td>
                          <td>
                            <button
                              onClick={() => setSelectedDonorHistory(d)}
                              className="btn btn-primary btn-sm"
                              style={{ fontWeight: 700, fontSize: '12px', padding: '6px 14px', borderRadius: '8px' }}
                            >
                              📜 View History &rarr;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              TAB 5: CUSTOMIZABLE DONATION REPORTS & EXTRACTION SUITE
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Report Configuration & Filter Bar */}
              <div className="card" style={{ padding: '20px', background: 'var(--surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>⚙️</span>
                      <span>Customize Report Parameters</span>
                    </h3>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                      Filter by specific financial years, calendar months, custom date ranges, or specific fund causes
                    </div>
                  </div>

                  {/* Period Type Switcher */}
                  <div style={{ display: 'flex', gap: '6px', background: 'var(--surface-2)', padding: '4px', borderRadius: '8px' }}>
                    {[
                      { id: 'ALL', label: 'All Time' },
                      { id: 'MONTH', label: 'By Month' },
                      { id: 'YEAR', label: 'By Year' },
                      { id: 'CUSTOM', label: 'Custom Range' },
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setReportPeriodType(p.id as any)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: reportPeriodType === p.id ? 700 : 500,
                          background: reportPeriodType === p.id ? 'var(--primary)' : 'transparent',
                          color: reportPeriodType === p.id ? '#ffffff' : 'var(--text-primary)',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Inputs Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
                  
                  {reportPeriodType === 'MONTH' && (
                    <>
                      <div>
                        <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700 }}>Select Month</label>
                        <select
                          className="form-control"
                          value={reportSelectedMonth}
                          onChange={(e) => setReportSelectedMonth(parseInt(e.target.value))}
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {new Date(0, i).toLocaleString('en-IN', { month: 'long' })}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700 }}>Select Year</label>
                        <select
                          className="form-control"
                          value={reportSelectedYear}
                          onChange={(e) => setReportSelectedYear(parseInt(e.target.value))}
                        >
                          {[2024, 2025, 2026, 2027].map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {reportPeriodType === 'YEAR' && (
                    <div>
                      <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700 }}>Select Calendar / Financial Year</label>
                      <select
                        className="form-control"
                        value={reportSelectedYear}
                        onChange={(e) => setReportSelectedYear(parseInt(e.target.value))}
                      >
                        {[2024, 2025, 2026, 2027].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {reportPeriodType === 'CUSTOM' && (
                    <>
                      <div>
                        <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700 }}>From Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={reportCustomFrom}
                          onChange={(e) => setReportCustomFrom(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700 }}>To Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={reportCustomTo}
                          onChange={(e) => setReportCustomTo(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700 }}>Fund Cause</label>
                    <select
                      className="form-control"
                      value={reportSelectedCause}
                      onChange={(e) => setReportSelectedCause(e.target.value)}
                    >
                      <option value="ALL">All Fund Causes</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.title}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700 }}>Payment Method</label>
                    <select
                      className="form-control"
                      value={reportSelectedMode}
                      onChange={(e) => setReportSelectedMode(e.target.value)}
                    >
                      <option value="ALL">All Payment Methods</option>
                      <option value="Razorpay">Razorpay Online</option>
                      <option value="UPI">UPI Direct</option>
                      <option value="Direct Bank Transfer">Direct Bank Transfer</option>
                      <option value="Cash / Cheque">Cash / Cheque</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* Dynamic KPI Summary Row */}
              <div className="grid grid-4" style={{ gap: '16px' }}>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: 'var(--primary)' }}>
                    <span style={{ fontSize: '22px' }}>💰</span>
                  </div>
                  <div>
                    <div className="stat-label">Total Amount Collected</div>
                    <div className="stat-value" style={{ color: 'var(--primary)' }}>
                      ₹{customReportMetrics.total.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                    <span style={{ fontSize: '22px' }}>🧾</span>
                  </div>
                  <div>
                    <div className="stat-label">Verified Receipts</div>
                    <div className="stat-value">
                      {customReportMetrics.count}
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                    <span style={{ fontSize: '22px' }}>👥</span>
                  </div>
                  <div>
                    <div className="stat-label">Unique Donors</div>
                    <div className="stat-value">
                      {customReportMetrics.uniqueDonors}
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                    <span style={{ fontSize: '22px' }}>📊</span>
                  </div>
                  <div>
                    <div className="stat-label">Average Gift / Donation</div>
                    <div className="stat-value">
                      ₹{customReportMetrics.avgGift.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comprehensive Export Actions Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: 'var(--surface-2)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Export Comprehensive Reports
                  </h4>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Download formatted Excel spreadsheets, printable PDF audit documents, or CSV ledger data
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleExportExcel}
                    className="btn btn-primary"
                    style={{ background: '#059669', borderColor: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="Download formatted Excel workbook with headers and summary totals"
                  >
                    <span>📊</span>
                    <span>Comprehensive Excel (.xlsx)</span>
                  </button>

                  <button
                    onClick={() => setShowPrintablePdfModal(true)}
                    className="btn btn-primary"
                    style={{ background: '#0284c7', borderColor: '#0284c7', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="Open printable institutional PDF report"
                  >
                    <span>📄</span>
                    <span>Printable PDF Report</span>
                  </button>

                  <button
                    onClick={handleExportForm10BD}
                    className="btn btn-primary"
                    style={{ background: '#7c3aed', borderColor: '#7c3aed', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="Export Form 10BD CSV for Income Tax Portal E-Filing under Rule 18AB"
                  >
                    <span>📑</span>
                    <span>Form 10BD E-Filing CSV</span>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="btn btn-secondary"
                    style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="Download raw CSV ledger"
                  >
                    <span>📥</span>
                    <span>CSV Ledger</span>
                  </button>
                </div>
              </div>

              {/* Live Preview Table */}
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="card-title" style={{ fontSize: '15px', fontWeight: 800 }}>
                    📋 Filtered Records Preview ({customReportList.length} {customReportList.length === 1 ? 'record' : 'records'})
                  </div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {customReportList.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No donation records match the selected month, year, or filter criteria.
                    </div>
                  ) : (
                    <div className="table-wrap" style={{ border: 'none', maxHeight: '420px', overflowY: 'auto' }}>
                      <table className="table" style={{ width: '100%', fontSize: '13px' }}>
                        <thead>
                          <tr>
                            <th>Sr</th>
                            <th>Receipt No</th>
                            <th>Date & Time</th>
                            <th>Donor Name</th>
                            <th>PAN / ID</th>
                            <th>Fund Cause</th>
                            <th>Payment Mode</th>
                            <th>Amount</th>
                            <th>Receipt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customReportList.map((t, idx) => (
                            <tr key={t.id}>
                              <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{idx + 1}</td>
                              <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>{t.receiptNo}</td>
                              <td style={{ color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>{t.date}</td>
                              <td style={{ fontWeight: 700 }}>{t.donorName}</td>
                              <td style={{ fontFamily: 'monospace' }}>{t.panNumber}</td>
                              <td style={{ fontWeight: 600 }}>{t.fundCategory}</td>
                              <td>
                                <span style={{ fontSize: '11.5px', padding: '3px 8px', borderRadius: '6px', background: 'var(--surface-2)', fontWeight: 600 }}>
                                  {t.paymentMode}
                                </span>
                              </td>
                              <td style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{t.amount.toLocaleString('en-IN')}</td>
                              <td>
                                <button
                                  onClick={() => setSelectedReceipt(t)}
                                  className="btn btn-ghost btn-sm"
                                  style={{ padding: '3px 8px', fontSize: '11.5px', fontWeight: 700, color: 'var(--primary)' }}
                                >
                                  🖨️ View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
        
        <Footer />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 1: RECORD OFFLINE DONATION
         ═══════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: '540px', width: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div className="modal-title">➕ Record Offline Donation</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddDonation} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <AutoRecoverBanner
                show={hasDonationDraft}
                savedAt={donationDraftTime}
                onRestore={handleRestoreDonationDraft}
                onDiscard={handleDiscardDonationDraft}
              />

              <div>
                <label className="form-label">Donor Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Rushikesh Pattiwar"
                  value={newDonorName}
                  onChange={(e) => setNewDonorName(e.target.value)}
                />
              </div>

              <div className="grid grid-2" style={{ gap: '12px' }}>
                <div>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={newDonorEmail}
                    onChange={(e) => setNewDonorEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newDonorPhone}
                    onChange={(e) => setNewDonorPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-2" style={{ gap: '12px' }}>
                <div>
                  <label className="form-label">PAN / ID Number (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. ABCDE1234F"
                    value={newPan}
                    onChange={(e) => setNewPan(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    className="form-control"
                    placeholder="e.g. 5000"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    style={{ fontWeight: 700 }}
                  />
                </div>
              </div>

              <div className="grid grid-2" style={{ gap: '12px' }}>
                <div>
                  <label className="form-label">Fund Cause</label>
                  <select
                    className="form-control"
                    value={newFund}
                    onChange={(e) => setNewFund(e.target.value)}
                  >
                    {campaigns.map(c => (
                      <option key={c.id} value={c.title}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Payment Mode</label>
                  <select
                    className="form-control"
                    value={newPaymentMode}
                    onChange={(e) => setNewPaymentMode(e.target.value as any)}
                  >
                    <option value="Cash / Cheque">Cash / Cheque</option>
                    <option value="Direct Bank Transfer">Direct Bank Transfer</option>
                    <option value="UPI">UPI Transfer</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: 0, marginTop: 12 }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 2: CREATE NEW CAMPAIGN
         ═══════════════════════════════════════════════════════════════ */}
      {showCampaignModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: '500px', width: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div className="modal-title">🎯 Launch New Fundraising Campaign</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCampaignModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddCampaign} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Campaign Cause Title *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Solar Energy Workshop Setup"
                  value={newCampTitle}
                  onChange={(e) => setNewCampTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-2" style={{ gap: '12px' }}>
                <div>
                  <label className="form-label">Category</label>
                  <select
                    className="form-control"
                    value={newCampCategory}
                    onChange={(e) => setNewCampCategory(e.target.value)}
                  >
                    <option value="Scholarships">Scholarships</option>
                    <option value="Machinery">Machinery & Workshop</option>
                    <option value="IT & Software">IT & Software</option>
                    <option value="Books">Library & Books</option>
                    <option value="Infrastructure">Infrastructure</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Target Goal (₹) *</label>
                  <input
                    type="number"
                    required
                    className="form-control"
                    placeholder="e.g. 500000"
                    value={newCampTarget}
                    onChange={(e) => setNewCampTarget(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Campaign Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Details of the fundraising initiative..."
                  value={newCampDesc}
                  onChange={(e) => setNewCampDesc(e.target.value)}
                />
              </div>

              <div className="modal-footer" style={{ padding: 0, marginTop: 12 }}>
                <button type="button" onClick={() => setShowCampaignModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 3: OFFICIAL SECTION 80G TAX RECEIPT CERTIFICATE VIEWER
         ═══════════════════════════════════════════════════════════════ */}
      {selectedReceipt && (
        <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={() => setSelectedReceipt(null)}>
          <div className="modal" style={{ maxWidth: '660px', width: '90vw', maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', color: '#0b1f33', padding: 0 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ borderBottom: '2px solid #0284c7', padding: '24px 28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#0369a1', letterSpacing: '1px' }}>
                  BHARAT SHIKSHAN SANSTHA'S
                </div>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 900, color: '#0b1f33' }}>
                  Shri Sai Private Industrial Training Institute
                </h3>
                <div style={{ fontSize: '11px', color: '#475467', marginTop: '2px' }}>
                  Jain Mandir Road, Bhadrawati, Dist. Chandrapur - 442902 • Reg. Educational Trust
                </div>
                <div style={{ fontSize: '10.5px', color: '#0369a1', fontWeight: 700, marginTop: '3px' }}>
                  80G URN: AAATB1234FE20214 • Form 10BD Compliant
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ background: '#0284c7', color: '#ffffff', fontSize: '10.5px', fontWeight: 900, padding: '4px 10px', borderRadius: '4px', display: 'inline-block' }}>
                  SECTION 80G RECEIPT
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '6px', fontFamily: 'monospace' }}>
                  {selectedReceipt.receiptNo}
                </div>
              </div>
            </div>

            <div style={{ padding: '24px 28px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '18px', fontSize: '12.5px', lineHeight: 1.6 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                  <div><strong>Donor Name:</strong> {selectedReceipt.donorName}</div>
                  <div><strong>Donor PAN:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>{selectedReceipt.panNumber}</span></div>
                  <div><strong>Email:</strong> {selectedReceipt.donorEmail}</div>
                  <div><strong>Phone:</strong> {selectedReceipt.donorPhone}</div>
                  <div><strong>Payment Mode:</strong> {selectedReceipt.paymentMode}</div>
                  <div><strong>Transaction Ref:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedReceipt.transactionId}</span></div>
                  <div style={{ gridColumn: '1 / -1' }}><strong>Date & Time:</strong> {selectedReceipt.date}</div>
                </div>
              </div>

              <div style={{ background: 'rgba(2, 132, 199, 0.08)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(2, 132, 199, 0.25)', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>Donation Purpose / Cause</div>
                  <div style={{ fontSize: '15px', fontWeight: 800 }}>{selectedReceipt.fundCategory}</div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#0284c7' }}>
                  ₹{selectedReceipt.amount.toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '6px', fontSize: '11px', color: '#166534', lineHeight: 1.5, marginBottom: '24px' }}>
                <strong>✓ Statutory Tax Exemption Certificate:</strong> Certified that this contribution is eligible for 50% income tax deduction under Section 80G(5)(vi) of the Income Tax Act, 1961. This donation is electronically filed in annual Form 10BD for seamless deduction in your ITR.
              </div>

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '11.5px', marginBottom: '20px', borderTop: '1px dashed #cbd5e1', paddingTop: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: '30px' }} />
                  <div style={{ borderTop: '1px solid #64748b', width: '140px', paddingTop: '4px', fontWeight: 700 }}>
                    Accountant
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: '30px' }} />
                  <div style={{ borderTop: '1px solid #64748b', width: '160px', paddingTop: '4px', fontWeight: 700 }}>
                    Principal / Authorized Trustee
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => setSelectedReceipt(null)} className="btn btn-secondary">
                  Close
                </button>
                <button onClick={() => window.print()} className="btn btn-primary" style={{ background: '#0284c7', borderColor: '#0284c7', fontWeight: 800 }}>
                  🖨️ Print 80G Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 4: DONOR CONTRIBUTION HISTORY & RECEIPT TIMELINE
         ═══════════════════════════════════════════════════════════════ */}
      {selectedDonorHistory && (
        <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={() => setSelectedDonorHistory(null)}>
          <div className="modal" style={{ maxWidth: '800px', width: '92vw', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px', height: '46px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, #0284c7 100%)',
                  color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', fontWeight: 900, flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)'
                }}>
                  {selectedDonorHistory.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="modal-title" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedDonorHistory.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Lifetime Contribution History & Receipts
                  </div>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedDonorHistory(null)}>✕</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 0' }}>
              {/* Donor Summary KPI Grid */}
              <div style={{
                background: 'var(--surface-2)',
                borderRadius: '12px',
                padding: '16px 20px',
                border: '1px solid var(--border)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.5px' }}>
                    Email Address
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                    {selectedDonorHistory.email || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.5px' }}>
                    Phone Number
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selectedDonorHistory.phone || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.5px' }}>
                    PAN / ID Number
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)' }}>
                    {selectedDonorHistory.panNumber || 'NOT_PROVIDED'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.5px' }}>
                    Total Contributions
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--primary)' }}>
                    ₹{selectedDonorHistory.totalDonated.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Individual Transactions Ledger */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    📜 Contribution Timeline ({donorTransactions.length} {donorTransactions.length === 1 ? 'receipt' : 'receipts'})
                  </h4>
                  <button
                    onClick={() => {
                      const donorName = selectedDonorHistory.name;
                      setSelectedDonorHistory(null);
                      setSearchQuery(donorName);
                      router.push(`/donation-admin/transactions?search=${encodeURIComponent(donorName)}`);
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}
                  >
                    View in Main Ledger &rarr;
                  </button>
                </div>

                {donorTransactions.length === 0 ? (
                  <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface-2)', borderRadius: '8px' }}>
                    No donation records found for this donor profile.
                  </div>
                ) : (
                  <div className="table-wrap" style={{ maxHeight: '340px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <table className="table" style={{ width: '100%', fontSize: '13px', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Receipt No</th>
                          <th>Cause / Purpose</th>
                          <th>Payment Mode</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donorTransactions.map(tx => (
                          <tr key={tx.id}>
                            <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '12px' }}>
                              {tx.date}
                            </td>
                            <td style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                              {tx.receiptNo}
                            </td>
                            <td style={{ fontWeight: 600 }}>
                              {tx.fundCategory}
                            </td>
                            <td>
                              <span style={{ fontSize: '11.5px', padding: '3px 8px', borderRadius: '6px', background: 'var(--surface-2)', fontWeight: 600 }}>
                                {tx.paymentMode}
                              </span>
                            </td>
                            <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                              ₹{tx.amount.toLocaleString('en-IN')}
                            </td>
                            <td>
                              <span style={{ color: '#059669', fontWeight: 700, fontSize: '11.5px', background: 'rgba(5, 150, 105, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                                ✓ Verified
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => setSelectedReceipt(tx)}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '4px 8px', fontSize: '11.5px', fontWeight: 700, color: 'var(--primary)' }}
                                title="Print or preview donation receipt"
                              >
                                🖨️ Print
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '16px 0 0 0', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setSelectedDonorHistory(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 5: OFFICIAL PRINTABLE AUDIT & PDF REPORT
         ═══════════════════════════════════════════════════════════════ */}
      {showPrintablePdfModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={() => setShowPrintablePdfModal(false)}>
          <div className="modal" style={{ maxWidth: '840px', width: '92vw', maxHeight: '92vh', overflowY: 'auto', background: '#ffffff', color: '#0b1f33', padding: 0 }} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Actions Bar (Not for printing) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', background: '#0f172a', color: '#ffffff' }}>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>
                📄 Official Institutional Report Preview
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => window.print()}
                  className="btn btn-primary btn-sm"
                  style={{ background: '#0284c7', borderColor: '#0284c7', fontWeight: 800, padding: '6px 16px' }}
                >
                  🖨️ Print / Save as PDF
                </button>
                <button
                  onClick={() => setShowPrintablePdfModal(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#ffffff', background: 'rgba(255,255,255,0.15)', border: 'none' }}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Printable Report Document Body */}
            <div style={{ padding: '32px 36px' }}>
              
              {/* Institutional Letterhead */}
              <div style={{ borderBottom: '2px solid #0284c7', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#0369a1', letterSpacing: '1px' }}>
                    BHARAT SHIKSHAN SANSTHA'S
                  </div>
                  <h2 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 900, color: '#0b1f33' }}>
                    Shri Sai Private Industrial Training Institute
                  </h2>
                  <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '3px' }}>
                    Jain Mandir Road, Bhadrawati, Dist. Chandrapur - 442902, Maharashtra • Regd. Trust
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ background: '#0284c7', color: '#ffffff', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '4px', display: 'inline-block' }}>
                    DONATION & FINANCIAL REPORT
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                    Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Report Scope & Parameters */}
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', margin: '20px 0', fontSize: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <div>
                  <strong>Report Scope:</strong>{' '}
                  {reportPeriodType === 'MONTH' && `${new Date(0, reportSelectedMonth - 1).toLocaleString('en-IN', { month: 'long' })} ${reportSelectedYear}`}
                  {reportPeriodType === 'YEAR' && `Calendar Year ${reportSelectedYear}`}
                  {reportPeriodType === 'CUSTOM' && `${reportCustomFrom || 'Start'} to ${reportCustomTo || 'End'}`}
                  {reportPeriodType === 'ALL' && 'Complete Historical Register'}
                </div>
                <div><strong>Selected Cause:</strong> {reportSelectedCause === 'ALL' ? 'All Causes' : reportSelectedCause}</div>
                <div><strong>Payment Method:</strong> {reportSelectedMode === 'ALL' ? 'All Payment Modes' : reportSelectedMode}</div>
                <div><strong>Records Included:</strong> {customReportList.length} receipts</div>
              </div>

              {/* KPI Summary Block */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Total Collections</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#15803d', marginTop: '2px' }}>₹{customReportMetrics.total.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: '8px', border: '1px solid #bae6fd', textAlign: 'center' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>Total Receipts</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#0284c7', marginTop: '2px' }}>{customReportMetrics.count}</div>
                </div>
                <div style={{ background: '#faf5ff', padding: '12px', borderRadius: '8px', border: '1px solid #e9d5ff', textAlign: 'center' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#7e22ce', textTransform: 'uppercase' }}>Unique Donors</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#9333ea', marginTop: '2px' }}>{customReportMetrics.uniqueDonors}</div>
                </div>
                <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '8px', border: '1px solid #fde68a', textAlign: 'center' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>Average Gift</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#d97706', marginTop: '2px' }}>₹{customReportMetrics.avgGift.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Tabular Itemized Ledger */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', marginBottom: '28px' }}>
                <thead>
                  <tr style={{ background: '#0284c7', color: '#ffffff' }}>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #0284c7' }}>Sr</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #0284c7' }}>Receipt No</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #0284c7' }}>Date</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #0284c7' }}>Donor Name</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #0284c7' }}>Cause / Purpose</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #0284c7' }}>Mode</th>
                    <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #0284c7' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {customReportList.map((t, idx) => (
                    <tr key={t.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontWeight: 700 }}>{t.receiptNo}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{t.date.slice(0, 10)}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', fontWeight: 600 }}>{t.donorName}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0' }}>{t.fundCategory}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0' }}>{t.paymentMode}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 800, color: '#0369a1' }}>
                        ₹{t.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#e0f2fe', fontWeight: 900 }}>
                    <td colSpan={6} style={{ padding: '8px', textAlign: 'right', border: '1px solid #bae6fd', fontSize: '12px' }}>
                      GRAND TOTAL AMOUNT:
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #bae6fd', fontSize: '13px', color: '#0369a1' }}>
                      ₹{customReportMetrics.total.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Signatures & Certification Block */}
              <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '12px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: '40px' }} />
                  <div style={{ borderTop: '1px dashed #64748b', width: '160px', paddingTop: '4px', fontWeight: 700, color: '#334155' }}>
                    Prepared By (Accountant)
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: '40px' }} />
                  <div style={{ borderTop: '1px dashed #64748b', width: '160px', paddingTop: '4px', fontWeight: 700, color: '#334155' }}>
                    Audited By
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: '40px' }} />
                  <div style={{ borderTop: '1px dashed #64748b', width: '160px', paddingTop: '4px', fontWeight: 700, color: '#334155' }}>
                    Principal / Authorized Trustee
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
