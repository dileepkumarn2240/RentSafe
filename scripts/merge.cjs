const fs = require('fs');

const mySanctuaryPath = './components/MySanctuaryView.tsx';
const addPropertyPath = './components/AddPropertyView.tsx';

let mySanc = fs.readFileSync(mySanctuaryPath, 'utf8');
let addProp = fs.readFileSync(addPropertyPath, 'utf8');

const regexComponent = /export const AddPropertyView[\s\S]*?^};\r?\n/m;
const addPropMatch = addProp.match(regexComponent);

let addPropBody = '';
if (!addPropMatch) {
    // try index of
    const startIndex = addProp.indexOf('export const AddPropertyView');
    if (startIndex !== -1) {
       addPropBody = addProp.substring(startIndex);
    } else {
        console.error("Could not find AddPropertyView component.");
        process.exit(1);
    }
} else {
    addPropBody = addPropMatch[0];
}

addPropBody = addPropBody.replace('export const AddPropertyView', 'const AddAssetWizard').replace(/AddPropertyViewProps/g, 'AddAssetWizardProps');

const interfaceMatch = addProp.match(/interface AddPropertyViewProps \{[\s\S]*?\}/);
let addPropInterface = interfaceMatch ? interfaceMatch[0].replace(/AddPropertyViewProps/g, 'AddAssetWizardProps') : '';

// Add to MySanctuaryView
mySanc = mySanc.replace('export const MySanctuaryView', addPropInterface + '\n\n' + addPropBody + '\n\nexport const MySanctuaryView');

// Add isAddingProperty state to MySanctuaryView
mySanc = mySanc.replace(
    'const [selectedProperty, setSelectedProperty] = useState<Property | null>(properties[0] || null);',
    'const [isAddingProperty, setIsAddingProperty] = useState(false);\n    const [selectedProperty, setSelectedProperty] = useState<Property | null>(properties[0] || null);'
);

// Add Zero state handling
const zeroStateJSX = `
            {isAddingProperty ? (
                <AddAssetWizard 
                    onSuccess={() => { setIsAddingProperty(false); onRefresh(); }} 
                    onCancel={() => setIsAddingProperty(false)} 
                />
            ) : properties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-reveal">
                    <div className="w-32 h-32 bg-amber-400/10 rounded-[3rem] flex items-center justify-center mt-10 mb-10 border border-amber-400/20 mx-auto">
                        <Icons.Home className="text-amber-500" size={56} />
                    </div>
                    <h3 className="text-5xl font-black uppercase text-white tracking-tighter mb-6">Exclusive Member Benefits</h3>
                    <p className="max-w-2xl mx-auto text-slate-400 font-medium text-lg leading-relaxed mb-12">
                        Welcome to your Strategic Sanctuary. Deploying your first asset unlocks premium features including real-time yield tracking, predictive finance AI, and multi-tenant deep profiling.
                    </p>
                    <button
                        onClick={() => setIsAddingProperty(true)}
                        className="mx-auto px-12 py-6 bg-amber-400 text-black rounded-3xl font-black uppercase tracking-[0.2em] text-[12px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-4"
                    >
                        <Icons.Plus size={20} />
                        Deploy First Asset
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
`;

// Replace the grid start in MySanctuaryView with the new conditionals
mySanc = mySanc.replace(/<div className="grid grid-cols-1 lg:grid-cols-12 gap-10">/, zeroStateJSX);

// Add closing tags for the conditional block
mySanc = mySanc.replace(/(<\/div>\s*<\/div>\s*)$/, '                </div>\n            )}\n$1');

// Also update the Title header to include a top level 'Add Asset' button if we have properties and are not adding
const headerOriginal = `
            <div className="flex justify-between items-end">
                <div>
                    <span className={METRIC_LABEL}>Real Estate Empire • Strategic Sovereignty</span>
                    <h2 className="text-6xl font-black tracking-tighter text-white uppercase leading-none italic">
                        My<br /><span className="text-amber-500 not-italic">Sanctuary</span>
                    </h2>
                </div>
            </div>`;

const headerNew = `
            <div className="flex justify-between items-end">
                <div>
                    <span className={METRIC_LABEL}>Real Estate Empire • Strategic Sovereignty</span>
                    <h2 className="text-6xl font-black tracking-tighter text-white uppercase leading-none italic">
                        My<br /><span className="text-amber-500 not-italic">Sanctuary</span>
                    </h2>
                </div>
                {properties.length > 0 && !isAddingProperty && (
                    <button
                        onClick={() => setIsAddingProperty(true)}
                        className="px-8 py-4 bg-amber-400 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <Icons.Plus size={16} />
                        Expand Empire
                    </button>
                )}
            </div>`;

mySanc = mySanc.replace(headerOriginal, headerNew);

fs.writeFileSync(mySanctuaryPath, mySanc);
console.log('Successfully merged!');
