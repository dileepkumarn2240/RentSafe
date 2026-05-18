const fs = require('fs');
const path = './components/MySanctuaryView.tsx';
let content = fs.readFileSync(path, 'utf8');

// The METRIC_LABEL has 'block' in it (from App.tsx export).
// Labels that contain InfoTooltip need to be refactored:
// FROM: <label className={METRIC_LABEL}>Label Text<InfoTooltip text="..." /></label>
// TO:   <div className="flex items-center gap-1.5 mb-2"><span className={METRIC_LABEL} style={{marginBottom:0}}>Label Text</span><InfoTooltip text="..." /></div>

// We'll use regex to replace: <label className={METRIC_LABEL}>([^<]+)<InfoTooltip text="([^"]+)"[^>]*/></label>
// With the flex-row wrapper

const labelRegex = /<label className=\{METRIC_LABEL\}>([^<]*?)<InfoTooltip text="([^"]*)"[^/]*\/><\/label>/g;

let count = 0;
content = content.replace(labelRegex, (match, labelText, tooltipText) => {
    count++;
    return `<div className="flex items-center gap-1.5 mb-2"><span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">${labelText.trim()}</span><InfoTooltip text="${tooltipText}" /></div>`;
});

console.log(`Replaced ${count} label+tooltip combos`);
fs.writeFileSync(path, content);
console.log('Done!');
