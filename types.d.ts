type ProjectType = 'english' | 'mathematics' | 'science' | 'social_studies' | 'rme' | 'computing' | 'creative_arts' | 'career technology' | 'fante/twi' | 'history' | 'peh';
type ProjectSubject = {
  [key: string]: string | number | null | undefined | 'undefined';
};