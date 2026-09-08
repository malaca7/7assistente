import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface ConnectingSource {
  nodeId: string;
  handleId?: string | null;
  nodeLabel: string;
  branchLabel?: string;
}

interface FlowConnectionContextType {
  connectingSource: ConnectingSource | null;
  isConnecting: boolean;
  startConnecting: (nodeId: string, handleId?: string | null, nodeLabel?: string, branchLabel?: string) => void;
  completeConnecting: (targetNodeId: string, targetHandleId?: string | null) => void;
  cancelConnecting: () => void;
}

const FlowConnectionContext = createContext<FlowConnectionContextType | null>(null);

export interface FlowConnectionProviderProps {
  children: React.ReactNode;
  onConnectRequest?: (sourceNodeId: string, sourceHandleId: string | null, targetNodeId: string, targetHandleId: string | null) => void;
}

export const FlowConnectionProvider: React.FC<FlowConnectionProviderProps> = ({
  children,
  onConnectRequest,
}) => {
  const [connectingSource, setConnectingSource] = useState<ConnectingSource | null>(null);

  const startConnecting = useCallback(
    (nodeId: string, handleId?: string | null, nodeLabel?: string, branchLabel?: string) => {
      setConnectingSource({
        nodeId,
        handleId: handleId || null,
        nodeLabel: nodeLabel || 'Card de Função',
        branchLabel: branchLabel || undefined,
      });
    },
    []
  );

  const completeConnecting = useCallback(
    (targetNodeId: string, targetHandleId?: string | null) => {
      if (!connectingSource) return;
      if (connectingSource.nodeId === targetNodeId) {
        // Não pode conectar no mesmo nó
        return;
      }

      if (onConnectRequest) {
        onConnectRequest(
          connectingSource.nodeId,
          connectingSource.handleId || null,
          targetNodeId,
          targetHandleId || null
        );
      }
      setConnectingSource(null);
    },
    [connectingSource, onConnectRequest]
  );

  const cancelConnecting = useCallback(() => {
    setConnectingSource(null);
  }, []);

  // Cancelar ao apertar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && connectingSource) {
        cancelConnecting();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [connectingSource, cancelConnecting]);

  return (
    <FlowConnectionContext.Provider
      value={{
        connectingSource,
        isConnecting: !!connectingSource,
        startConnecting,
        completeConnecting,
        cancelConnecting,
      }}
    >
      {children}
    </FlowConnectionContext.Provider>
  );
};

export const useFlowConnection = () => {
  const context = useContext(FlowConnectionContext);
  return context;
};
