const fs = require('fs');
const path = './components/MySanctuaryView.tsx';
let content = fs.readFileSync(path, 'utf8');

// The corrupted junction
const brokenJunction = `className={\`\${inputClasses} min-h-[160px] resize-none text-sm font-bold uppercase tracking-widest\`}
    );
};`;

const fixedJunction = `className={\`\${inputClasses} min-h-[160px] resize-none text-sm font-bold uppercase tracking-widest\`}
                                        placeholder="No pets; No sub-letting; 10PM noise floor..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-12 border-t border-white/5 flex flex-col gap-4">
                        {assetError && (
                            <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-rose-400 mt-0.5 shrink-0" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                <span className="text-[11px] font-medium text-rose-300 leading-relaxed">{assetError}</span>
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-8 bg-white text-black rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] hover:bg-amber-400 hover:scale-[1.01] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-4"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-4 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Icons.Activity size={18} />
                                    {step === 3 ? 'Finalize Asset Deployment' : 'Proceed to Next Phase'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};`;

if (content.includes(brokenJunction)) {
    content = content.replace(brokenJunction, fixedJunction);
    fs.writeFileSync(path, content);
    console.log('Repair successful!');
} else {
    // Try with Windows line endings if above fails
    const brokenJunctionWin = brokenJunction.replace(/\n/g, '\r\n');
    if (content.includes(brokenJunctionWin)) {
        content = content.replace(brokenJunctionWin, fixedJunction.replace(/\n/g, '\r\n'));
        fs.writeFileSync(path, content);
        console.log('Repair successful (win)!');
    } else {
        console.error('Broken junction not found.');
    }
}
