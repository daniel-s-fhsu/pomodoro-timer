import { openDB } from "https://cdn.jsdelivr.net/npm/idb@8.0.3/+esm"
import { addStatToFirebase, deleteStatFromFirebase, getStatsFromFirebase, updateStatFirebase, getCurrentUser } from "./firebaseDB.js";

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





// make sure storage isn't full
async function checkStorageUsage() {
    if (navigator.storage && navigator.storage.estimate) {
        const { usage, quota } = await navigator.storage.estimate();

        const usageInMb = (usage / (1024 * 1024)).toFixed(2);
        const quotaInMb = (quota / (1024 * 1024)).toFixed(2);

        console.log(`Storage used: ${usageInMb} MB of ${quotaInMb} MB`);
    }
}

// ---- exported functions to manipulate stat block ----
// Everything below here are essentially public functions to use in timer.js
export async function addStatBlock(statBlock) {
    const db = await createDB();
    let statId;
    const user = getCurrentUser();
    const userId = user?.uid || null;
    const statWithUser = { ...statBlock, userId };

    if (navigator.onLine && userId) {
        const saveTask = await addStatToFirebase(statWithUser);
        statId = saveTask.id;
        const tx = db.transaction("stats", "readwrite");
        const store = tx.objectStore("stats");
        await store.put({ ...statWithUser, id: statId, synced:true });
        await tx.done;
    } else {
        // offline - save locally and mark as not synced
        statId = `temp-${Date.now()}`;
        const statToStore = {...statWithUser, id: statId, synced: false };
        if (!statToStore.id) {
            console.error("Stat block must have an id before storing locally.");
            return;
        }
        const tx = db.transaction("stats", "readwrite");
        const store = tx.objectStore("stats");
        statId = await store.add(statToStore);
        await tx.done;
    }
    await checkStorageUsage();
    return { ...statWithUser, id: statId };
}

//delete document
export async function deleteStatBlock(id) {
    if(!id) {
        console.error("No ID provided for deletion.");
        return;
    }
    const db = await createDB();
    const user = getCurrentUser();

    if(navigator.onLine && user) {
        await deleteStatFromFirebase(id);
    }

    const tx = db.transaction("stats", "readwrite");
    const store = tx.objectStore("stats");

    try {
    //delete by id
        await store.delete(id);
    } catch(e) {
        console.error("Error deleting stat block: ", e);
    }

    await tx.done;

    // TODO: does the interface need to be refreshed?  Probably not...

    await checkStorageUsage();
}


export async function syncStats() {
    const user = getCurrentUser();
    const userId = user?.uid;
    if (!userId) return;

    const db = await createDB();
    const tx = db.transaction("stats", "readwrite");
    const store = tx.objectStore("stats");

    const blocks = await store.getAll();
    await tx.done;

    for (const block of blocks) {
        if (!block.synced && navigator.onLine) {
            try {
                if (block.userId && block.userId !== userId) continue;
                const targetUserId = block.userId || userId;
                const blockToSync = {
                    date: block.date,
                    minutes: block.minutes,
                    subject: block.subject,
                    userId: targetUserId,
                };


                // send to firebase
                const savedBlock = await addStatToFirebase(blockToSync);

                const txUpdate = db.transaction("stats", "readwrite");
                const storeUpdate = txUpdate.objectStore("stats");

                await storeUpdate.delete(block.id);
                await storeUpdate.put({...block, ...blockToSync, id: savedBlock.id, synced: true });
                await txUpdate.done;
            } catch (e) {
                console.error("Error syncing stat block:", e);
            }
        }
    }
}

// load documents
export async function loadStatBlocks() {
    const db = await createDB();
    const user = getCurrentUser();
    const userId = user?.uid || null;
    if (navigator.onLine && userId) {
        // First push any local unsynced stats up
        await syncStats();
        // Then pull list from Firebase and refresh local cache
        const firebaseStats = await getStatsFromFirebase(userId);
        const txWrite = db.transaction("stats", "readwrite");
        const storeWrite = txWrite.objectStore("stats");
        await storeWrite.clear();
        for (const stat of firebaseStats) {
            await storeWrite.put({ ...stat, synced: true, userId });
        }
        await txWrite.done;
    }
    // Always return the latest local cache so offline works
    const txRead = db.transaction("stats", "readonly");
    const storeRead = txRead.objectStore("stats");
    const localStats = await storeRead.getAll();
    await txRead.done;
    if (!userId) return [];

    const missingUserStats = localStats.filter((stat) => !stat.userId);
    if (missingUserStats.length) {
        const txFix = db.transaction("stats", "readwrite");
        const storeFix = txFix.objectStore("stats");
        for (const stat of missingUserStats) {
            const updatedStat = { ...stat, userId };
            await storeFix.put(updatedStat);
            stat.userId = userId;
        }
        await txFix.done;
    }

    return localStats.filter((stat) => stat.userId === userId);
}



// edit stat block
export async function updateStatBlock(id, updatedData) {
    if (!id) {
        console.error("No ID provided for update.");
        return;
    }

    const db = await createDB();
    const user = getCurrentUser();
    const userId = user?.uid;
    if (navigator.onLine && userId) {
        try {
            //online
            await updateStatFirebase(id, { ...updatedData, userId });
            const tx = db.transaction("stats", "readwrite");
            const store = tx.objectStore("stats");
            await store.put({ ...updatedData, userId, id: id, synced: true });
            await tx.done;
        } catch (e) {
            console.error("Error updating stat block in Firebase:", e);
        }
    } else {
        //offline - update locally and mark as not synced
        try {
            const tx = db.transaction("stats", "readwrite");
            const store = tx.objectStore("stats");
            await store.put({ ...updatedData, userId, id: id, synced: false });
            await tx.done;
        } catch (e) {
            console.error("Error updating stat block locally:", e);
        }
    }
}
