# **KROG CHESS FAQ DOCUMENT**

**Document Type:** Comprehensive Frequently Asked Questions
**Purpose:** Answer common questions to reduce repetitive inquiries and educate users, partners, and press
**Target Audience:** Everyone - users, teachers, investors, journalists, developers
**Format:** Markdown file for web and PDF export

---

## **GENERAL QUESTIONS**

**What is KROG Chess?**

KROG Chess is the world's first chess platform where every move is validated using formal mathematical logic. When you play chess on KROG, you don't just see that a move is legal. You see WHY it is legal, expressed as a mathematical formula with operators, conditions, and FIDE rule references in Norwegian and English.

Think of it as chess with complete transparency. Every move comes with a proof.

---

**How is KROG Chess different from Lichess or Chess.com?**

Lichess and Chess.com are excellent platforms for playing chess. They have millions of users and extensive features. KROG Chess is different in four fundamental ways.

First, mathematical validation. Every move on KROG Chess is explained using formal logic operators. When you castle, you see the formula CR(kingside) equals king not moved AND rook not moved AND not in check AND path clear AND squares safe. No other platform does this.

Second, educational focus. KROG Chess teaches the mathematics behind chess. Students learn formal logic, set theory, and modal operators through gameplay. Teachers get curriculum-compatible tools. This makes KROG ideal for schools.

Third, accessibility leadership. KROG Chess will have comprehensive voice interface where blind players hear mathematical explanations. You speak your move, KROG validates it with formal logic, and speaks back the explanation. No other platform offers voice plus mathematics.

Fourth, research platform. KROG provides one million chess games annotated with formal operators. Researchers get AI training data with mathematical verification. This opens new research possibilities in game theory and artificial intelligence.

We do not compete with Lichess or Chess.com on volume. We compete on educational value, accessibility, and mathematical rigor.

---

**What does KROG stand for?**

KROG stands for Knowledge, Rights, Obligations, Governance. These are the four fundamental components of any rule system.

Knowledge: What you can know about the game state. In chess, this means knowing where pieces are, whose turn it is, and move history.

Rights: What you are permitted to do. In chess, this means which moves are legal based on piece movement rules.

Obligations: What you must do. In chess, this means you must move out of check if you are in check. You cannot voluntarily put your king in check.

Governance: How the game is decided. In chess, this means checkmate ends the game. Stalemate is a draw. Threefold repetition allows draw claims.

KROG is a universal framework developed over 30 years of research. It applies to contract law, physics, game mechanics, AI authorization, and business workflows. Chess is one application that proves KROG works for complex formal rule systems.

---

**Who created KROG Chess?**

KROG Chess was created by Georg Philip Krog, a Norwegian legal ontologist who spent 30 years developing the KROG universal rule framework.

Georg has credentials from Harvard Law, Stanford Law, and University of Oslo. He published in Nature in 2024 and won Best Paper Award at the ENISA Privacy Forum. He contributes to W3C Data Privacy Vocabulary standards.

Georg is uniquely positioned as one of the few legal ontologists in the world working on formal rule systems. KROG Chess applies his life's work in mathematical logic to the game of chess, proving that rules across all domains are mathematically isomorphic.

---

**Is KROG Chess free?**

Yes. KROG Chess is free to play forever. You can play unlimited games, solve the daily puzzle, view KROG explanations, and share positions on social media. There are no ads in the free version.

We also offer a Patron tier at 10 euros per month for supporters who want ad-free experience and cosmetic perks. Educational institutions can license KROG Chess for classroom use at 500 euros per school per year. Strategic applications like tournament KROG Judge have custom pricing.

But the core chess platform with KROG explanations remains free. Always.

---

## **TECHNICAL QUESTIONS**

**What are KROG operators?**

KROG operators are mathematical symbols that describe chess rules formally. There are 36 operators used in KROG Chess.

