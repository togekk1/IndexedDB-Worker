onmessage = async (event: MessageEvent<string>) => {
  try {
    const data = JSON.parse(event.data);

    const {
      db_version,
      database_name,
      objectstores,
    }: {
      db_version: number;
      database_name: string;
      objectstores: string[];
    } = Array.isArray(data) ? data[0] : data;

    const request: IDBOpenDBRequest = indexedDB.open(database_name, db_version);

    request.onsuccess = (event: Event) => {
      const db = (event.target as any).result as IDBDatabase;
      const _transaction = db.transaction(objectstores, "readwrite");

      Array.isArray(data)
        ? data.forEach((data_each: any) => {
            fetch_db(data_each);
          })
        : fetch_db(data);

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

      function fetch_db(data: any) {
        const {
          action,
          objectstore_name,
          key,
          value,
        }: {
          action: 0 | 1 | 2 | 3 | 4;
          objectstore_name: string;
          key: string;
          value?: any;
        } = data;

        const objectStore = _transaction.objectStore(objectstore_name);

        const request = [
          () => objectStore.get(key),
          () => objectStore.put(value, key),
          () => objectStore.count(),
          () => objectStore.getAll(),
          () => objectStore.delete(key),
        ][action]();

        request.onsuccess = function () {
          // const action_msg = [
          //   "Reading",
          //   "Writing",
          //   "Counting",
          //   "Reading all in",
          //   "Deleting",
          // ][action];
          // console.log(`${action_msg} ${objectstore_name} successfully`);
          const result = (request as any).result;
          [0, 2, 3].includes(action) &&
            postMessage(action === 2 ? result : JSON.stringify(result));
        };

        request.onerror = (error: Event) => {
          console.error(error);
        };
      }
    };

    request.onerror = function (error: Event) {
      // console.log(`${action_msg} DB failed`);
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
    close();
  }
};
