import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  NodeTypes,
  Edge,
  Node,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  ConnectionMode,
  ConnectionLineType,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { TriggerNode, MessageNode, ButtonsNode, QuestionNode } from './nodes/StandardNodes';
import { 
  ConditionNode, 
  DelayNode, 
  HttpRequestNode, 
  WebhookNode, 
  VariableNode, 
  AiAgentNode, 
  MediaNode, 
  HumanHandoffNode,
  UpdateContactNode,
  ClientUpsertNode,
  ClientLookupNode,
  CheckContactNode,
  EndFlowNode,
  StoreSelectorNode,
  ShowCatalogNode,
  SelectProductNode,
  ShippingCalculatorNode,
  PixPaymentNode,
  CartOrderNode,
  MeasureGuideNode,
  LayetteChecklistNode,
  VipConsultationNode,
  OrderTrackingNode,
  PromotionalCouponNode,
} from './nodes/AdvancedNodes';

import { useFlowConnection } from './FlowConnectionContext';

export interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  onPaneClick?: () => void;
  edgeType?: string;
  onDrop?: (event: React.DragEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
  onEdgeClick?: (event: React.MouseEvent, edge: Edge) => void;
  onEdgeDoubleClick?: (event: React.MouseEvent, edge: Edge) => void;
}

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
  edgeType = 'smoothstep',
  onDrop,
  onDragOver,
  onEdgeClick,
  onEdgeDoubleClick,
}) => {
  const connCtx = useFlowConnection();

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      trigger: TriggerNode,
      message: MessageNode,
      buttons: ButtonsNode,
      question: QuestionNode,
      condition: ConditionNode,
      delay: DelayNode,
      http_request: HttpRequestNode,
      webhook: WebhookNode,
      variable: VariableNode,
      ai_agent: AiAgentNode,
      media: MediaNode,
      human_handoff: HumanHandoffNode,
      update_contact: UpdateContactNode,
      save_contact: UpdateContactNode,
      client_upsert: ClientUpsertNode,
      client_lookup: ClientLookupNode,
      check_contact: CheckContactNode,
      end_flow: EndFlowNode,
      finish_flow: EndFlowNode,
      end: EndFlowNode,
      // Funções de Loja Virtual & Atendimento Pitoco de Gente
      store_selector: StoreSelectorNode,
      show_catalog: ShowCatalogNode,
      select_product: SelectProductNode,
      shipping_calculator: ShippingCalculatorNode,
      pix_payment: PixPaymentNode,
      cart_order: CartOrderNode,
      measure_guide: MeasureGuideNode,
      layette_checklist: LayetteChecklistNode,
      vip_consultation: VipConsultationNode,
      order_tracking: OrderTrackingNode,
      promotional_coupon: PromotionalCouponNode,
    }),
    []
  );

  const handlePaneClick = () => {
    if (connCtx?.isConnecting) {
      connCtx.cancelConnecting();
    }
    if (onPaneClick) {
      onPaneClick();
    }
  };

  return (
    <div
      className="w-full h-full relative bg-dark-950 select-none"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {/* Banner Flutuante de Modo de Conexão Ativo */}
      {connCtx?.connectingSource && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-dark-900/95 border border-cyan-500/60 shadow-2xl shadow-cyan-950/80 rounded-full px-5 py-2.5 backdrop-blur-md animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
            <span>Ligando:</span>
            <span className="text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-500/30">
              {connCtx.connectingSource.nodeLabel}
              {connCtx.connectingSource.branchLabel ? ` (${connCtx.connectingSource.branchLabel})` : ''}
            </span>
            <span className="text-slate-300">➔ Clique no Card de destino ou no ponto azul</span>
          </div>
          <button
            type="button"
            onClick={connCtx.cancelConnecting}
            className="ml-2 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 transition-all hover:scale-105"
          >
            Cancelar (Esc)
          </button>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={handlePaneClick}
        onEdgeClick={onEdgeClick}
        onEdgeDoubleClick={onEdgeDoubleClick}
        deleteKeyCode="Delete"
        panActivationKeyCode={null}
        multiSelectionKeyCode={null}
        zoomActivationKeyCode={null}
        preventScrolling={false}
        edgesFocusable={true}
        edgesReconnectable={true}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        connectionMode={ConnectionMode.Loose}
        connectionRadius={60}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        connectionLineType={
          edgeType === 'smoothstep'
            ? ConnectionLineType.SmoothStep
            : edgeType === 'straight'
            ? ConnectionLineType.Straight
            : ConnectionLineType.Bezier
        }
        connectionLineStyle={{
          stroke: '#38bdf8',
          strokeWidth: 3,
          strokeDasharray: '6,4',
        }}
        defaultEdgeOptions={{
          type: edgeType,
          animated: true,
          style: { stroke: '#06b6d4', strokeWidth: 2.5 },
          pathOptions: { offset: 35, borderRadius: 20 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color="#334155"
          gap={24}
          size={1.5}
          variant={BackgroundVariant.Dots}
          className="opacity-40"
        />
        <Controls
          showInteractive={false}
          position="bottom-left"
          className="m-4 bg-dark-900 border border-slate-800 rounded-xl shadow-xl"
        />
      </ReactFlow>
    </div>
  );
};