Examples include PM for Piece Movement Permission, PC for Path Clear, PA for Path Attack-free, CR for Castling Rights, EP for En Passant, GT for Game Termination, and CS for Check State.

When you make a move, KROG combines these operators into a formula. For example, moving a rook from a1 to a8 generates the formula PM(rook,a1,a8) which equals straight(a1,a8) AND PC(a1,a8). This means the rook can move because the path is straight and clear.

Operators are grouped into categories:
- **Core operators (9):** P, O, F, C, L, W, B, I, D - handle permissions and obligations
- **Piece logic operators (8):** PM, PC, PA, NV, PD, CR, EP, PO - handle how pieces move
- **Board logic operators (8):** PV, MH, CS, LMG, GT, TC, PR, FMC - handle spatial relationships
- **Notation operators (6):** PSA, PLA, PUCI, PVN, GN, NC - translate between notation formats
- **Temporal operators (5):** G, F, X, U, R - handle move sequencing and time

You do not need to memorize operators to use KROG Chess. The platform shows you the formulas and explains them in plain language. But if you want to learn formal logic, KROG operators provide a complete mathematical foundation.

---

**What are R-types?**

R-types are rule classification types. There are 15 R-types in KROG that describe different kinds of relationships between entities.

| R-Type | Description | Example |
|--------|-------------|---------|
| R1 | Asymmetric movement | Pawn direction |
| R2 | Intransitive | King cannot be captured |
| R3 | Path-dependent | Sliding pieces (Q/R/B) |
| R4 | Capture-only | Pawn diagonal capture |
| R5 | Non-capture | Pawn forward move |
| R6 | First move special | Pawn double push |
| R7 | Temporal window | En passant |
| R8 | Mandatory transformation | Pawn promotion |
| R9 | Compound move | Castling |
| R10 | Conditional | Check response |
| R11 | Discrete jump | Knight movement |
| R12 | State-dependent | Castling rights |
| R13 | Terminal state | Checkmate/stalemate |
| R14 | Repetition | Threefold repetition |
| R15 | Counter-based | 50-move rule |

Every chess move is classified by its R-type. This helps you understand not just what the move is, but what category of rule pattern it represents. R-types are universal across domains. The same R-type that describes castling in chess also describes contract formation in law and phase transitions in physics.

Learning R-types helps you see the deep mathematical structure underlying chess. When you master all 15 R-types, you understand the complete taxonomy of rule patterns.

---

**What are T-types?**

T-types are agent state types. There are 3 T-types in KROG Chess that describe different states an agent can be in.

- **T1:** Player discretion - normal moves where you choose what to play
- **T2:** Conditional - special moves like castling and en passant with specific requirements
- **T3:** Mandatory - obligated actions where you must get out of check

T-types work together with operators and R-types to provide complete mathematical description of game state. They answer the question: what kind of action is this agent performing?

Most chess players do not need to think about T-types explicitly. But they provide the formal foundation for KROG validation logic.

---

**How does KROG validate moves?**

KROG validation happens in real-time using deterministic logic, not neural networks. When you attempt a move, the KROG engine checks multiple conditions in sequence.

First, piece movement rules. Can this piece physically make this move according to its movement pattern? A bishop can only move diagonally. A rook can only move straight. This uses the PM operator.

Second, path validation. Is the path clear? This uses the PC operator. Is the path attack-free for castling? This uses the PA operator.

Third, capture rules. If capturing, is there an enemy piece on the target square? This uses capture logic.

Fourth, special moves. Is this castling, en passant, or promotion? Each has specific validation using CR, EP, and promotion operators.

Fifth, check state. Does this move leave your king in check? If yes, the move is forbidden using T4 forbidden state.

If all conditions pass, the move is legal. KROG generates a formula showing which operators were satisfied. This formula becomes the mathematical proof of legality. The proof is cryptographically signed for tournament use.

