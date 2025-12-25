import React, { useState, useEffect } from 'react';

type Language = 'en' | 'no';

// Hook to detect mobile screen
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

interface FAQItem {
  question: { en: string; no: string };
  answer: { en: string; no: string };
}

interface FAQCategory {
  title: { en: string; no: string };
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    title: { en: 'General Questions', no: 'Generelle spørsmål' },
    items: [
      {
        question: {
          en: 'What is KROG Chess?',
          no: 'Hva er KROG Sjakk?'
        },
        answer: {
          en: 'KROG Chess is the world\'s first chess platform where every move is validated using formal mathematical logic. When you play chess on KROG, you don\'t just see that a move is legal—you see WHY it is legal, expressed as a mathematical formula with operators, conditions, and FIDE rule references.',
          no: 'KROG Sjakk er verdens første sjakkplattform der hvert trekk valideres ved hjelp av formell matematisk logikk. Når du spiller sjakk på KROG, ser du ikke bare at et trekk er lovlig—du ser HVORFOR det er lovlig, uttrykt som en matematisk formel med operatorer, betingelser og FIDE-regelreferanser.'
        }
      },
      {
        question: {
          en: 'How is KROG Chess different from Lichess or Chess.com?',
          no: 'Hvordan er KROG Sjakk forskjellig fra Lichess eller Chess.com?'
        },
        answer: {
          en: 'KROG Chess differs in four fundamental ways: (1) Mathematical validation—every move is explained using formal logic operators, (2) Educational focus—teaches formal logic through gameplay, (3) Accessibility—comprehensive voice interface for blind players, (4) Research platform—provides annotated games for AI training.',
          no: 'KROG Sjakk skiller seg på fire grunnleggende måter: (1) Matematisk validering—hvert trekk forklares med formelle logikkoperatorer, (2) Utdanningsfokus—lærer formell logikk gjennom spilling, (3) Tilgjengelighet—omfattende stemmegrensesnitt for blinde spillere, (4) Forskningsplattform—gir annoterte partier for AI-trening.'
        }
      },
      {
        question: {
          en: 'What does KROG stand for?',
          no: 'Hva står KROG for?'
        },
        answer: {
          en: 'KROG stands for Knowledge, Rights, Obligations, Governance. These are the four fundamental components of any rule system. Knowledge = what you can know. Rights = what you are permitted to do. Obligations = what you must do. Governance = how the game is decided.',
          no: 'KROG står for Knowledge (Kunnskap), Rights (Rettigheter), Obligations (Forpliktelser), Governance (Styring). Dette er de fire grunnleggende komponentene i ethvert regelsystem.'
        }
      },
      {
        question: {
          en: 'Is KROG Chess free?',
          no: 'Er KROG Sjakk gratis?'
        },
        answer: {
          en: 'Yes! KROG Chess is free to play forever. You can play unlimited games, solve puzzles, view KROG explanations, and share positions. The core platform with KROG explanations remains free. Always.',
          no: 'Ja! KROG Sjakk er gratis å spille for alltid. Du kan spille ubegrensede partier, løse oppgaver, se KROG-forklaringer og dele posisjoner. Kjerneplattformen med KROG-forklaringer forblir gratis. Alltid.'
        }
      }
    ]
  },
  {
    title: { en: 'Technical Questions', no: 'Tekniske spørsmål' },
    items: [
      {
        question: {
          en: 'What are KROG operators?',
          no: 'Hva er KROG-operatorer?'
        },
        answer: {
          en: 'KROG operators are mathematical symbols that describe chess rules formally. There are 36 operators: 9 core operators (P, O, F, C, L, W, B, I, D), 8 piece logic operators (PM, PC, PA, NV, PD, CR, EP, PO), 8 board logic operators, 6 notation operators, and 5 temporal operators.',
          no: 'KROG-operatorer er matematiske symboler som beskriver sjakkregler formelt. Det er 36 operatorer: 9 kjerneoperatorer (P, O, F, C, L, W, B, I, D), 8 brikkelogikkoperatorer (PM, PC, PA, NV, PD, CR, EP, PO), 8 brettlogikkoperatorer, 6 notasjonsoperatorer og 5 temporale operatorer.'
        }
      },
      {
        question: {
          en: 'What are R-types?',
          no: 'Hva er R-typer?'
        },
        answer: {
          en: 'R-types are rule classification types. There are 15 R-types in KROG describing different relationships: R1 (Asymmetric), R2 (Intransitive), R3 (Path-dependent), R4 (Capture-only), R5 (Non-capture), R6 (First move special), R7 (Temporal window), R8 (Mandatory transformation), R9 (Compound move), R10 (Conditional), R11 (Discrete jump), R12 (State-dependent), R13 (Terminal), R14 (Repetition), R15 (Counter-based).',
          no: 'R-typer er regelklassifikasjonstyper. Det er 15 R-typer i KROG som beskriver forskjellige relasjoner: R1 (Asymmetrisk), R2 (Intransitiv), R3 (Baneavhengig), R4 (Kun fangst), R5 (Ikke-fangst), R6 (Første trekk spesiell), R7 (Temporalt vindu), R8 (Obligatorisk transformasjon), R9 (Sammensatt trekk), R10 (Betinget), R11 (Diskret hopp), R12 (Tilstandsavhengig), R13 (Terminal), R14 (Repetisjon), R15 (Tellerbasert).'
        }
      },
      {
        question: {
          en: 'What are T-types?',
          no: 'Hva er T-typer?'
        },
        answer: {
          en: 'T-types classify moves by temporal modality: T1 = Player discretion (normal moves you choose to make), T2 = Conditional (special moves like castling that require conditions), T3 = Mandatory (forced moves like escaping check).',
          no: 'T-typer klassifiserer trekk etter temporal modalitet: T1 = Spillerdiskresjon (normale trekk du velger å gjøre), T2 = Betinget (spesielle trekk som rokade som krever betingelser), T3 = Obligatorisk (tvungne trekk som å komme ut av sjakk).'
        }
      },
      {
        question: {
          en: 'How does KROG validate moves?',
          no: 'Hvordan validerer KROG trekk?'
        },
        answer: {
          en: 'When you make a move, KROG: (1) Parses the move notation, (2) Identifies the piece and squares involved, (3) Applies relevant operators (PM, PC, PA, CR, EP, etc.), (4) Evaluates all conditions, (5) Generates the KROG formula, (6) Maps to FIDE article, (7) Produces bilingual explanation.',
          no: 'Når du gjør et trekk, gjør KROG: (1) Parser trekknotasjonen, (2) Identifiserer brikken og rutene involvert, (3) Bruker relevante operatorer (PM, PC, PA, CR, EP, etc.), (4) Evaluerer alle betingelser, (5) Genererer KROG-formelen, (6) Mapper til FIDE-artikkel, (7) Produserer tospråklig forklaring.'
        }
      }
    ]
  },
  {
    title: { en: 'Features', no: 'Funksjoner' },
    items: [
      {
        question: {
          en: 'What chess variants are supported?',
          no: 'Hvilke sjakkvarianter støttes?'
        },
        answer: {
          en: 'KROG Chess supports: Standard Chess, Chess960 (Fischer Random with 960 starting positions), Three-Check (win by giving 3 checks), and King of the Hill (win by reaching the center squares d4/d5/e4/e5).',
          no: 'KROG Sjakk støtter: Standard Sjakk, Chess960 (Fischer Random med 960 startposisjoner), Tre-sjakk (vinn ved å gi 3 sjakker), og King of the Hill (vinn ved å nå sentrumsfeltene d4/d5/e4/e5).'
        }
      },
      {
        question: {
          en: 'Can I play against the computer?',
          no: 'Kan jeg spille mot datamaskinen?'
        },
        answer: {
          en: 'Yes! KROG Chess has a built-in AI opponent with three difficulty levels: Beginner, Intermediate, and Advanced. The AI uses minimax with alpha-beta pruning and evaluates positions using material balance, piece-square tables, and strategic factors.',
          no: 'Ja! KROG Sjakk har en innebygd AI-motstander med tre vanskelighetsgrader: Nybegynner, Mellomnivå og Avansert. AI-en bruker minimax med alpha-beta-beskjæring og evaluerer posisjoner ved hjelp av materiellbalanse, brikke-rute-tabeller og strategiske faktorer.'
        }
      },
      {
        question: {
          en: 'What is Learn Mode?',
          no: 'Hva er Læringsmodus?'
        },
        answer: {
          en: 'Learn Mode shows KROG explanations for every legal move when you hover over pieces. It\'s perfect for understanding why moves are legal and learning the formal logic behind chess rules.',
          no: 'Læringsmodus viser KROG-forklaringer for hvert lovlige trekk når du holder musepekeren over brikker. Det er perfekt for å forstå hvorfor trekk er lovlige og lære den formelle logikken bak sjakkregler.'
        }
      },
      {
        question: {
          en: 'How do clubs work?',
          no: 'Hvordan fungerer klubber?'
        },
        answer: {
          en: 'Create or join clubs to play with friends. Clubs have member management, club chat, and can host private tournaments and leagues. Club owners can set clubs as public or private.',
          no: 'Opprett eller bli med i klubber for å spille med venner. Klubber har medlemshåndtering, klubbchat, og kan arrangere private turneringer og ligaer. Klubbeiere kan sette klubber som offentlige eller private.'
        }
      }
    ]
  },
  {
    title: { en: 'Education', no: 'Utdanning' },
    items: [
      {
        question: {
          en: 'Can KROG Chess be used in schools?',
          no: 'Kan KROG Sjakk brukes i skoler?'
        },
        answer: {
          en: 'Absolutely! KROG Chess is designed for education. Students learn formal logic through chess—understanding modal operators, set theory, and mathematical proofs. Teachers get curriculum-compatible tools and progress tracking.',
          no: 'Absolutt! KROG Sjakk er designet for utdanning. Elever lærer formell logikk gjennom sjakk—forstår modale operatorer, mengdelære og matematiske bevis. Lærere får læreplankompatible verktøy og fremdriftssporing.'
        }
      },
      {
        question: {
          en: 'What are the puzzle and lesson features?',
          no: 'Hva er oppgave- og leksjonsfunksjonene?'
        },
        answer: {
          en: 'KROG Chess includes 30+ tactical puzzles with KROG explanations, 62+ openings in the explorer, and 20+ interactive lessons across beginner, intermediate, and advanced levels. Each lesson includes quizzes with progress tracking.',
          no: 'KROG Sjakk inkluderer 30+ taktiske oppgaver med KROG-forklaringer, 62+ åpninger i utforskeren, og 20+ interaktive leksjoner på nybegynner-, mellom- og avansert nivå. Hver leksjon inkluderer quizer med fremdriftssporing.'
        }
      }
    ]
  },
  {
    title: { en: 'Account & Social', no: 'Konto og sosialt' },
    items: [
      {
        question: {
          en: 'How does the rating system work?',
          no: 'Hvordan fungerer ratingsystemet?'
        },
        answer: {
          en: 'KROG Chess uses the ELO rating system with K-factor 32. All players start at 1200. Your rating changes based on game results and opponent strength. Higher rated opponents give more points for wins.',
          no: 'KROG Sjakk bruker ELO-ratingsystemet med K-faktor 32. Alle spillere starter på 1200. Ratingen din endres basert på partiresultater og motstanderstyrke. Høyere ratede motstandere gir flere poeng for seire.'
        }
      },
      {
        question: {
          en: 'How do I add friends?',
          no: 'Hvordan legger jeg til venner?'
        },
        answer: {
          en: 'Use the Friends panel to search for users by username. Send a friend request and wait for them to accept. Once connected, you can see their online status, challenge them to games, and chat during matches.',
          no: 'Bruk Venner-panelet for å søke etter brukere med brukernavn. Send en venneforespørsel og vent på at de godtar. Når dere er koblet sammen, kan du se deres online-status, utfordre dem til partier og chatte under kamper.'
        }
      },
      {
        question: {
          en: 'What are tournaments and leagues?',
          no: 'Hva er turneringer og ligaer?'
        },
        answer: {
          en: 'Tournaments support Swiss and Round-Robin formats with automatic pairing. Leagues have divisions with promotion/relegation, configurable points, and season support. Both can be club-specific or open to all.',
          no: 'Turneringer støtter Swiss- og Round-Robin-formater med automatisk paring. Ligaer har divisjoner med opprykk/nedrykk, konfigurerbare poeng og sesongstøtte. Begge kan være klubbspesifikke eller åpne for alle.'
        }
      }
    ]
  },
  {
    title: { en: 'KROG Leaderboard', no: 'KROG-ledertavle' },
    items: [
      {
        question: {
          en: 'How do I earn points on the KROG Leaderboard?',
          no: 'Hvordan tjener jeg poeng på KROG-ledertavlen?'
        },
        answer: {
          en: 'View KROG explanations to earn points. Each explanation viewed earns you 1 point. Sharing explanations earns you 2 points. Learn all 15 R-types to unlock the KROG Master badge!',
          no: 'Se KROG-forklaringer for å tjene poeng. Hver forklaring du ser gir deg 1 poeng. Deling av forklaringer gir deg 2 poeng. Lær alle 15 R-typer for å låse opp KROG-mester-merket!'
        }
      },
      {
        question: {
          en: 'What badges can I earn?',
          no: 'Hvilke merker kan jeg tjene?'
        },
        answer: {
          en: 'Badges include: KROG Novice (10 views), KROG Learner (50 views), KROG Expert (200 views), KROG Master (all 15 R-types), KROG Educator (50 shares), and KROG Ambassador (200 shares).',
          no: 'Merker inkluderer: KROG-nybegynner (10 visninger), KROG-lærling (50 visninger), KROG-ekspert (200 visninger), KROG-mester (alle 15 R-typer), KROG-pedagog (50 delinger), og KROG-ambassadør (200 delinger).'
        }
      }
    ]
  }
];

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const FAQModal: React.FC<FAQModalProps> = ({ isOpen, onClose, language }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set([0]));
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  if (!isOpen) return null;

  const toggleCategory = (index: number) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: isMobile ? 'flex-end' : 'center',
        zIndex: 1000,
        padding: isMobile ? '0' : '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-secondary, #1a1a1a)',
          borderRadius: isMobile ? '16px 16px 0 0' : '16px',
          maxWidth: isMobile ? '100%' : '700px',
          width: '100%',
          maxHeight: isMobile ? '90vh' : '85vh',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: isMobile ? '16px' : '20px 24px',
            borderBottom: '1px solid #333',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
          }}
        >
          <h2 style={{
            margin: 0,
            fontSize: isMobile ? '1.1rem' : '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '10px'
          }}>
            <span style={{ fontSize: isMobile ? '1.4rem' : '1.8rem' }}>{'\u2753'}</span>
            {language === 'en' ? (isMobile ? 'FAQ' : 'Frequently Asked Questions') : (isMobile ? 'FAQ' : 'Ofte stilte spørsmål')}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              fontSize: isMobile ? '1.3rem' : '1.5rem',
              cursor: 'pointer',
              padding: isMobile ? '8px' : '5px',
              lineHeight: 1,
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {'\u2715'}
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: isMobile ? '12px' : '16px 24px',
            overflowY: 'auto',
            flex: 1,
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {faqData.map((category, catIndex) => (
            <div key={catIndex} style={{ marginBottom: '12px' }}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(catIndex)}
                style={{
                  width: '100%',
                  background: expandedCategories.has(catIndex)
                    ? 'linear-gradient(135deg, #81b64c 0%, #5d8c3a 100%)'
                    : '#2d2d2d',
                  border: 'none',
                  color: 'white',
                  padding: isMobile ? '12px 14px' : '14px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: isMobile ? '0.95rem' : '1.1rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  minHeight: '44px'
                }}
              >
                <span>{category.title[language]}</span>
                <span style={{
                  transform: expandedCategories.has(catIndex) ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}>
                  {'\u25BC'}
                </span>
              </button>

              {/* Category Items */}
              {expandedCategories.has(catIndex) && (
                <div style={{ marginTop: '8px', paddingLeft: isMobile ? '4px' : '8px' }}>
                  {category.items.map((item, itemIndex) => {
                    const itemKey = `${catIndex}-${itemIndex}`;
                    const isExpanded = expandedItems.has(itemKey);

                    return (
                      <div
                        key={itemIndex}
                        style={{
                          marginBottom: '6px',
                          background: '#252525',
                          borderRadius: '6px',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Question */}
                        <button
                          onClick={() => toggleItem(catIndex, itemIndex)}
                          style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: isExpanded ? '#81b64c' : '#ddd',
                            padding: isMobile ? '12px' : '12px 14px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            fontSize: isMobile ? '0.9rem' : '0.95rem',
                            fontWeight: 500,
                            textAlign: 'left',
                            gap: isMobile ? '8px' : '12px',
                            minHeight: '44px'
                          }}
                        >
                          <span style={{ flex: 1 }}>{item.question[language]}</span>
                          <span style={{
                            flexShrink: 0,
                            transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                            fontSize: isMobile ? '1.1rem' : '1.2rem',
                            marginTop: '2px'
                          }}>
                            +
                          </span>
                        </button>

                        {/* Answer */}
                        {isExpanded && (
                          <div
                            style={{
                              padding: isMobile ? '0 12px 12px 12px' : '0 14px 14px 14px',
                              color: '#aaa',
                              fontSize: isMobile ? '0.85rem' : '0.9rem',
                              lineHeight: 1.6,
                              borderTop: '1px solid #333'
                            }}
                          >
                            <p style={{ margin: '12px 0 0 0' }}>
                              {item.answer[language]}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: isMobile ? '14px 16px' : '16px 24px',
            borderTop: '1px solid #333',
            background: '#1a1a1a',
            textAlign: 'center',
            color: '#666',
            fontSize: isMobile ? '0.8rem' : '0.85rem'
          }}
        >
          {language === 'en'
            ? 'Have more questions? Contact us at support@krogchess.com'
            : 'Har du flere spørsmål? Kontakt oss på support@krogchess.com'}
        </div>
      </div>
    </div>
  );
};

export default FAQModal;
