import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Property, Unit, UserSession, UserRole, UnitStatus } from '../types';
import { BENTO_CARD, METRIC_LABEL, Icons } from '../App';
import { api } from '../services/apiService';

interface MySanctuaryViewProps {
    session: UserSession;
}

interface AddAssetWizardProps {
    onSuccess: () => void;
    onCancel: () => void;
}

const InfoTooltip = ({ text }: { text: string }) => {
    const [visible, setVisible] = useState(false);
    const [tooltipCoords, setTooltipCoords] = useState<{ top: number; left: number; arrowStyle: React.CSSProperties; align: 'center' | 'left' | 'right' }>({ top: 0, left: 0, arrowStyle: {}, align: 'center' });
    const iconRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (iconRef.current) {
            const rect = iconRef.current.getBoundingClientRect();
            const tooltipWidth = 240;
            
            let left = rect.left + rect.width / 2;
            let align: 'center' | 'left' | 'right' = 'center';
            let arrowStyle: React.CSSProperties = { left: '50%', transform: 'translateX(-50%)' };

            // Edge cases for screen boundaries
            if (left + tooltipWidth / 2 > window.innerWidth - 20) {
                left = rect.right;
                align = 'right';
                arrowStyle = { right: '16px', left: 'auto', transform: 'none' };
            } else if (left - tooltipWidth / 2 < 20) {
                left = rect.left;
                align = 'left';
                arrowStyle = { left: '16px', transform: 'none' };
            }

            setTooltipCoords({
                top: rect.top - 12, // Above the icon
                left: left,
                align,
                arrowStyle
            });
        }
        setVisible(true);
    };

    const tooltipContent = visible && (
        <div
            className="fixed w-60 p-4 bg-white border border-slate-200 rounded-2xl text-[10px] text-slate-700 font-bold leading-relaxed z-[10000] shadow-xl shadow-black/10 text-left tracking-normal normal-case animate-reveal"
            style={{
                top: tooltipCoords.top,
                left: tooltipCoords.left,
                transform: `translate(${tooltipCoords.align === 'center' ? '-50%' : tooltipCoords.align === 'right' ? '-100%' : '0'}, -100%)`,
                pointerEvents: 'none'
            }}
        >
            <div className="flex items-start gap-2">
                <Icons.Activity className="text-amber-500 shrink-0 mt-0.5" size={12} />
                <span>{text}</span>
            </div>
            <div 
                className="absolute top-full border-[6px] border-transparent border-t-white"
                style={tooltipCoords.arrowStyle}
            />
            <div 
                className="absolute top-full border-[7px] border-transparent border-t-slate-200 -z-10"
                style={{...tooltipCoords.arrowStyle, top: '100%'}}
            />
        </div>
    );

    return (
        <div
            ref={iconRef}
            className="relative inline-flex items-center justify-center shrink-0"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setVisible(false)}
        >
            <span className={`w-[16px] h-[16px] rounded-full flex items-center justify-center cursor-help border transition-all duration-200 ${visible ? 'border-amber-400 bg-amber-400/20' : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-white/5 hover:border-slate-500'}`}>
                <span className={`text-[9px] font-black italic mt-[-1px] ${visible ? 'text-amber-400' : 'text-slate-600'}`}>i</span>
            </span>
            {visible && createPortal(tooltipContent, document.body)}
        </div>
    );
};

