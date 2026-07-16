import request from './request';

export function listUsers(params) {
  return request.get('/admin/users', { params });
}

export function createUser(data) {
  return request.post('/admin/users', data);
}

export function toggleUserStatus(id, status) {
  return request.put(`/admin/users/${id}/status`, { status });
}
