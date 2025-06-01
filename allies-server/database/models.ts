export interface Ally {
  id: number;
  category: string;
  fname: string;
  lname: string;
  email: string;
  birthday: Date;
  pfp?: string;
  note: string;
}

export interface Mission {
  uuid: string;
  ally_id: number;
  description: string;
  due_date: Date;
}
