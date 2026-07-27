import { STORAGE_KEY } from "./runtime";

/**
 * Mantiene la compatibilidad con la aplicación actual sin dejar la información
 * privada persistida en localStorage. El estado de trabajo vive en sessionStorage
 * y cada cambio se sincroniza con el backend autenticado.
 */
export function installPrivateStorageBridge({ initialData, onPersist }) {
  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  originalSetItem.call(window.sessionStorage, STORAGE_KEY, JSON.stringify(initialData));
  originalRemoveItem.call(window.localStorage, STORAGE_KEY);

  Storage.prototype.getItem = function getItem(key) {
    if (this === window.localStorage && key === STORAGE_KEY) {
      return originalGetItem.call(window.sessionStorage, key);
    }
    return originalGetItem.call(this, key);
  };

  Storage.prototype.setItem = function setItem(key, value) {
    if (this === window.localStorage && key === STORAGE_KEY) {
      originalSetItem.call(window.sessionStorage, key, value);
      Promise.resolve(onPersist(value)).catch((error) => {
        console.error("No fue posible sincronizar el espacio privado", error);
      });
      return;
    }
    originalSetItem.call(this, key, value);
  };

  Storage.prototype.removeItem = function removeItem(key) {
    if (this === window.localStorage && key === STORAGE_KEY) {
      originalRemoveItem.call(window.sessionStorage, key);
      return;
    }
    originalRemoveItem.call(this, key);
  };

  return () => {
    Storage.prototype.getItem = originalGetItem;
    Storage.prototype.setItem = originalSetItem;
    Storage.prototype.removeItem = originalRemoveItem;
    originalRemoveItem.call(window.sessionStorage, STORAGE_KEY);
    originalRemoveItem.call(window.localStorage, STORAGE_KEY);
  };
}

export function createDebouncedWorkspaceWriter({ supabase, workspaceId, onStatus }) {
  let timeoutId = null;
  let latestValue = null;

  async function flush() {
    if (!latestValue) return;

    const value = latestValue;
    latestValue = null;
    onStatus?.("saving");

    let data;
    try {
      data = JSON.parse(value);
    } catch {
      latestValue = value;
      onStatus?.("error");
      throw new Error("El estado de la aplicación no contiene JSON válido.");
    }

    const { error } = await supabase
      .from("rental_workspaces")
      .update({ data, updated_at: new Date().toISOString() })
      .eq("id", workspaceId);

    if (error) {
      if (!latestValue) latestValue = value;
      onStatus?.("error");
      throw error;
    }

    onStatus?.(latestValue ? "saving" : "saved");
  }

  function schedule(value) {
    latestValue = value;
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      flush().catch((error) => console.error(error));
    }, 650);
  }

  schedule.flush = flush;
  schedule.cancel = () => window.clearTimeout(timeoutId);
  return schedule;
}
