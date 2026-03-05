export interface User {
  id: string;
  username: string;
  display_name: string;
}

export interface Chat {
  id: string;
  name?: string;
  is_group: boolean;
  display_name?: string;
}