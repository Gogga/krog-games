# KROG CHESS UI CONTENT GUIDE

**Document Type:** Complete UI microcopy and messaging reference
**Purpose:** Ensure consistent, clear, educational voice across entire KROG Chess platform
**Target Audience:** Developers, designers, translators, product managers
**Last Updated:** December 24, 2025

---

## VOICE AND TONE GUIDELINES

### KROG Chess Voice Principles

Our voice is educational but not academic. Mathematical but not intimidating. Professional but not corporate. Encouraging but not patronizing.

**Core Values:**
- Clarity over cleverness
- Education over entertainment
- Precision over poetry
- Empowerment over hand-holding

**Voice Characteristics:**

- **Educational:** We teach. Every message is an opportunity to help users understand KROG and chess better. We explain WHY, not just WHAT.
- **Precise:** We use exact language. Mathematical terms are defined. Chess notation is correct. FIDE rules are referenced accurately.
- **Encouraging:** We celebrate learning. Users are discovering formal logic through chess. This is challenging and rewarding. We acknowledge both.
- **Accessible:** We avoid jargon when possible. When we use technical terms like operator or R-type, we explain them. We write for age 14 reading level.
- **Respectful:** We never condescend. Users are intelligent. Some are beginners. Some are experts. We respect both.
- **Bilingual:** Every piece of UI text exists in Norwegian and English. Both languages are first-class citizens, not translations.

---

## TONE VARIATIONS BY CONTEXT

**Onboarding:** Welcoming, patient, slightly more verbose
*Example:* Welcome to KROG Chess! Let me show you how mathematical validation works.

**Gameplay:** Concise, immediate, functional
*Example:* Your turn. White to move.

**Errors:** Helpful, non-blaming, actionable
*Example:* That move is not legal. The path is blocked at f3.

**Success:** Celebratory, specific, reinforcing
*Example:* Puzzle solved! You used the PM operator for piece movement.

**Education:** Patient, thorough, structured
*Example:* KROG operators are mathematical symbols that describe chess rules. There are 36 operators in total.

**Settings:** Neutral, informative, clear
*Example:* Choose your preferred language for KROG explanations.

---

## NAVIGATION AND MENU

### Top Navigation Bar

| English | Norwegian |
|---------|-----------|
| KROG Chess | KROG Sjakk |
| Play | Spill |
| Learn | Lær |
| Tournaments | Turneringer |
| Leagues | Ligaer |
| Daily | Daglig |
| KROG (leaderboard button) | KROG |
| Help | Hjelp |
| Settings | Innstillinger |

### User Menu (Click Username)

| English | Norwegian |
|---------|-----------|
| Profile | Profil |
| My Games | Mine spill |
| Statistics | Statistikk |
| Become a Patron | Bli patron |
| Settings | Innstillinger |
| Log Out | Logg ut |

### Footer Links

| English | Norwegian |
|---------|-----------|
| About KROG Chess | Om KROG Sjakk |
| FAQ | Ofte stilte spørsmål |
| Contact | Kontakt |
| Privacy Policy | Personvernerklæring |
| Terms of Service | Vilkår for bruk |
| Press Kit | Pressemappe |
| Developers | Utviklere |

---

## AUTHENTICATION

### Login Screen

**Header:**
- EN: Welcome Back
- NO: Velkommen tilbake

**Username field placeholder:**
- EN: Username or email
- NO: Brukernavn eller e-post

**Password field placeholder:**
- EN: Password
- NO: Passord

**Login button:**
- EN: Log In
- NO: Logg inn

**Forgot password link:**
- EN: Forgot password?
- NO: Glemt passord?

**Sign up link:**
- EN: Don't have an account? Sign up
- NO: Har du ikke konto? Registrer deg

**Guest play button:**
- EN: Play as Guest
- NO: Spill som gjest

**Guest play note:**
- EN: Guest progress is not saved
- NO: Gjesteframgang lagres ikke

### Registration Screen

**Header:**
- EN: Create Account
- NO: Opprett konto

**Username field:**
- EN: Username
- NO: Brukernavn

