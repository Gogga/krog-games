import { useState } from 'react';

type Page = 'overview' | 'decisions' | 'transfer' | 'rtypes' | 'experiments' | 'export' | 'neurosymbolic';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('overview');

  return (
    <div className="dashboard">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="main-content">
        {currentPage === 'overview' && <OverviewPage />}
        {currentPage === 'decisions' && <DecisionAnalysisPage />}
        {currentPage === 'transfer' && <TransferLearningPage />}
        {currentPage === 'rtypes' && <RTypeMasteryPage />}
        {currentPage === 'experiments' && <ExperimentsPage />}
        {currentPage === 'export' && <DataExportPage />}
        {currentPage === 'neurosymbolic' && <NeurosymbolicPage />}
      </main>
    </div>
  );
}

function Sidebar({ currentPage, setCurrentPage }: { currentPage: Page; setCurrentPage: (p: Page) => void }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span>KROG Analytics</span>
      </div>

      <nav>
        <div className="nav-section">
          <div className="nav-section-title">Dashboard</div>
          <div
            className={`nav-item ${currentPage === 'overview' ? 'active' : ''}`}
            onClick={() => setCurrentPage('overview')}
          >
            Overview
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Analysis</div>
          <div
            className={`nav-item ${currentPage === 'decisions' ? 'active' : ''}`}
            onClick={() => setCurrentPage('decisions')}
          >
            Decision Patterns
          </div>
          <div
            className={`nav-item ${currentPage === 'transfer' ? 'active' : ''}`}
            onClick={() => setCurrentPage('transfer')}
          >
            Transfer Learning
          </div>
          <div
            className={`nav-item ${currentPage === 'rtypes' ? 'active' : ''}`}
            onClick={() => setCurrentPage('rtypes')}
          >
            R-Type Mastery
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Research</div>
          <div
            className={`nav-item ${currentPage === 'neurosymbolic' ? 'active' : ''}`}
            onClick={() => setCurrentPage('neurosymbolic')}
          >
            Neurosymbolic AI
          </div>
          <div
            className={`nav-item ${currentPage === 'experiments' ? 'active' : ''}`}
            onClick={() => setCurrentPage('experiments')}
          >
            Experiments
          </div>
          <div
            className={`nav-item ${currentPage === 'export' ? 'active' : ''}`}
            onClick={() => setCurrentPage('export')}
          >
            Data Export
          </div>
        </div>
      </nav>
    </aside>
  );
}

