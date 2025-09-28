import { useEffect } from 'react';

export const useWindowDropzone = ({
  onDrop,
}: {
  onDrop: (files: File[]) => Promise<void>;
}) => {
  useEffect(() => {
    function onWindowDragOver(e: DragEvent) {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    }
    async function onWindowDrop(e: DragEvent) {
      e.preventDefault();
      const dt = e.dataTransfer;
      if (!dt) return;
      const files = Array.from(dt.files || []).filter(f =>
        f.type.startsWith('image/')
      );
      if (files.length === 0) return;
      await onDrop(files);
    }
    window.addEventListener('dragover', onWindowDragOver);
    window.addEventListener('drop', onWindowDrop);
    return () => {
      window.removeEventListener('dragover', onWindowDragOver);
      window.removeEventListener('drop', onWindowDrop);
    };
  }, [onDrop]);
};
