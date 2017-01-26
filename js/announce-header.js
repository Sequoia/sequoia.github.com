/**
 * An announcement object
 * @typedef {Object} Announcement
 * @property {String} start - Start date (to be fed to Date constructor)
 * @property {String} end - End date (to be fed to Date constructor)
 * @property {String} html - html text of announcement
 */

fetch('/s/news.json')
  .then(response => response.json())
  .then(justActive)
  .then(showAnnouncements)
  .catch(console.error); // woops!!!!!!

/**
 * Filters announcements down to those with start before now (or no start)
 * and end after now
 * @param {Announcement[]} announcements
 * @return {Announcement[]}
 */
function justActive(announcements){
  var today = new Date().getTime();

  return announcements
    .filter(item => (new Date(item.start)).getTime() < today)
    .filter(item => (new Date(item.end)).getTime() > today);
}

/**
 * adds announcements to the news box & adds a class to make it visible
 * if no announcements, do nothing
 * @param {Announcement[]} announcements
 * @return null
 */
function showAnnouncements(announcements){
  if(announcements.length === 0) return;

  var newsList = document.getElementById('news-items');
  var announceHeader = document.getElementById('announce');

  //add items
  announcements
    .map(function makeListItems(item){
      var newsItem = document.createElement('li');
      newsItem.innerHTML = item.html;
      return newsItem;
    })
    .forEach(li => newsList.appendChild(li));

  announceHeader.classList.remove('hidden');
}