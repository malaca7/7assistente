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
      check_contact: CheckContactNode,
      end_flow: EndFlowNode,
      finish_flow: EndFlowNode,
      end: EndFlowNode,
      // Nós de Loja Virtual & Atendimento Pitoco de Gente
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

  return (
    <div
      className="w-full h-full relative bg-dark-950"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
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
