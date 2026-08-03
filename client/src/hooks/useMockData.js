import { useState } from 'react';

export function useMockData() {
  const [data, setData] = useState([]);
  return { data, setData };
}
