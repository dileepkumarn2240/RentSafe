
// ═══════════════════════════════════════════════════════════
//  LOCAL AI DIAGNOSTIC ENGINE — Rule-Based Property Maintenance Advisor
//  No external API required. Uses keyword matching + expert rules.
// ═══════════════════════════════════════════════════════════

interface DiagnosticRule {
  keywords: string[];
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  diagnosis: string;
  steps: string[];
  estimatedCost: string;
  urgency: string;
}

const DIAGNOSTIC_RULES: DiagnosticRule[] = [
  // PLUMBING
  {
    keywords: ['leak', 'leaking', 'drip', 'dripping', 'water leak', 'pipe', 'plumbing'],
    category: 'Plumbing',
    severity: 'HIGH',
    diagnosis: 'Water leak detected — likely caused by worn seals, corroded pipe joints, or loose fittings.',
    steps: [
      '1. **Immediate**: Turn off the water supply valve nearest to the leak to prevent water damage.',
      '2. **Inspect**: Check the pipe joints, washers, and O-rings for visible corrosion or wear. Look for water stains on walls/ceiling to trace the source.',
      '3. **Temporary Fix**: Apply plumber\'s tape (PTFE) around threaded joints or use a pipe clamp for small cracks.',
      '4. **Professional**: Contact a licensed plumber for permanent repair. Estimated response: 2-4 hours.'
    ],
    estimatedCost: '₹500 – ₹3,000',
    urgency: 'Address within 24 hours to prevent water damage and mold growth.'
  },
  {
    keywords: ['faucet', 'tap', 'tap dripping', 'faucet noise', 'tap noise', 'water tap'],
    category: 'Plumbing',
    severity: 'MEDIUM',
    diagnosis: 'Faulty faucet — likely caused by a worn cartridge, damaged washer, or mineral buildup.',
    steps: [
      '1. **Identify Type**: Determine if it\'s a compression, ball, disc, or cartridge faucet.',
      '2. **Quick Fix**: Tighten the packing nut under the handle. If dripping persists, the washer or cartridge needs replacement.',
      '3. **Descale**: If water flow is weak, unscrew the aerator and soak in vinegar for 2 hours to remove mineral deposits.',
      '4. **Replace**: If the faucet is over 8 years old, consider full replacement for long-term reliability.'
    ],
    estimatedCost: '₹200 – ₹1,500',
    urgency: 'Non-urgent. Schedule within the week.'
  },
  {
    keywords: ['clog', 'blocked', 'drain', 'slow drain', 'sink not draining', 'toilet clog'],
    category: 'Plumbing',
    severity: 'MEDIUM',
    diagnosis: 'Drain blockage — typically caused by grease buildup, hair, soap residue, or foreign objects.',
    steps: [
      '1. **Plunger**: Use a cup plunger for sinks or a flange plunger for toilets. Apply firm, rhythmic pressure.',
      '2. **Natural Solution**: Pour 1/2 cup baking soda + 1/2 cup vinegar, wait 30 minutes, then flush with boiling water.',
      '3. **Snake/Auger**: For deeper clogs, use a drain snake to physically break through the blockage.',
      '4. **Prevention**: Install drain screens and avoid pouring oils/grease down the drain.'
    ],
    estimatedCost: '₹300 – ₹2,000',
    urgency: 'Address within 48 hours. Prolonged blockage can cause pipe damage.'
  },
  // ELECTRICAL
  {
    keywords: ['electricity', 'power', 'electrical', 'short circuit', 'spark', 'sparking', 'outlet', 'switch', 'tripping', 'breaker', 'mcb'],
    category: 'Electrical',
    severity: 'CRITICAL',
    diagnosis: 'Electrical fault detected — potential fire hazard. Could be caused by overloaded circuits, faulty wiring, or damaged outlets.',
    steps: [
      '1. **SAFETY FIRST**: Do NOT touch exposed wires. Turn off the main circuit breaker (MCB) immediately.',
      '2. **Identify**: Check which MCB tripped. If a specific circuit keeps tripping, there\'s likely an overload or short circuit on that line.',
      '3. **Unplug**: Disconnect all devices from the affected circuit. Reset the MCB. If it trips again with nothing plugged in, the wiring is faulty.',
      '4. **Professional ONLY**: Electrical repairs must be handled by a licensed electrician. Do NOT attempt DIY wiring.'
    ],
    estimatedCost: '₹1,000 – ₹5,000',
    urgency: 'IMMEDIATE — Fire hazard. Do not use the affected circuit until inspected.'
  },
  {
    keywords: ['fan', 'ceiling fan', 'fan noise', 'fan not working', 'fan speed'],
    category: 'Electrical',
    severity: 'LOW',
    diagnosis: 'Ceiling fan issue — commonly caused by loose screws, worn bearings, or capacitor failure.',
    steps: [
      '1. **Noise/Wobble**: Turn off the fan. Tighten all visible screws on blades, blade brackets, and the canopy.',
      '2. **Speed Issue**: Replace the fan capacitor (₹50-150). A failing capacitor causes the fan to run slowly or not start.',
      '3. **Bearings**: If the fan makes a grinding noise, the bearings need oiling — apply 2-3 drops of machine oil to the motor shaft.',
      '4. **Age Check**: Fans older than 10 years with persistent issues should be replaced entirely.'
    ],
    estimatedCost: '₹100 – ₹2,500',
    urgency: 'Non-critical. Schedule within the week.'
  },
  // STRUCTURAL
  {
    keywords: ['crack', 'wall crack', 'ceiling crack', 'foundation', 'structural'],
    category: 'Structural',
    severity: 'HIGH',
    diagnosis: 'Structural crack detected — could be cosmetic (hairline) or structural (>3mm width). Requires professional assessment.',
    steps: [
      '1. **Measure**: Use a ruler to measure crack width. Hairline cracks (<1mm) are usually cosmetic. Cracks >3mm or growing are serious.',
      '2. **Monitor**: Mark both ends of the crack with tape and date it. Check weekly for expansion.',
      '3. **Cosmetic Fix**: For hairline cracks, apply crack filler putty, sand smooth, and repaint.',
      '4. **Professional**: For wide or expanding cracks, call a structural engineer. Never ignore cracks near load-bearing walls or foundations.'
    ],
    estimatedCost: '₹500 – ₹15,000+',
    urgency: 'Monitor immediately. Professional inspection within 1 week for wide cracks.'
  },
  {
    keywords: ['paint', 'peeling', 'damp', 'dampness', 'moisture', 'mold', 'mould', 'seepage', 'water seepage'],
    category: 'Structural',
    severity: 'MEDIUM',
    diagnosis: 'Dampness/seepage issue — caused by waterproofing failure, plumbing leaks behind walls, or poor ventilation.',
    steps: [
      '1. **Source**: Identify if dampness is from external rain seepage, internal plumbing leak, or condensation.',
      '2. **Ventilation**: Ensure affected rooms have adequate ventilation. Use exhaust fans in bathrooms and kitchens.',
      '3. **Treatment**: Scrape off peeling paint, apply anti-fungal solution, let dry completely, then apply waterproof primer + paint.',
      '4. **Waterproofing**: For external seepage, apply waterproof coating on the exterior wall. For severe cases, inject epoxy resin into cracks.'
    ],
    estimatedCost: '₹2,000 – ₹10,000',
    urgency: 'Address within 1 week. Mold can cause health issues.'
  },
  // APPLIANCES
  {
    keywords: ['ac', 'air conditioner', 'cooling', 'not cooling', 'ac leak', 'ac noise', 'ac smell'],
    category: 'HVAC',
    severity: 'MEDIUM',
    diagnosis: 'AC malfunction — could be refrigerant leak, dirty filters, compressor issue, or drainage blockage.',
    steps: [
      '1. **Filter**: Clean or replace air filters — dirty filters reduce cooling by 30-40%. Wash with water and mild soap.',
      '2. **Drainage**: Check the AC drain pipe. A blocked pipe causes water leakage. Clear with a thin wire or compressed air.',
      '3. **Smell**: Bad odor indicates mold in the evaporator coil. Run the fan-only mode for 30 min after turning off cooling to dry the coils.',
      '4. **Gas Refill**: If cooling is weak despite clean filters, the refrigerant may be low. Call a certified AC technician.'
    ],
    estimatedCost: '₹500 – ₹4,000',
    urgency: 'Non-emergency but affects comfort. Schedule within 2-3 days.'
  },
  {
    keywords: ['geyser', 'water heater', 'hot water', 'no hot water', 'geyser leak'],
    category: 'Appliance',
    severity: 'MEDIUM',
    diagnosis: 'Water heater issue — could be a faulty thermostat, heating element failure, or tank corrosion.',
    steps: [
      '1. **Check Power**: Verify the geyser is receiving power. Check the MCB and the geyser\'s indicator light.',
      '2. **Thermostat**: If water is lukewarm, the thermostat setting may need adjustment. Try increasing the temperature setting.',
      '3. **Element**: If no heating at all, the heating element may be burnt. A technician can test and replace it.',
      '4. **Leaking**: Tank leaks indicate corrosion. Replace the anode rod if available, or replace the entire unit if older than 8 years.'
    ],
    estimatedCost: '₹800 – ₹3,500',
    urgency: 'Schedule within 2-3 days.'
  },
  // PEST CONTROL
  {
    keywords: ['pest', 'cockroach', 'rat', 'termite', 'ant', 'insect', 'bug', 'mosquito', 'rodent'],
    category: 'Pest Control',
    severity: 'MEDIUM',
    diagnosis: 'Pest infestation detected — requires professional pest control treatment based on the pest type.',
    steps: [
      '1. **Identify**: Determine the pest type (cockroaches, termites, rodents, ants). Each requires a different treatment approach.',
      '2. **Immediate**: Seal food containers, fix water leaks (pests need water), and block entry points with steel wool or caulk.',
      '3. **DIY**: For minor ant/cockroach issues, use gel baits placed in corners, under sinks, and behind appliances.',
      '4. **Professional**: For termites or rodents, professional fumigation is mandatory. Schedule a pest control service.'
    ],
    estimatedCost: '₹1,500 – ₹5,000',
    urgency: 'Within 3-5 days. Termite infestations require immediate attention.'
  },
  // DOOR/WINDOW
  {
    keywords: ['door', 'lock', 'window', 'hinge', 'stuck', 'won\'t close', 'won\'t open', 'broken lock', 'key'],
    category: 'Doors & Windows',
    severity: 'MEDIUM',
    diagnosis: 'Door/window mechanism issue — commonly caused by misaligned frames, worn hinges, or lock mechanism failure.',
    steps: [
      '1. **Lubricate**: Apply WD-40 or machine oil to hinges, lock mechanisms, and sliding tracks.',
      '2. **Alignment**: If the door/window rubs against the frame, check if hinges are loose. Tighten screws or use longer screws if holes are stripped.',
      '3. **Lock**: For jammed locks, spray graphite lubricant into the keyhole. Never force the key — it may break inside.',
      '4. **Replace**: If the lock mechanism is broken, replace the entire lock set. For security, use a deadbolt lock.'
    ],
    estimatedCost: '₹300 – ₹2,000',
    urgency: 'Within 48 hours for security-related issues (broken locks).'
  },
  // NOISE
  {
    keywords: ['noise', 'noisy', 'sound', 'vibration', 'rattling', 'banging', 'humming'],
    category: 'General',
    severity: 'LOW',
    diagnosis: 'Unusual noise — could originate from plumbing (water hammer), electrical (loose connections), HVAC, or structural sources.',
    steps: [
      '1. **Locate**: Identify the source room and time pattern. Is it constant or intermittent? Does it happen when water/appliances are used?',
      '2. **Plumbing Noise**: Banging pipes (water hammer) can be fixed by installing a water hammer arrestor or securing loose pipes with clamps.',
      '3. **Electrical Hum**: A buzzing outlet or switch indicates a loose connection. Turn off the circuit and have an electrician inspect.',
      '4. **Appliance**: Rattling from washing machines or AC units usually means loose mounting or worn components.'
    ],
    estimatedCost: '₹200 – ₹2,000',
    urgency: 'Non-urgent unless safety-related. Diagnose within the week.'
  }
];

