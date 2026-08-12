document.getElementById("export").onclick = async () => {

const [tab] = await chrome.tabs.query({
    active:true,
    currentWindow:true
});

chrome.tabs.sendMessage(tab.id,{
    action:"export"
});

};