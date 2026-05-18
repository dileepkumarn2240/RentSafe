const fs = require('fs');
const path = './components/MySanctuaryView.tsx';
let content = fs.readFileSync(path, 'utf8');

const infoTooltipCode = `
const InfoTooltip = ({ text }: { text: string }) => (
    <div className="relative group inline-block ml-2 align-bottom pb-1">
        <Icons.Info size={14} className="text-slate-500 cursor-help hover:text-amber-400 transition-colors" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#0a0a0a] border border-amber-400/40 rounded-xl text-[11px] text-slate-300 font-medium leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-2xl pointer-events-none text-center normal-case">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-amber-400/40 drop-shadow-md"></div>
        </div>
    </div>
);
`;

const interfaceMatch = /interface AddAssetWizardProps \{\s*onSuccess: \(\) => void;\s*onCancel: \(\) => void;\s*\}/;
if (content.match(interfaceMatch)) {
    content = content.replace(interfaceMatch, `interface AddAssetWizardProps {
    onSuccess: () => void;
    onCancel: () => void;
}\n${infoTooltipCode}`);
} else {
    console.error("Could not find interface AddAssetWizardProps to inject InfoTooltip");
}

const replacements = [
    ['<label className={METRIC_LABEL}>Asset Designation</label>', '<label className={METRIC_LABEL}>Asset Designation<InfoTooltip text="Enter the registered name or nickname of this property/building." /></label>'],
    ['<label className={METRIC_LABEL}>Property Classification</label>', '<label className={METRIC_LABEL}>Asset Classification<InfoTooltip text="Select the type of real estate asset you are deploying." /></label>'],
    ['<label className={METRIC_LABEL}>Geographic Coordinates (Address)</label>', '<label className={METRIC_LABEL}>Physical Address<InfoTooltip text="The complete geographical location of the property." /></label>'],
    ['<label className={METRIC_LABEL}>Water Utility Source</label>', '<label className={METRIC_LABEL}>Water Utility Source<InfoTooltip text="The primary source of water supply for this property (e.g., Municipal, Borewell)." /></label>'],
    ['<label className={METRIC_LABEL}>Availability Cycle</label>', '<label className={METRIC_LABEL}>Availability Cycle<InfoTooltip text="The operational hours of water availability." /></label>'],
    ['<label className={METRIC_LABEL}>Parking Architecture</label>', '<label className={METRIC_LABEL}>Parking Architecture<InfoTooltip text="The type of parking facility available (e.g., Covered, Open)." /></label>'],
    ['<label className={METRIC_LABEL}>Allocated Slots</label>', '<label className={METRIC_LABEL}>Parking Slots Available<InfoTooltip text="Total number of parking slots available in this property for your tenants." /></label>'],
    ['<label className={METRIC_LABEL}>Maintenance (₹)</label>', '<label className={METRIC_LABEL}>Maintenance (₹)<InfoTooltip text="The periodic maintenance fee collected for building upkeep." /></label>'],
    ['<label className={METRIC_LABEL}>Billed Frequency</label>', '<label className={METRIC_LABEL}>Billed Frequency<InfoTooltip text="How often the maintenance fee is collected." /></label>'],
    ['<label className={METRIC_LABEL}>Market Valuation (₹)</label>', '<label className={METRIC_LABEL}>Market Valuation (₹)<InfoTooltip text="The estimated total current market worth of this property." /></label>'],
    ['<label className={METRIC_LABEL}>Sentinel Protocols (Security)</label>', '<label className={METRIC_LABEL}>Sentinel Protocols (Security)<InfoTooltip text="Security access and fire safety measures implemented." /></label>'],
    
    // Unit deployment fields
    ['<label className={METRIC_LABEL}>Unit Name/No.</label>', '<label className={METRIC_LABEL}>Unit Name/No.<InfoTooltip text="The specific door or flat number (e.g., Flat 101, A-block)." /></label>'],
    ['<label className={METRIC_LABEL}>Monthly Rent (₹)</label>', '<label className={METRIC_LABEL}>Monthly Rent (₹)<InfoTooltip text="The monthly amount charged to the tenant for this unit." /></label>'],
    ['<label className={METRIC_LABEL}>Deposit (₹)</label>', '<label className={METRIC_LABEL}>Deposit (₹)<InfoTooltip text="The upfront security deposit collected before move-in." /></label>'],
    ['<label className={METRIC_LABEL}>Expected Rent (₹)</label>', '<label className={METRIC_LABEL}>Expected Rent (₹)<InfoTooltip text="The projected monthly rent if the unit is currently vacant." /></label>']
];

for (const [target, replacement] of replacements) {
    if(!content.includes(target)) {
        console.warn('Target not found:', target);
    }
    content = content.replace(target, replacement);
}

fs.writeFileSync(path, content);
console.log('Tooltips injected successfully!');
