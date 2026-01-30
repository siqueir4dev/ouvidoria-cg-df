const DB_NAME = 'participa_df_db';
const STORE_NAME = 'manifestations';
const DB_VERSION = 1;

export interface OfflineManifestation {
    id?: number;
    text: string;
    type: string;
    isAnonymous: boolean; // Sempre verdadeiro agora
    latitude?: number;
    longitude?: number;
    timestamp: number;
    // Nota: Armazenar arquivos no IndexedDB pode ser pesado.
    // Para este MVP, podemos armazenar pequenos blobs ou avisar o usuário que os arquivos podem não persistir perfeitamente se forem muito grandes.
    // Tentaremos armazená-los.
    images?: Blob[];
    video?: Blob | null;
    audio?: Blob | null;
}

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
};

export const saveOfflineManifestation = async (data: Omit<OfflineManifestation, 'id' | 'timestamp'>) => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record: OfflineManifestation = {
        ...data,
        timestamp: Date.now()
    };

    return new Promise<void>((resolve, reject) => {
        const request = store.add(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getPendingManifestations = async (): Promise<OfflineManifestation[]> => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const deleteManifestation = async (id: number) => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    return new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