**Username helper:**
- EN: 3-20 characters, letters and numbers only
- NO: 3-20 tegn, kun bokstaver og tall

**Email field:**
- EN: Email
- NO: E-post

**Password field:**
- EN: Password
- NO: Passord

**Password strength indicator:**
- EN: Weak / Good / Strong
- NO: Svak / God / Sterk

**Confirm password field:**
- EN: Confirm password
- NO: Bekreft passord

**Language selector:**
- EN: Preferred language
- NO: Foretrukket språk

**Terms checkbox:**
- EN: I agree to the Terms of Service and Privacy Policy
- NO: Jeg godtar vilkårene for bruk og personvernerklæringen

**Create account button:**
- EN: Create Account
- NO: Opprett konto

**Already have account link:**
- EN: Already have an account? Log in
- NO: Har du allerede konto? Logg inn

### Password Reset

**Header:**
- EN: Reset Password
- NO: Tilbakestill passord

**Instructions:**
- EN: Enter your email address and we'll send you a reset link
- NO: Skriv inn e-postadressen din, så sender vi deg en tilbakestillingslenke

**Email field:**
- EN: Email address
- NO: E-postadresse

**Submit button:**
- EN: Send Reset Link
- NO: Send tilbakestillingslenke

**Success message:**
- EN: Check your email for the reset link
- NO: Sjekk e-posten din for tilbakestillingslenkeen

**Back to login link:**
- EN: Back to login
- NO: Tilbake til innlogging

---

## ONBOARDING

### Welcome Modal (First Time Users)

**Screen 1 - Welcome:**
- EN: Welcome to KROG Chess - The world's first mathematically validated chess platform
- NO: Velkommen til KROG Sjakk - Verdens første matematisk validerte sjakkplattform

**Button:**
- EN: Get Started
- NO: Kom i gang

**Skip button:**
- EN: Skip tutorial
- NO: Hopp over veiledning

**Screen 2 - What is KROG:**
- EN: What is KROG? KROG stands for Knowledge, Rights, Obligations, Governance. Every move on KROG Chess is explained with formal logic. When you make a move, you'll see: The KROG formula, Which operators are used, Why the move is legal, FIDE rule references
- NO: Hva er KROG? KROG står for Kunnskap, Rettigheter, Plikter, Styring. Hvert trekk på KROG Sjakk forklares med formell logikk. Når du gjør et trekk, ser du: KROG-formelen, Hvilke operatorer som brukes, Hvorfor trekket er lovlig, FIDE-regelreferanser

**Screen 3 - Daily Puzzle:**
- EN: Daily Puzzle - Solve one puzzle every day at midnight UTC. Build your streak and learn KROG operators. Share your results on social media.
- NO: Daglig puslespill - Løs ett puslespill hver dag ved midnatt UTC. Bygg din rekke og lær KROG-operatorer. Del resultatene dine på sosiale medier.

**Screen 4 - Explain This Move:**
- EN: Explain This Move - Click the info icon next to any move to see its complete KROG explanation with formula, operators, and FIDE rules in Norwegian and English.
- NO: Forklar dette trekket - Klikk på info-ikonet ved siden av ethvert trekk for å se den komplette KROG-forklaringen med formel, operatorer og FIDE-regler på norsk og engelsk.

**Screen 5 - KROG Leaderboard:**
- EN: KROG Leaderboard - Compete on three leaderboards: Most explanations viewed, Most explanations shared, Most R-types learned. Earn badges from Novice to Ambassador.
- NO: KROG-ledertavle - Konkurrér på tre ledertavler: Flest forklaringer sett, Flest forklaringer delt, Flest R-typer lært. Tjen merker fra nybegynner til ambassadør.

**Final button:**
- EN: Start Playing
- NO: Begynn å spille

---

## GAME LOBBY

### Find a Match Section

**Header:**
- EN: Find a Match
- NO: Finn en motstander

**Time Control label:**
- EN: Time Control
- NO: Tidskontroll