Validation takes 1 to 5 milliseconds depending on move complexity. Simple pawn moves are instant. Castling takes longer because it validates five conditions. But all validation is deterministic and provable.

---

**Can I use KROG Chess on mobile?**

Currently KROG Chess is optimized for desktop browsers. The interface is built with React and works on Chrome, Firefox, Safari, and Edge.

Mobile responsive design is in development. You can access KROG Chess on mobile browsers today, but the experience is not yet optimized for small screens.

Native mobile apps for iOS and Android are planned for 2026. Until then, we recommend using KROG Chess on desktop or tablet for the best experience.

---

**Does KROG Chess work offline?**

No. KROG Chess requires internet connection because it uses WebSocket for real-time multiplayer and server-side KROG validation.

However, the daily puzzle can be cached for offline solving. Offline mode with local KROG validation is planned for future releases, but it requires significant engineering to move the validation engine to the client.

For now, you need internet to play.

---

## **FEATURE QUESTIONS**

**What is the Daily Puzzle?**

The Daily Puzzle is a chess puzzle that resets at midnight UTC every day. Everyone worldwide sees the same puzzle. When you solve it, KROG shows you the complete mathematical explanation of the solution, including formula, operators, R-types, and bilingual FIDE rules.

Daily Puzzles include streak tracking. If you solve puzzles on consecutive days, your streak increases. Miss a day and it resets. The longest streak and total puzzles solved are displayed on leaderboards.

You can share your Daily Puzzle result on social media. KROG generates a Wordle-style emoji grid showing whether you solved it. This drives viral growth.

The Daily Puzzle is designed for daily engagement. It takes most players 1 to 3 minutes to solve. The difficulty adjusts algorithmically based on puzzle database ratings.

---

**What is the Explain This Move button?**

The Explain This Move button appears next to every move in your game history. Click the small info icon and a modal pops up showing the complete KROG explanation.

The explanation includes:
- KROG formula in green monospace font
- Operator and T-type identification
- R-type classification with description
- Bilingual explanations in English and Norwegian
- Condition badges showing which requirements were met
- FIDE rule references in blue
- Share button to copy the explanation to clipboard

This feature turns every game into educational content. After you finish a game, you can review any move and see its mathematical foundation. Share interesting positions on Twitter, Discord, or chess forums. Each explanation includes the KROG Chess branding, so shared content drives awareness.

Teachers use this feature to show students why moves are legal. Researchers use it to understand the formal structure of positions. Players use it to learn operators and improve their understanding of chess rules.

---

**What is the KROG Formula Leaderboard?**

The KROG Formula Leaderboard gamifies learning KROG operators. It has three tabs: Views, Shares, and R-Types Learned.

The Views leaderboard ranks players by how many KROG explanations they have viewed. This rewards curiosity and learning.

The Shares leaderboard ranks players by how many explanations they have shared on social media. This rewards users who spread KROG Chess virally.

The R-Types Learned leaderboard ranks players by how many of the 15 R-types they have encountered in their games. Mastering all 15 R-types earns you the KROG Master badge.

There are six badge tiers:
- **KROG Novice** (10 views)
- **KROG Learner** (50 views)
- **KROG Expert** (200 views)
- **KROG Master** (15/15 R-types)
- **KROG Educator** (50 shares)
- **KROG Ambassador** (200 shares)

The leaderboard creates friendly competition around learning. It makes KROG knowledge valuable. Players compete to become the top KROG expert in their community.

---

**Can I play against the computer?**

Yes. KROG Chess has a Play vs Computer mode where you play against a chess engine. The computer opponent has three adjustable difficulty levels: Beginner, Intermediate, and Advanced.

What makes KROG's computer play unique is that the AI's moves also come with KROG explanations. After the computer makes a move, you can click Explain This Move to see why the AI chose that position using formal logic. This helps you learn from the computer's strategy.

The computer uses minimax with alpha-beta pruning for move generation, but KROG validates every move and provides explanations. This combines strong play with educational transparency.

