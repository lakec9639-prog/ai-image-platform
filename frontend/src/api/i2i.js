import request from './request';

export function uploadSourceImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/i2i/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function generateI2I(data) {
  return request.post('/i2i/generate', data);
}
