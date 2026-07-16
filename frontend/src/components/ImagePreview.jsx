import { Modal, Image } from 'antd';

export default function ImagePreview({ open, imageUrl, prompt, onClose }) {
  return (
    <Modal open={open} onCancel={onClose} footer={null} width={800}
           title={prompt?.substring(0, 50)}>
      {imageUrl && <Image src={imageUrl} style={{ width: '100%' }} />}
    </Modal>
  );
}
