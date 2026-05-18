
import React, { useState, useEffect, useCallback } from 'react';
import { IdentityProof, TenantDocument, UserRole, UserSession, Property } from '../types';
import { Icons, BENTO_CARD, METRIC_LABEL } from '../App';
import { api } from '../services/apiService';

interface SafePapersViewProps {
    session: UserSession;
}

// Icon map for document types
const docTypeIcon = (type: string) => {
    if (['AADHAAR', 'PAN_CARD', 'DRIVING_LICENSE', 'PASSPORT'].includes(type)) return <Icons.CreditCard />;
    if (['RENTAL_AGREEMENT', 'LEASE_AGREEMENT', 'SALES_AGREEMENT'].includes(type)) return <Icons.FileText />;
    return <Icons.File />;
};

const docTypeLabel: Record<string, string> = {
    AADHAAR: 'Aadhaar Card',
    PAN: 'PAN Card',
    PAN_CARD: 'PAN Card',
    DRIVING_LICENSE: 'Driving License',
    PASSPORT: 'Passport',
    VOTER_ID: 'Voter ID',
    RENTAL_AGREEMENT: 'Rental Agreement',
    LEASE_AGREEMENT: 'Lease Agreement',
    SALES_AGREEMENT: 'Sales Agreement',
    UTILITY_BILL: 'Utility Bill',
    POLICE_VERIFICATION: 'Police Verification',
    PROPERTY_DEED: 'Property Deed',
    TAX_RECEIPT: 'Tax Receipt',
    INSURANCE_POLICY: 'Insurance Policy',
    OTHER: 'Other Document',
};