---

**What game modes does KROG Chess support?**

KROG Chess currently supports several game modes:

- **Standard chess:** Classic 8x8 board, standard FIDE rules. Time controls include bullet (1+0), blitz (3+2), rapid (10+0), and untimed.

- **Chess960:** Random starting position with castling rules adapted. Also called Fischer Random Chess. KROG validates the modified castling rules.

- **Three-Check:** Win by giving check three times. KROG tracks check count.

- **King of the Hill:** Win by getting your king to the center four squares (d4/d5/e4/e5). KROG validates center control win condition.

- **Daily Puzzle:** One puzzle per day with KROG explanations.

- **Tournaments:** Swiss pairing and round-robin formats.

- **Leagues:** Divisional play with promotion and relegation.

More variants are planned. KROG's universal framework makes it easy to add new game modes because we just define new operators and R-types.

---

## **EDUCATIONAL QUESTIONS**

**How can teachers use KROG Chess in the classroom?**

Teachers can use KROG Chess to teach both chess and mathematics simultaneously.

For chess instruction, KROG provides visual explanations of why moves are legal. Students do not just memorize rules. They see the logical structure. When a student asks why castling is legal, the teacher shows the CR formula with five conditions. This deepens understanding.

For mathematics instruction, KROG teaches formal logic, set theory, Boolean algebra, and modal operators through chess. Students learn AND, OR, NOT operators. They learn conditional statements. They learn quantifiers and implications. These are fundamental mathematical concepts, taught through an engaging game.

Teachers can assign homework like:
- "Solve today's Daily Puzzle and explain the R-type"
- "Play a game and share three KROG formulas"
- "Earn the KROG Learner badge by viewing 50 explanations"

The Educational tier at 500 euros per school per year provides classroom management tools, student progress dashboards, KROG curriculum integration guides, and teacher training materials.

KROG Chess aligns with STEM education goals. It makes abstract mathematics concrete and playful.

---

**What age group is KROG Chess appropriate for?**

KROG Chess works for ages 10 and up. Younger children can play chess on KROG, but the formal logic explanations are more suited for students who have basic algebra understanding.

For ages 10 to 14, focus on operators and simple formulas. Students learn PM for piece movement and PC for path clear. They see why their moves work without diving deep into R-types.

For ages 15 to 18, introduce R-types and modal operators. High school students can understand the complete KROG framework. They can write their own formulas and prove positions legal.

For university and adult learners, KROG provides rigorous formal logic training. Computer science students, mathematics students, and logic enthusiasts appreciate the mathematical depth.

Teachers can adjust KROG complexity to match student level. The platform supports progressive disclosure: beginners see simple explanations, advanced users see complete formulas.

---

**Does KROG Chess provide certification?**

Yes. KROG Chess will offer certification for KROG operator mastery. Students who demonstrate understanding of all 36 operators and 15 R-types earn a KROG Chess Certified credential.

Certification involves passing a test where you:
- Explain positions using KROG formulas
- Identify R-types correctly
- Write validation logic for moves
- Prove positions legal using operators

This certification is valuable for students applying to STEM programs. It demonstrates formal logic competency and mathematical reasoning skills.

Teachers can also earn KROG Educator certification, showing they can teach chess using the KROG framework.

Certification launches in 2026.

---

## **ACCESSIBILITY QUESTIONS**

**How does KROG Chess support blind players?**

KROG Chess is designed from the ground up for accessibility. While full voice integration is still in development, the platform already has comprehensive screen reader support.

The current implementation includes:
- Keyboard-only navigation
- ARIA labels on all interactive elements
- Board state announced by screen readers
- Move history readable aloud
- KROG formulas in accessible text format

The planned voice interface will allow blind players to:
- Speak moves like "queen to e4"
- Hear KROG validate the move with formula spoken aloud
- Hear bilingual FIDE rule explanations
- Ask "why is this move legal" at any time
- Receive complete audio game experience

