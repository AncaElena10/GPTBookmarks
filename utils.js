export const getCurrentTab = async () => {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else if (tabs && tabs.length > 0) {
                resolve(tabs[0]);
            } else {
                reject(new Error('No active tab found.'));
            }
        });
    });
};

export const sendMessageToContentScript = async (tabId, message) => {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });
};

export const getAllBookmarks = async () => {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(null, (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result || []);
            }
        });
    });
};