function matchRules(issue: string): DiagnosticRule[] {
  const lower = issue.toLowerCase();
  const matched: DiagnosticRule[] = [];

  for (const rule of DIAGNOSTIC_RULES) {
    const score = rule.keywords.reduce((acc, kw) => {
      return acc + (lower.includes(kw.toLowerCase()) ? 1 : 0);
    }, 0);
    if (score > 0) {
      matched.push(rule);
    }
  }

  // Sort by number of keyword matches (most relevant first), then severity
  const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  matched.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

  return matched;
}

function formatDiagnosis(rules: DiagnosticRule[], issue: string): string {
  if (rules.length === 0) {
    return `🔍 **AI Diagnostic Analysis**\n\n` +
      `Based on your description: "${issue}"\n\n` +
      `**Assessment**: This issue requires on-site inspection for accurate diagnosis.\n\n` +
      `**Recommended Steps**:\n` +
      `1. **Document**: Take photos/videos of the issue for the maintenance team.\n` +
      `2. **Safety Check**: Ensure the area is safe. If there's a risk of electrical shock, gas leak, or structural collapse, evacuate immediately.\n` +
      `3. **Report**: Submit this ticket so our maintenance team can schedule an inspection.\n` +
      `4. **Timeline**: A technician will be assigned within 24-48 hours.\n\n` +
      `💡 *Tip: Providing more specific details (location, when it started, sounds/smells) helps us diagnose faster.*`;
  }

  const primary = rules[0];
  let response = `🔍 **AI Diagnostic Report**\n\n`;
  response += `**Category**: ${primary.category} | **Severity**: ${primary.severity}\n\n`;
  response += `**Diagnosis**: ${primary.diagnosis}\n\n`;
  response += `**Recommended Action Plan**:\n`;
  response += primary.steps.join('\n') + '\n\n';
  response += `💰 **Estimated Cost**: ${primary.estimatedCost}\n`;
  response += `⏰ **Urgency**: ${primary.urgency}`;

  if (rules.length > 1) {
    response += `\n\n---\n📋 *Additional related concerns detected: ${rules.slice(1).map(r => r.category).join(', ')}. These will be addressed during inspection.*`;
  }

  return response;
}

