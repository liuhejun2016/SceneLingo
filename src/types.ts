export interface Scene {
  id: string;
  title: string;
  image_data: string;
  style: string;
  language: string;
  created_at: string;
  author: string;
  likes: number;
  words: Word[];
}

export interface Word {
  id: string;
  scene_id: string;
  word: string;
  translation: string;
  pronunciation: string;
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
}

export interface Comment {
  id: string;
  scene_id: string;
  author: string;
  content: string;
  created_at: string;
}