**Time control options:**
- EN: Bullet (1 min) | Blitz (3+2) | Rapid (10+0) | No clock
- NO: Bullet (1 min) | Lynsjak (3+2) | Hurtigsjak (10+0) | Ingen klokke

**Variant label:**
- EN: Variant
- NO: Variant

**Variant options:**
- EN: Standard (Classic chess) | Chess960 (Random start position) | 3-Check (Win by giving 3 checks) | KotH (Win by reaching center)
- NO: Standard (Klassisk sjakk) | Sjakk960 (Tilfeldig startposisjon) | 3-sjakk (Vinn ved å gi 3 sjakkbud) | KotH (Vinn ved å nå sentrum)

**Find Opponent button:**
- EN: Find Opponent
- NO: Finn motstander

**Your rating display:**
- EN: Your rating: 1463
- NO: Din rating: 1463

**Searching state:**
- EN: Searching for opponent...
- NO: Søker etter motstander...

**Cancel search button:**
- EN: Cancel
- NO: Avbryt

### Create New Game Section

**Header:**
- EN: Create New Game
- NO: Opprett nytt spill

**Description:**
- EN: Create a custom game and share the room code
- NO: Opprett et tilpasset spill og del romkoden

**Create button:**
- EN: Create New Game
- NO: Opprett nytt spill

**Room code display:**
- EN: Room Code: ABCD1234
- NO: Romkode: ABCD1234

**Copy code button:**
- EN: Copy Code
- NO: Kopier kode

**Copied confirmation:**
- EN: Copied!
- NO: Kopiert!

**Share instructions:**
- EN: Share this code with your opponent
- NO: Del denne koden med motstanderen din

**Waiting state:**
- EN: Waiting for opponent to join...
- NO: Venter på at motstander skal bli med...

### Join Existing Game Section

**Header:**
- EN: — or join existing game —
- NO: — eller bli med i eksisterende spill —

**Input placeholder:**
- EN: ENTER ROOM CODE
- NO: SKRIV INN ROMKODE

**Join button:**
- EN: Join
- NO: Bli med

**Invalid code error:**
- EN: Invalid room code
- NO: Ugyldig romkode

**Room full error:**
- EN: This game is already full
- NO: Dette spillet er allerede fullt

**Room not found error:**
- EN: Room not found. Check the code and try again.
- NO: Rom ikke funnet. Sjekk koden og prøv igjen.

### Play vs Computer Section

**Header:**
- EN: Play vs Computer
- NO: Spill mot datamaskin

**Button:**
- EN: Play vs Computer
- NO: Spill mot datamaskin

**Difficulty selector:**
- EN: Difficulty: Beginner | Intermediate | Advanced
- NO: Vanskelighetsgrad: Nybegynner | Middels | Avansert

### Practice and Learn Section

**Header:**
- EN: — or practice & learn —
- NO: — eller øv og lær —

**Lessons button:**
- EN: Lessons
- NO: Leksjoner

**Puzzles button:**
- EN: Puzzles
- NO: Puslespill

**Openings button:**
- EN: Openings
- NO: Åpninger

**Import PGN button:**
- EN: Import PGN
- NO: Importer PGN

**KROG Leaderboard button:**
- EN: KROG
- NO: KROG

---

## IN-GAME INTERFACE

### Player Information Panel

**Opponent display:**
- EN: [Username] Rating: 1543
- NO: [Brukernavn] Rating: 1543

**Your display:**
- EN: [Username] (You) Rating: 1463
- NO: [Brukernavn] (Deg) Rating: 1463

**Turn indicator:**
- EN: Your turn!
- NO: Din tur!

**Waiting indicator:**
- EN: Opponent's turn
- NO: Motstanderens tur

**Check warning:**
- EN: You are in check!
- NO: Du står i sjakk!

**Checkmate:**
- EN: Checkmate! [Winner] wins
- NO: Sjakkmatt! [Vinner] vinner

**Stalemate:**
- EN: Stalemate - Draw
- NO: Patt - Remis

**Draw by repetition:**
- EN: Draw by threefold repetition
- NO: Remis ved tredobbel repetisjon

