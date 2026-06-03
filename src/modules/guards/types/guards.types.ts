import { UserResponse } from "../../users/services/UserService";

export interface Guard extends UserResponse {
  // Guard specific fields if any, otherwise it uses User fields
}

export enum AssignmentStatus {
  PENDING = "PENDING",
  CHECKING = "CHECKING",
  UNDER_REVIEW = "UNDER_REVIEW",
  REVIEWED = "REVIEWED",
  COMPLETED = "COMPLETED",
  ANOMALY = "ANOMALY",
  CANCELLED = "CANCELLED",
  ACTIVE = "ACTIVE",
}

export interface AssignmentTask {
  id?: number;
  description: string;
  reqPhoto: boolean;
  completed: boolean;
  completedAt?: string | null;
}

export interface Assignment {
  id: number;
  guardId: string | number;
  locationId: number;
  assignedBy: string | number;
  notes?: string;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
  location: any;
  guard: Partial<UserResponse>;
  tasks: AssignmentTask[];
  kardex?: any[];
}

export interface CreateAssignmentDTO {
  guardId: string | number;
  locationId: string;
  assignedBy: string | number;
  notes?: string;
  tasks?: { description: string; reqPhoto: boolean }[];
}
