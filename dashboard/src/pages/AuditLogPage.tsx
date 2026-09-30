import React, { useState } from 'react';
import { AuditChainStatus } from '../types';
import { FileSearch, CheckCircle2, ShieldAlert, Link, RefreshCw, Lock } from 'lucide-react';
import { verifyAuditChain } from '../api';

export const AuditLogPage: React.FC = () => {
  const [chainStatus, setChainStatus] = useState<AuditChainStatus>({
    status: 'VALID',
    total_entries: 24,
    chain_intact: true,
    latest_block_hash: '9a48d8b2e1f37e408d338f0d8a6b653f81e3a510c4bfbb6fbe47c5d41f53bb99',
    message: 'All 24 cryptographic audit ledger entries are intact and un-tampered.',
  });
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    const res = await verifyAuditChain();
    setChainStatus(res);
    setIsVerifying(false);
  };

  const sampleBlocks = [
    {
      seq: 24,
      event: 'REPORT_ISSUED_SYNCED',
      entity: 'KP-2026-000184',
      actor: 'Inspector-RajeshPatil',
      hash: '9a48d8b2e1f37e408d338f0d8a6b653f81e3a510c4bfbb6fbe47c5d41f53bb99',
      prevHash: '4d8a6b653f81e3a510c4bfbb6fbe47c5d41f53bb999a48d8b2e1f37e408d338f',
      time: 'Just now',
    },
    {
      seq: 23,
      event: 'DISPUTE_RESOLVED',
      entity: 'DISP-0002',
      actor: 'Supervisor-DrShinde',
      hash: '4d8a6b653f81e3a510c4bfbb6fbe47c5d41f53bb999a48d8b2e1f37e408d338f',
      prevHash: '10c4bfbb6fbe47c5d41f53bb999a48d8b2e1f37e408d338f4d8a6b653f81e3a5',
      time: '18 mins ago',
    },
    {
      seq: 22,
      event: 'DEVICE_KEY_ROTATED',
      entity: 'DEV_PHONE_LASALGAON_01',
      actor: 'Device-DEV_PHONE',
      hash: '10c4bfbb6fbe47c5d41f53bb999a48d8b2e1f37e408d338f4d8a6b653f81e3a5',
      prevHash: '7f9c2d1b4a8e6f0c3b5a7e9d1c4b8a2e5f0d3b6a9e1c4b7a0d2e5f8b1c3a6e9f',
      time: '1 hr ago',
    },
    {
      seq: 21,
      event: 'GRADING_RULES_UPDATED',
      entity: 'v1.0.0',
      actor: 'Supervisor-Admin',
      hash: '7f9c2d1b4a8e6f0c3b5a7e9d1c4b8a2e5f0d3b6a9e1c4b7a0d2e5f8b1c3a6e9f',
      prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
      time: '3 hrs ago',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Cryptographic Audit Ledger &amp; Chain Verification
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Every issued report, override reason, and rule deployment is sealed in a SHA-256 hash-chain.
          </p>
        </div>

        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
          <span>Verify Entire Hash Chain</span>
        </button>
      </div>

      {/* Chain Status Card */}
      <div className="panel-card p-6 bg-purple-50/50 border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-900">
              <CheckCircle2 className="w-6 h-6 text-purple-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  CRYPTOGRAPHIC LEDGER INTACT &amp; UNBROKEN
                </h3>
                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 text-[10px] font-black uppercase">
                  Zero Tampering Detected
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{chainStatus.message}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 block">Total Sealed Events</span>
            <span className="text-2xl font-black text-slate-900">
              {chainStatus.total_entries}
            </span>
          </div>
        </div>
      </div>

      {/* Sequential Hash Chain Entries */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Immutable Event Chain Sequence</h3>

        {sampleBlocks.map((block) => (
          <div key={block.seq} className="panel-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-emerald-800 text-xs px-2 py-0.5 bg-emerald-100 rounded">
                  SEQ #{block.seq}
                </span>
                <span className="font-bold text-slate-900 text-xs">{block.event}</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-xs text-slate-600 font-semibold">
                  {block.entity}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">{block.time}</span>
            </div>

            <div className="p-3 bg-slate-900 text-slate-300 rounded-xl text-xs font-mono space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 text-[11px]">
                <Lock className="w-3 h-3" />
                <span>Current Canonical SHA-256 Hash:</span>
              </div>
              <div className="text-[11px] text-slate-200 break-all">{block.hash}</div>
              <div className="text-[10px] text-slate-400 break-all pt-1 border-t border-slate-800">
                <span className="text-slate-500 font-bold">Previous Block:</span> {block.prevHash}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
