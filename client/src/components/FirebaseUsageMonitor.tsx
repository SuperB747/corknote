import React, { useState, useEffect } from 'react';
import { getReadCount, getWriteCount, getDeleteCount, resetCounts } from '../utils/firebaseUsage';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseDb as db } from '../firebase/config';

const FirebaseUsageMonitor: React.FC = () => {
  const { currentUser } = useAuth();
  const [reads, setReads] = useState(0);
  const [writes, setWrites] = useState(0);
  const [deletes, setDeletes] = useState(0);
  const [storageSize, setStorageSize] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setReads(getReadCount());
      setWrites(getWriteCount());
      setDeletes(getDeleteCount());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const fetchStorageSize = async () => {
      try {
        const notesQ = query(collection(db, 'notes'), where('userId', '==', currentUser.uid));
        const notesSnap = await getDocs(notesQ);
        const notesBytes = notesSnap.docs.reduce((sum, d) => sum + JSON.stringify(d.data()).length, 0);
        const foldersQ = query(collection(db, 'folders'), where('userId', '==', currentUser.uid));
        const foldersSnap = await getDocs(foldersQ);
        const foldersBytes = foldersSnap.docs.reduce((sum, d) => sum + JSON.stringify(d.data()).length, 0);
        setStorageSize(notesBytes + foldersBytes);
      } catch (err) {
        console.error('Failed to fetch storage size:', err);
      }
    };
    fetchStorageSize();
    const sizeInterval = setInterval(fetchStorageSize, 10000);
    return () => clearInterval(sizeInterval);
  }, [currentUser]);

  const handleReset = () => {
    resetCounts();
    setReads(0);
    setWrites(0);
    setDeletes(0);
    setStorageSize(0);
  };

  return (
    <div className="no-drag fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/80 backdrop-blur-md rounded-md px-4 py-2 shadow-md flex items-center space-x-4 z-50">
      <span className="text-sm font-mono">Stored: {storageSize}B</span>
      <span className="text-sm font-mono">Deletes: {deletes}</span>
      <span className="text-sm font-mono">Reads: {reads}</span>
      <span className="text-sm font-mono">Writes: {writes}</span>
      <button onClick={handleReset} className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-sm rounded">Reset</button>
    </div>
  );
};

export default FirebaseUsageMonitor; 