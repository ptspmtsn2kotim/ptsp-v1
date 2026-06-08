import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  targetRole: string;
}

export interface RequestItem {
  id: number;
  studentId: number;
  studentName: string;
  serviceId: string;
  serviceName: string;
  data: Record<string, unknown>;
  status: string;
  currentTier: string;
  createdAt: string;
  history: { action: string, by: string, role: string, date: string, reason?: string }[];
}

export interface UserItem {
  id: number;
  username: string;
  role: string;
  name: string;
  email?: string;
  nis?: string;
  kelas?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private getBaseUrl() {
    if (isPlatformServer(this.platformId)) {
      const port = typeof process !== 'undefined' && process.env['PORT'] ? process.env['PORT'] : 3000;
      return `http://127.0.0.1:${port}`;
    }
    return '';
  }

  getServices() {
    return this.http.get<ServiceItem[]>(`${this.getBaseUrl()}/api/services?t=${new Date().getTime()}`);
  }

  getRequests() {
    return this.http.get<RequestItem[]>(`${this.getBaseUrl()}/api/requests?t=${new Date().getTime()}`);
  }

  createRequest(data: Record<string, unknown>) {
    return this.http.post<RequestItem>(`${this.getBaseUrl()}/api/requests`, data);
  }

  submitPublicRequest(serviceId: string, data: Record<string, unknown>) {
    return this.http.post<RequestItem>(`${this.getBaseUrl()}/api/public/requests`, { serviceId, data });
  }

  verifyRequest(id: number, action: 'approve' | 'reject', reason?: string) {
    return this.http.post<RequestItem>(`${this.getBaseUrl()}/api/requests/${id}/verify`, { action, reason });
  }

  deleteRequest(id: number) {
    return this.http.delete(`${this.getBaseUrl()}/api/requests/${id}`);
  }

  getUsers() {
    return this.http.get<UserItem[]>(`${this.getBaseUrl()}/api/users?t=${new Date().getTime()}`);
  }

  createUser(data: Record<string, unknown>) {
    return this.http.post<UserItem>(`${this.getBaseUrl()}/api/users`, data);
  }

  updateUser(id: number, data: Record<string, unknown>) {
    return this.http.put<UserItem>(`${this.getBaseUrl()}/api/users/${id}`, data);
  }

  deleteUser(id: number) {
    return this.http.delete(`${this.getBaseUrl()}/api/users/${id}`);
  }
}
