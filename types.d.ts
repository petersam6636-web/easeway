type ProjectType = 'english' | 'mathematics' | 'science' | 'social_studies' | 'rme' | 'computing' | 'creative_arts' | 'career technology' | 'fante/twi' | 'history' | 'peh';
type ProjectSubject = {
  [key: string]: string | number | null | undefined | 'undefined';
};

  type SubjectType =   {
    english: number | undefined | 'undefined';
    science: number | undefined | 'undefined';
    mathematics: number | undefined | 'undefined';
    socila_studies: number | undefined | 'undefined';
    computing: number | undefined | 'undefined';
    creative_arts: number | undefined | 'undefined';
    career_technology: number | undefined | 'undefined';
    rme: number | undefined | 'undefined';
    student_id: number | undefined | 'undefined' | string;
    id: number | undefined | 'undefined' | string;
    'fante/twi': number | undefined | 'undefined';
    
  } |
  {
    english: number | undefined | 'undefined';
  science: number | undefined | 'undefined';
    mathematics: number | undefined | 'undefined';
    history: number | undefined | 'undefined';
    computing: number | undefined | 'undefined';
    creative_arts: number | undefined | 'undefined';
    career_technology: number | undefined | 'undefined';
    student_id: number | undefined | 'undefined';
    id: number | undefined | 'undefined';
    rme: number | undefined | 'undefined';
    'fante/twi': number | undefined | 'undefined';
  } 