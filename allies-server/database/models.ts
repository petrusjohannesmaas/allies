export interface Ally {
  id?: number; // Optional because it gets assigned in the DB
  category: string;
  basic_info: {
    fname: string;
    lname: string;
    email: string;
    birthday: string;
    pfp: string;
  };
  note: string;
}

export interface Mission {
  id?: number;
  ally_id: number; // Foreign key reference
  uuid: string;
  description: string;
  due_date: Date;
}