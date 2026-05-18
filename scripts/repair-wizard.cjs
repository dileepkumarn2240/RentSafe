const fs = require('fs');
const path = './components/MySanctuaryView.tsx';
let content = fs.readFileSync(path, 'utf8');

// The section after InfoTooltip closing brace at };\n\n is corrupt
// Find the broken orphaned code and prepend the correct component header
const brokenBlock = `};\n\n            setStep(step + 1);\r\n            return;\r\n        }\r\n        setLoading(true);\r\n`;

const fixedBlock = `};\n\nconst AddAssetWizard: React.FC<AddAssetWizardProps> = ({ onSuccess, onCancel }) => {\r\n    const [step, setStep] = useState(1);\r\n    const [loading, setLoading] = useState(false);\r\n    const [assetError, setAssetError] = useState<string | null>(null);\r\n    const [propertyData, setPropertyData] = useState<Partial<Property>>({\r\n        name: '',\r\n        address: '',\r\n        type: 'APARTMENT',\r\n        valuation: 0,\r\n        cctvCount: 0,\r\n        rules: '',\r\n        waterSupplyType: 'Municipal',\r\n        waterAvailability: '24/7',\r\n        maintenanceAmount: 0,\r\n        maintenanceFrequency: 'Monthly',\r\n        parkingType: 'Covered',\r\n        parkingSlots: 0,\r\n        securityGuardStatus: 'None',\r\n        biometricAccess: false,\r\n        fireSafety: false\r\n    });\r\n\r\n    const handleSubmit = async (e: React.FormEvent) => {\r\n        e.preventDefault();\r\n        setAssetError(null);\r\n        if (step < 3) {\r\n            setStep(step + 1);\r\n            return;\r\n        }\r\n        setLoading(true);\r\n`;

if (content.includes(brokenBlock)) {
    content = content.replace(brokenBlock, fixedBlock);
    fs.writeFileSync(path, content);
    console.log('Repair successful!');
} else {
    console.error('Broken block not found. Showing lines 54-62 for manual inspection:');
    const lines = content.split('\n');
    lines.slice(53, 65).forEach((l, i) => console.log(`${54+i}: ${l}`));
}
