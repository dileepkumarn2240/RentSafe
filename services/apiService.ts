
import { UserSession, Property, Unit, Bill, MaintenanceTicket, Activity, InventoryRecord, AppNotification, PortfolioSummary, PropertySummary, TenancySummary, FinanceMetrics, RenewalRowDTO, OwnerMaintenanceSummary, MaintenanceProgramRecord } from '../types';
import { API_BASE } from '../config/api';

export class ApiError extends Error {
  code?: string;
  status?: number;
  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

const getHeaders = () => {
    const token = sessionStorage.getItem('rentsafe_jwt');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const api = {
    // --- Auth Extensions ---
    me: async (token: string) => {
        const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Token expired');
        return res.json();
    },

    // --- Properties ---
    getProperties: async (): Promise<Property[]> => {
        const res = await fetch(`${API_BASE}/properties`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch properties');
        return res.json();
    },

    createProperty: async (property: Partial<Property>): Promise<Property> => {
        const res = await fetch(`${API_BASE}/properties`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(property)
        });
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            const msg = errBody.message || errBody.error || `Server error ${res.status}`;
            throw new Error(msg);
        }
        return res.json();
    },

    deleteProperty: async (propertyId: string): Promise<void> => {
        const res = await fetch(`${API_BASE}/properties/${propertyId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete property');
    },

    addUnit: async (propertyId: string, unit: Partial<Unit>): Promise<Unit> => {
        const res = await fetch(`${API_BASE}/properties/${propertyId}/units`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(unit)
        });
        if (!res.ok) throw new Error('Failed to add unit');
        return res.json();
    },

    updateUnit: async (unitId: string, unit: Partial<Unit>): Promise<Unit> => {
        const res = await fetch(`${API_BASE}/properties/units/${unitId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(unit)
        });
        if (!res.ok) throw new Error('Failed to update unit');
        return res.json();
    },

    deleteUnit: async (unitId: string): Promise<void> => {
        const res = await fetch(`${API_BASE}/properties/units/${unitId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete unit');
    },

    // --- Portfolio (owner overview) ---
    getPortfolioSummary: async (renewalWindowDays: number = 30): Promise<PortfolioSummary> => {
        const res = await fetch(`${API_BASE}/portfolio/summary?renewalWindowDays=${renewalWindowDays}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch portfolio summary');
        return res.json();
    },

    getPropertySummary: async (propertyId: string, renewalWindowDays: number = 30): Promise<PropertySummary> => {
        const res = await fetch(`${API_BASE}/properties/${propertyId}/summary?renewalWindowDays=${renewalWindowDays}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch property summary');
        return res.json();
    },

    getTenancySummary: async (): Promise<TenancySummary> => {
        const res = await fetch(`${API_BASE}/tenancy/me/summary`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch tenancy summary');
        return res.json();
    },

    // --- Units ---
    getUnitForOwner: async (unitId: string): Promise<Unit> => {
        const res = await fetch(`${API_BASE}/units/${unitId}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch unit');
        return res.json();
    },

    getMyUnit: async (): Promise<Unit> => {
        const res = await fetch(`${API_BASE}/units/me`, { headers: getHeaders() });
        if (res.status === 404) {
            throw new ApiError('You are not assigned to a unit yet. Ask your landlord to complete onboarding.', 'NO_UNIT', 404);
        }
        if (!res.ok) {
            const body = await res.json().catch(() => ({} as { message?: string }));
            throw new ApiError(body.message || 'Failed to fetch your unit', 'LOAD_ERROR', res.status);
        }
        return res.json();
    },

    getUnitsByProperty: async (propertyId: string): Promise<Unit[]> => {
        const res = await fetch(`${API_BASE}/units/property/${propertyId}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch units');
        return res.json();
    },

    onboardTenant: async (unitId: string, request: any): Promise<any> => {
        const res = await fetch(`${API_BASE}/units/${unitId}/onboard`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(request)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to onboard tenant');
        }
        return res.json();
    },

    // --- Billing ---
    getMyBills: async (): Promise<Bill[]> => {
        const res = await fetch(`${API_BASE}/bills/me`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch bills');
        return res.json();
    },

    getUnitBills: async (unitId: string): Promise<Bill[]> => {
        const res = await fetch(`${API_BASE}/bills/unit/${unitId}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch unit bills');
        return res.json();
    },

    createBill: async (unitId: string, bill: Partial<Bill>): Promise<Bill> => {
        const res = await fetch(`${API_BASE}/bills/unit/${unitId}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(bill)
        });
        if (!res.ok) throw new Error('Failed to create bill');
        return res.json();
    },

    payBill: async (billId: string, paymentRef: string): Promise<Bill> => {
        const res = await fetch(`${API_BASE}/bills/pay/${billId}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(paymentRef.trim()),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({} as { message?: string }));
            throw new Error(err.message || 'Payment could not be recorded');
        }
        return res.json();
    },

    // --- Notifications ---
    getNotifications: async (): Promise<AppNotification[]> => {
        const res = await fetch(`${API_BASE}/notifications`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch notifications');
        return res.json();
    },

    markNotificationRead: async (id: string): Promise<AppNotification | null> => {
        const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
            method: 'PUT',
            headers: getHeaders(),
        });
        if (!res.ok) throw new Error('Failed to update notification');
        const text = await res.text();
        if (!text) return null;
        return JSON.parse(text) as AppNotification;
    },

    // --- Maintenance ---
    getMyTickets: async (): Promise<MaintenanceTicket[]> => {
        const res = await fetch(`${API_BASE}/maintenance/me`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch tickets');
        return res.json();
    },

    createTicket: async (ticket: Partial<MaintenanceTicket>): Promise<MaintenanceTicket> => {
        const res = await fetch(`${API_BASE}/maintenance/me`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(ticket)
        });
        if (!res.ok) throw new Error('Failed to create ticket');
        return res.json();
    },

    // --- Activities ---
    getMyActivities: async (): Promise<Activity[]> => {
        const res = await fetch(`${API_BASE}/activities/me`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch activities');
        return res.json();
    },

    // --- Finance ---
    getFinanceMetrics: async (): Promise<FinanceMetrics> => {
        const res = await fetch(`${API_BASE}/finance/metrics`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch finance metrics');
        return res.json();
    },

    getFinanceRenewals: async (days: number = 90): Promise<RenewalRowDTO[]> => {
        const res = await fetch(`${API_BASE}/finance/renewals?days=${days}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch renewals');
        return res.json();
    },
    
    getFinanceUnits: async (): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/finance/units`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch unit revenues');
        return res.json();
    },
    
    getFinanceTrends: async (): Promise<any> => {
        const res = await fetch(`${API_BASE}/finance/analytics/trends`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch finance trends');
        return res.json();
    },
    
    getFinanceLeases: async (): Promise<any> => {
        const res = await fetch(`${API_BASE}/finance/analytics/leases`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch lease summary');
        return res.json();
    },

    getFinanceExpenseBreakdown: async (): Promise<Record<string, number>> => {
        const res = await fetch(`${API_BASE}/finance/analytics/expenses`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch expense breakdown');
        return res.json();
    },

    getFinanceInsights: async (): Promise<any> => {
        const res = await fetch(`${API_BASE}/finance/insights`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch finance insights');
        return res.json();
    },

    markBillPaid: async (unitId: string, billType: string): Promise<void> => {
        const res = await fetch(`${API_BASE}/finance/units/${unitId}/bills/${billType}/paid`, {
            method: 'PUT',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error(`Failed to mark ${billType} as paid`);
    },

    // --- Inventory ---
    getInventoryByUnit: async (unitId: string): Promise<InventoryRecord[]> => {
        const res = await fetch(`${API_BASE}/inventory/unit/${unitId}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch inventory');
        return res.json();
    },

    getMyInventory: async (): Promise<InventoryRecord[]> => {
        const res = await fetch(`${API_BASE}/inventory/me`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch your inventory');
        return res.json();
    },

    addItem: async (unitId: string, item: any): Promise<InventoryRecord> => {
        const res = await fetch(`${API_BASE}/inventory/unit/${unitId}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(item)
        });
        if (!res.ok) throw new Error('Failed to add inventory item');
        return res.json();
    },

    patchInventoryCondition: async (itemId: string, condition: string): Promise<InventoryRecord> => {
        const res = await fetch(`${API_BASE}/inventory/${itemId}/condition`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(condition)
        });
        if (!res.ok) throw new Error('Failed to update condition');
        return res.json();
    },

    // --- Documents ---
    // --- Property Documents ---
    getPropertyDocuments: async (propertyId: string): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/documents/properties/${propertyId}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch property documents');
        return res.json();
    },

    uploadPropertyDocument: async (propertyId: string, type: string, docName: string, file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        formData.append('name', docName);

        const res = await fetch(`${API_BASE}/documents/properties/${propertyId}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('rentsafe_jwt')}`
            },
            body: formData
        });

        if (!res.ok) throw new Error('Failed to upload property document');
        return res.json();
    },

    openDocument: async (docId: string): Promise<void> => {
        const token = sessionStorage.getItem('rentsafe_jwt');
        const res = await fetch(`${API_BASE}/documents/${docId}/download`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to open document');

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
    },

    getDocuments: async (): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/documents`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch documents');
        return res.json();
    },

    getIdentity: async (): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/documents/identity`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch identity proofs');
        return res.json();
    },

    getPendingDocuments: async (): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/documents/pending`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch pending documents');
        return res.json();
    },

    getPendingIdentity: async (): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/documents/identity/pending`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch pending identity');
        return res.json();
    },

    getTenantMatrix: async (): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/documents/matrix`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch tenant document matrix');
        return res.json();
    },

    getTenantIdentities: async (tenantId: string): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/documents/tenants/${tenantId}/identities`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch tenant identities');
        return res.json();
    },

    getTenantLegalDocs: async (tenantId: string): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/documents/tenants/${tenantId}/legal`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch tenant legal documents');
        return res.json();
    },

    uploadIdentity: async (metadata: { type: string, number: string, fullName: string, dob: string, address: string }, frontFile: File, backFile?: File): Promise<any> => {
        const formData = new FormData();
        formData.append('type', metadata.type);
        formData.append('number', metadata.number);
        formData.append('fullName', metadata.fullName);
        formData.append('dob', metadata.dob);
        formData.append('address', metadata.address);
        formData.append('frontFile', frontFile);
        if (backFile) formData.append('backFile', backFile);

        const token = sessionStorage.getItem('rentsafe_jwt');
        const res = await fetch(`${API_BASE}/documents/upload/identity`, {
            method: 'POST',
            headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
            body: formData
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to upload identity');
        }
        return res.json();
    },

    uploadLegal: async (type: string, name: string, file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('type', type);
        formData.append('name', name);
        formData.append('file', file);

        const token = sessionStorage.getItem('rentsafe_jwt');
        const res = await fetch(`${API_BASE}/documents/upload/legal`, {
            method: 'POST',
            headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
            body: formData
        });
        if (!res.ok) throw new Error('Failed to upload document');
        return res.json();
    },

    /** Fetch all documents scoped to a specific unit */
    getUnitDocuments: async (unitId: string): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/documents/units/${unitId}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch unit documents');
        return res.json();
    },

    /** Upload a document (agreement or identity proof) scoped to a unit */
    uploadUnitDocument: async (unitId: string, type: string, name: string, file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('type', type);
        formData.append('name', name);
        formData.append('file', file);

        const token = sessionStorage.getItem('rentsafe_jwt');
        const res = await fetch(`${API_BASE}/documents/units/${unitId}/upload`, {
            method: 'POST',
            headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
            body: formData
        });
        if (!res.ok) throw new Error('Failed to upload unit document');
        return res.json();
    },

    /** Get document metadata (including fileUrl) for opening in browser */
    getDocumentDownloadInfo: async (docId: string): Promise<any> => {
        const res = await fetch(`${API_BASE}/documents/${docId}/download`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch document download info');
        return res.json();
    },

    getSecurity: async (propertyId: string): Promise<any> => {
        const res = await fetch(`${API_BASE}/security/property/${propertyId}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch security state');
        return res.json();
    },

    getOwnerSecurity: async (): Promise<any> => {
        const res = await fetch(`${API_BASE}/security/owner`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch owner security state');
        return res.json();
    },

    verifyDocument: async (docId: string, status: string): Promise<any> => {
        const res = await fetch(`${API_BASE}/documents/${docId}/status?status=${status}`, {
            method: 'PUT',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to update document status');
        return res.json();
    },

    verifyIdentity: async (proofId: string, status: string): Promise<any> => {
        const res = await fetch(`${API_BASE}/documents/identity/${proofId}/status?status=${status}`, {
            method: 'PUT',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to update identity status');
        return res.json();
    },

    deleteDocument: async (docId: string): Promise<void> => {
        const res = await fetch(`${API_BASE}/documents/${docId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete document');
    },

    deleteIdentityProof: async (proofId: string): Promise<void> => {
        const res = await fetch(`${API_BASE}/documents/identity/${proofId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete identity proof');
    },

    // --- Owner Maintenance ---
    getUnitTickets: async (unitId: string): Promise<MaintenanceTicket[]> => {
        const res = await fetch(`${API_BASE}/maintenance/unit/${unitId}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch unit tickets');
        return res.json();
    },

    resolveTicket: async (ticketId: string, resolution: string, issueCategory?: string): Promise<MaintenanceTicket> => {
        const body = issueCategory
            ? JSON.stringify({ resolution, issueCategory })
            : JSON.stringify({ resolution });
        const res = await fetch(`${API_BASE}/maintenance/${ticketId}/resolve`, {
            method: 'PUT',
            headers: getHeaders(),
            body
        });
        if (!res.ok) throw new Error('Failed to resolve ticket');
        return res.json();
    },

    getOwnerMaintenanceSummary: async (): Promise<OwnerMaintenanceSummary> => {
        const res = await fetch(`${API_BASE}/maintenance/owner/summary`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch maintenance summary');
        return res.json();
    },

    createMaintenanceProgram: async (body: {
        scope: string;
        propertyId: string;
        unitId?: string;
        category: string;
        lastServiceAt: string;
        nextDueAt?: string;
        notes?: string;
    }): Promise<MaintenanceProgramRecord> => {
        const res = await fetch(`${API_BASE}/maintenance/owner/programs`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed to create maintenance program');
        return res.json();
    },

    updateMaintenanceProgram: async (
        programId: string,
        body: { category: string; lastServiceAt: string; nextDueAt?: string; notes?: string }
    ): Promise<MaintenanceProgramRecord> => {
        const res = await fetch(`${API_BASE}/maintenance/owner/programs/${programId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed to update program');
        return res.json();
    },

    deleteMaintenanceProgram: async (programId: string): Promise<void> => {
        const res = await fetch(`${API_BASE}/maintenance/owner/programs/${programId}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!res.ok) throw new Error('Failed to delete program');
    },

    logPreventiveMaintenance: async (unitId: string, category: string, notes?: string): Promise<void> => {
        const res = await fetch(`${API_BASE}/maintenance/owner/preventive`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ unitId, category, notes: notes || '' })
        });
        if (!res.ok) throw new Error('Failed to log preventive maintenance');
    },

    // --- Identity Proof Download ---
    openIdentityDocument: async (proofId: string, side: 'front' | 'back' = 'front'): Promise<void> => {
        const res = await fetch(`${API_BASE}/documents/identity/${proofId}/download/${side}`, { headers: getHeaders() });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to open identity document');
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
    }
};
