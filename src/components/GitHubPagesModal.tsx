import React, { useState } from 'react';
import { X, Copy, Check, Github, ExternalLink, ShieldCheck, Zap, Sparkles } from 'lucide-react';

interface GitHubPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubPagesModal: React.FC<GitHubPagesModalProps> = ({ isOpen, onClose }) => {
  const [copiedAction, setCopiedAction] = useState(false);
  const [copiedViteConfig, setCopiedViteConfig] = useState(false);

  if (!isOpen) return null;

  const githubActionYaml = `name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build static site
        run: npm run build

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

  const copyYaml = () => {
    navigator.clipboard.writeText(githubActionYaml);
    setCopiedAction(true);
    setTimeout(() => setCopiedAction(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-b from-[#111622] to-[#0b0e14] border border-cyan-500/20 shadow-2xl p-6 text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Github className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Deploy to GitHub Pages
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                100% Free & No API Keys
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Host your private local AI chat interface on GitHub Pages with zero server costs
            </p>
          </div>
        </div>

        {/* Highlight Why it works */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 mb-5">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-300">
              <strong className="text-white">Zero API Keys Leaked:</strong> Since all model inference happens locally (via the visitor&apos;s browser WebGPU, or their local Ollama instance on localhost), your GitHub repository contains NO secret keys or billed credentials.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-300">
              <strong className="text-white">Static Client-Side Bundle:</strong> Vite outputs pure HTML, JS, and CSS that loads instantaneously on GitHub Pages or custom domains.
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 text-xs">
          <div>
            <div className="flex items-center gap-2 font-semibold text-white mb-1.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs">1</span>
              Push this repository to GitHub
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 font-mono text-slate-300">
              git add .<br />
              git commit -m &quot;feat: initial local AI chat release&quot;<br />
              git push origin main
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between font-semibold text-white mb-1.5">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs">2</span>
                Automated Deployment Workflow (.github/workflows/deploy.yml)
              </div>
              <button
                onClick={copyYaml}
                className="flex items-center gap-1.5 py-1 px-2.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all font-mono text-[11px]"
              >
                {copiedAction ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedAction ? 'Copied YAML!' : 'Copy Workflow'}
              </button>
            </div>
            <div className="p-3 rounded-lg bg-black/60 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48">
              <pre>{githubActionYaml}</pre>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 font-semibold text-white mb-1.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs">3</span>
              Enable GitHub Pages in Repository Settings
            </div>
            <p className="text-slate-400 leading-relaxed">
              Navigate to your GitHub repository <strong className="text-slate-200">Settings &gt; Pages</strong>. Under <strong>Build and deployment &gt; Source</strong>, select <strong className="text-cyan-300">GitHub Actions</strong>. Your site will automatically build and publish to <code className="text-cyan-400">https://&lt;username&gt;.github.io/&lt;repo&gt;/</code>!
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
