import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection, 
  Edge, 
  Node, 
  ReactFlowProvider, 
  useReactFlow 
} from '@xyflow/react';

import { FlowCanvas } from '../../components/flow-builder/FlowCanvas';
import { FlowToolbar } from '../../components/flow-builder/FlowToolbar';
import { NodePalette, NodeDefinition, NODE_DEFINITIONS, CATEGORY_INFO } from '../../components/flow-builder/NodePalette';
import { NodeInspector } from '../../components/flow-builder/NodeInspector';
import { FlowSimulator } from '../../components/flow-builder/FlowSimulator';
import { MobileFlowBuilder } from '../../components/flow-builder/MobileFlowBuilder';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../contexts/ToastContext';
import { useWhatsApp } from '../../contexts/WhatsAppContext';
import { StorageService, getBackendUrl } from '../../lib/storage';
import { Flow, FlowNode, FlowEdge, FlowNodeData } from '../../types';
import { 
  Plus, 
  Edit3, 
  Link2, 
  Trash2, 
  Copy, 
  Sparkles, 
  X, 
  ChevronRight, 
  Smartphone, 
  Layout, 
  ArrowRight,
  GitBranch,
  Layers,
  Search
} from 'lucide-react';

export interface FlowEditorPageProps {
  flowId: string;
  onNavigate: (path: string) => void;
}