This makes KROG Chess the first platform where blind players hear not just what moves are legal, but WHY they are legal using mathematical explanations. Current platforms offer basic audio, but KROG adds formal logic narration.

There are approximately 285,000 blind chess players worldwide. KROG Chess aims to serve this underserved community with the most comprehensive accessibility features in chess.

---

**What languages does KROG Chess support?**

Currently KROG Chess is fully bilingual in Norwegian and English. All KROG formulas, FIDE rule references, and explanations appear in both languages. Users toggle between languages with one click.

Norwegian was chosen because Georg Philip Krog is Norwegian and Norway has strong chess tradition. Norwegian FIDE rules are official and KROG validates against them.

English was chosen for global reach. English is the international language of chess.

Additional languages are planned. The architecture supports internationalization. Community translations will add French, German, Spanish, Russian, Chinese, and other major chess languages.

KROG formulas use mathematical notation which is language-neutral. The operators P, O, F are universal. Only the explanatory text requires translation.

---

## **RESEARCH QUESTIONS**

**Can researchers use KROG Chess data?**

Yes. KROG Chess provides research API access for academic institutions. Researchers can query the KROG-annotated game database.

The database contains chess games where every move is tagged with operators, R-types, formulas, FIDE rules, and validation proofs. This is the only dataset of its kind in the world.

Research use cases include:
- AI training with formally verified data
- Game theory analysis using R-type patterns
- Chess strategy research with mathematical foundations
- Educational research on teaching logic through games
- Accessibility research on voice plus mathematics interfaces

Research API access is free for academic papers that cite KROG Chess. Commercial use requires licensing.

We encourage researchers to publish papers using KROG data. Each publication increases KROG's credibility and academic footprint.

---

**How does KROG Chess relate to KROG universal framework?**

KROG Chess is an application of the KROG universal framework, which is a 30-year research project by Georg Philip Krog on mathematical rule systems.

The KROG framework applies to contract law, physics, chemistry, economics, game mechanics, AI authorization, business workflows, and any domain with formal rules. Chess is one specific application that proves KROG works for complex systems.

Everything in chess is expressed using the same T-types, R-types, and modal operators that apply to contracts and physics. This demonstrates that rules across all domains are mathematically isomorphic.

KROG Chess serves as proof of concept. If KROG can handle chess with complete accuracy, it can handle any game. Future plans include KROG Shogi, KROG Poker, and KROG for business strategy games.

The long-term vision is KROG as the universal language for game rules, enabling AI agents to play, negotiate, and strategize using formal logic.

---

**Are there academic papers about KROG Chess?**

Not yet, but academic papers are planned for 2025.

Potential papers include:
- "KROG: A Universal Framework for Chess Rule Validation"
- "Formal Verification of Chess Using Modal Logic"
- "From Chess to Strategy: Using KROG for Multi-Game AI Training"
- "Teaching Formal Logic Through KROG Chess"
- "Accessibility in Chess: Voice plus Mathematical Explanations"

Researchers interested in collaborating should contact Georg at georg@signatu.com.

KROG Chess generates novel research questions at the intersection of game theory, formal methods, AI, education, and accessibility.

---

## **BUSINESS QUESTIONS**

**How does KROG Chess make money?**

KROG Chess uses a freemium model with four revenue streams.

**Free tier** for viral growth provides unlimited chess play, daily puzzle, KROG explanations, and social sharing at zero cost. This builds user base.

**Patron tier** at 10 euros per month for supporters who want ad-free experience and supporter badges. This is cosmetic only. No gameplay advantage. Provides recurring revenue from enthusiasts.

**Educational tier** at 500 euros per school per year provides classroom tools, student tracking, teacher dashboards, and curriculum integration. This targets schools globally that teach chess. Provides B2B revenue.

