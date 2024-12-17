export const calculateAge = (birthYear: string): number => {
    const currentYear = new Date().getFullYear();
    return currentYear - parseInt(birthYear);
  };
  
  export const calculateTermEnd = (terms: any[]): number => {
    if (!terms || terms.length === 0) return new Date().getFullYear();
    
    // Sort terms to get the most recent/latest term
    const sortedTerms = [...terms].sort((a, b) => b.endYear - a.endYear);
    return sortedTerms[0].endYear;
  };