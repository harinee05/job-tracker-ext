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
            links.forEach(function (linkObject)
            {
                // Assuming each linkObject has a 'link' property
                csvContent += `${linkObject.link}\n`; // Access the 'link' property of the object
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
        // Create an object with the link and the current datetime
        const linkObject = {
            link: url,
            savedAt: new Date().toISOString() // Get the current datetime in ISO format
        };

        chrome.storage.sync.get('jobLinks', function (data)
        {
            const links = data.jobLinks || [];
            if (links.some(l => l.link == url))
            {
                alert('You already applied');
            }
            else
            {
                links.push(linkObject); // Save the object instead of just the link
                chrome.storage.sync.set({ jobLinks: links }, function ()
                {
                    console.log("Link saved with datetime:", linkObject.savedAt);
                    displayLinks(); // Refresh the list after saving
                });

            }
        });
    }

    function displayLinks()
    {
        linkList.innerHTML = ''; // Clear the current list
        chrome.storage.sync.get('jobLinks', function (data)
        {
            const links = data.jobLinks || []; // Retrieve the links from storage
            const totalJobsElement = document.getElementById('totalJobs');
            totalJobsElement.textContent = `Total Count of Jobs: ${links.length}`;

            const today = new Date().toISOString().split('T')[0];
            const todayJobs = links.filter(link => link.savedAt.split('T')[0] === today).length;
            document.getElementById('todayJobs').textContent = `Jobs Applied today: ${todayJobs}`;

            // Calculate the start index for displaying the last 5 links
            const startIndex = Math.max(0, links.length - 5);

            // Display only the last 5 links
            for (let i = startIndex; i < links.length; i++)
            {
                const linkObject = links[i];
                const listItem = document.createElement('div');
                listItem.classList.add("row");

                const linkDiv = document.createElement('div');
                linkDiv.classList.add("col-10");
                linkDiv.classList.add("linker");

                const editDiv = document.createElement('div');
                editDiv.classList.add("col");

                const delDiv = document.createElement('div');
                delDiv.classList.add("col");

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
                            index: i, // Use the current index in the loop
                            newLink: newLink
                        }, function (response)
                        {
                            console.log(response);
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
                        index: i // Use the current index in the loop
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

});