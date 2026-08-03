import React, { useState } from 'react';

function ItemInput({ onSend }) {
  const [val, setVal] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSend(val); setVal(''); }}>
      <input value={val} onChange={(e) => setVal(e.target.value)} />
    </form>
  );
}

export default ItemInput;
