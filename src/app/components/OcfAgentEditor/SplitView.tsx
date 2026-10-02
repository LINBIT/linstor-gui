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
    <div
      style={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        alignItems: 'stretch',
      }}
    >
      {/* Left Panel - Editor */}
      <div
        style={{
          flex: previewVisible ? `0 0 ${leftPanelWidth}%` : '1 1 100%',
          minWidth: previewVisible ? '20%' : 'auto',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {editor}
      </div>

      {/* Drag Handle */}
      {previewVisible && (
        <div
          onMouseDown={onResizeStart}
          title={t('common:drag_resize')}
          style={{
            cursor: 'col-resize',
            width: 20,
            userSelect: 'none',
            flex: '0 0 auto',
            alignSelf: 'stretch',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: '#bfbfbf',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Right Panel - Live Preview */}
      {previewVisible && (
        <div
          style={{
            flex: `0 0 ${100 - leftPanelWidth}%`,
            minWidth: '20%',
            overflow: 'hidden',
          }}
        >
          {preview}
        </div>
      )}
    </div>
  );
};
