
export enum UserRole {
  OWNER = 'OWNER',
  TENANT = 'TENANT'
}

export enum UnitStatus {
  VACANT = 'VACANT',
  OCCUPIED = 'OCCUPIED'
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED'
}

export enum BillType {
  ELECTRICITY = 'ELECTRICITY',
  WATER = 'WATER',
  INTERNET = 'INTERNET',
  GAS = 'GAS',
  MAINTENANCE = 'MAINTENANCE'
}

export interface Bill {
  id: string;
  type: BillType;
  amount: number;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  billingPeriod: string;
  paymentReference?: string;
  paidDate?: string;
}

export interface PortfolioPropertySummary {
  propertyId: string;
  name: string;
  address: string;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  pendingRentCount: number;
  openTicketsCount: number;
  renewalsDueSoonCount: number;
}

export interface PortfolioSummary {
  propertiesCount: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  pendingRentCount: number;
  openTicketsCount: number;
  renewalsDueSoonCount: number;
  properties: PortfolioPropertySummary[];
}

export interface UnitStatusSummary {
  unitId: string;
  unitName: string;
  occupancyStatus: 'OCCUPIED' | 'VACANT';
  rentStatus?: 'PAID' | 'PENDING';
  billsDueCount: number;
  openTicketsCount: number;
  renewalsDueSoon: number; // 0/1
  leaseEndDate?: string;
  rentDueDate?: string;
}

export interface PropertySummary {
  propertyId: string;
  name: string;
  address: string;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  pendingRentCount: number;
  openTicketsCount: number;
  renewalsDueSoonCount: number;
  units: UnitStatusSummary[];
}

export interface TenancySummary {
  unitId: string;
  unitName: string;
  propertyId?: string;
  propertyName?: string;
  agreementType: 'RENTAL' | 'LEASE';
  deposit: number;
  rent?: number;
  leaseAmount?: number;
  leaseTenure?: number;
  rentDueDate?: string;
  leaseEndDate?: string;
  rentStatus?: 'PAID' | 'PENDING';
}

/** In-app alert (maps to backend Notification entity, user relation omitted in JSON). */
export interface AppNotification {
  id: string;
  type: 'RENT' | 'LEASE' | 'MAINTENANCE' | 'SYSTEM';
  title: string;
  message: string;
  urgency: 'HIGH' | 'MED' | 'LOW';
  isRead: boolean;
  actionUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Activity {
  id: string;
  type: 'PAYMENT' | 'TICKET' | 'VERIFICATION' | 'SYSTEM' | 'PROPERTY';
  title: string;
  description: string;
  timestamp: string;
}

export interface Agreement {
  id: string;
  name: string;
  type: 'LEASE' | 'LICENSE' | 'MAINTENANCE';
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING_SIGNATURE';
}

export interface InventoryRecord {
  id: string;
  itemName: string;
  quantity: number;
  condition: 'MINT' | 'GOOD' | 'WEAR_DETECTED' | 'CRITICAL' | 'NEW';
  lastAudit?: string;
}

export interface IdentityProof {
  id: string;
  type: 'AADHAAR' | 'PAN' | 'VOTER_ID' | 'DRIVING_LICENSE' | 'OTHER';
  number: string;
  fullName?: string;
  dateOfBirth?: string;
  permanentAddress?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  documentUrl?: string;
  backDocumentUrl?: string;
  uploadDate: string;
  viewedByOwner: boolean;
}

export interface TenantDocument {
  id: string;
  name: string;
  type: 'LEASE_AGREEMENT' | 'UTILITY_BILL' | 'POLICE_VERIFICATION' | 'PROPERTY_DEED' | 'TAX_RECEIPT' | 'INSURANCE_POLICY' | 'SALES_AGREEMENT' | 'OTHER';
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
  fileUrl?: string;
  uploadDate: string;
}

export interface TenantHistory {
  id: string;
  tenantName: string;
  tenantEmail?: string;
  tenantPhone?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  movedOutDate: string;
  rent: number;
  deposit: number;
}

export interface Unit {
  id: string;
  name: string;
  tenantName?: string;
  tenantId?: string; // Link to user ID
  tenant?: Partial<UserSession>;
  rent: number;
  deposit: number;
  status: UnitStatus;
  unitType?: string;
  bhkCount?: number;
  sqFt?: number;
  bathrooms?: number;
  furnishedStatus?: 'UNFURNISHED' | 'SEMI_FURNISHED' | 'FULLY_FURNISHED';
  rentStatus?: 'PAID' | 'PENDING';
  agreements: Agreement[];
  identityProofs?: IdentityProof[];
  documents?: TenantDocument[];
  inventory?: InventoryRecord[];
  bills?: Bill[];
  leaseEndDate?: string;
  rentDueDate?: string;
  expectedRent?: number;
  lastVacantDate?: string;
  lastFilledDate?: string;
  occupantsCount?: number;
  tenantHistories?: TenantHistory[];
  agreementType?: 'RENTAL' | 'LEASE';
  leaseAmount?: number;
  leaseTenure?: number;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  type?: 'APARTMENT' | 'VILLA' | 'INDEPENDENT_HOUSE' | 'STUDIO' | 'COMMERCIAL';
  units: Unit[];
  rules: string[];
  valuation?: number;
  cctvCount?: number;
  waterSupplyType?: string;
  waterAvailability?: string;
  maintenanceAmount?: number;
  maintenanceFrequency?: string;
  parkingType?: string;
  parkingSlots?: number;
  securityGuardStatus?: string;
  biometricAccess?: boolean;
  fireSafety?: boolean;
}

export type MaintenanceIssueCategory = 'PAINTING' | 'HVAC' | 'ELECTRICAL' | 'PLUMBING' | 'GENERAL';

export interface MaintenanceTicket {
  id: string;
  tenantId: string;
  unitId: string;
  issue: string;
  aiDiagnosis?: string;
  status: TicketStatus;
  createdAt: string;
  issueCategory?: MaintenanceIssueCategory;
  resolvedAt?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  condition: 'NEW' | 'GOOD' | 'WORN';
  verified: boolean;
}

export interface UserSession {
  userId: string;
  role: UserRole;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  countryCode?: string;
  location?: string;
  gender?: string;
  occupation?: string;
  dateOfBirth?: string;
}

export interface TenantOnboardRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  occupation?: string;
  occupantsCount?: number;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  rentAmount: number;
  depositAmount: number;
  leaseStartDate?: string;
  leaseEndDate?: string;
  rentDueDate?: string;
}

