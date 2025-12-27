import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useIsMobile } from '../hooks/useMediaQuery';

interface Condition {
  name: string;
  met: boolean;
  description?: string;
}

interface MoveExplanationData {
  moveIndex: number;
  move: string;
  from: string;
  to: string;
  piece: string;
  krog: {
    formula: string;
    operator: string;
    tType: string;
    rType: string;
    rTypeDescription: { en: string; no: string };
  };
  fide: {
    article: string;
    en: string;
    no: string;
  };
  explanation: {
    en: string;
    no: string;
  };
  conditions: Condition[];
}

interface MoveExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MoveExplanationData | null;
  language: 'en' | 'no';
  socket?: Socket;
}

// FIDE articles for common moves (expanded from existing patterns)
const FIDE_ARTICLES: Record<string, { article: string; en: string; no: string }> = {
  'k': { article: '3.8', en: 'The king may move to an adjoining square not attacked by opponent pieces', no: 'Kongen kan flytte til et tilstotende felt som ikke er angrepet av motstanderens brikker' },
  'q': { article: '3.4', en: 'The queen may move to any square along the file, rank or diagonal on which it stands', no: 'Dronningen kan flytte til et hvilket som helst felt langs linjen, raden eller diagonalen den star pa' },
  'r': { article: '3.3', en: 'The rook may move to any square along the file or rank on which it stands', no: 'Tarnet kan flytte til et hvilket som helst felt langs linjen eller raden det star pa' },
  'b': { article: '3.2', en: 'The bishop may move to any square along a diagonal on which it stands', no: 'Loperen kan flytte til et hvilket som helst felt langs en diagonal den star pa' },
  'n': { article: '3.6', en: 'The knight may move to one of the squares nearest to that on which it stands but not on the same rank, file or diagonal', no: 'Springeren kan flytte til et av de narmeste feltene som ikke er pa samme rad, linje eller diagonal' },
  'p': { article: '3.7', en: 'The pawn may move forward to the square immediately in front of it on the same file', no: 'Bonden kan flytte fremover til feltet rett foran pa samme linje' }
};

// Operator descriptions
const OPERATOR_DESCRIPTIONS: Record<string, { en: string; no: string }> = {
  'P': { en: 'Permitted (may do)', no: 'Tillatt (kan gjore)' },
  'O': { en: 'Obligated (must do)', no: 'Pakrevd (ma gjore)' },
  'F': { en: 'Forbidden (must not do)', no: 'Forbudt (kan ikke gjore)' }
};

