import React, { useState } from 'react';
import { Play, Square, Download, Upload, Activity, CheckCircle2, XCircle, Clock, Trash2, Copy, UserPlus, List } from 'lucide-react';
import { parseInput, exportData } from './utils/parser';
import { useCheckManager } from './hooks/useCheckManager';
import type { AccountStatus } from './types';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function App() {
  const [inputMode, setInputMode] = useState<'bulk' | 'single'>('bulk');
  const [inputText, setInputText] = useState('');
  const [singleEmail, setSingleEmail] = useState('');
  const [singlePassword, setSinglePassword] = useState('');

  const {
    accounts,
    stats,
    isChecking,
    concurrency,
    setConcurrency,
    startChecking,
    stopChecking,
    loadAccounts,
    clearAccounts
  } = useCheckManager();

  const handleParse = () => {
    const parsed = parseInput(inputText);
    if (parsed.length > 0) {
      loadAccounts(parsed); // overwrite old accounts by default
      setInputText('');
    } else {
      alert('No valid accounts found. Ensure format is email|app_password');
    }
  };

  const handleSingleAdd = (startImmediately: boolean) => {
    if (singleEmail.trim() && singlePassword.trim()) {
      // Very basic sanity check
      if (!singleEmail.includes('@')) {
        alert('Invalid email format');
        return;
      }
      loadAccounts([{ email: singleEmail.trim(), app_password: singlePassword.trim() }], startImmediately, true);
      setSingleEmail('');
      setSinglePassword('');
    } else {
      alert('Please fill in both email and app password');
    }
  };

  const copyData = (status: 'SUCCESS' | 'FAILED') => {
    const filtered = accounts.filter(a => a.status === status || (status === 'FAILED' && a.status === 'ERROR'));
    const content = filtered.map(a => `${a.email}|${a.app_password}`).join('\n');
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      alert(`Copied ${filtered.length} accounts to clipboard!`);
    });
  };

  const progress = stats.total > 0 ? (stats.checked / stats.total) * 100 : 0;
  
  const hasNewBulkInput = inputMode === 'bulk' && inputText.trim().length > 0;
  const hasNewSingleInput = inputMode === 'single' && singleEmail.trim().length > 0 && singlePassword.trim().length > 0;
  const hasNewInput = hasNewBulkInput || hasNewSingleInput;
  
  const isFinished = accounts.length > 0 && stats.checked === stats.total;
  const canStart = !isChecking && (hasNewInput || (accounts.length > 0 && !isFinished));

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Likepion CheckMail
          </h1>
          <p className="text-muted-foreground mt-1">High-performance App Password Validator</p>
        </div>
        <div className="flex gap-2">
           <button
             onClick={clearAccounts}
             disabled={accounts.length === 0 && !inputText.trim() && !singleEmail.trim()}
             className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
           >
             <Trash2 size={16} /> Clear All
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Input & Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border rounded-xl p-4 shadow-sm relative group space-y-4">
            
            <div className="h-[280px] flex flex-col space-y-4">
              <div className="flex p-1 bg-background rounded-lg border shrink-0">
                <button 
                  onClick={() => setInputMode('bulk')}
                  className={cn("flex-1 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5", inputMode === 'bulk' ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  <List size={14} /> Bulk List
                </button>
                <button 
                  onClick={() => setInputMode('single')}
                  className={cn("flex-1 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5", inputMode === 'single' ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  <UserPlus size={14} /> Single
                </button>
              </div>

              <div className="flex-1 flex flex-col">
                {inputMode === 'bulk' ? (
                  <div className="flex-1 flex flex-col space-y-2">
                    <label className="text-sm font-medium text-foreground/80 flex justify-between items-center h-6">
                      Bulk Input
                      {hasNewBulkInput && (
                        <button onClick={() => setInputText('')} className="text-xs text-muted-foreground hover:text-white flex items-center gap-1">
                          <Trash2 size={12} /> Clear
                        </button>
                      )}
                    </label>
                    <textarea
                      className="w-full flex-1 bg-background border rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="example@gmail.com|abcd efgh ijkl mnop&#10;test@gmail.com|1234 5678 9012"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      disabled={isChecking}
                    />
                    <button
                      onClick={handleParse}
                      disabled={isChecking || !hasNewBulkInput}
                      className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 mt-3"
                    >
                      <Upload size={18} /> Load to Table
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col space-y-3">
                     <label className="block text-sm font-medium text-foreground/80 h-6 flex items-center">Single Account</label>
                     <div className="flex-1 flex flex-col justify-center space-y-4">
                       <input
                         type="email"
                         placeholder="Email Address"
                         value={singleEmail}
                         onChange={(e) => setSingleEmail(e.target.value)}
                         disabled={isChecking}
                         className="w-full bg-background border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                       />
                       <input
                         type="text"
                         placeholder="App Password (e.g. abcd efgh ijkl mnop)"
                         value={singlePassword}
                         onChange={(e) => setSinglePassword(e.target.value)}
                         disabled={isChecking}
                         className="w-full bg-background border rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                       />
                     </div>
                     <button
                      onClick={() => handleSingleAdd(false)}
                      disabled={isChecking || !hasNewSingleInput}
                      className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 mt-3"
                    >
                      <UserPlus size={18} /> Add to Table
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground/80 flex items-center justify-between">
                <span>Concurrency (Threads)</span>
                <span className="text-blue-400 font-bold">{concurrency}</span>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                disabled={isChecking}
                className="w-full accent-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (hasNewInput) {
                    if (inputMode === 'bulk') {
                      const parsed = parseInput(inputText);
                      if (parsed.length > 0) {
                        loadAccounts(parsed, true);
                        setInputText('');
                      } else {
                        alert('No valid accounts found.');
                      }
                    } else {
                      handleSingleAdd(true);
                    }
                  } else {
                    startChecking();
                  }
                }}
                disabled={!canStart}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <Play size={18} fill="currentColor" /> Start
              </button>
              <button
                onClick={stopChecking}
                disabled={!isChecking}
                className="bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Square size={18} fill="currentColor" /> Stop
              </button>
            </div>
            
            <div className="pt-2 border-t mt-4 border-border space-y-2">
              <div className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">Export & Copy</div>
              <div className="grid grid-cols-2 gap-2">
                 <button
                  onClick={() => exportData(accounts, 'SUCCESS')}
                  disabled={stats.success === 0}
                  className="bg-green-600/10 text-green-500 hover:bg-green-600 hover:text-white py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 border border-green-500/20"
                >
                  <Download size={14} /> TXT Live
                </button>
                 <button
                  onClick={() => copyData('SUCCESS')}
                  disabled={stats.success === 0}
                  className="bg-green-600/10 text-green-500 hover:bg-green-600 hover:text-white py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 border border-green-500/20"
                >
                  <Copy size={14} /> Copy Live
                </button>
                 <button
                  onClick={() => exportData(accounts, 'FAILED')}
                  disabled={stats.failed === 0 && stats.error === 0}
                  className="bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 border border-red-500/20"
                >
                  <Download size={14} /> TXT Die
                </button>
                <button
                  onClick={() => copyData('FAILED')}
                  disabled={stats.failed === 0 && stats.error === 0}
                  className="bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 border border-red-500/20"
                >
                  <Copy size={14} /> Copy Die
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Table */}
        <div className="lg:col-span-3 space-y-6 flex flex-col">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total" value={stats.total} icon={<Activity size={20} className="text-blue-400" />} />
            <StatCard title="Success (Live)" value={stats.success} icon={<CheckCircle2 size={20} className="text-green-500" />} />
            <StatCard title="Failed/Error" value={stats.failed + stats.error} icon={<XCircle size={20} className="text-red-500" />} />
            <StatCard title="Speed" value={stats.cpm} icon={<Clock size={20} className="text-purple-400" />} subtitle="checks/min" />
          </div>

          {/* Progress Bar */}
          <div className="bg-card border rounded-xl p-4 shadow-sm">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="text-muted-foreground">Progress ({stats.checked}/{stats.total})</span>
              <span className="text-blue-400 font-bold">{progress.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-out relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                {isChecking && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-card border rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col min-h-[400px]">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left relative">
                <thead className="text-xs text-muted-foreground uppercase bg-background/50 sticky top-0 z-10 backdrop-blur-md border-b">
                  <tr>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">App Password</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Message</th>
                    <th className="px-6 py-4 font-medium">Time (ms)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {accounts.map((account) => (
                    <tr 
                      key={account.id} 
                      className={cn(
                        "hover:bg-background/50 transition-colors",
                        account.status === 'ERROR' && "bg-orange-500/5",
                        account.status === 'FAILED' && "bg-red-500/5",
                        account.status === 'SUCCESS' && "bg-green-500/5",
                        account.status === 'RUNNING' && "bg-blue-500/5"
                      )}
                    >
                      <td className="px-6 py-3 font-medium truncate max-w-[200px]">{account.email}</td>
                      <td className="px-6 py-3 font-mono text-muted-foreground truncate max-w-[150px]">{account.app_password}</td>
                      <td className="px-6 py-3">
                        <StatusBadge status={account.status} />
                      </td>
                      <td className="px-6 py-3 text-muted-foreground max-w-[250px] truncate" title={account.message}>
                        {account.message || '-'}
                        {account.retryCount > 0 && <span className="ml-2 text-xs text-orange-400">(Retry: {account.retryCount})</span>}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground font-mono">{account.responseTime ? `${account.responseTime}ms` : '-'}</td>
                    </tr>
                  ))}
                  {accounts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-3">
                          <Upload size={32} className="opacity-20" />
                          <p>No accounts loaded. Paste accounts in the left panel and click Start.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, subtitle }: { title: string, value: number, icon: React.ReactNode, subtitle?: string }) {
  return (
    <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center gap-4">
      <div className="p-3 bg-background rounded-lg border">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="flex items-baseline gap-1">
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: AccountStatus }) {
  const styles = {
    PENDING: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    RUNNING: "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse",
    SUCCESS: "bg-green-500/10 text-green-400 border-green-500/20",
    FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
    ERROR: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };

  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1.5", styles[status])}>
      {status === 'RUNNING' && <div className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />}
      {status}
    </span>
  );
}

export default App;