export interface FinanceMetrics {
  monthlyGross: number;
  monthlyNet: number;
  potentialRevenue: number;
  pendingRent: number;
  totalExpenses: number;
  maintenanceReserve: number;
  collectedBillsAllTime?: number;
  collectedBillsThisMonth?: number;
  rentMarkedPaidPortfolioTotal?: number;
  totalCollectedRecognized?: number;

  expectedMonthlyRent: number;
  successfullyCollected: number;
  unpaidRent: number;
  outstandingUtilityBills: number;
}

export interface RenewalRowDTO {
  unitId: string;
  unitName: string;
  propertyName: string;
  kind: 'LEASE_END' | 'RENT_DUE';
  dueDate: string;
}

/** Preventive / scheduled maintenance program (persisted; no placeholder rows). */
export interface MaintenanceProgramRecord {
  id: string;
  scope: 'UNIT' | 'PROPERTY';
  propertyId: string;
  propertyName: string;
  unitId?: string;
  unitName?: string;
  category: string;
  lastServiceAt?: string;
  nextDueAt?: string;
  notes?: string;
  dueWithin30Days: boolean;
}

export interface OwnerMaintenanceSummary {
  programs: MaintenanceProgramRecord[];
}

export interface UnitRevenueDTO {
  unitId: string;
  unitName: string;
  propertyName: string;
  monthlyRent: number;
  rentStatus: string;
  agreementType?: string;
  leaseAmount?: number;
  leaseTenure?: number;
  lastOccupancyUpdate?: string;
  billStatuses: Record<string, 'PAID' | 'PENDING' | 'OVERDUE' | 'NONE'>;
}

export interface RevenueInsight {
  monthlyGross: number;
  monthlyNet: number;
  potentialRevenue: number;
  pendingRent: number;
  totalExpenses: number;
  maintenanceReserve: number;
  totalLeaseDeposits?: number;
  activeLeaseCount?: number;
  expenseBreakdown: Record<string, number>;
  monthlyTrends: number[];
  unitRevenues: UnitRevenueDTO[];
  historicalRevenue: Record<string, number>;
}
