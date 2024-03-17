// contentScript.js

// Example: Extract job links from the webpage
const jobLinks = Array.from(document.querySelectorAll('a'))
    .filter(link => link.href.includes('job')) // Adjust the filter condition based on how job links are identified
    .map(link => link.href);

// Send the job links to the background script
chrome.runtime.sendMessage({ action: 'saveJobLinks', jobLinks: jobLinks });