**Strategic tier** with custom pricing provides KROG Judge for tournaments, federation partnerships, research API licensing, and government contracts for military strategy applications. Provides high-value B2B revenue.

---

**Is KROG Chess open source?**

The KROG operators and R-type framework are published and open. Anyone can study them. The mathematical foundations are transparent.

However, the KROG Chess platform code is proprietary. This protects the 30 years of research investment and enables commercial business model.

Developers can access KROG validation through API. Building with KROG becomes a developer platform play. But the core implementation remains closed source.

This is similar to how Google publishes research papers but keeps search algorithm proprietary. The science is open. The product is protected.

---

**Who are KROG Chess competitors?**

Direct competitors for chess platform are Lichess and Chess.com. They have massive user bases and comprehensive features. We do not compete on volume or feature parity.

Indirect competitors include educational chess tools like ChessKid, accessibility tools for blind players, and research platforms providing chess data. None offer mathematical validation.

Strategic differentiation is KROG's mathematical foundation. No competitor can replicate 30 years of formal logic research. This creates an unforkable moat.

We compete on unique value, not feature count. KROG Chess is the only platform with:
- Mathematical explanations
- Comprehensive accessibility through voice plus math
- Formally verified research data
- Universal game rule framework

Long-term, KROG Chess is not just a chess platform. It is proof that KROG works for games, positioning for expansion into other games and strategic applications.

---

## **PARTNERSHIP QUESTIONS**

**How can chess federations partner with KROG Chess?**

Chess federations can integrate KROG Chess for official tournaments, educational programs, and dispute resolution.

For tournaments, KROG Judge provides cryptographic rulings on disputed moves. When a player claims a move is illegal, KROG Judge analyzes the position, generates a formula, validates against FIDE rules, and produces a signed proof. This eliminates human arbiter error.

For education, federations can license KROG Chess for youth programs. The mathematical foundation aligns with STEM education goals. KROG provides curriculum materials and teacher training.

For governance, federations benefit from KROG's bilingual FIDE rule encoding. Rules are formalized, disambiguated, and verifiable. This improves rule clarity and international consistency.

Partnership terms are flexible. Contact georg@signatu.com to discuss federation collaboration.

---

**Can schools get KROG Chess for free?**

Schools in underserved communities can apply for free Educational tier licenses. We want KROG Chess accessible regardless of budget.

The application process evaluates school size, location, student demographics, and educational need. Approved schools receive full Educational tier features at no cost.

For schools that can afford it, the 500 euros per year fee supports platform development and free access for others. This creates a sustainable model where paying schools subsidize access for underserved schools.

We believe mathematics education should be universal. KROG Chess is a tool for equity.

---

## **TECHNICAL DEVELOPMENT QUESTIONS**

**What technology stack does KROG Chess use?**

KROG Chess is built with modern web technologies.

**Frontend:**
- React 19 for UI components
- TypeScript for type safety
- Socket.IO client for real-time communication
- Vite for build tooling

**Backend:**
- Node.js with Express for server
- Socket.IO for WebSocket connections
- SQLite for database with better-sqlite3
- TypeScript for type safety
- Custom KROG validation engine in TypeScript

**Infrastructure:**
- Single-server deployment initially
- Scaling to multi-server with load balancing as needed
- CDN for static assets
- Cloud hosting on standard providers

The KROG validation engine is deterministic and stateless, making it highly scalable. Validation happens in 1 to 5 milliseconds per move, so one server handles thousands of concurrent games.

---

**Can developers build on KROG Chess?**

Yes. KROG Chess will offer public API for developers.

The API will provide:
- KROG validation endpoint to validate any chess position and return formula
- KROG explanation endpoint to get full explanation with operators and R-types
- Game database query to retrieve KROG-annotated games
- Position analysis with KROG strategic insights

Developers can build:
- KROG-powered tools
- Chess training apps with KROG
- Browser extensions showing KROG formulas
- Mobile apps using KROG validation
- Research tools querying KROG data

