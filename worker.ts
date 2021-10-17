onmessage = async (event: MessageEvent<string>) => {
  try {
    const [action, db_name, store_name, key, value]: [
      0 | 1 | 2 | 3,
      string,
      string,
      string | number,
      any
    ] = JSON.parse(event.data);
    const request: IDBOpenDBRequest = indexedDB.open(db_name);
    request.onsuccess = (event: Event) => {
      const db = (event.target as any).result as IDBDatabase;
      const _transaction = db.transaction([store_name], "readwrite");
      const objectStore = _transaction.objectStore(store_name);

      const request = [
        () => objectStore.get(key),
        () => objectStore.put(value, key),
        () => objectStore.count(),
        () => objectStore.getAll(),
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
      ["Chapter 1", "Timer"].forEach((store_name: string) => {
        (event.target as any).result.createObjectStore(store_name);
      });
    };
  } catch (err) {
    console.error(err);
  }
};
