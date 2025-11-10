import { db } from "./firebase-config";
import { addDoc, collection, doc } from "firebase/firestore"
import { openDB } from "idb"

// Create indexedDb
async function createDB(params) {
    const db = await openDB("pomodoroTimer", 1, {
        upgrade(db) {
            const store = db.createObjectStore("stats", {
                keyPath: "id",
                autoIncrement: true
                        });
            store.createIndex("status", "status");
        }
    });
    return db;
}

// add document
async function addDbDoc(statEntry) {
    const db = await createDB();
    const tx = db.transaction("stats", "readwrite");
    const store = tx.objectStore("stats");

    await store.add(statEntry);

    // complete trans
    await tx.done;

    // update storage
    checkStorageUsage();
}

//delete document
async function deleteDbDoc(id) {
    const db = await createDB();

    const tx = db.transaction("stats", "readwrite");
    const store = tx.objectStore("stats");

    //delete by id
    await store.delete(id);

    await tx.done;

    // TODO: does the interface need to be refreshed?  Probably not...

    checkStorageUsage();
}

// load documents
async function loadDbDocs() {
    const db = await createDB();

    const tx = db.transaction("stats", "readonly");
    const store = tx.objectStore("stats");

    // Get all docs
    const docs = await store.getAll();

    await tx.done;

    return docs;
}

// make sure storage isn't full
async function checkStorageUsage() {
    if (navigator.storage && navigator.storage.estimate) {
        const { usage, quota } = await navigator.storage.estimate();

        const usageInMb = (usage / (1024 * 1024)).toFixed(2);
        const quotaInMb = (quota / (1024 * 1024)).toFixed(2);

        console.log(`Storage used: ${usageInMb} MB of ${quotaInMb} MB`);
    }
}

export {addDbDoc, deleteDbDoc, loadDbDocs}