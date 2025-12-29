import { useState } from 'react';

/**
 * KROG Games Platform
 *
 * Landing page and game catalog for the KROG Games multi-game platform.
 * Each game uses the KROG framework for formal rule explanations.
 */

interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  available: boolean;
  playerCount: string;
  features: string[];
}

const games: Game[] = [
  {
    id: 'chess',
    name: 'KROG Chess',
    description: 'Classic chess with formal KROG rule explanations. Every move validated and explained using modal logic operators.',
    icon: '♟',
    available: true,
    playerCount: '2 players',
    features: ['ELO Rating', 'Chess960', '3-Check', 'King of the Hill', 'AI Opponent', 'Puzzles', 'Lessons']
  },
  {
    id: 'shogi',
    name: 'KROG Shogi',
    description: 'Japanese chess with piece drops. Captured pieces can be redeployed - a unique twist on strategy.',
    icon: '将',
    available: false,
    playerCount: '2 players',
    features: ['Drop Rules', 'Promotions', 'Handicap Games']
  },
  {
    id: 'go',
    name: 'KROG Go',
    description: 'Ancient strategy game of territory control. Simple rules, infinite depth.',
    icon: '●',
    available: false,
    playerCount: '2 players',
    features: ['Territory Scoring', 'Handicap Stones', 'Life & Death Problems']
  },
  {
    id: 'checkers',
    name: 'KROG Checkers',
    description: 'Classic checkers with international rules. Jump your way to victory.',
    icon: '⛀',
    available: false,
    playerCount: '2 players',
    features: ['International Rules', 'King Promotions', 'Multi-jumps']
  }
];

const krogFeatures = [
  {
    title: 'Formal Rule Validation',
    description: 'Every move validated using mathematical modal logic operators (P, O, F, C, L, W, B, I, D)',
    icon: '✓'
  },
  {
    title: 'FIDE Rule References',
    description: 'Direct references to official game rules with bilingual support (English/Norwegian)',
    icon: '📖'
  },
  {
    title: 'R-Type Classification',
    description: '15 rule categories mapping game-specific rules to universal relationship types',
    icon: '🔄'
  },
  {
    title: 'Learn Mode',
    description: 'Hover over pieces to see legal moves with KROG explanations',
    icon: '🎓'
  }
];