**Draw by 50-move rule:**
- EN: Draw by 50-move rule
- NO: Remis etter 50-trekksregelen

**Insufficient material:**
- EN: Draw - Insufficient material
- NO: Remis - Utilstrekkelig materiale

### Game Control Buttons

**Learn Mode toggle:**
- EN: Learn Mode ON | Learn Mode OFF
- NO: Læringsmodus PÅ | Læringsmodus AV

**Learn Mode tooltip:**
- EN: Show KROG explanations when hovering over legal moves
- NO: Vis KROG-forklaringer når du holder musepekeren over lovlige trekk

**Offer Draw button:**
- EN: Offer Draw
- NO: Tilby remis

**Accept Draw button:**
- EN: Accept Draw
- NO: Godta remis

**Decline Draw button:**
- EN: Decline
- NO: Avslå

**Resign button:**
- EN: Resign
- NO: Gi opp

**Resign confirmation:**
- EN: Are you sure you want to resign?
- NO: Er du sikker på at du vil gi opp?

**Yes button:**
- EN: Yes, Resign
- NO: Ja, gi opp

**No button:**
- EN: No, Continue
- NO: Nei, fortsett

**Back to Lobby button:**
- EN: Back to Lobby
- NO: Tilbake til lobbyen

**Leave Room button:**
- EN: Leave Room
- NO: Forlat rom

### Move History Panel

**Header:**
- EN: Move History
- NO: Trekkhistorikk

**Column headers:**
- EN: # | White | Black
- NO: # | Hvit | Svart

**Info icon tooltip:**
- EN: Click to explain this move
- NO: Klikk for å forklare dette trekket

**Empty state:**
- EN: No moves yet
- NO: Ingen trekk ennå

### KROG Explanation Panel

**Toggle button:**
- EN: KROG Explanation
- NO: KROG-forklaring

**Language toggle:**
- EN: EN | NO
- NO: EN | NO

**Empty state:**
- EN: Make a move to see KROG explanation
- NO: Gjør et trekk for å se KROG-forklaring

**Rule Classification header:**
- EN: Rule Classification
- NO: Regelklassifisering

**KROG Formula header:**
- EN: KROG Formula
- NO: KROG-formel

**Explanation header:**
- EN: Explanation
- NO: Forklaring

**FIDE Rule header:**
- EN: FIDE Rule
- NO: FIDE-regel

### PGN Export

**Copy PGN button:**
- EN: Copy PGN
- NO: Kopier PGN

**Copied confirmation:**
- EN: PGN copied to clipboard
- NO: PGN kopiert til utklippstavle

**Download PGN button:**
- EN: Download PGN
- NO: Last ned PGN

---

## DAILY PUZZLE

### Daily Puzzle Main Screen

**Header:**
- EN: Daily Puzzle
- NO: Daglig puslespill

**Streak badge:**
- EN: X-day streak
- NO: X-dags rekke

**Instructions:**
- EN: Find the best move for White
- NO: Finn det beste trekket for hvit

**Instructions (Black):**
- EN: Find the best move for Black
- NO: Finn det beste trekket for svart

**Hint button:**
- EN: Get Hint
- NO: Få hint

**Incorrect feedback:**
- EN: Incorrect move. Try again!
- NO: Feil trekk. Prøv igjen!

**Attempts display:**
- EN: Attempts: 2
- NO: Forsøk: 2

### Puzzle Solved State

**Header:**
- EN: Already completed today!
- NO: Allerede fullført i dag!

**Completion time:**
- EN: You solved it in 1:23
- NO: Du løste det på 1:23

**Share Result button:**
- EN: Share Result
- NO: Del resultat

**Share copied confirmation:**
- EN: Result copied to clipboard!
- NO: Resultat kopiert til utklippstavle!

**Current streak:**
- EN: Current Streak: X days
- NO: Nåværende rekke: X dager

**Best streak:**
- EN: Best Streak: X days
- NO: Beste rekke: X dager

**Total solved:**
- EN: Total Solved: X puzzles
- NO: Totalt løst: X puslespill