The "Built with KROG" program showcases developer projects. Outstanding integrations receive promotion and potential revenue sharing.

Developer API launches in 2025. Early access available for serious builders. Contact georg@signatu.com.

---

**Is KROG Chess hiring?**

KROG Chess is currently a solo founder project. As funding arrives, hiring will begin.

Priority roles include:
- Frontend developer with React and accessibility expertise
- Backend developer with real-time systems experience
- Chess domain expert for puzzle curation and variant design
- Educational specialist for curriculum development
- Marketing growth specialist for viral expansion

If you are passionate about mathematics, chess, accessibility, or education, and want to work on KROG Chess, send your background to georg@signatu.com with subject line "KROG Chess Hiring".

We value depth over credentials. Show us what you have built. Show us how you think. Show us why KROG excites you.

---

## **FUTURE QUESTIONS**

**What is the roadmap for KROG Chess?**

The strategic roadmap includes clear milestones:

**Completed:**
- Daily Puzzle with streak tracking
- Explain This Move with social sharing
- KROG Formula Leaderboard
- Tournaments and Leagues
- Play vs Computer
- Chess variants (Chess960, Three-Check, King of the Hill)

**In Progress:**
- Opening Explorer with KROG principles
- Public API documentation

**Planned:**
- KROG Studies system for collaborative analysis
- KROG Puzzle Rush timed challenges
- KROG Play Coach real-time hints
- Voice plus KROG comprehensive interface
- KROG Judge cryptographic tournament system
- Mobile responsive UI

---

**Will KROG expand beyond chess?**

Absolutely. Chess is proof of concept, not the end goal.

KROG is a universal framework for rules. After proving it works for chess, expansion begins.

Next games include:
- **Shogi:** Demonstrating KROG works cross-culturally in Japanese chess
- **Poker:** Demonstrating hidden information and probability operators
- **Battleship:** Demonstrating search and information theory
- **Go:** Demonstrating territory and influence rules

Beyond games, KROG applies to:
- Business strategy using KROG for market entry and competitive games
- Military applications using KROG for war-gaming and rules of engagement
- AI agent authorization using KROG for autonomous decision boundaries
- Smart contracts using KROG for legal contract formalization

The vision is KROG as the universal language for game theory, enabling AI agents to play, negotiate, and strategize using formal logic in any domain.

Chess is where it begins. Game theory is where it goes.

---

**How can I support KROG Chess?**

There are many ways to support KROG Chess, depending on your skills and resources.

**Play and share:** Create an account, solve Daily Puzzles, share KROG explanations on social media, tell chess friends about the platform.

**Become a Patron:** Subscribe at 10 euros per month. Support development and get ad-free experience.

**Educational adoption:** If you teach chess, use KROG in your classroom. Request Educational tier trial. Provide feedback.

**Developer contributions:** Build tools using KROG API when it launches. Create content and integrations. Join the "Built with KROG" program.

**Research collaboration:** If you are in academia, consider research projects using KROG data. Co-author papers. Cite KROG Chess.

**Investment:** KROG Chess will raise funding in 2025. Interested investors contact georg@signatu.com.

**Feedback:** Use the platform and report bugs. Suggest features. Tell us what works and what does not.

Every user makes KROG better. Every share increases reach. Every piece of feedback shapes the product.

Thank you for supporting KROG Chess.

---

**How do I contact KROG Chess?**

- **Email:** georg@signatu.com
- **Website:** krogrules.com/chess

For press inquiries, email with subject line "Press Inquiry".
For partnership inquiries, email with subject line "Partnership".
For technical support, email with subject line "Support".
For investor inquiries, email with subject line "Investment".

Georg Philip Krog personally responds to all serious inquiries. Response time is typically 24 to 48 hours.

We value thoughtful communication. Take time to explain your interest, question, or proposal. We will take time to respond meaningfully.

---

**END OF FAQ**
