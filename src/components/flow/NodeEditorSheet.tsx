import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { FlowNode } from '../../types';
import { 
  MessageSquare, 
  ListTree, 
  HelpCircle, 
  Zap, 
  Clock, 
  UserCheck, 
  Trash2, 
  Save, 
  Plus, 
  X,
  FileText,
  Image as ImageIcon
} from 'lucide-react';

interface NodeEditorSheetProps {
  node: FlowNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedNode: FlowNode) => void;
  onDelete: (nodeId: string) => void;
}

export const NodeEditorSheet: React.FC<NodeEditorSheetProps> = ({
  node,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [label, setLabel] = useState('');
  const [content, setContent] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');

  useEffect(() => {
    if (node) {
      setLabel(node.data?.label || '');
      setContent(node.data?.content || node.data?.text || '');
      setOptions(node.data?.options || []);
      setMediaUrl(node.data?.mediaUrl || '');
    }
  }, [node]);

  if (!node) return null;

  const handleAddOption = () => {
    if (newOption.trim()) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const updated: FlowNode = {
      ...node,
      data: {
        ...node.data,
        label: label.trim() || 'Nó do Fluxo',
        content: content.trim(),
        text: content.trim(),
        options: options,
        mediaUrl: mediaUrl.trim(),
      },
    };
    onSave(updated);
    onClose();
  };

  const getNodeIcon = () => {
    switch (node.type) {
      case 'message': return <MessageSquare className="w-5 h-5 text-primary-400" />;
      case 'menu': return <ListTree className="w-5 h-5 text-cyan-400" />;
      case 'question': return <HelpCircle className="w-5 h-5 text-amber-400" />;
      case 'action': return <Zap className="w-5 h-5 text-emerald-400" />;
      case 'delay': return <Clock className="w-5 h-5 text-purple-400" />;
      case 'transfer': return <UserCheck className="w-5 h-5 text-rose-400" />;
      default: return <FileText className="w-5 h-5 text-primary-400" />;
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Etapa do Fluxo"
      subtitle={`Configurando nó: ${node.data?.label || node.id}`}
    >
      <div className="space-y-4">
        {/* Node Type Badge */}
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-dark-850 border border-slate-800">
          <div className="p-2 rounded-xl bg-dark-900 border border-slate-700/60">
            {getNodeIcon()}
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo do Bloco</span>
            <h4 className="text-xs font-bold text-white capitalize">{node.type}</h4>
          </div>
        </div>

        {/* Node Title / Label */}
        <Input
          label="Título / Identificador da Etapa"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Ex: Mensagem de Boas-Vindas"
          required
        />

        {/* Content / Message */}
        <Textarea
          label="Texto da Mensagem no WhatsApp"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Digite o texto que o robô enviará para o cliente..."
          rows={4}
          helperText="Você pode usar variáveis como {{bot_nome}}, {{empresa}}, etc."
        />

        {/* Media URL if media or message */}
        {(node.type === 'message' || node.type === 'media') && (
          <Input
            label="URL de Imagem / Áudio (Opcional)"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://exemplo.com/foto.jpg"
            leftIcon={<ImageIcon className="w-4 h-4" />}
          />
        )}

        {/* Menu Options if menu node */}
        {node.type === 'menu' && (
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-300">Botões / Opções Interativas</label>
            <div className="space-y-1.5">
              {options.map((opt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-dark-850 border border-slate-700/80 text-xs font-medium text-white"
                >
                  <span className="truncate">{idx + 1}. {opt}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="text-slate-400 hover:text-rose-400 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOption(); } }}
                placeholder="Nova opção (Ex: 1 - Fazer Agendamento)"
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-dark-850 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
              <Button type="button" size="sm" variant="secondary" onClick={handleAddOption} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Adicionar
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="danger"
            onClick={() => { onDelete(node.id); onClose(); }}
            leftIcon={<Trash2 className="w-4 h-4" />}
            className="flex-1"
          >
            Excluir
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            leftIcon={<Save className="w-4 h-4" />}
            className="flex-2"
          >
            Salvar Etapa
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};
