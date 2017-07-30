Date.prototype.getUTCTime = function () {
   return this.getTime() + (this.getTimezoneOffset() * 60000);
};

var records = new Array();
var lastNumber = 0;
var refreshId = 0;
var drOtto = 'booster';
var updateHistoryId = -1;
var lastPostValue, lastUpvoteValue, lastUpvotePercent, lastFullUpvoteValue;
var interval, totalBids, totalLinks, indexA, indexB;
var result = 'Your bid can currently get you a _VOTEP_% upvote from _DROTTO_ worth approximately $_VOTEV_ SBD. Dr. Otto(_DROTTO_) is going to start voting in approximately <b>_TMIN_</b> minute(s). Good luck!';

function reset() {
   startLoading();
   drOtto = document.getElementById('drOttosAccount').value;
   records.splice(0, records.length);
   records = null;
   records = new Array();

   if (updateHistoryId != -1) {
      window.clearInterval(updateHistoryId);
   }
   if (refreshId != -1) {
      window.clearInterval(refreshId);
   }

   steem.api.getAccountHistory(drOtto, Number.MAX_SAFE_INTEGER, 1000, function (err, result) {
      if (result[1000][1].timestamp > '2017-08-25T12:00:00') {
         alert('Sorry... This version of the app has expired!');
      } else {
         records = result;
         lastNumber = result[1000][0];
         updateHistoryId = window.setInterval(updateHistory, 3000);
         examineDrOttosPower();

         refreshId = window.setInterval(refresh, 60 * 1000);
      }
   });
}

function updateHistory() {
   steem.api.getAccountHistory(drOtto, Number.MAX_SAFE_INTEGER, 2, function (err, result) {
      for (i in result) {
         if (result[i][0] <= lastNumber) {
            continue;
         } else {
            records.push(result[i]);
            lastNumber = result[i][0];
         }
      }
   });
}

function getAuthor(url) {
   if (url.includes('#')) {
      return url.split('#')[1].split('@')[1].split('/')[0];
   } else {
      return url.split('@')[1].split('/')[0];
   }
}

function getPermlink(url) {
   if (url.includes('#')) {
      return url.split('#')[1].split('@')[1].split('/')[1];
   } else {
      return url.split('@')[1].split('/')[1];
   }
}

function nextVoteInMinutes() {
   return interval - (new Date().getUTCTime() - new Date(records[indexA][1].timestamp).getTime()) / 60000;
}

function timediff(record1, record2) {
   var date1 = new Date(record1[1].timestamp);
   var date2 = new Date(record2[1].timestamp);
   return (date1.getTime() - date2.getTime()) / 60000;
}

function examinBids(i = records.length - 1) {
   if (i == 0) {
      displayData();
      return;
   }
   if (new Date(records[i][1].timestamp).getTime() > new Date(records[indexA][1].timestamp).getTime()) {
      if (records[i][1].op[0] == 'transfer' && records[i][1].op[1].to == drOtto) {
         var memo = records[i][1].op[1].memo;
         if (memo.startsWith('http')) {
            var author = getAuthor(memo);
            var permlink = getPermlink(memo);            
            steem.api.getDiscussionsByAuthorBeforeDate(author, permlink, '8080-01-01T00:00:00', 1, function (e, r) {
               if (r != null && r.length == 1 && permlink == r[0].permlink) {
                  if ((new Date().getUTCTime() - new Date(r[0].created).getTime()) / (1000 * 60) + nextVoteInMinutes() < (6.3 * 24 * 60)) {
                     if (r[0].active_votes.findIndex(v => v.voter === drOtto) == -1) {
                        totalBids += parseFloat(records[i][1].op[1].amount);
                        totalLinks++;
                        examinBids(i - 1);
                     } else {
                        examinBids(i - 1);
                     }
                  } else {
                     examinBids(i - 1);
                  }
               } else {
                  steem.api.getDiscussionsByComments({
                     start_author: author,
                     start_permlink: permlink,
                     limit: 1
                  }, function (e, r) {
                     if (r != null && r.length == 1 && permlink == r[0].permlink) {
                        if ((new Date().getUTCTime() - new Date(r[0].created).getTime()) / (1000 * 60) + nextVoteInMinutes() < (6.3 * 24 * 60)) {
                           if (r[0].active_votes.findIndex(v => v.voter === drOtto) == -1) {
                              totalBids += parseFloat(records[i][1].op[1].amount);
                              totalLinks++;
                              examinBids(i - 1);
                           } else {
                              examinBids(i - 1);
                           }
                        } else {
                           examinBids(i - 1);
                        }
                     } else {
                        examinBids(i - 1);
                     }
                  });
               }
            });
         } else {
            examinBids(i - 1);
         }
      } else {
         examinBids(i - 1);
      }
   } else {
      displayData();
   }
}

function examineDrOttosBids() {   
   totalBids = 0;
   totalLinks = 0;
   examinBids();
}

function startLoading() {
   removeData();
   document.getElementById('drOttosAccount').disabled = true;
   document.getElementById('btnReset').disabled = true;
   var loaders = document.getElementsByClassName('overlayLoader');
   for (m = 0; m < loaders.length; m++) {
      loaders[m].style.display = 'inline';
   }
}

