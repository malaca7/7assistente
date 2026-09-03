import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
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
  ScheduleContactNode,
  UpdateContactNode,
  ServicesCatalogNode,
  CheckContactNode,
  AskDateNode,
  ConfirmBookingNode,
  EndFlowNode,
  ShowServicesNode,
  SelectServiceNode,
  SelectDateNode,
  SelectTimeSlotNode,
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
      show_services: ShowServicesNode,
      select_service: SelectServiceNode,
      select_date: SelectDateNode,
      select_time_slot: SelectTimeSlotNode,
      ask_date: SelectDateNode,
      services_catalog: SelectServiceNode,
      schedule_contact: SelectTimeSlotNode,
      confirm_booking: ConfirmBookingNode,
      update_contact: UpdateContactNode,
      check_contact: CheckContactNode,
      end_flow: EndFlowNode,
      finish_flow: EndFlowNode,
      end: EndFlowNode,
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
        deleteKeyCode={['Backspace', 'Delete']}
        edgesFocusable={true}
        edgesReconnectable={true}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        connectionMode={ConnectionMode.Strict}
        connectionRadius={45}
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
          stroke: '#06b6d4',
          strokeWidth: 3,
          strokeDasharray: '6,6',
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
        <MiniMap
          position="bottom-right"
          nodeColor={(node) => {
            switch (node.type) {
              case 'trigger': return '#f59e0b';
              case 'message': return '#06b6d4';
              case 'buttons': return '#3b82f6';
              case 'condition': return '#a855f7';
              case 'ai_agent': return '#c084fc';
              case 'human_handoff': return '#f43f5e';
              case 'schedule_contact': return '#10b981';
              case 'update_contact': return '#06b6d4';
              default: return '#38bdf8';
            }
          }}
          maskColor="rgba(7, 9, 14, 0.85)"
          className="m-4 rounded-xl border border-slate-800 shadow-xl"
        />
      </ReactFlow>
    </div>
  );
};
