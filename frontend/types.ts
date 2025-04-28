export interface WorkOrder {
  id: string;
  status: string;
  createdAt: Date;
  owner: string;
  email_subject: string;
  email_body: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  emailVerified: boolean | null;
  createdAt: string | null;
}
