import request from './request';

export function listWorks(params) {
  return request.get('/works', { params });
}

export function deleteWork(id) {
  return request.delete(`/works/${id}`);
}
