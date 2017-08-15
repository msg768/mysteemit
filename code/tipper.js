var app = 'tipper';
var followers = new Array();
var followers_ = new Array();
var followers__ = new Array();
var lastOne = '0';
var chunk = 1000;
var myAccount = 'msg768';
var myMemo = 'TIPPER@github';
var myFee = 0.001 //Per Transaction
var totalFee = 0; //Total Fee
var feeFlag = false;

function appendHTML(html, resetFlag) {
   var div = document.createElement("div");
   div.innerHTML = html;

   if (resetFlag == null) {
      resetFlag = false;
   }
   if (resetFlag) {
      document.getElementById('result').innerHTML = "";
   }

   document.getElementById('result').appendChild(div);
   window.scrollTo(0, document.body.scrollHeight);
}


function checkAccountName(flag) {
   if (flag == null) {
      flag = false;
   }
   disableTransfer();
   var accountName = document.getElementById('accountName').value;
   steem.api.getAccounts([accountName], function (err, result) {
      if (result.length == 0) {
         var errorMessage = 'Not available!';
         document.getElementById('accountName_err').innerHTML = errorMessage;
         return false;
      } else {
         if (parseFloat(result[0].sbd_balance) < totalFee) {
            var errorMessage = 'Not enough SBD!';
            document.getElementById('accountName_err').innerHTML = errorMessage;
            document.getElementById('transfer').disabled = true;
            return false;
         } else {
            document.getElementById('accountName_err').innerHTML = '';
            if (flag && totalFee > myFee) {
               disableTransfer(false);
            }
            return true;
         }
      }
   });
}

function checkTipAmount() {
   disableTransfer();
   var tipAmount = document.getElementById('tipAmount').value;
   var errorMessage = '';
   document.getElementById('tipAmount_err').innerHTML = errorMessage;
   var reg = /^\d*[\.]\d*$/;
   var tip = parseFloat(tipAmount);
   if (!tipAmount.match(reg) || tip < 0.001 || tipAmount.split('.')[1].length > 3) {
      var errorMessage = 'Not valid!';
      document.getElementById('tipAmount_err').innerHTML = errorMessage;
      return false;
   } else {
      return true;
   }
}

function validate() {
   checkAccountName();
   checkActiveKey();
   checkTipAmount();
   checkInactiveHours();
   checkTipMessage();

   var elements = document.getElementsByClassName('error');
   for (e = 0; e < elements.length; e++) {
      if (elements[e].innerHTML != "") {
         return false;
      }
   }

   return true;
}

function calculateFee() {
   totalFee = myFee;
   if (validate()) {
      appendHTML("", true);
      disableAll(true);
      startLoading();
      var accountName = document.getElementById('accountName').value;
      getFollowers(accountName);
   }
}

function checkTipMessage() {
   var tipMessage = document.getElementById('tipMessage').value;
   var errorMessage = '';
   document.getElementById('tipMessage_err').innerHTML = errorMessage;
   if (tipMessage == null || tipMessage == '') {
      var errorMessage = 'Type something!';
      document.getElementById('tipMessage_err').innerHTML = errorMessage;
      return false;
   } else {
      return true;
   }
}

function checkInactiveHours() {
   disableTransfer();
   var inactiveHours = document.getElementById('inactiveHours').value;
   var errorMessage = '';
   document.getElementById('inactiveHours_err').innerHTML = errorMessage;
   var reg = /^[\d]\d*$/;
   var hours = parseInt(inactiveHours);
   if (!inactiveHours.match(reg) || hours < 1) {
      var errorMessage = 'Not valid!';
      document.getElementById('inactiveHours_err').innerHTML = errorMessage;
      return false;
   } else {
      return true;
   }
}

function checkActiveKey() {
   disableTransfer();
   var activeKey = document.getElementById('activeKey').value;
   var errorMessage = '';
   document.getElementById('activeKey_err').innerHTML = errorMessage;

   if (!steem.auth.isWif(activeKey)) {
      var errorMessage = 'False key!';
      document.getElementById('activeKey_err').innerHTML = errorMessage;
      return false;
   } else {
      var accountName = document.getElementById('accountName').value;
      steem.api.getAccounts([accountName], function (err, result) {
         if (result.length > 0) {
            var activeKey = document.getElementById('activeKey').value;
            var publicKey = result[0].active.key_auths[0][0];
            if (!steem.auth.wifIsValid(activeKey, publicKey)) {
               var errorMessage = 'Wrong key!';
               document.getElementById('activeKey_err').innerHTML = errorMessage;
               return false;
            }
         } else {
            return true;
         }
      });
   }
}

function addFollowers(following, fresult) {
   if (followers.length > 1) {
      fresult.shift();
   }
   followers = followers.concat(fresult);
   lastOne = followers[followers.length - 1].follower;
   if (fresult.length != 0) {
      queryFollowers(following);
   } else {
      for (f_ in followers) {
         followers_.push(followers[f_].follower);
      }

      removeInactiveFollowers();
   }
}

