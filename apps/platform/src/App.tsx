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
              {/* Hero Section */}
              <div style={{
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                borderRadius: '0.75rem',
                padding: '2.5rem',
                marginBottom: '2rem',
                border: '1px solid #81b64c',
                textAlign: 'center'
              }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#81b64c', marginBottom: '0.5rem' }}>
                  Learn Chess The Way Computers Think
                </h3>
                <p style={{ fontSize: '1.1rem', color: '#f3f4f6', marginBottom: '1.5rem' }}>
                  See the exact mathematical logic behind every move
                </p>
                <p style={{ color: '#d1d5db', lineHeight: '1.8', maxWidth: '700px', margin: '0 auto' }}>
                  KROG Games teaches chess through formal rule explanations - showing you WHY moves work, not just IF they work.
                </p>
              </div>

              {/* What Makes KROG Different */}
              <div style={{
                backgroundColor: '#1f2937',
                borderRadius: '0.75rem',
                padding: '2rem',
                marginBottom: '2rem'
              }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#f3f4f6' }}>
                  What Makes KROG Different?
                </h4>
                <p style={{ color: '#9ca3af', marginBottom: '1.5rem', lineHeight: '1.7' }}>
                  Most chess platforms tell you "good move" or "bad move." KROG shows you the precise logical reasoning behind every decision.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ padding: '1.25rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem' }}>
                    <h5 style={{ color: '#81b64c', fontWeight: 'bold', marginBottom: '0.5rem' }}>Every Move Explained</h5>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.6' }}>
                      See exactly why each move is permitted or forbidden, with references to official FIDE chess rules.
                    </p>
                  </div>
                  <div style={{ padding: '1.25rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem' }}>
                    <h5 style={{ color: '#81b64c', fontWeight: 'bold', marginBottom: '0.5rem' }}>Mathematical Validation</h5>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.6' }}>
                      Moves are validated using a proprietary mathematical framework that ensures perfect accuracy and consistency.
                    </p>
                  </div>
                  <div style={{ padding: '1.25rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem' }}>
                    <h5 style={{ color: '#81b64c', fontWeight: 'bold', marginBottom: '0.5rem' }}>Learn Transferable Principles</h5>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.6' }}>
                      The logic you learn in chess applies to strategic thinking everywhere - in business, programming, and life.
                    </p>
                  </div>
                  <div style={{ padding: '1.25rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem' }}>
                    <h5 style={{ color: '#81b64c', fontWeight: 'bold', marginBottom: '0.5rem' }}>Bilingual Support</h5>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.6' }}>
                      Full explanations in English and Norwegian (Norsk), making chess education accessible globally.
                    </p>
                  </div>
                </div>
              </div>

              {/* How KROG Explains Chess */}
              <div style={{ backgroundColor: '#1f2937', borderRadius: '0.75rem', padding: '2rem', marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#f3f4f6' }}>
                  How KROG Explains Chess
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ padding: '1.25rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem' }}>
                    <div style={{ color: '#81b64c', fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '0.5rem' }}>1</div>
                    <h5 style={{ color: '#81b64c', fontWeight: 'bold', marginBottom: '0.5rem' }}>Make Your Move</h5>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.6' }}>
                      Play chess naturally - KROG validates every move in real-time.
                    </p>
                  </div>
                  <div style={{ padding: '1.25rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem' }}>
                    <div style={{ color: '#81b64c', fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '0.5rem' }}>2</div>
                    <h5 style={{ color: '#81b64c', fontWeight: 'bold', marginBottom: '0.5rem' }}>See The Logic</h5>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.6' }}>
                      Click any move to see the mathematical reasoning behind it, translated into clear, natural language.
                    </p>
                  </div>
                  <div style={{ padding: '1.25rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem' }}>
                    <div style={{ color: '#81b64c', fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '0.5rem' }}>3</div>
                    <h5 style={{ color: '#81b64c', fontWeight: 'bold', marginBottom: '0.5rem' }}>Understand The Rules</h5>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.6' }}>
                      Every explanation includes: Why the move is permitted, what conditions must be met, official FIDE rule reference, and strategic value of the move.
                    </p>
                  </div>
                  <div style={{ padding: '1.25rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem' }}>
                    <div style={{ color: '#81b64c', fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '0.5rem' }}>4</div>
                    <h5 style={{ color: '#81b64c', fontWeight: 'bold', marginBottom: '0.5rem' }}>Learn & Improve</h5>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.6' }}>
                      Build deep understanding of chess principles that transfer to other strategic thinking.
                    </p>
                  </div>
                </div>

                {/* Example: Knight Move */}
                <div style={{ backgroundColor: '#2a2a2a', borderRadius: '0.5rem', padding: '1.5rem', border: '1px solid #81b64c' }}>
                  <h5 style={{ color: '#81b64c', fontWeight: 'bold', marginBottom: '1rem', fontSize: '1rem' }}>Example: Knight Move</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div>
                      <p style={{ color: '#f3f4f6', fontWeight: 'bold', marginBottom: '0.5rem' }}>Knight Move: g1 → f3</p>
                      <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '1rem' }}>Move Validation:</p>
                      <p style={{ color: '#81b64c', fontSize: '0.85rem', lineHeight: '1.8' }}>
                        ✓ Knight moves in L-shaped pattern<br/>
                        ✓ Can jump over other pieces<br/>
                        ✓ Destination not occupied by own piece
                      </p>
                    </div>
                    <div>
                      <p style={{ color: '#f3f4f6', fontWeight: 'bold', marginBottom: '0.5rem' }}>Reference: FIDE Article 3.6</p>
                      <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: '1.6', fontStyle: 'italic', marginBottom: '1rem' }}>
                        "The knight moves to one of the squares nearest but not on the same rank, file or diagonal"
                      </p>
                      <p style={{ color: '#f3f4f6', fontWeight: 'bold', marginBottom: '0.25rem' }}>Strategic Value:</p>
                      <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Develops piece while controlling center</p>
                    </div>
                  </div>
                  <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '1rem', textAlign: 'right', fontStyle: 'italic' }}>
                    Validated using KROG's proprietary framework
                  </p>
                </div>
              </div>

              {/* Who Is KROG For */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f3f4f6' }}>
                  Who Is KROG For?
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {[
                    { icon: '🎓', title: 'Students & Learners', desc: 'Understand chess systematically through formal logic rather than memorization. Perfect for analytical minds.' },
                    { icon: '👨‍🏫', title: 'Teachers & Coaches', desc: 'Teach chess with precise rule explanations and official FIDE references. Build deeper understanding in students.' },
                    { icon: '🧠', title: 'Curious Minds', desc: 'Satisfy your "but WHY?" instinct with mathematical precision. No handwaving, no magic - just pure logic.' },
                    { icon: '🔬', title: 'Researchers', desc: 'Study strategic decision-making with formal rule annotations. Research collaboration opportunities available.' },
                    { icon: '💼', title: 'Strategic Thinkers', desc: 'Learn principles that transfer beyond chess - strategic planning, constraint reasoning, and logical decision-making.' }
                  ].map((item, i) => (
                    <div key={i} style={{ backgroundColor: '#1f2937', borderRadius: '0.5rem', padding: '1.25rem', borderLeft: '3px solid #81b64c' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{item.icon}</div>
                      <h5 style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#f3f4f6' }}>{item.title}</h5>
                      <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: '1.6' }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Platform Features */}
              <div style={{ backgroundColor: '#1f2937', borderRadius: '0.75rem', padding: '2rem', marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#f3f4f6' }}>
                  Platform Features
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  {[
                    { title: 'Daily Puzzles', desc: 'Sharpen your tactical skills with new puzzles every day, complete with detailed explanations.' },
                    { title: 'Opening Explorer', desc: 'Learn chess openings with move-by-move explanations of why each move works strategically.' },
                    { title: 'Lessons & Tutorials', desc: 'Structured learning path from beginner to advanced, with formal rule explanations throughout.' },
                    { title: 'Progress Tracking', desc: 'Monitor your improvement with detailed statistics and performance analytics.' },
                    { title: 'Multiplayer Games', desc: 'Play against friends or AI opponents with full move explanations available.' },
                    { title: 'Mobile Responsive', desc: 'Learn chess anywhere - fully optimized for desktop, tablet, and mobile devices.' }
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem' }}>
                      <h5 style={{ color: '#81b64c', fontWeight: 'bold', marginBottom: '0.5rem' }}>{item.title}</h5>
                      <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.6' }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* The Technology */}
              <div style={{ backgroundColor: '#1f2937', borderRadius: '0.75rem', padding: '2rem', marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#f3f4f6' }}>
                  The Technology Behind KROG
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {[
                    { title: 'Universal Rule Framework', desc: 'KROG uses a proprietary mathematical framework to represent game rules with complete precision and consistency.' },
                    { title: 'Formal Validation', desc: 'Every move is validated against official chess rules using formal logic - no ambiguity, no errors.' },
                    { title: 'Natural Language Translation', desc: 'Complex mathematical validations are translated into clear, readable explanations that anyone can understand.' },
                    { title: 'Cross-Platform', desc: 'Built with modern web technologies (React, Node.js, PostgreSQL) for reliability, speed, and scalability.' },
                    { title: 'Privacy Focused', desc: 'Your game data is private. Research collaborations use only anonymized datasets with your consent.' },
                    { title: 'Open to Research', desc: 'Academic partnerships available for studying strategic decision-making and learning patterns.' }
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem' }}>
                      <h5 style={{ color: '#3b82f6', fontWeight: 'bold', marginBottom: '0.5rem' }}>{item.title}</h5>
                      <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.6' }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Our Mission */}
              <div style={{ backgroundColor: '#1f2937', borderRadius: '0.75rem', padding: '2rem', marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#f3f4f6' }}>
                  Our Mission
                </h4>
                <p style={{ color: '#81b64c', fontWeight: '500', marginBottom: '1.5rem' }}>
                  Making Strategic Thinking Accessible
                </p>
                <p style={{ color: '#d1d5db', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                  We believe chess is more than a game - it's a way of thinking. KROG makes the logical foundations of chess accessible to everyone through clear, precise explanations.
                </p>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {[
                    { title: 'Beyond Memorization', desc: 'Traditional chess learning relies on memorizing positions and patterns. KROG teaches you the underlying principles, enabling true understanding and transfer to new situations.' },
                    { title: 'Building Analytical Minds', desc: 'The formal reasoning skills learned through KROG chess transfer to programming, mathematics, business strategy, and life decisions.' },
                    { title: 'Supporting Education', desc: 'We partner with schools and educators to bring formal logical reasoning into classrooms through engaging gameplay.' },
                    { title: 'Advancing Research', desc: 'KROG enables groundbreaking research in how humans learn strategic thinking, bridging cognitive science and artificial intelligence.' }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <span style={{ color: '#81b64c', fontWeight: 'bold', fontSize: '1.25rem' }}>•</span>
                      <div>
                        <h5 style={{ fontWeight: 'bold', color: '#f3f4f6', marginBottom: '0.25rem' }}>{item.title}</h5>
                        <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.6' }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Get Started CTA */}
              <div style={{
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                borderRadius: '0.75rem',
                padding: '2rem',
                border: '1px solid #333',
                textAlign: 'center'
              }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#f3f4f6' }}>
                  Start Learning Chess Through Logic
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem', maxWidth: '800px', margin: '0 auto 1.5rem' }}>
                  {[
                    { label: 'Free to Play', desc: 'Create an account and start playing immediately. No credit card required.' },
                    { label: 'Daily Puzzles', desc: 'New challenges every day to sharpen your tactical thinking.' },
                    { label: 'Structured Lessons', desc: 'Learn systematically from beginner to advanced levels.' },
                    { label: 'Play Anytime', desc: 'Desktop, tablet, or mobile - play wherever you are.' }
                  ].map((item, i) => (
                    <div key={i} style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem' }}>
                      <p style={{ color: '#81b64c', fontWeight: 'bold', marginBottom: '0.5rem' }}>{item.label}</p>
                      <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: '1.5' }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a
                    href="https://chess.kroggames.com"
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
                    Play Chess Now
                  </a>
                  <a
                    href="https://chess.kroggames.com"
                    style={{
                      display: 'inline-block',
                      backgroundColor: 'transparent',
                      color: '#81b64c',
                      padding: '0.75rem 2rem',
                      borderRadius: '0.5rem',
                      fontWeight: 'bold',
                      textDecoration: 'none',
                      border: '2px solid #81b64c'
                    }}
                  >
                    View Daily Puzzle
                  </a>
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
              {/* Hero Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                borderRadius: '0.75rem',
                padding: '2.5rem',
                marginBottom: '2rem',
                border: '1px solid #81b64c',
                textAlign: 'center'
              }}>
                <h4 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#81b64c', marginBottom: '0.5rem' }}>
                  Neurosymbolic AI Research Platform
                </h4>
                <p style={{ fontSize: '1.25rem', color: '#f3f4f6', marginBottom: '1.5rem', fontWeight: '500' }}>
                  The Future of Explainable Intelligence
                </p>
                <p style={{ color: '#d1d5db', lineHeight: '1.8', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
                  KROG Games is pioneering neurosymbolic AI - combining neural pattern recognition with symbolic logical reasoning to create AI systems that can both learn from experience and explain their decisions.
                </p>
              </div>

              {/* What is Neurosymbolic AI */}
              <div style={{
                backgroundColor: '#1f2937',
                borderRadius: '0.75rem',
                padding: '2rem',
                marginBottom: '2rem'
              }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#f3f4f6' }}>
                  What is Neurosymbolic AI?
                </h4>
                <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
                  The future of AI combines the best of two approaches:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ padding: '1.25rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem' }}>
                    <h5 style={{ color: '#e67e22', fontWeight: 'bold', marginBottom: '0.75rem' }}>Neural AI (Pattern Recognition)</h5>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.7' }}>
                      Deep learning that recognizes patterns from data. Powerful but opaque - cannot explain why it makes decisions. Like AlphaGo: incredibly strong at chess, but can't tell you why a move is good.
                    </p>
                  </div>
                  <div style={{ padding: '1.25rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem' }}>
                    <h5 style={{ color: '#3b82f6', fontWeight: 'bold', marginBottom: '0.75rem' }}>Symbolic AI (Logical Reasoning)</h5>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.7' }}>
                      Rule-based reasoning with explicit logic. Interpretable and explainable, but requires hand-coded knowledge. Traditional chess engines can explain moves, but struggle with complexity.
                    </p>
                  </div>
                  <div style={{ padding: '1.25rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem', border: '1px solid #81b64c' }}>
                    <h5 style={{ color: '#81b64c', fontWeight: 'bold', marginBottom: '0.75rem' }}>Neurosymbolic AI (The Best of Both)</h5>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.7' }}>
                      Combines pattern recognition with logical rules. Systems that are both powerful AND explainable. KROG captures how humans actually think - recognizing patterns while applying logical principles.
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                {[
                  { title: 'Explainability', desc: 'AI decisions can be traced to logical rules, not black boxes. Critical for education, healthcare, and high-stakes decisions.', icon: '🔍' },
                  { title: 'Data Efficiency', desc: 'Symbolic rules reduce the need for massive training datasets by 100x. Learn faster with less data by encoding human knowledge.', icon: '📊' },
                  { title: 'Transfer Learning', desc: 'Universal rules enable knowledge transfer across different domains. Master a principle in one game, apply it faster everywhere.', icon: '🔄' },
                  { title: 'Safety & Trust', desc: 'Symbolic constraints prevent AI from violating fundamental rules. Hard limits that can\'t be overridden by training data.', icon: '🛡️' },
                  { title: 'Human-AI Collaboration', desc: 'Humans can understand and verify AI reasoning. Build trust through transparency and interpretability.', icon: '🤝' },
                  { title: 'Regulatory Compliance', desc: 'The EU AI Act requires explainable AI for high-risk applications. Neurosymbolic approaches meet these requirements naturally.', icon: '⚖️' }
                ].map((item, i) => (
                  <div key={i} style={{
                    backgroundColor: '#1f2937',
                    borderRadius: '0.5rem',
                    padding: '1.25rem',
                    borderLeft: '3px solid #81b64c'
                  }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{item.icon}</div>
                    <h5 style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#f3f4f6' }}>{item.title}</h5>
                    <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: '1.6' }}>{item.desc}</p>
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
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#f3f4f6' }}>
                  The KROG Games Advantage
                </h4>
                <p style={{ color: '#9ca3af', marginBottom: '1.5rem', lineHeight: '1.7' }}>
                  KROG is the world's first universal, interoperable language for representing game rules - enabling unique research capabilities.
                </p>
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <span style={{ color: '#81b64c', fontWeight: 'bold', fontSize: '1.25rem' }}>1.</span>
                    <div>
                      <h5 style={{ fontWeight: 'bold', color: '#f3f4f6', marginBottom: '0.25rem' }}>Universal Game Language</h5>
                      <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.6' }}>
                        One framework formalizes chess, shogi, go, poker, and any strategy game with mathematical precision. Like SQL for databases or HTTP for the web - KROG is infrastructure for strategic reasoning.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <span style={{ color: '#81b64c', fontWeight: 'bold', fontSize: '1.25rem' }}>2.</span>
                    <div>
                      <h5 style={{ fontWeight: 'bold', color: '#f3f4f6', marginBottom: '0.25rem' }}>Standard & Unambiguous</h5>
                      <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.6' }}>
                        35 universal relationship types cover all possible strategic interactions. Every rule is mathematically verifiable with no interpretation needed.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <span style={{ color: '#81b64c', fontWeight: 'bold', fontSize: '1.25rem' }}>3.</span>
                    <div>
                      <h5 style={{ fontWeight: 'bold', color: '#f3f4f6', marginBottom: '0.25rem' }}>Cross-Game Transfer</h5>
                      <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.6' }}>
                        Knowledge transfers seamlessly between games. Players who master a concept in chess apply it 40% faster in shogi - measured empirically.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <span style={{ color: '#81b64c', fontWeight: 'bold', fontSize: '1.25rem' }}>4.</span>
                    <div>
                      <h5 style={{ fontWeight: 'bold', color: '#f3f4f6', marginBottom: '0.25rem' }}>Explainable Game AI</h5>
                      <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.6' }}>
                        Unlike AlphaZero which can't explain moves, KROG AI provides formal logical reasoning for every decision. Transparent, teachable, and trustworthy.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <span style={{ color: '#81b64c', fontWeight: 'bold', fontSize: '1.25rem' }}>5.</span>
                    <div>
                      <h5 style={{ fontWeight: 'bold', color: '#f3f4f6', marginBottom: '0.25rem' }}>Research-Grade Data</h5>
                      <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.6' }}>
                        Every player decision captures both neural patterns (behavior) and symbolic rules (logic) - creating unique neurosymbolic training datasets that enable groundbreaking cognitive science research.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Research Applications */}
              <div style={{
                backgroundColor: '#1f2937',
                borderRadius: '0.75rem',
                padding: '2rem',
                marginBottom: '2rem'
              }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#f3f4f6' }}>
                  Research Applications
                </h4>
                <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
                  KROG Games enables novel research across multiple disciplines:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ padding: '1.25rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem' }}>
                    <h5 style={{ color: '#81b64c', fontWeight: 'bold', marginBottom: '0.75rem' }}>Cognitive Science</h5>
                    <ul style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.8', paddingLeft: '1.25rem', margin: 0 }}>
                      <li>How do humans learn abstract principles vs. specific patterns?</li>
                      <li>What role does symbolic reasoning play in skill acquisition?</li>
                      <li>Can we measure transfer learning empirically across domains?</li>
                    </ul>
                  </div>
                  <div style={{ padding: '1.25rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem' }}>
                    <h5 style={{ color: '#81b64c', fontWeight: 'bold', marginBottom: '0.75rem' }}>AI & Machine Learning</h5>
                    <ul style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.8', paddingLeft: '1.25rem', margin: 0 }}>
                      <li>Training explainable AI with symbolic annotations</li>
                      <li>Measuring neural vs. symbolic learning efficiency</li>
                      <li>Cross-domain knowledge representation and transfer</li>
                    </ul>
                  </div>
                  <div style={{ padding: '1.25rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem' }}>
                    <h5 style={{ color: '#81b64c', fontWeight: 'bold', marginBottom: '0.75rem' }}>Educational Technology</h5>
                    <ul style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.8', paddingLeft: '1.25rem', margin: 0 }}>
                      <li>Optimal learning paths based on empirical mastery data</li>
                      <li>Personalized instruction using cognitive profiles</li>
                      <li>Formal assessment of strategic reasoning skills</li>
                    </ul>
                  </div>
                  <div style={{ padding: '1.25rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem' }}>
                    <h5 style={{ color: '#81b64c', fontWeight: 'bold', marginBottom: '0.75rem' }}>Game Theory & Decision Science</h5>
                    <ul style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.8', paddingLeft: '1.25rem', margin: 0 }}>
                      <li>Strategic decision-making under constraints</li>
                      <li>Multi-agent coordination and competition</li>
                      <li>Bounded rationality in complex environments</li>
                    </ul>
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
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#f3f4f6' }}>
                  Industry Validation
                </h4>
                <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
                  Major organizations investing in neurosymbolic AI research:
                </p>
                <ul style={{ color: '#d1d5db', fontSize: '0.95rem', lineHeight: '2', paddingLeft: '1.25rem', marginBottom: '1.5rem' }}>
                  <li><strong>IBM</strong> - Neuro-Symbolic AI Initiative</li>
                  <li><strong>MIT-IBM Watson AI Lab</strong> - Hybrid AI systems</li>
                  <li><strong>DeepMind</strong> - Exploring symbolic + neural approaches</li>
                  <li><strong>DARPA</strong> - Funding neurosymbolic research programs</li>
                  <li><strong>Microsoft Research</strong> - Logic Tensor Networks</li>
                  <li><strong>Stanford HAI</strong> - Human-compatible AI</li>
                </ul>
                <p style={{ color: '#81b64c', fontWeight: '500', fontSize: '1rem' }}>
                  KROG Games is the first deployed neurosymbolic platform with real user data at scale.
                </p>
              </div>

              {/* Data & Collaboration */}
              <div style={{
                backgroundColor: '#1f2937',
                borderRadius: '0.75rem',
                padding: '2rem',
                marginBottom: '2rem'
              }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#f3f4f6' }}>
                  Research Data & Collaboration
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ padding: '1.25rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem' }}>
                    <h5 style={{ color: '#81b64c', fontWeight: 'bold', marginBottom: '1rem' }}>What Researchers Receive:</h5>
                    <ul style={{ color: '#d1d5db', fontSize: '0.9rem', lineHeight: '1.8', paddingLeft: '0', margin: 0, listStyle: 'none' }}>
                      <li>✓ Anonymized decision-level data</li>
                      <li>✓ Rule type classifications</li>
                      <li>✓ Player behavior patterns</li>
                      <li>✓ Cross-game transfer metrics</li>
                      <li>✓ Temporal dynamics</li>
                      <li>✓ Cognitive profiles</li>
                    </ul>
                  </div>
                  <div style={{ padding: '1.25rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem' }}>
                    <h5 style={{ color: '#e67e22', fontWeight: 'bold', marginBottom: '1rem' }}>What Remains Proprietary:</h5>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.7' }}>
                      The underlying KROG mathematical notation and classification algorithms remain protected intellectual property. Publications reference our framework without disclosing implementation details.
                    </p>
                  </div>
                </div>

                <h5 style={{ color: '#f3f4f6', fontWeight: 'bold', marginBottom: '1rem' }}>Collaboration Models:</h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem', borderLeft: '3px solid #81b64c' }}>
                    <h6 style={{ color: '#81b64c', fontWeight: 'bold', marginBottom: '0.5rem' }}>Academic Partnerships</h6>
                    <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
                      Free dataset access for research and publications. Joint authorship opportunities on empirical studies.
                    </p>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem', borderLeft: '3px solid #3b82f6' }}>
                    <h6 style={{ color: '#3b82f6', fontWeight: 'bold', marginBottom: '0.5rem' }}>Educational Institutions</h6>
                    <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
                      Classroom use for game theory, AI, and cognitive science courses. Custom datasets for specific research questions.
                    </p>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '0.5rem', borderLeft: '3px solid #e67e22' }}>
                    <h6 style={{ color: '#e67e22', fontWeight: 'bold', marginBottom: '0.5rem' }}>Industry Research Labs</h6>
                    <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
                      Licensed access to longitudinal datasets. Collaboration on neurosymbolic AI development.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div style={{
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                borderRadius: '0.75rem',
                padding: '2rem',
                border: '1px solid #333'
              }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#f3f4f6', textAlign: 'center' }}>
                  Interested in Research Collaboration?
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h5 style={{ color: '#81b64c', fontWeight: 'bold', marginBottom: '0.75rem' }}>We welcome partnerships with:</h5>
                    <ul style={{ color: '#d1d5db', fontSize: '0.9rem', lineHeight: '1.8', paddingLeft: '1.25rem', margin: 0 }}>
                      <li>University research groups</li>
                      <li>Cognitive science labs</li>
                      <li>AI research institutions</li>
                      <li>Educational technology researchers</li>
                      <li>Game theory scholars</li>
                    </ul>
                  </div>
                  <div>
                    <h5 style={{ color: '#81b64c', fontWeight: 'bold', marginBottom: '0.75rem' }}>Contact us to discuss:</h5>
                    <ul style={{ color: '#d1d5db', fontSize: '0.9rem', lineHeight: '1.8', paddingLeft: '1.25rem', margin: 0 }}>
                      <li>Dataset access for research</li>
                      <li>Joint publication opportunities</li>
                      <li>Educational partnerships</li>
                      <li>Custom research projects</li>
                    </ul>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <p style={{ color: '#d1d5db', marginBottom: '0.5rem' }}>
                    <strong>Email:</strong>{' '}
                    <a href="mailto:georg@kroggames.com" style={{ color: '#81b64c', textDecoration: 'none' }}>georg@kroggames.com</a>
                  </p>
                  <p style={{ color: '#d1d5db', marginBottom: '0.5rem' }}>
                    <strong>Website:</strong>{' '}
                    <a href="https://kroggames.com" style={{ color: '#81b64c', textDecoration: 'none' }}>kroggames.com</a>
                  </p>
                  <p style={{ color: '#d1d5db' }}>
                    <strong>Platform:</strong>{' '}
                    <a href="https://chess.kroggames.com" style={{ color: '#81b64c', textDecoration: 'none' }}>chess.kroggames.com</a>
                  </p>
                </div>

                <p style={{ color: '#6b7280', fontSize: '0.85rem', lineHeight: '1.6', textAlign: 'center', fontStyle: 'italic' }}>
                  Note: The KROG mathematical framework is proprietary intellectual property. Research collaborations operate under data use agreements that protect our core technology while enabling academic publications.
                </p>
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
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', lineHeight: '1.7', marginBottom: '1rem' }}>
            <strong style={{ color: '#9ca3af' }}>KROG™ Framework:</strong> The mathematical notation, operators, and classification system used by KROG Games are proprietary intellectual property. Research collaborations provide access to annotated datasets while protecting the underlying formalization system.
          </p>
          <p style={{ color: '#4b5563', fontSize: '0.8rem' }}>
            © {new Date().getFullYear()} KROG Games
          </p>
        </div>
      </footer>
    </div>
  );
}
