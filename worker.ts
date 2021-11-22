onmessage = async (event: MessageEvent<string>) => {
  try {
    const {
      db_version,
      action,
      database_name,
      objectstore_name,
      objectstores,
      key,
      value,
    }: {
      db_version: number;
      action: 0 | 1 | 2 | 3 | 4;
      database_name: string;
      objectstore_name: string;
      objectstores: string[];
      key: string;
      value?: any;
    } = JSON.parse(event.data);

    const request: IDBOpenDBRequest = indexedDB.open(database_name, db_version);
    request.onsuccess = (event: Event) => {
      const db = (event.target as any).result as IDBDatabase;
      const _transaction = db.transaction([objectstore_name], "readwrite");
      const objectStore = _transaction.objectStore(objectstore_name);

      const request = [
        () => objectStore.get(key),
        () => objectStore.put(value, key),
        () => objectStore.count(),
        () => objectStore.getAll(),
        () => objectStore.delete(key),
      ][action]();

      // const action_msg = ["Reading", "Writing", "Counting"][action];

      request.onsuccess = function () {
        // console.log(`${action_msg} DB successfully`);
        const result = (request as any).result;
        [0, 2, 3].includes(action) &&
          postMessage(action === 2 ? result : JSON.stringify(result));
      };

      request.onerror = function (error: Event) {
        // console.log(`${action_msg} DB failed`);
        console.error(error);
      };

      _transaction.oncomplete = function () {
        // console.log("All transaction finished");
        db.close();
        close();
      };

      _transaction.onerror = function (error: Event) {
        console.error(error);
        db.close();
        close();
      };
    };

    request.onerror = (error: Event) => {
      console.error(error);
      close();
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      objectstores.forEach((objectstore_name: string) => {
        const db = (event.target as any).result as IDBDatabase;
        !db.objectStoreNames.contains(objectstore_name) &&
          db.createObjectStore(objectstore_name);
      });
    };
  } catch (err) {
    console.error(err);
  }
};