**Countdown to next:**
- EN: Next puzzle in: 23:28:00
- NO: Neste puslespill om: 23:28:00

**Exit button:**
- EN: Exit
- NO: Avslutt

---

## MOVE EXPLANATION MODAL

### Modal Header

**Title:**
- EN: Move [N]: [Move]
- NO: Trekk [N]: [Trekk]

**Close button:**
- EN: Close explanation
- NO: Lukk forklaring

### KROG Formula Section

**Header:**
- EN: KROG Formula
- NO: KROG-formel

**Operator badge:**
- EN: Operator: P (Permitted)
- NO: Operator: P (Tillatt)

**T-Type badge:**
- EN: T-Type: T1 (Player discretion)
- NO: T-Type: T1 (Spillervalg)

**R-Type badge:**
- EN: R-Type: R3 (Path-dependent movement)
- NO: R-Type: R3 (Banavhengig bevegelse)

### Explanation Section

**Header:**
- EN: Explanation
- NO: Forklaring

**Toggle button:**
- EN: Show Norwegian | Show English
- NO: Vis norsk | Vis engelsk

### Conditions Section

**Header:**
- EN: Conditions
- NO: Betingelser

**Condition note:**
- EN: All conditions must be satisfied for the move to be legal
- NO: Alle betingelser må være oppfylt for at trekket skal være lovlig

### FIDE Rules Section

**Header:**
- EN: FIDE Rules
- NO: FIDE-regler

**FIDE link:**
- EN: View complete FIDE rules
- NO: Se komplette FIDE-regler

### Share Section

**Share button:**
- EN: Share Explanation
- NO: Del forklaring

**Share tooltip:**
- EN: Copy this KROG explanation to clipboard
- NO: Kopier denne KROG-forklaringen til utklippstavle

**Copied confirmation:**
- EN: Explanation copied to clipboard!
- NO: Forklaring kopiert til utklippstavle!

---

## KROG LEADERBOARD MODAL

### Modal Header

**Title:**
- EN: KROG Formula Leaderboard
- NO: KROG-formel ledertavle

### Tab Navigation

| English | Norwegian |
|---------|-----------|
| Views | Visninger |
| Shares | Delinger |
| R-Types | R-typer |

### Your Stats Panel

**Header:**
- EN: Your Statistics
- NO: Din statistikk

**Views stat:**
- EN: Views: 47
- NO: Visninger: 47

**Shares stat:**
- EN: Shares: 12
- NO: Delinger: 12

**R-Types stat:**
- EN: R-Types: 8/15
- NO: R-typer: 8/15

**Rank stat:**
- EN: Rank: #23
- NO: Rangering: #23

**Badge display:**
- EN: Badge: KROG Learner
- NO: Merke: KROG-elev

### Leaderboard Table

**Column headers:**
- EN: Rank | Player | [Metric] | Badge
- NO: Rang | Spiller | [Metrikk] | Merke

**Empty state:**
- EN: No entries yet. Be the first!
- NO: Ingen oppføringer ennå. Vær den første!

**Loading state:**
- EN: Loading leaderboard...
- NO: Laster ledertavle...

### Badge Names

| English | Norwegian |
|---------|-----------|
| Novice | Nybegynner |
| Learner | Elev |
| Expert | Ekspert |
| Master | Mester |
| Educator | Pedagog |
| Ambassador | Ambassadør |

---

## FAQ MODAL

### Modal Header

**Title:**
- EN: Help & FAQ
- NO: Hjelp & ofte stilte spørsmål

**Search box placeholder:**
- EN: Search for answers...
- NO: Søk etter svar...

### Category Navigation

| English | Norwegian |
|---------|-----------|
| Getting Started | Komme i gang |
| Understanding KROG | Forstå KROG |
| Features | Funksjoner |
| Playing Chess | Spille sjakk |
| Educational Use | Pedagogisk bruk |
| Accessibility | Tilgjengelighet |
| Account & Settings | Konto og innstillinger |
| Technical | Teknisk |

### Search Results

**Results header:**
- EN: Found X results for "[query]"
- NO: Fant X resultater for "[søk]"

