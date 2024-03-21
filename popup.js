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
            const links = data.jobLinks || []; // Ensure links is an array
            let csvContent = "data:text/csv;charset=utf-8,";
            links.forEach(function (linkObject)
            {
                // Check if linkObject is not null and has a 'link' property
                if (linkObject && 'link' in linkObject)
                {
                    csvContent += `${linkObject.link}\n`; // Access the 'link' property of the object
                } else
                {
                    console.error('Invalid link object:', linkObject);
                }
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
        }
        )
    };


    function displayLinks()
    {
        const linkList = document.getElementById('linkList');
        linkList.innerHTML = ''; // Clear the list before adding new items

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
            for (let i = startIndex; i < links.length; i++)
            {
                const linkObject = links[i];
                if (!linkObject) continue; // Skip null or undefined objects

                // Create a row for each job link
                const listItem = document.createElement('div');
                listItem.classList.add("row");

                // Add checkbox
                const checkboxDiv = document.createElement('div');
                checkboxDiv.classList.add("col");
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.addEventListener('change', function ()
                {
                    // Handle checkbox change event
                    console.log('Checkbox checked:', checkbox.checked);
                    // Implement your logic here
                    if (checkbox.checked)
                    {
                        linkElement.classList.add('strikethrough');
                    } else
                    {
                        linkElement.classList.remove('strikethrough');
                    }
                });
                checkboxDiv.appendChild(checkbox); // Append checkbox to checkboxDiv
                listItem.appendChild(checkboxDiv); // Append checkboxDiv to listItem

                // Add link
                const linkDiv = document.createElement('div');
                linkDiv.classList.add("col-10");
                linkDiv.classList.add("linker");
                const linkElement = document.createElement('a');
                linkElement.href = linkObject.link;
                linkElement.textContent = linkObject.link;
                linkDiv.appendChild(linkElement);
                listItem.appendChild(linkDiv); // Append linkDiv to listItem

                // Add delete button
                const delDiv = document.createElement('div');
                delDiv.classList.add("col");
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
                listItem.appendChild(delDiv); // Append delDiv to listItem

                linkList.appendChild(listItem); // Append listItem to linkList
            }
        });
    }

});