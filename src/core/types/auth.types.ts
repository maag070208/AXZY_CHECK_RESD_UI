export interface IAuthLogin {
  username: string;
  password: string;
}

export interface IAuthRegister {
  name: string;
  username: string;
  password: string;
  roleId: string;
  clientId?: string;
}

export interface IAuthResponse {
  success: boolean;
  data: string;
}