**No results:**
- EN: No results found. Try different keywords or contact support.
- NO: Ingen resultater funnet. Prøv andre søkeord eller kontakt support.

### FAQ Footer

**Still need help:**
- EN: Still need help?
- NO: Trenger du fortsatt hjelp?

**Contact button:**
- EN: Contact Support
- NO: Kontakt support

---

## SETTINGS

### Settings Modal Header

**Title:**
- EN: Settings
- NO: Innstillinger

**Save button:**
- EN: Save Changes
- NO: Lagre endringer

**Cancel button:**
- EN: Cancel
- NO: Avbryt

**Changes saved confirmation:**
- EN: Settings saved successfully
- NO: Innstillinger lagret

### Account Section

**Header:**
- EN: Account
- NO: Konto

**Change password button:**
- EN: Change Password
- NO: Endre passord

**Delete account button:**
- EN: Delete Account
- NO: Slett konto

**Delete confirmation:**
- EN: Are you sure? This action cannot be undone.
- NO: Er du sikker? Denne handlingen kan ikke angres.

### Appearance Section

**Header:**
- EN: Appearance
- NO: Utseende

**Board theme:**
- EN: Board Theme
- NO: Brettema

**Piece set:**
- EN: Piece Set
- NO: Brikker

**Sound effects:**
- EN: Sound Effects
- NO: Lydeffekter

**Sound toggle:**
- EN: On | Off
- NO: På | Av

### Language Section

**Header:**
- EN: Language
- NO: Språk

**Interface language:**
- EN: Interface Language
- NO: Grensesnittspråk

**Language options:**
- EN: English | Norwegian
- NO: Engelsk | Norsk

**KROG explanations:**
- EN: KROG Explanations
- NO: KROG-forklaringer

**Explanation options:**
- EN: English | Norwegian | Both
- NO: Engelsk | Norsk | Begge

---

## ERROR MESSAGES

### Connection Errors

**Lost connection:**
- EN: Connection lost. Reconnecting...
- NO: Tilkobling mistet. Kobler til på nytt...

**Reconnected:**
- EN: Reconnected successfully
- NO: Koblet til på nytt

**Connection failed:**
- EN: Unable to connect to server. Please check your internet connection.
- NO: Kan ikke koble til server. Vennligst sjekk internettforbindelsen.

**Retry button:**
- EN: Retry
- NO: Prøv igjen

### Game Errors

**Invalid move:**
- EN: That move is not legal. [Reason]
- NO: Det trekket er ikke lovlig. [Årsak]

**Reasons:**
- EN: The path is blocked at [square]
- NO: Banen er blokkert ved [rute]

- EN: That would leave your king in check
- NO: Det ville sette kongen din i sjakk

- EN: The piece cannot move that way
- NO: Brikken kan ikke flytte slik

- EN: You must get out of check
- NO: Du må komme ut av sjakk

### Authentication Errors

**Login failed:**
- EN: Invalid username or password
- NO: Ugyldig brukernavn eller passord

**Username taken:**
- EN: This username is already taken
- NO: Dette brukernavnet er allerede tatt

**Session expired:**
- EN: Your session has expired. Please log in again.
- NO: Økten din har utløpt. Vennligst logg inn igjen.

### General Errors

**Something went wrong:**
- EN: Something went wrong. Please try again.
- NO: Noe gikk galt. Vennligst prøv igjen.

**Page not found:**
- EN: Page not found
- NO: Siden ble ikke funnet

**Back to home:**
- EN: Back to Home
- NO: Tilbake til hjem

---

## SUCCESS MESSAGES

### Account Actions

**Account created:**
- EN: Account created successfully! Welcome to KROG Chess.
- NO: Konto opprettet! Velkommen til KROG Sjakk.

**Password changed:**
- EN: Password changed successfully
- NO: Passord endret

**Settings saved:**
- EN: Settings saved successfully
- NO: Innstillinger lagret

### Game Actions

**Game created:**
- EN: Game created! Share the room code: [CODE]
- NO: Spill opprettet! Del romkoden: [KODE]