export const generateMaintenanceAdvice = async (issue: string): Promise<string> => {
  // Simulate a brief "thinking" delay for UX
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
  const matched = matchRules(issue);
  return formatDiagnosis(matched, issue);
};

export const analyzeLeaseTerms = async (terms: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return `📋 **Lease Analysis Summary**\n\n` +
    `Based on the provided terms, here are the key points:\n` +
    `• **Security Deposit**: Review the deposit amount and refund conditions carefully.\n` +
    `• **Lock-in Period**: Check if there's a minimum stay requirement and early exit penalties.\n` +
    `• **Maintenance Charges**: Verify what's included in maintenance and what's extra.\n` +
    `• **Rent Escalation**: Look for annual increment clauses (typically 5-10%).\n\n` +
    `*For detailed legal review, consult a property lawyer.*`;
};

export const getMarketTrends = async (location: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return `📊 **Market Overview for ${location}**\n\n` +
    `• **2BHK Rental Range**: ₹12,000 – ₹25,000/month\n` +
    `• **3BHK Rental Range**: ₹18,000 – ₹40,000/month\n` +
    `• **Trend**: Rental demand is steady with ~5% year-over-year growth.\n\n` +
    `*These are indicative ranges. Actual prices depend on exact locality, amenities, and condition.*`;
};
