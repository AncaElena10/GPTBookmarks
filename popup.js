import {
    getCurrentTab,
    getAllBookmarks,
    sendMessageToContentScript
} from './utils.js';

const addNewBookmark = (element, bookmarkData) => {
    const bookmarkTitleElement = document.createElement('div');
    const controlsElement = document.createElement('div');
    const newBookmarkElement = document.createElement('div');

    bookmarkTitleElement.textContent = bookmarkData.title;
    bookmarkTitleElement.className = 'bookmark-title';
    controlsElement.className = 'bookmark-controls';

    setBookmarkAttributes('open', onOpen, controlsElement);
    setBookmarkAttributes('remove', onRemove, controlsElement);

    newBookmarkElement.id = 'bookmark-' + bookmarkData.id;
    newBookmarkElement.className = 'bookmark';
    newBookmarkElement.setAttribute('timestamp', bookmarkData.time);

    newBookmarkElement.appendChild(bookmarkTitleElement);
    newBookmarkElement.appendChild(controlsElement);
    element.appendChild(newBookmarkElement);
};

const viewBookmarks = (currentBookmarks = []) => {
    const bookmarksElement = document.getElementById('bookmarks');
    bookmarksElement.innerHTML = '';

    if (currentBookmarks && Object.keys(currentBookmarks).length > 0) {
        for (const value of Object.values(currentBookmarks)) {
            addNewBookmark(bookmarksElement, JSON.parse(value));
        }
    } else {
        bookmarksElement.innerHTML = '<i class="row">It\'\s\ quiet in here...</i>';
    }

    return;
};

const onOpen = async (elem) => {
    const activeTab = await getCurrentTab();
    const bookmarkID = elem.target.parentNode.parentNode.getAttribute('id');

    await sendMessageToContentScript(activeTab.id, {
        type: 'OPEN',
        value: bookmarkID
    });

    // listen back for the event
    // chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    //     if (tabs.length > 0) {
    //         chrome.tabs.sendMessage(tabs[0].id, { greeting: "hello from popup" }, (response) => {
    //             console.log(JSON.stringify(response));
    //         });
    //     }
    // });
};

const onRemove = async (elem) => {
    const activeTab = await getCurrentTab();
    const bookmarkID = elem.target.parentNode.parentNode.getAttribute('id');
    const bookmarkElementToRemove = document.getElementById(bookmarkID);

    if (bookmarkElementToRemove) {
        bookmarkElementToRemove.parentNode.removeChild(bookmarkElementToRemove);

        // chrome.tabs.sendMessage(activeTab.id, {
        //     type: 'REMOVE',
        //     value: bookmarkID,
        // }, viewBookmarks);

        await sendMessageToContentScript(activeTab.id, {
            type: 'REMOVE',
            value: bookmarkID
        });

        // listen back for the event
        // TODO - fix - receiving {}
        // chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        //     if (tabs.length > 0) {
        //         chrome.tabs.sendMessage(tabs[0].id, {
        //             type: 'REMOVE',
        //             value: bookmarkID
        //         }, (response) => {
        //             console.log("Response from content script:", response);
        //         });
        //     }
        // });
    } else {
        console.error('Bookmark not found.');
    }
};

const setBookmarkAttributes = (src, eventListener, controlParentElement) => {
    const controlElement = document.createElement('img');

    controlElement.src = 'assets/' + src + '.png';
    controlElement.title = src;
    controlElement.addEventListener('click', eventListener);
    controlParentElement.appendChild(controlElement);
};

document.addEventListener('DOMContentLoaded', async () => {
    const currentChatBookmarks = await getAllBookmarks();
    console.log(`All bookmarks in popup.js: ${JSON.stringify(currentChatBookmarks, null, 2)}`);

    viewBookmarks(currentChatBookmarks);
});
