import { useState, useEffect, useCallback, useMemo } from 'react';

// API Configuration - use environment variable or default to production
const API_URL = import.meta.env.VITE_API_URL || 'https://kind-magic-production-32c8.up.railway.app';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'krog2025';

type Page = 'overview' | 'decisions' | 'transfer' | 'rtypes' | 'experiments' | 'export' | 'neurosymbolic';

// Types for API responses
interface TTypeData {
  tType: string;
  label: string;
  count: number;
  percentage: number;
}

interface TTypePair {
  agentI: string;
  agentJ: string;
  count: number;
}

interface RTypeData {
  rType: string;
  rTypeShort: string;
  count: number;
  percentage: number;
}

interface OperatorData {
  operator: string;
  count: number;
  percentage: number;
}

interface DomainData {
  name: string;
  count: number;
  status: string;
}

interface Decision {
  id: number;
  domain: string;
  san: string;
  rType: string;
  agentI_ttype: string;
  agentJ_ttype: string;
  createdAt: string;
  krog_ld: Record<string, unknown>;
}

// Helper function to extract short R-type (R11 from R11_discrete_jump)
function extractRTypeShort(rType: string): string {
  if (!rType) return 'Unknown';
  const match = rType.match(/^(R\d+)/);
  return match ? match[1] : rType;
}

// Helper function to compute stats from decisions
function computeStatsFromDecisions(decisions: Decision[]) {
  const rTypeCounts: Record<string, number> = {};
  const tTypeCounts: Record<string, number> = {};
  const tTypePairCounts: Record<string, number> = {};
  const operatorCounts: Record<string, number> = {
    'P': 0, 'O': 0, 'F': 0, 'C': 0, 'L': 0, 'W': 0, 'B': 0, 'I': 0, 'D': 0
  };

  decisions.forEach(d => {
    // R-type counts
    const rTypeShort = extractRTypeShort(d.rType);
    rTypeCounts[rTypeShort] = (rTypeCounts[rTypeShort] || 0) + 1;

    // T-type counts (from agentI)
    if (d.agentI_ttype) {
      tTypeCounts[d.agentI_ttype] = (tTypeCounts[d.agentI_ttype] || 0) + 1;
    }

    // T-type pair counts
    if (d.agentI_ttype && d.agentJ_ttype) {
      const pairKey = `${d.agentI_ttype}-${d.agentJ_ttype}`;
      tTypePairCounts[pairKey] = (tTypePairCounts[pairKey] || 0) + 1;
    }

    // Operator counts from krog_ld formal logic
    const krogLd = d.krog_ld as { 'krog:rType'?: { 'krog:formal'?: string } };
    const formula = krogLd?.['krog:rType']?.['krog:formal'] || '';
    operatorCounts['P'] += (formula.match(/P\(/g) || []).length;
    operatorCounts['O'] += (formula.match(/O[¬(]/g) || []).length;
    operatorCounts['F'] += (formula.match(/F\(/g) || []).length;
  });

  const total = decisions.length;

  const rTypes: RTypeData[] = Object.entries(rTypeCounts)
    .map(([rType, count]) => ({
      rType,
      rTypeShort: rType,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0
    }))
    .sort((a, b) => b.count - a.count);

  const tTypes: TTypeData[] = Object.entries(tTypeCounts)
    .map(([tType, count]) => ({
      tType,
      label: T_TYPES_LABELS[tType] || tType,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0
    }))
    .sort((a, b) => b.count - a.count);

  const tTypePairs: TTypePair[] = Object.entries(tTypePairCounts)
    .map(([key, count]) => {
      const [agentI, agentJ] = key.split('-');
      return { agentI, agentJ, count };
    })
    .sort((a, b) => b.count - a.count);

  const operators: OperatorData[] = Object.entries(operatorCounts)
    .map(([operator, count]) => ({
      operator,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0
    }))
    .filter(o => o.count > 0);

  return { rTypes, tTypes, tTypePairs, operators, total };
}

const T_TYPES_LABELS: Record<string, string> = {
  'T1': 'Full discretion',
  'T2': 'Conditional permission',
  'T3': 'Must act',
  'T4': 'Prohibited',
  'T5': 'Claim holder',
  'T6': 'Liberty holder',
  'T7': 'Power holder',
};

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('overview');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('krog_admin_authenticated');
    if (stored === 'true') setIsAuthenticated(true);
  }, []);

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setLoginError(false);
      localStorage.setItem('krog_admin_authenticated', 'true');
    } else {
      setLoginError(true);
      setPassword('');
    }
  };

  // Logout handler
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('krog_admin_authenticated');
  };

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h1>KROG Analytics</h1>
            <p>Research Dashboard</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="login-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
              />
            </div>
            {loginError && (
              <div className="login-error">Invalid password</div>
            )}
            <button type="submit" className="login-button">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} />
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

