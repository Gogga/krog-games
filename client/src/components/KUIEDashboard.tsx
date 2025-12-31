/**
 * KUIE Research Dashboard
 * First interface for KROG Universal Inference Engine
 *
 * Visualizes deontic modal logic across domains.
 * Chess is the first domain with live data.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  T_TYPES,
  R_TYPES,
  MODAL_OPERATORS,
  RISK_COLORS,
  RISK_LABELS,
  DOMAINS,
  T_TYPE_MATRIX,
  CHESS_R_TYPE_MAPPING,
  type RiskLevel
} from '../data/krog-reference';

interface KUIEDashboardProps {
  onClose: () => void;
}

// API response types
interface TTypeStats {
  tType: string;
  count: number;
  percentage: number;
}

interface TTypePair {
  agentI: string;
  agentJ: string;
  rType: string;
  count: number;
}

interface FormulaStats {
  formula: string;
  rType: string;
  natural: string;
  riskLevel: string;
  count: number;
}

interface OperatorStats {
  operator: string;
  count: number;
}

interface DomainStats {
  id: string;
  name: string;
  status: string;
  count: number;
  description: string;
}

interface Decision {
  id: number;
  domain: string;
  gameId: string;
  moveNumber: number;
  color: string;
  san: string;
  from: string;
  to: string;
  piece: string;
  captured: string | null;
  rType: string;
  rTypeDescription: string;
  agentI_ttype: string;
  agentJ_ttype: string;
  krog_ld: Record<string, unknown>;
  createdAt: string;
}

// API base URL helper
const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}/api`;
  }
  const host = window.location.hostname;
  return `http://${host}:3000/api`;
};

export default function KUIEDashboard({ onClose }: KUIEDashboardProps) {
  // State
  const [selectedDomain] = useState('chess');
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [referenceTab, setReferenceTab] = useState<'t-types' | 'r-types' | 'operators'>('t-types');
  const [selectedRType, setSelectedRType] = useState<string | null>(null);
  const [expandedDecision, setExpandedDecision] = useState<number | null>(null);

  // Data state (tTypeStats reserved for future T-type breakdown)
  const [, setTTypeStats] = useState<TTypeStats[]>([]);
  const [tTypePairs, setTTypePairs] = useState<TTypePair[]>([]);
  const [formulas, setFormulas] = useState<FormulaStats[]>([]);
  const [operators, setOperators] = useState<OperatorStats[]>([]);
  const [domains, setDomains] = useState<DomainStats[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [totalDecisions, setTotalDecisions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data on mount
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const api = getApiBase();

    try {
      const [tTypesRes, pairsRes, formulasRes, opsRes, domainsRes, decisionsRes] = await Promise.all([
        fetch(`${api}/research/t-types`),
        fetch(`${api}/research/t-type-pairs`),
        fetch(`${api}/research/formulas`),
        fetch(`${api}/research/operators`),
        fetch(`${api}/research/domains`),
        fetch(`${api}/research/decisions?limit=20`)
      ]);

      const [tTypesData, pairsData, formulasData, opsData, domainsData, decisionsData] = await Promise.all([
        tTypesRes.json(),
        pairsRes.json(),
        formulasRes.json(),
        opsRes.json(),
        domainsRes.json(),
        decisionsRes.json()
      ]);

      if (tTypesData.success) setTTypeStats(tTypesData.tTypes);
      if (pairsData.success) setTTypePairs(pairsData.pairs);
      if (formulasData.success) setFormulas(formulasData.formulas);
      if (opsData.success) setOperators(opsData.operators);
      if (domainsData.success) setDomains(domainsData.domains);
      if (decisionsData.success) {
        setDecisions(decisionsData.decisions);
        setTotalDecisions(decisionsData.total);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Helper: Get max count for scaling bars
  const maxRTypeCount = formulas.length > 0 ? Math.max(...formulas.map(f => f.count)) : 1;
  const maxOperatorCount = operators.length > 0 ? Math.max(...operators.map(o => o.count)) : 1;

  // Helper: Build heatmap data
  const buildHeatmapData = () => {
    const pairCounts: Record<string, number> = {};
    let maxCount = 1;

    tTypePairs.forEach(pair => {
      const key = `${pair.agentI}-${pair.agentJ}`;
      pairCounts[key] = (pairCounts[key] || 0) + pair.count;
      if (pairCounts[key] > maxCount) maxCount = pairCounts[key];
    });

    return { pairCounts, maxCount };
  };

  const { pairCounts: heatmapData, maxCount: heatmapMax } = buildHeatmapData();

  // Styles
  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      zIndex: 1000,
      overflow: 'auto'
    },
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '20px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      borderBottom: '1px solid #333',
      paddingBottom: '16px'
    },
    title: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    closeBtn: {
      background: 'none',
      border: '1px solid #555',
      color: '#fff',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px'
    },
    section: {
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      border: '1px solid #333'
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px'
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: 600,
      color: '#81b64c',
      margin: 0
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '16px'
    },
    card: {
      backgroundColor: '#252525',
      borderRadius: '6px',
      padding: '12px',
      border: '1px solid #3a3a3a'
    },
    badge: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 500
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      fontSize: '13px'
    },
    th: {
      textAlign: 'left' as const,
      padding: '8px',
      borderBottom: '1px solid #444',
      color: '#888',
      fontWeight: 500
    },
    td: {
      padding: '8px',
      borderBottom: '1px solid #333'
    },
    barContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px'
    },
    barLabel: {
      width: '100px',
      fontSize: '12px',
      color: '#ccc',
      flexShrink: 0
    },
    barTrack: {
      flex: 1,
      height: '20px',
      backgroundColor: '#333',
      borderRadius: '4px',
      overflow: 'hidden'
    },
    barCount: {
      width: '50px',
      textAlign: 'right' as const,
      fontSize: '12px',
      color: '#888'
    },
    heatmapCell: {
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    tabs: {
      display: 'flex',
      gap: '8px',
      marginBottom: '12px'
    },
    tab: {
      padding: '6px 12px',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '13px'
    },
    placeholder: {
      color: '#666',
      fontStyle: 'italic',
      padding: '20px',
      textAlign: 'center' as const
    }
  };

  if (loading) {
    return (
      <div style={styles.overlay}>
        <div style={styles.container}>
          <div style={{ textAlign: 'center', padding: '100px 20px', color: '#888' }}>
            Loading KUIE Dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.title}>
            <span style={{ fontSize: '28px' }}>🔬</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', color: '#fff' }}>KUIE Research Dashboard</h1>
              <p style={{ margin: '4px 0 0', color: '#888', fontSize: '13px' }}>
                KROG Universal Inference Engine • Neurosymbolic AI Research
              </p>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            Close
          </button>
        </div>

        {error && (
          <div style={{ ...styles.section, borderColor: '#e74c3c', color: '#e74c3c' }}>
            {error}
          </div>
        )}

        {/* Section 1: Framework Reference (Collapsible) */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              📚 Framework Reference
            </h2>
            <button
              style={{
                ...styles.closeBtn,
                padding: '4px 12px',
                fontSize: '12px'
              }}
              onClick={() => setIsReferenceOpen(!isReferenceOpen)}
            >
              {isReferenceOpen ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {isReferenceOpen && (
            <>
              <div style={styles.tabs}>
                {(['t-types', 'r-types', 'operators'] as const).map(tab => (
                  <button
                    key={tab}
                    style={{
                      ...styles.tab,
                      backgroundColor: referenceTab === tab ? '#81b64c' : '#333',
                      color: referenceTab === tab ? '#000' : '#ccc'
                    }}
                    onClick={() => setReferenceTab(tab)}
                  >
                    {tab === 't-types' ? '7 T-Types' : tab === 'r-types' ? '35 R-Types' : '9 Operators'}
                  </button>
                ))}
              </div>

              {referenceTab === 't-types' && (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>T-Type</th>
                      <th style={styles.th}>Formal</th>
                      <th style={styles.th}>Natural Language</th>
                      <th style={styles.th}>Capabilities</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(T_TYPES).map(t => (
                      <tr key={t.id}>
                        <td style={{ ...styles.td, fontWeight: 600, color: '#81b64c' }}>{t.id}</td>
                        <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '11px' }}>{t.formal}</td>
                        <td style={styles.td}>{t.natural}</td>
                        <td style={styles.td}>
                          <span style={{ color: t.canAct ? '#81b64c' : '#666' }}>Act </span>
                          <span style={{ color: t.canRefrain ? '#81b64c' : '#666' }}>Refrain </span>
                          <span style={{ color: t.canBePassive ? '#81b64c' : '#666' }}>Passive</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {referenceTab === 'r-types' && (
                <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>R-Type</th>
                        <th style={styles.th}>Structure</th>
                        <th style={styles.th}>Natural Language</th>
                        <th style={styles.th}>Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(R_TYPES).slice(0, 15).map(r => (
                        <tr key={r.id}>
                          <td style={{ ...styles.td, fontWeight: 600, color: RISK_COLORS[r.risk] }}>{r.id}</td>
                          <td style={{ ...styles.td, fontFamily: 'monospace' }}>{r.structure}</td>
                          <td style={styles.td}>{r.natural}</td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.badge,
                              backgroundColor: `${RISK_COLORS[r.risk]}22`,
                              color: RISK_COLORS[r.risk]
                            }}>
                              {RISK_LABELS[r.risk]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
                    Showing 15 primary R-types. Total: 35 R-types from 7×7 T-type matrix.
                  </p>
                </div>
              )}

              {referenceTab === 'operators' && (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Symbol</th>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Formal Definition</th>
                      <th style={styles.th}>Natural Language</th>
                      <th style={styles.th}>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(MODAL_OPERATORS).map(op => (
                      <tr key={op.symbol}>
                        <td style={{ ...styles.td, fontWeight: 700, color: '#81b64c', fontSize: '16px' }}>{op.symbol}</td>
                        <td style={styles.td}>{op.name}</td>
                        <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '11px' }}>{op.formal}</td>
                        <td style={styles.td}>{op.natural}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.badge,
                            backgroundColor: op.category === 'deontic' ? '#3498db22' : '#9b59b622',
                            color: op.category === 'deontic' ? '#3498db' : '#9b59b6'
                          }}>
                            {op.category}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>

        {/* Section 2: Domain Overview */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🌐 Domain Overview</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
            {(domains.length > 0 ? domains : DOMAINS).map(d => (
              <div
                key={d.id}
                style={{
                  ...styles.card,
                  minWidth: '180px',
                  opacity: d.status === 'active' ? 1 : 0.5,
                  borderColor: selectedDomain === d.id ? '#81b64c' : '#3a3a3a'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>
                    {DOMAINS.find(dom => dom.id === d.id)?.icon || '📦'}
                  </span>
                  <span style={{ fontWeight: 600 }}>{d.name}</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#81b64c' }}>
                  {(d.count || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: '#888' }}>
                  {d.status === 'active' ? 'decisions' : 'Coming soon'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.grid}>
          {/* Section 3: R-Type Distribution */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📊 R-Type Distribution</h2>
            <div style={{ marginTop: '12px' }}>
              {formulas.length === 0 ? (
                <p style={styles.placeholder}>No data yet. Play some games to generate R-type statistics.</p>
              ) : (
                formulas.slice(0, 10).map(f => {
                  const rTypeId = f.rType.replace('krog:', '');
                  const rType = R_TYPES[rTypeId];
                  const risk = (f.riskLevel as RiskLevel) || rType?.risk || 'low';
                  return (
                    <div key={f.rType} style={styles.barContainer}>
                      <span style={styles.barLabel}>{rTypeId}</span>
                      <div style={styles.barTrack}>
                        <div style={{
                          width: `${(f.count / maxRTypeCount) * 100}%`,
                          height: '100%',
                          backgroundColor: RISK_COLORS[risk],
                          borderRadius: '4px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <span style={styles.barCount}>{f.count}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 4: T-Type Pair Heatmap */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🔥 T-Type Pair Heatmap</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '2px',
              marginTop: '12px'
            }}>
              {/* Header row */}
              <div style={{ ...styles.heatmapCell, backgroundColor: 'transparent' }} />
              {['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(t => (
                <div key={t} style={{ ...styles.heatmapCell, color: '#81b64c', fontWeight: 600 }}>
                  {t}
                </div>
              ))}

              {/* Data rows */}
              {['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((rowT, rowIdx) => (
                <>
                  <div key={`label-${rowT}`} style={{ ...styles.heatmapCell, color: '#81b64c', fontWeight: 600 }}>
                    {rowT}
                  </div>
                  {['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((colT, colIdx) => {
                    const rType = T_TYPE_MATRIX[rowIdx]?.[colIdx];
                    const count = heatmapData[`${rowT}-${colT}`] || 0;
                    const opacity = heatmapMax > 0 ? Math.max(0.1, count / heatmapMax) : 0.1;
                    const rTypeData = rType && rType !== '-' ? R_TYPES[rType] : null;

                    return (
                      <div
                        key={`${rowT}-${colT}`}
                        style={{
                          ...styles.heatmapCell,
                          backgroundColor: rType === '-' ? '#1a1a1a' : `rgba(129, 182, 76, ${opacity})`,
                          color: count > 0 ? '#fff' : '#666',
                          border: selectedRType === rType ? '2px solid #81b64c' : '1px solid #333'
                        }}
                        onClick={() => rType && rType !== '-' && setSelectedRType(rType === selectedRType ? null : rType)}
                        title={rTypeData ? `${rType}: ${rTypeData.natural} (${count} occurrences)` : ''}
                      >
                        {rType !== '-' ? count || '' : ''}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>

            {selectedRType && R_TYPES[selectedRType] && (
              <div style={{ ...styles.card, marginTop: '12px' }}>
                <div style={{ fontWeight: 600, color: RISK_COLORS[R_TYPES[selectedRType].risk] }}>
                  {selectedRType}: {R_TYPES[selectedRType].structure}
                </div>
                <div style={{ fontSize: '12px', color: '#ccc', marginTop: '4px' }}>
                  {R_TYPES[selectedRType].natural}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', marginTop: '4px' }}>
                  {R_TYPES[selectedRType].formal}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={styles.grid}>
          {/* Section 5: Logical Formulas Explorer */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🧮 Logical Formulas</h2>
            <div style={{ marginTop: '12px', maxHeight: '300px', overflow: 'auto' }}>
              {formulas.length === 0 ? (
                <p style={styles.placeholder}>No formulas recorded yet.</p>
              ) : (
                formulas.map((f, idx) => (
                  <div key={idx} style={{ ...styles.card, marginBottom: '8px' }}>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      color: '#81b64c',
                      marginBottom: '4px'
                    }}>
                      {f.formula}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#888' }}>{f.natural}</span>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: RISK_COLORS[f.riskLevel as RiskLevel] + '22',
                        color: RISK_COLORS[f.riskLevel as RiskLevel] || '#888'
                      }}>
                        {f.count}×
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 6: Modal Operators in Use */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>⚡ Modal Operators</h2>
            <div style={{ marginTop: '12px' }}>
              {operators.filter(o => o.count > 0).length === 0 ? (
                <p style={styles.placeholder}>No operator data yet.</p>
              ) : (
                operators.filter(o => o.count > 0).map(o => (
                  <div key={o.operator} style={styles.barContainer}>
                    <span style={{ ...styles.barLabel, fontWeight: 700, color: '#81b64c' }}>
                      {o.operator}
                    </span>
                    <div style={styles.barTrack}>
                      <div style={{
                        width: `${(o.count / maxOperatorCount) * 100}%`,
                        height: '100%',
                        backgroundColor: MODAL_OPERATORS[o.operator]?.category === 'deontic' ? '#3498db' : '#9b59b6',
                        borderRadius: '4px'
                      }} />
                    </div>
                    <span style={styles.barCount}>{o.count}</span>
                  </div>
                ))
              )}
              <div style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
                <span style={{ color: '#3498db' }}>●</span> Deontic (P,O,F) &nbsp;
                <span style={{ color: '#9b59b6' }}>●</span> Hohfeldian (C,L,W,B,I,D)
              </div>
            </div>
          </div>
        </div>

        {/* Section 7: Temporal Patterns (Placeholder) */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>⏱️ Temporal Patterns</h2>
          <p style={styles.placeholder}>
            Coming soon: LTL/CTL/PCTL patterns for deadline tracking, SLA monitoring, and probabilistic reasoning.
            <br />
            Chess has move timestamps but no temporal obligations. Contract domain will have deadline patterns.
          </p>
        </div>

        {/* Section 8: Recent Decisions Stream */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>📜 Recent Decisions ({totalDecisions} total)</h2>
            <button style={{ ...styles.closeBtn, padding: '4px 12px', fontSize: '12px' }} onClick={fetchData}>
              Refresh
            </button>
          </div>
          <div style={{ overflow: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Domain</th>
                  <th style={styles.th}>Action</th>
                  <th style={styles.th}>R-Type</th>
                  <th style={styles.th}>Agent I</th>
                  <th style={styles.th}>Agent J</th>
                  <th style={styles.th}>Time</th>
                </tr>
              </thead>
              <tbody>
                {decisions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#666' }}>
                      No decisions recorded yet. Play a game to see data here.
                    </td>
                  </tr>
                ) : (
                  decisions.map(d => (
                    <>
                      <tr
                        key={d.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setExpandedDecision(expandedDecision === d.id ? null : d.id)}
                      >
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, backgroundColor: '#81b64c22', color: '#81b64c' }}>
                            {d.domain}
                          </span>
                        </td>
                        <td style={{ ...styles.td, fontWeight: 600 }}>{d.san}</td>
                        <td style={styles.td}>
                          {Object.entries(CHESS_R_TYPE_MAPPING).find(([k]) => d.rType === k)?.[1] || d.rType}
                        </td>
                        <td style={styles.td}>{d.agentI_ttype}</td>
                        <td style={styles.td}>{d.agentJ_ttype}</td>
                        <td style={{ ...styles.td, color: '#888', fontSize: '11px' }}>
                          {new Date(d.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                      {expandedDecision === d.id && (
                        <tr key={`${d.id}-expanded`}>
                          <td colSpan={6} style={{ ...styles.td, backgroundColor: '#252525' }}>
                            <pre style={{
                              margin: 0,
                              fontSize: '11px',
                              color: '#81b64c',
                              overflow: 'auto',
                              maxHeight: '300px'
                            }}>
                              {JSON.stringify(d.krog_ld, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 9: Cross-Domain Insights (Placeholder) */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🔗 Cross-Domain Insights</h2>
          <p style={styles.placeholder}>
            Coming soon: Cross-domain functor visualization showing how R-types transfer between domains.
            <br />
            Example: R11 (T1,T5) appears in Chess (player→piece), Contracts (client→vendor), AI Auth (user→agent).
          </p>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', color: '#666', fontSize: '12px', padding: '20px' }}>
          KUIE Research Dashboard v1.0 • KROG Framework • Neurosymbolic AI Research
          <br />
          {totalDecisions} decisions across {domains.filter(d => d.status === 'active').length} active domains
        </div>
      </div>
    </div>
  );
}
