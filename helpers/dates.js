export const getCurrentDateAndTime = () => {
  const now = new Date();
  const ISTOffset = 5.5 * 60 * 60 * 1000;
  const indianTime = new Date(now.getTime() + ISTOffset);
  return indianTime;
};

export const getCurrentDate = () => {
  const now = new Date();
  const ISTOffset = 5.5 * 60 * 60 * 1000;
  const indianDate = new Date(now.getTime() + ISTOffset);
  return indianDate.toISOString().split('T')[0];
};

export const filterDataBetweenDateRanges = (data, fromDate, toDate) => {
  fromDate = new Date(fromDate);
  toDate = new Date(toDate);
  const filteredData = data.filter((item) => {
    const createdAt = new Date(item.createdAt);
    return createdAt >= fromDate && createdAt <= toDate;
  });
  return filteredData;
};

export const isValidMonthName = (monthName) => {
  try {
    const validMonthNames = [
      'january', 'february', 'march', 'april',
      'may', 'june', 'july', 'august',
      'september', 'october', 'november', 'december'
    ];
    const lowercaseMonthName = monthName.toLowerCase();
    if (validMonthNames.includes(lowercaseMonthName) == false) throw { status: 400, message: "Invalid month name!" }
  }
  catch (error) {
    throw error
  }
}

export const addDaysToDate = (days) => {
  const currentDate = getCurrentDateAndTime();
  const daysToAdd = parseInt(days);
  currentDate.setDate(currentDate.getDate() + daysToAdd);
  const customDate = currentDate.toISOString();
  return customDate;
}

export const checkFreeTrialAccess = (createdDate) => {
  const d1 = new Date((getCurrentDateAndTime()).toISOString());
  const d2 = new Date(createdDate);
  const diffInMs = Math.abs(d2 - d1);
  const diffInDays = diffInMs / (24 * 60 * 60 * 1000);
  return diffInDays <= 3;
}