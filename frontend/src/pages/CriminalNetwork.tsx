import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, Car, Phone, MapPin, Briefcase, Building, Shield,
  AlertTriangle, Search, ZoomIn, ZoomOut, Maximize2, Filter,
  RotateCcw, Activity
} from 'lucide-react';
import cytoscape from 'cytoscape';
import { networkApi } from '../mockApi';
import { GlassCard, StatusBadge, SkeletonPanel } from '../components/ui';
import { useUIStore } from '../context/uiStore';
import type { NetworkNode } from '../types';
import { MOCK_FIRS } from '../mockApi/mockData';
import CriminalProfileModal from '../components/CriminalProfileModal';

/* ── Colour + icon map ─────────────────────────────────────────────── */
const NODE_COLORS: Record<string, string> = {
  Person:       '#3B82F6',
  Vehicle:      '#F59E0B',
  Phone:        '#10B981',
  Weapon:       '#EF4444',
  Evidence:     '#A78BFA',
  Location:     '#8B5CF6',
  Case:         '#14B8A6',
  Organization: '#EC4899',
};

const NODE_ICONS: Record<string, React.ReactNode> = {
  Person:       <User size={14} />,
  Vehicle:      <Car size={14} />,
  Phone:        <Phone size={14} />,
  Weapon:       <Shield size={14} />,
  Location:     <MapPin size={14} />,
  Case:         <Briefcase size={14} />,
  Organization: <Building size={14} />,
  Evidence:     <AlertTriangle size={14} />,
};