**Joined game:**
- EN: Joined game successfully
- NO: Ble med i spill

**Draw accepted:**
- EN: Draw accepted
- NO: Remis akseptert

### Social Actions

**Copied to clipboard:**
- EN: Copied to clipboard!
- NO: Kopiert til utklippstavle!

**KROG explanation shared:**
- EN: KROG explanation copied! Share it on social media.
- NO: KROG-forklaring kopiert! Del den på sosiale medier.

---

## EMPTY STATES

### No Games

- EN: No games yet. Start your first game to see your game history here.
- NO: Ingen spill ennå. Start ditt første spill for å se spillhistorikken din her.

**Button:**
- EN: Start Playing
- NO: Begynn å spille

### No Puzzles

- EN: No puzzles solved yet. Solve your first Daily Puzzle to start your streak.
- NO: Ingen puslespill løst ennå. Løs ditt første daglige puslespill for å starte rekken din.

**Button:**
- EN: Try Daily Puzzle
- NO: Prøv daglig puslespill

### No Friends

- EN: No friends yet. Connect with other players to see them here.
- NO: Ingen venner ennå. Koble til andre spillere for å se dem her.

**Button:**
- EN: Find Players
- NO: Finn spillere

---

## LOADING STATES

| English | Norwegian |
|---------|-----------|
| Loading... | Laster... |
| Please wait... | Vennligst vent... |
| Loading game... | Laster spill... |
| Loading puzzle... | Laster puslespill... |
| Loading leaderboard... | Laster ledertavle... |
| Saving... | Lagrer... |
| Searching for opponent... | Søker etter motstander... |
| Connecting to server... | Kobler til server... |
| Analyzing position... | Analyserer posisjon... |
| Generating KROG explanation... | Genererer KROG-forklaring... |

---

## TOOLTIPS AND HOVER TEXT

### Button Tooltips

| Button | English | Norwegian |
|--------|---------|-----------|
| Help | Open help and FAQ | Åpne hjelp og ofte stilte spørsmål |
| Settings | Open settings | Åpne innstillinger |
| Profile | View your profile | Se profilen din |
| Daily | Solve today's puzzle | Løs dagens puslespill |
| KROG | View KROG leaderboards and your stats | Se KROG-ledertavler og statistikken din |
| Copy | Copy to clipboard | Kopier til utklippstavle |
| Share | Share on social media | Del på sosiale medier |
| Resign | Resign this game | Gi opp dette spillet |
| Draw | Offer a draw to your opponent | Tilby remis til motstanderen |

### Feature Tooltips

**Learn Mode toggle:**
- EN: Toggle learn mode to see KROG explanations when hovering over legal moves
- NO: Slå på læringsmodus for å se KROG-forklaringer når du holder musepekeren over lovlige trekk

**Move info icon:**
- EN: Click to see the complete KROG explanation for this move
- NO: Klikk for å se den komplette KROG-forklaringen for dette trekket

**Language toggle:**
- EN: Switch between English and Norwegian explanations
- NO: Bytt mellom engelske og norske forklaringer

---

## ACCESSIBILITY LABELS

### Screen Reader Announcements

**Game start:**
- EN: Game started. You are playing White. Your turn.
- NO: Spillet startet. Du spiller hvit. Din tur.

**Turn change:**
- EN: Your turn
- NO: Din tur

- EN: Opponent's turn
- NO: Motstanderens tur

**Move made:**
- EN: You moved [piece] from [square] to [square]
- NO: Du flyttet [brikke] fra [rute] til [rute]

**Check:**
- EN: Check! Your king is under attack.
- NO: Sjakk! Kongen din angripes.

**Checkmate:**
- EN: Checkmate! [Winner] wins the game.
- NO: Sjakkmatt! [Vinner] vinner spillet.

### Board Navigation

**Square label:**
- EN: [Square] [Piece or empty] (Example: e4 white pawn | d5 empty)
- NO: [Rute] [Brikke eller tom] (Eksempel: e4 hvit bonde | d5 tom)

