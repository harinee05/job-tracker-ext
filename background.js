let jobLinks = [];

// Function to initialize jobLinks from storage, returning a promise
function initializeJobLinks()
{
    return new Promise((resolve) =>
    {
        chrome.storage.sync.get(['jobLinks'], (result) =>
        {
            jobLinks = result.jobLinks || []; // Initialize jobLinks from storage

            resolve(jobLinks); // Resolve the promise after jobLinks is initialized
        });
    });
}

function updateJobLinks(index, newLink)
{
    return new Promise((resolve, reject) =>
    {
        chrome.storage.sync.get(['jobLinks'], (result) =>
        {
            let links = result.jobLinks || [];
            if (index >= 0 && index < links.length)
            {
                links[index] = newLink;
                chrome.storage.sync.set({ jobLinks: links }, () =>
                {
                    console.log('Job links updated.');
                    resolve({ status: "success" });
                });
            } else
            {
                reject({ status: "error", message: "Invalid index" });
            }
        });
    });
}

function deleteJobLink(index)
{
    return new Promise((resolve, reject) =>
    {
        chrome.storage.sync.get(['jobLinks'], (result) =>
        {
            let links = result.jobLinks || [];
            if (index >= 0)
            {
                links.splice(index, 1);
                chrome.storage.sync.set({ jobLinks: links }, () =>
                {
                    console.log('Job link deleted.');
                    resolve({ status: "success" });
                });
            } else
            {
                reject({ status: "error", message: "Invalid index" });
            }
        });
    });
}

// Initialize jobLinks at the start of the script
initializeJobLinks().then(() =>
{
    console.log('jobLinks initialized');
}).catch(error =>
{
    console.error('Failed to initialize jobLinks:', error);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) =>
{
    if (request.action === 'editJobs')
    {
        updateJobLinks(request.index, request.newLink)
            .then(response => sendResponse(response))
            .catch(error => sendResponse(error));
        return true; // Indicates that the response will be sent asynchronously
    }

    if (request.action === 'deleteJobs')
    {
        deleteJobLink(request.index)
            .then(response => sendResponse(response))
            .catch(error => sendResponse(error));
        return true; // Indicates that the response will be sent asynchronously
    }
});
