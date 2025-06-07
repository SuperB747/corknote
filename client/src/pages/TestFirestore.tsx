import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, DocumentData, serverTimestamp } from 'firebase/firestore';
import { firebaseDb as db } from '../firebase/config';

const TestFirestore: React.FC = () => {
  const [testData, setTestData] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Firestore에서 테스트 데이터 읽기
  const fetchTestData = async () => {
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'test-collection'));
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTestData(docs);
      setMessage(`${docs.length}개의 문서를 성공적으로 로드했습니다.`);
    } catch (err) {
      console.error('Error fetching test data:', err);
      setError('데이터 로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Firestore에 테스트 데이터 쓰기
  const addTestData = async () => {
    setLoading(true);
    setError(null);
    try {
      const docRef = await addDoc(collection(db, 'test-collection'), {
        text: '테스트 데이터 ' + new Date().toLocaleString(),
        createdAt: serverTimestamp()
      });
      setMessage(`문서가 성공적으로 추가되었습니다. ID: ${docRef.id}`);
      fetchTestData(); // 데이터 다시 로드
    } catch (err) {
      console.error('Error adding test data:', err);
      setError('데이터 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchTestData();
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Firestore 테스트</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}
      
      <div className="mb-4">
        <button
          onClick={addTestData}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          {loading ? '처리 중...' : '테스트 데이터 추가'}
        </button>
        
        <button
          onClick={fetchTestData}
          disabled={loading}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          데이터 새로고침
        </button>
      </div>
      
      <div className="border rounded p-4">
        <h2 className="text-xl mb-2">테스트 컬렉션 데이터:</h2>
        {testData.length === 0 ? (
          <p>데이터가 없습니다.</p>
        ) : (
          <ul className="list-disc pl-5">
            {testData.map((item) => (
              <li key={item.id} className="mb-2">
                <strong>{item.id}</strong>: {item.text}
                {item.createdAt && (
                  <span className="text-gray-500 text-sm ml-2">
                    ({new Date(item.createdAt.toDate()).toLocaleString()})
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TestFirestore; 