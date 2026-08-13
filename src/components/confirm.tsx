import React from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Modal } from '@/components/Modal';
import { Button } from '@heroui/react';

export interface ConfirmOptions {
  title?: React.ReactNode;
  /** Main body text / content. */
  body?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** When true, the confirm button uses the danger variant. */
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
}

/**
 * Imperative confirm dialog, inspired by Vue's `Modal.confirm()`.
 *
 * Mounts a fresh `Modal` into a detached DOM node via `createPortal` +
 * `createRoot`, resolves the action through callbacks, then unmounts itself
 * once closed — so callers never need to declare `<AlertDialog>` JSX.
 *
 * @example
 *   confirm({
 *     title: '重置系统？',
 *     body: '将恢复默认布局、墙纸…此操作不可撤销。',
 *     danger: true,
 *     onConfirm: onResetSystem,
 *   });
 */
export function confirm(options: ConfirmOptions): void {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);

  const close = () => {
    root.unmount();
    host.remove();
  };

  const ConfirmDialog: React.FC = () => {
    const [loading, setLoading] = React.useState(false);

    const handleConfirm = async () => {
      try {
        setLoading(true);
        await options.onConfirm();
      } finally {
        setLoading(false);
        close();
      }
    };

    return (
      <Modal isOpen onClose={close} title={options.title} showCloseButton={false}>
        <div className="px-6 py-5">
          {options.body && (
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {options.body}
            </div>
          )}
          <div className="mt-5 flex justify-end space-x-2">
            <Button variant="tertiary" onPress={close}>
              {options.cancelText ?? '取消'}
            </Button>
            <Button
              variant={options.danger ? 'danger' : 'primary'}
              isDisabled={loading}
              onPress={handleConfirm}
            >
              {options.confirmText ?? '确定'}
            </Button>
          </div>
        </div>
      </Modal>
    );
  };

  root.render(createPortal(<ConfirmDialog />, host));
}