/* ── Node Detail Drawer ─────────────────────────────────────────────── */
function NodeDrawer({ node, neighbors, onClose, onProfileClick }: {
  node: NetworkNode;
  neighbors: NetworkNode[];
  onClose: () => void;
  onProfileClick: (name: string) => void;
}) {
  const { language } = useUIStore();
  const isKn = language === 'kn';

  const firs = node.type === 'Person'
    ? MOCK_FIRS.filter(f => node.data.linkedFIRs?.includes(f.id)).slice(0, 5)
    : [];

  const genderVal = node.data.gender === 'Male' 
    ? (isKn ? 'ಪುರುಷ' : 'Male') 
    : node.data.gender === 'Female' 
    ? (isKn ? 'ಮಹಿಳೆ' : 'Female') 
    : node.data.gender;

  const roleVal = node.data.role === 'Suspect' 
    ? (isKn ? 'ಶಂಕಿತ' : 'Suspect')
    : node.data.role === 'Witness'
    ? (isKn ? 'ಸಾಕ್ಷಿ' : 'Witness')
    : node.data.role === 'Victim'
    ? (isKn ? 'ಸಂತ್ರಸ್ತರು' : 'Victim')
    : node.data.role;

  const fields: { label: string; value: any }[] = (() => {
    if (node.type === 'Person') return [
      { label: isKn ? 'ವಯಸ್ಸು' : 'Age',     value: node.data.age ? `${node.data.age} ${isKn ? 'ವರ್ಷ' : 'years'}` : undefined },
      { label: isKn ? 'ಲಿಂಗ' : 'Gender',  value: genderVal },
      { label: isKn ? 'ಪಾತ್ರ' : 'Role',    value: roleVal },
      { label: isKn ? 'ಜಿಲ್ಲೆ' : 'District', value: node.data.district },
      { label: isKn ? 'ದೂರವಾಣಿ' : 'Phone',   value: node.data.phone },
      { label: isKn ? 'ವಿಳಾಸ' : 'Address', value: node.data.address },
    ].filter(f => f.value);
    if (node.type === 'Vehicle') return [
      { label: isKn ? 'ನೋಂದಣಿ ಸಂಖ್ಯೆ' : 'Registration Number', value: node.label },
      { label: isKn ? 'ತಯಾರಕರು' : 'Make',    value: node.data.make },
      { label: isKn ? 'ಮಾದರಿ' : 'Model',   value: node.data.model },
      { label: isKn ? 'ಬಣ್ಣ' : 'Color',   value: node.data.color },
      { label: isKn ? 'ಸ್ಥಿತಿ' : 'Status',  value: node.data.status },
      { label: isKn ? 'ಮಾಲೀಕರು' : 'Owner',   value: node.data.ownerName },
    ].filter(f => f.value);
    return [{ label: isKn ? 'ವಿವರಣೆ' : 'Description', value: node.data.description }].filter(f => f.value);
  })();

  const typeLabels: Record<string, string> = {
    Person: isKn ? 'ವ್ಯಕ್ತಿ' : 'Person',
    Vehicle: isKn ? 'ವಾಹನ' : 'Vehicle',
    Phone: isKn ? 'ದೂರವಾಣಿ' : 'Phone',
    Weapon: isKn ? 'ಆಯುಧ' : 'Weapon',
    Evidence: isKn ? 'ಸಾಕ್ಷ್ಯ' : 'Evidence',
    Location: isKn ? 'ಸ್ಥಳ' : 'Location',
    Case: isKn ? 'ಪ್ರಕರಣ' : 'Case',
    Organization: isKn ? 'ಸಂಸ್ಥೆ' : 'Organization',
  };

  const statusMap: Record<string, string> = {
    'Critical': isKn ? 'ಅತಿ ಗಂಭೀರ' : 'Critical',
    'High': isKn ? 'ಹೆಚ್ಚು' : 'High',
    'Medium': isKn ? 'ಮಧ್ಯಮ' : 'Medium',
    'Low': isKn ? 'ಕಡಿಮೆ' : 'Low',
  };

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-full sm:w-96 bg-[var(--surface)] border-l border-[var(--border)] z-50 overflow-y-auto shadow-2xl">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: NODE_COLORS[node.type] + '22', border: `1px solid ${NODE_COLORS[node.type]}44` }}>
            <span style={{ color: NODE_COLORS[node.type] }}>{NODE_ICONS[node.type]}</span>
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--text)]">{node.label}</div>
            <div className="text-xs text-[var(--text-muted)]">{typeLabels[node.type] ?? node.type}</div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Risk Score */}
        {node.riskScore !== undefined && (
          <div>
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">{isKn ? 'ಅಪಾಯದ ಪ್ರಮಾಣ' : 'Risk Score'}</div>
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-bold tabular-nums ${node.riskScore >= 80 ? 'text-[var(--danger)]' : node.riskScore >= 60 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
                {node.riskScore}
              </div>
              <div className="flex-1">
                <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${node.riskScore >= 80 ? 'bg-[var(--danger)]' : node.riskScore >= 60 ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'}`}
                    style={{ width: `${node.riskScore}%` }} />
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  {node.riskScore >= 80 
                    ? (isKn ? '🔴 ಅಧಿಕ ಅಪಾಯ' : '🔴 High Risk') 
                    : node.riskScore >= 60 
                    ? (isKn ? '🟡 ಮಧ್ಯಮ ಅಪಾಯ' : '🟡 Medium Risk') 
                    : (isKn ? '🟢 ಕಡಿಮೆ ಅಪಾಯ' : '🟢 Low Risk')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fields */}
        {fields.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">{isKn ? 'ವಿವರಗಳು' : 'Details'}</div>
            <div className="grid grid-cols-1 gap-2">
              {fields.map(({ label, value }) => (
                <div key={label} className="bg-[var(--surface-2)] rounded-xl px-3 py-2.5 border border-[var(--border)]">
                  <div className="text-[10px] text-gray-500 mb-0.5">{label.toUpperCase()}</div>
                  <div className="text-sm text-[var(--text)]">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connected FIRs */}
        {firs.length > 0 && (
          <div>
            <div className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-wide">{isKn ? 'ಸಂಬಂಧಿತ FIR ಗಳು' : 'Connected FIRs'} ({firs.length})</div>
            <div className="space-y-2">
              {firs.map(f => (
                <div key={f.id} className="flex items-center gap-2 px-3 py-2.5 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                  <AlertTriangle size={12} className="text-[var(--warning)] flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-mono text-[var(--accent)]">{f.firNumber}</div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">{f.crimeType} · {f.location}</div>
                  </div>
                  <StatusBadge status={statusMap[f.severity] ?? f.severity} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Neighboring Nodes */}
        {neighbors.length > 0 && (
          <div>
            <div className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-wide">{isKn ? 'ಸಂಪರ್ಕಿತ ನೋಡ್‌ಗಳು' : 'Connected Nodes'} ({neighbors.length})</div>
            <div className="space-y-1.5">
              {neighbors.map(n => (
                <div key={n.id} className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: NODE_COLORS[n.type] ?? '#6B7280' }} />
                  <span className="text-xs text-[var(--text)] truncate">{n.label}</span>
                  <span className="ml-auto text-[10px] text-[var(--text-muted)]">{typeLabels[n.type] ?? n.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {node.data?.description && (
          <div>
            <div className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wide">{isKn ? 'ಟಿಪ್ಪಣಿಗಳು' : 'Notes'}</div>
            <div className="text-sm text-[var(--text)] bg-[var(--surface-2)] rounded-xl p-3 border border-[var(--border)]">{node.data.description}</div>
          </div>
        )}

        {/* Statistics */}
        <div>
          <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">{isKn ? 'ಅಂಕಿಅಂಶಗಳು' : 'Statistics'}</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: isKn ? 'ಸಂಪರ್ಕಗಳು' : 'Connections', value: neighbors.length },
              { label: isKn ? 'FIR ಗಳು' : 'FIRs', value: firs.length },
              { label: isKn ? 'ಅಪಾಯ' : 'Risk', value: node.riskScore ?? (isKn ? 'ಲಭ್ಯವಿಲ್ಲ' : 'N/A') },
            ].map(s => (
              <div key={s.label} className="bg-[var(--surface-2)] rounded-xl p-2.5 border border-[var(--border)] text-center">
                <div className="text-xs text-gray-500">{s.label}</div>
                <div className="text-lg font-bold text-[var(--text)] mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {node.type === 'Person' && (
          <div className="pt-2 border-t border-[var(--border)]">
            <button onClick={() => onProfileClick(node.label)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all">
              {isKn ? 'ಕ್ರಿಮಿನಲ್ ಪ್ರೊಫೈಲ್ ವೀಕ್ಷಿಸಿ' : 'View Criminal Profile'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function CriminalNetwork() {
  const { theme, language } = useUIStore();
  const isKn = language === 'kn';

  const cyRef       = useRef<HTMLDivElement>(null);
  const cyInst      = useRef<any>(null);
  const [selectedNode,    setSelectedNode]    = useState<NetworkNode | null>(null);
  const [neighborNodes,   setNeighborNodes]   = useState<NetworkNode[]>([]);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [activeTypes,     setActiveTypes]     = useState<Set<string>>(new Set(Object.keys(NODE_COLORS)));
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['network'], queryFn: networkApi.getGraph });

  /* ── Build Cytoscape graph ───────────────────────────────────────── */
  useEffect(() => {
    if (!data || !cyRef.current) return;

    if (cyInst.current) { cyInst.current.destroy(); cyInst.current = null; }

    // Calculate node degree (centrality) for dynamic sizing
    const degrees: Record<string, number> = {};
    data.nodes.forEach(n => degrees[n.id] = 0);
    data.edges.forEach(e => {
      if (degrees[e.source] !== undefined) degrees[e.source]++;
      if (degrees[e.target] !== undefined) degrees[e.target]++;
    });

    const cy = cytoscape({
      container: cyRef.current,
      elements: [
        ...data.nodes.map(n => {
          const degree = degrees[n.id] || 0;
          // Base size + bonus for being highly connected
          const size = (n.type === 'Person' ? 42 : n.type === 'Case' ? 38 : 32) + (degree * 3);
          return {
            data: {
              id:     n.id,
              label:  n.label.length > 16 ? n.label.slice(0, 15) + '…' : n.label,
              type:   n.type,
              color:  NODE_COLORS[n.type] ?? '#6B7280',
              size:   Math.min(size, 90), // Cap size to avoid massive nodes
              _node:  n,
            }
          };
        }),
        ...data.edges.map(e => ({
          data: { id: e.id, source: e.source, target: e.target, label: e.label }
        })),
      ],
      style: [
        {
          selector: 'node',
          style: {
            'background-color':   'data(color)',
            'background-opacity': 0.85,
            'border-color':       'data(color)',
            'border-width':       2,
            'border-opacity':     0.5,
            'label':              'data(label)',
            'color':              theme === 'light' ? '#1F2937' : '#F9FAFB',
            'font-size':          '10px',
            'font-family':        'Raleway, Inter, sans-serif',
            'text-valign':        'bottom',
            'text-margin-y':      5,
            'width':              'data(size)',
            'height':             'data(size)',
            'transition-property': 'background-color, border-color, border-width',
            'transition-duration': 0.2,
          }
        },
        {
          selector: 'edge',
          style: {
            'width':            1.5,
            'line-color':       theme === 'light' ? '#D1D5DB' : '#1F2D40',
            'target-arrow-color': theme === 'light' ? '#D1D5DB' : '#1F2D40',
            'target-arrow-shape': 'triangle',
            'curve-style':      'bezier',
            'label':            'data(label)',
            'color':            '#6B7280',
            'font-size':        '8px',
            'text-background-opacity': 0.7,
            'text-background-color': theme === 'light' ? '#EEF2F7' : '#0d1b2a',
            'text-background-padding': '2px',
          }
        },
        {
          selector: '.highlighted',
          style: {
            'background-opacity': 1.0,
            'border-color':       theme === 'light' ? '#1F2937' : '#FFF',
            'border-width':       3,
            'border-opacity':     1.0,
          }
        },
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.25
          }
        }
      ],
      layout: {
        name: 'cose',
        idealEdgeLength: () => 80,
        nodeOverlap: 20,
        refresh: 20,
        fit: true,
        padding: 40,
        randomize: true,
        componentSpacing: 60,
        nodeRepulsion: () => 300000,
        edgeElasticity: () => 150,
        nestingFactor: 5,
        gravity: 120, // Increase gravity to pull nodes closer and reduce empty space
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0,
      } as any
    });

    cy.on('tap', 'node', (evt) => {
      const nodeData = evt.target.data('_node');
      const neighbors = evt.target.neighborhood().nodes().map((n: any) => n.data('_node'));
      setSelectedNode(nodeData);
      setNeighborNodes(neighbors);

      // Visual feedback: dim all, highlight target and neighborhood
      cy.elements().addClass('dimmed').removeClass('highlighted');
      evt.target.removeClass('dimmed').addClass('highlighted');
      evt.target.neighborhood().removeClass('dimmed');
      
      // Highlight connected edges
      evt.target.connectedEdges().removeClass('dimmed').addClass('highlighted');
    });

    cy.on('tap', (evt) => {
      // Click on background removes selection
      if (evt.target === cy) {
        setSelectedNode(null);
        cy.elements().removeClass('dimmed highlighted');
      }
    });

    cyInst.current = cy;
  }, [data, theme]);

  /* ── Search highlighting ─────────────────────────────────────────── */
  useEffect(() => {
    const cy = cyInst.current;
    if (!cy) return;
    if (!searchQuery.trim()) {
      cy.elements().removeClass('dimmed highlighted');
      return;
    }
    const q = searchQuery.toLowerCase();
    cy.nodes().forEach((n: any) => {
      const label = n.data('label').toLowerCase();
      if (label.includes(q)) {
        n.removeClass('dimmed').addClass('highlighted');
      } else {
        n.addClass('dimmed').removeClass('highlighted');
      }
    });
  }, [searchQuery]);

  /* ── Type filter toggle ──────────────────────────────────────────── */
  const toggleType = useCallback((type: string) => {
    const cy = cyInst.current;
    if (!cy) return;
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
        cy.nodes(`[type="${type}"]`).style('display', 'none');
        cy.edges().filter((e: any) =>
          cy.nodes(`[type="${type}"]`).has(e.source()) || cy.nodes(`[type="${type}"]`).has(e.target())
        ).style('display', 'none');
      } else {
        next.add(type);
        cy.nodes(`[type="${type}"]`).style('display', 'element');
        cy.edges().style('display', 'element');
      }
      return next;
    });
  }, []);

  /* ── Zoom controls ───────────────────────────────────────────────── */
  const zoomIn  = () => cyInst.current?.zoom(cyInst.current.zoom() * 1.3);
  const zoomOut = () => cyInst.current?.zoom(cyInst.current.zoom() / 1.3);
  const fitAll  = () => cyInst.current?.fit(50);
  const _reset  = () => { cyInst.current?.reset(); setSearchQuery(''); cy?.elements().removeClass('dimmed highlighted'); };
  const cy      = cyInst.current;

  const typeLabels: Record<string, string> = {
    Person: isKn ? 'ವ್ಯಕ್ತಿ' : 'Person',
    Vehicle: isKn ? 'ವಾಹನ' : 'Vehicle',
    Phone: isKn ? 'ದೂರವಾಣಿ' : 'Phone',
    Weapon: isKn ? 'ಆಯುಧ' : 'Weapon',
    Evidence: isKn ? 'ಸಾಕ್ಷ್ಯ' : 'Evidence',
    Location: isKn ? 'ಸ್ಥಳ' : 'Location',
    Case: isKn ? 'ಪ್ರಕರಣ' : 'Case',
    Organization: isKn ? 'ಸಂಸ್ಥೆ' : 'Organization',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">{isKn ? 'ಕ್ರಿಮಿನಲ್ ನೆಟ್‌ವರ್ಕ್ ಗ್ರಾಫ್' : 'Criminal Network Graph'}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{isKn ? 'ಸಂಬಂಧಗಳ ಅನ್ವೇಷಕ — ತನಿಖೆ ಮಾಡಲು ಯಾವುದೇ ನೋಡ್ ಕ್ಲಿಕ್ ಮಾಡಿ' : 'Relationship intelligence explorer — click any node to investigate'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isKn ? 'ನೋಡ್‌ಗಳನ್ನು ಹುಡುಕಿ…' : 'Search nodes...'}
              className="bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] rounded-xl pl-8 pr-3 py-2 w-48 focus:border-[var(--accent)] transition-colors"
            />
          </div>
          <button onClick={zoomIn}  title={isKn ? 'ಝೂಮ್ ಇನ್' : 'Zoom In'}  className="p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"><ZoomIn size={15} /></button>
          <button onClick={zoomOut} title={isKn ? 'ಝೂಮ್ ಔಟ್' : 'Zoom Out'} className="p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"><ZoomOut size={15} /></button>
          <button onClick={fitAll}  title={isKn ? 'ಫಿಟ್ ಮಾಡಿ' : 'Fit All'}  className="p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"><Maximize2 size={15} /></button>
          <button onClick={() => { setSearchQuery(''); cyInst.current?.elements().removeClass('dimmed highlighted'); }} title={isKn ? 'ಪುನರ್ಹೊಂದಿಸಿ' : 'Reset'} className="p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"><RotateCcw size={15} /></button>
        </div>
      </div>

      {/* Legend + filter toggles */}
      <GlassCard padding={false}>
        <div className="p-3 flex flex-wrap gap-2 items-center">
          <Filter size={13} className="text-gray-500 flex-shrink-0" />
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <button key={type} onClick={() => toggleType(type)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-all ${
                activeTypes.has(type)
                  ? 'text-white border-transparent'
                  : 'text-gray-500 border-dashed border-[#1F2D40] opacity-50'
              }`}
              style={{ background: activeTypes.has(type) ? color + '22' : 'transparent', borderColor: activeTypes.has(type) ? color + '44' : undefined }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              {typeLabels[type] ?? type}
            </button>
          ))}
          <div className="ml-auto text-[10px] text-[var(--text-muted)] hidden md:block">
            <Activity size={10} className="inline mr-1 text-[var(--accent)]" />
            {isKn ? 'ಕ್ಲಿಕ್ ನೋಡ್ · ಸ್ಕ್ರಾಲ್ ಮಾಡಿ ಝೂಮ್ ಮಾಡಲು · ಎಳೆಯಿರಿ ಪ್ಯಾನ್ ಮಾಡಲು' : 'Click node to inspect · scroll to zoom · drag canvas to pan'}
          </div>
        </div>
      </GlassCard>

      {/* Graph Canvas */}
      <GlassCard padding={false}>
        {isLoading ? (
          <div className="p-8"><SkeletonPanel rows={8} /></div>
        ) : (
          <div ref={cyRef} className="w-full rounded-2xl" style={{ height: 600, background: theme === 'light' ? '#EEF2F7' : '#0d1b2a' }} />
        )}
      </GlassCard>

      {/* Stats bar */}
      {data && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: isKn ? 'ಒಟ್ಟು ನೋಡ್‌ಗಳು' : 'Total Nodes', value: data.nodes.length, color: 'text-[var(--accent)]' },
            { label: isKn ? 'ಸಂಬಂಧಗಳು' : 'Relationships', value: data.edges.length, color: 'text-[var(--accent-2)]' },
            { label: isKn ? 'ವ್ಯಕ್ತಿಗಳು' : 'Persons', value: data.nodes.filter(n => n.type === 'Person').length, color: 'text-[var(--success)]' },
            { label: isKn ? 'ಸಂಸ್ಥೆಗಳು' : 'Organizations', value: data.nodes.filter(n => n.type === 'Organization').length, color: 'text-[var(--danger)]' },
          ].map(s => (
            <GlassCard key={s.label}>
              <div className="text-xs text-[var(--text-muted)]">{s.label}</div>
              <div className={`text-xl font-bold ${s.color} mt-0.5`}>{s.value}</div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Drawer overlay */}
      <AnimatePresence>
        {selectedNode && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => { setSelectedNode(null); cyInst.current?.elements().removeClass('dimmed highlighted'); }}
            />
            <NodeDrawer
              node={selectedNode}
              neighbors={neighborNodes}
              onClose={() => { setSelectedNode(null); cyInst.current?.elements().removeClass('dimmed highlighted'); }}
              onProfileClick={(name) => setSelectedSuspect(name)}
            />
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedSuspect && (
          <CriminalProfileModal suspectName={selectedSuspect} onClose={() => setSelectedSuspect(null)} isKn={isKn} />
        )}
      </AnimatePresence>
    </div>
  );
}
