document.addEventListener('DOMContentLoaded', function ()
{
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
            document.body.appendChild(link); // Required for Firefox
            link.click(); // This will download the data file named "job_links.csv".
        });
    });

    // function saveLink(url)
    // {
    //     chrome.storage.sync.get('jobLinks', function (data)
    //     {
    //         const links = data.jobLinks || [];
    //         links.push(url);
    //         chrome.storage.sync.set({ jobLinks: links }, function ()
    //         {
    //             console.log("2");
    //             displayLinks(); // Refresh the list after saving
    //         });
    //     });
    // }

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
    // function displayLinks()
    // {

    //     linkList.innerHTML = '';

    //     chrome.storage.sync.get('jobLinks', function (data)
    //     {
    //         const links = data.jobLinks || [];
    //         const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    //         const totalJobsElement = document.getElementById('totalJobs');
    //         totalJobsElement.textContent = links.length; // Update the totalJobs element

    //         const todayJobs = links.filter(linkObject => linkObject.savedAt.split(' ')[0] === today).length;
    //         console.log(todayJobs);
    //         document.getElementById('todayJobs').textContent = todayJobs;
    //         links.forEach(function (linkObject, index)
    //         {
    //             const listItem = document.createElement('div');
    //             listItem.classList.add("row");

    //             const linkDiv = document.createElement('div');
    //             linkDiv.classList.add("col-10");
    //             linkDiv.classList.add("linker");

    //             const editDiv = document.createElement('div');
    //             editDiv.classList.add("col");

    //             const delDiv = document.createElement('div');
    //             delDiv.classList.add("col");

    //             // Access the link URL from the linkObject
    //             const linkElement = document.createElement('a');
    //             linkElement.href = linkObject.link;
    //             linkElement.textContent = linkObject.link;

    //             linkDiv.appendChild(linkElement);
    //             listItem.appendChild(linkDiv);

    //             // Add edit button
    //             const editButton = document.createElement('button');
    //             editButton.textContent = 'Edit';
    //             editButton.addEventListener('click', function ()
    //             {
    //                 const newLink = prompt("Edit link:", linkObject.link);
    //                 if (newLink)
    //                 {
    //                     chrome.runtime.sendMessage({
    //                         action: 'editJobs',
    //                         type: 'edit',
    //                         index: index,
    //                         newLink: newLink
    //                     }, function (response)
    //                     {
    //                         console.log(response);
    //                         console.log("3");
    //                         displayLinks(); // Refresh the list after editing
    //                     });
    //                 }
    //             });
    //             editDiv.appendChild(editButton);
    //             listItem.appendChild(editDiv);

    //             // Add delete button
    //             const deleteButton = document.createElement('button');
    //             deleteButton.textContent = 'Delete';
    //             deleteButton.addEventListener('click', function ()
    //             {
    //                 chrome.runtime.sendMessage({
    //                     action: 'deleteJobs',
    //                     type: 'delete',
    //                     index: index
    //                 }, function (response)
    //                 {
    //                     console.log(response);
    //                     console.log("4");
    //                     displayLinks(); // Refresh the list after deleting
    //                 });
    //             });
    //             delDiv.appendChild(deleteButton);
    //             listItem.appendChild(delDiv);

    //             linkList.appendChild(listItem);
    //         });
    //     });
    // }
    function displayLinks()
    {
        linkList.innerHTML = '';

        chrome.storage.sync.get('jobLinks', function (data)
        {
            const links = data.jobLinks || [];
            const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

            const totalJobsElement = document.getElementById('totalJobs');
            totalJobsElement.textContent = links.length; // Update the totalJobs element

            // Filter job links based on the saved date
            const todayJobs = links.filter(linkObject => linkObject.savedAt.split(' ')[0] === today).length;
            document.getElementById('todayJobs').textContent = todayJobs;

            links.forEach(function (linkObject, index)
            {
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
                            index: index,
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
                        index: index
                    }, function (response)
                    {
                        console.log(response);
                        console.log("4");
                        displayLinks(); // Refresh the list after deleting
                    });
                });
                delDiv.appendChild(deleteButton);
                listItem.appendChild(delDiv);

                linkList.appendChild(listItem);
            });
        });
    }



});