export default function App() {
  const [activeSection, setActiveSection] = useState<'games' | 'about' | 'learn' | 'research'>('games');

  const handlePlayGame = (gameId: string) => {
    if (gameId === 'chess') {
      // Chess client is deployed separately
      window.location.href = 'https://chess.kroggames.com';
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#1f2937',
        borderBottom: '1px solid #374151',
        padding: '1rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>♟</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#81b64c' }}>
              KROG Games
            </h1>
          </div>
          <nav style={{ display: 'flex', gap: '1.5rem' }}>
            {(['games', 'about', 'learn', 'research'] as const).map(section => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeSection === section ? '#81b64c' : '#9ca3af',
                  fontWeight: activeSection === section ? 'bold' : 'normal',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {section}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        padding: '4rem 1rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: '#f3f4f6'
          }}>
            Board Games with <span style={{ color: '#81b64c' }}>Formal Rule Explanations</span>
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: '#9ca3af',
            marginBottom: '2rem',
            lineHeight: '1.8'
          }}>
            KROG Games uses a mathematical framework to validate and explain every move.
            Learn why moves are legal (or illegal) with precise rule references.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => handlePlayGame('chess')}
              style={{
                backgroundColor: '#81b64c',
                color: 'white',
                padding: '0.75rem 2rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Play Chess Now
            </button>
            <button
              onClick={() => setActiveSection('learn')}
              style={{
                backgroundColor: 'transparent',
                color: '#81b64c',
                padding: '0.75rem 2rem',
                borderRadius: '0.5rem',
                border: '2px solid #81b64c',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Learn About KROG
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '3rem 1rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {activeSection === 'games' && (
            <>
              <h3 style={{
                fontSize: '1.75rem',
                fontWeight: 'bold',
                marginBottom: '2rem',
                color: '#f3f4f6'
              }}>
                Game Catalog
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem'
              }}>
                {games.map(game => (
                  <div
                    key={game.id}
                    style={{
                      backgroundColor: '#1f2937',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      border: `1px solid ${game.available ? '#374151' : '#1f2937'}`,
                      opacity: game.available ? 1 : 0.6,
                      transition: 'all 0.2s',
                      cursor: game.available ? 'pointer' : 'default'
                    }}
                    onClick={() => game.available && handlePlayGame(game.id)}
                  >
                    <div style={{
                      fontSize: '3rem',
                      marginBottom: '1rem',
                      color: game.available ? '#81b64c' : '#e67e22'
                    }}>
                      {game.icon}
                    </div>
                    <h4 style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      marginBottom: '0.5rem',
                      color: '#f3f4f6'
                    }}>
                      {game.name}
                    </h4>
                    <p style={{
                      color: '#9ca3af',
                      fontSize: '0.9rem',
                      marginBottom: '1rem',
                      lineHeight: '1.6'
                    }}>
                      {game.description}
                    </p>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#6b7280',
                      marginBottom: '1rem'
                    }}>
                      {game.playerCount}
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      {game.features.slice(0, 3).map(feature => (
                        <span
                          key={feature}
                          style={{
                            backgroundColor: '#374151',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            color: '#d1d5db'
                          }}
                        >
                          {feature}
                        </span>
                      ))}
                      {game.features.length > 3 && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          color: '#6b7280'
                        }}>
                          +{game.features.length - 3} more
                        </span>
                      )}
                    </div>
                    {game.available ? (
                      <button
                        style={{
                          backgroundColor: '#81b64c',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          fontWeight: '600',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        Play Now
                      </button>
                    ) : (
                      <div style={{
                        textAlign: 'center',
                        padding: '0.5rem',
                        color: '#6b7280',
                        fontStyle: 'italic'
                      }}>
                        Coming Soon
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {activeSection === 'about' && (
            <>
              <h3 style={{
                fontSize: '1.75rem',
                fontWeight: 'bold',
                marginBottom: '2rem',
                color: '#f3f4f6'
              }}>
                About KROG Games
              </h3>
              <div style={{
                backgroundColor: '#1f2937',
                borderRadius: '0.75rem',
                padding: '2rem',
                marginBottom: '2rem'
              }}>
                <p style={{ color: '#d1d5db', lineHeight: '1.8', marginBottom: '1rem' }}>
                  KROG Games is a multi-game platform that uses a formal mathematical framework
                  to validate and explain game rules. The KROG (Knowledge Representation of Games)
                  framework maps game-specific rules to universal relationship types (R-types)
                  through domain functors.
                </p>
                <p style={{ color: '#d1d5db', lineHeight: '1.8' }}>
                  Each game implements its own KROG functor that connects the game's rules to
                  the universal framework, enabling precise validation and bilingual explanations
                  of every move.
                </p>
              </div>
              <h4 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: '#f3f4f6'
              }}>
                The Framework
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '1rem'
              }}>
                <div style={{
                  backgroundColor: '#1f2937',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  borderLeft: '4px solid #81b64c'
                }}>
                  <h5 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>7 T-Types</h5>
                  <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                    Agent states from T1 (full discretion) to T7 (mandatory prevention)
                  </p>
                </div>
                <div style={{
                  backgroundColor: '#1f2937',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  borderLeft: '4px solid #3b82f6'
                }}>
                  <h5 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>35 R-Types</h5>
                  <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                    Bilateral relationships between agents as T-type combinations
                  </p>
                </div>
                <div style={{
                  backgroundColor: '#1f2937',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  borderLeft: '4px solid #10b981'
                }}>
                  <h5 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>9 Modal Operators</h5>
                  <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                    P, O, F, C, L, W, B, I, D based on Hohfeldian legal relations
                  </p>
                </div>
              </div>
            </>
          )}

          {activeSection === 'learn' && (
            <>
              <h3 style={{
                fontSize: '1.75rem',
                fontWeight: 'bold',
                marginBottom: '2rem',
                color: '#f3f4f6'
              }}>
                KROG Framework Features
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem'
              }}>
                {krogFeatures.map((feature, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: '#1f2937',
                      borderRadius: '0.75rem',
                      padding: '1.5rem'
                    }}
                  >
                    <div style={{
                      fontSize: '2rem',
                      marginBottom: '1rem'
                    }}>
                      {feature.icon}
                    </div>
                    <h4 style={{
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      marginBottom: '0.5rem',
                      color: '#f3f4f6'
                    }}>
                      {feature.title}
                    </h4>
                    <p style={{
                      color: '#9ca3af',
                      fontSize: '0.9rem',
                      lineHeight: '1.6'
                    }}>
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: '3rem',
                backgroundColor: '#1f2937',
                borderRadius: '0.75rem',
                padding: '2rem'
              }}>
                <h4 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                  color: '#f3f4f6'
                }}>
                  How It Works
                </h4>
                <p style={{ color: '#d1d5db', lineHeight: '1.8', marginBottom: '1rem' }}>
                  When you make a move, KROG validates it against formal rules and provides:
                </p>
                <ul style={{ color: '#9ca3af', lineHeight: '2', paddingLeft: '1.5rem' }}>
                  <li>Mathematical proof of move legality</li>
                  <li>Classification into universal rule types (R-types)</li>
                  <li>Reference to official game rules (e.g., FIDE articles)</li>
                  <li>Bilingual explanations (English/Norwegian)</li>
                </ul>
              </div>
            </>
          )}

          {activeSection === 'research' && (
            <>
              <h3 style={{
                fontSize: '1.75rem',
                fontWeight: 'bold',
                marginBottom: '2rem',
                color: '#f3f4f6'
              }}>
                Neurosymbolic AI Research Platform
              </h3>

              {/* Hero Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                borderRadius: '0.75rem',
                padding: '2rem',
                marginBottom: '2rem',
                border: '1px solid #81b64c'
              }}>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#81b64c', marginBottom: '1rem' }}>
                  The Future of Explainable AI
                </h4>
                <p style={{ color: '#d1d5db', lineHeight: '1.8', fontSize: '1.1rem' }}>
                  KROG Games is the world's first neurosymbolic game platform, combining neural pattern recognition
                  with symbolic logical reasoning to create AI that can explain its decisions.
                </p>
              </div>

              {/* What is Neurosymbolic AI */}
              <div style={{
                backgroundColor: '#1f2937',
                borderRadius: '0.75rem',
                padding: '2rem',
                marginBottom: '2rem'
              }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#f3f4f6' }}>
                  What is Neurosymbolic AI?
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem' }}>
                    <h5 style={{ color: '#e67e22', fontWeight: 'bold', marginBottom: '0.5rem' }}>Neural AI (Pattern)</h5>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.6' }}>
                      Deep learning that recognizes patterns from data. Powerful but opaque - cannot explain why it makes decisions.
                    </p>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem' }}>
                    <h5 style={{ color: '#3b82f6', fontWeight: 'bold', marginBottom: '0.5rem' }}>Symbolic AI (Logic)</h5>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.6' }}>
                      Rule-based reasoning with explicit logic. Interpretable but requires hand-coded knowledge.
                    </p>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem', border: '1px solid #81b64c' }}>
                    <h5 style={{ color: '#81b64c', fontWeight: 'bold', marginBottom: '0.5rem' }}>Neurosymbolic (Both)</h5>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.6' }}>
                      Combines pattern recognition with logical rules. The best of both worlds: powerful AND explainable.
                    </p>
                  </div>
                </div>
              </div>

              {/* Why This Matters */}
              <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f3f4f6' }}>
                Why Neurosymbolic AI Matters
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                {[
                  { title: 'Explainability', desc: 'AI decisions can be traced to logical rules, not black boxes', icon: '🔍' },
                  { title: 'Data Efficiency', desc: 'Symbolic rules reduce need for massive training datasets by 100x', icon: '📊' },
                  { title: 'Transfer Learning', desc: 'Universal rules transfer knowledge across different domains', icon: '🔄' },
                  { title: 'Safety & Trust', desc: 'Symbolic constraints prevent AI from violating hard rules', icon: '🛡️' },
                  { title: 'Human Collaboration', desc: 'Humans can understand and verify AI reasoning', icon: '🤝' },
                  { title: 'Regulatory Compliance', desc: 'EU AI Act requires explainable AI for high-risk applications', icon: '⚖️' }
                ].map((item, i) => (
                  <div key={i} style={{
                    backgroundColor: '#1f2937',
                    borderRadius: '0.5rem',
                    padding: '1.25rem',
                    borderLeft: '3px solid #81b64c'
                  }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{item.icon}</div>
                    <h5 style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#f3f4f6' }}>{item.title}</h5>
                    <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: '1.5' }}>{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* KROG Advantage */}
              <div style={{
                backgroundColor: '#1f2937',
                borderRadius: '0.75rem',
                padding: '2rem',
                marginBottom: '2rem'
              }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#f3f4f6' }}>
                  The KROG Games Advantage
                </h4>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <span style={{ color: '#81b64c', fontWeight: 'bold', fontSize: '1.25rem' }}>1.</span>
                    <div>
                      <h5 style={{ fontWeight: 'bold', color: '#f3f4f6', marginBottom: '0.25rem' }}>Explainable Game AI</h5>
                      <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                        Unlike AlphaZero which can't explain moves, KROG AI provides formal logical reasoning for every decision.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <span style={{ color: '#81b64c', fontWeight: 'bold', fontSize: '1.25rem' }}>2.</span>
                    <div>
                      <h5 style={{ fontWeight: 'bold', color: '#f3f4f6', marginBottom: '0.25rem' }}>Cross-Game Transfer</h5>
                      <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                        Universal R-types enable skill transfer: master a concept in chess, apply it faster in shogi or go.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <span style={{ color: '#81b64c', fontWeight: 'bold', fontSize: '1.25rem' }}>3.</span>
                    <div>
                      <h5 style={{ fontWeight: 'bold', color: '#f3f4f6', marginBottom: '0.25rem' }}>Research-Grade Data</h5>
                      <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                        Every decision captures both neural patterns (behavior) and symbolic rules - unique neurosymbolic training data.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <span style={{ color: '#81b64c', fontWeight: 'bold', fontSize: '1.25rem' }}>4.</span>
                    <div>
                      <h5 style={{ fontWeight: 'bold', color: '#f3f4f6', marginBottom: '0.25rem' }}>Cognitive Science Platform</h5>
                      <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                        Empirically measure how humans learn symbolic rules vs. neural patterns across multiple game domains.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Industry Validation */}
              <div style={{
                backgroundColor: '#1f2937',
                borderRadius: '0.75rem',
                padding: '2rem',
                marginBottom: '2rem'
              }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f3f4f6' }}>
                  Industry Validation
                </h4>
                <p style={{ color: '#d1d5db', lineHeight: '1.8', marginBottom: '1rem' }}>
                  Major organizations investing in neurosymbolic AI research:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {['IBM', 'MIT-IBM Watson Lab', 'DeepMind', 'DARPA', 'Microsoft Research', 'Stanford HAI'].map(org => (
                    <span key={org} style={{
                      backgroundColor: '#2a2a2a',
                      padding: '0.5rem 1rem',
                      borderRadius: '2rem',
                      fontSize: '0.85rem',
                      color: '#d1d5db'
                    }}>
                      {org}
                    </span>
                  ))}
                </div>
                <p style={{ color: '#81b64c', marginTop: '1.5rem', fontWeight: '500' }}>
                  KROG Games is the first deployed neurosymbolic platform with real user data at scale.
                </p>
              </div>

              {/* Research Opportunities */}
              <div style={{
                backgroundColor: '#1f2937',
                borderRadius: '0.75rem',
                padding: '2rem',
                marginBottom: '2rem'
              }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#f3f4f6' }}>
                  Research Opportunities
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {[
                    { venue: 'AI/ML Conferences', topics: 'AAAI, NeurIPS, IJCAI', focus: 'Neurosymbolic framework foundations' },
                    { venue: 'Cognitive Science', topics: 'COGSCI, CogSci Journal', focus: 'Human transfer learning patterns' },
                    { venue: 'AI Safety', topics: 'JAIR, AI Magazine', focus: 'Explainable AI in games' },
                    { venue: 'High Impact', topics: 'Science, Nature', focus: 'Large-scale decision analysis' }
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem' }}>
                      <h5 style={{ color: '#81b64c', fontWeight: 'bold', marginBottom: '0.25rem' }}>{item.venue}</h5>
                      <p style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{item.topics}</p>
                      <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{item.focus}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact CTA */}
              <div style={{
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                borderRadius: '0.75rem',
                padding: '2rem',
                textAlign: 'center',
                border: '1px solid #333'
              }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f3f4f6' }}>
                  Interested in Research Collaboration?
                </h4>
                <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
                  We're open to academic partnerships, research collaborations, and investor discussions.
                </p>
                <a
                  href="mailto:georg@kroggames.com"
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#81b64c',
                    color: 'white',
                    padding: '0.75rem 2rem',
                    borderRadius: '0.5rem',
                    fontWeight: 'bold',
                    textDecoration: 'none'
                  }}
                >
                  Contact Us
                </a>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#1f2937',
        borderTop: '1px solid #374151',
        padding: '2rem 1rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
            KROG Games Platform - Formal game rule explanations
          </p>
          <p style={{ color: '#4b5563', fontSize: '0.875rem' }}>
            Created by Georg Philip Krog
          </p>
        </div>
      </footer>
    </div>
  );
}
