import React, { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';

interface LocalizedText {
    en: string;
    no: string;
}

interface QuizQuestion {
    question: LocalizedText;
    options: string[];
    correct: number;
}

interface LessonSummary {
    id: string;
    title: LocalizedText;
    duration: number;
    piece?: string;
}

interface ModuleSummary {
    id: string;
    name: LocalizedText;
    lessonCount: number;
    lessons: LessonSummary[];
}

interface LevelSummary {
    level: number;
    name: LocalizedText;
    description: LocalizedText;
    estimatedTime: string;
    modules: ModuleSummary[];
}

interface LessonData {
    id: string;
    title: LocalizedText;
    duration: number;
    piece?: string;
    content: LocalizedText;
    keyPoints?: LocalizedText[];
    krog?: {
        formula: string;
        note?: string;
        fide?: string;
    };
    quiz?: QuizQuestion[];
    level: number;
    module: string;
    nextLessonId: string | null;
}

interface LessonsModeProps {
    socket: Socket;
    language: 'en' | 'no';
    onExit: () => void;
}

const LEVEL_COLORS = ['#81b64c', '#4a90d9', '#9b59b6'];
const PIECE_ICONS: Record<string, string> = {
    'K': '\u2654', 'Q': '\u2655', 'R': '\u2656',
    'B': '\u2657', 'N': '\u2658', 'P': '\u2659'
};

const LessonsMode: React.FC<LessonsModeProps> = ({ socket, language, onExit }) => {
    const [view, setView] = useState<'overview' | 'lesson'>('overview');
    const [levels, setLevels] = useState<LevelSummary[]>([]);
    const [currentLesson, setCurrentLesson] = useState<LessonData | null>(null);
    const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([0]));
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

    // Quiz state
    const [quizIndex, setQuizIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [quizResult, setQuizResult] = useState<'correct' | 'incorrect' | null>(null);
    const [quizCompleted, setQuizCompleted] = useState(false);

    // Load completed lessons from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('krog_completed_lessons');
        if (saved) {
            setCompletedLessons(new Set(JSON.parse(saved)));
        }
    }, []);

    // Save completed lessons to localStorage
    const markLessonComplete = (lessonId: string) => {
        const newCompleted = new Set(completedLessons);
        newCompleted.add(lessonId);
        setCompletedLessons(newCompleted);
        localStorage.setItem('krog_completed_lessons', JSON.stringify([...newCompleted]));
    };

    // Socket events
    useEffect(() => {
        const handleOverview = ({ levels: data }: { levels: LevelSummary[] }) => {
            setLevels(data);
            setLoading(false);
        };

        const handleLessonData = (data: LessonData) => {
            setCurrentLesson(data);
            setView('lesson');
            setLoading(false);
            // Reset quiz state
            setQuizIndex(0);
            setSelectedAnswer(null);
            setQuizResult(null);
            setQuizCompleted(false);
        };

        socket.on('lessons_overview', handleOverview);
        socket.on('lesson_data', handleLessonData);

        // Request overview
        socket.emit('get_lessons_overview');

        return () => {
            socket.off('lessons_overview', handleOverview);
            socket.off('lesson_data', handleLessonData);
        };
    }, [socket]);

    const toggleLevel = (level: number) => {
        const newExpanded = new Set(expandedLevels);
        if (newExpanded.has(level)) {
            newExpanded.delete(level);
        } else {
            newExpanded.add(level);
        }
        setExpandedLevels(newExpanded);
    };

    const toggleModule = (moduleId: string) => {
        const newExpanded = new Set(expandedModules);
        if (newExpanded.has(moduleId)) {
            newExpanded.delete(moduleId);
        } else {
            newExpanded.add(moduleId);
        }
        setExpandedModules(newExpanded);
    };

    const openLesson = (lessonId: string) => {
        setLoading(true);
        socket.emit('get_lesson', { id: lessonId });
    };

    const goToNextLesson = () => {
        if (currentLesson?.nextLessonId) {
            markLessonComplete(currentLesson.id);
            setLoading(true);
            socket.emit('get_lesson', { id: currentLesson.nextLessonId });
        }
    };

    const backToOverview = () => {
        if (currentLesson && quizCompleted) {
            markLessonComplete(currentLesson.id);
        }
        setView('overview');
        setCurrentLesson(null);
    };

    const handleQuizAnswer = (answerIndex: number) => {
        if (quizResult !== null) return; // Already answered

        setSelectedAnswer(answerIndex);
        const isCorrect = currentLesson?.quiz?.[quizIndex]?.correct === answerIndex;
        setQuizResult(isCorrect ? 'correct' : 'incorrect');
    };

    const nextQuizQuestion = () => {
        if (!currentLesson?.quiz) return;

        if (quizIndex < currentLesson.quiz.length - 1) {
            setQuizIndex(quizIndex + 1);
            setSelectedAnswer(null);
            setQuizResult(null);
        } else {
            setQuizCompleted(true);
        }
    };

    // Calculate progress
    const getTotalLessons = () => levels.reduce((acc, l) =>
        acc + l.modules.reduce((acc2, m) => acc2 + m.lessons.length, 0), 0);

    const getCompletedCount = () => completedLessons.size;

    if (loading && view === 'overview') {
        return (
            <div className="app-container">
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <h2>{language === 'en' ? 'Loading lessons...' : 'Laster leksjoner...'}</h2>
                </div>
            </div>
        );
    }

    // Lesson View
    if (view === 'lesson' && currentLesson) {
        return (
            <div className="app-container">
                {/* Header */}
                <div style={{ marginBottom: '20px' }}>
                    <button
                        onClick={backToOverview}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#888',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '10px'
                        }}
                    >
                        <span style={{ fontSize: '1.2rem' }}>&larr;</span>
                        {language === 'en' ? 'Back to lessons' : 'Tilbake til leksjoner'}
                    </button>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>
                        {currentLesson.piece && (
                            <span style={{ marginRight: '10px' }}>
                                {PIECE_ICONS[currentLesson.piece] || ''}
                            </span>
                        )}
                        {currentLesson.title[language]}
                    </h1>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginTop: '10px',
                        color: '#888'
                    }}>
                        <span style={{
                            background: LEVEL_COLORS[currentLesson.level] || '#666',
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 600
                        }}>
                            Level {currentLesson.level}
                        </span>
                        <span>{currentLesson.duration} min</span>
                    </div>
                </div>

                {/* Content */}
                <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '24px',
                    borderRadius: '12px',
                    marginBottom: '20px'
                }}>
                    <p style={{
                        fontSize: '1.1rem',
                        lineHeight: 1.7,
                        margin: 0,
                        color: '#e0e0e0'
                    }}>
                        {currentLesson.content[language]}
                    </p>
                </div>

                {/* Key Points */}
                {currentLesson.keyPoints && currentLesson.keyPoints.length > 0 && (
                    <div style={{
                        background: 'var(--bg-secondary)',
                        padding: '20px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        border: '1px solid #333'
                    }}>
                        <h3 style={{ margin: '0 0 12px 0', color: '#81b64c' }}>
                            {language === 'en' ? 'Key Points' : 'Hovedpunkter'}
                        </h3>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {currentLesson.keyPoints.map((point, i) => (
                                <li key={i} style={{
                                    marginBottom: '8px',
                                    color: '#ccc'
                                }}>
                                    {point[language]}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* KROG Formula */}
                {currentLesson.krog && (
                    <div style={{
                        background: 'rgba(129, 182, 76, 0.1)',
                        border: '2px solid #81b64c',
                        padding: '20px',
                        borderRadius: '12px',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{ margin: '0 0 12px 0', color: '#81b64c' }}>
                            KROG Formula
                        </h3>
                        <div style={{
                            fontFamily: 'monospace',
                            fontSize: '1rem',
                            color: '#81b64c',
                            background: 'rgba(0,0,0,0.3)',
                            padding: '12px 16px',
                            borderRadius: '6px',
                            overflowX: 'auto',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {currentLesson.krog.formula}
                        </div>
                        {currentLesson.krog.note && (
                            <p style={{
                                margin: '12px 0 0 0',
                                color: '#888',
                                fontSize: '0.9rem'
                            }}>
                                {currentLesson.krog.note}
                            </p>
                        )}
                        {currentLesson.krog.fide && (
                            <p style={{
                                margin: '8px 0 0 0',
                                color: '#666',
                                fontSize: '0.85rem'
                            }}>
                                FIDE: {currentLesson.krog.fide}
                            </p>
                        )}
                    </div>
                )}

                {/* Quiz Section */}
                {currentLesson.quiz && currentLesson.quiz.length > 0 && !quizCompleted && (
                    <div style={{
                        background: 'var(--bg-secondary)',
                        padding: '24px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        border: '2px solid #4a90d9'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px'
                        }}>
                            <h3 style={{ margin: 0, color: '#4a90d9' }}>
                                {language === 'en' ? 'Quiz' : 'Quiz'}
                            </h3>
                            <span style={{ color: '#888', fontSize: '0.9rem' }}>
                                {quizIndex + 1} / {currentLesson.quiz.length}
                            </span>
                        </div>

                        <p style={{
                            fontSize: '1.1rem',
                            marginBottom: '20px',
                            color: 'white'
                        }}>
                            {currentLesson.quiz[quizIndex].question[language]}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {currentLesson.quiz[quizIndex].options.map((option, i) => {
                                const isSelected = selectedAnswer === i;
                                const isCorrect = currentLesson.quiz![quizIndex].correct === i;
                                const showResult = quizResult !== null;

                                let bg = 'rgba(255,255,255,0.05)';
                                let border = '1px solid #444';

                                if (showResult) {
                                    if (isCorrect) {
                                        bg = 'rgba(129, 182, 76, 0.2)';
                                        border = '2px solid #81b64c';
                                    } else if (isSelected && !isCorrect) {
                                        bg = 'rgba(231, 76, 60, 0.2)';
                                        border = '2px solid #e74c3c';
                                    }
                                } else if (isSelected) {
                                    bg = 'rgba(74, 144, 217, 0.2)';
                                    border = '2px solid #4a90d9';
                                }

                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleQuizAnswer(i)}
                                        disabled={quizResult !== null}
                                        style={{
                                            background: bg,
                                            border,
                                            color: 'white',
                                            padding: '14px 18px',
                                            borderRadius: '8px',
                                            cursor: quizResult !== null ? 'default' : 'pointer',
                                            fontFamily: 'inherit',
                                            fontSize: '1rem',
                                            textAlign: 'left',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {option}
                                    </button>
                                );
                            })}
                        </div>

                        {quizResult && (
                            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                <p style={{
                                    color: quizResult === 'correct' ? '#81b64c' : '#e74c3c',
                                    fontWeight: 600,
                                    fontSize: '1.1rem',
                                    marginBottom: '15px'
                                }}>
                                    {quizResult === 'correct'
                                        ? (language === 'en' ? 'Correct!' : 'Riktig!')
                                        : (language === 'en' ? 'Incorrect. The correct answer is highlighted.' : 'Feil. Riktig svar er markert.')}
                                </p>
                                <button
                                    onClick={nextQuizQuestion}
                                    style={{
                                        background: '#4a90d9',
                                        border: 'none',
                                        color: 'white',
                                        padding: '12px 24px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        fontSize: '1rem',
                                        fontWeight: 600
                                    }}
                                >
                                    {quizIndex < currentLesson.quiz.length - 1
                                        ? (language === 'en' ? 'Next Question' : 'Neste sporsmal')
                                        : (language === 'en' ? 'Complete Quiz' : 'Fullfør Quiz')}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Quiz Completed */}
                {quizCompleted && (
                    <div style={{
                        background: 'rgba(129, 182, 76, 0.15)',
                        border: '2px solid #81b64c',
                        padding: '24px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>
                            {'\u2714'}
                        </div>
                        <h3 style={{ color: '#81b64c', margin: '0 0 10px 0' }}>
                            {language === 'en' ? 'Lesson Complete!' : 'Leksjon fullført!'}
                        </h3>
                        <p style={{ color: '#888', margin: 0 }}>
                            {language === 'en'
                                ? 'You have completed this lesson.'
                                : 'Du har fullført denne leksjonen.'}
                        </p>
                    </div>
                )}

                {/* Navigation */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    {(!currentLesson.quiz || currentLesson.quiz.length === 0 || quizCompleted) && currentLesson.nextLessonId && (
                        <button
                            onClick={goToNextLesson}
                            style={{
                                background: '#81b64c',
                                border: 'none',
                                color: 'white',
                                padding: '14px 28px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {language === 'en' ? 'Next Lesson' : 'Neste leksjon'}
                            <span>&rarr;</span>
                        </button>
                    )}
                    <button
                        onClick={backToOverview}
                        style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid #444',
                            color: 'white',
                            padding: '14px 28px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '1rem'
                        }}
                    >
                        {language === 'en' ? 'All Lessons' : 'Alle leksjoner'}
                    </button>
                </div>
            </div>
        );
    }

    // Overview View
    return (
        <div className="app-container">
            {/* Header */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 700 }}>
                    {language === 'en' ? 'Learn Chess' : 'Lær Sjakk'}
                </h1>
                <p style={{ color: '#888', marginTop: '10px' }}>
                    {language === 'en'
                        ? 'Master chess from the basics to advanced tactics'
                        : 'Mestre sjakk fra det grunnleggende til avansert taktikk'}
                </p>

                {/* Progress */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '15px',
                    marginTop: '15px'
                }}>
                    <div style={{
                        background: 'var(--bg-secondary)',
                        padding: '8px 16px',
                        borderRadius: '6px'
                    }}>
                        <span style={{ color: '#81b64c', fontWeight: 600 }}>
                            {getCompletedCount()}
                        </span>
                        <span style={{ color: '#888' }}> / {getTotalLessons()} </span>
                        <span style={{ color: '#888' }}>
                            {language === 'en' ? 'completed' : 'fullført'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Back button */}
            <button
                onClick={onExit}
                style={{
                    background: '#e74c3c',
                    border: 'none',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    marginBottom: '20px'
                }}
            >
                {language === 'en' ? 'Back to Menu' : 'Tilbake til meny'}
            </button>

            {/* Levels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {levels.map((level) => (
                    <div
                        key={level.level}
                        style={{
                            background: 'var(--bg-secondary)',
                            borderRadius: '12px',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Level Header */}
                        <button
                            onClick={() => toggleLevel(level.level)}
                            style={{
                                width: '100%',
                                background: 'rgba(0,0,0,0.2)',
                                border: 'none',
                                padding: '16px 20px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                color: 'white',
                                fontFamily: 'inherit'
                            }}
                        >
                            <span style={{
                                transform: expandedLevels.has(level.level) ? 'rotate(90deg)' : 'rotate(0)',
                                transition: 'transform 0.2s'
                            }}>
                                {'\u25B6'}
                            </span>
                            <span style={{
                                background: LEVEL_COLORS[level.level] || '#666',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                fontWeight: 600
                            }}>
                                Level {level.level}
                            </span>
                            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                {level.name[language]}
                            </span>
                            <span style={{ color: '#888', marginLeft: 'auto', fontSize: '0.9rem' }}>
                                {level.estimatedTime}
                            </span>
                        </button>

                        {/* Level Content (Modules) */}
                        {expandedLevels.has(level.level) && (
                            <div style={{ padding: '0 16px 16px' }}>
                                <p style={{ color: '#888', margin: '12px 0', fontSize: '0.95rem' }}>
                                    {level.description[language]}
                                </p>

                                {level.modules.map((mod) => (
                                    <div key={mod.id} style={{ marginTop: '12px' }}>
                                        {/* Module Header */}
                                        <button
                                            onClick={() => toggleModule(mod.id)}
                                            style={{
                                                width: '100%',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid #333',
                                                borderRadius: '8px',
                                                padding: '12px 16px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                color: 'white',
                                                fontFamily: 'inherit'
                                            }}
                                        >
                                            <span style={{
                                                transform: expandedModules.has(mod.id) ? 'rotate(90deg)' : 'rotate(0)',
                                                transition: 'transform 0.2s',
                                                fontSize: '0.8rem'
                                            }}>
                                                {'\u25B6'}
                                            </span>
                                            <span style={{ fontWeight: 500 }}>
                                                {mod.name[language]}
                                            </span>
                                            <span style={{
                                                color: '#888',
                                                marginLeft: 'auto',
                                                fontSize: '0.85rem'
                                            }}>
                                                {mod.lessonCount} {language === 'en' ? 'lessons' : 'leksjoner'}
                                            </span>
                                        </button>

                                        {/* Lessons List */}
                                        {expandedModules.has(mod.id) && (
                                            <div style={{
                                                marginTop: '8px',
                                                marginLeft: '20px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '6px'
                                            }}>
                                                {mod.lessons.map((lesson) => {
                                                    const isCompleted = completedLessons.has(lesson.id);
                                                    return (
                                                        <button
                                                            key={lesson.id}
                                                            onClick={() => openLesson(lesson.id)}
                                                            style={{
                                                                background: isCompleted
                                                                    ? 'rgba(129, 182, 76, 0.1)'
                                                                    : 'rgba(255,255,255,0.02)',
                                                                border: isCompleted
                                                                    ? '1px solid rgba(129, 182, 76, 0.3)'
                                                                    : '1px solid #2a2a2a',
                                                                borderRadius: '6px',
                                                                padding: '10px 14px',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '10px',
                                                                color: 'white',
                                                                fontFamily: 'inherit',
                                                                textAlign: 'left'
                                                            }}
                                                        >
                                                            {isCompleted ? (
                                                                <span style={{ color: '#81b64c' }}>{'\u2714'}</span>
                                                            ) : (
                                                                <span style={{
                                                                    width: '16px',
                                                                    height: '16px',
                                                                    border: '2px solid #444',
                                                                    borderRadius: '50%'
                                                                }} />
                                                            )}
                                                            {lesson.piece && (
                                                                <span style={{ fontSize: '1.2rem' }}>
                                                                    {PIECE_ICONS[lesson.piece] || ''}
                                                                </span>
                                                            )}
                                                            <span style={{ flex: 1 }}>
                                                                {lesson.title[language]}
                                                            </span>
                                                            <span style={{
                                                                color: '#666',
                                                                fontSize: '0.85rem'
                                                            }}>
                                                                {lesson.duration} min
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Start Learning CTA */}
            {getCompletedCount() === 0 && levels.length > 0 && (
                <div style={{
                    marginTop: '30px',
                    textAlign: 'center'
                }}>
                    <button
                        onClick={() => socket.emit('get_first_lesson')}
                        style={{
                            background: '#81b64c',
                            border: 'none',
                            color: 'white',
                            padding: '16px 32px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '1.2rem',
                            fontWeight: 600
                        }}
                    >
                        {language === 'en' ? 'Start Learning!' : 'Begynn å lære!'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default LessonsMode;
