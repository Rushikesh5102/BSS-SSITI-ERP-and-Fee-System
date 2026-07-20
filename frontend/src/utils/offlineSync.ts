import api from '../services/api';

const DB_NAME = 'sai_iti_offline_db';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
            return reject('IndexedDB not supported');
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e: any) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('pending_students')) {
                db.createObjectStore('pending_students', { keyPath: 'tempId' });
            }
            if (!db.objectStoreNames.contains('pending_payments')) {
                db.createObjectStore('pending_payments', { keyPath: 'tempId' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function saveOfflineStudent(studentData: any) {
    try {
        const db = await openDB();
        const tx = db.transaction('pending_students', 'readwrite');
        const store = tx.objectStore('pending_students');
        const tempId = `offline_student_${Date.now()}`;
        store.put({ tempId, data: studentData, createdAt: new Date().toISOString() });
        return tempId;
    } catch (e) {
        console.error('Failed to save student offline:', e);
    }
}

export async function saveOfflinePayment(paymentData: any) {
    try {
        const db = await openDB();
        const tx = db.transaction('pending_payments', 'readwrite');
        const store = tx.objectStore('pending_payments');
        const tempId = `offline_payment_${Date.now()}`;
        store.put({ tempId, data: paymentData, createdAt: new Date().toISOString() });
        return tempId;
    } catch (e) {
        console.error('Failed to save payment offline:', e);
    }
}

export async function getPendingOfflineCount(): Promise<number> {
    try {
        const db = await openDB();
        const tx = db.transaction(['pending_students', 'pending_payments'], 'readonly');
        const sStore = tx.objectStore('pending_students');
        const pStore = tx.objectStore('pending_payments');
        
        const sCount = await new Promise<number>((res) => { const req = sStore.count(); req.onsuccess = () => res(req.result); });
        const pCount = await new Promise<number>((res) => { const req = pStore.count(); req.onsuccess = () => res(req.result); });
        return sCount + pCount;
    } catch {
        return 0;
    }
}

export async function syncOfflineQueue(onStatusUpdate?: (msg: string) => void): Promise<{ synced: number; failed: number }> {
    if (!navigator.onLine) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    try {
        const db = await openDB();
        
        // 1. Sync Offline Students
        const sTx = db.transaction('pending_students', 'readwrite');
        const sStore = sTx.objectStore('pending_students');
        const students: any[] = await new Promise((res) => { const req = sStore.getAll(); req.onsuccess = () => res(req.result); });

        for (const item of students) {
            try {
                if (onStatusUpdate) onStatusUpdate(`Syncing student: ${item.data.name}...`);
                await api.post('/students', item.data);
                const deleteTx = db.transaction('pending_students', 'readwrite');
                deleteTx.objectStore('pending_students').delete(item.tempId);
                synced++;
            } catch (err) {
                console.error('Failed syncing offline student:', err);
                failed++;
            }
        }

        // 2. Sync Offline Payments
        const pTx = db.transaction('pending_payments', 'readwrite');
        const pStore = pTx.objectStore('pending_payments');
        const payments: any[] = await new Promise((res) => { const req = pStore.getAll(); req.onsuccess = () => res(req.result); });

        for (const item of payments) {
            try {
                if (onStatusUpdate) onStatusUpdate(`Syncing payment ₹${item.data.amount / 100}...`);
                await api.post('/payments', item.data);
                const deleteTx = db.transaction('pending_payments', 'readwrite');
                deleteTx.objectStore('pending_payments').delete(item.tempId);
                synced++;
            } catch (err) {
                console.error('Failed syncing offline payment:', err);
                failed++;
            }
        }

    } catch (e) {
        console.error('Offline sync error:', e);
    }

    return { synced, failed };
}