export default function MoveExplanationModal({ isOpen, onClose, data, language, socket }: MoveExplanationModalProps) {
  const [showCopied, setShowCopied] = useState(false);
  const hasTrackedView = useRef(false);
  const isMobile = useIsMobile();

  // Track view when modal opens
  useEffect(() => {
    if (isOpen && data && socket && !hasTrackedView.current) {
      socket.emit('track_krog_view', {
        rType: data.krog.rType,
        operator: data.krog.operator,
        moveSan: data.move
      });
      hasTrackedView.current = true;
    }
    // Reset tracking flag when modal closes
    if (!isOpen) {
      hasTrackedView.current = false;
    }
  }, [isOpen, data, socket]);

  if (!isOpen || !data) return null;

  const moveNumber = Math.floor(data.moveIndex / 2) + 1;
  const isWhiteMove = data.moveIndex % 2 === 0;
  const moveLabel = `${moveNumber}${isWhiteMove ? '.' : '...'} ${data.move}`;

  // Get FIDE article info
  const fideInfo = data.fide?.article
    ? data.fide
    : FIDE_ARTICLES[data.piece] || FIDE_ARTICLES['p'];

  // Get operator description
  const operatorDesc = OPERATOR_DESCRIPTIONS[data.krog.operator] || OPERATOR_DESCRIPTIONS['P'];

  const generateShareText = () => {
    return `KROG Chess - Move Explanation

Move ${moveNumber}: ${data.move}
Formula: ${data.krog.formula}
Rule Type: ${data.krog.rType.replace(/_/g, ' ')}
FIDE Article ${fideInfo.article}

${language === 'en' ? data.explanation.en : data.explanation.no}
${language === 'no' ? data.explanation.en : data.explanation.no}

Learn chess with KROG formulas!`;
  };

  const handleShare = async () => {
    const shareText = generateShareText();

    // Try Web Share API first (works better on mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'KROG Chess - Move Explanation',
          text: shareText
        });
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      } catch (err) {
        // User cancelled or error - try clipboard fallback
        if ((err as Error).name !== 'AbortError') {
          fallbackCopy(shareText);
        }
      }
    } else {
      fallbackCopy(shareText);
    }

    // Track share event
    if (socket && data) {
      socket.emit('track_krog_share', {
        rType: data.krog.rType,
        operator: data.krog.operator,
        moveSan: data.move
      });
    }
  };

  const fallbackCopy = (text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      }).catch(() => {
        // Final fallback using textarea
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      });
    } else {
      // Final fallback using textarea
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? 0 : undefined
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: isMobile ? '16px 16px 0 0' : '12px',
          border: isMobile ? 'none' : '1px solid #333',
          maxWidth: isMobile ? '100%' : '500px',
          width: isMobile ? '100%' : '90%',
          maxHeight: isMobile ? '90vh' : '85vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          WebkitOverflowScrolling: 'touch'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: isMobile ? '14px 16px' : '16px 20px',
            borderBottom: '1px solid #333',
            background: 'linear-gradient(180deg, #252525 0%, #1a1a1a 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '12px' }}>
            <span style={{ fontSize: isMobile ? '1.3rem' : '1.5rem' }}>
              {data.piece === 'k' ? (isWhiteMove ? '♔' : '♚') :
               data.piece === 'q' ? (isWhiteMove ? '♕' : '♛') :
               data.piece === 'r' ? (isWhiteMove ? '♖' : '♜') :
               data.piece === 'b' ? (isWhiteMove ? '♗' : '♝') :
               data.piece === 'n' ? (isWhiteMove ? '♘' : '♞') :
               (isWhiteMove ? '♙' : '♟')}
            </span>
            <span style={{ fontSize: isMobile ? '1.05rem' : '1.2rem', fontWeight: 600, color: '#fff' }}>
              {moveLabel}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              fontSize: isMobile ? '1.3rem' : '1.5rem',
              cursor: 'pointer',
              padding: isMobile ? '8px' : '4px 8px',
              borderRadius: '4px',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
          >
            ✕
          </button>
        </div>

        {/* KROG Formula */}
        <div style={{ padding: isMobile ? '14px 16px' : '16px 20px', borderBottom: '1px solid #333' }}>
          <div style={{
            fontWeight: 600,
            marginBottom: isMobile ? '10px' : '12px',
            color: '#81b64c',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            KROG Formula
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: isMobile ? '0.85rem' : '1rem',
              color: '#81b64c',
              backgroundColor: 'rgba(129, 182, 76, 0.1)',
              padding: isMobile ? '10px 12px' : '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(129, 182, 76, 0.2)',
              lineHeight: 1.5,
              wordBreak: 'break-word',
              overflowX: 'auto'
            }}
          >
            {data.krog.formula}
          </div>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '8px' : '16px',
            marginTop: isMobile ? '10px' : '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ color: '#aaa', fontSize: isMobile ? '0.85rem' : '0.9rem' }}>
              <span style={{ color: '#666' }}>{language === 'en' ? 'Operator' : 'Operator'}:</span>{' '}
              <span style={{ color: '#81b64c', fontWeight: 500 }}>{data.krog.operator}</span>
              <span style={{ color: '#888' }}> ({operatorDesc[language]})</span>
            </div>
            <div style={{ color: '#aaa', fontSize: isMobile ? '0.85rem' : '0.9rem' }}>
              <span style={{ color: '#666' }}>T-Type:</span>{' '}
              <span style={{ color: '#81b64c', fontWeight: 500 }}>{data.krog.tType}</span>
            </div>
          </div>
        </div>

        {/* R-Type Badge */}
        <div style={{ padding: isMobile ? '14px 16px' : '16px 20px', borderBottom: '1px solid #333' }}>
          <div style={{
            fontWeight: 600,
            marginBottom: isMobile ? '8px' : '10px',
            color: '#9b59b6',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {language === 'en' ? 'Rule Type' : 'Regeltype'}
          </div>
          <div
            style={{
              display: 'inline-block',
              backgroundColor: 'rgba(155, 89, 182, 0.15)',
              color: '#9b59b6',
              padding: isMobile ? '6px 12px' : '8px 14px',
              borderRadius: '6px',
              fontWeight: 500,
              fontSize: isMobile ? '0.85rem' : '0.95rem'
            }}
          >
            {data.krog.rType.replace(/_/g, ' ')}
          </div>
          <div style={{ color: '#ccc', marginTop: '8px', fontSize: isMobile ? '0.85rem' : '0.9rem', lineHeight: 1.5 }}>
            {data.krog.rTypeDescription[language]}
          </div>
        </div>

        {/* Explanation */}
        <div style={{ padding: isMobile ? '14px 16px' : '16px 20px', borderBottom: '1px solid #333' }}>
          <div style={{
            fontWeight: 600,
            marginBottom: isMobile ? '10px' : '12px',
            color: '#ddd',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {language === 'en' ? 'Explanation' : 'Forklaring'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '10px' }}>
            <div style={{ display: 'flex', gap: isMobile ? '8px' : '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: isMobile ? '1rem' : '1.1rem', flexShrink: 0 }}>&#127468;&#127463;</span>
              <span style={{ color: '#ddd', lineHeight: 1.5, fontSize: isMobile ? '0.9rem' : '1rem' }}>{data.explanation.en}</span>
            </div>
            <div style={{ display: 'flex', gap: isMobile ? '8px' : '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: isMobile ? '1rem' : '1.1rem', flexShrink: 0 }}>&#127475;&#127476;</span>
              <span style={{ color: '#bbb', lineHeight: 1.5, fontSize: isMobile ? '0.9rem' : '1rem' }}>{data.explanation.no}</span>
            </div>
          </div>
        </div>

        {/* Conditions */}
        {data.conditions && data.conditions.length > 0 && (
          <div style={{ padding: isMobile ? '14px 16px' : '16px 20px', borderBottom: '1px solid #333' }}>
            <div style={{
              fontWeight: 600,
              marginBottom: isMobile ? '10px' : '12px',
              color: '#ddd',
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {language === 'en' ? 'Conditions' : 'Betingelser'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '6px' : '8px' }}>
              {data.conditions.map((condition, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '4px' : '6px',
                    backgroundColor: condition.met ? 'rgba(129, 182, 76, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                    color: condition.met ? '#81b64c' : '#e74c3c',
                    padding: isMobile ? '5px 10px' : '6px 12px',
                    borderRadius: '6px',
                    fontSize: isMobile ? '0.75rem' : '0.85rem',
                    fontFamily: 'monospace'
                  }}
                  title={condition.description}
                >
                  <span>{condition.met ? '✓' : '✗'}</span>
                  <span>{condition.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FIDE Rules */}
        <div style={{ padding: isMobile ? '14px 16px' : '16px 20px', borderBottom: '1px solid #333' }}>
          <div style={{
            fontWeight: 600,
            marginBottom: isMobile ? '10px' : '12px',
            color: '#4a90d9',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            FIDE {language === 'en' ? 'Rules' : 'Regler'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '12px' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: isMobile ? '1rem' : '1.1rem', flexShrink: 0 }}>&#127475;&#127476;</span>
                <span style={{ fontWeight: 600, color: '#4a90d9', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                  &sect;{fideInfo.article}
                </span>
              </div>
              <div style={{ color: '#bbb', fontSize: isMobile ? '0.85rem' : '0.9rem', paddingLeft: isMobile ? '24px' : '28px', lineHeight: 1.5 }}>
                {fideInfo.no}
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: isMobile ? '1rem' : '1.1rem', flexShrink: 0 }}>&#127468;&#127463;</span>
                <span style={{ fontWeight: 600, color: '#4a90d9', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                  Article {fideInfo.article}
                </span>
              </div>
              <div style={{ color: '#bbb', fontSize: isMobile ? '0.85rem' : '0.9rem', paddingLeft: isMobile ? '24px' : '28px', lineHeight: 1.5 }}>
                {fideInfo.en}
              </div>
            </div>
          </div>
        </div>

        {/* Share Button */}
        <div style={{ padding: isMobile ? '14px 16px 80px 16px' : '16px 20px' }}>
          <button
            onClick={handleShare}
            style={{
              width: '100%',
              padding: isMobile ? '12px' : '14px',
              backgroundColor: showCopied ? '#81b64c' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              minHeight: '48px'
            }}
            onMouseEnter={(e) => {
              if (!showCopied) e.currentTarget.style.backgroundColor = '#444';
            }}
            onMouseLeave={(e) => {
              if (!showCopied) e.currentTarget.style.backgroundColor = '#333';
            }}
          >
            {showCopied ? (
              <>
                <span>✓</span>
                <span>{language === 'en' ? 'Copied!' : 'Kopiert!'}</span>
              </>
            ) : (
              <>
                <span>📋</span>
                <span>{language === 'en' ? 'Share Explanation' : 'Del forklaring'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