**Piece selection:**
- EN: [Piece] selected. Use arrow keys to choose destination.
- NO: [Brikke] valgt. Bruk piltaster for å velge mål.

---

## KEYBOARD SHORTCUTS

| Key | English | Norwegian |
|-----|---------|-----------|
| Tab | Navigate between elements | Naviger mellom elementer |
| Enter | Select / Confirm | Velg / Bekreft |
| Escape | Close dialog / Cancel | Lukk dialog / Avbryt |
| Arrow keys | Navigate board (accessibility mode) | Naviger brett (tilgjengelighetsmodus) |
| F | Flip board | Snu brett |
| L | Toggle learn mode | Slå på/av læringsmodus |
| D | Offer draw | Tilby remis |
| R | Resign | Gi opp |
| ? | Show shortcuts | Vis snarveier |
| H | Open help | Åpne hjelp |

---

## TRANSLATION GUIDELINES

### Norwegian-English Consistency

Always translate these terms consistently:

| English | Norwegian |
|---------|-----------|
| Chess | Sjakk |
| Piece | Brikke |
| Move | Trekk |
| Board | Brett |
| Square | Rute |
| File | Linje |
| Rank | Rad |
| Diagonal | Diagonal |
| Check | Sjakk |
| Checkmate | Sjakkmatt |
| Stalemate | Patt |
| Castling | Rokade |
| En passant | En passant (keep French) |
| Promotion | Forfremmelse |
| Capture | Slag |
| Operator | Operator |
| Formula | Formel |
| Condition | Betingelse |
| Rule | Regel |
| Type | Type |
| Classification | Klassifisering |
| Permission | Tillatelse |
| Obligation | Plikt |
| Knowledge | Kunnskap |
| Rights | Rettigheter |
| Governance | Styring |
| Puzzle | Puslespill |
| Streak | Rekke |
| Badge | Merke |
| Leaderboard | Ledertavle |
| Statistics | Statistikk |
| Rank | Rangering |

### When Not to Translate

Keep in English:
- KROG (acronym)
- En passant (French chess term)
- Algebraic notation (e4, Nf3, etc.)
- PGN (Portable Game Notation)
- FIDE (Fédération Internationale des Échecs)
- R-type names (R3_path_dependent, etc.)
- Operator names (PM, PC, CR, etc.)
- Technical URLs (krogrules.com)

---

## IMPLEMENTATION CHECKLIST

For Developers Using This Guide:

- [ ] Replace all hardcoded text with references to this guide
- [ ] Implement i18n (internationalization) system
- [ ] Store all strings in language files (en.json, no.json)
- [ ] Never hardcode UI text in components
- [ ] Use consistent capitalization (Title Case for headers, Sentence case for body)
- [ ] Test all text for length (Norwegian often longer than English)
- [ ] Ensure all interactive elements have tooltips
- [ ] Add ARIA labels for screen readers
- [ ] Implement proper error messaging with actionable next steps
- [ ] Add loading states for all async operations
- [ ] Test keyboard navigation with Tab, Enter, Escape
- [ ] Verify all text is readable at default zoom
- [ ] Check that green KROG accent color has sufficient contrast
- [ ] Test with screen reader (VoiceOver on Mac, NVDA on Windows)
- [ ] Ensure all emojis have text alternatives
- [ ] Verify bilingual content maintains parity (both languages complete)

---

## VERSIONING

### Document History

**Version 1.0 - December 24, 2025**
- Initial comprehensive UI content guide
- All core features covered
- Norwegian and English bilingual support
- Accessibility labels included
- Based on KROG Chess platform

### Future Updates

When adding new features:
1. Add UI content to appropriate section
2. Include both English and Norwegian
3. Add tooltips and accessibility labels
4. Add to implementation checklist
5. Update version number
6. Commit to Git with clear message

---

**END OF UI CONTENT GUIDE**

This guide serves as the single source of truth for all KROG Chess UI text. Developers should reference this document when implementing any user-facing features. Translators should use this as the base for additional language support.

The guide maintains consistency with the KROG Chess voice: educational, precise, encouraging, accessible, respectful, and bilingual.
