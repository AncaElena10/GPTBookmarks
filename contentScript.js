(() => {
    let debounceTimeout;

    // chrome.storage.sync.clear();

    const PrivateMethods = {
        removeOne: async (id) => {
            return new Promise((resolve, reject) => {
                chrome.storage.sync.remove([id], (result) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(`Error removing the key: ${id}`, chrome.runtime.lastError));
                    } else {
                        resolve();
                    }
                });
            });
        },

        getAllLogging: () => {
            chrome.storage.sync.get(null, (result) => {
                console.log(`All bookmarks: ${JSON.stringify(result, null, 2)}`);
            });
        },

        getAll: async () => {
            return new Promise((resolve, reject) => {
                chrome.storage.sync.get(null, (result) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(result || []);
                    }
                });
            });
        },

        getOne: async (id) => {
            return new Promise((resolve, reject) => {
                chrome.storage.sync.get([id], (obj) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(`Error retrieving data: ${chrome.runtime.lastError.message}`));
                    } else {
                        // Check if the data exists for the id, return null if not
                        resolve(obj && obj[id] ? JSON.parse(obj[id]) : null);
                    }
                });
            });
        },

        setOne: (id, data) => {
            chrome.storage.sync.set({ [id]: JSON.stringify(data) });
        },
    };

    /**
     *  This method is returning a specific bookmark from the storage
     * 
     * @returns 
     */
    const getBookmarkFromStorage = async (id) => {
        if (!id || typeof id !== 'string') {
            return null;
        }

        return await PrivateMethods.getOne(id);
    };

    /**
     * This method is adding a bookmark to the storage
      *
     * @param {*} bookmarkData
     * @returns 
     */
    const addBookmarkToStorage = async (id, bookmarkData) => {
        try {
            const bookmarkFromStorage = await getBookmarkFromStorage();

            // It's not currently in the bookmarks
            if (!bookmarkFromStorage) {
                PrivateMethods.setOne(id, bookmarkData);
                console.log(`Key ${id} has been set.`);
            } else {
                console.log(`Key ${id} already bookmarked.`);
            }
            PrivateMethods.getAllLogging(); // to be deleted - for logging purpose
        } catch (error) {
            console.error('Error adding bookmark:', error);
        }
    };

    /**
     * This method is removing a bookmark from the storage
     */
    const removeBookmarkFromStorage = async (id) => {
        if (id.includes('bookmark')) {
            id = id.split('bookmark-')[1];
        }

        const bookmarkFromStorage = await getBookmarkFromStorage(id);
        if (bookmarkFromStorage && Object.keys(bookmarkFromStorage)) {
            await PrivateMethods.removeOne(id);
        }
        // PrivateMethods.getAllLogging(); // to be deleted - for logging purpose
    };

    /**
     * This method will extract the chat ID fron the href element when clicking the options button
     * 
     * @returns {String} The chat ID
     */
    const extractTheChatID = () => {
        const listItems = document.querySelectorAll('li');
        let chatID = null;
        let chatTitle = null;

        for (const item of listItems) {
            if (
                item.getAttribute('data-testid')?.includes('history-item') &&
                item.classList.contains('relative')
            ) {
                // Get the chat title
                const button = item.querySelector('button[data-state="open"]');
                if (button) {
                    chatTitle = item.querySelector('div[title]').getAttribute('title');

                    // Get the chat id
                    const anchor = item.querySelector('a');
                    if (anchor) {
                        href = anchor.getAttribute('href');
                        chatID = href ? href.split('/c/')[1] : null;
                    }
                }
            }
        }

        return {
            id: chatID,
            title: chatTitle || null,
        };
    };

    /**
     * This method is checking whether the chat ID is saved in the bookmarks already or not
     * 
     * @returns {Boolean}
     */
    const checkChatBookmarkExists = async (id) => {
        const bookmarks = await getBookmarkFromStorage(id);

        return !bookmarks ? false : true;
    };

    /**
     * This method handles the bookmark click events
     * Add or Remove the bookmark
     * 
     * @param {*} alreadyBookmarked 
     */
    const handleBookmarkEventHandler = async (id, title, bookmarkToBeRemoved) => {
        if (bookmarkToBeRemoved) {
            await removeBookmarkFromStorage(id);
        } else {
            const newBookmark = {
                id,
                title,
                time: new Date(),
                description: `Bookmark at ${new Date()}`,
                url: `https://chatgpt.com/c/${id}`,
            };
            await addBookmarkToStorage(id, newBookmark);
        }
    };

    /**
     * This method will inject a new button under the Options Menu.
     * Display 'Add to bookmarks' in case the chat has not been added before
     * Display 'Remove from bookmarks' in case the chat has been added before
     * 
     * @param {*} alreadyBookmarked 
     */
    const injectBookmarkButton = (id, title, alreadyBookmarked) => {
        const menuContainer = document.querySelector('[data-radix-menu-content]');

        // Inject a new button
        if (menuContainer) {
            const bookmarkButton = document.createElement('div');
            bookmarkButton.setAttribute('role', 'menuitem');
            bookmarkButton.className = 'bookmark-button flex items-center m-1.5 p-2.5 text-sm cursor-pointer focus-visible:outline-0 radix-disabled:pointer-events-none radix-disabled:opacity-50 group relative hover:bg-[#f5f5f5] focus-visible:bg-[#f5f5f5] radix-state-open:bg-[#f5f5f5] dark:hover:bg-token-main-surface-secondary dark:focus-visible:bg-token-main-surface-secondary rounded-md my-0 px-3 mx-2 dark:radix-state-open:bg-token-main-surface-secondary gap-2.5 py-3';
            bookmarkButton.setAttribute('tabindex', '-1');
            bookmarkButton.setAttribute('data-orientation', 'vertical');
            bookmarkButton.setAttribute('data-radix-collection-item', '');

            const iconContainer = document.createElement('div');
            iconContainer.className = 'flex items-center justify-center text-token-text-secondary h-5 w-5';

            const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgIcon.setAttribute('width', '16');
            svgIcon.setAttribute('height', '16');
            svgIcon.setAttribute('viewBox', '0 0 16 16');

            const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path1.setAttribute('d', 'M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z');
            path1.setAttribute('stroke', 'white');
            path1.setAttribute('fill', 'none');
            path1.setAttribute('fill-rule', 'evenodd');
            path1.setAttribute('clip-rule', 'evenodd');

            const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            if (!alreadyBookmarked) {
                path2.setAttribute('d', 'M8 4a.5.5 0 0 1 .5.5V6H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V7H6a.5.5 0 0 1 0-1h1.5V4.5A.5.5 0 0 1 8 4');
            } else {
                path2.setAttribute('d', 'M5.5 6.5A.5.5 0 0 1 6 6h4a.5.5 0 0 1 0 1H6a.5.5 0 0 1-.5-.5');
            }
            path2.setAttribute('stroke', 'white');
            path2.setAttribute('fill', 'none');
            path2.setAttribute('fill-rule', 'evenodd');
            path2.setAttribute('clip-rule', 'evenodd');

            svgIcon.appendChild(path1);
            svgIcon.appendChild(path2);
            iconContainer.appendChild(svgIcon);

            const buttonText = document.createElement('div');
            if (!alreadyBookmarked) {
                buttonText.textContent = 'Add to bookmarks';
            } else {
                buttonText.textContent = 'Remove from bookmarks';
            }

            bookmarkButton.appendChild(iconContainer);
            bookmarkButton.appendChild(buttonText);

            menuContainer.appendChild(bookmarkButton);

            bookmarkButton.addEventListener('click', () => {
                menuContainer.parentNode.removeChild(menuContainer);
                handleBookmarkEventHandler(id, title, alreadyBookmarked);
            });
        }
    };

    const treatOpenMessage = (value) => {
        const id = value.split('bookmark-')[1];

        window.open(`https://chatgpt.com/c/${id}`);
    }

    const treatRemoveMessage = async (value) => {
        await removeBookmarkFromStorage(value);
        const currentChatBookmarks = await PrivateMethods.getAll();

        return currentChatBookmarks;
    }

    /**
     * This observer reacts everytime the Options Menu pops up
     */
    const observer = new MutationObserver((mutationsList, observer) => {
        clearTimeout(debounceTimeout);

        debounceTimeout = setTimeout(async () => {
            // Identifiers for the Options Menu
            const menuContainer = document.querySelector('div[data-radix-menu-content][data-align="start"]');
            const shareButton = document.querySelector('[data-testid="share-chat-menu-item"]');
            const deleteButton = document.querySelector('[data-testid="delete-chat-menu-item"]');

            if (menuContainer && shareButton && deleteButton && !menuContainer.querySelector('.bookmark-button')) {
                console.log('Options Menu found.')

                const { id, title } = extractTheChatID();
                const bookmarkExists = await checkChatBookmarkExists(id);

                injectBookmarkButton(id, title, bookmarkExists);
            }
        }, 50);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        const { type, value } = message;

        console.log('type: ' + JSON.stringify(type))
        console.log('value: ' + JSON.stringify(value))

        // chrome.storage.sync.clear();

        if (type === 'OPEN' && value) {
            console.log('Received OPEN event');
            treatOpenMessage(value);
        } else if (type === 'REMOVE' && value) {
            console.log('Received REMOVE event');
            const resp = treatRemoveMessage(value);
            console.log(JSON.stringify(resp)) // TODO - fix this - currently {}
            sendResponse(resp);
        }
    });
})();