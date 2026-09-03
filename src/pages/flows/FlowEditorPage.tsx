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
import { NodePalette, NodeDefinition } from '../../components/flow-builder/NodePalette';
import { NodeInspector } from '../../components/flow-builder/NodeInspector';
import { FlowSimulator } from '../../components/flow-builder/FlowSimulator';
import { MobileFlowBuilder } from '../../components/flow-builder/MobileFlowBuilder';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../contexts/ToastContext';
import { useWhatsApp } from '../../contexts/WhatsAppContext';
import { StorageService, getBackendUrl } from '../../lib/storage';
import { Flow, FlowNode, FlowEdge, FlowNodeData } from '../../types';

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
  const [isMobileView, setIsMobileView] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  });

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

  // Connect edges (Always attaches to Left/Target input handle of destination node)
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

  // Node and Edge selection
  const onNodeClick = useCallback((_e: React.MouseEvent, node: Node) => {
    setSelectedNode(node as unknown as FlowNode);
    setSelectedEdge(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  // Edge Selection and Double-click to Delete
  const onEdgeClick = useCallback((_e: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  // Delete Edge function
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
      success('Nó Adicionado', `Nó "${def.label}" inserido no fluxo.`);
    },
    [nodes, edges, setNodes, pushHistory, success]
  );

  // Add new node from palette: Clicking spawns in the visual center of current viewport!
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

  // Auto-Layout Algorithm (True Genealogical Tree / Organogram Hierarchy)
  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) return;

    const childrenMap = new Map<string, string[]>();
    const parentMap = new Map<string, string[]>();

    nodes.forEach((n) => {
      childrenMap.set(n.id, []);
      parentMap.set(n.id, []);
    });

    edges.forEach((e) => {
      if (childrenMap.has(e.source) && childrenMap.has(e.target)) {
        if (!childrenMap.get(e.source)!.includes(e.target)) {
          childrenMap.get(e.source)!.push(e.target);
        }
        if (!parentMap.get(e.target)!.includes(e.source)) {
          parentMap.get(e.target)!.push(e.source);
        }
      }
    });

    // 1. Assign Layer (X coordinate / Depth Level) via Longest Path from Roots
    const roots = nodes.filter((n) => (n.data?.nodeType || n.type) === 'trigger' || (parentMap.get(n.id)?.length || 0) === 0);
    if (roots.length === 0 && nodes.length > 0) {
      roots.push(nodes[0]);
    }

    const depthMap = new Map<string, number>();
    const visited = new Set<string>();

    const assignDepth = (nodeId: string, currentDepth: number) => {
      const existing = depthMap.get(nodeId) || 0;
      if (currentDepth > existing) {
        depthMap.set(nodeId, currentDepth);
      } else if (!depthMap.has(nodeId)) {
        depthMap.set(nodeId, currentDepth);
      }

      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const children = childrenMap.get(nodeId) || [];
      children.forEach((childId) => {
        assignDepth(childId, (depthMap.get(nodeId) || currentDepth) + 1);
      });
    };

    roots.forEach((r) => assignDepth(r.id, 0));

    // Handle any unreachable / disconnected nodes
    nodes.forEach((n) => {
      if (!depthMap.has(n.id)) {
        depthMap.set(n.id, 0);
      }
    });

    // Group nodes by column/depth level
    const maxDepth = Math.max(...Array.from(depthMap.values()), 0);
    const columns: Node[][] = Array.from({ length: maxDepth + 1 }, () => []);

    nodes.forEach((n) => {
      const d = depthMap.get(n.id) || 0;
      columns[d].push(n);
    });

    // 2. Initial Y Placement (Hierarchical Center-Out from Parents)
    const NODE_WIDTH = 300;
    const HORIZONTAL_GAP = 90;
    const HORIZONTAL_STEP = NODE_WIDTH + HORIZONTAL_GAP; // 390px
    const MIN_VERTICAL_GAP = 210; // Space per node row
    const START_X = 80;
    const START_Y = 120;

    const yPositions = new Map<string, number>();

    // Position roots
    roots.forEach((r, idx) => {
      yPositions.set(r.id, START_Y + idx * (MIN_VERTICAL_GAP * 2));
    });

    // Propagate Y positions from layer 0 to maxDepth
    for (let d = 0; d <= maxDepth; d++) {
      const colNodes = columns[d];
      
      colNodes.forEach((node) => {
        const parents = parentMap.get(node.id) || [];
        if (parents.length > 0 && !yPositions.has(node.id)) {
          // Calculate mean Y of parents
          const parentYs = parents.map((pId) => yPositions.get(pId) ?? START_Y);
          const avgY = parentYs.reduce((a, b) => a + b, 0) / parentYs.length;
          yPositions.set(node.id, avgY);
        } else if (!yPositions.has(node.id)) {
          yPositions.set(node.id, START_Y);
        }

        // If node has multiple children in next layer, distribute them symmetrically around node's Y
        const children = childrenMap.get(node.id) || [];
        if (children.length > 1) {
          const totalSpan = (children.length - 1) * MIN_VERTICAL_GAP;
          const startChildY = (yPositions.get(node.id) || START_Y) - totalSpan / 2;
          children.forEach((childId, cIdx) => {
            if (!yPositions.has(childId)) {
              yPositions.set(childId, startChildY + cIdx * MIN_VERTICAL_GAP);
            }
          });
        }
      });

      // 3. Collision Resolution per column (Prevent overlapping nodes)
      colNodes.sort((a, b) => (yPositions.get(a.id) || 0) - (yPositions.get(b.id) || 0));

      for (let i = 1; i < colNodes.length; i++) {
        const prevId = colNodes[i - 1].id;
        const curId = colNodes[i].id;
        const prevY = yPositions.get(prevId) || 0;
        const curY = yPositions.get(curId) || 0;

        if (curY < prevY + MIN_VERTICAL_GAP) {
          yPositions.set(curId, prevY + MIN_VERTICAL_GAP);
        }
      }
    }

    // 4. Center-align parent nodes relative to their children's actual spread (Bottom-Up Pass)
    for (let d = maxDepth - 1; d >= 0; d--) {
      const colNodes = columns[d];
      colNodes.forEach((node) => {
        const children = childrenMap.get(node.id) || [];
        if (children.length > 0) {
          const childYs = children.map((cId) => yPositions.get(cId) || 0);
          const minChildY = Math.min(...childYs);
          const maxChildY = Math.max(...childYs);
          const centeredY = (minChildY + maxChildY) / 2;
          yPositions.set(node.id, centeredY);
        }
      });

      // Re-resolve any collisions created by centering
      colNodes.sort((a, b) => (yPositions.get(a.id) || 0) - (yPositions.get(b.id) || 0));
      for (let i = 1; i < colNodes.length; i++) {
        const prevId = colNodes[i - 1].id;
        const curId = colNodes[i].id;
        const prevY = yPositions.get(prevId) || 0;
        const curY = yPositions.get(curId) || 0;

        if (curY < prevY + MIN_VERTICAL_GAP) {
          yPositions.set(curId, prevY + MIN_VERTICAL_GAP);
        }
      }
    }

    // Generate final layouted nodes
    const layoutedNodes: Node[] = nodes.map((n) => {
      const depth = depthMap.get(n.id) || 0;
      const posX = START_X + depth * HORIZONTAL_STEP;
      const posY = yPositions.get(n.id) || START_Y;

      return {
        ...n,
        position: { x: posX, y: posY },
      };
    });

    setNodes(layoutedNodes);
    pushHistory(layoutedNodes, edges);
    success('Organograma Alinhado', 'Estrutura em árvore genealógica organizada com sucesso!');

    setTimeout(() => {
      fitView({ padding: 0.18, duration: 800 });
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

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // 1. Ctrl + S -> Save Flow
      if (cmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave(false);
        return;
      }

      // 2. Ctrl + Z -> Undo
      if (cmdOrCtrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (!isInput) {
          e.preventDefault();
          handleUndo();
        }
        return;
      }

      // 3. Ctrl + Y or Ctrl + Shift + Z -> Redo
      if ((cmdOrCtrl && e.key.toLowerCase() === 'y') || (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z')) {
        if (!isInput) {
          e.preventDefault();
          handleRedo();
        }
        return;
      }

      // 4. Ctrl + D -> Duplicate Selected Node
      if (cmdOrCtrl && e.key.toLowerCase() === 'd') {
        if (!isInput && selectedNode) {
          e.preventDefault();
          handleDuplicateSelectedNode();
        }
        return;
      }

      // 5. Delete or Backspace -> Delete Selected Node OR Selected Edge
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        if (selectedNode) {
          e.preventDefault();
          handleDeleteSelectedNode();
          return;
        }
        if (selectedEdge) {
          e.preventDefault();
          handleDeleteEdge(selectedEdge.id);
          return;
        }
      }

      // 6. Escape -> Deselect
      if (e.key === 'Escape') {
        setSelectedNode(null);
        setSelectedEdge(null);
        setIsShortcutsModalOpen(false);
        return;
      }

      // 7. F1 or ? -> Open Shortcuts Modal
      if ((e.key === 'F1' || e.key === '?') && !isInput) {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleUndo, handleRedo, handleDuplicateSelectedNode, handleDeleteSelectedNode, handleDeleteEdge, selectedNode, selectedEdge]);

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

  // 📱 Mobile Step-by-Step View
  if (isMobileView) {
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
        onSwitchToCanvas={() => setIsMobileView(false)}
      />
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-dark-950 overflow-hidden select-none">
      {/* Top Bar */}
      <FlowToolbar
        flow={flow}
        onBack={() => onNavigate('/fluxos')}
        onSave={() => handleSave(false)}
        onToggleStatus={handleToggleStatus}
        onTestFlow={() => setIsSimulatorOpen(true)}
        onSwitchToMobileMode={() => setIsMobileView(true)}
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

      {/* Main Canvas Workspace */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left: Node Palette */}
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

        {/* Right: Node Inspector */}
        {selectedNode && (
          <NodeInspector
            node={selectedNode}
            onUpdateConfig={handleUpdateConfig}
            onDeleteNode={handleDeleteSelectedNode}
            onDuplicateNode={handleDuplicateSelectedNode}
            onClose={() => setSelectedNode(null)}
            width={inspectorWidth}
            onWidthChange={setInspectorWidth}
          />
        )}
      </div>

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