function stopLoading() {
   document.getElementById('drOttosAccount').disabled = false;
   document.getElementById('btnReset').disabled = false;
   var loaders = document.getElementsByClassName('overlayLoader');
   for (m = 0; m < loaders.length; m++) {
      loaders[m].style.display = 'none';
   }
}

function examineDrOttosTimes() {
   var i1 = -1,
       i2 = -1,
       ii = -1;
   
   for (i = records.length - 1; i >= 0; i--) {
      if (records[i][1].op[0] == 'vote' && records[i][1].op[1].voter == drOtto) {
         var author = records[i][1].op[1].author;
         var permlink = records[i][1].op[1].permlink;
         if (records.findIndex(g => g[1].op[0] === 'transfer' && g[1].op[1].memo.endsWith('@' + author + '/' + permlink)) != -1) {
            if (ii == -1) {
               ii = i;
            } else {
               if (timediff(records[ii], records[i]) < 10) {
                  ii = i;
               } else {
                  if (i1 == -1) {
                     i1 = ii;
                     ii = i;
                  } else if (i2 == -1) {
                     i2 = ii;
                     break;
                  }
               }
            }
         }
      }
   }

   indexA = i1;
   indexB = i2;
   interval = timediff(records[i1], records[i2]);
   examineDrOttosBids();
}

function examineDrOttosPower() {
   for (i = records.length - 1; i >= 0; i--) {
      if (records[i][1].op[0] == 'vote' && records[i][1].op[1].voter == drOtto) {
         var author = records[i][1].op[1].author;
         var permlink = records[i][1].op[1].permlink;
         steem.api.getDiscussionsByAuthorBeforeDate(author, permlink, '8080-01-01T00:00:00', 1, function (e, r) {
            if (r != null && r.length == 1 && r[0].permlink == permlink) {
               lastPostValue = r[0].pending_payout_value;
               lastUpvoteValue = calculateVoteValue(r[0].active_votes, drOtto, parseFloat(lastPostValue));
               lastFullUpvoteValue = calculateFullVoteValue(lastUpvoteValue, lastUpvotePercent);
               examineDrOttosTimes();
            } else {
               steem.api.getDiscussionsByComments({
                  start_author: author,
                  start_permlink: permlink,
                  limit: 1
               }, function (e, r) {
                  if (r != null && r.length == 1 && r[0].permlink == permlink) {
                     lastPostValue = r[0].pending_payout_value;
                     lastUpvoteValue = calculateVoteValue(r[0].active_votes, drOtto, parseFloat(lastPostValue));
                     lastFullUpvoteValue = calculateFullVoteValue(lastUpvoteValue, lastUpvotePercent);
                     examineDrOttosTimes();
                  }
               });
            }
         });

         break;
      }
   }
}

function calculateVoteValue(votes, voter, total_value) {
   var voter_rshares, total_rshares = 0;
   for (v in votes) {
      var vote = votes[v];
      if (vote.voter == voter) {
         voter_rshares = parseInt(vote.rshares);
         lastUpvotePercent = vote.percent;
      }
      total_rshares += parseInt(vote.rshares);
   }

   return (voter_rshares * total_value / total_rshares);
}

function calculateFullVoteValue(vote_value, percent) {
   return vote_value * 10000 / percent;
}

function refresh() {
   examineDrOttosPower();
}

function calculateMyBidsValue() {
   var myBid = parseFloat(document.getElementById('yourBid').value);
   if (!Number.isNaN(myBid) && myBid > 0.001) {
      var myBidValue = myBid * lastFullUpvoteValue / (totalBids + myBid);
      var myBidPercent = myBid * 100 / (totalBids + myBid);
      var nextWindow = nextVoteInMinutes();

      var result_ = result;
      result_ = result_.replace('_VOTEP_', myBidPercent.toFixed(2));
      result_ = result_.replace('_VOTEV_', myBidValue.toFixed(2));
      result_ = result_.replace('_DROTTO_', drOtto);
      result_ = result_.replace('_DROTTO_', drOtto);
      result_ = result_.replace('_TMIN_', parseInt(nextWindow));

      document.getElementById('result').innerHTML = result_;
   } else {
      alert('Please enter a positive number.');
   }
}

function removeData() {
   document.getElementById('latestUpvoteValue').innerHTML = '';
   document.getElementById('latestUpvotePercent').innerHTML = '';
   document.getElementById('fullUpvoteValue').innerHTML = '';
   document.getElementById('votingInterval').innerHTML = '';
   document.getElementById('totalNumberOfBids').innerHTML = '';
   document.getElementById('totalAmountOfBids').innerHTML = '';
   document.getElementById('result').innerHTML = '';
}

function displayData() {
   stopLoading();
   document.getElementById('latestUpvoteValue').innerHTML = '$' + lastUpvoteValue.toFixed(2);
   document.getElementById('latestUpvotePercent').innerHTML = (lastUpvotePercent / 100).toFixed(2) + '%';
   document.getElementById('fullUpvoteValue').innerHTML = '$' + lastFullUpvoteValue.toFixed(2);
   document.getElementById('votingInterval').innerHTML = parseInt(interval);
   document.getElementById('totalNumberOfBids').innerHTML = totalLinks;
   document.getElementById('totalAmountOfBids').innerHTML = '$' + totalBids.toFixed(2);
   calculateMyBidsValue();
}