// ─── Sub-component: Unit Document Hub ─────────────────────────────────────────
const UnitDocHub: React.FC<{
    tenant: any;
    onRefresh: () => void;
}> = ({ tenant, onRefresh }) => {
    const [unitDocs, setUnitDocs] = useState<any[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    const [openingDoc, setOpeningDoc] = useState<string | null>(null);
    const [selectedTypeToAdd, setSelectedTypeToAdd] = useState<string | null>(null);

    const unitId: string | undefined = tenant.unitId;
    const agreementType: string = tenant.agreementType || 'RENTAL';

    const fetchUnitDocs = useCallback(async () => {
        if (!unitId) return;
        setLoadingDocs(true);
        try {
            const docs = await api.getUnitDocuments(unitId);
            setUnitDocs(docs);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingDocs(false);
        }
    }, [unitId]);

    useEffect(() => { fetchUnitDocs(); }, [fetchUnitDocs]);

    const handleDeleteDoc = async (docId: string) => {
        if (!window.confirm('Strategically purge this asset from the digital archive? This action is irreversible.')) return;
        try {
            await api.deleteDocument(docId);
            await fetchUnitDocs();
            onRefresh(); // Sync parent matrix
        } catch (e) {
            alert('Purge operation failed.');
        }
    };

    const handleDeleteIdentity = async (proofId: string) => {
        if (!window.confirm('Permanently redact this identity proof from the resident record?')) return;
        try {
            await api.deleteIdentityProof(proofId);
            await fetchUnitDocs();
            onRefresh(); // Sync parent matrix
        } catch (e) {
            alert('Identity redaction failed.');
        }
    };

    const handleUpload = async (file: File, docType: string, docName: string) => {
        if (!unitId) return;
        setUploading(docType);
        try {
            await api.uploadUnitDocument(unitId, docType, docName, file);
            await fetchUnitDocs();
        } catch (e: any) {
            const msg = e?.message || 'Upload failed. Please try again.';
            alert(`Upload failed: ${msg}`);
        } finally {
            setUploading(null);
        }
    };

    const handleOpenDoc = async (docId: string, fileUrl: string) => {
        setOpeningDoc(docId);
        try {
            await api.openDocument(docId);
        } catch (e) {
            alert('Could not open document. The file may not be accessible yet.');
        } finally {
            setOpeningDoc(null);
        }
    };

    const handleOpenIdentity = async (proofId: string) => {
        setOpeningDoc(proofId);
        try {
            await api.openIdentityDocument(proofId);
        } catch (e) {
            alert('Could not open identity document. The file may not be accessible yet.');
        } finally {
            setOpeningDoc(null);
        }
    };

    const UploadButton: React.FC<{ docType: string; label: string; accept?: string; colorScheme?: string }> = ({
        docType, label, accept = '.pdf,.docx,.doc,.jpg,.jpeg,.png', colorScheme = ''
    }) => {
        const existing = unitDocs.find(d => d.type === docType);
        const tintMap: Record<string, string> = {
            AADHAAR: 'bg-violet-50 dark:bg-white/[0.02] border-violet-100 dark:border-white/5',
            PAN_CARD: 'bg-sky-50 dark:bg-white/[0.02] border-sky-100 dark:border-white/5',
            DRIVING_LICENSE: 'bg-amber-50 dark:bg-white/[0.02] border-amber-100 dark:border-white/5',
            PASSPORT: 'bg-indigo-50 dark:bg-white/[0.02] border-indigo-100 dark:border-white/5',
            VOTER_ID: 'bg-teal-50 dark:bg-white/[0.02] border-teal-100 dark:border-white/5',
            RENTAL_AGREEMENT: 'bg-emerald-50 dark:bg-white/[0.02] border-emerald-100 dark:border-white/5',
            LEASE_AGREEMENT: 'bg-emerald-50 dark:bg-white/[0.02] border-emerald-100 dark:border-white/5',
            IDENTITY_PROOF: 'bg-cyan-50 dark:bg-white/[0.02] border-cyan-100 dark:border-white/5',
            NOC: 'bg-rose-50 dark:bg-white/[0.02] border-rose-100 dark:border-white/5',
            UTILITY_BILL: 'bg-orange-50 dark:bg-white/[0.02] border-orange-100 dark:border-white/5',
            ADVANCE_RECEIPT: 'bg-lime-50 dark:bg-white/[0.02] border-lime-100 dark:border-white/5',
            POLICE_VERIFICATION: 'bg-fuchsia-50 dark:bg-white/[0.02] border-fuchsia-100 dark:border-white/5',
            OTHER: 'bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/5',
        };
        const tint = tintMap[docType] || 'bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/5';
        return (
            <div className={`p-6 rounded-[2rem] shadow-sm dark:shadow-none border flex flex-col justify-between min-h-[160px] group transition-all duration-300 hover:border-slate-300 dark:hover:border-white/10 ${tint}`}>
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-500 group-hover:bg-amber-400 group-hover:text-black transition-all duration-500 border border-slate-200">
                        {React.cloneElement(docTypeIcon(docType), { size: 20 } as any)}
                    </div>
                    {existing && (
                        <div className="flex flex-col items-end gap-1">
                            <span className={`px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border ${existing.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                {existing.status}
                            </span>
                            <p className="text-[6px] font-bold text-slate-400 uppercase">Verified Paper</p>
                        </div>
                    )}
                </div>
                
                <div>
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.1em] mb-1 leading-tight group-hover:text-amber-600 transition-colors">{label}</p>
                    <p className="text-[7px] font-bold text-slate-400 uppercase">Digital Archival System</p>
                </div>

                {existing ? (
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => handleOpenDoc(existing.id, existing.fileUrl)}
                            disabled={openingDoc === existing.id}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-full text-[8px] font-black uppercase tracking-widest hover:bg-amber-400 hover:text-black transition-all active:scale-95"
                        >
                            {openingDoc === existing.id
                                ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                : <Icons.ExternalLink size={12} />}
                            Open
                        </button>
                        <button
                            onClick={() => handleDeleteDoc(existing.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-50 text-rose-500 rounded-full text-[8px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all border border-rose-200 active:scale-95"
                        >
                            <Icons.Trash2 size={12} />
                            Delete
                        </button>
                    </div>
                ) : (
                    <label className={`mt-4 flex items-center justify-center gap-2 py-3 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all cursor-pointer active:scale-95
                        ${uploading === docType
                            ? 'bg-amber-400/10 border-amber-400/40 text-amber-600 animate-pulse'
                            : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-900 hover:text-white hover:border-slate-900'}`}>
                        {uploading === docType
                            ? <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                            : <Icons.Plus size={12} />}
                        Archive
                        <input type="file" accept={accept} className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, docType, label); }} />
                    </label>
                )}
            </div>
        );
    };

    if (!unitId) return (
        <p className="text-[9px] text-slate-600 uppercase tracking-widest font-black py-4">Unit not assigned.</p>
    );

    return (
        <div className="space-y-12 mt-6">
            {/* Agreement Documents */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 px-4">
                    <div className="w-1.5 h-6 bg-amber-400 rounded-full" />
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">
                        Primary Agreement
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <UploadButton
                        docType={agreementType === 'LEASE' ? 'LEASE_AGREEMENT' : 'RENTAL_AGREEMENT'}
                        label={agreementType === 'LEASE' ? 'Lease Agreement Document' : 'Rental Agreement Document'}
                        accept=".pdf,.docx,.doc"
                    />
                </div>
            </div>


            {loadingDocs && (
                <div className="py-8 flex flex-col items-center justify-center gap-4 text-slate-600 animate-pulse">
                    <div className="w-8 h-8 border-4 border-slate-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[8px] uppercase tracking-[0.4em] font-black">Syncing Digital Archive</span>
                </div>
            )}
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export const SafePapersView: React.FC<SafePapersViewProps> = ({ session }) => {
    const [activeBucket, setActiveBucket] = useState<string>(session.role === UserRole.OWNER ? 'TENANTS' : 'IDENTITY');
    const [identityProofs, setIdentityProofs] = useState<IdentityProof[]>([]);
    const [documents, setDocuments] = useState<TenantDocument[]>([]);
    const [tenantMatrix, setTenantMatrix] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [showIdentityForm, setShowIdentityForm] = useState<string | null>(null);
    const [openingDoc, setOpeningDoc] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [properties, setProperties] = useState<Property[]>([]);
    const [propertyDocsMap, setPropertyDocsMap] = useState<Record<string, any[]>>({});

    const [idMeta, setIdMeta] = useState({
        fullName: '',
        dob: '',
        address: '',
        number: '',
        frontFile: null as File | null,
        backFile: null as File | null
    });

    useEffect(() => { fetchPapers(); }, []);

    const fetchPapers = async () => {
        setIsLoading(true);
        try {
            const [ids, docs] = await Promise.all([api.getIdentity(), api.getDocuments()]);
            setIdentityProofs(ids);
            setDocuments(docs);

            if (session.role === UserRole.OWNER) {
                const matrix = await api.getTenantMatrix();
                setTenantMatrix(matrix);
                
                const props = await api.getProperties();
                setProperties(props);
                const map: Record<string, any[]> = {};
                for (const p of props) {
                   map[p.id] = await api.getPropertyDocuments(p.id);
                }
                setPropertyDocsMap(map);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (id: string, status: string, isIdentity: boolean) => {
        try {
            isIdentity ? await api.verifyIdentity(id, status) : await api.verifyDocument(id, status);
            fetchPapers();
        } catch (err) { console.error(err); }
    };

    const handleUpload = async (file: File, type: string, name?: string, number?: string) => {
        setIsUploading(true);
        try {
            await api.uploadLegal(type, name || 'Unnamed Document', file);
            fetchPapers();
        } catch (err: any) {
            const msg = err?.message || 'Upload failed. Please try again.';
            alert(`Upload failed: ${msg}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleIdentitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showIdentityForm || !idMeta.frontFile) return;
        
        // Aadhaar/License requirement
        if ((showIdentityForm === 'AADHAAR' || showIdentityForm === 'DRIVING_LICENSE') && !idMeta.backFile) {
            alert('Strategic requirement: Both front and back views must be archived for this identity type.');
            return;
        }

        setIsUploading(true);
        try {
            const metadata = {
                type: showIdentityForm,
                number: idMeta.number,
                fullName: idMeta.fullName,
                dob: idMeta.dob,
                address: idMeta.address
            };
            await api.uploadIdentity(metadata, idMeta.frontFile, idMeta.backFile || undefined);
            setShowIdentityForm(null);
            setIdMeta({ fullName: '', dob: '', address: '', number: '', frontFile: null, backFile: null });
            fetchPapers();
        } catch (err: any) {
            alert(`Validation Redaction: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleOpenIdentity = async (proofId: string, side: 'front' | 'back' = 'front') => {
        setOpeningDoc(proofId);
        try {
            await api.openIdentityDocument(proofId, side);
        } catch (e: any) {
            alert(e.message || 'Identity Lock: Original asset could not be retrieved.');
        } finally {
            setOpeningDoc(null);
        }
    };

    const handleGlobalDelete = async (docId: string, isIdentity: boolean = false) => {
        const msg = isIdentity ? 'Redact this identity proof from the vault?' : 'Purge this document asset?';
        if (!window.confirm(msg)) return;
        try {
            isIdentity ? await api.deleteIdentityProof(docId) : await api.deleteDocument(docId);
            fetchPapers();
        } catch (err) {
            alert('Delete operation failed.');
        }
    };

    const handlePropertyUpload = async (propertyId: string, file: File, type: string, name?: string) => {
        setIsUploading(true);
        try {
            await api.uploadPropertyDocument(propertyId, type, name || 'Unnamed Document', file);
            fetchPapers();
        } catch (err: any) {
            const msg = err?.message || 'Upload failed. Please try again.';
            alert(`Upload failed: ${msg}`);
        } finally {
            setIsUploading(false);
        }
    };

    // Owner has 4 clean buckets; no Verify Hub, no My Identity
    const ownerBuckets = [
        { id: 'TENANTS', label: 'Tenants Vault', count: tenantMatrix.length, icon: <Icons.Users /> },
        { id: 'DEEDS', label: 'Property Deeds', count: properties.reduce((acc, p) => acc + (propertyDocsMap[p.id]?.filter(d => d.type === 'PROPERTY_DEED').length || 0), 0), icon: <Icons.FileText /> },
        { id: 'TAX', label: 'Tax & Receipts', count: documents.filter(d => (d as any).type === 'TAX_RECEIPT').length, icon: <Icons.PieChart /> },
        { id: 'INSURANCE', label: 'Insurance', count: properties.reduce((acc, p) => acc + (propertyDocsMap[p.id]?.filter(d => d.type === 'INSURANCE_POLICY').length || 0), 0), icon: <Icons.ShieldCheck /> },
    ];

    const tenantBuckets = [
        { id: 'IDENTITY', label: 'Identity Vault', count: identityProofs.length, icon: <Icons.User /> },
        { id: 'LEGAL', label: 'Lease & Legal', count: documents.filter(d => (d as any).type === 'LEASE_AGREEMENT' || (d as any).type === 'RENTAL_AGREEMENT').length, icon: <Icons.FileText /> },
        { id: 'POLICE', label: 'Verifications', count: documents.filter(d => (d as any).type === 'POLICE_VERIFICATION').length, icon: <Icons.ShieldCheck /> },
    ];

    const buckets = session.role === UserRole.OWNER ? ownerBuckets : tenantBuckets;

    // Filtered tenant matrix based on search
    const filteredMatrix = tenantMatrix.filter(t => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            t.name?.toLowerCase().includes(q) ||
            t.house?.toLowerCase().includes(q)
        );
    });

    const filteredDocs = documents.filter((d: any) => {
        if (activeBucket === 'DEEDS') return d.type === 'PROPERTY_DEED';
        if (activeBucket === 'TAX') return d.type === 'TAX_RECEIPT';
        if (activeBucket === 'INSURANCE') return d.type === 'INSURANCE_POLICY';
        if (activeBucket === 'LEGAL') return d.type === 'LEASE_AGREEMENT' || d.type === 'RENTAL_AGREEMENT';
        if (activeBucket === 'POLICE') return d.type === 'POLICE_VERIFICATION';
        return false;
    });

    const DocumentPreviewModal = ({ doc, onClose }: { doc: any, onClose: () => void }) => {
        if (!doc) return null;
        
        // Anti-print and anti-selection measures
        const protectionStyles = {
            userSelect: 'none' as const,
            WebkitUserSelect: 'none' as const,
            msUserSelect: 'none' as const,
            MozUserSelect: 'none' as const,
        };

        return (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-white/95 dark:bg-black/95 backdrop-blur-3xl animate-reveal print:hidden" style={protectionStyles}>
                <div 
                    className={`${BENTO_CARD} w-full max-w-5xl h-[85vh] bg-slate-50 dark:bg-[#0d1015] border border-slate-300 dark:border-white/10 shadow-xl dark:shadow-none flex flex-col relative overflow-hidden`}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    {/* Security Watermark Overlay */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex flex-wrap gap-20 p-20 overflow-hidden rotate-[-15deg] z-50">
                        {Array.from({ length: 50 }).map((_, i) => (
                            <span key={i} className="text-[12px] font-black uppercase text-slate-900/10 dark:text-white tracking-[0.5em] whitespace-nowrap whitespace-pre">RENTSAFE PRO SECURE ASSET  •  CONFIDENTIAL  •  DO NOT COPY</span>
                        ))}
                    </div>

                    <div className="p-10 border-b border-slate-200 dark:border-white/5 flex justify-between items-center relative z-10">
                        <div>
                            <span className={METRIC_LABEL}>End-to-End Encrypted Archive</span>
                            <h3 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">{doc.name || doc.type}</h3>
                        </div>
                        <button onClick={onClose} className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                            <Icons.X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 p-12 overflow-y-auto custom-scrollbar relative z-10">
                        <div className="flex flex-col items-center justify-center py-24 space-y-10 group">
                            {/* Security Mirror Frame */}
                            <div className="w-full max-w-2xl bg-white/[0.01] border border-white/10 rounded-[4rem] p-16 relative overflow-hidden group-hover:border-amber-400 transition-all duration-700 shadow-2xl">
                                <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full opacity-30" />
                                
                                <div className="flex flex-col items-center text-center space-y-8 relative z-10">
                                    <div className="w-32 h-32 bg-amber-400 text-black rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(251,191,36,0.2)]">
                                        <Icons.ShieldCheck size={60} />
                                    </div>
                                    
                                    <div>
                                        <h4 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4 leading-none">Strategic Mirror Active</h4>
                                        <div className="inline-flex items-center gap-3 px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">Verified Archive Pair</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-10 w-full pt-10 border-t border-slate-200 dark:border-white/5">
                                        <div className="text-left space-y-2">
                                            <p className={METRIC_LABEL}>Asset Hash</p>
                                            <p className="text-[10px] font-black text-slate-900 dark:text-white break-all leading-tight opacity-40">{doc.fileHash?.slice(0, 32) || 'SHA256-VLT-RNT-4.0-SEC'}</p>
                                        </div>
                                        <div className="text-left space-y-2">
                                            <p className={METRIC_LABEL}>Security Status</p>
                                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Locked for Preview</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 border-t border-slate-200 bg-slate-50 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
                                <Icons.Lock size={20} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Authorization Protocol</p>
                                <p className="text-[11px] font-black text-slate-900 uppercase leading-none italic">{session.role === UserRole.OWNER ? 'Vault Custodian Authority' : 'Data Subject Authority'}</p>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            {session.role === UserRole.TENANT ? (
                                <>
                                    <button 
                                        onClick={() => api.openDocument(doc.id)}
                                        className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-amber-400 hover:text-black transition-all flex items-center gap-3 active:scale-95 shadow-xl"
                                    >
                                        <Icons.Download size={18} /> Archive Copy
                                    </button>
                                    <button className="px-10 py-5 bg-slate-100 text-slate-700 border border-slate-300 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all flex items-center gap-3 active:scale-95">
                                        Digital Signature
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col items-end gap-2">
                                    <div className="px-6 py-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-4">
                                        <Icons.ShieldAlert size={16} className="text-rose-500" />
                                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.1em] leading-none">
                                            Privacy Protocol: Direct Download Restricted for Owner
                                        </p>
                                    </div>
                                    <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Action logged for compliance audit</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading) return <div className="space-y-12 animate-pulse"><div className={`${BENTO_CARD} h-[60vh] bg-white/5 shadow-2xl`} /></div>;

    return (
        <div className="space-y-10 animate-reveal">
            {/* Header */}
            <div className="text-center">
                <span className={METRIC_LABEL}>End-to-End Encrypted</span>
                <h2 className="text-6xl font-black tracking-tighter text-slate-900 uppercase leading-none italic mt-2">
                    Safe <span className="text-amber-500 not-italic">Papers</span>
                </h2>
            </div>

            {/* Centered Tab Bar */}
            <div className="flex justify-center">
                <div className="inline-flex flex-wrap justify-center gap-2 p-2 bg-white rounded-[2rem] border border-slate-200 shadow-lg">
                    {buckets.map(b => (
                        <button
                            key={b.id}
                            onClick={() => setActiveBucket(b.id)}
                            className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] transition-all whitespace-nowrap font-black text-[10px] uppercase tracking-widest ${activeBucket === b.id
                                ? 'bg-slate-900 text-white shadow-xl'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                        >
                            <div className={activeBucket === b.id ? 'animate-bounce' : ''}>
                                {React.cloneElement(b.icon as React.ReactElement, { size: 15 })}
                            </div>
                            {b.label}
                            {b.count > 0 && (
                                <span className={`w-5 h-5 text-[9px] rounded-full flex items-center justify-center font-bold ml-1 ${activeBucket === b.id ? 'bg-amber-400 text-black' : 'bg-slate-200 text-slate-600'}`}>
                                    {b.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-8">

                    {/* TENANTS VAULT */}
                    {activeBucket === 'TENANTS' && (
                        <div className="space-y-10">
                            {/* Search Bar */}
                            <div className={`${BENTO_CARD} p-4 bg-white border-slate-200 flex items-center gap-4 shadow-sm`}>
                                <div className="w-10 h-10 flex items-center justify-center text-amber-500">
                                    <Icons.Search size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search by tenant name or property / unit..."
                                    className="flex-1 bg-transparent text-slate-900 text-sm font-bold placeholder:text-slate-400 outline-none uppercase tracking-wide"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all">
                                        <Icons.X size={14} />
                                    </button>
                                )}
                            </div>

                            {filteredMatrix.length === 0 && (
                                <div className="py-40 text-center space-y-8 opacity-20">
                                    {searchQuery ? <Icons.Search size={64} className="mx-auto" /> : <Icons.Users size={64} className="mx-auto" />}
                                    <h3 className="text-4xl font-black uppercase tracking-tighter text-white">
                                        {searchQuery ? 'No Results Found' : 'No Active Residents'}
                                    </h3>
                                    <p className="max-w-md mx-auto text-[10px] font-black uppercase tracking-widest text-slate-500 leading-relaxed">
                                        {searchQuery ? `No tenants matched "${searchQuery}".` : 'Your units are currently vacant. Deploy tenants to populate the vault.'}
                                    </p>
                                </div>
                            )}

                            {filteredMatrix.map((tenant: any) => (
                                <div key={tenant.tenantId} className={`${BENTO_CARD} p-10 bg-sky-50 border-sky-200 space-y-8 shadow-sm`}>
                                    {/* Tenant Header */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className={METRIC_LABEL}>Active Resident</span>
                                            <h4 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-none mt-1">{tenant.name}</h4>
                                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-2">{tenant.house}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-sky-200">
                                            <Icons.User className="text-sky-500" size={20} />
                                        </div>
                                    </div>

                                    {/* Existing system docs (identity + legal from user-level) */}
                                    {(tenant.identity.length > 0 || tenant.legal.length > 0) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {tenant.identity.map((id: any) => (
                                                <div key={id.id} className={`${BENTO_CARD} p-8 bg-white/[0.02] border-white/5 flex flex-col gap-6 relative overflow-hidden group`}>
                                                    {/* Card Header */}
                                                    <div className="flex justify-between items-start relative z-10">
                                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-amber-500 group-hover:bg-amber-400 group-hover:text-black transition-all">
                                                            <Icons.ShieldCheck size={20} />
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${id.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : id.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                                {id.status}
                                                            </span>
                                                            {id.viewedByOwner && (
                                                                <span className="text-[7px] font-black px-2 py-0.5 bg-slate-500/10 text-slate-500 border border-slate-500/20 rounded-md uppercase tracking-widest">
                                                                    Viewed
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Data Card Content */}
                                                    <div className="relative z-10 space-y-4">
                                                        <div>
                                                            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-none">Identity Proof Type</p>
                                                            <h5 className="text-[12px] font-black text-white uppercase tracking-tighter leading-none">{docTypeLabel[id.type] || id.type}</h5>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1 leading-none">Full Name</p>
                                                                <p className="text-[10px] font-black text-white uppercase leading-tight truncate">{id.fullName || 'Unspecified'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1 leading-none">ID Number</p>
                                                                <p className="text-[10px] font-black text-white uppercase leading-tight">{id.number}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1 leading-none">Date of Birth</p>
                                                                <p className="text-[10px] font-black text-white uppercase leading-tight">{id.dateOfBirth || '-- / -- / --'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1 leading-none">Enrolled</p>
                                                                <p className="text-[10px] font-black text-white uppercase leading-tight">{id.uploadDate}</p>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1 leading-none">Permanent Address</p>
                                                            <p className="text-[10px] font-medium text-slate-400 uppercase leading-relaxed line-clamp-2">{id.permanentAddress || 'Not Captured'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="pt-6 border-t border-white/5 relative z-10">
                                                        <div className="flex flex-col gap-3">
                                                            {/* Privacy-aware buttons */}
                                                            <button 
                                                                onClick={() => handleOpenIdentity(id.id, 'front')}
                                                                disabled={openingDoc === id.id || id.viewedByOwner}
                                                                className={`w-full h-12 px-6 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all ${id.viewedByOwner ? 'bg-white/5 text-slate-600 cursor-not-allowed grayscale opacity-40' : 'bg-white text-black hover:bg-amber-400 shadow-xl shadow-amber-400/10'}`}
                                                            >
                                                                {id.viewedByOwner ? <Icons.Lock size={16} /> : <Icons.ExternalLink size={16} />}
                                                                {id.viewedByOwner ? 'Original Viewed (Locked)' : 'Open Front Component'}
                                                            </button>
                                                            
                                                            {id.backDocumentUrl && (
                                                                <button 
                                                                    onClick={() => handleOpenIdentity(id.id, 'back')}
                                                                    disabled={openingDoc === id.id || id.viewedByOwner}
                                                                    className={`w-full h-12 px-6 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all ${id.viewedByOwner ? 'bg-white/5 text-slate-600 cursor-not-allowed grayscale opacity-40' : 'bg-white/5 text-white border border-white/10 hover:bg-white hover:text-black'}`}
                                                                >
                                                                    {id.viewedByOwner ? <Icons.Lock size={16} /> : <Icons.ExternalLink size={16} />}
                                                                    Open Back Component
                                                                </button>
                                                            )}
                                                        </div>

                                                        {id.status === 'PENDING' && (
                                                            <div className="flex gap-3 mt-4">
                                                                <button onClick={() => handleVerify(id.id, 'VERIFIED', true)} className="flex-1 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-black text-[10px] font-black hover:bg-emerald-400 transition-all gap-2 shadow-xl shadow-emerald-500/20"><Icons.Check size={16} />Verify</button>
                                                                <button onClick={() => handleVerify(id.id, 'REJECTED', true)} className="flex-1 h-12 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 text-[10px] font-black hover:bg-rose-500 hover:text-white transition-all gap-2 shadow-xl shadow-rose-500/10"><Icons.X size={16} />Reject</button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Privacy Decoration */}
                                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                                                </div>
                                            ))}
                                            {tenant.legal.map((doc: any) => (
                                                <div key={doc.id} className={`${BENTO_CARD} p-6 bg-white/[0.02] border-white/5`}>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="p-2 bg-white/10 rounded-lg"><Icons.FileText className="text-indigo-400" size={16} /></div>
                                                        <span className={`text-[7px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${doc.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{doc.status}</span>
                                                    </div>
                                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{docTypeLabel[doc.type] || doc.type}</p>
                                                    <p className="text-base font-black text-white italic overflow-hidden text-ellipsis whitespace-nowrap">{doc.name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Per-Unit Document Hub */}
                                    <div className="border-t border-white/5 pt-8">
                                        <p className={`${METRIC_LABEL} mb-6 flex items-center gap-2`}>
                                            <Icons.Archive size={12} />
                                            Unit Document Archive
                                        </p>
                                        <UnitDocHub tenant={tenant} onRefresh={fetchPapers} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* OWNER DOC BUCKETS: DEEDS / TAX / INSURANCE */}
                    {activeBucket !== 'TENANTS' && session.role === UserRole.OWNER && (
                        <div className="space-y-6">
                            {/* For DEEDS or INSURANCE, we iterate over properties */}
                            {(activeBucket === 'DEEDS' || activeBucket === 'INSURANCE') && properties.map(property => {
                                const propDocs = propertyDocsMap[property.id]?.filter((d: any) => 
                                    activeBucket === 'DEEDS' ? d.type === 'PROPERTY_DEED' : d.type === 'INSURANCE_POLICY'
                                ) || [];

                                return (
                                    <div key={property.id} className={`${BENTO_CARD} p-8 flex flex-col gap-6 animate-reveal`}>
                                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-1.5 h-8 bg-amber-400 rounded-full" />
                                                <div>
                                                    <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">{property.name}</h4>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{property.address || 'Property Address Not Available'}</p>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-slate-400">
                                                {activeBucket === 'DEEDS' ? <Icons.Home size={20} /> : <Icons.ShieldCheck size={20} />}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {/* Upload Card for this Property */}
                                            <label className="p-6 border-dashed border-2 border-white/10 rounded-3xl flex flex-col items-center justify-center text-center hover:border-amber-400 hover:bg-white/[0.02] transition-all cursor-pointer group min-h-[160px]">
                                                <input type="file" className="hidden" accept=".pdf,.jpeg,.jpg,.png,.doc"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const type = activeBucket === 'DEEDS' ? 'PROPERTY_DEED' : 'INSURANCE_POLICY';
                                                            const name = prompt('Document Name?', `${property.name} ${activeBucket}`);
                                                            handlePropertyUpload(property.id, file, type, name || undefined);
                                                        }
                                                    }} />
                                                <div className="w-12 h-12 bg-amber-400/10 text-amber-500 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all mb-4">
                                                    {isUploading ? <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /> : <Icons.Plus size={20} />}
                                                </div>
                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-white">Upload New {activeBucket}</h5>
                                            </label>

                                            {/* Existing Documents for this Property */}
                                            {propDocs.map((doc: any) => (
                                                <div key={doc.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:bg-[#00f2ff]/5 hover:border-[#00f2ff]/30 transition-all min-h-[160px] flex flex-col justify-between">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="w-10 h-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-[#00f2ff] group-hover:text-black transition-all">
                                                            <Icons.FileText size={18} />
                                                        </div>
                                                        <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-full">{doc.status}</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[12px] font-black text-white uppercase tracking-tighter truncate group-hover:text-[#00f2ff] transition-colors">{doc.name}</h4>
                                                        <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/5">
                                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{doc.uploadDate}</p>
                                                            <button onClick={() => { setSelectedDoc(doc); setShowModal(true); }}
                                                                className="w-8 h-8 rounded-xl bg-white/5 text-slate-500 flex items-center justify-center hover:bg-[#00f2ff] hover:text-black transition-all">
                                                                <Icons.ArrowRight size={14} />
                                                            </button>
                                                            <button onClick={() => handleGlobalDelete(doc.id)}
                                                                className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20">
                                                                <Icons.Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* For TAX, we keep the global collective view */}
                            {activeBucket === 'TAX' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                    <label className={`${BENTO_CARD} p-10 border-dashed border-2 border-white/10 flex flex-col items-center justify-center text-center space-y-6 hover:border-amber-400 hover:bg-white/[0.02] transition-all cursor-pointer group`}>
                                        <input type="file" className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const name = prompt('Document Name?', activeBucket);
                                                    handleUpload(file, 'TAX_RECEIPT', name || undefined);
                                                }
                                            }} />
                                        <div className="w-20 h-20 bg-amber-400/10 text-amber-500 rounded-[2rem] flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all border border-amber-400/20">
                                            {isUploading ? <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /> : <Icons.Plus size={40} />}
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-black uppercase tracking-widest text-white">Archive New {activeBucket}</h5>
                                            <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wide">Combined Tax & Receipts Upload</p>
                                        </div>
                                    </label>
                                    {filteredDocs.map((doc: any) => (
                                        <div key={doc.id} className={`${BENTO_CARD} p-10 group bg-white/[0.01] hover:bg-white/[0.03] transition-all`}>
                                            <div className="flex justify-between items-start mb-8">
                                                <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-slate-500 group-hover:bg-amber-400 group-hover:text-black transition-all duration-500 border border-white/5">
                                                    <Icons.FileText size={28} />
                                                </div>
                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">Digital Mirror</span>
                                            </div>
                                            <div>
                                                <h4 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-tight">{doc.name}</h4>
                                                <div className="mt-10 flex items-center justify-between pt-8 border-t border-white/5">
                                                    <div>
                                                        <p className={METRIC_LABEL}>Archived Date</p>
                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{doc.uploadDate}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => { setSelectedDoc(doc); setShowModal(true); }}
                                                            className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-amber-400 hover:text-black transition-all border border-white/5">
                                                            <Icons.ArrowRight className="rotate-[-45deg]" size={20} />
                                                        </button>
                                                        <button onClick={() => handleGlobalDelete(doc.id)}
                                                            className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20">
                                                            <Icons.Trash2 size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TENANT BUCKETS */}
                    {session.role !== UserRole.OWNER && activeBucket !== 'TENANTS' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* If IDENTITY and no proofs, show 4 selection cards */}
                            {activeBucket === 'IDENTITY' && identityProofs.length === 0 && (
                                <div className="md:col-span-2 space-y-6 animate-reveal">
                                    <div className="flex items-center gap-4 px-6 py-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl w-fit">
                                        <Icons.ShieldAlert size={16} className="text-amber-500" />
                                        <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em] leading-none">Mandatory Step: Choose One Identification Proof</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {['PASSPORT', 'AADHAAR', 'PAN_CARD', 'DRIVING_LICENSE'].map(type => (
                                            <button 
                                                key={type} 
                                                onClick={() => setShowIdentityForm(type)}
                                                className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center space-y-8 hover:border-[#00f2ff] hover:bg-[#00f2ff]/5 transition-all cursor-pointer group active:scale-95 shadow-xl relative overflow-hidden text-left w-full"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,242,255,0.05)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-slate-500 group-hover:bg-[#00f2ff] group-hover:text-black transition-all duration-500 relative z-10 shadow-[0_0_30px_rgba(0,242,255,0)] group-hover:shadow-[0_0_30px_rgba(0,242,255,0.4)]">
                                                    <Icons.Shield size={28} />
                                                </div>
                                                <div className="relative z-10 w-full">
                                                    <h5 className="text-[14px] font-black uppercase tracking-[0.2em] text-white group-hover:text-[#00f2ff] transition-colors">{docTypeLabel[type] || type}</h5>
                                                    <div className="w-full h-px bg-white/10 my-4 group-hover:bg-[#00f2ff]/30 transition-colors" />
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2">
                                                        <Icons.ArrowRight size={10} /> Select & Fill Details
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Identity Upload Modal/Form */}
                            {showIdentityForm && (
                                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-8 bg-black/95 backdrop-blur-3xl animate-reveal">
                                    <div className={`${BENTO_CARD} w-full max-w-2xl bg-[#0d1015] border-white/10 flex flex-col relative`}>
                                        <div className="p-10 border-b border-white/5 flex justify-between items-center">
                                            <div>
                                                <span className={METRIC_LABEL}>End-to-End Encrypted Upload</span>
                                                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none mt-1">{docTypeLabel[showIdentityForm]} Entry</h3>
                                            </div>
                                            <button onClick={() => { setShowIdentityForm(null); setIdMeta({ fullName: '', dob: '', address: '', number: '', frontFile: null, backFile: null }); }} className="w-12 h-12 bg-white/5 text-slate-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                                                <Icons.X size={20} />
                                            </button>
                                        </div>

                                        <form onSubmit={handleIdentitySubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar max-h-[70vh]">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Full Name (As on ID)</label>
                                                    <input required value={idMeta.fullName} onChange={e => setIdMeta({...idMeta, fullName: e.target.value})} type="text" className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white text-xs font-bold focus:border-[#00f2ff] outline-none transition-all uppercase" placeholder="e.g. Johnathan Doe" />
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Date of Birth</label>
                                                    <input required value={idMeta.dob} onChange={e => setIdMeta({...idMeta, dob: e.target.value})} type="date" className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white text-xs font-bold focus:border-[#00f2ff] outline-none transition-all" />
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Identification Number</label>
                                                    <input required value={idMeta.number} onChange={e => setIdMeta({...idMeta, number: e.target.value})} type="text" className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white text-xs font-bold focus:border-[#00f2ff] outline-none transition-all uppercase" placeholder="e.g. 1234 5678 9012" />
                                                </div>
                                                <div className="md:col-span-2 space-y-4">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Permanent Address (As on ID)</label>
                                                    <textarea required rows={2} value={idMeta.address} onChange={e => setIdMeta({...idMeta, address: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-xs font-bold focus:border-[#00f2ff] outline-none transition-all uppercase resize-none" placeholder="Enter complete address exactly as printed..." />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Front View Attachment</label>
                                                    <label className={`w-full h-32 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all cursor-pointer ${idMeta.frontFile ? 'bg-[#00f2ff]/5 border-[#00f2ff]/30 text-[#00f2ff]' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'}`}>
                                                        <input required type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setIdMeta({...idMeta, frontFile: e.target.files?.[0] || null})} />
                                                        {idMeta.frontFile ? <Icons.Check size={28} /> : <Icons.Upload size={28} />}
                                                        <span className="text-[8px] font-black uppercase tracking-widest mt-2">{idMeta.frontFile ? idMeta.frontFile.name : 'Choose Front View'}</span>
                                                    </label>
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                        Back View Attachment {(showIdentityForm === 'AADHAAR' || showIdentityForm === 'DRIVING_LICENSE') && <span className="text-amber-500">* Mandatory</span>}
                                                    </label>
                                                    <label className={`w-full h-32 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all cursor-pointer ${idMeta.backFile ? 'bg-indigo-500/5 border-indigo-500/30 text-indigo-400' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'}`}>
                                                        <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setIdMeta({...idMeta, backFile: e.target.files?.[0] || null})} />
                                                        {idMeta.backFile ? <Icons.Check size={28} /> : <Icons.Camera size={28} />}
                                                        <span className="text-[8px] font-black uppercase tracking-widest mt-2">{idMeta.backFile ? idMeta.backFile.name : 'Choose Back View'}</span>
                                                    </label>
                                                </div>
                                            </div>

                                            <button disabled={isUploading} type="submit" className="w-full h-16 bg-white text-black rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] hover:bg-[#00f2ff] transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95 shadow-2xl">
                                                {isUploading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Icons.ShieldCheck size={20} />}
                                                Secure Digital Archival
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* LEGAL / VERIFICATIONS Bucket Content */}
                            {activeBucket !== 'IDENTITY' && (
                                <div className="space-y-8">
                                    {/* Upload Trigger */}
                                    <label className={`${BENTO_CARD} p-10 border-dashed border-2 border-white/10 flex flex-col items-center justify-center text-center space-y-6 hover:border-amber-400 hover:bg-white/[0.02] transition-all cursor-pointer group`}>
                                        <input type="file" className="hidden" accept=".pdf,.docx,.doc"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const type = activeBucket === 'LEGAL' ? 'LEASE_AGREEMENT' : 'POLICE_VERIFICATION';
                                                    const name = prompt('Document Name?', activeBucket);
                                                    handleUpload(file, type, name || undefined);
                                                }
                                            }} />
                                        <div className="w-20 h-20 bg-amber-400/10 text-amber-500 rounded-[2rem] flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all border border-amber-400/20">
                                            {isUploading ? <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /> : <Icons.Plus size={40} />}
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-black uppercase tracking-widest text-white">Archive New {activeBucket}</h5>
                                            <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wide">Secure Blockchain Sync Required</p>
                                        </div>
                                    </label>

                                    {/* Document Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                                        {filteredDocs.map((doc: any) => (
                                            <div key={doc.id} className={`${BENTO_CARD} p-10 group bg-white/[0.01]`}>
                                                <div className="flex justify-between items-start mb-8">
                                                    <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-slate-500 group-hover:bg-amber-400 group-hover:text-black transition-all duration-500 border border-white/5">
                                                        <Icons.FileText size={28} />
                                                    </div>
                                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">Digital Mirror</span>
                                                </div>
                                                <h4 className="text-2xl font-black text-white uppercase tracking-tighter italic">{doc.name}</h4>
                                                <div className="mt-10 flex items-center justify-between pt-8 border-t border-white/5">
                                                    <div>
                                                        <p className={METRIC_LABEL}>Archived</p>
                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{doc.uploadDate}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => { setSelectedDoc(doc); setShowModal(true); }}
                                                            className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-amber-400 hover:text-black transition-all border border-white/5">
                                                            <Icons.ArrowRight className="rotate-[-45deg]" size={20} />
                                                        </button>
                                                        <button onClick={() => handleGlobalDelete(doc.id)}
                                                            className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20">
                                                            <Icons.Trash2 size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Verified Identity Proofs - Moved outside for clarity */}
                            {activeBucket === 'IDENTITY' && identityProofs.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {identityProofs.map((proof) => (
                                        <div key={proof.id} className={`${BENTO_CARD} p-10 flex flex-col justify-between group bg-white/[0.01] animate-reveal relative overflow-hidden`}>
                                            <div className="flex justify-between items-start">
                                                <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center border border-white/5 group-hover:bg-[#00f2ff] group-hover:text-black transition-all duration-500">
                                                    <Icons.ShieldCheck size={28} />
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${proof.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : proof.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                        {proof.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-12 space-y-6">
                                                <div>
                                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 leading-none">{docTypeLabel[proof.type] || proof.type}</p>
                                                    <h4 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">{proof.number}</h4>
                                                </div>
                                                <div className="flex items-center justify-between border-t border-white/5 pt-6">
                                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Enrolled {proof.uploadDate as unknown as string}</p>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => { setSelectedDoc(proof); setShowModal(true); }}
                                                            className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-600 hover:bg-[#00f2ff] hover:text-black transition-all">
                                                            <Icons.ArrowRight size={16} />
                                                        </button>
                                                        <button onClick={() => handleGlobalDelete(proof.id, true)}
                                                            className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20">
                                                            <Icons.Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {showModal && <DocumentPreviewModal doc={selectedDoc} onClose={() => setShowModal(false)} />}
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    <div className={`${BENTO_CARD} p-12 bg-amber-400 text-black border-none relative overflow-hidden`}>
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-black/5 rounded-full blur-3xl" />
                        <span className="text-[10px] font-black text-black/50 uppercase tracking-[0.5em] mb-4 block leading-none">Trust Engine Score</span>
                        <h3 className="text-8xl font-black tracking-tighter leading-none italic">{session.role === UserRole.OWNER ? '9.9' : '9.8'}<span className="text-3xl text-black/40 not-italic">/10</span></h3>
                        <p className="mt-10 text-sm font-black leading-tight uppercase tracking-tight opacity-70">Strategic verification complete. All assets synchronized with blockchain validator.</p>
                        <div className="mt-12 h-2 w-full bg-black/10 rounded-full overflow-hidden">
                            <div className="h-full bg-black animate-pulse-slow" style={{ width: session.role === UserRole.OWNER ? '99%' : '98%' }} />
                        </div>
                    </div>

                    <div className={`${BENTO_CARD} p-12 bg-white/[0.02]`}>
                        <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-10 italic">Security Protocol</h4>
                        <div className="space-y-8">
                            {[
                                { label: 'Blockchain Lock', status: 'ENTROPY-X', color: 'text-emerald-400' },
                                { label: 'Encryption Mode', status: 'AES-QUAD', color: 'text-amber-400' },
                                { label: 'Cloud Mirroring', status: 'SYNCED', color: 'text-emerald-400' },
                                { label: 'Quantum Shield', status: 'ACTIVE', color: 'text-indigo-400' },
                            ].map((s, i) => (
                                <div key={i} className="flex justify-between items-center border-b border-white/5 pb-6 last:border-0 last:pb-0">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{s.label}</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${s.color}`}>{s.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
