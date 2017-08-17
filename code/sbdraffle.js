var app = 'sbdraffle';
var records = new Array();
var pool = new Array();
var lastNumber = 0;
var updateHistoryId = -1;
var refreshId = -1;
var currentJackpot = 0;
var previousJackpot = 0;
var previousWinner = 'N/A';
var raffleTime = new Date(new Date().getUTCTime());
var winnerSelected = false;
var seed = 0;
var RAFFLE = 'sbdraffle';
var MEMO = 'RAFFLE';
var FEE_PERCENT = 10;

function raffleCountDown() {
   var countDown = 'NEXT DRAW: HH:MM:SS';
   var now = new Date(new Date().getUTCTime());

   countDown = countDown.replace('HH', (23 - now.getHours()).zeroPad());
   countDown = countDown.replace('MM', (59 - now.getMinutes()).zeroPad());
   countDown = countDown.replace('SS', (59 - now.getSeconds()).zeroPad());

   document.getElementById('nextDraw').innerHTML = countDown;

   if (winnerSelected && now.getHours() == 0 && now.getMinutes() == 0 && now.getSeconds() > 0) {
      winnerSelected = false;
   }
}

function start() {
   setRaffleTime();
   window.setInterval(raffleCountDown, 1000);
   steem.api.getAccountHistory(RAFFLE, Number.MAX_SAFE_INTEGER, 5000, function (err, result) {
      records = result;
      var l = Math.min(5000, result.length - 1);
      lastNumber = result[l][0];
      updateHistoryId = window.setInterval(updateHistory, 1000);
      examineTheDataId = window.setInterval(examineTheData, 1000);
      refreshId = window.setInterval(refresh, 1000);
   });
}

function updateHistory() {
   steem.api.getAccountHistory(RAFFLE, Number.MAX_SAFE_INTEGER, 2, function (err, result) {
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

function setRaffleTime() {
   steem.api.getDynamicGlobalProperties(function (e, r) {
      raffleTime = new Date(r.time);
      raffleTime.setHours(0);
      raffleTime.setMinutes(0);
      raffleTime.setSeconds(0);
   });
}

function refresh() {
   document.getElementById('previousJackpot').innerHTML = 'PREVIOUS JACKPOT: $' + previousJackpot.toFixed(2);
   document.getElementById('currentJackpot').innerHTML = '$' + currentJackpot.toFixed(2);
   document.getElementById('previousWinner').innerHTML = 'PREVIOUS WINNER: ' + previousWinner.toUpperCase();
}

function examineTheData() {
   currentJackpot = 0;
   for (i in records) {
      if (new Date(records[i][1].timestamp).getTime() >= raffleTime.getTime()) {
         if (records[i][1].op[0] == 'transfer') {
            if (records[i][1].op[1].to == RAFFLE) {
               var memo = records[i][1].op[1].memo;
               var amount = records[i][1].op[1].amount;
               if (amount.endsWith('SBD') && memo.toUpperCase().trim().startsWith(MEMO)) {
                  var amount = parseFloat(amount);
                  currentJackpot += amount - FEE_PERCENT * amount / 100;
               }
            } else if (records[i][1].op[1].to != RAFFLE) {
               var memo = records[i][1].op[1].memo;
               var amount = records[i][1].op[1].amount;
               if (memo.toUpperCase().startsWith('CONGRATULATIONS! YOU HAVE WON THE RAFFLE')) {
                  previousWinner = records[i][1].op[1].to;
                  previousJackpot = parseFloat(amount);
                  winnerSelected = true;
               }
            }
         }
      }
   }
   refresh();
   selectWinner();
}

function selectWinner() {
   if (winnerSelected) {
      return;
   }
   steem.api.getDynamicGlobalProperties(function (e, r) {
      var rightNow = r.time;
      var date = r.time;
      var date = date.split('T')[0] + 'T00:00:00';
      var seconds = ((new Date(rightNow)).getTime() - (new Date(date)).getTime()) / 1000;
      var block_number = r.head_block_number - seconds / 3 - 2;
      examineTheBlocks(block_number, date);
   });
}

function examineTheBlocks(block_number, date) {
   steem.api.getBlock(block_number, function (e, r) {
      if (r.timestamp >= date) {
         blockFound(r.transaction_ids[0], date);
      } else {
         examineTheBlocks(block_number + 1, date);
      }
   });
}

function blockFound(trxId, date) {
   seed = parseInt(trxId.substring(0, 10), 16);
   scanHistory(date);
}

function shuffle(array) {
   var currentIndex = array.length,
      temporaryValue, randomIndex;
   while (0 !== currentIndex) {
      randomIndex = Math.floor(customRand(seed) * currentIndex);
      currentIndex -= 1;

      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
   }

   return array;
}

function scanHistory(_until) {
   var _from = new Date(_until);
   pool = new Array();
   _from.setTime(_from.getTime() - 24 * 60 * 60 * 1000);
   _from = _from.getSteemString();
   previousJackpot = 0;
   for (r in records) {
      var timestamp = records[r][1].timestamp;
      if (timestamp >= _from && timestamp < _until) {
         if (records[r][1].op[0] == 'transfer') {
            if (records[r][1].op[1].to == RAFFLE) {
               var memo = records[r][1].op[1].memo;
               var amount = records[r][1].op[1].amount;
               if (amount.endsWith('SBD') && memo.toUpperCase().trim().startsWith(MEMO)) {
                  var amount = parseFloat(amount);
                  var points = Math.floor(amount / 0.100);
                  var player = records[r][1].op[1].from;

                  previousJackpot += amount - FEE_PERCENT * amount / 100;
                  if (memo.includes('@')) {
                     player = memo.split('@')[1].toLowerCase().trim();
                  }

                  for (p = 0; p < points; p++) {
                     pool.push(player);
                  }
               }
            }
         }
      }
   }

   if (pool.length > 0) {
      shuffle(pool);
      var wIndex = Math.floor(customRand(seed) * pool.length);
      previousWinner = pool[wIndex];
      winnerSelected = true;
   }
}