function queryFollowers(following) {
   steem.api.getFollowers(following, lastOne, 'blog', chunk, function (err, result) {
      addFollowers(following, result);
   });
}

function getFollowers(following) {
   followers = new Array();
   followers_ = new Array();
   followers__ = new Array();
   lastOne = '0';
   queryFollowers(following);
}

function removeInactiveFollowers() {
   //Remove Dead Followers
   steem.api.getAccounts(followers_, function (err, result) {
      for (r in result) {
         var follower = result[r];
         var lastActive = new Date(follower.last_post);
         var today = new Date();
         var hours = document.getElementById('inactiveHours').value;
         if ((today.getUTCTime() - lastActive.getTime()) / (1000 * 60 * 60) <= hours) {
            followers__.push(follower.name);
         }
      }

      onInactiveFollowersRemoved();
   });
}

function onInactiveFollowersRemoved() {
   var tipAmount = document.getElementById('tipAmount').value;
   var tip = parseFloat(parseFloat(tipAmount).toFixed(3));
   totalFee = followers__.length * (myFee + tip);
   checkAccountName(true);

   appendHTML('<b>Active Followers: </b>' + followers__.length, true);
   appendHTML('<b>Total Fee: </b>' + totalFee.toFixed(3) + ' SBD');
   stopLoading();
   disableAll(false);
}

function disableAll(flag) {
   if (flag == null) {
      flag = true;
   }
   document.getElementById('accountName').disabled = flag;
   document.getElementById('activeKey').disabled = flag;
   document.getElementById('tipAmount').disabled = flag;
   document.getElementById('inactiveHours').disabled = flag;
   document.getElementById('tipMessage').disabled = flag;
   document.getElementById('calculateFee').disabled = flag;

   if (flag) {
      document.getElementById('transfer').disabled = flag;
   }
}

function disableTransfer(flag) {
   if (flag == null) {
      flag = true;
   }
   document.getElementById('transfer').disabled = flag;
}

var barId = 0;

function startLoading(milliseconds) {
   if (milliseconds == null) {
      milliseconds = true;
   }
   document.getElementById('status').innerHTML = 'PLEASE WAIT';
   barId = window.setInterval(loadBar, milliseconds);
}

function stopLoading(message) {
   if (message == null) {
      message = '';
   }
   window.clearInterval(barId);
   document.getElementById('status').innerHTML = message;
   document.getElementById('bar').innerHTML = '';
}

function loadBar() {
   var barValue = document.getElementById('bar').innerHTML;
   if (barValue.length == 3) {
      barValue = '';
   } else {
      barValue += '.';
   }

   document.getElementById('bar').innerHTML = barValue;
}

function transferTheTips() {
   var myFee_ = (followers__.length * myFee).toFixed(3) + " SBD";
   var confirm_ = confirm("This is a clientside application, which means if you close this window, the application will stop without completeing all the transactions. The first transaction will be @msg768's fee which is " + myFee_ + ". All transfers are non-refundable. Are you sure you want to continue?");

   if (confirm_) {
      disableAll();
      startLoading();

      var activeKey = document.getElementById('activeKey').value;
      var accountName = document.getElementById('accountName').value;

      appendHTML("<BR />");
      steem.broadcast.transfer(activeKey, accountName, myAccount, myFee_, myMemo, function (err, result) {
         if (err == null) {
            appendHTML("Transfered " + myFee_ + " To @msg768.");
            var activeKey = document.getElementById('activeKey').value;
            var accountName = document.getElementById('accountName').value;
            var tipMessage = document.getElementById('tipMessage').value;
            var tipAmount = document.getElementById('tipAmount').value;
            tipAmount = parseFloat(tipAmount).toFixed(3) + " SBD";
            bulkTransfer(accountName, activeKey, tipAmount, tipMessage);
         } else {
            appendHTML("Transfering " + myFee_ + " To @msg768 Failed.");
            disableAll(false);
            console.log(err);
            stopLoading();
         }
      });
   }
}

function bulkTransfer(accountName, activeKey, tipAmount, tipMessage, index) {
   if (index == null) {
      index = 0;
   }
   if (index == followers__.length) {
      appendHTML("<BR />");
      appendHTML("ALL DONE! :]");
      stopLoading();
      return;
   } else {
      steem.broadcast.transfer(activeKey, accountName, followers__[index], tipAmount, tipMessage, function (err, result) {
         if (err == null) {
            appendHTML("Transfered " + tipAmount + " To @" + followers__[index] + ".");
         } else {
            followers__.push(followers__[index]);
            appendHTML("Transfering " + tipAmount + " To @" + followers__[index] + " Failed. Will try this transaction again a bit later.");
            console.log(err);
         }
         bulkTransfer(accountName, activeKey, tipAmount, tipMessage, index + 1);
      });
   }
}
