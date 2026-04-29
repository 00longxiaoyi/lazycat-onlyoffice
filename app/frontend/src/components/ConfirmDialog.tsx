type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  target?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({ open, title, description, target, confirmLabel = '确认', cancelLabel = '取消', loading, danger, onCancel, onConfirm }: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="confirm-dialog-overlay" role="presentation" onClick={() => !loading && onCancel()}>
      <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" onClick={(event) => event.stopPropagation()}>
        <h3 id="confirm-dialog-title">{title}</h3>
        {description ? <p>{description}</p> : null}
        {target ? <div className="confirm-dialog-target" title={target}>{target}</div> : null}
        <div className="confirm-dialog-actions">
          <button className="settings-secondary-button" type="button" disabled={loading} onClick={onCancel}>{cancelLabel}</button>
          <button className={danger ? 'settings-danger-button' : 'settings-primary-button'} type="button" disabled={loading} onClick={() => void onConfirm()}>
            {loading ? '处理中...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
