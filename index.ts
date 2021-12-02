import { config } from "../../../../config";

function debounce(func: Function, timeout: number = 500) {
  let timer: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(undefined, args);
    }, timeout);
  };
}

let db_operations: any[] = [];

export async function db_get(
  database_name: string,
  objectstore_name: string,
  key: string | number
): Promise<any> {
  return new Promise<any>(
    (resolve: (value: any) => void, reject: (reason?: any) => void): void => {
      const db_worker = new Worker("./assets/web-worker/indexeddb/worker.js");
      db_worker.postMessage(
        JSON.stringify({
          db_version: config.db_version,
          action: 0,
          database_name,
          objectstore_name,
          key,
          objectstores: config.objectstores,
        })
      );
      const get_db_data = (event: MessageEvent) => {
        db_worker.removeEventListener("message", get_db_data);
        try {
          resolve(event.data && JSON.parse(event.data));
        } catch (err) {
          reject(err);
        }
      };
      db_worker.addEventListener("message", get_db_data);
    }
  );
}

export function db_set(
  database_name: string,
  objectstore_name: string,
  key: string | number,
  value: any
) {
  db_operations.push({
    db_version: config.db_version,
    action: 1,
    database_name,
    objectstore_name,
    key,
    value,
    objectstores: config.objectstores,
  });

  debounce(db_run)();
}

export async function db_count(
  database_name: string,
  objectstore_name: string
): Promise<number> {
  return new Promise<number>((resolve: (value: number) => void): void => {
    const db_worker = new Worker("./assets/web-worker/indexeddb/worker.js");
    db_worker.postMessage(
      JSON.stringify({
        db_version: config.db_version,
        action: 2,
        database_name,
        objectstore_name,
        objectstores: config.objectstores,
      })
    );
    const get_db_data = (event: MessageEvent) => {
      db_worker.removeEventListener("message", get_db_data);
      resolve(event.data);
    };
    db_worker.addEventListener("message", get_db_data);
  });
}

export async function db_get_all(
  database_name: string,
  objectstore_name: string
): Promise<any[]> {
  return new Promise<any[]>(
    (resolve: (value: any) => void, reject: (reason?: any) => void): void => {
      const db_worker = new Worker("./assets/web-worker/indexeddb/worker.js");
      db_worker.postMessage(
        JSON.stringify({
          db_version: config.db_version,
          action: 3,
          database_name,
          objectstore_name,
          objectstores: config.objectstores,
        })
      );
      const get_db_data = (event: MessageEvent) => {
        db_worker.removeEventListener("message", get_db_data);
        try {
          resolve(JSON.parse(event.data));
        } catch (err) {
          reject(err);
        }
      };
      db_worker.addEventListener("message", get_db_data);
    }
  );
}

export function db_delete(
  database_name: string,
  objectstore_name: string,
  key: string | number
) {
  const db_worker = new Worker("./assets/web-worker/indexeddb/worker.js");
  db_worker.postMessage(
    JSON.stringify({
      db_version: config.db_version,
      action: 4,
      database_name,
      objectstore_name,
      key,
      objectstores: config.objectstores,
    })
  );
}

export async function db_run(): Promise<any> {
  if (db_operations.length) {
    const db_worker = new Worker("./assets/web-worker/indexeddb/worker.js");
    db_worker.postMessage(JSON.stringify(db_operations));
    db_operations = [];
  }
}
