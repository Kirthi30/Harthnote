import React from 'react';
import { 
  Sparkles, 
  X, 
  Trash2, 
  Calendar, 
  Clock, 
  MessageSquare, 
  HelpCircle 
} from 'lucide-react';
import type { ReflectionChatSession } from '../types';

interface SavedDialogueDetailModalProps {
  session: ReflectionChatSession | null;
  onClose: () => void;
  onDelete?: (sessionId: string) => Promise<void>;
}

export const SavedDialogueDetailModal: React.FC<SavedDialogueDetailModalProps> = ({
  session,
  onClose,
  onDelete,
}) => {
  if (!session) return null;

  const handleDelete = async () => {
    if (!onDelete) return;
    const confirm = window.confirm('Are you sure you want to remove this saved dialogue record?');
    if (confirm) {
      await onDelete(session.id);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#1E1915]/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialogue-detail-title"
    >
      <div 
        className="bg-[#FFFDF9] border border-[#DDD0BC] rounded-3xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#FAF6EE] border-b border-[#E8DFC8] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF0E8] border border-[#EAD6C7] flex items-center justify-center text-[#C97C4C] shadow-2xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 id="dialogue-detail-title" className="font-display text-base font-semibold text-[#2B231F]">
                  Saved Reflection Dialogue
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FAF0E8] text-[#8C5230] border border-[#EAD6C7]">
                  {session.messages.length} messages
                </span>
              </div>
              <p className="text-xs text-[#7C7067] font-serif flex items-center space-x-2 mt-0.5">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-[#C97C4C]" />
                  <span>{new Date(session.completedAt || session.createdAt).toLocaleDateString()}</span>
                </span>
                <span>·</span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-[#C97C4C]" />
                  <span>{new Date(session.completedAt || session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onDelete && (
              <button
                onClick={handleDelete}
                className="w-8 h-8 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center justify-center transition-colors"
                title="Delete this saved dialogue"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-[#7C7067] hover:text-[#2B231F] hover:bg-[#EFE8D8] flex items-center justify-center transition-colors"
              aria-label="Close dialogue details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Question Highlight Banner */}
        <div className="px-6 py-3 bg-[#FAF0E8]/60 border-b border-[#EAD6C7] shrink-0">
          <div className="flex items-start space-x-2">
            <HelpCircle className="w-4 h-4 text-[#C97C4C] mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C5230]">
                Reflection Inquiry Explored
              </span>
              <p className="font-serif text-xs sm:text-sm text-[#2B231F] italic font-medium">
                "{session.firstQuestion}"
              </p>
            </div>
          </div>
        </div>

        {/* Message Transcript */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#FFFDF9]">
          {session.messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id || idx}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center space-x-1.5 px-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C8075]">
                    {isUser ? 'You' : 'Reflection Companion'}
                  </span>
                  <span className="text-[10px] text-[#A6998E]">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm font-serif leading-relaxed shadow-2xs whitespace-pre-wrap ${
                    isUser
                      ? 'bg-[#C97C4C] text-[#FFFDF9] rounded-tr-xs'
                      : 'bg-[#FAF6EE] text-[#2B231F] border border-[#EAE1CF] rounded-tl-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#FAF6EE] border-t border-[#E8DFC8] flex items-center justify-between shrink-0">
          <span className="text-xs text-[#7C7067] font-serif">
            Completed on {new Date(session.completedAt || session.createdAt).toLocaleDateString()}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#FAF0E8] hover:bg-[#EAE0D0] text-[#2B231F] border border-[#E0D3BE] font-medium text-xs shadow-2xs transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