export const FlowEditorPageContent: React.FC<FlowEditorPageProps> = ({ flowId, onNavigate }) => {
  const { success, error: toastError, info, warning } = useToast();
  const { isConnected } = useWhatsApp();
  const { screenToFlowPosition, fitView } = useReactFlow();

  const [flow, setFlow] = useState<Flow | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [paletteWidth, setPaletteWidth] = useState(300);
  const [inspectorWidth, setInspectorWidth] = useState(380);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // View Mode: Visual Canvas by default, with option to switch to Step List
  const [isStepListView, setIsStepListView] = useState<boolean>(false);

  // Mobile Tap-to-Connect State
  const [connectingSource, setConnectingSource] = useState<{
    node: FlowNode;
    handleId?: string | null;
    handleLabel?: string;
  } | null>(null);

  // Mobile Palette Bottom Sheet Modal
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);
  const [mobilePaletteCategory, setMobilePaletteCategory] = useState<string>('all');
  const [mobilePaletteSearch, setMobilePaletteSearch] = useState<string>('');

  // Mobile Inspector Modal (Bottom Sheet Drawer)
  const [isMobileInspectorOpen, setIsMobileInspectorOpen] = useState(false);

  // Branch Selector Modal for nodes with multiple outputs (e.g. check_contact or buttons)
  const [branchSelectorNode, setBranchSelectorNode] = useState<FlowNode | null>(null);

  // Line style state
  const [edgeType, setEdgeType] = useState<'smoothstep' | 'default' | 'straight' | 'step'>('smoothstep');

  // Auto-save configuration: 'instant' | 'interval' | 'manual'
  const [autoSaveMode, setAutoSaveMode] = useState<'instant' | 'interval' | 'manual'>(() => {
    return (localStorage.getItem('7assistente_autosave_mode') as any) || 'instant';
  });
  const [autoSaveIntervalSec, setAutoSaveIntervalSec] = useState<number>(30);

  // Undo / Redo history stack
  const historyRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const debounceSaveTimerRef = useRef<any>(null);

  // Load flow data
  useEffect(() => {
    async function loadFlow() {
      setIsLoading(true);
      try {
        const flowData = await StorageService.getFlowById(flowId);
        if (!flowData) {
          toastError('Não encontrado', 'Fluxo não localizado.');
          onNavigate('/fluxos');
          return;
        }
        setFlow(flowData);

        const loadedNodes = await StorageService.getFlowNodes(flowId);
        const loadedEdges = await StorageService.getFlowEdges(flowId);

        // Sanitize any edge where targetHandle was erroneously hooked to the back/right side
        const sanitizedEdges = (loadedEdges as unknown as Edge[]).map((e) => ({
          ...e,
          targetHandle: null,
        }));

        setNodes(loadedNodes as unknown as Node[]);
        setEdges(sanitizedEdges);

        // Initialize history
        historyRef.current = [{ nodes: loadedNodes as unknown as Node[], edges: sanitizedEdges }];
        historyIndexRef.current = 0;
        setLastSavedTime(new Date());
        setIsDirty(false);
      } catch (err) {
        console.error('Error loading flow graph:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFlow();
  }, [flowId]);

  // Push history state
  const pushHistory = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    const nextIndex = historyIndexRef.current + 1;
    historyRef.current = historyRef.current.slice(0, nextIndex);
    historyRef.current.push({ nodes: newNodes, edges: newEdges });
    historyIndexRef.current = nextIndex;
    setIsDirty(true);
  }, []);

  // Save Flow to database & sync with WhatsApp
  const handleSave = useCallback(
    async (isSilent = false) => {
      if (!flow) return;
      setIsSaving(true);
      try {
        await StorageService.saveFlowGraph(
          flowId,
          nodes as unknown as FlowNode[],
          edges as unknown as FlowEdge[]
        );

        const updatedFlow = {
          ...flow,
          node_count: nodes.length,
          updated_at: new Date().toISOString(),
        };
        await StorageService.saveFlow(updatedFlow);
        setFlow(updatedFlow);
        setIsDirty(false);
        setLastSavedTime(new Date());

        if (!isSilent) {
          success('Fluxo Salvo', 'Estrutura gravada e sincronizada com sucesso.');
        }
      } catch (err: any) {
        if (!isSilent) {
          toastError('Erro ao salvar', err.message || 'Falha ao salvar o fluxo.');
        }
      } finally {
        setIsSaving(false);
      }
    },
    [flow, flowId, nodes, edges, success, toastError]
  );

  // Auto-Save Management
  const handleUpdateAutoSaveConfig = (mode: 'instant' | 'interval' | 'manual', interval: number) => {
    setAutoSaveMode(mode);
    setAutoSaveIntervalSec(interval);
    localStorage.setItem('7assistente_autosave_mode', mode);
    success('Configuração Salva', `Modo de salvamento alterado para ${mode === 'instant' ? 'Tempo Real' : mode === 'interval' ? `Intervalo (${interval}s)` : 'Manual'}.`);
  };

  // Instant Auto-Save (Debounced 600ms on change)
  useEffect(() => {
    if (autoSaveMode === 'instant' && isDirty && !isLoading) {
      if (debounceSaveTimerRef.current) clearTimeout(debounceSaveTimerRef.current);
      debounceSaveTimerRef.current = setTimeout(() => {
        handleSave(true);
      }, 600);
    }
    return () => {
      if (debounceSaveTimerRef.current) clearTimeout(debounceSaveTimerRef.current);
    };
  }, [nodes, edges, isDirty, autoSaveMode, isLoading, handleSave]);

  // Interval Auto-Save
  useEffect(() => {
    if (autoSaveMode === 'interval' && autoSaveIntervalSec > 0) {
      const timer = setInterval(() => {
        if (isDirty) {
          handleSave(true);
        }
      }, autoSaveIntervalSec * 1000);
      return () => clearInterval(timer);
    }
  }, [autoSaveMode, autoSaveIntervalSec, isDirty, handleSave]);

  // Connect edges
  const onConnect = useCallback(
    (params: Connection) => {
      const cleanParams: Connection = {
        ...params,
        targetHandle: null,
      };
      setEdges((eds) => {
        const newEdges = addEdge(
          {
            ...cleanParams,
            type: edgeType,
            animated: true,
            style: { stroke: '#06b6d4', strokeWidth: 2.5 },
          },
          eds
        );
        pushHistory(nodes, newEdges);
        return newEdges;
      });
    },
    [nodes, edgeType, setEdges, pushHistory]
  );

  // Node Click: handles both normal selection and Tap-to-Connect
  const onNodeClick = useCallback(
    (_e: React.MouseEvent, node: Node) => {
      const clickedFlowNode = node as unknown as FlowNode;

      // 1. If in Tap-to-Connect Mode: Connect source to clicked target node!
      if (connectingSource) {
        if (connectingSource.node.id === node.id) {
          warning('Conexão Inválida', 'Você não pode ligar um nó nele mesmo.');
          return;
        }

        const newEdge: Edge = {
          id: `xy-edge__${connectingSource.node.id}${connectingSource.handleId ? '-' + connectingSource.handleId : ''}-${node.id}`,
          source: connectingSource.node.id,
          target: node.id,
          sourceHandle: connectingSource.handleId || null,
          targetHandle: null,
          type: edgeType,
          animated: true,
          style: { stroke: '#06b6d4', strokeWidth: 2.5 },
        };

        setEdges((eds) => {
          const nextEdges = addEdge(newEdge, eds);
          pushHistory(nodes, nextEdges);
          return nextEdges;
        });

        success(
          'Ligação Criada',
          `Conectado: "${connectingSource.node.data.label}" ➡️ "${clickedFlowNode.data.label}".`
        );
        setConnectingSource(null);
        setSelectedNode(clickedFlowNode);
        return;
      }

      // 2. Normal Selection
      setSelectedNode(clickedFlowNode);
      setSelectedEdge(null);
    },
    [connectingSource, edgeType, nodes, setEdges, pushHistory, success, warning]
  );

  const onPaneClick = useCallback(() => {
    if (connectingSource) {
      setConnectingSource(null);
      info('Conexão Cancelada', 'Modo de ligação cancelado.');
    }
    setSelectedNode(null);
    setSelectedEdge(null);
  }, [connectingSource, info]);

  // Edge Selection and Delete
  const onEdgeClick = useCallback((_e: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) => {
        const nextEdges = eds.filter((e) => e.id !== edgeId);
        pushHistory(nodes, nextEdges);
        return nextEdges;
      });
      setSelectedEdge(null);
      info('Ligação Removida', 'A linha de conexão foi excluída do fluxo.');
    },
    [nodes, setEdges, pushHistory, info]
  );

  const onEdgeDoubleClick = useCallback(
    (_e: React.MouseEvent, edge: Edge) => {
      handleDeleteEdge(edge.id);
    },
    [handleDeleteEdge]
  );

  // Start Tap-to-Connect helper
  const handleStartConnecting = (node: FlowNode, handleId?: string | null, handleLabel?: string) => {
    const nodeType = node.data?.nodeType || node.type;

    if (nodeType === 'check_contact' && !handleId) {
      setBranchSelectorNode(node);
      return;
    }

    if (nodeType === 'buttons' && !handleId) {
      const rawButtons = node.data?.config?.buttons || [];
      if (rawButtons.length > 0) {
        setBranchSelectorNode(node);
        return;
      }
    }

    setConnectingSource({ node, handleId: handleId || null, handleLabel });
    info('Modo Conexão Ativo', `Toque no nó de destino para ligar "${node.data.label}".`);
  };

  // Spawn node helper function
  const spawnNodeAtPosition = useCallback(
    (def: NodeDefinition, position: { x: number; y: number }) => {
      const newNodeId = `node-${def.type}-${Date.now()}`;
      const newNode: Node = {
        id: newNodeId,
        type: def.type,
        position,
        data: {
          label: def.label,
          nodeType: def.type,
          description: def.description,
          isConfigured: true,
          config: { ...def.defaultConfig },
        } as FlowNodeData,
      };

      const nextNodes = [...nodes, newNode];
      setNodes(nextNodes);
      pushHistory(nextNodes, edges);
      setSelectedNode(newNode as unknown as FlowNode);
      setSelectedEdge(null);
      setIsMobilePaletteOpen(false);
      success('Nó Adicionado', `Nó "${def.label}" inserido no fluxo.`);
    },
    [nodes, edges, setNodes, pushHistory, success]
  );

  // Add new node from palette: Clicking spawns in the visual center of current viewport
  const handleAddNode = useCallback(
    (def: NodeDefinition) => {
      try {
        const position = screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
        const offsetPos = {
          x: position.x - 120 + (nodes.length % 4) * 20,
          y: position.y - 50 + (nodes.length % 4) * 20,
        };
        spawnNodeAtPosition(def, offsetPos);
      } catch (e) {
        spawnNodeAtPosition(def, { x: 250, y: 200 });
      }
    },
    [screenToFlowPosition, nodes.length, spawnNodeAtPosition]
  );

  // Drag & Drop handlers for dropping nodes anywhere on canvas
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const dataStr = event.dataTransfer.getData('application/reactflow');
      if (!dataStr) return;
      try {
        const def: NodeDefinition = JSON.parse(dataStr);
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        spawnNodeAtPosition(def, position);
      } catch (err) {
        console.error('Error onDrop:', err);
      }
    },
    [screenToFlowPosition, spawnNodeAtPosition]
  );

  // Advanced Top-to-Bottom Auto-Layout Algorithm (Hierarchical Sugiyama DAG with Zero Overlap & Straight Paths)
  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) return;

    // 1. Dynamic Height Estimator
    const getNodeHeight = (n: Node): number => {
      const type = n.data?.nodeType || n.type;
      const cfg = (n.data as any)?.config || {};
      switch (type) {
        case 'trigger':
          return 160;
        case 'message':
          return 190;
        case 'question':
          return 210;
        case 'buttons': {
          const btnCount = (cfg.buttons || []).length || 2;
          return 180 + btnCount * 45;
        }
        case 'check_contact':
          return 250;
        case 'services_catalog':
        case 'select_service':
        case 'show_services':
          return 260;
        case 'schedule_contact':
        case 'select_time_slot':
          return 250;
        case 'ask_date':
        case 'select_date':
          return 240;
        case 'confirm_booking':
          return 250;
        case 'condition':
          return 230;
        case 'variable': {
          const count = Array.isArray(cfg.assignments) ? cfg.assignments.length : 1;
          return 160 + Math.min(count, 3) * 35;
        }
        case 'ai_agent':
          return 220;
        case 'human_handoff':
          return 200;
        case 'delay':
          return 160;
        case 'media':
          return 220;
        case 'end_flow':
        case 'finish_flow':
        case 'end':
          return 180;
        default:
          return 220;
      }
    };

    const NODE_WIDTH = 340;
    const HORIZONTAL_GAP = 100; // Minimum horizontal distance between node cards
    const VERTICAL_GAP = 140; // Generous vertical distance between rows for smooth downward curves
    const START_X = 100;
    const START_Y = 80;
    const MAIN_CENTER_X = 600;

    // 2. Build Adjacency Graph
    const childrenMap = new Map<string, string[]>();
    const parentMap = new Map<string, string[]>();

    nodes.forEach((n) => {
      childrenMap.set(n.id, []);
      parentMap.set(n.id, []);
    });

    // Sort edges so branching handles (e.g. is_new vs is_existing, true vs false, btn_1 vs btn_2) preserve left-to-right order
    const sortedEdges = [...edges].sort((a, b) => {
      const hA = a.sourceHandle || '';
      const hB = b.sourceHandle || '';
      if (hA === 'is_new' || hA === 'true' || hA.includes('1') || hA.includes('new')) return -1;
      if (hB === 'is_new' || hB === 'true' || hB.includes('1') || hB.includes('new')) return 1;
      if (hA === 'is_existing' || hA === 'false' || hA.includes('2') || hA.includes('exist')) return 1;
      if (hB === 'is_existing' || hB === 'false' || hB.includes('2') || hB.includes('exist')) return -1;
      return hA.localeCompare(hB);
    });

    sortedEdges.forEach((e) => {
      if (childrenMap.has(e.source) && childrenMap.has(e.target)) {
        if (!childrenMap.get(e.source)!.includes(e.target)) {
          childrenMap.get(e.source)!.push(e.target);
        }
        if (!parentMap.get(e.target)!.includes(e.source)) {
          parentMap.get(e.target)!.push(e.source);
        }
      }
    });

    // 3. Topological Layering (Assign each node to Linha 1, Linha 2, Linha 3...)
    const roots = nodes.filter(
      (n) => (n.data?.nodeType || n.type) === 'trigger' || (parentMap.get(n.id)?.length || 0) === 0
    );
    if (roots.length === 0 && nodes.length > 0) {
      roots.push(nodes[0]);
    }

    const rankMap = new Map<string, number>();
    roots.forEach((r) => rankMap.set(r.id, 0));

    // Iterative longest-path to ensure target rank >= source rank + 1
    let changed = true;
    let iteration = 0;
    const maxIterations = nodes.length * 2;

    while (changed && iteration < maxIterations) {
      changed = false;
      iteration++;

      sortedEdges.forEach((e) => {
        const srcRank = rankMap.get(e.source);
        if (srcRank !== undefined) {
          const curTargetRank = rankMap.get(e.target) ?? -1;
          const requiredRank = srcRank + 1;
          if (requiredRank > curTargetRank && curTargetRank < maxIterations) {
            rankMap.set(e.target, requiredRank);
            changed = true;
          }
        }
      });
    }

    // Assign any unvisited orphan node to rank 0
    nodes.forEach((n) => {
      if (!rankMap.has(n.id)) {
        rankMap.set(n.id, 0);
      }
    });

    const maxRank = Math.max(...Array.from(rankMap.values()), 0);
    const rows: Node[][] = Array.from({ length: maxRank + 1 }, () => []);

    nodes.forEach((n) => {
      const r = rankMap.get(n.id) || 0;
      rows[r].push(n);
    });

    // 4. Calculate Uniform Vertical Position (Y) for each Linha (Row)
    const rowYPositions = new Map<number, number>();
    let currentY = START_Y;
    for (let r = 0; r <= maxRank; r++) {
      rowYPositions.set(r, currentY);
      const rowNodes = rows[r];
      const maxHeightInRow = rowNodes.length > 0 
        ? Math.max(...rowNodes.map(getNodeHeight))
        : 200;
      currentY += maxHeightInRow + VERTICAL_GAP;
    }

    // 5. Symmetric Horizontal (X) Positioning by Row (Linha)
    const xPositions = new Map<string, number>();

    for (let r = 0; r <= maxRank; r++) {
      const rowNodes = rows[r];
      if (rowNodes.length === 1) {
        const node = rowNodes[0];
        const parents = parentMap.get(node.id) || [];
        if (parents.length === 1 && xPositions.has(parents[0])) {
          // Keep directly aligned under single parent
          xPositions.set(node.id, xPositions.get(parents[0])!);
        } else {
          // Center on main axis
          xPositions.set(node.id, MAIN_CENTER_X - NODE_WIDTH / 2);
        }
      } else {
        // Multiple nodes in this linha: arrange symmetrically around MAIN_CENTER_X
        const totalWidth = rowNodes.length * NODE_WIDTH + (rowNodes.length - 1) * HORIZONTAL_GAP;
        let startX = MAIN_CENTER_X - totalWidth / 2;

        // Order nodes based on their parents' horizontal positions
        rowNodes.sort((a, b) => {
          const parentsA = parentMap.get(a.id) || [];
          const parentsB = parentMap.get(b.id) || [];
          const avgParentXA = parentsA.length > 0 
            ? parentsA.map((p) => xPositions.get(p) ?? MAIN_CENTER_X).reduce((s, c) => s + c, 0) / parentsA.length 
            : MAIN_CENTER_X;
          const avgParentXB = parentsB.length > 0 
            ? parentsB.map((p) => xPositions.get(p) ?? MAIN_CENTER_X).reduce((s, c) => s + c, 0) / parentsB.length 
            : MAIN_CENTER_X;
          return avgParentXA - avgParentXB;
        });

        rowNodes.forEach((node) => {
          xPositions.set(node.id, startX);
          startX += NODE_WIDTH + HORIZONTAL_GAP;
        });
      }
    }

    // 6. Forward sweep: align single-child chains directly under their parents if no conflict
    for (let r = 1; r <= maxRank; r++) {
      const rowNodes = rows[r];
      rowNodes.forEach((node) => {
        const parents = parentMap.get(node.id) || [];
        if (parents.length === 1) {
          const parentX = xPositions.get(parents[0])!;
          const wouldCollide = rowNodes.some((other) => {
            if (other.id === node.id) return false;
            const otherX = xPositions.get(other.id)!;
            return Math.abs(otherX - parentX) < NODE_WIDTH + HORIZONTAL_GAP;
          });
          if (!wouldCollide) {
            xPositions.set(node.id, parentX);
          }
        }
      });
    }

    // 7. Strict Collision Prevention: ensure minimum horizontal gap on every row
    for (let r = 0; r <= maxRank; r++) {
      const rowNodes = rows[r];
      if (rowNodes.length <= 1) continue;

      rowNodes.sort((a, b) => (xPositions.get(a.id) || 0) - (xPositions.get(b.id) || 0));

      for (let i = 1; i < rowNodes.length; i++) {
        const prevX = xPositions.get(rowNodes[i - 1].id)!;
        const curX = xPositions.get(rowNodes[i].id)!;
        const minX = prevX + NODE_WIDTH + HORIZONTAL_GAP;
        if (curX < minX) {
          xPositions.set(rowNodes[i].id, minX);
        }
      }
    }

    // 8. Global Normalization: ensure left-most coordinate is at START_X
    const allXs = Array.from(xPositions.values());
    const minX = Math.min(...allXs, START_X);
    const shiftX = minX < START_X ? START_X - minX : 0;

    const layoutedNodes: Node[] = nodes.map((n) => {
      const rank = rankMap.get(n.id) || 0;
      const posX = (xPositions.get(n.id) || START_X) + shiftX;
      const posY = rowYPositions.get(rank) || START_Y;

      return {
        ...n,
        position: { x: Math.round(posX), y: Math.round(posY) },
      };
    });

    setNodes(layoutedNodes);
    pushHistory(layoutedNodes, edges);
    success(
      'Fluxo Organizado em Linhas',
      `Fluxo organizado de cima para baixo em ${maxRank + 1} linhas perfeitamente alinhadas!`
    );

    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 });
    }, 60);
  }, [nodes, edges, setNodes, pushHistory, fitView, success]);

  // Duplicate Selected Node
  const handleDuplicateSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    const newNodeId = `node-${selectedNode.type}-${Date.now()}`;
    const duplicatedNode: Node = {
      id: newNodeId,
      type: selectedNode.type,
      position: { x: selectedNode.position.x + 40, y: selectedNode.position.y + 40 },
      data: {
        ...selectedNode.data,
        label: `${selectedNode.data.label} (Cópia)`,
      },
    };

    const nextNodes = [...nodes, duplicatedNode];
    setNodes(nextNodes);
    pushHistory(nextNodes, edges);
    setSelectedNode(duplicatedNode as unknown as FlowNode);
    success('Nó Duplicado', `Cópia criada: "${duplicatedNode.data.label}".`);
  }, [selectedNode, nodes, edges, setNodes, pushHistory, success]);

  // Delete Selected Node
  const handleDeleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    const nextNodes = nodes.filter((n) => n.id !== selectedNode.id);
    const nextEdges = edges.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id);
    setNodes(nextNodes);
    setEdges(nextEdges);
    pushHistory(nextNodes, nextEdges);
    setSelectedNode(null);
    setIsMobileInspectorOpen(false);
    info('Nó Removido', `O nó "${selectedNode.data.label}" foi excluído.`);
  }, [selectedNode, nodes, edges, setNodes, setEdges, pushHistory, info]);

  // Update node config from Inspector
  const handleUpdateConfig = useCallback(
    (nodeId: string, label: string, config: Record<string, any>) => {
      setNodes((prevNodes) => {
        const nextNodes = prevNodes.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              data: {
                ...n.data,
                label,
                config,
                isConfigured: true,
              },
            };
          }
          return n;
        });
        pushHistory(nextNodes, edges);
        return nextNodes;
      });

      setSelectedNode((prev) => {
        if (prev && prev.id === nodeId) {
          return {
            ...prev,
            data: {
              ...prev.data,
              label,
              config,
              isConfigured: true,
            },
          };
        }
        return prev;
      });
    },
    [edges, setNodes, pushHistory]
  );

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const state = historyRef.current[historyIndexRef.current];
      setNodes(state.nodes);
      setEdges(state.edges);
      setSelectedNode(null);
      setSelectedEdge(null);
      setIsDirty(true);
    }
  }, [setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const state = historyRef.current[historyIndexRef.current];
      setNodes(state.nodes);
      setEdges(state.edges);
      setSelectedNode(null);
      setSelectedEdge(null);
      setIsDirty(true);
    }
  }, [setNodes, setEdges]);

  // Publish / Pause status toggle
  const handleToggleStatus = async () => {
    if (!flow) return;
    const newStatus = flow.status === 'published' ? 'paused' : 'published';

    // 1. Save graph first so latest canvas edits are immediately persisted
    await StorageService.saveFlowGraph(
      flowId,
      nodes as unknown as FlowNode[],
      edges as unknown as FlowEdge[]
    );

    // 2. If publishing, pause any other active flow
    if (newStatus === 'published') {
      const allFlows = await StorageService.getFlows();
      for (const f of allFlows) {
        if (f.id !== flow.id && f.status === 'published') {
          await StorageService.saveFlow({ ...f, status: 'paused' });
        }
      }
    }

    // 3. Save flow status
    const updated = await StorageService.saveFlow({
      ...flow,
      status: newStatus,
      node_count: nodes.length,
      updated_at: new Date().toISOString(),
    });
    setFlow(updated);

    // 4. Publish directly on server
    const backendUrl = getBackendUrl();
    try {
      if (newStatus === 'published') {
        await fetch(`${backendUrl}/api/whatsapp/flows/${flow.id}/publish`, { method: 'POST' });
      }
    } catch {}

    success(
      newStatus === 'published' ? 'Fluxo Publicado' : 'Fluxo Pausado',
      `O fluxo "${flow.name}" agora está ${newStatus === 'published' ? 'Publicado e Ativo no WhatsApp' : 'Pausado'}.`
    );
  };

  const isValid = nodes.length > 0;
  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  if (isLoading || !flow) {
    return (
      <div className="h-screen w-screen bg-dark-950 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="w-10 h-10 rounded-xl border-2 border-brand-500 border-t-transparent animate-spin" />
        <span className="text-xs font-semibold tracking-wider text-slate-300">
          Carregando Studio do Fluxo...
        </span>
      </div>
    );
  }

  // 📱 Optional Step List View (If user explicitly taps "Modo Lista")
  if (isStepListView) {
    return (
      <MobileFlowBuilder
        flow={flow}
        nodes={nodes as unknown as FlowNode[]}
        edges={edges as unknown as FlowEdge[]}
        onUpdateNodes={(updatedNodes) => {
          setNodes(updatedNodes as unknown as Node[]);
          pushHistory(updatedNodes as unknown as Node[], edges);
        }}
        onUpdateEdges={(updatedEdges) => {
          setEdges(updatedEdges as unknown as Edge[]);
          pushHistory(nodes, updatedEdges as unknown as Edge[]);
        }}
        onSave={() => handleSave(false)}
        onToggleStatus={handleToggleStatus}
        isSaving={isSaving}
        isDirty={isDirty}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onBack={() => onNavigate('/fluxos')}
        onSwitchToCanvas={() => setIsStepListView(false)}
      />
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-dark-950 overflow-hidden select-none relative">
      {/* Top Floating Connection Mode Banner */}
      {connectingSource && (
        <div className="absolute top-16 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 animate-in slide-in-from-top-4">
          <div className="bg-dark-900/95 backdrop-blur-2xl border-2 border-cyan-500/80 p-3 rounded-2xl shadow-2xl shadow-cyan-950/80 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping flex-shrink-0" />
              <div>
                <p className="font-bold text-white leading-tight">
                  🔗 Modo Conectar: <span className="text-cyan-300">{connectingSource.node.data?.label}</span>
                  {connectingSource.handleLabel && <span className="text-brand-300 ml-1">({connectingSource.handleLabel})</span>}
                </p>
                <p className="text-[10px] text-slate-400">Toque no nó de destino na tela para ligar os dois nós</p>
              </div>
            </div>
            <button
              onClick={() => setConnectingSource(null)}
              className="px-3 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white border border-white/10 font-bold active:scale-95 transition-all flex-shrink-0"
            >
              ✕ Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Top Studio Toolbar */}
      <FlowToolbar
        flow={flow}
        onBack={() => onNavigate('/fluxos')}
        onSave={() => handleSave(false)}
        onToggleStatus={handleToggleStatus}
        onTestFlow={() => setIsSimulatorOpen(true)}
        onSwitchToMobileMode={() => setIsStepListView(true)}
        isSaving={isSaving}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        isValid={isValid}
        validationError={!isValid ? 'Adicione nós para iniciar o fluxo' : null}
        isConnectedWhatsApp={isConnected}
        autoSaveMode={autoSaveMode}
        autoSaveIntervalSec={autoSaveIntervalSec}
        onUpdateAutoSaveConfig={handleUpdateAutoSaveConfig}
        lastSavedTime={lastSavedTime}
        isDirty={isDirty}
        edgeType={edgeType}
        onChangeEdgeType={setEdgeType}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        onAutoLayout={handleAutoLayout}
      />

      {/* Main Canvas Workspace (Identical Desktop Visual Organogram) */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left: Node Palette (Desktop Sidebar) */}
        <NodePalette
          onAddNode={handleAddNode}
          isOpen={isPaletteOpen}
          onToggleOpen={() => setIsPaletteOpen(!isPaletteOpen)}
          width={paletteWidth}
          onWidthChange={setPaletteWidth}
        />

        {/* Center: ReactFlow Canvas */}
        <div className="flex-1 h-full relative">
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onEdgeClick={onEdgeClick}
            onEdgeDoubleClick={onEdgeDoubleClick}
            edgeType={edgeType}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          />
        </div>

        {/* Right: Node Inspector (Desktop Sidebar) */}
        {selectedNode && (
          <div className="hidden md:block">
            <NodeInspector
              node={selectedNode}
              onUpdateConfig={handleUpdateConfig}
              onDeleteNode={handleDeleteSelectedNode}
              onDuplicateNode={handleDuplicateSelectedNode}
              onClose={() => setSelectedNode(null)}
              width={inspectorWidth}
              onWidthChange={setInspectorWidth}
            />
          </div>
        )}
      </div>

      {/* 📱 Mobile Floating Quick Action Bar (When a Node is Selected) */}
      {selectedNode && (
        <div className="md:hidden fixed bottom-4 inset-x-3 z-40 animate-in slide-in-from-bottom-4">
          <div className="bg-dark-900/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-3 shadow-2xl shadow-black/80 space-y-2">
            {/* Header: Node Info */}
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-pulse flex-shrink-0" />
                <h4 className="text-xs font-bold text-white truncate">
                  {selectedNode.data?.label || selectedNode.id}
                </h4>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                onClick={() => setIsMobileInspectorOpen(true)}
                className="p-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-[11px] flex flex-col items-center gap-1 shadow-sm active:scale-95 transition-transform"
              >
                <Edit3 className="w-4 h-4" />
                <span>Editar</span>
              </button>

              <button
                onClick={() => handleStartConnecting(selectedNode)}
                className="p-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] flex flex-col items-center gap-1 shadow-sm active:scale-95 transition-transform"
              >
                <Link2 className="w-4 h-4" />
                <span>Ligar Nó</span>
              </button>

              <button
                onClick={handleDuplicateSelectedNode}
                className="p-2.5 rounded-2xl bg-dark-800 hover:bg-dark-750 text-slate-200 text-[11px] font-medium flex flex-col items-center gap-1 border border-white/5 active:scale-95 transition-transform"
              >
                <Copy className="w-4 h-4" />
                <span>Duplicar</span>
              </button>

              <button
                onClick={handleDeleteSelectedNode}
                className="p-2.5 rounded-2xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-[11px] font-medium flex flex-col items-center gap-1 border border-rose-800/40 active:scale-95 transition-transform"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📱 Mobile Floating Edge Delete Pill (When an Edge is Selected) */}
      {selectedEdge && (
        <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 animate-in slide-in-from-bottom-4">
          <div className="bg-dark-900/95 backdrop-blur-2xl border border-cyan-500/50 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-300 font-medium">Linha de Ligação Selecionada</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="danger"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => handleDeleteEdge(selectedEdge.id)}
              >
                Excluir Ligação
              </Button>
              <button
                onClick={() => setSelectedEdge(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📱 Mobile Floating Action Button (+ Adicionar Nó) */}
      <div className="md:hidden fixed bottom-4 right-4 z-30">
        {!selectedNode && (
          <button
            onClick={() => setIsMobilePaletteOpen(true)}
            className="px-4 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-primary-600 text-white font-bold text-xs flex items-center gap-2 shadow-2xl shadow-brand-500/40 border border-white/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Nó</span>
          </button>
        )}
      </div>

      {/* 📱 Mobile Node Palette Modal */}
      <Modal
        isOpen={isMobilePaletteOpen}
        onClose={() => setIsMobilePaletteOpen(false)}
        title="Catálogo de Nós do Fluxo"
        subtitle="Toque em qualquer nó para adicionar no organograma visual"
        maxWidth="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setMobilePaletteCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-colors ${
                mobilePaletteCategory === 'all'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-dark-800 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              Todos ({NODE_DEFINITIONS.length})
            </button>
            {(Object.keys(CATEGORY_INFO) as Array<keyof typeof CATEGORY_INFO>).map((catKey) => {
              const cat = CATEGORY_INFO[catKey];
              const isSelected = mobilePaletteCategory === catKey;
              return (
                <button
                  key={catKey}
                  onClick={() => setMobilePaletteCategory(catKey)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 flex items-center gap-1.5 transition-colors ${
                    isSelected
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-dark-800 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Node Types Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {NODE_DEFINITIONS.filter(
              (def) => mobilePaletteCategory === 'all' || def.category === mobilePaletteCategory
            ).map((def) => (
              <button
                key={def.type}
                onClick={() => handleAddNode(def)}
                className="p-3.5 rounded-2xl bg-dark-850 hover:bg-dark-800 border border-white/5 hover:border-brand-500/40 text-left transition-all active:scale-[0.98] flex items-start gap-3 group"
              >
                <div className={`p-2.5 rounded-xl text-white ${def.iconBg} shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  {def.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors">
                      {def.label}
                    </h4>
                    {def.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                        {def.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                    {def.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* 📱 Mobile Node Inspector Modal / Drawer */}
      {isMobileInspectorOpen && selectedNode && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in">
          <div className="bg-dark-900 border-t border-white/15 rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6">
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-dark-850">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500 text-white">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Editar: {selectedNode.data?.label || selectedNode.id}
                  </h3>
                  <p className="text-[10px] text-slate-400">Configure textos, parâmetros e variáveis da etapa</p>
                </div>
              </div>

              <button
                onClick={() => setIsMobileInspectorOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inspector Form Body */}
            <div className="flex-1 overflow-y-auto p-4">
              <NodeInspector
                node={selectedNode}
                onUpdateConfig={handleUpdateConfig}
                onDeleteNode={handleDeleteSelectedNode}
                onDuplicateNode={handleDuplicateSelectedNode}
                onClose={() => setIsMobileInspectorOpen(false)}
                width={600}
              />
            </div>

            {/* Bottom Save & Close Button */}
            <div className="p-3 bg-dark-850 border-t border-white/10 flex justify-end gap-2">
              <Button
                variant="brand"
                onClick={() => setIsMobileInspectorOpen(false)}
                className="w-full font-bold"
              >
                Concluir & Salvar Edição
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Branch Output Selector Modal (For check_contact or buttons) */}
      {branchSelectorNode && (
        <Modal
          isOpen={Boolean(branchSelectorNode)}
          onClose={() => setBranchSelectorNode(null)}
          title="Escolha a Saída para Conectar"
          subtitle={`Selecione qual caminho de "${branchSelectorNode.data.label}" você deseja ligar`}
          maxWidth="sm"
        >
          <div className="space-y-2 pt-2">
            {(branchSelectorNode.data?.nodeType || branchSelectorNode.type) === 'check_contact' ? (
              <>
                <button
                  onClick={() => {
                    const node = branchSelectorNode;
                    setBranchSelectorNode(null);
                    handleStartConnecting(node, 'is_new', 'Novo Cliente');
                  }}
                  className="w-full p-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-between text-left transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span>🟢 Saída: Se for Novo Cliente</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    const node = branchSelectorNode;
                    setBranchSelectorNode(null);
                    handleStartConnecting(node, 'is_existing', 'Cliente Salvo');
                  }}
                  className="w-full p-3 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-between text-left transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-cyan-400" />
                    <span>🔵 Saída: Se for Cliente Já Salvo</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              (branchSelectorNode.data?.config?.buttons || []).map((b: any, idx: number) => (
                <button
                  key={b.id || idx}
                  onClick={() => {
                    const node = branchSelectorNode;
                    setBranchSelectorNode(null);
                    handleStartConnecting(node, b.id || `btn_${idx + 1}`, b.title || `Botão ${idx + 1}`);
                  }}
                  className="w-full p-3 rounded-2xl bg-brand-500/15 hover:bg-brand-500/25 border border-brand-500/30 text-brand-300 font-bold text-xs flex items-center justify-between text-left transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-brand-400" />
                    <span>Saída: {b.title || `Opção ${idx + 1}`}</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* Simulator Modal */}
      {isSimulatorOpen && (
        <FlowSimulator
          flow={flow}
          nodes={nodes as unknown as FlowNode[]}
          edges={edges as unknown as FlowEdge[]}
          onClose={() => setIsSimulatorOpen(false)}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      <Modal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        title="Atalhos de Teclado & Gestos do Studio"
        subtitle="Agilize a criação e navegação dos seus fluxos"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-2.5">
            {[
              { desc: 'Salvar Fluxo Manualmente', keys: ['Ctrl', 'S'] },
              { desc: 'Desfazer última alteração', keys: ['Ctrl', 'Z'] },
              { desc: 'Refazer alteração', keys: ['Ctrl', 'Y'] },
              { desc: 'Duplicar nó selecionado', keys: ['Ctrl', 'D'] },
              { desc: 'Excluir nó selecionado OU ligação selecionada', keys: ['Delete', 'ou', 'Backspace'] },
              { desc: 'Excluir linha de ligação instantaneamente', keys: ['Clique Duplo', 'na Linha'] },
              { desc: 'Adicionar nó no centro da tela', keys: ['Clique', 'no Nó'] },
              { desc: 'Adicionar nó em posição exata', keys: ['Arrastar', 'para a Tela'] },
              { desc: 'Desmarcar seleção de nós ou linhas', keys: ['Esc'] },
              { desc: 'Abrir este menu de atalhos', keys: ['F1', 'ou', '?'] },
            ].map((sc, i) => (
              <div
                key={i}
                className="p-3 rounded-2xl bg-dark-850 border border-white/5 flex items-center justify-between"
              >
                <span className="text-slate-300">{sc.desc}</span>
                <div className="flex items-center gap-1">
                  {sc.keys.map((k, j) => (
                    <kbd
                      key={j}
                      className="px-2 py-1 rounded-lg bg-dark-800 border border-slate-700 text-[10px] font-mono font-bold text-brand-300 shadow-sm"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="brand" onClick={() => setIsShortcutsModalOpen(false)}>
              Entendido
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const FlowEditorPage: React.FC<FlowEditorPageProps> = (props) => {
  return (
    <ReactFlowProvider>
      <FlowEditorPageContent {...props} />
    </ReactFlowProvider>
  );
};