function Sidebar({ currentPage, setCurrentPage, onLogout }: { currentPage: Page; setCurrentPage: (p: Page) => void; onLogout: () => void }) {
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

      <div className="sidebar-footer">
        <button className="logout-button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}

function OverviewPage() {
  const [allDecisions, setAllDecisions] = useState<Decision[]>([]);
  const [domains, setDomains] = useState<DomainData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch all decisions and domains in parallel
        const [decisionsRes, domainsRes] = await Promise.all([
          fetch(`${API_URL}/api/research/decisions?limit=1000`),
          fetch(`${API_URL}/api/research/domains`),
        ]);

        const [decisionsData, domainsData] = await Promise.all([
          decisionsRes.json(),
          domainsRes.json(),
        ]);

        setAllDecisions(decisionsData.decisions || []);
        setDomains(domainsData.domains || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load data from API');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Compute stats from decisions
  const stats = useMemo(() => computeStatsFromDecisions(allDecisions), [allDecisions]);

  if (loading) {
    return (
      <div className="page-header">
        <h1>Loading Analytics...</h1>
        <p>Fetching data from KROG API</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-header">
        <h1>Analytics Overview</h1>
        <p style={{ color: 'var(--color-error)' }}>{error}</p>
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
          API URL: {API_URL}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>Analytics Overview</h1>
        <p>Real-time decision analysis from KROG Games</p>
      </div>

      <div className="card-grid">
        <MetricCard
          title="Total Decisions Tracked"
          value={stats.total.toLocaleString()}
          trend="Live data"
          trendUp={false}
        />
        <MetricCard
          title="Active Domains"
          value={domains.filter(d => d.status === 'active').length.toString()}
          trend="Chess active"
          trendUp={false}
        />
        <MetricCard
          title="Unique R-Types Used"
          value={stats.rTypes.length.toString()}
          trend={`of 35 total`}
          trendUp={false}
        />
        <MetricCard
          title="Modal Operators"
          value={stats.operators.length.toString()}
          trend="P, O active"
          trendUp={false}
        />
      </div>

      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Decision Volume by Domain</h3>
        </div>
        <div style={{ padding: '1rem' }}>
          {domains.map((domain) => (
            <div key={domain.name} style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 500 }}>{domain.name}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{domain.count?.toLocaleString() || 0} decisions</span>
              </div>
              <div style={{ height: '24px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    backgroundColor: domain.status === 'active' ? 'var(--color-primary)' : 'var(--color-warning)',
                    width: `${Math.min(100, ((domain.count || 0) / (stats.total || 1)) * 100)}%`,
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">R-Type Distribution</h3>
          </div>
          <RTypeHeatmap rTypes={stats.rTypes} />
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">T-Type Usage</h3>
          </div>
          <TTypeChart tTypes={stats.tTypes} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">T-Type Pair Heatmap (Agent I x Agent J)</h3>
          </div>
          <TTypePairHeatmap pairs={stats.tTypePairs} />
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Modal Operators Used</h3>
          </div>
          <OperatorChart operators={stats.operators} />
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">Recent Decisions</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Move</th>
              <th>R-Type</th>
              <th>Agent I (T-Type)</th>
              <th>Agent J (T-Type)</th>
              <th>Domain</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {allDecisions.slice(0, 10).map((decision) => (
              <tr key={decision.id}>
                <td><strong>{decision.san}</strong></td>
                <td><span className="badge badge-purple">{extractRTypeShort(decision.rType)}</span></td>
                <td><span className="badge badge-blue">{decision.agentI_ttype}</span></td>
                <td><span className="badge badge-orange">{decision.agentJ_ttype}</span></td>
                <td>{decision.domain}</td>
                <td>{new Date(decision.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {allDecisions.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No decisions recorded yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function DecisionAnalysisPage() {
  const [allDecisions, setAllDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState({ domain: 'all', rType: 'all', limit: 50 });

  const fetchDecisions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/research/decisions?limit=500`);
      const data = await response.json();
      setAllDecisions(data.decisions || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch decisions:', err);
      setError('Failed to load decisions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDecisions();
  }, [fetchDecisions]);

  // Apply filters client-side
  const filteredDecisions = useMemo(() => {
    let result = allDecisions;

    if (filter.domain !== 'all') {
      result = result.filter(d => d.domain.toLowerCase() === filter.domain.toLowerCase());
    }

    if (filter.rType !== 'all') {
      result = result.filter(d => extractRTypeShort(d.rType) === filter.rType);
    }

    return result.slice(0, filter.limit);
  }, [allDecisions, filter]);

  // Compute stats from filtered decisions
  const stats = useMemo(() => computeStatsFromDecisions(filteredDecisions), [filteredDecisions]);

  // Get unique R-types for filter dropdown
  const availableRTypes = useMemo(() => {
    const rTypes = new Set<string>();
    allDecisions.forEach(d => rTypes.add(extractRTypeShort(d.rType)));
    return Array.from(rTypes).sort((a, b) => {
      const numA = parseInt(a.replace('R', ''));
      const numB = parseInt(b.replace('R', ''));
      return numA - numB;
    });
  }, [allDecisions]);

  return (
    <>
      <div className="page-header">
        <h1>Decision Pattern Analysis</h1>
        <p>Explore neurosymbolic decision data from all games</p>
      </div>

      <div className="filter-bar">
        <select
          className="filter-select"
          value={filter.domain}
          onChange={(e) => setFilter(f => ({ ...f, domain: e.target.value }))}
        >
          <option value="all">All Domains</option>
          <option value="chess">Chess</option>
          <option value="shogi">Shogi</option>
          <option value="go">Go</option>
        </select>
        <select
          className="filter-select"
          value={filter.rType}
          onChange={(e) => setFilter(f => ({ ...f, rType: e.target.value }))}
        >
          <option value="all">All R-Types</option>
          {availableRTypes.map(rType => (
            <option key={rType} value={rType}>{rType} ({R_TYPES_DESCRIPTIONS[rType] || 'Unknown'})</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={filter.limit}
          onChange={(e) => setFilter(f => ({ ...f, limit: parseInt(e.target.value) }))}
        >
          <option value={20}>20 results</option>
          <option value={50}>50 results</option>
          <option value={100}>100 results</option>
          <option value={500}>All results</option>
        </select>
      </div>

      {error && (
        <div className="chart-container" style={{ borderLeft: '4px solid var(--color-error)' }}>
          <p style={{ color: 'var(--color-error)' }}>{error}</p>
        </div>
      )}

      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            Decisions Stream ({filteredDecisions.length} of {allDecisions.length} total)
          </h3>
        </div>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading decisions...
          </div>
        ) : (
          <div style={{ padding: '1rem' }}>
            {filteredDecisions.map((decision) => (
              <div
                key={decision.id}
                style={{
                  padding: '1rem',
                  marginBottom: '0.5rem',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                onClick={() => setExpandedId(expandedId === decision.id ? null : decision.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '1.1rem' }}>{decision.san}</strong>
                    <span style={{ marginLeft: '1rem' }}>
                      <span className="badge badge-purple">{extractRTypeShort(decision.rType)}</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className="badge badge-blue">{decision.agentI_ttype}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>→</span>
                    <span className="badge badge-orange">{decision.agentJ_ttype}</span>
                    <span style={{ marginLeft: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {new Date(decision.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                {expandedId === decision.id && decision.krog_ld && (
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
                    <h4 style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }}>KROG JSON-LD</h4>
                    <pre style={{
                      fontSize: '0.75rem',
                      overflow: 'auto',
                      maxHeight: '400px',
                      color: 'var(--text-secondary)'
                    }}>
                      {JSON.stringify(decision.krog_ld, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
            {filteredDecisions.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                No decisions match your filters
              </p>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">R-Type Frequency</h3>
          </div>
          <RTypeFrequencyChart rTypes={stats.rTypes} />
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">T-Type Transitions</h3>
          </div>
          <TTypeTransitionChart pairs={stats.tTypePairs} />
        </div>
      </div>
    </>
  );
}

function TransferLearningPage() {
  const [allDecisions, setAllDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`${API_URL}/api/research/decisions?limit=1000`);
        const data = await response.json();
        setAllDecisions(data.decisions || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = useMemo(() => computeStatsFromDecisions(allDecisions), [allDecisions]);

  if (loading) {
    return (
      <div className="page-header">
        <h1>Loading Transfer Learning Data...</h1>
      </div>
    );
  }

  const mostCommonRType = stats.rTypes[0];

  return (
    <>
      <div className="page-header">
        <h1>Cross-Game Transfer Learning</h1>
        <p>Analyze skill transfer via shared R-types across domains</p>
      </div>

      <div className="card-grid">
        <MetricCard
          title="Total Decision Patterns"
          value={stats.total.toLocaleString()}
          trend="From all domains"
          trendUp={false}
        />
        <MetricCard
          title="Unique R-Types"
          value={stats.rTypes.length.toString()}
          trend="Transferable patterns"
          trendUp={false}
        />
        <MetricCard
          title="Most Common R-Type"
          value={mostCommonRType?.rType || 'N/A'}
          trend={`${mostCommonRType?.count || 0} occurrences`}
          trendUp={false}
        />
        <MetricCard
          title="T-Type Pairs"
          value={stats.tTypePairs.length.toString()}
          trend="Agent relationships"
          trendUp={false}
        />
      </div>

      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">R-Type Transfer Potential</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Higher frequency R-types have more transfer learning data
          </p>
        </div>
        <RTypeFrequencyChart rTypes={stats.rTypes.slice(0, 10)} />
      </div>

      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">T-Type Pair Analysis</h3>
        </div>
        <TTypePairHeatmap pairs={stats.tTypePairs} />
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">Transfer Learning by R-Type</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>R-Type</th>
              <th>Pattern Count</th>
              <th>Transfer Score</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {stats.rTypes.slice(0, 8).map((rType) => {
              const transferScore = Math.min(1, rType.count / (stats.total / 3));
              return (
                <tr key={rType.rType}>
                  <td><span className="badge badge-purple">{rType.rType}</span></td>
                  <td>{rType.count}</td>
                  <td>
                    <span className={`badge ${transferScore > 0.5 ? 'badge-green' : transferScore > 0.2 ? 'badge-orange' : 'badge-red'}`}>
                      {transferScore.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {R_TYPES_DESCRIPTIONS[rType.rType] || 'Unknown'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function RTypeMasteryPage() {
  const [allDecisions, setAllDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`${API_URL}/api/research/decisions?limit=1000`);
        const data = await response.json();
        setAllDecisions(data.decisions || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = useMemo(() => computeStatsFromDecisions(allDecisions), [allDecisions]);

  if (loading) {
    return (
      <div className="page-header">
        <h1>Loading R-Type Mastery Data...</h1>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>R-Type Mastery Analysis</h1>
        <p>Track mastery levels across all 35 R-types and 7 T-types</p>
      </div>

      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">R-Types in Use</h3>
        </div>
        <RTypeHeatmap rTypes={stats.rTypes} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">T-Type Distribution</h3>
          </div>
          <TTypeChart tTypes={stats.tTypes} />
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">R-Type Frequency Ranking</h3>
          </div>
          <div style={{ padding: '1rem' }}>
            {stats.rTypes.slice(0, 7).map((rType, index) => (
              <div key={rType.rType} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem',
                marginBottom: '0.5rem',
                backgroundColor: index === 0 ? 'rgba(129, 182, 76, 0.2)' : 'rgba(255,255,255,0.05)',
                borderRadius: '8px'
              }}>
                <span style={{ width: '30px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                  #{index + 1}
                </span>
                <span className="badge badge-purple" style={{ marginRight: '1rem' }}>{rType.rType}</span>
                <span style={{ flex: 1, color: 'var(--text-secondary)' }}>
                  {R_TYPES_DESCRIPTIONS[rType.rType] || 'Unknown'}
                </span>
                <span style={{ fontWeight: 500 }}>{rType.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">Complete R-Type Reference</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>R-Type</th>
              <th>Description</th>
              <th>Count</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {R_TYPES_REFERENCE.map((ref) => {
              const data = stats.rTypes.find(r => r.rType === ref.id);
              return (
                <tr key={ref.id}>
                  <td><span className="badge badge-purple">{ref.id}</span></td>
                  <td>{ref.description}</td>
                  <td>{data?.count || 0}</td>
                  <td>
                    {data ? (
                      <span className="badge badge-green">Active</span>
                    ) : (
                      <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>Not used</span>
                    )}
                  </td>
                </tr>
              );
            })}
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

      <div className="chart-container" style={{ borderLeft: '4px solid var(--color-warning)' }}>
        <h3 className="chart-title" style={{ color: 'var(--color-warning)' }}>Coming Soon</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          Experiment management is under development. This will allow you to:
        </p>
        <ul style={{ color: 'var(--text-secondary)', marginTop: '1rem', paddingLeft: '1.5rem' }}>
          <li>Create A/B tests comparing different learning interventions</li>
          <li>Track participant allocation and progress</li>
          <li>Measure R-type mastery improvements</li>
          <li>Analyze transfer learning effectiveness</li>
        </ul>
      </div>

      <div className="card-grid">
        <MetricCard
          title="Planned Experiments"
          value="3"
          trend="In design phase"
          trendUp={false}
        />
        <MetricCard
          title="Data Collection"
          value="Active"
          trend="Building baseline"
          trendUp={false}
        />
      </div>
    </>
  );
}

function DataExportPage() {
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total: number; domains: DomainData[] } | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const domainsRes = await fetch(`${API_URL}/api/research/domains`);
        const domainsData = await domainsRes.json();
        const total = domainsData.domains?.reduce((sum: number, d: DomainData) => sum + (d.count || 0), 0) || 0;
        setStats({ total, domains: domainsData.domains || [] });
      } catch (err) {
        console.error('Failed to fetch export stats:', err);
      }
    }
    fetchStats();
  }, []);

  const handleExport = async (format: string) => {
    try {
      setExportStatus('Preparing export...');

      const response = await fetch(`${API_URL}/api/research/decisions?limit=1000`);
      const data = await response.json();

      let exportData: string;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        exportData = JSON.stringify(data.decisions, null, 2);
        filename = `krog-decisions-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        // CSV format
        const headers = ['id', 'domain', 'san', 'rType', 'agentI_ttype', 'agentJ_ttype', 'createdAt'];
        const rows = data.decisions.map((d: Decision) =>
          headers.map(h => JSON.stringify(d[h as keyof Decision] || '')).join(',')
        );
        exportData = [headers.join(','), ...rows].join('\n');
        filename = `krog-decisions-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      }

      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setExportStatus(`Exported ${data.decisions.length} decisions`);
    } catch (err) {
      console.error('Export failed:', err);
      setExportStatus('Export failed - see console');
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Research Data Export</h1>
        <p>Export decision data for research and analysis</p>
      </div>

      <div className="card-grid">
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Decision Events</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Full decision data with R-type classifications and JSON-LD.
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <span className="badge badge-blue">{stats?.total?.toLocaleString() || 0} records</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={() => handleExport('json')}>
              Export JSON
            </button>
            <button className="btn btn-secondary" onClick={() => handleExport('csv')}>
              Export CSV
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>JSON-LD Semantic Data</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Full neurosymbolic data in semantic web format.
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <span className="badge badge-purple">krog_ld column</span>
          </div>
          <button className="btn btn-primary" onClick={() => handleExport('json')}>
            Export with JSON-LD
          </button>
        </div>
      </div>

      {exportStatus && (
        <div className="chart-container" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <p style={{ color: 'var(--color-primary)' }}>{exportStatus}</p>
        </div>
      )}

      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Data by Domain</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Domain</th>
              <th>Records</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {stats?.domains?.map((domain) => (
              <tr key={domain.name}>
                <td>{domain.name}</td>
                <td>{domain.count?.toLocaleString() || 0}</td>
                <td>
                  <span className={`badge ${domain.status === 'active' ? 'badge-green' : 'badge-orange'}`}>
                    {domain.status}
                  </span>
                </td>
              </tr>
            ))}
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

function RTypeHeatmap({ rTypes }: { rTypes: RTypeData[] }) {
  // Create a map for quick lookup
  const rTypeMap = new Map(rTypes.map(r => [r.rType, r.count]));
  const maxCount = Math.max(...rTypes.map(r => r.count), 1);

  // Show all 35 R-types in a 7x5 grid
  const cells = [];
  for (let i = 1; i <= 35; i++) {
    const rTypeId = `R${i}`;
    const count = rTypeMap.get(rTypeId) || 0;
    const intensity = count / maxCount;

    const color = count === 0
      ? 'rgba(255, 255, 255, 0.1)'
      : intensity > 0.5
        ? 'rgba(34, 197, 94, 0.8)'
        : intensity > 0.2
          ? 'rgba(245, 158, 11, 0.8)'
          : 'rgba(239, 68, 68, 0.6)';

    cells.push(
      <div
        key={i}
        className="rtype-cell"
        style={{ background: color }}
        title={`${rTypeId}: ${count} occurrences - ${R_TYPES_DESCRIPTIONS[rTypeId] || 'Unknown'}`}
      >
        R{i}
      </div>
    );
  }

  return <div className="rtype-grid">{cells}</div>;
}

function TTypeChart({ tTypes }: { tTypes: TTypeData[] }) {
  const maxCount = Math.max(...tTypes.map(t => t.count), 1);

  return (
    <div style={{ padding: '1rem' }}>
      {T_TYPES_REFERENCE.map((ref) => {
        const data = tTypes.find(t => t.tType === ref.id);
        const count = data?.count || 0;

        return (
          <div key={ref.id} style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>
                <span className="badge badge-blue">{ref.id}</span>
                <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {ref.label}
                </span>
              </span>
              <span style={{ fontWeight: 500 }}>{count}</span>
            </div>
            <div style={{ height: '16px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  backgroundColor: count > 0 ? 'var(--color-primary)' : 'transparent',
                  width: `${(count / maxCount) * 100}%`,
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TTypePairHeatmap({ pairs }: { pairs: TTypePair[] }) {
  // Create 7x7 matrix for T1-T7 pairs
  const tTypes = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const pairMap = new Map(pairs.map(p => [`${p.agentI}-${p.agentJ}`, p.count]));
  const maxCount = Math.max(...pairs.map(p => p.count), 1);

  return (
    <div style={{ padding: '1rem', overflowX: 'auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `60px repeat(7, 1fr)`,
        gap: '2px',
        minWidth: '400px'
      }}>
        {/* Header row */}
        <div style={{ padding: '0.5rem', fontWeight: 'bold' }}></div>
        {tTypes.map(t => (
          <div key={t} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
            {t}
          </div>
        ))}

        {/* Data rows */}
        {tTypes.map(agentI => (
          <div key={`row-${agentI}`} style={{ display: 'contents' }}>
            <div style={{ padding: '0.5rem', fontWeight: 'bold', fontSize: '0.8rem' }}>
              {agentI}
            </div>
            {tTypes.map(agentJ => {
              const count = pairMap.get(`${agentI}-${agentJ}`) || 0;
              const intensity = count / maxCount;
              const bgColor = count === 0
                ? 'rgba(255,255,255,0.05)'
                : `rgba(129, 182, 76, ${0.2 + intensity * 0.8})`;

              return (
                <div
                  key={`${agentI}-${agentJ}`}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: bgColor,
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    color: count > 0 ? 'white' : 'var(--text-secondary)',
                    borderRadius: '2px'
                  }}
                  title={`${agentI} → ${agentJ}: ${count}`}
                >
                  {count || '-'}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '1rem', textAlign: 'center' }}>
        Rows: Agent I (active player) | Columns: Agent J (other player/system)
      </p>
    </div>
  );
}

function OperatorChart({ operators }: { operators: OperatorData[] }) {
  const maxCount = Math.max(...operators.map(o => o.count), 1);

  return (
    <div style={{ padding: '1rem' }}>
      {OPERATORS_REFERENCE.map((ref) => {
        const data = operators.find(o => o.operator === ref.id);
        const count = data?.count || 0;

        return (
          <div key={ref.id} style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>
                <span className="badge badge-orange">{ref.id}</span>
                <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {ref.label}
                </span>
              </span>
              <span style={{ fontWeight: 500 }}>{count}</span>
            </div>
            <div style={{ height: '16px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  backgroundColor: count > 0 ? '#f39c12' : 'transparent',
                  width: `${(count / maxCount) * 100}%`,
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RTypeFrequencyChart({ rTypes }: { rTypes: RTypeData[] }) {
  const maxCount = Math.max(...rTypes.map(r => r.count), 1);

  return (
    <div style={{ padding: '1rem' }}>
      {rTypes.length > 0 ? (
        rTypes.map((rType) => (
          <div key={rType.rType} style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>
                <span className="badge badge-purple">{rType.rType}</span>
                <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {R_TYPES_DESCRIPTIONS[rType.rType] || ''}
                </span>
              </span>
              <span style={{ fontWeight: 500 }}>{rType.count}</span>
            </div>
            <div style={{ height: '16px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  backgroundColor: 'var(--color-primary)',
                  width: `${(rType.count / maxCount) * 100}%`
                }}
              />
            </div>
          </div>
        ))
      ) : (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No R-type data available</p>
      )}
    </div>
  );
}

function TTypeTransitionChart({ pairs }: { pairs: TTypePair[] }) {
  const maxCount = Math.max(...pairs.map(p => p.count), 1);

  return (
    <div style={{ padding: '1rem' }}>
      {pairs.length > 0 ? (
        pairs.slice(0, 10).map((pair, i) => (
          <div key={i} style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.9rem' }}>{pair.agentI} → {pair.agentJ}</span>
              <span style={{ fontWeight: 500 }}>{pair.count}</span>
            </div>
            <div style={{ height: '16px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  backgroundColor: '#3b82f6',
                  width: `${(pair.count / maxCount) * 100}%`
                }}
              />
            </div>
          </div>
        ))
      ) : (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No transition data available</p>
      )}
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

// ============================================
// Reference Data
// ============================================

const T_TYPES_REFERENCE = [
  { id: 'T1', label: 'Full discretion' },
  { id: 'T2', label: 'Conditional permission' },
  { id: 'T3', label: 'Must act' },
  { id: 'T4', label: 'Prohibited' },
  { id: 'T5', label: 'Claim holder' },
  { id: 'T6', label: 'Liberty holder' },
  { id: 'T7', label: 'Power holder' },
];

const R_TYPES_REFERENCE = [
  { id: 'R1', description: 'Asymmetric movement' },
  { id: 'R2', description: 'Intransitive' },
  { id: 'R3', description: 'Path-dependent' },
  { id: 'R4', description: 'Capture-only' },
  { id: 'R5', description: 'Non-capture' },
  { id: 'R6', description: 'First move special' },
  { id: 'R7', description: 'Temporal window' },
  { id: 'R8', description: 'Mandatory transformation' },
  { id: 'R9', description: 'Compound move' },
  { id: 'R10', description: 'Conditional' },
  { id: 'R11', description: 'Discrete jump' },
  { id: 'R12', description: 'State-dependent' },
  { id: 'R13', description: 'Terminal state' },
  { id: 'R14', description: 'Repetition' },
  { id: 'R15', description: 'Counter-based' },
  { id: 'R16', description: 'Territory control' },
  { id: 'R17', description: 'Piece promotion' },
  { id: 'R18', description: 'Piece demotion' },
  { id: 'R19', description: 'Multi-piece capture' },
  { id: 'R20', description: 'Chain capture' },
  { id: 'R21', description: 'Drop placement' },
  { id: 'R22', description: 'Piece reuse' },
  { id: 'R23', description: 'Area restriction' },
  { id: 'R24', description: 'Diagonal movement' },
  { id: 'R25', description: 'Orthogonal movement' },
  { id: 'R26', description: 'Royal piece' },
  { id: 'R27', description: 'Pass allowed' },
  { id: 'R28', description: 'Suicide prohibition' },
  { id: 'R29', description: 'Ko rule' },
  { id: 'R30', description: 'Superko' },
  { id: 'R31', description: 'Scoring rule' },
  { id: 'R32', description: 'Life and death' },
  { id: 'R33', description: 'Group liberty' },
  { id: 'R34', description: 'Eye formation' },
  { id: 'R35', description: 'Seki' },
];

const R_TYPES_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  R_TYPES_REFERENCE.map(r => [r.id, r.description])
);

const OPERATORS_REFERENCE = [
  { id: 'P', label: 'Permission' },
  { id: 'O', label: 'Obligation' },
  { id: 'F', label: 'Prohibition' },
  { id: 'C', label: 'Claim' },
  { id: 'L', label: 'Liberty' },
  { id: 'W', label: 'Power' },
  { id: 'B', label: 'Immunity' },
  { id: 'I', label: 'Disability' },
  { id: 'D', label: 'Liability' },
];

export default App;
