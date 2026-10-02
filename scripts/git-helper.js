/**
 * Safe Git Status & Security Inspection Assistant
 * Ali Welekhasia Official Website Repository
 */

import { execSync } from 'child_process';

function run(cmd) {
    try {
        return execSync(cmd, { encoding: 'utf8' }).trim();
    } catch (e) {
        return '';
    }
}

console.log('=======================================================');
console.log('    ALI WELEKHASIA WEBSITE: SAFE GIT INSPECTION');
console.log('=======================================================\n');

// 1. Current Branch
const branch = run('git branch --show-current') || 'main (uncommitted/fresh repository)';
console.log(`CURRENT BRANCH: ${branch}`);

// 2. Remote Configuration
const remote = run('git remote -v') || '[No remote repository configured]';
console.log(`REMOTE REPOSITORY:\n${remote.split('\n').map(l => '  ' + l).join('\n')}\n`);

// 3. Status Short Output
const rawStatus = run('git status --short');
const statusLines = rawStatus ? rawStatus.split('\n') : [];

const modified = [];
const added = [];
const deleted = [];
const renamed = [];
const untracked = [];
const staged = [];

statusLines.forEach(line => {
    const code = line.slice(0, 2);
    const file = line.slice(3);

    if (code[0] !== ' ' && code[0] !== '?') {
        staged.push(file);
    }
    if (code.includes('M')) modified.push(file);
    else if (code.includes('A')) added.push(file);
    else if (code.includes('D')) deleted.push(file);
    else if (code.includes('R')) renamed.push(file);
    else if (code === '??') untracked.push(file);
});

console.log(`MODIFIED FILES (${modified.length}):`);
modified.forEach(f => console.log(`  - ${f}`));
if (!modified.length) console.log('  (None)');

console.log(`\nUNTRACKED / NEW FILES (${untracked.length}):`);
untracked.forEach(f => console.log(`  - ${f}`));
if (!untracked.length) console.log('  (None)');

console.log(`\nDELETED FILES (${deleted.length}):`);
deleted.forEach(f => console.log(`  - ${f}`));
if (!deleted.length) console.log('  (None)');

console.log(`\nSTAGED FILES (${staged.length}):`);
staged.forEach(f => console.log(`  - ${f}`));
if (!staged.length) console.log('  (None)');

// 4. Sensitive Files Check
const sensitivePatterns = [
    /^\.env$/i,
    /^\.env\.(?!example$)/i,
    /keystore/i,
    /secret/i,
    /credential/i,
    /service-account.*\.json$/i,
    /\.pem$/i,
    /\.key$/i
];

const sensitiveDetected = [...modified, ...untracked, ...staged].filter(file => {
    return sensitivePatterns.some(pat => pat.test(file));
});

console.log('\n-------------------------------------------------------');
console.log('SENSITIVE FILES CHECK:');
if (sensitiveDetected.length > 0) {
    console.log('⚠️ SENSITIVE FILES DETECTED (DO NOT COMMIT):');
    sensitiveDetected.forEach(f => console.log(`  - 🛑 ${f}`));
} else {
    console.log('✅ PASS: No unignored sensitive files or raw keys detected.');
}
console.log('-------------------------------------------------------\n');

// 5. Staged Diff Summary
const stagedStat = run('git diff --cached --stat');
if (stagedStat) {
    console.log('STAGED CHANGES SUMMARY:');
    console.log(stagedStat);
} else {
    console.log('STAGED CHANGES SUMMARY: No changes currently staged for commit.');
}

console.log('\n=======================================================');
console.log('SAFE WORKFLOW INSTRUCTIONS:');
console.log('1. Review unstaged diff:    npm run git:diff');
console.log('2. Stage specific file:     git add <file-path>');
console.log('3. Review staged diff:      npm run git:staged');
console.log('4. Commit when approved:    git commit --no-gpg-sign -m "Descriptive message"');
console.log('5. Push when approved:      git push origin <current-branch>');
console.log('=======================================================\n');
