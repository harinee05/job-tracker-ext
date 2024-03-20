document.addEventListener('DOMContentLoaded', function ()
{
    chrome.runtime.sendMessage({ action: 'initializeJobLinks' }, function (response)
    {
        if (response && response.status === 'success')
        {
            console.log('jobLinks initialized');
            // Now you can use response.jobLinks to update your UI
        } else
        {
            console.error('Failed to initialize jobLinks:', response.message);
        }
    });
    const saveButton = document.getElementById('savejob');
    const linkList = document.getElementById('linkList');
    const exportCsvButton = document.getElementById('exportcsv');

    // Load saved links from storage
    console.log("1");
    displayLinks();

    // Save a job link when the button is clicked
    saveButton.addEventListener('click', function ()
    {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs)
        {
            const currentTabUrl = tabs[0].url;
            saveLink(currentTabUrl);
        });
    });

    // Export links to CSV
    exportCsvButton.addEventListener('click', function ()
    {
        chrome.storage.sync.get('jobLinks', function (data)
        {
            const links = data.jobLinks || [];
            let csvContent = "data:text/csv;charset=utf-8,";
            links.forEach(function (link)
            {
                csvContent += `${link}\n`;
            });
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "job_links.csv");
            document.body.appendChild(link); // Required for Firefox browser
            link.click(); // This will download the data file named "job_links.csv".
        });
    });


    function saveLink(url)
    {
        // Check if the URL is valid
        if (!url)
        {
            console.error('Invalid URL:', url);
            return;
        }

        // Create an object with the link and the current datetime
        const linkObject = {
            link: url,
            savedAt: new Date().toISOString() // Get the current datetime in ISO format
        };

        chrome.storage.sync.get('jobLinks', function (data)
        {
            const links = data.jobLinks || [];
            // Check if the linkObject is valid
            if (!linkObject.link || typeof linkObject.savedAt !== 'string')
            {
                console.error('Invalid linkObject:', linkObject);
                return;
            }
            // Check if the link already exists
            if (links.some(l => l && l.link === linkObject.link))
            {
                alert('You already applied');
            } else
            {
                links.push(linkObject); // Save the object instead of just the link
                chrome.storage.sync.set({
                    jobLinks: links
                }, function ()
                {
                    console.log("Link saved with datetime:", linkObject.savedAt);
                    displayLinks(); // Refresh the list after saving
                });
            }
        });
    }



    function displayLinks()
    {
        linkList.innerHTML = '';
        chrome.storage.sync.get('jobLinks', function (data)
        {
            const links = data.jobLinks || [];
            const totalJobsElement = document.getElementById('totalJobs');
            totalJobsElement.textContent = `Total Count of Jobs: ${links.length}`;

            // Your logic to count jobs applied today
            const today = new Date().toISOString().split('T')[0];
            const todayJobs = links.filter(link => link && link.savedAt && link.savedAt.split('T')[0] === today).length;
            document.getElementById('todayJobs').textContent = `Jobs Applied today: ${todayJobs}`;

            const startIndex = Math.max(0, links.length - 5);
            for (let i = startIndex - 1; i < links.length; i++)
            {
                const linkObject = links[i];
                if (!linkObject) continue; // Skip null or undefined objects

                const listItem = document.createElement('div');
                listItem.classList.add("row");

                const linkDiv = document.createElement('div');
                linkDiv.classList.add("col-10");
                linkDiv.classList.add("linker");

                const editDiv = document.createElement('div');
                editDiv.classList.add("col");

                const delDiv = document.createElement('div');
                delDiv.classList.add("col");

                // Access the link URL from the linkObject
                const linkElement = document.createElement('a');
                linkElement.href = linkObject.link;
                linkElement.textContent = linkObject.link;

                linkDiv.appendChild(linkElement);
                listItem.appendChild(linkDiv);

                // Add edit button
                const editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.addEventListener('click', function ()
                {
                    const newLink = prompt("Edit link:", linkObject.link);
                    if (newLink)
                    {
                        chrome.runtime.sendMessage({
                            action: 'editJobs',
                            type: 'edit',
                            index: i,
                            newLink: newLink
                        }, function (response)
                        {
                            console.log(response);
                            console.log("3");
                            displayLinks(); // Refresh the list after editing
                        });
                    }
                });
                editDiv.appendChild(editButton);
                listItem.appendChild(editDiv);

                // Add delete button
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', function ()
                {
                    chrome.runtime.sendMessage({
                        action: 'deleteJobs',
                        type: 'delete',
                        index: i
                    }, function (response)
                    {
                        console.log(response);

                        displayLinks(); // Refresh the list after deleting
                    });
                });
                delDiv.appendChild(deleteButton);
                listItem.appendChild(delDiv);

                linkList.appendChild(listItem);
            }
        });

    }
})