const AddAssetWizard: React.FC<AddAssetWizardProps> = ({ onSuccess, onCancel }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [assetError, setAssetError] = useState<string | null>(null);
    const [deployedProperty, setDeployedProperty] = useState<Property | null>(null);
    const [propertyData, setPropertyData] = useState<Partial<Property>>({
        name: '', address: '', type: 'APARTMENT' as any, valuation: 0, cctvCount: 0, rules: '',
        waterSupplyType: 'Municipal', waterAvailability: '24/7', maintenanceAmount: 0,
        maintenanceFrequency: 'Monthly', parkingType: 'Covered', parkingSlots: 0,
        securityGuardStatus: 'None', biometricAccess: false, fireSafety: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAssetError(null);
        if (step < 3) {
            setStep(step + 1);
            return;
        }
        setLoading(true);
        try {
            const result = await api.createProperty(propertyData);
            setDeployedProperty(result);
            setStep(4);
        } catch (err: any) {
            console.error(err);
            const msg: string = err?.message || 'Failed to register property.';
            setAssetError(msg.includes('Failed to fetch') ? 'System Link Failure: Connection timeout.' : msg);
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full bg-white border-2 border-slate-200 p-6 rounded-[1.5rem] outline-none text-slate-900 focus:border-violet-400 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.08)] transition-all font-bold placeholder:text-slate-400";
    const selectClasses = "w-full bg-white border-2 border-slate-200 p-6 rounded-[1.5rem] outline-none text-slate-900 focus:border-violet-400 transition-all font-bold appearance-none cursor-pointer";

    return (
        <div className="space-y-12 animate-reveal">
            <div className="flex justify-between items-end">
                <div>
                    <span className={METRIC_LABEL}>Asset Integration Protocol • {step === 4 ? 'Status: Successful' : `Step ${step}/3`}</span>
                    <h2 className="text-6xl font-black tracking-tighter text-slate-900 uppercase leading-none italic">
                        {step === 4 ? 'Deployed' : 'Deploy'}<br /><span className="text-amber-500 not-italic">{step === 4 ? 'Integrated' : 'Asset'}</span>
                    </h2>
                </div>
                <div className="flex gap-4">
                    {step > 1 && step < 4 && (
                        <button
                            type="button" onClick={() => setStep(step - 1)}
                            className="px-8 py-4 border border-slate-300 text-slate-700 rounded-[1.5rem] font-black uppercase text-[9px] tracking-widest hover:bg-slate-100 transition-all"
                        >
                            Previous Phase
                        </button>
                    )}
                    <button
                        type="button" onClick={onCancel}
                        className={`px-8 py-4 border rounded-[1.5rem] font-black uppercase text-[9px] tracking-widest transition-all ${step === 4 ? 'border-amber-400/50 text-amber-500' : 'border-rose-500/20 text-rose-500 hover:bg-rose-500/5'}`}
                    >
                        {step === 4 ? 'Close Wizard' : 'Abort Protocol'}
                    </button>
                </div>
            </div>

            <div className={`${BENTO_CARD} p-12 relative overflow-hidden bg-lime-50 dark:bg-[#0a0c10] border-lime-100 dark:border-white/5`}>
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
                    <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${(Math.min(step, 3) / 3) * 100}%` }} />
                </div>

                <form onSubmit={handleSubmit} className="space-y-12 mt-4">
                    {step === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-reveal">
                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Asset Designation</span><InfoTooltip text="The official or marketing name for the entire building/complex." /></div>
                                    <input type="text" required value={propertyData.name} onChange={e => setPropertyData({ ...propertyData, name: e.target.value })} className={inputClasses} placeholder="e.g. Skyline Heights" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Asset Classification</span><InfoTooltip text="Categorizes the physical structure and zoning for optimized management." /></div>
                                    <select value={propertyData.type} onChange={e => setPropertyData({ ...propertyData, type: e.target.value as any })} className={selectClasses}>
                                        <option value="APARTMENT">Apartment Complex</option>
                                        <option value="VILLA">Luxury Villa</option>
                                        <option value="STUDIO">Executive Studio</option>
                                        <option value="INDEPENDENT_HOUSE">Independent House</option>
                                        <option value="COMMERCIAL">Commercial Hub</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Geographical Origin</span><InfoTooltip text="The precise legal address used for tax, utility, and insurance filings." /></div>
                                    <textarea required value={propertyData.address} onChange={e => setPropertyData({ ...propertyData, address: e.target.value })} className={`${inputClasses} min-h-[160px] resize-none`} placeholder="Full legal address..." />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-reveal">
                            <div className="space-y-10">
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Hydration Source</span><InfoTooltip text="Primary water supply infrastructure connected to the property." /></div>
                                        <select value={propertyData.waterSupplyType} onChange={e => setPropertyData({ ...propertyData, waterSupplyType: e.target.value })} className={selectClasses}>
                                            <option value="Municipal">Municipal Corp</option>
                                            <option value="Borewell">Borewell</option>
                                            <option value="Tanker">Private Tanker</option>
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Flow Cycle</span><InfoTooltip text="Availability pattern for the primary hydration source." /></div>
                                        <select value={propertyData.waterAvailability} onChange={e => setPropertyData({ ...propertyData, waterAvailability: e.target.value })} className={selectClasses}>
                                            <option value="24/7">24/7 Uninterrupted</option>
                                            <option value="Scheduled">Scheduled Cycles</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Maintenance (₹)</span><InfoTooltip text="Capital required per cycle for building upkeep and common areas." /></div>
                                        <input type="number" value={propertyData.maintenanceAmount} onChange={e => setPropertyData({ ...propertyData, maintenanceAmount: parseInt(e.target.value) })} className={inputClasses} />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Billing Interval</span><InfoTooltip text="Frequency of maintenance capital collection from units." /></div>
                                        <select value={propertyData.maintenanceFrequency} onChange={e => setPropertyData({ ...propertyData, maintenanceFrequency: e.target.value })} className={selectClasses}>
                                            <option value="Monthly">Monthly Cycle</option>
                                            <option value="Quarterly">Quarterly Cycle</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-10">
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Parking Framework</span><InfoTooltip text="Structural configuration for asset parking infrastructure." /></div>
                                        <select value={propertyData.parkingType} onChange={e => setPropertyData({ ...propertyData, parkingType: e.target.value })} className={selectClasses}>
                                            <option value="Covered">Subterranean/Covered</option>
                                            <option value="Open">Surface Level/Open</option>
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Storage Capacity</span><InfoTooltip text="Total number of dedicated parking bays available across the asset." /></div>
                                        <input type="number" value={propertyData.parkingSlots} onChange={e => setPropertyData({ ...propertyData, parkingSlots: parseInt(e.target.value) })} className={inputClasses} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Asset Valuation (₹)</span><InfoTooltip text="Estimated current market capital value for performance tracking." /></div>
                                    <input type="number" value={propertyData.valuation} onChange={e => setPropertyData({ ...propertyData, valuation: parseInt(e.target.value) })} className={inputClasses} />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-reveal">
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-2"><span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Active Vigilance (Access)</span><InfoTooltip text="High-integrity access protocols to secure the asset perimeter." /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button type="button" onClick={() => setPropertyData({ ...propertyData, biometricAccess: !propertyData.biometricAccess })} className={`w-full p-6 rounded-2xl border-2 transition-all relative ${propertyData.biometricAccess ? 'bg-amber-400 border-amber-400 text-black' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                            <Icons.Fingerprint size={20} />
                                            <span className="text-[10px] font-black uppercase block mt-2">Biometrics</span>
                                            <div className="absolute top-2 right-2"><InfoTooltip text="Encryption-based fingerprint/facial scanning for entry." /></div>
                                        </button>
                                        <button type="button" onClick={() => setPropertyData({ ...propertyData, fireSafety: !propertyData.fireSafety })} className={`w-full p-6 rounded-2xl border-2 transition-all relative ${propertyData.fireSafety ? 'bg-rose-500 border-rose-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                            <Icons.ShieldAlert size={20} />
                                            <span className="text-[10px] font-black uppercase block mt-2">Fire Protocols</span>
                                            <div className="absolute top-2 right-2"><InfoTooltip text="Certified fire suppression and alarm systems installed." /></div>
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-2"><span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Physical Sentinels</span><InfoTooltip text="On-site human security personnel (Guards/Watchmen) current status." /></div>
                                        <select value={propertyData.securityGuardStatus} onChange={e => setPropertyData({ ...propertyData, securityGuardStatus: e.target.value })} className={selectClasses}>
                                            <option value="None">Automated Security Only</option>
                                            <option value="Daytime">Daytime Personnel</option>
                                            <option value="24/7">24/7 Multi-Shift Vigilance</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-2"><span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">CCTV Coverage</span><InfoTooltip text="Total node count for the security camera monitoring network." /></div>
                                        <input type="number" value={propertyData.cctvCount} onChange={e => setPropertyData({ ...propertyData, cctvCount: parseInt(e.target.value) })} className={inputClasses} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-2"><span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Sovereign Rules (Delimited)</span><InfoTooltip text="Core behavioral directives for the property. Use semicolons to separate rules." /></div>
                                    <textarea value={propertyData.rules} onChange={e => setPropertyData({ ...propertyData, rules: e.target.value })} className={`${inputClasses} min-h-[160px] resize-none text-sm font-bold uppercase tracking-widest`} placeholder="e.g. No heavy vehicles; Quiet hours 10PM..." />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && deployedProperty && (
                        <div className="space-y-12 animate-reveal py-10">
                            <div className="flex flex-col items-center text-center space-y-8">
                                <div className="w-24 h-24 bg-emerald-500/10 text-emerald-400 rounded-[2rem] flex items-center justify-center border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                                    <Icons.ShieldCheck size={48} />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Sanctuary Expansion Complete</h3>
                                    <p className="text-slate-400 text-sm max-w-sm mx-auto font-medium leading-relaxed">
                                        Asset <span className="text-amber-400 font-black">{deployedProperty.name}</span> is officially integrated into the central management protocol.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-y border-slate-200 py-12">
                                <div className="p-8 bg-amber-50 rounded-3xl border border-amber-100">
                                    <p className={METRIC_LABEL}>Registry ID (UUID)</p>
                                    <p className="text-[10px] font-mono text-amber-600 truncate uppercase">{deployedProperty.id}</p>
                                </div>
                                <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-100">
                                    <p className={METRIC_LABEL}>Asset Valuation</p>
                                    <p className="text-2xl font-black text-slate-900">₹{deployedProperty.valuation?.toLocaleString()}</p>
                                </div>
                            </div>

                            <button type="button" onClick={onSuccess} className="w-full py-8 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[12px] tracking-[0.4em] hover:bg-amber-400 hover:text-black active:scale-95 transition-all shadow-xl flex items-center justify-center gap-4">
                                Initialize Management Interface <Icons.ArrowRight size={20} />
                            </button>
                        </div>
                    )}

                    {step < 4 && (
                    <div className="pt-12 border-t border-slate-200 flex flex-col gap-4">
                        {assetError && (
                            <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                                <Icons.AlertTriangle className="text-rose-500 mt-0.5 shrink-0" size={18} />
                                <span className="text-[11px] font-medium text-rose-600 leading-relaxed">{assetError}</span>
                            </div>
                        )}
                        <button type="submit" disabled={loading} className="w-full py-8 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] hover:bg-amber-400 hover:text-black hover:scale-[1.01] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-4">
                            {loading ? <div className="w-5 h-5 border-4 border-current border-t-transparent rounded-full animate-spin" /> : <><Icons.Activity size={18} /> {step === 3 ? 'Finalize Asset Deployment' : 'Proceed to Phase ' + (step + 1)}</>}
                        </button>
                    </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export const MySanctuaryView: React.FC<MySanctuaryViewProps> = ({ session }) => {
    const navigate = useNavigate();
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingProperty, setIsAddingProperty] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

    const loadProperties = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getProperties();
            setProperties(data);
            if (data.length > 0) {
                if (!selectedProperty || !data.find(p => p.id === selectedProperty.id)) {
                    setSelectedProperty(data[0]);
                } else {
                    const updated = data.find(p => p.id === selectedProperty.id);
                    if (updated) setSelectedProperty(updated);
                }
            } else {
                setSelectedProperty(null);
            }
        } catch (err) {
            console.error('Failed to load properties', err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedProperty]);

    useEffect(() => { loadProperties(); }, []);

    const [isAddingUnit, setIsAddingUnit] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [viewingUnit, setViewingUnit] = useState<Unit | null>(null);
    const [loading, setLoading] = useState(false);
    const [unitData, setUnitData] = useState<Partial<Unit>>({ 
        name: '', rent: 0, deposit: 0, bhkCount: 1, sqFt: 500, bathrooms: 1, 
        furnishedStatus: 'UNFURNISHED', agreementType: 'RENTAL', 
        leaseAmount: 0, leaseTenure: 12 
    });
    const [isOccupied, setIsOccupied] = useState(false);
    const [tenantData, setTenantData] = useState({ firstName: '', lastName: '', email: '', phone: '', location: '', occupation: '', occupantsCount: 1, emergencyContactName: '', emergencyContactNumber: '', leaseStartDate: new Date().toISOString().split('T')[0], leaseEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], rentDueDate: new Date(new Date().setDate(5)).toISOString().split('T')[0] });
    const [credentials, setCredentials] = useState<{ email: string, generatedPassword?: string } | null>(null);

    useEffect(() => {
        if (selectedUnit) {
            setUnitData({
                name: selectedUnit.name,
                unitType: selectedUnit.unitType,
                sqFt: selectedUnit.sqFt,
                furnishedStatus: selectedUnit.furnishedStatus,
                rent: selectedUnit.rent,
                deposit: selectedUnit.deposit,
                status: selectedUnit.status,
                agreementType: selectedUnit.agreementType || 'RENTAL',
                leaseAmount: selectedUnit.leaseAmount || 0,
                leaseTenure: selectedUnit.leaseTenure || 12
            });
            setIsOccupied(selectedUnit.status === 'OCCUPIED' || !!selectedUnit.tenant);
            
            if ((selectedUnit.status === 'OCCUPIED' || !!selectedUnit.tenant) && selectedUnit.tenant) {
                const nameParts = (selectedUnit.tenant.name || '').split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';
                
                setTenantData({
                    firstName,
                    lastName,
                    email: selectedUnit.tenant.email || '',
                    phone: selectedUnit.tenant.mobileNumber || '',
                    location: selectedUnit.tenant.location || '',
                    occupation: selectedUnit.tenant.occupation || '',
                    occupantsCount: selectedUnit.occupantsCount || 1,
                    emergencyContactName: selectedUnit.tenant.emergencyContactName || '',
                    emergencyContactNumber: selectedUnit.tenant.emergencyContactNumber || '',
                    leaseStartDate: selectedUnit.lastFilledDate || new Date().toISOString().split('T')[0],
                    leaseEndDate: selectedUnit.leaseEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                    rentDueDate: selectedUnit.rentDueDate || new Date(new Date().setDate(5)).toISOString().split('T')[0]
                });
            } else {
                setTenantData({ 
                    firstName: '', lastName: '', email: '', phone: '', location: '', occupation: '', 
                    occupantsCount: 1, emergencyContactName: '', emergencyContactNumber: '', 
                    leaseStartDate: new Date().toISOString().split('T')[0], 
                    leaseEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], 
                    rentDueDate: new Date(new Date().setDate(5)).toISOString().split('T')[0] 
                });
            }
            setIsAddingUnit(true);
        }
    }, [selectedUnit]);

    const handleAddUnit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProperty) return;

        const isDuplicate = selectedProperty.units.some(u => 
            u.name.toLowerCase() === unitData.name?.toLowerCase() && u.id !== selectedUnit?.id
        );
        if (isDuplicate) {
            alert(`CRITICAL ERROR: A unit with the name "${unitData.name}" already exists in ${selectedProperty.name}. Each unit must have a unique identifier.`);
            return;
        }

        setLoading(true);
        try {
            const finalUnitData = { 
                ...unitData, 
                status: isOccupied ? 'OCCUPIED' as UnitStatus : 'VACANT' as UnitStatus,
                rent: unitData.agreementType === 'RENTAL' ? unitData.rent : 0,
                deposit: unitData.agreementType === 'RENTAL' ? unitData.deposit : 0,
                leaseAmount: unitData.agreementType === 'LEASE' ? unitData.leaseAmount : 0,
                leaseTenure: unitData.agreementType === 'LEASE' ? unitData.leaseTenure : 0
            };
            let unit;
            if (selectedUnit) {
                unit = await api.updateUnit(selectedUnit.id, finalUnitData);
            } else {
                unit = await api.addUnit(selectedProperty.id, finalUnitData);
            }

            if (isOccupied) {
                const onboardReq = { ...tenantData, rentAmount: unitData.rent || 0, depositAmount: unitData.deposit || 0 };
                const res = await api.onboardTenant(unit.id, onboardReq);
                setCredentials({ email: res.email, generatedPassword: res.generatedPassword });
            } else {
                setIsAddingUnit(false);
                setSelectedUnit(null);
            }
            await loadProperties();
        } catch (err) {
            console.error(err);
            alert('Operation failed. Please verify credentials and network.');
        } finally {
            setLoading(false);
        }
    };

    if (isLoading && properties.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center animate-pulse">
                    <Icons.Home className="text-slate-300" size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest text-center">Synchronizing Your<br />Empire</h3>
            </div>
        );
    }

    const inputClasses = "w-full bg-white border-2 border-slate-200 p-4 rounded-2xl outline-none text-slate-900 focus:border-violet-400 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.08)] transition-all font-bold text-sm placeholder:text-slate-400";

    return (
        <div className="space-y-12 animate-reveal">
            {viewingUnit && (
                <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className={`${BENTO_CARD} bg-white border-emerald-300 p-10 max-w-4xl w-full relative max-h-[90vh] overflow-y-auto`}>
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-3xl font-black uppercase text-slate-900 dark:text-white tracking-tighter italic">Unit Details: {viewingUnit.name}</h3>
                                <p className="text-slate-400 mt-2 text-[10px] font-black tracking-widest uppercase">{viewingUnit.unitType || 'Unassigned Type'} • {viewingUnit.sqFt || '??'} SQ FT • {viewingUnit.furnishedStatus?.replace('_', ' ')}</p>
                            </div>
                            <button onClick={() => setViewingUnit(null)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-full transition-all border border-slate-300">
                                <Icons.X size={20} className="text-slate-900" />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="p-6 bg-violet-50 border border-violet-100 rounded-2xl">
                                <h4 className="text-xl font-black text-slate-900 uppercase italic mb-6">Agreement Protocol: {viewingUnit.agreementType || 'RENTAL'}</h4>
                                <div className="space-y-6">
                                    {viewingUnit.agreementType === 'LEASE' ? (
                                        <>
                                            <div><p className={METRIC_LABEL}>Total Lease Amount</p><p className="text-3xl font-black text-amber-500 mt-1">₹{(viewingUnit.leaseAmount || 0).toLocaleString()}</p></div>
                                            <div><p className={METRIC_LABEL}>Lease Tenure</p><p className="text-xl font-black text-slate-600 mt-1">{viewingUnit.leaseTenure || 0} Months</p></div>
                                        </>
                                    ) : (
                                        <>
                                            <div><p className={METRIC_LABEL}>Monthly Rent</p><p className="text-3xl font-black text-slate-900 mt-1">₹{(viewingUnit.rent || 0).toLocaleString()}</p></div>
                                            <div><p className={METRIC_LABEL}>Security Deposit</p><p className="text-xl font-black text-slate-500 mt-1">₹{(viewingUnit.deposit || 0).toLocaleString()}</p></div>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            <div className="p-6 bg-sky-50 border border-sky-100 rounded-2xl">
                                <h4 className="text-xl font-black text-slate-900 uppercase italic mb-6 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center"><Icons.UserCheck className="text-amber-500" size={16} /></div>
                                    Active Occupant
                                </h4>
                                {viewingUnit.tenant ? (
                                    <div className="space-y-4">
                                        <div><p className={METRIC_LABEL}>Name</p><p className="text-lg font-black text-amber-600 uppercase mt-1 px-2 py-1 bg-amber-50 rounded-md inline-block border border-amber-100">{viewingUnit.tenant.name}</p></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><p className={METRIC_LABEL}>Email</p><p className="text-xs font-bold text-slate-500 mt-1 lowercase italic">{viewingUnit.tenant.email}</p></div>
                                            <div><p className={METRIC_LABEL}>Mobile</p><p className="text-xs font-bold text-slate-500 mt-1">{viewingUnit.tenant.mobileNumber || 'N/A'}</p></div>
                                        </div>
                                        <div><p className={METRIC_LABEL}>Lease Period</p><p className="text-xs font-bold text-emerald-600 mt-1 bg-emerald-50 px-3 py-1.5 rounded-lg inline-block border border-emerald-100">{viewingUnit.lastFilledDate ? new Date(viewingUnit.lastFilledDate).toLocaleDateString() : '??'} - {viewingUnit.leaseEndDate ? new Date(viewingUnit.leaseEndDate).toLocaleDateString() : '??'}</p></div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-40 py-8 min-h-[150px]">
                                        <Icons.User size={40} className="mb-4 text-emerald-500" />
                                        <p className="text-[12px] font-black uppercase tracking-[0.3em] text-emerald-400">Unit is Vacant</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {viewingUnit.tenantHistories && viewingUnit.tenantHistories.length > 0 && (
                            <div className="mt-4 pt-8 border-t border-slate-200">
                                <h4 className="text-xl font-black text-slate-900 uppercase italic mb-6 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><Icons.History className="text-slate-400" size={16} /></div>
                                    Sanctuary: Historical Occupants
                                </h4>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {viewingUnit.tenantHistories.map(history => (
                                        <div key={history.id} className="p-5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{history.tenantName}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold lowercase opacity-70 italic mt-0.5">{history.tenantEmail} • {history.tenantPhone}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest italic leading-none bg-amber-500/10 px-2 py-1 rounded">Archived</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-3 mt-1">
                                                <div>
                                                    <p className={METRIC_LABEL}>Lease Period & Protocol</p>
                                                    <p className="text-[10px] font-black text-slate-400 mt-1">
                                                        {new Date(history.leaseStartDate).toLocaleDateString()} - {new Date(history.leaseEndDate).toLocaleDateString()}
                                                        <span className="ml-2 text-amber-500/80">[{history.agreementType || 'RENTAL'}]</span>
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={METRIC_LABEL}>Final Yield / Capital</p>
                                                    <p className="text-[11px] font-black text-slate-900 dark:text-white mt-1">
                                                        ₹{(history.agreementType === 'LEASE' ? history.leaseAmount : history.rent)?.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {credentials && (
                <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className={`${BENTO_CARD} bg-white border-amber-200 p-10 max-w-lg w-full relative`}>
                        <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center mb-6"><Icons.ShieldCheck size={32} /></div>
                        <h3 className="text-3xl font-black uppercase text-slate-900 tracking-tighter italic">Credentials Generated</h3>
                        <p className="text-slate-500 mt-2 text-sm leading-relaxed">High-integrity tenant binding successful. Securely share these access protocols.</p>
                        <div className="mt-8 space-y-4">
                            <div><p className={METRIC_LABEL}>Access Email</p><div className="p-4 bg-violet-50 border border-violet-200 rounded-xl mt-1 font-mono text-violet-600">{credentials.email}</div></div>
                            <div><p className={METRIC_LABEL}>Security Passkey</p><div className="p-4 bg-rose-50 border border-rose-200 rounded-xl mt-1 font-mono text-rose-700 text-lg">{credentials.generatedPassword}</div></div>
                        </div>
                        <button onClick={() => { setCredentials(null); setIsAddingUnit(false); setSelectedUnit(null); }} className="w-full mt-8 py-4 bg-amber-400 text-black rounded-2xl font-black uppercase tracking-widest text-[10px]">Acknowledge & Close</button>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-end">
                <div>
                    <span className={METRIC_LABEL}>Real Estate Empire • Strategic Sovereignty</span>
                    <h2 className="text-6xl font-black tracking-tighter text-slate-900 uppercase leading-none italic">My<br /><span className="text-amber-500 not-italic">Sanctuary</span></h2>
                </div>
                {properties.length > 0 && !isAddingProperty && (
                    <button onClick={() => setIsAddingProperty(true)} className="px-8 py-4 bg-amber-400 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all flex items-center gap-2"><Icons.Plus size={16} /> Expand Empire</button>
                )}
            </div>

            {isAddingProperty ? (
                <AddAssetWizard onSuccess={() => { setIsAddingProperty(false); loadProperties(); }} onCancel={() => setIsAddingProperty(false)} />
            ) : properties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-reveal">
                    <div className="w-32 h-32 bg-amber-400/10 rounded-[3rem] flex items-center justify-center mt-10 mb-10 border border-amber-400/20 mx-auto group hover:scale-110 transition-all"><Icons.Home className="text-amber-500" size={56} /></div>
                    <h3 className="text-5xl font-black uppercase text-slate-900 dark:text-white tracking-tighter mb-6">Strategic Expansion Required</h3>
                    <p className="max-w-xl mx-auto text-slate-400 font-medium text-lg leading-relaxed mb-12">Deploy your first asset to unlock real-time yield tracking, tenant deep profiling, and the Sanctuary Management console.</p>
                    <button onClick={() => setIsAddingProperty(true)} className="mx-auto px-12 py-6 bg-amber-400 text-black rounded-3xl font-black uppercase tracking-[0.2em] text-[12px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-4"><Icons.Plus size={20} /> Deploy First Asset</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-3 space-y-6">
                        <p className={METRIC_LABEL}>Managed Assets ({properties.length})</p>
                        {properties.map((p, idx) => {
                            const propTints = [
                                'bg-violet-50 border-violet-200 hover:bg-violet-100',
                                'bg-sky-50 border-sky-200 hover:bg-sky-100',
                                'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
                                'bg-amber-50 border-amber-200 hover:bg-amber-100',
                            ];
                            const tint = selectedProperty?.id === p.id ? '' : propTints[idx % propTints.length];
                            return (
                            <button key={p.id} onClick={() => setSelectedProperty(p)} className={`rounded-[4rem] border w-full p-8 text-left transition-all ${selectedProperty?.id === p.id ? 'bg-amber-400 border-amber-400 shadow-lg shadow-amber-200' : `${tint} shadow-sm`}`}>
                                <h4 className={`text-xl font-black uppercase tracking-tighter italic ${selectedProperty?.id === p.id ? 'text-black' : 'text-slate-900'}`}>{p.name}</h4>
                                <p className={`text-[9px] font-black uppercase tracking-widest mt-2 ${selectedProperty?.id === p.id ? 'text-black/60' : 'text-slate-500'}`}>{p.units.length} Units • {p.type}</p>
                            </button>
                            );
                        })}
                    </div>

                    <div className="lg:col-span-9 space-y-10">
                        {selectedProperty ? (
                            <>
                                <div className={`${BENTO_CARD} p-10 bg-sky-50 dark:bg-white/[0.03] border-sky-100 dark:border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-8 shadow-sm`}>
                                    <div><p className={METRIC_LABEL}>Water Supply</p><div className="flex items-center gap-2 mt-2"><Icons.Droplets className="text-blue-500" size={14} /><span className="text-[10px] font-black text-slate-900 uppercase">{selectedProperty.waterSupplyType}</span></div></div>
                                    <div><p className={METRIC_LABEL}>Parking Spaces</p><div className="flex items-center gap-2 mt-2"><Icons.Car className="text-amber-500" size={14} /><span className="text-[10px] font-black text-slate-900 uppercase">{selectedProperty.parkingSlots} Slots</span></div></div>
                                    <div><p className={METRIC_LABEL}>Security</p><div className="flex items-center gap-2 mt-2"><Icons.ShieldCheck className="text-emerald-500" size={14} /><span className="text-[10px] font-black text-slate-900 uppercase">{selectedProperty.securityGuardStatus}</span></div></div>
                                    <div><p className={METRIC_LABEL}>Monthly Maintenance</p><div className="flex items-center gap-2 mt-2"><Icons.Zap className="text-amber-500" size={14} /><span className="text-[10px] font-black text-slate-900 uppercase">₹{selectedProperty.maintenanceAmount}</span></div></div>
                                </div>

                                <div className="flex justify-between items-center py-6 border-b border-slate-200 bg-slate-50 px-8 -mx-8">
                                    <div className="flex items-center gap-8">
                                        <div className="space-y-1">
                                            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Unit Management</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black uppercase text-amber-500 tracking-widest">{selectedProperty.registryId || 'IN_GENERATION'}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{selectedProperty.name}</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/owner/properties/${selectedProperty.id}`)}
                                            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-400 hover:text-black hover:border-amber-300 transition-all mt-1"
                                        >
                                            Property dashboard
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                if (confirm(`PERMANENT DELETION PROTOCOL: Are you sure you want to delete the entire property "${selectedProperty.name}" and all its units?`)) {
                                                    try {
                                                        await api.deleteProperty(selectedProperty.id);
                                                        await loadProperties();
                                                    } catch (err) {
                                                        alert('Sovereign Deletion Failed: Network Error.');
                                                    }
                                                }
                                            }}
                                            className="px-6 py-2.5 bg-rose-50 border border-rose-200 text-rose-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all mt-1"
                                        >
                                            DELETE PROPERTY
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (isAddingUnit) {
                                                setIsAddingUnit(false);
                                                setSelectedUnit(null);
                                                setUnitData({ 
                                                    name: '', rent: 0, expectedRent: 0, deposit: 0, bhkCount: 1, 
                                                    sqFt: 500, bathrooms: 1, furnishedStatus: 'UNFURNISHED',
                                                    agreementType: 'RENTAL', leaseAmount: 0, leaseTenure: 12
                                                });
                                            } else {
                                                setIsAddingUnit(true);
                                                setSelectedUnit(null);
                                            }
                                        }} 
                                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-2xl ${isAddingUnit ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-white text-black hover:bg-amber-400 shadow-white/10'}`}>
                                        {isAddingUnit ? <Icons.X size={16} /> : <Icons.Plus size={16} />} {isAddingUnit ? 'CANCEL' : 'ADD NEW UNIT'}
                                    </button>
                                </div>

                                { (isAddingUnit || selectedUnit) && (
                                    <div className={`${BENTO_CARD} p-10 bg-amber-50 dark:bg-white border-amber-200 dark:border-amber-200 border animate-reveal uppercase shadow-sm`}>
                                        <div className="flex items-center gap-6 mb-12 pb-8 border-b border-slate-200">
                                            <div className="w-16 h-16 bg-amber-400 text-black rounded-3xl flex items-center justify-center shadow-2xl">
                                                <Icons.Home size={28} />
                                            </div>
                                            <div>
                                            <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter">{selectedUnit ? 'MODIFY ASSET' : 'DEPLOY NEW ASSET'}</h3>
                                                <p className={METRIC_LABEL}>{selectedUnit ? `Editing Unit: ${selectedUnit.name}` : 'Provisioning Unit Details'}</p>
                                            </div>
                                        </div>
                                        <form onSubmit={handleAddUnit} className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-1.5"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Unit Name / No.</span><InfoTooltip text="Unique identifier for the apartment or space." /></div>
                                                    <input type="text" required value={unitData.name} onChange={e => setUnitData({ ...unitData, name: e.target.value })} className={inputClasses} placeholder="e.g. A-101" />
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-1.5"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Configuration</span><InfoTooltip text="Declare the configuration of the unit." /></div>
                                                    <select required value={unitData.unitType} onChange={e => setUnitData({ ...unitData, unitType: e.target.value })} className={inputClasses}>
                                                        <option value="">Select Configuration</option>
                                                        <option value="1 BHK">1 BHK Apartment</option>
                                                        <option value="2 BHK">2 BHK Apartment</option>
                                                        <option value="3 BHK">3 BHK Apartment</option>
                                                        <option value="Luxury Villa">Luxury Villa</option>
                                                        <option value="Commercial Space">Commercial Hub</option>
                                                        <option value="Studio">Executive Studio</option>
                                                        <option value="Other">Other / Custom</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-1.5"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Area (Sq Ft)</span><InfoTooltip text="Total measurable interior space." /></div>
                                                    <input type="number" required value={unitData.sqFt} onChange={e => setUnitData({ ...unitData, sqFt: parseInt(e.target.value) })} className={inputClasses} />
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-1.5"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Interior Finish</span><InfoTooltip text="Condition of the asset internals." /></div>
                                                    <select required value={unitData.furnishedStatus} onChange={e => setUnitData({ ...unitData, furnishedStatus: e.target.value as any })} className={inputClasses}>
                                                        <option value="UNFURNISHED">Unfurnished Status</option>
                                                        <option value="SEMI_FURNISHED">Semi-Furnished Status</option>
                                                        <option value="FULLY_FURNISHED">Fully-Furnished Status</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-1.5"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Agreement Protocol</span><InfoTooltip text="Define the financial structure of the unit occupancy." /></div>
                                                    <div className="flex bg-slate-100 p-1 rounded-2xl border-2 border-slate-200">
                                                        <button 
                                                            type="button"
                                                            onClick={() => setUnitData({ ...unitData, agreementType: 'RENTAL' })}
                                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${unitData.agreementType === 'RENTAL' ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'text-slate-500 hover:text-slate-700'}`}
                                                        >
                                                            RENTAL
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => setUnitData({ ...unitData, agreementType: 'LEASE' })}
                                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${unitData.agreementType === 'LEASE' ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'text-slate-500 hover:text-slate-700'}`}
                                                        >
                                                            LEASE
                                                        </button>
                                                    </div>
                                                </div>
                                                {unitData.agreementType === 'RENTAL' ? (
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-1.5"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Monthly Rent (₹)</span><InfoTooltip text="Target monthly revenue." /></div>
                                                            <input type="number" required value={unitData.rent} onChange={e => setUnitData({ ...unitData, rent: parseInt(e.target.value) })} className={inputClasses} />
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-1.5"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Security Deposit (₹)</span><InfoTooltip text="Capital held for asset integrity." /></div>
                                                            <input type="number" required value={unitData.deposit} onChange={e => setUnitData({ ...unitData, deposit: parseInt(e.target.value) })} className={inputClasses} />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-1.5"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Lease Amount (₹)</span><InfoTooltip text="Lump-sum refundable deposit." /></div>
                                                            <input type="number" required value={unitData.leaseAmount} onChange={e => setUnitData({ ...unitData, leaseAmount: parseInt(e.target.value) })} className={inputClasses} />
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-1.5"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Tenure (Months)</span><InfoTooltip text="Duration of the lease agreement." /></div>
                                                            <input type="number" required value={unitData.leaseTenure} onChange={e => setUnitData({ ...unitData, leaseTenure: parseInt(e.target.value) })} className={inputClasses} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-10 border-t border-amber-200 mt-6 space-y-12">
                                                {/* Tenant Assignment Header & Explicit Selection */}
                                                <div className="flex justify-between items-center pb-8 border-b border-slate-200">
                                                    <div className="flex items-center gap-6">
                                                        <div className={`w-14 h-14 rounded-2xl transition-all duration-500 flex items-center justify-center shadow-lg ${isOccupied ? 'bg-amber-400 text-black' : 'bg-slate-100 text-slate-500'}`}>
                                                            {isOccupied ? <Icons.UserCheck size={24} /> : <Icons.User size={24} />}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Status Protocol</h4>
                                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1.5 font-black opacity-60">Define unit occupancy status</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setIsOccupied(false)} 
                                                            className={`px-8 py-3 rounded-xl text-[9px] font-black tracking-[0.2em] uppercase transition-all ${!isOccupied ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 opacity-60 hover:opacity-100'}`}
                                                        >
                                                            VACANT
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setIsOccupied(true)} 
                                                            className={`px-8 py-3 rounded-xl text-[9px] font-black tracking-[0.2em] uppercase transition-all ${isOccupied ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'text-slate-400 opacity-60 hover:opacity-100'}`}
                                                        >
                                                            OCCUPIED
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Expansion Control for Tenant Data */}
                                                {isOccupied && (
                                                    <div className="bg-violet-50 border border-violet-100 p-12 rounded-[4rem] space-y-12 animate-reveal shadow-sm overflow-hidden">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                                                            <div className="space-y-4">
                                                                <label className={METRIC_LABEL}>Tenant First Name</label>
                                                                <input type="text" required value={tenantData.firstName} onChange={e => setTenantData({ ...tenantData, firstName: e.target.value })} className={inputClasses} placeholder="e.g. Raju" />
                                                            </div>
                                                            <div className="space-y-4">
                                                                <label className={METRIC_LABEL}>Tenant Last Name</label>
                                                                <input type="text" required value={tenantData.lastName} onChange={e => setTenantData({ ...tenantData, lastName: e.target.value })} className={inputClasses} placeholder="e.g. Kumar" />
                                                            </div>
                                                            <div className="space-y-4">
                                                                <label className={METRIC_LABEL}>Tenant Email</label>
                                                                <input 
                                                                    type="email" required value={tenantData.email} 
                                                                    onChange={e => setTenantData({ ...tenantData, email: e.target.value })} 
                                                                    className={`${inputClasses} ${tenantData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tenantData.email) ? 'border-rose-500/50' : ''}`} 
                                                                    placeholder="e.g. raju@mail.com"
                                                                />
                                                            </div>
                                                            <div className="space-y-4">
                                                                <label className={METRIC_LABEL}>Mobile (10-Digit)</label>
                                                                <input 
                                                                    type="tel" required value={tenantData.phone} 
                                                                    onChange={e => setTenantData({ ...tenantData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} 
                                                                    className={`${inputClasses} ${tenantData.phone && tenantData.phone.length !== 10 ? 'border-rose-500/50' : ''}`}
                                                                    placeholder="9988776655"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                                            <div className="space-y-4">
                                                                <label className={METRIC_LABEL}>Emergency Contact Name</label>
                                                                <input type="text" value={tenantData.emergencyContactName} onChange={e => setTenantData({ ...tenantData, emergencyContactName: e.target.value })} className={inputClasses} placeholder="Emergency Contact Name" />
                                                            </div>
                                                            <div className="space-y-4">
                                                                <label className={METRIC_LABEL}>Emergency Mobile</label>
                                                                <input 
                                                                    type="tel" value={tenantData.emergencyContactNumber} 
                                                                    onChange={e => setTenantData({ ...tenantData, emergencyContactNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })} 
                                                                    className={`${inputClasses} ${tenantData.emergencyContactNumber && tenantData.emergencyContactNumber.length !== 10 ? 'border-rose-500/50' : ''}`}
                                                                    placeholder="Emergency Number..."
                                                                />
                                                            </div>
                                                            <div className="space-y-4">
                                                                <label className={METRIC_LABEL}>Date of Occupancy</label>
                                                                <input type="date" value={tenantData.leaseStartDate} onChange={e => setTenantData({ ...tenantData, leaseStartDate: e.target.value })} className={inputClasses} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Sanctuary: Historical Occupants */}
                                                {selectedUnit && selectedUnit.tenantHistories && selectedUnit.tenantHistories.length > 0 && (
                                                    <div className="pt-10 border-t border-white/5">
                                                        <div className="flex items-center gap-4 mb-8">
                                                            <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-500">
                                                                <Icons.History size={20} />
                                                            </div>
                                                            <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Sanctuary: Historical Occupants</h4>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            {selectedUnit.tenantHistories.map(history => (
                                                                <div key={history.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/[0.04] transition-all group">
                                                                    <div className="flex justify-between items-start mb-4">
                                                                        <div>
                                                                            <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{history.tenantName}</p>
                                                                            <p className="text-[9px] text-slate-500 font-bold lowercase opacity-70 italic">{history.tenantEmail}</p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic leading-none">Archived</p>
                                                                            <p className="text-[8px] text-slate-600 font-bold uppercase mt-1">Moved out: {new Date(history.movedOutDate).toLocaleDateString()}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                                                                        <div>
                                                                            <p className={METRIC_LABEL}>Lease Period & Protocol</p>
                                                                            <p className="text-[9px] font-black text-slate-400 uppercase">
                                                                                {history.leaseStartDate ? new Date(history.leaseStartDate).toLocaleDateString() : '??'} - {history.leaseEndDate ? new Date(history.leaseEndDate).toLocaleDateString() : '??'}
                                                                                <span className="ml-2 text-amber-500/80">[{history.agreementType || 'RENTAL'}]</span>
                                                                            </p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className={METRIC_LABEL}>Final Yield / Capital</p>
                                                                            <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase">
                                                                                ₹{(history.agreementType === 'LEASE' ? history.leaseAmount : history.rent)?.toLocaleString()}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Deployment Controls */}
                                                <div className="flex items-center justify-end pt-6">
                                                    <button 
                                                        type="submit" 
                                                        disabled={loading || (isOccupied && (!tenantData.firstName || (tenantData.phone && tenantData.phone.length !== 10)))} 
                                                        className="w-full md:w-auto px-16 py-6 bg-amber-400 text-black rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.2em] hover:bg-amber-500 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-amber-400/20 h-[80px]"
                                                    >
                                                        {loading ? <Icons.Activity className="animate-spin" size={24} /> : <Icons.ShieldCheck size={24} />} 
                                                        SAVE UNIT
                                                    </button>
                                                </div>
                                            </div>

                                        </form>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                                    {selectedProperty.units.map(unit => (
                                        <div key={unit.id} className={`${BENTO_CARD} p-8 bg-white dark:bg-white/[0.01] hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all group border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none`}>
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-amber-400 group-hover:text-black transition-all">
                                                    <Icons.Home size={20} />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={async () => {
                                                            if (confirm(`INITIATE DISMANTLE: Are you sure you want to delete unit "${unit.name}"? This action cannot be revoked.`)) {
                                                                try {
                                                                    await api.deleteUnit(unit.id);
                                                                    window.location.reload();
                                                                } catch (err) {
                                                                    alert('Dismantle Protocol Failed.');
                                                                }
                                                            }
                                                        }}
                                                        className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        DELETE
                                                    </button>
                                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${unit.status === 'VACANT' && !unit.tenant ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                                        {unit.status === 'VACANT' && !unit.tenant ? 'VACANT' : 'OCCUPIED'}
                                                    </span>
                                                </div>
                                            </div>
                                            <h4 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">{unit.name}</h4>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                                {unit.unitType || 'Unassigned Type'} • {unit.sqFt || '??'} SQ FT • {unit.furnishedStatus?.replace('_', ' ')}
                                            </p>
                                            <div className="mt-3 flex gap-2">
                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-md text-[7px] font-black text-slate-400 uppercase tracking-widest">
                                                    {unit.agreementType || 'RENTAL'}
                                                </span>
                                            </div>
                                            
                                            {unit.tenant && (
                                                <div className="mt-4 p-4 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                                                    <p className={METRIC_LABEL}>Active Occupant</p>
                                                    <p className="text-[11px] font-black text-amber-500 uppercase mt-1 px-1">{unit.tenant.name}</p>
                                                    <p className="text-[9px] font-bold text-slate-500 lowercase mt-0.5 px-1 opacity-70 italic">{unit.tenant.email}</p>
                                                </div>
                                            )}

                                            <div className="mt-8 flex justify-between items-end border-t border-white/5 pt-6">
                                                <div>
                                                    <p className={METRIC_LABEL}>{unit.agreementType === 'LEASE' ? 'Lease Capital' : 'Asset Yield'}</p>
                                                    <p className="text-xl font-black text-slate-900 dark:text-white">₹{(unit.agreementType === 'LEASE' ? unit.leaseAmount : unit.rent)?.toLocaleString()}</p>
                                                </div>
                                                <div className="flex flex-wrap gap-2 justify-end">
                                                    <button 
                                                        type="button"
                                                        onClick={() => navigate(`/owner/units/${unit.id}`)}
                                                        className="px-4 py-4 bg-amber-400/15 text-amber-700 dark:text-amber-400 border border-amber-400/30 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-400 hover:text-black transition-all"
                                                    >
                                                        Unit record
                                                    </button>
                                                    <button 
                                                        onClick={() => setViewingUnit(unit)}
                                                        className="px-6 py-4 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-all"
                                                    >
                                                        VIEW
                                                    </button>
                                                    <button 
                                                        onClick={() => setSelectedUnit(unit)}
                                                        className="px-6 py-4 bg-slate-100 dark:bg-white/5 rounded-xl text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest hover:bg-amber-400 hover:text-black transition-all"
                                                    >
                                                        MODIFY
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {selectedProperty.units.length === 0 && (
                                        <div className="col-span-full py-28 text-center opacity-20 border-2 border-dashed border-white/10 rounded-[3.5rem]">
                                            <Icons.Home className="mx-auto mb-6" size={56} />
                                            <p className="text-sm font-black uppercase tracking-[0.4em]">Sector Vacant: Deploy Units to Begin Tracking</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 py-40">
                                <Icons.LayoutDashboard size={64} className="mb-8" />
                                <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Select Sector</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-4">Expand empire to manage details.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
