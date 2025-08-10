// Utility function to format dates in Indian timezone
export const formatIndianTime = (dateString: string | Date, includeTime = true) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  };
  
  return date.toLocaleString('en-IN', options);
};

// Format date only (no time)
export const formatIndianDate = (dateString: string | Date) => {
  return formatIndianTime(dateString, false);
};

// Format with relative time (Today, Yesterday, etc.)
export const formatIndianRelativeTime = (dateString: string | Date) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const now = new Date();
  const indianNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const indianDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  const diffTime = Math.abs(indianNow.getTime() - indianDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return 'Today';
  } else if (diffDays === 2) {
    return 'Yesterday';
  } else if (diffDays <= 7) {
    return `${diffDays - 1} days ago`;
  } else {
    return formatIndianDate(dateString);
  }
};