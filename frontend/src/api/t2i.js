import request from './request';

export function generateT2I(data) {
  return request.post('/t2i/generate', data);
}
