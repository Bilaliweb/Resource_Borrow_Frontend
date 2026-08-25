import api from './api.ts';

export interface ScheduleBlock {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
  type: string;
  isBusy: boolean;
}

export interface AvailabilityData {
  userId: string;
  availableHours: number;
  totalHours: number;
  availabilityPercent: number;
  todaySchedule: ScheduleBlock[];
}

export const availabilityService = {
  async getEmployeeAvailability(userId: string, date?: string): Promise<AvailabilityData> {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    const res = await api.get<{ success: boolean; data: AvailabilityData }>(`/availability/${userId}`, { params });
    return res.data.data;
  },
};