function OverviewPage() {
  return (
    <>
      <div className="page-header">
        <h1>Analytics Overview</h1>
        <p>Cross-game decision analysis and learning insights</p>
      </div>

      <div className="card-grid">
        <MetricCard
          title="Total Decisions Tracked"
          value="1,247,832"
          trend="+12.5%"
          trendUp
        />
        <MetricCard
          title="Active Players"
          value="8,429"
          trend="+8.2%"
          trendUp
        />
        <MetricCard
          title="Cross-Game Transfer Rate"
          value="67.3%"
          trend="+3.1%"
          trendUp
        />
        <MetricCard
          title="Avg R-Type Mastery"
          value="4.2 / 7"
          trend="+0.3"
          trendUp
        />
      </div>

      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Decision Volume by Game</h3>
          <select className="filter-select">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>
        <div className="chart-placeholder">
          Chart: Decision volume across Chess, Shogi, Go, Checkers over time
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">R-Type Distribution</h3>
          </div>
          <RTypeHeatmap />
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">T-Type Usage</h3>
          </div>
          <div className="chart-placeholder">
            Chart: T1-T7 distribution across all games
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">Recent Decision Patterns</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Pattern</th>
              <th>R-Type Sequence</th>
              <th>Games</th>
              <th>Transfer Potential</th>
              <th>Occurrences</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Strategic Planning</td>
              <td><span className="badge badge-blue">R8</span> → <span className="badge badge-purple">R15</span> → <span className="badge badge-blue">R8</span></td>
              <td>Chess, Shogi</td>
              <td><span className="badge badge-green">High</span></td>
              <td>12,847</td>
            </tr>
            <tr>
              <td>Tactical Sequence</td>
              <td><span className="badge badge-orange">R11</span> → <span className="badge badge-orange">R11</span> → <span className="badge badge-purple">R32</span></td>
              <td>Chess, Checkers</td>
              <td><span className="badge badge-green">High</span></td>
              <td>8,234</td>
            </tr>
            <tr>
              <td>Territory Control</td>
              <td><span className="badge badge-purple">R15</span> → <span className="badge badge-blue">R8</span> → <span className="badge badge-purple">R15</span></td>
              <td>Go, Shogi</td>
              <td><span className="badge badge-orange">Medium</span></td>
              <td>6,921</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

function DecisionAnalysisPage() {
  return (
    <>
      <div className="page-header">
        <h1>Decision Pattern Analysis</h1>
        <p>Neurosymbolic analysis of player decision-making across games</p>
      </div>

      <div className="filter-bar">
        <select className="filter-select">
          <option>All Games</option>
          <option>Chess</option>
          <option>Shogi</option>
          <option>Go</option>
          <option>Checkers</option>
        </select>
        <select className="filter-select">
          <option>All R-Types</option>
          <option>R1-R7 (T1 combinations)</option>
          <option>R8-R14 (T2 combinations)</option>
          <option>R15-R21 (T3 combinations)</option>
          <option>R22-R28 (T4 combinations)</option>
          <option>R29-R35 (T5+ combinations)</option>
        </select>
        <select className="filter-select">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
        </select>
        <button className="btn btn-primary">Apply Filters</button>
      </div>

      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Decision Timing Distribution</h3>
        </div>
        <div className="chart-placeholder">
          Chart: Histogram of thinking times by R-type
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Pattern Co-occurrence Matrix</h3>
          </div>
          <div className="chart-placeholder">
            Heatmap: Which R-types tend to appear together
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Decision Quality by Context</h3>
          </div>
          <div className="chart-placeholder">
            Chart: Accuracy by time pressure, game phase, etc.
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">Identified Cognitive Patterns</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Pattern Name</th>
              <th>Description</th>
              <th>R-Type Signature</th>
              <th>Avg Thinking Time</th>
              <th>Error Rate</th>
              <th>Players</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Analytical Planner</td>
              <td>Systematic evaluation before action</td>
              <td>R8 → R15 → R8</td>
              <td>8.2s</td>
              <td>12%</td>
              <td>2,341</td>
            </tr>
            <tr>
              <td>Intuitive Mover</td>
              <td>Quick pattern recognition</td>
              <td>R11 → R11</td>
              <td>2.1s</td>
              <td>18%</td>
              <td>3,892</td>
            </tr>
            <tr>
              <td>Defensive Anchor</td>
              <td>Priority on safety</td>
              <td>R32 → R15</td>
              <td>5.4s</td>
              <td>8%</td>
              <td>1,567</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

function TransferLearningPage() {
  return (
    <>
      <div className="page-header">
        <h1>Cross-Game Transfer Learning</h1>
        <p>Measure and visualize skill transfer between games via shared R-types</p>
      </div>

      <div className="card-grid">
        <MetricCard
          title="Positive Transfer Cases"
          value="12,847"
          trend="+15.2%"
          trendUp
        />
        <MetricCard
          title="Negative Transfer Cases"
          value="1,234"
          trend="-8.1%"
          trendUp
        />
        <MetricCard
          title="Most Transferable R-Type"
          value="R8"
          trend="Strategic Planning"
          trendUp={false}
        />
        <MetricCard
          title="Best Transfer Pair"
          value="Chess → Shogi"
          trend="73% transfer rate"
          trendUp={false}
        />
      </div>

      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Game Transfer Network</h3>
        </div>
        <div className="chart-placeholder" style={{ height: '400px' }}>
          Network Graph: Games as nodes, transfer rates as weighted edges
          <br /><br />
          Chess ←→ Shogi (73%)
          <br />
          Chess ←→ Checkers (61%)
          <br />
          Shogi ←→ Go (45%)
          <br />
          Go ←→ Chess (38%)
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">R-Type Transfer Scores</h3>
          </div>
          <div className="chart-placeholder">
            Bar chart: Transfer scores for each R-type across game pairs
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Transfer Learning Over Time</h3>
          </div>
          <div className="chart-placeholder">
            Line chart: How transfer rates improve with multi-game experience
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">Transfer Learning by R-Type</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>R-Type</th>
              <th>Description</th>
              <th>Source Games</th>
              <th>Target Games</th>
              <th>Transfer Score</th>
              <th>Sample Size</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="badge badge-blue">R8</span></td>
              <td>Strategic positioning</td>
              <td>Chess, Shogi</td>
              <td>Go, Checkers</td>
              <td><span className="badge badge-green">0.82</span></td>
              <td>8,432</td>
            </tr>
            <tr>
              <td><span className="badge badge-purple">R11</span></td>
              <td>Tactical patterns</td>
              <td>Chess</td>
              <td>Shogi, Checkers</td>
              <td><span className="badge badge-green">0.76</span></td>
              <td>12,891</td>
            </tr>
            <tr>
              <td><span className="badge badge-orange">R32</span></td>
              <td>Defensive maneuvers</td>
              <td>Chess, Go</td>
              <td>All</td>
              <td><span className="badge badge-orange">0.58</span></td>
              <td>6,234</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

function RTypeMasteryPage() {
  return (
    <>
      <div className="page-header">
        <h1>R-Type Mastery Analysis</h1>
        <p>Track mastery levels across all 35 R-types and 7 T-types</p>
      </div>

      <div className="filter-bar">
        <select className="filter-select">
          <option>All Players</option>
          <option>Novice (0-1000)</option>
          <option>Intermediate (1000-1500)</option>
          <option>Advanced (1500-2000)</option>
          <option>Expert (2000+)</option>
        </select>
        <select className="filter-select">
          <option>All Games</option>
          <option>Chess</option>
          <option>Shogi</option>
          <option>Go</option>
        </select>
        <button className="btn btn-primary">Generate Report</button>
      </div>

      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">R-Type Mastery Heatmap (35 R-Types × Player Skill Levels)</h3>
        </div>
        <RTypeFullHeatmap />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">T-Type Distribution by Skill Level</h3>
          </div>
          <div className="chart-placeholder">
            Stacked bar: How T-type usage changes with skill
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Mastery Progression Curves</h3>
          </div>
          <div className="chart-placeholder">
            Line chart: Average mastery progression for each R-type
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">Skill Gap Analysis</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Skill Level</th>
              <th>Most Common Gap</th>
              <th>Recommended Focus</th>
              <th>Avg Time to Master</th>
              <th>Players Affected</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Novice</td>
              <td><span className="badge badge-orange">R11</span> Tactical awareness</td>
              <td>Pattern recognition puzzles</td>
              <td>~2 weeks</td>
              <td>3,421</td>
            </tr>
            <tr>
              <td>Intermediate</td>
              <td><span className="badge badge-purple">R15</span> Strategic planning</td>
              <td>Positional lessons</td>
              <td>~4 weeks</td>
              <td>2,187</td>
            </tr>
            <tr>
              <td>Advanced</td>
              <td><span className="badge badge-blue">R8</span> Complex evaluation</td>
              <td>Game analysis review</td>
              <td>~6 weeks</td>
              <td>892</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

function ExperimentsPage() {
  return (
    <>
      <div className="page-header">
        <h1>Research Experiments</h1>
        <p>Configure and monitor A/B tests and research experiments</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div className="filter-bar">
          <select className="filter-select">
            <option>All Status</option>
            <option>Draft</option>
            <option>Running</option>
            <option>Completed</option>
          </select>
        </div>
        <button className="btn btn-primary">+ New Experiment</button>
      </div>

      <div className="card-grid">
        <MetricCard
          title="Active Experiments"
          value="3"
          trend="2 pending review"
          trendUp={false}
        />
        <MetricCard
          title="Total Participants"
          value="4,892"
          trend="+342 this week"
          trendUp
        />
        <MetricCard
          title="Completed Studies"
          value="12"
          trend="8 published"
          trendUp={false}
        />
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">Experiment Registry</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Experiment</th>
              <th>Hypothesis</th>
              <th>Status</th>
              <th>Participants</th>
              <th>Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Transfer Learning Boost</strong>
                <br /><small style={{ color: 'var(--text-secondary)' }}>EXP-2024-001</small>
              </td>
              <td>Cross-game recommendations improve R8 mastery by 15%</td>
              <td><span className="badge badge-green">Running</span></td>
              <td>1,234 / 2,000</td>
              <td>62%</td>
              <td>
                <button className="btn btn-secondary">View</button>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Spaced Repetition Timing</strong>
                <br /><small style={{ color: 'var(--text-secondary)' }}>EXP-2024-002</small>
              </td>
              <td>Optimal review intervals for R-type retention</td>
              <td><span className="badge badge-green">Running</span></td>
              <td>892 / 1,000</td>
              <td>89%</td>
              <td>
                <button className="btn btn-secondary">View</button>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Cognitive Load Analysis</strong>
                <br /><small style={{ color: 'var(--text-secondary)' }}>EXP-2024-003</small>
              </td>
              <td>T-type complexity correlates with thinking time</td>
              <td><span className="badge badge-orange">Draft</span></td>
              <td>0 / 500</td>
              <td>0%</td>
              <td>
                <button className="btn btn-secondary">Edit</button>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Multi-Game Learning Path</strong>
                <br /><small style={{ color: 'var(--text-secondary)' }}>EXP-2023-012</small>
              </td>
              <td>Sequential game learning accelerates skill acquisition</td>
              <td><span className="badge badge-blue">Completed</span></td>
              <td>2,000 / 2,000</td>
              <td>100%</td>
              <td>
                <button className="btn btn-secondary">Results</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

function DataExportPage() {
  return (
    <>
      <div className="page-header">
        <h1>Research Data Export</h1>
        <p>Export anonymized datasets for academic research</p>
      </div>

      <div className="card-grid">
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Decision Events</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Anonymized decision-level data with R-type classifications, timing, and context.
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <span className="badge badge-blue">1.2M records</span>
            <span className="badge badge-purple" style={{ marginLeft: '0.5rem' }}>~450MB</span>
          </div>
          <button className="btn btn-primary">Configure Export</button>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Cognitive Profiles</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Aggregated player profiles with R-type strengths/weaknesses and transfer scores.
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <span className="badge badge-blue">8.4K profiles</span>
            <span className="badge badge-purple" style={{ marginLeft: '0.5rem' }}>~12MB</span>
          </div>
          <button className="btn btn-primary">Configure Export</button>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Transfer Patterns</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Cross-game transfer learning metrics and pattern co-occurrences.
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <span className="badge badge-blue">35K patterns</span>
            <span className="badge badge-purple" style={{ marginLeft: '0.5rem' }}>~8MB</span>
          </div>
          <button className="btn btn-primary">Configure Export</button>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Game Sessions</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Session-level summaries with R-type distributions and outcomes.
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <span className="badge badge-blue">156K sessions</span>
            <span className="badge badge-purple" style={{ marginLeft: '0.5rem' }}>~28MB</span>
          </div>
          <button className="btn btn-primary">Configure Export</button>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Export Configuration</h3>
        </div>
        <div style={{ padding: '1rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Date Range
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input type="date" className="filter-select" />
              <span style={{ alignSelf: 'center' }}>to</span>
              <input type="date" className="filter-select" />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Games to Include
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" defaultChecked /> Chess
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" defaultChecked /> Shogi
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" /> Go
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" /> Checkers
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Anonymization Level
            </label>
            <select className="filter-select" style={{ width: '300px' }}>
              <option>Full anonymization (recommended)</option>
              <option>Pseudonymization</option>
              <option>Aggregated only</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Export Format
            </label>
            <select className="filter-select" style={{ width: '300px' }}>
              <option>JSON (structured)</option>
              <option>CSV (tabular)</option>
              <option>Parquet (columnar)</option>
            </select>
          </div>

          <button className="btn btn-primary">Generate Export</button>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">Recent Exports</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Export ID</th>
              <th>Type</th>
              <th>Date Range</th>
              <th>Size</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>EXP-20241228-001</td>
              <td>Decision Events</td>
              <td>2024-11-01 to 2024-12-28</td>
              <td>234MB</td>
              <td>2 hours ago</td>
              <td><button className="btn btn-secondary">Download</button></td>
            </tr>
            <tr>
              <td>EXP-20241225-003</td>
              <td>Transfer Patterns</td>
              <td>2024-01-01 to 2024-12-25</td>
              <td>8MB</td>
              <td>3 days ago</td>
              <td><button className="btn btn-secondary">Download</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

// ============================================
// Shared Components
// ============================================

function MetricCard({ title, value, trend, trendUp }: {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{title}</span>
      </div>
      <div className="card-value">{value}</div>
      <div className={`card-trend ${trendUp ? 'up' : ''}`}>
        {trendUp && '↑'} {trend}
      </div>
    </div>
  );
}

function RTypeHeatmap() {
  // Simple 7x5 grid for overview (R1-R35)
  const cells = [];
  for (let i = 1; i <= 35; i++) {
    const intensity = Math.random();
    const color = intensity > 0.7
      ? 'rgba(34, 197, 94, 0.8)'
      : intensity > 0.4
        ? 'rgba(245, 158, 11, 0.8)'
        : 'rgba(239, 68, 68, 0.5)';

    cells.push(
      <div
        key={i}
        className="rtype-cell"
        style={{ background: color }}
        title={`R${i}: ${Math.round(intensity * 100)}% mastery`}
      >
        R{i}
      </div>
    );
  }

  return <div className="rtype-grid">{cells}</div>;
}

function RTypeFullHeatmap() {
  // 35 R-types × 5 skill levels
  const skillLevels = ['Novice', 'Intermediate', 'Advanced', 'Expert', 'Master'];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: '0.75rem' }}>
        <thead>
          <tr>
            <th style={{ padding: '0.5rem' }}>R-Type</th>
            {skillLevels.map(level => (
              <th key={level} style={{ padding: '0.5rem', textAlign: 'center' }}>{level}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 35 }, (_, i) => (
            <tr key={i}>
              <td style={{ padding: '0.5rem', fontWeight: 600 }}>R{i + 1}</td>
              {skillLevels.map((level, j) => {
                const mastery = Math.random() * 0.3 + (j * 0.15);
                const color = mastery > 0.7
                  ? 'rgba(34, 197, 94, 0.8)'
                  : mastery > 0.4
                    ? 'rgba(245, 158, 11, 0.8)'
                    : 'rgba(239, 68, 68, 0.5)';
                return (
                  <td
                    key={level}
                    style={{
                      padding: '0.5rem',
                      background: color,
                      textAlign: 'center',
                      color: 'white',
                      fontWeight: 500,
                    }}
                  >
                    {Math.round(mastery * 100)}%
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NeurosymbolicPage() {
  return (
    <>
      <div className="page-header">
        <h1>Neurosymbolic AI Platform</h1>
        <p>Understanding the KROG Games research advantage</p>
      </div>

      {/* Key Concept Banner */}
      <div className="chart-container" style={{ borderLeft: '4px solid var(--color-primary)', marginBottom: '2rem' }}>
        <h3 className="chart-title" style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>
          The Future of Explainable AI
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.8' }}>
          KROG Games is the world's first neurosymbolic game platform. We combine neural pattern recognition
          (learning from player behavior) with symbolic logical reasoning (formal game rules) to create
          AI that can explain its decisions - something traditional deep learning cannot do.
        </p>
      </div>

      {/* Two AI Paradigms */}
      <div className="card-grid" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ borderLeft: '4px solid #e67e22' }}>
          <h4 style={{ color: '#e67e22', marginBottom: '0.5rem' }}>Neural AI (Pattern)</h4>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Deep learning recognizes patterns from massive datasets. Powerful but opaque.
          </p>
          <ul style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85rem', paddingLeft: '1.25rem' }}>
            <li>Cannot explain decisions</li>
            <li>Requires millions of examples</li>
            <li>No knowledge transfer</li>
          </ul>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <h4 style={{ color: '#3b82f6', marginBottom: '0.5rem' }}>Symbolic AI (Logic)</h4>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Rule-based reasoning with explicit logic. Interpretable but brittle.
          </p>
          <ul style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85rem', paddingLeft: '1.25rem' }}>
            <li>Fully explainable</li>
            <li>Requires hand-coded rules</li>
            <li>Breaks on edge cases</li>
          </ul>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Neurosymbolic (KROG)</h4>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Best of both worlds: pattern recognition + logical rules.
          </p>
          <ul style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85rem', paddingLeft: '1.25rem' }}>
            <li>Explainable decisions</li>
            <li>100x more data efficient</li>
            <li>Cross-domain transfer</li>
          </ul>
        </div>
      </div>

      {/* Why It Matters */}
      <div className="table-container" style={{ marginBottom: '2rem' }}>
        <div className="table-header">
          <h3 className="table-title">Why Neurosymbolic AI Matters</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Challenge</th>
              <th>Traditional AI</th>
              <th>KROG Solution</th>
              <th>Impact</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Explainability</td>
              <td style={{ color: 'var(--color-error)' }}>Black box</td>
              <td style={{ color: 'var(--color-success)' }}>Formal logical proofs</td>
              <td>Regulatory compliance (EU AI Act)</td>
            </tr>
            <tr>
              <td>Data Efficiency</td>
              <td style={{ color: 'var(--color-error)' }}>Millions of examples</td>
              <td style={{ color: 'var(--color-success)' }}>Rules + thousands</td>
              <td>100x faster training</td>
            </tr>
            <tr>
              <td>Transfer Learning</td>
              <td style={{ color: 'var(--color-error)' }}>Start from scratch</td>
              <td style={{ color: 'var(--color-success)' }}>Universal R-types</td>
              <td>Cross-game skill transfer</td>
            </tr>
            <tr>
              <td>Safety</td>
              <td style={{ color: 'var(--color-error)' }}>Adversarial attacks</td>
              <td style={{ color: 'var(--color-success)' }}>Hard constraints</td>
              <td>Critical system reliability</td>
            </tr>
            <tr>
              <td>Human Trust</td>
              <td style={{ color: 'var(--color-error)' }}>"Trust me"</td>
              <td style={{ color: 'var(--color-success)' }}>"Here's why"</td>
              <td>Human-AI collaboration</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* KROG Advantage */}
      <div className="chart-container" style={{ marginBottom: '2rem' }}>
        <div className="chart-header">
          <h3 className="chart-title">The KROG Games Research Advantage</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', padding: '1rem 0' }}>
          <div>
            <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>1. Explainable Game AI</h4>
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem' }}>
              Unlike AlphaZero, KROG AI provides formal logical reasoning for every decision,
              enabling true teachability.
            </p>
          </div>
          <div>
            <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>2. Cross-Game Transfer</h4>
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem' }}>
              Universal R-types enable skill transfer: master a concept in chess,
              apply it faster in shogi or go.
            </p>
          </div>
          <div>
            <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>3. Research-Grade Data</h4>
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem' }}>
              Every decision captures both neural patterns and symbolic rules -
              unique neurosymbolic training data.
            </p>
          </div>
          <div>
            <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>4. Cognitive Science Platform</h4>
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem' }}>
              Empirically measure how humans learn symbolic rules vs. neural patterns
              across multiple domains.
            </p>
          </div>
        </div>
      </div>

      {/* Industry Validation */}
      <div className="chart-container" style={{ marginBottom: '2rem' }}>
        <div className="chart-header">
          <h3 className="chart-title">Industry Validation</h3>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          Major organizations investing in neurosymbolic AI research:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {['IBM', 'MIT-IBM Watson Lab', 'DeepMind', 'DARPA', 'Microsoft Research', 'Stanford HAI'].map(org => (
            <span key={org} className="badge badge-blue">{org}</span>
          ))}
        </div>
        <p style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
          KROG Games is the first deployed neurosymbolic platform with real user data at scale.
        </p>
      </div>

      {/* Research Publications */}
      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">Research Publication Opportunities</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Venue Category</th>
              <th>Target Conferences/Journals</th>
              <th>Research Focus</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="badge badge-blue">AI/ML</span></td>
              <td>AAAI, NeurIPS, IJCAI</td>
              <td>Neurosymbolic framework foundations</td>
            </tr>
            <tr>
              <td><span className="badge badge-purple">Cognitive Science</span></td>
              <td>COGSCI, Cognitive Science Journal</td>
              <td>Human transfer learning patterns</td>
            </tr>
            <tr>
              <td><span className="badge badge-green">AI Safety</span></td>
              <td>JAIR, AI Magazine</td>
              <td>Explainable AI in games</td>
            </tr>
            <tr>
              <td><span className="badge badge-orange">High Impact</span></td>
              <td>Science, Nature Human Behaviour</td>
              <td>Large-scale decision analysis</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Contact */}
      <div className="chart-container" style={{ borderLeft: '4px solid var(--color-primary)', textAlign: 'center' }}>
        <h3 className="chart-title" style={{ marginBottom: '1rem' }}>Get in Touch</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          For research collaboration, investment discussions, or partnership inquiries.
        </p>
        <a
          href="mailto:georg@kroggames.com"
          style={{
            display: 'inline-block',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            padding: '0.75rem 2rem',
            borderRadius: '0.5rem',
            fontWeight: 'bold',
            textDecoration: 'none'
          }}
        >
          georg@kroggames.com
        </a>
      </div>
    </>
  );
}

export default App;
