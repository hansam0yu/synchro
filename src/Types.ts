export interface Task {
    id: number;
    title: string;
    due: string;
    done: boolean;
  }
  
  export interface CalEvent {
    id: number;
    name: string;
    time: string;
  }
  
  export interface TTBlock {
    id: number;
    name: string;
    color: string;
  }
  
  export interface User {
  id: string;
  email: string;
}

export type Page = 'tasks' | 'calendar' | 'timetable';