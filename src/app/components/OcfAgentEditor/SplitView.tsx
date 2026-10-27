import React from 'react';
import { useTranslation } from 'react-i18next';

interface SplitViewProps {
  editor: React.ReactNode;
  preview: React.ReactNode;
  previewVisible: boolean;
  /** Editor width in percent while the preview shows. */
  leftPanelWidth: number;
  onResizeStart: (e: React.MouseEvent) => void;
}

/** An editor pane and, when shown, its live preview, with a drag handle between them. */
export const SplitView = ({ editor, preview, previewVisible, leftPanelWidth, onResizeStart }: SplitViewProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex h-full overflow-hidden items-stretch">
      {/* Left Panel - Editor */}
      <div
        className="overflow-hidden flex flex-col"
        style={{
          flex: previewVisible ? `0 0 ${leftPanelWidth}%` : '1 1 100%',
          minWidth: previewVisible ? '20%' : 'auto',
        }}
      >
        {editor}
      </div>

      {/* Drag Handle */}
      {previewVisible && (
        <div
          onMouseDown={onResizeStart}
          title={t('common:drag_resize')}
          className="cursor-col-resize w-[20px] select-none flex-none self-stretch flex items-start justify-center pt-4"
        >
          <div className="flex flex-col gap-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-[3px] h-[3px] rounded-full bg-(--icon-muted)" />
            ))}
          </div>
        </div>
      )}

      {/* Right Panel - Live Preview */}
      {previewVisible && (
        <div className="overflow-hidden" style={{ flex: `0 0 ${100 - leftPanelWidth}%`, minWidth: '20%' }}>
          {preview}
        </div>
      )}
    </div>
  );
};
